// src/lib/crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// In a production application, you should store this key securely
// and not hard-code it in your application
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-32-character-encryption-key-here";
const ALGORITHM = "aes-256-cbc";

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
