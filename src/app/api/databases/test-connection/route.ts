// src/app/api/databases/test-connection/route.ts
import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { executeQuery } from "@/lib/db-connection";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiter for testing connections - 10 attempts per IP per minute
const testConnectionLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 10, // 10 requests per interval
});

// Schema validation
const testConnectionSchema = z.object({
  type: z.enum(["postgresql", "mysql"]),
  host: z.string().min(1, "Host is required"),
  port: z.coerce.number().int().positive(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  dbName: z.string().min(1, "Database name is required"),
  // ssl: z
  //   .union([z.boolean(), z.enum(["on"])])
  //   .transform((val) => val === true || val === "on"),
  // useSSH: z
  //   .union([z.boolean(), z.enum(["on", "true"])])
  //   .transform((val) => val === true || val === "on" || val === "true"),
  sshHost: z.string().optional(),
  sshPort: z.coerce.number().int().positive().optional(),
  sshUsername: z.string().optional(),
  sshPassword: z.string().optional(),
  sshPrivateKey: z.string().optional(),
  sshPassphrase: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const xForwardedFor = req.headers.get("x-forwarded-for");
    const cfConnectingIP = req.headers.get("cf-connecting-ip");

    const xForwardedForIP = xForwardedFor?.split(",")[0];
    const ip = cfConnectingIP ?? xForwardedForIP ?? "127.0.0.1";

    // Apply rate limiting based on user ID or IP
    const identifier = session.user.email || ip || "unknown";

    try {
      await testConnectionLimiter.check(identifier);
    } catch {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const rawData: Record<string, any> = {};

    // Convert FormData to object
    for (const [key, value] of formData.entries()) {
      rawData[key] = value;
    }

    // Validate form data
    const validationResult = testConnectionSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validData = validationResult.data;

    // Check SSH data requirements
    if (validData.useSSH) {
      if (!validData.sshHost) {
        return NextResponse.json(
          { message: "SSH Host is required when using SSH tunnel" },
          { status: 400 }
        );
      }
      if (!validData.sshUsername) {
        return NextResponse.json(
          { message: "SSH Username is required when using SSH tunnel" },
          { status: 400 }
        );
      }
      if (!validData.sshPassword && !validData.sshPrivateKey) {
        return NextResponse.json(
          {
            message:
              "Either SSH Password or Private Key is required for SSH authentication",
          },
          { status: 400 }
        );
      }
    }

    // Encrypt sensitive data
    const encryptedPassword = encrypt(validData.password);
    const encryptedSshPassword = validData.sshPassword
      ? encrypt(validData.sshPassword)
      : undefined;
    const encryptedSshPrivateKey = validData.sshPrivateKey
      ? encrypt(validData.sshPrivateKey)
      : undefined;
    const encryptedSshPassphrase = validData.sshPassphrase
      ? encrypt(validData.sshPassphrase)
      : undefined;

    // Create test database object
    const testDb = {
      id: "test-connection",
      name: "Test Connection",
      description: "Test Connection",
      type: validData.type,
      host: validData.host,
      port: validData.port,
      username: validData.username,
      password: encryptedPassword,
      dbName: validData.dbName,
      ssl: validData.ssl,
      useSSH: validData.useSSH,
      sshHost: validData.sshHost,
      sshPort: validData.sshPort,
      sshUsername: validData.sshUsername,
      sshPassword: encryptedSshPassword,
      sshPrivateKey: encryptedSshPrivateKey,
      sshPassphrase: encryptedSshPassphrase,
      userId: session.user.id || "test-user",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Test connection
    const result = await executeQuery(testDb, "SELECT 1 AS test");

    if (result.error) {
      return NextResponse.json(
        { message: `Connection failed: ${result.error}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Connection successful",
        result: result.rows,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error testing connection:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
