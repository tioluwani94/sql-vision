// src/app/api/databases/test-ssh/route.ts
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { testSSHConnection } from "@/lib/test-ssh";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiter for testing SSH connections - 10 attempts per IP per minute
const testSSHLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 10, // 10 requests per interval
});

// Schema validation for SSH connection testing
const testSSHSchema = z.object({
  sshHost: z.string().min(1, "SSH Host is required"),
  sshPort: z.coerce.number().int().positive().default(22),
  sshUsername: z.string().min(1, "SSH Username is required"),
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
      await testSSHLimiter.check(identifier);
    } catch {
      return NextResponse.json(
        { message: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const rawData: Record<string, any> = {};

    // Convert FormData to object, focusing only on SSH-related fields
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("ssh")) {
        rawData[key] = value;
      }
    }

    // Check if SSH is enabled
    const useSSH =
      formData.get("useSSH") === "true" || formData.get("useSSH") === "on";

    if (!useSSH) {
      return NextResponse.json(
        { message: "SSH is not enabled" },
        { status: 400 }
      );
    }

    // Validate form data
    const validationResult = testSSHSchema.safeParse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "SSH validation failed",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validData = validationResult.data;

    // Require password or private key
    if (!validData.sshPassword && !validData.sshPrivateKey) {
      return NextResponse.json(
        {
          message:
            "Either SSH Password or Private Key is required for SSH authentication",
        },
        { status: 400 }
      );
    }

    // Test SSH connection using ssh2
    return await testSSHConnection({
      host: validData.sshHost,
      port: validData.sshPort,
      username: validData.sshUsername,
      password: validData.sshPassword,
      privateKey: validData.sshPrivateKey
        ? Buffer.from(validData.sshPrivateKey)
        : undefined,
      passphrase: validData.sshPassphrase,
    });
  } catch (error) {
    console.error("Error testing SSH connection:", error);

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
