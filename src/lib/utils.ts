// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + "..." : str;
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function downloadAsJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function downloadAsCSV(data: any[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const valueStr =
            value === null || value === undefined ? "" : String(value);
          // Escape quotes and commas for CSV
          return `"${valueStr.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function cleanSqlQuery(query: string): string {
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

export function sanitizeErrorMessage(message: string): string {
  // List of patterns to redact from error messages
  const sensitivePatterns = [
    { pattern: /(password|passwd|pwd)=\w+/gi, replacement: "$1=REDACTED" },
    { pattern: /(user|username)=\w+/gi, replacement: "$1=REDACTED" },
    {
      pattern: /at\s+([A-Za-z]:)?[\\\/][\w\\\/\.-]+/g,
      replacement: "at [path redacted]",
    },
    { pattern: /line\s+\d+(\:\d+)?/gi, replacement: "line [redacted]" },
    {
      pattern: /(connection|server|host|data source)[\s\=]+[\w\.\-\:]+/gi,
      replacement: "$1=[redacted]",
    },
    {
      pattern: /file\s+[\'\"]?[\w\-\.\\\/]+[\'\"]?/gi,
      replacement: "file [redacted]",
    },
    {
      pattern: /([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})/,
      replacement: "[IP redacted]",
    },
  ];

  let sanitized = message;

  // Apply all redaction patterns
  sensitivePatterns.forEach(({ pattern, replacement }) => {
    sanitized = sanitized.replace(pattern, replacement);
  });

  // Provide generic errors for common database issues
  if (
    /permission denied|access denied|not authorized|privilege/i.test(message)
  ) {
    return "Database permission error: The query requires permissions that are not available";
  }

  if (/timeout|timed out/i.test(message)) {
    return "Query timed out: The operation took too long to complete";
  }

  return sanitized;
}
