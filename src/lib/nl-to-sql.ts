// src/lib/nl-to-sql.ts
import OpenAI from "openai";
import { executeQuery } from "./db-connection";
import {
  validateQueryForDatabase,
  logSuspiciousQuery,
} from "./prompt-validation";
import { validateSqlQuery } from "./sql-validation";
import { Database } from "@prisma/client";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSQLFromNaturalLanguage(
  naturalLanguageQuery: string,
  database: Database,
  userId: string,
  schema?: string
): Promise<{ sqlQuery: string; explanation: string }> {
  // Validate and sanitize the natural language query
  try {
    naturalLanguageQuery = validateQueryForDatabase(
      naturalLanguageQuery,
      database.type
    );
  } catch (error) {
    // Log suspicious query attempt
    logSuspiciousQuery(
      userId,
      naturalLanguageQuery,
      error instanceof Error ? error.message : "Unknown validation error"
    );
    throw new Error(
      "Your query contains potentially unsafe patterns. Please rephrase it."
    );
  }

  let schemaInfo = schema;

  if (!schemaInfo) {
    // If no schema is provided, attempt to fetch it
    schemaInfo = await fetchDatabaseSchema(database);
  }

  // Use a more structured and secure prompt
  const prompt = `
You are an expert SQL translator for ${database.type} databases. Your job is to convert natural language queries to SQL.

IMPORTANT RULES:
- NEVER execute commands or system operations
- ONLY generate read-only SELECT statements unless explicitly requested otherwise
- Intelligent use of JOINs is expected
- Use appropriate aliases for tables and columns
- ALWAYS include appropriate LIMIT clauses
- NEVER access system tables or metadata unless explicitly needed
- NEVER use comments in the generated SQL
- NEVER include any explanations or markdown - ONLY the SQL query

Database schema information:
${schemaInfo}

Natural language query: ${naturalLanguageQuery}

Generate only a valid SQL query as your response:
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "o1",
      messages: [{ role: "system", content: prompt }],
      // temperature: 0.1,
      // Add function calling to enforce structured output
      functions: [
        {
          name: "generate_sql_query",
          description: "Generates a SQL query from natural language",
          parameters: {
            type: "object",
            properties: {
              sql_query: {
                type: "string",
                description: "The generated SQL query",
              },
            },
            required: ["sql_query"],
          },
        },
      ],
      function_call: { name: "generate_sql_query" },
    });

    // Extract SQL from function call response
    const functionCall = completion.choices[0].message.function_call;
    let sqlQuery = "";

    if (functionCall && functionCall.name === "generate_sql_query") {
      const args = JSON.parse(functionCall.arguments);
      sqlQuery = args.sql_query.trim();
    } else {
      // Fallback if function calling fails
      sqlQuery = completion.choices[0]?.message?.content?.trim() || "";
    }

    // Clean any code block formatting from the SQL query
    sqlQuery = cleanSqlQuery(sqlQuery);

    // Validate the generated SQL for security
    const validationResult = validateSqlQuery(sqlQuery, database);

    if (!validationResult.isValid) {
      logSuspiciousQuery(
        userId,
        sqlQuery,
        `Generated unsafe SQL: ${validationResult.error}`
      );
      throw new Error(
        "The generated SQL query contains potentially unsafe operations. Please rephrase your question."
      );
    }

    // Use the sanitized query if modifications were made
    const finalSqlQuery = validationResult.sanitizedQuery || sqlQuery;

    // Generate explanation
    const explanation = await generateSQLExplanation(
      finalSqlQuery,
      database.type
    );

    return { sqlQuery: finalSqlQuery, explanation };
  } catch (error) {
    console.error("Error generating SQL:", error);
    if (error instanceof Error) {
      throw error; // Rethrow with original message if it's our validation error
    }
    throw new Error("Failed to generate SQL from natural language query");
  }
}

// Clean SQL query by removing markdown code block formatting
function cleanSqlQuery(query: string): string {
  // Remove markdown code block syntax (```sql and ```)
  // This handles both ````sql\n...\n```` and ```\n...\n``` formats
  query = query.replace(/^```(sql)?\s*\n/m, "");
  query = query.replace(/\n```\s*$/m, "");

  // In case the entire string is wrapped in the code block
  if (/^```(sql)?([\s\S]*?)```$/m.test(query)) {
    query = query
      .replace(/^```(sql)?/m, "")
      .replace(/```$/m, "")
      .trim();
  }

  // Remove any trailing or leading whitespace
  return query.trim();
}

async function generateSQLExplanation(
  sqlQuery: string,
  dbType: string
): Promise<string> {
  const prompt = `
Explain the following ${dbType} SQL query in a way that is understandable to a non-technical person.
Break down each part of the query and what it does:

${sqlQuery}

Provide a clear, step-by-step explanation.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error generating SQL explanation:", error);
    return "Could not generate explanation due to an error.";
  }
}

