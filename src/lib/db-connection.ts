// src/lib/db-connection.ts
import { Pool, PoolClient } from "pg";
import mysql from "mysql2/promise";
import { decrypt } from "./crypto";
import { cleanSqlQuery, sanitizeErrorMessage } from "./utils";
import { Database } from "@prisma/client";
import { ExtendedDatabase, QueryResult } from "@/types";

export async function executeQuery(
  database: ExtendedDatabase,
  sqlQuery: string
): Promise<QueryResult> {
  // Clean the SQL query to remove any markdown formatting
  sqlQuery = cleanSqlQuery(sqlQuery);

  console.log(sqlQuery);

  // Add timeout for query execution
  try {
    const QUERY_TIMEOUT = 30000; // 30 seconds

    // Use AbortController for timeout support
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT);

    try {
      if (database.type === "postgresql") {
        return await executePostgresQuery(
          database,
          sqlQuery,
          controller.signal
        );
      } else if (database.type === "mysql") {
        return await executeMySqlQuery(database, sqlQuery, controller.signal);
      } else {
        throw new Error(`Unsupported database type: ${database.type}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    // Handle abort error specifically
    if (error instanceof Error && error.name === "AbortError") {
      return {
        columns: [],
        rows: [],
        error: "Query timed out. Please try a less complex query.",
      };
    }

    console.error("Error executing query:", error);

    // Sanitize error messages to avoid exposing system details
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      // Remove sensitive information from error messages
      errorMessage = sanitizeErrorMessage(error.message);
    }

    return {
      columns: [],
      rows: [],
      error: errorMessage,
    };
  }
}

async function executePostgresQuery(
  database: Database,
  sqlQuery: string,
  signal?: AbortSignal
): Promise<QueryResult> {
  const { host, port, username, password, dbName, ssl } = database;
  const decryptedPassword = decrypt(password);

  // Set additional security-related connection options
  const pool = new Pool({
    user: username,
    password: decryptedPassword,
    host,
    port,
    database: dbName,
    ssl: ssl ? { rejectUnauthorized: false } : false,
    // Add additional security options
    statement_timeout: 20000, // 20 second statement timeout
    idle_in_transaction_session_timeout: 30000, // 30 second idle timeout
    connectionTimeoutMillis: 10000, // 10 second connection timeout
  });

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();

    // Set session variables for additional security
    await client.query("SET statement_timeout TO 20000"); // 20 seconds

    // Execute the query with abort signal support
    const queryPromise = client.query(sqlQuery);

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", () => {
        // Attempt to cancel the running query
        client?.query("SELECT pg_cancel_backend(pg_backend_pid())");
      });
    }

    const result = await queryPromise;

    const columns = result.fields.map((field) => field.name);
    const rows = result.rows;

    return { columns, rows };
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

async function executeMySqlQuery(
  database: Database,
  sqlQuery: string,
  signal?: AbortSignal
): Promise<QueryResult> {
  const { host, port, username, password, dbName, ssl } = database;
  const decryptedPassword = decrypt(password);

  const connection = await mysql.createConnection({
    host,
    port,
    user: username,
    password: decryptedPassword,
    database: dbName,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    // Add timeout configuration options
    connectTimeout: 10000, // 10 second connection timeout
    // Add other security-related options
    multipleStatements: false, // Prevent multiple statements
    dateStrings: true, // Return dates as strings to prevent injection vulnerabilities
    supportBigNumbers: true, // Handle big numbers properly
    bigNumberStrings: true,
  });

  try {
    // Set session variables for additional security
    await connection.query("SET SESSION max_execution_time = 20000"); // 20 seconds timeout for MySQL 5.7+
    await connection.query("SET SESSION SQL_MODE = 'NO_ENGINE_SUBSTITUTION'");

    // Execute the query
    const queryPromise = connection.query(sqlQuery);

    // Handle abort signal
    if (signal) {
      signal.addEventListener("abort", () => {
        // Attempt to kill the connection if aborted
        connection.destroy();
      });
    }

    const [rows, fields] = await queryPromise;

    // MySQL returns field metadata differently than PostgreSQL
    const columns = Array.isArray(fields)
      ? fields.map((field) => field.name)
      : Object.keys((rows as any[])[0] || {});

    return { columns, rows: rows as Record<string, any>[] };
  } finally {
    await connection.end();
  }
}
