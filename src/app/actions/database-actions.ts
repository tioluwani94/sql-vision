// src/app/actions/database-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";
import { executeQuery } from "@/lib/db-connection";
import {
  generateSQLFromNaturalLanguage,
  generateChartConfiguration,
} from "@/lib/nl-to-sql";
import { z } from "zod";
import { auth } from "@/lib/auth";

// Schema validation
const databaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["postgresql", "mysql"]),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  dbName: z.string().min(1, "Database name is required"),
  ssl: z.boolean().default(false),
});

export async function addDatabase(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to perform this action");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    type: formData.get("type") as string,
    host: formData.get("host") as string,
    port: Number(formData.get("port")),
    username: formData.get("username") as string,
    password: formData.get("password") as string,
    dbName: formData.get("dbName") as string,
    ssl: formData.get("ssl") === "on",
  };

  // Validate form data
  const validationResult = databaseSchema.safeParse(rawData);

  if (!validationResult.success) {
    throw new Error(validationResult.error.errors[0].message);
  }

  const validData = validationResult.data;

  // Encrypt the password before storing
  const encryptedPassword = encrypt(validData.password);

  // Test connection before saving
  try {
    const testDb = {
      ...validData,
      id: "test",
      userId: user.id,
      password: encryptedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await executeQuery(testDb, "SELECT 1");
  } catch (error) {
    console.error("Connection test failed:", error);
    throw new Error(
      "Failed to connect to the database. Please check your credentials."
    );
  }

  // Save to database
  await prisma.database.create({
    data: {
      name: validData.name,
      description: validData.description,
      type: validData.type,
      host: validData.host,
      port: validData.port,
      username: validData.username,
      password: encryptedPassword,
      dbName: validData.dbName,
      ssl: validData.ssl,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteDatabase(id: string) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to perform this action");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Verify ownership
  const database = await prisma.database.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!database) {
    throw new Error(
      "Database not found or you don't have permission to delete it"
    );
  }

  await prisma.database.delete({
    where: { id },
  });

  revalidatePath("/dashboard");
}

// For executing natural language queries
export async function executeNaturalLanguageQuery(
  databaseId: string,
  naturalLanguageQuery: string
) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to perform this action");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get database
  const database = await prisma.database.findFirst({
    where: {
      id: databaseId,
      userId: user.id,
    },
  });

  if (!database) {
    throw new Error(
      "Database not found or you don't have permission to access it"
    );
  }

  try {
    // Rate limiting for queries - prevent abuse
    // Check if user has exceeded query limit in a time window
    const recentQueriesCount = await prisma.query.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
    });

    const QUERY_LIMIT_PER_5_MINUTES = 20;
    if (recentQueriesCount >= QUERY_LIMIT_PER_5_MINUTES) {
      throw new Error("Query rate limit exceeded. Please try again later.");
    }

    // Convert natural language to SQL with security validations
    const { sqlQuery, explanation } = await generateSQLFromNaturalLanguage(
      naturalLanguageQuery,
      database,
      user.id // Pass user ID for security logging
    );

    // Clean the SQL query to ensure no markdown formatting remains
    const cleanedSqlQuery = sqlQuery
      .replace(/^```(sql)?\s*\n/m, "")
      .replace(/\n```\s*$/m, "")
      .replace(/^```(sql)?/m, "")
      .replace(/```$/m, "")
      .trim();

    // Execute the generated SQL query with additional timeout protection
    const queryResult = await executeQuery(database, cleanedSqlQuery);

    if (queryResult.error) {
      throw new Error(`Query execution failed: ${queryResult.error}`);
    }

    // Limit result size to prevent memory issues
    const MAX_RESULT_SIZE = 1000;
    const limitedRows = queryResult.rows.slice(0, MAX_RESULT_SIZE);

    if (queryResult.rows.length > MAX_RESULT_SIZE) {
      console.warn(
        `Query result truncated for user ${user.id}. Original size: ${queryResult.rows.length}`
      );
    }

    // Generate chart configuration
    const chartConfig = await generateChartConfiguration(
      limitedRows,
      naturalLanguageQuery
    );

    // Make sure chartConfig is valid before saving
    if (
      chartConfig &&
      chartConfig.valueKeys &&
      chartConfig.valueKeys.some(
        (key: any) => key === undefined || key === null
      )
    ) {
      // Fix the valueKeys if they contain any undefined/null values
      const columns = Object.keys(limitedRows[0] || {});
      chartConfig.valueKeys = columns.filter(
        (col) => col !== chartConfig.dataKey
      );

      // If there are no valueKeys, use the first column
      if (chartConfig.valueKeys.length === 0 && columns.length > 0) {
        chartConfig.valueKeys = [columns[0]];
      }
    }

    // Save the query to history
    const savedQuery = await prisma.query.create({
      data: {
        naturalText: naturalLanguageQuery,
        sqlQuery,
        explanation,
        result: limitedRows as any,
        chartConfig,
        userId: user.id,
        databaseId,
      },
    });

    return {
      id: savedQuery.id,
      sqlQuery,
      explanation,
      result: {
        columns: queryResult.columns,
        rows: limitedRows,
        truncated: queryResult.rows.length > MAX_RESULT_SIZE,
      },
      chartConfig,
    };
  } catch (error) {
    // Log security-related errors with more details
    if (error instanceof Error && error.message.includes("unsafe")) {
      console.error(`Security alert - User ${user.id} query attempt:`, {
        userId: user.id,
        databaseId,
        naturalLanguageQuery,
        error: error.message,
        timestamp: new Date(),
      });
    } else {
      console.error("Error in natural language query:", error);
    }

    throw error;
  }
}

export async function getQueryHistory(databaseId?: string) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to perform this action");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const whereClause = {
    userId: user.id,
    ...(databaseId ? { databaseId } : {}),
  };

  const queries = await prisma.query.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      database: {
        select: {
          name: true,
        },
      },
    },
  });

  return queries;
}

export async function getQueryById(id: string) {
  const session = await auth();

  if (!session?.user?.email) {
    throw new Error("You must be logged in to perform this action");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const query = await prisma.query.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      database: true,
    },
  });

  if (!query) {
    throw new Error(
      "Query not found or you don't have permission to access it"
    );
  }

  return query;
}
