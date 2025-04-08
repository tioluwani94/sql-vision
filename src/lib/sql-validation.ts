// src/lib/security/sql-validation.ts

import { Database } from "@prisma/client";

// Define types for security options
type SecurityMode = "strict" | "medium" | "permissive";

interface SQLValidationOptions {
  mode: SecurityMode;
  allowedTables?: string[];
  allowedOperations?: Array<
    "select" | "insert" | "update" | "delete" | "create" | "alter" | "drop"
  >;
  maxRowLimit?: number;
}

// Default security options for different modes
const securityModes: Record<SecurityMode, SQLValidationOptions> = {
  strict: {
    mode: "strict",
    allowedOperations: ["select"],
    maxRowLimit: 1000,
  },
  medium: {
    mode: "medium",
    allowedOperations: ["select", "insert", "update"],
    maxRowLimit: 5000,
  },
  permissive: {
    mode: "permissive",
    allowedOperations: [
      "select",
      "insert",
      "update",
      "delete",
      "create",
      "alter",
    ],
    maxRowLimit: 10000,
  },
};

export function validateSqlQuery(
  sqlQuery: string,
  database: Database,
  options?: Partial<SQLValidationOptions>
): { isValid: boolean; error?: string; sanitizedQuery?: string } {
  // Use strict mode by default
  const securityOpts: SQLValidationOptions = {
    ...securityModes.strict,
    ...options,
  };

  // Convert to lowercase for easier pattern matching
  const lowerQuery = sqlQuery.toLowerCase();

  // Check for SQL injection patterns
  if (containsSqlInjectionPatterns(lowerQuery)) {
    return {
      isValid: false,
      error: "Query contains potentially harmful patterns",
    };
  }

  // Validate query operation type
  const operation = detectQueryOperation(lowerQuery);
  if (!operation) {
    return {
      isValid: false,
      error: "Unable to determine query operation type",
    };
  }

  if (!securityOpts.allowedOperations?.includes(operation)) {
    return {
      isValid: false,
      error: `Operation '${operation}' is not allowed under current security settings`,
    };
  }

  // For SELECT queries, ensure they have a LIMIT clause unless configured otherwise
  if (
    operation === "select" &&
    securityOpts.maxRowLimit &&
    !hasRowLimit(lowerQuery)
  ) {
    // Add a LIMIT clause to the query
    const sanitizedQuery = addRowLimit(sqlQuery, securityOpts.maxRowLimit);
    return {
      isValid: true,
      sanitizedQuery,
    };
  }

  // Validate tables if allowed tables are specified
  if (securityOpts.allowedTables && securityOpts.allowedTables.length > 0) {
    const tables = extractTablesFromQuery(lowerQuery);
    const unauthorizedTables = tables.filter(
      (table) => !securityOpts.allowedTables?.includes(table)
    );

    if (unauthorizedTables.length > 0) {
      return {
        isValid: false,
        error: `Query references unauthorized tables: ${unauthorizedTables.join(
          ", "
        )}`,
      };
    }
  }

  // If query passed all checks
  return {
    isValid: true,
    sanitizedQuery: sqlQuery,
  };
}

// Detect the operation type of the SQL query
function detectQueryOperation(
  query: string
):
  | "select"
  | "insert"
  | "update"
  | "delete"
  | "create"
  | "alter"
  | "drop"
  | null {
  const trimmedQuery = query.trim();

  if (/^select\s/i.test(trimmedQuery)) return "select";
  if (/^insert\s/i.test(trimmedQuery)) return "insert";
  if (/^update\s/i.test(trimmedQuery)) return "update";
  if (/^delete\s/i.test(trimmedQuery)) return "delete";
  if (/^create\s/i.test(trimmedQuery)) return "create";
  if (/^alter\s/i.test(trimmedQuery)) return "alter";
  if (/^drop\s/i.test(trimmedQuery)) return "drop";

  return null;
}

// Check if query has potentially harmful patterns
function containsSqlInjectionPatterns(query: string): boolean {
  // Common SQL injection patterns
  const patterns = [
    /--/, // SQL comment that could be used to bypass checks
    /;\s*(\w+)/, // Multiple statements
    /union\s+(?:all\s+)?select/i, // UNION-based SQL injection
    /into\s+outfile/i, // File operations
    /information_schema/i, // Accessing metadata
    /pg_\w+/i, // PostgreSQL system tables
    /sys\./i, // MySQL system schema
    /exec\(|exec\s+/i, // Command execution
    /xp_cmdshell/i, // SQL Server command execution
    /sp_executesql/i, // Dynamic SQL execution
    /waitfor\s+delay/i, // Time-based injection testing
    /load_file/i, // File reading functions
  ];

  return patterns.some((pattern) => pattern.test(query));
}

// Check if a query already has a row limit
function hasRowLimit(query: string): boolean {
  return /\blimit\s+\d+/i.test(query);
}

// Add a row limit to a query
function addRowLimit(query: string, limit: number): string {
  // Simplistic approach - a more robust parser would be better for production
  if (/\bgroup\s+by\b/i.test(query) || /\border\s+by\b/i.test(query)) {
    // If there's a GROUP BY or ORDER BY, add LIMIT after it
    return query.replace(
      /(\s+)(group\s+by\s+.*|order\s+by\s+.*?)(\s*)(;?\s*)$/i,
      `$1$2$3LIMIT ${limit}$4`
    );
  } else {
    // Otherwise, add LIMIT at the end
    return query.replace(/(\s*)(;?\s*)$/, ` LIMIT ${limit}$2`);
  }
}

// Extract table names from a query (simplified - would need a proper SQL parser for production)
function extractTablesFromQuery(query: string): string[] {
  // This is a simplified implementation
  // A real implementation would use a proper SQL parser
  const fromPattern = /from\s+(\w+)/gi;
  const joinPattern = /join\s+(\w+)/gi;
  const updatePattern = /update\s+(\w+)/gi;
  const insertPattern = /insert\s+into\s+(\w+)/gi;
  const deletePattern = /delete\s+from\s+(\w+)/gi;

  const tables: string[] = [];
  let match;

  // Extract tables from FROM clauses
  while ((match = fromPattern.exec(query)) !== null) {
    tables.push(match[1]);
  }

  // Extract tables from JOIN clauses
  while ((match = joinPattern.exec(query)) !== null) {
    tables.push(match[1]);
  }

  // Extract tables from UPDATE statements
  while ((match = updatePattern.exec(query)) !== null) {
    tables.push(match[1]);
  }

  // Extract tables from INSERT statements
  while ((match = insertPattern.exec(query)) !== null) {
    tables.push(match[1]);
  }

  // Extract tables from DELETE statements
  while ((match = deletePattern.exec(query)) !== null) {
    tables.push(match[1]);
  }

  // Remove duplicates and return
  return [...new Set(tables)];
}
