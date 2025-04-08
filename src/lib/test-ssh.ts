import { SSHTestConfig, SSHTestResult } from "@/types";
import { Client } from "ssh2";

/**
 * Test an SSH connection with the given configuration
 */
export async function testSSHConnection(
  config: SSHTestConfig
): Promise<SSHTestResult> {
  return new Promise((resolve) => {
    const ssh = new Client();

    // Set a timeout for the connection attempt
    const timeout = setTimeout(() => {
      ssh.end();
      resolve({
        success: false,
        message: "SSH connection timed out after 10 seconds",
      });
    }, 10000);

    ssh.on("ready", () => {
      clearTimeout(timeout);

      // Execute a simple command to verify the connection
      ssh.exec('echo "SSH connection test successful"', (err, stream) => {
        if (err) {
          ssh.end();
          return resolve({
            success: false,
            message: "SSH connection established but command execution failed",
            details: err.message,
          });
        }

        let output = "";

        stream.on("data", (data) => {
          output += data.toString();
        });

        stream.on("close", () => {
          ssh.end();
          resolve({
            success: true,
            message: "SSH connection successful",
            details: output.trim(),
          });
        });
      });
    });

    ssh.on("error", (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        message: "SSH connection failed",
        details: err.message,
      });
    });

    // Connect to the SSH server
    ssh.connect({
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      privateKey: config.privateKey,
      passphrase: config.passphrase,
      // Add some reasonable defaults for security
      algorithms: {
        kex: [
          "ecdh-sha2-nistp256",
          "ecdh-sha2-nistp384",
          "ecdh-sha2-nistp521",
          "diffie-hellman-group-exchange-sha256",
          "diffie-hellman-group14-sha256",
        ],
        cipher: [
          "aes128-gcm",
          "aes256-gcm",
          "aes128-ctr",
          "aes192-ctr",
          "aes256-ctr",
        ],
        serverHostKey: [
          "ssh-rsa",
          "ecdsa-sha2-nistp256",
          "ecdsa-sha2-nistp384",
          "ecdsa-sha2-nistp521",
          "ssh-ed25519",
        ],
        hmac: ["hmac-sha2-256", "hmac-sha2-512"],
      },
      // Add a keepalive interval to prevent connection drops
      keepaliveInterval: 5000,
      keepaliveCountMax: 3,
      // Set a reasonable readyTimeout
      readyTimeout: 10000,
    });
  });
}