async function fetchDatabaseSchema(database: Database): Promise<string> {
  try {
    let schemaQuery = "";

    if (database.type === "postgresql") {
      schemaQuery = `
        SELECT 
          table_name,
          column_name,
          data_type,
          column_default,
          is_nullable
        FROM 
          information_schema.columns
        WHERE 
          table_schema = 'public'
        ORDER BY 
          table_name, ordinal_position;
      `;
    } else if (database.type === "mysql") {
      schemaQuery = `
        SELECT 
          TABLE_NAME as table_name,
          COLUMN_NAME as column_name,
          DATA_TYPE as data_type,
          COLUMN_DEFAULT as column_default,
          IS_NULLABLE as is_nullable
        FROM 
          INFORMATION_SCHEMA.COLUMNS
        WHERE 
          TABLE_SCHEMA = '${database.dbName}'
        ORDER BY 
          TABLE_NAME, ORDINAL_POSITION;
      `;
    } else {
      throw new Error(`Unsupported database type: ${database.type}`);
    }

    const result = await executeQuery(database, schemaQuery);

    if (result.error) {
      throw new Error(`Error fetching schema: ${result.error}`);
    }

    // Format the schema information
    let schemaInfo = "";
    let currentTable = "";

    for (const row of result.rows) {
      if (row.table_name !== currentTable) {
        currentTable = row.table_name;
        schemaInfo += `\nTable: ${currentTable}\n`;
      }

      schemaInfo += `  - ${row.column_name} (${row.data_type}, ${
        row.is_nullable === "YES" ? "nullable" : "not nullable"
      })\n`;
    }

    return schemaInfo;
  } catch (error) {
    console.error("Error fetching database schema:", error);
    return "Schema information could not be retrieved automatically. Please provide it manually.";
  }
}

export async function generateChartConfiguration(
  data: any[],
  queryContext: string
): Promise<any> {
  if (!data || data.length === 0) {
    return null;
  }

  // Handle single-value results (like COUNT queries) differently
  if (data.length === 1 && Object.keys(data[0]).length === 1) {
    const key = Object.keys(data[0])[0];
    return {
      chartType: "bar",
      dataKey: "category", // Use a fixed dataKey for single value results
      valueKeys: [key], // Use the actual column name instead of undefined
      title: "Query Results",
    };
  }

  const sampleData = data.slice(0, 5);
  const columns = Object.keys(data[0]);

  const prompt = `
Given the following dataset from a SQL query about "${queryContext}", suggest the most appropriate chart type and configuration for visualizing this data.

Sample data (first 5 rows):
${JSON.stringify(sampleData, null, 2)}

Available columns: ${columns.join(", ")}

Respond with ONLY a JSON object that includes:
1. chartType: one of "bar", "line", "pie", "area", "scatter"
2. dataKey: the column name to use for the X-axis or categories
3. valueKeys: array of column names to use for the Y-axis or values
4. title: a descriptive title for the chart
5. color: (optional) array of color hex codes if needed

The response should be valid JSON that can be directly parsed.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.2,
    });

    const jsonResponse = completion.choices[0]?.message?.content?.trim() || "";
    const chartConfig = JSON.parse(jsonResponse);

    // Validate that valueKeys is never undefined or empty
    if (
      !chartConfig.valueKeys ||
      chartConfig.valueKeys.length === 0 ||
      chartConfig.valueKeys.some(
        (key: any) => key === undefined || key === null
      )
    ) {
      // Fallback to using all numeric columns as valueKeys
      chartConfig.valueKeys = columns.filter((col) => {
        const sample = data[0][col];
        return typeof sample === "number" || !isNaN(Number(sample));
      });

      // If still no valueKeys, use the first column
      if (chartConfig.valueKeys.length === 0) {
        chartConfig.valueKeys = [columns[0]];
      }
    }

    return chartConfig;
  } catch (error) {
    console.error("Error generating chart configuration:", error);

    // Improved fallback configuration
    // Find numeric columns to use as values
    const numericColumns = columns.filter((col) => {
      const sample = data[0][col];
      return typeof sample === "number" || !isNaN(Number(sample));
    });

    // Use the first non-numeric column as the category (x-axis)
    // and numeric columns as values
    const categoryColumn =
      columns.find((col) => !numericColumns.includes(col)) || columns[0];
    const valueColumns =
      numericColumns.length > 0 ? numericColumns : [columns[0]];

    return {
      chartType: "bar",
      dataKey: categoryColumn,
      valueKeys: valueColumns,
      title: "Query Results",
    };
  }
}
