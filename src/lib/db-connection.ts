// src/lib/db-connection.ts
import { Pool, PoolClient } from "pg";
import mysql from "mysql2/promise";
import { decrypt } from "./crypto";
import { cleanSqlQuery } from "./utils";

export type QueryResult = {
  error?: string;
  columns: string[];
  rows: Record<string, any>[];
};

export async function executeQuery(
  database: any,
  sqlQuery: string
): Promise<QueryResult> {
  sqlQuery = cleanSqlQuery(sqlQuery);
  try {
    if (database.type === "postgresql") {
      return await executePostgresQuery(database, sqlQuery);
    } else if (database.type === "mysql") {
      return await executeMySqlQuery(database, sqlQuery);
    } else {
      throw new Error(`Unsupported database type: ${database.type}`);
    }
  } catch (error) {
    console.error("Error executing query:", error);
    return {
      columns: [],
      rows: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function executePostgresQuery(
  database: any,
  sqlQuery: string
): Promise<QueryResult> {
  const { host, port, username, password, dbName, ssl } = database;
  const decryptedPassword = decrypt(password);

  const pool = new Pool({
    user: username,
    password: decryptedPassword,
    host,
    port,
    database: dbName,
    ssl: ssl ? { rejectUnauthorized: false } : false,
  });

  let client: PoolClient | null = null;

  try {
    client = await pool.connect();
    const result = await client.query(sqlQuery);

    const columns = result.fields.map((field) => field.name);
    const rows = result.rows;

    return { columns, rows };
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

async function executeMySqlQuery(
  database: any,
  sqlQuery: string
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
  });

  try {
    const [rows, fields] = await connection.query(sqlQuery);

    // MySQL returns field metadata differently than PostgreSQL
    const columns = Array.isArray(fields)
      ? fields.map((field) => field.name)
      : Object.keys((rows as any[])[0] || {});

    return { columns, rows: rows as Record<string, any>[] };
  } finally {
    await connection.end();
  }
}
