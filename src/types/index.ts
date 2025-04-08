import { Database } from "@prisma/client";

export interface TunnelConfig {
  username: string;
  host: string;
  port: number;
  privateKey?: Buffer;
  password?: string;
  passphrase?: string;
  dstHost: string;
  dstPort: number;
  localPort?: number;
  keepAlive?: boolean;
}

export interface ExtendedDatabase extends Database {
  useSSH?: boolean;
  sshHost?: string;
  sshUsername?: string;
  sshPort?: number;
  sshPrivateKey?: string;
  sshPassword?: string;
  sshPassphrase?: string;
}

export interface QueryResult {
  error?: string;
  columns: string[];
  rows: Record<string, any>[];
}
export interface SSHTestConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: Buffer;
  passphrase?: string;
}

export interface SSHTestResult {
  success: boolean;
  message: string;
  details?: string;
}
