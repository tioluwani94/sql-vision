// src/lib/security/prompt-validation.ts
import { z } from "zod";

// Define validation schema for natural language queries
const naturalLanguageQuerySchema = z
  .string()
  .min(3, "Query must be at least 3 characters long")
  .max(500, "Query cannot exceed 500 characters")
  .refine((query) => !containsSuspiciousPatterns(query), {
    message: "Query contains potentially unsafe patterns",
  });

// Check for suspicious patterns that might indicate prompt injection attempts
function containsSuspiciousPatterns(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Pattern detection for common prompt injection techniques
  const suspiciousPatterns = [
    // System prompt overrides
    /ignore previous instructions/i,
    /forget your instructions/i,
    /you are now/i,
    /system:/i,
    /\\n\\n\\n/i,

    // Code blocks that might be trying to escape context
    /```system/i,
    /```prompt/i,

    // SQL injection attempts wrapped in natural language
    /drop table/i,
    /drop database/i,
    /delete from.+where.+1=1/i,
    /update.+set.+where.+1=1/i,

    // Attempts to access system files or commands
    /execute\s+\w+\s+commands/i,
    /run\s+shell/i,
    /show\s+system/i,

    // Extremely long tokens or repeated characters that might be trying to overflow buffers
    /(.)\1{20,}/,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(lowerQuery));
}

// Additional validation for specific database contexts
export function validateQueryForDatabase(
  naturalLanguageQuery: string,
  databaseType: string
): string {
  // Basic validation
  const validationResult =
    naturalLanguageQuerySchema.safeParse(naturalLanguageQuery);

  if (!validationResult.success) {
    throw new Error(validationResult.error.errors[0].message);
  }

  // Database-specific validation
  const sanitizedQuery = sanitizeQuery(validationResult.data, databaseType);

  return sanitizedQuery;
}

// Sanitize the query based on database context
function sanitizeQuery(query: string, databaseType: string): string {
  // Remove any characters or sequences that could interfere with our prompting system
  const sanitized = query
    .replace(/```/g, "") // Remove code block markers
    .replace(/\\/g, "\\\\") // Escape backslashes
    .replace(/"/g, '\\"') // Escape double quotes
    .trim();

  // Additional database-specific sanitization
  if (databaseType === "postgresql") {
    // PostgreSQL-specific sanitization if needed
  } else if (databaseType === "mysql") {
    // MySQL-specific sanitization if needed
  }

  return sanitized;
}

// Log potentially suspicious queries for review
export function logSuspiciousQuery(
  userId: string,
  query: string,
  reason: string
): void {
  // In a production environment, this would log to a secure monitoring system
  console.warn(
    `Suspicious query detected from user ${userId}: "${query}". Reason: ${reason}`
  );

  // TODO: Implement proper logging to security monitoring system
  // securityLogger.log({
  //   type: 'SUSPICIOUS_QUERY',
  //   userId,
  //   query,
  //   reason,
  //   timestamp: new Date()
  // });
}
