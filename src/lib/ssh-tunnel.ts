// src/lib/ssh-tunnel.ts
import { ExtendedDatabase, TunnelConfig } from "@/types";
import net from "net";
import { createTunnel } from "tunnel-ssh";
import { decrypt } from "./crypto";

// Store active tunnels to manage them
const activeTunnels: Map<string, { server: net.Server; localPort: number }> =
  new Map();

/**
 * Creates an SSH tunnel for database connection
 */
export async function createSSHTunnel(
  database: ExtendedDatabase
): Promise<number> {
  const databaseId = database.id;

  // Check if there's already an active tunnel for this database
  if (activeTunnels.has(databaseId)) {
    // Return the local port of the existing tunnel
    return activeTunnels.get(databaseId)!.localPort;
  }

  if (!database.useSSH || !database.sshHost || !database.sshUsername) {
    throw new Error("SSH connection details are missing");
  }

  // Default local port is the database port + 10000 to avoid conflicts
  // This is just a starting point, actual assignment will be dynamic
  const suggestedLocalPort = database.port + 10000;

  // Prepare SSH tunnel configuration
  const tunnelConfig: TunnelConfig = {
    username: database.sshUsername,
    host: database.sshHost,
    port: database.sshPort || 22,
    dstHost: database.host, // Database host
    dstPort: database.port, // Database port
    localPort: suggestedLocalPort,
    keepAlive: true,
  };

  // Add authentication - either private key or password
  if (database.sshPrivateKey) {
    const privateKey = decrypt(database.sshPrivateKey);
    tunnelConfig.privateKey = Buffer.from(privateKey);

    if (database.sshPassphrase) {
      tunnelConfig.passphrase = decrypt(database.sshPassphrase);
    }
  } else if (database.sshPassword) {
    tunnelConfig.password = decrypt(database.sshPassword);
  } else {
    throw new Error(
      "SSH authentication details (password or private key) are missing"
    );
  }

  try {
    console.log(
      `Creating SSH tunnel to ${database.sshHost}:${database.sshPort} for database at ${database.host}:${database.port}`
    );

    // Create the tunnel
    const [server] = await createTunnel(
      {
        autoClose: false,
        reconnectOnError: false,
      },
      {},
      {
        host: tunnelConfig.host,
        port: tunnelConfig.port,
        username: tunnelConfig.username,
        password: tunnelConfig.password,
        privateKey: tunnelConfig.privateKey,
        passphrase: tunnelConfig.passphrase,
      },
      {
        srcAddr: "localhost",
        srcPort: tunnelConfig.localPort,
        dstAddr: tunnelConfig.dstHost,
        dstPort: tunnelConfig.dstPort,
      }
    );

    const actualLocalPort = (server.address() as net.AddressInfo).port;
    console.log(`SSH tunnel established on local port ${actualLocalPort}`);

    // Store the tunnel for future use and cleanup
    activeTunnels.set(databaseId, {
      server,
      localPort: actualLocalPort,
    });

    return actualLocalPort;
  } catch (error) {
    console.error("Error creating SSH tunnel:", error);
    throw new Error(
      `Failed to establish SSH tunnel: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Closes an SSH tunnel for a specific database
 */
export async function closeSSHTunnel(databaseId: string): Promise<void> {
  const tunnel = activeTunnels.get(databaseId);

  if (tunnel) {
    console.log(`Closing SSH tunnel for database ${databaseId}`);

    return new Promise((resolve, reject) => {
      tunnel.server.close((err) => {
        if (err) {
          console.error(
            `Error closing SSH tunnel for database ${databaseId}:`,
            err
          );
          reject(err);
        } else {
          activeTunnels.delete(databaseId);
          console.log(
            `SSH tunnel for database ${databaseId} closed successfully`
          );
          resolve();
        }
      });
    });
  }
}

/**
 * Closes all active SSH tunnels
 */
export async function closeAllTunnels(): Promise<void> {
  console.log(`Closing all active SSH tunnels (${activeTunnels.size})`);

  const closingPromises = Array.from(activeTunnels.keys()).map((databaseId) =>
    closeSSHTunnel(databaseId).catch((err) =>
      console.error(`Failed to close tunnel for database ${databaseId}:`, err)
    )
  );

  await Promise.all(closingPromises);
}

// Add shutdown handler to ensure tunnels are closed when the server stops
if (typeof process !== "undefined") {
  const cleanup = async () => {
    console.log("Application shutting down, closing SSH tunnels...");
    await closeAllTunnels();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
