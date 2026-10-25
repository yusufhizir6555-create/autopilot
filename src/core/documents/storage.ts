import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireEnv } from "@/lib/env";

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function key(): Buffer {
  const k = Buffer.from(requireEnv("DOCUMENT_ENCRYPTION_KEY"), "base64");
  if (k.length !== 32) throw new Error("DOCUMENT_ENCRYPTION_KEY muss 32 Byte (base64) lang sein");
  return k;
}

function dir(): string {
  return path.resolve(process.env.DOCUMENT_STORAGE_DIR ?? "./storage");
}

function filePath(storageKey: string): string {
  if (!/^[a-f0-9-]{36}$/.test(storageKey)) throw new Error("Ungültiger Speicher-Schlüssel");
  return path.join(dir(), `${storageKey}.bin`);
}

/** Verschlüsselt mit AES-256-GCM und legt die Datei außerhalb von public/ ab. */
export async function storeEncrypted(content: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
  const storageKey = randomUUID();
  await mkdir(dir(), { recursive: true });
  await writeFile(filePath(storageKey), encrypted, { mode: 0o600 });
  return { storageKey, iv: iv.toString("base64"), authTag: cipher.getAuthTag().toString("base64") };
}

export async function readDecrypted(doc: { storageKey: string; iv: string; authTag: string }): Promise<Buffer> {
  const encrypted = await readFile(filePath(doc.storageKey));
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(doc.iv, "base64"));
  decipher.setAuthTag(Buffer.from(doc.authTag, "base64"));
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export async function deleteStored(storageKey: string): Promise<void> {
  await rm(filePath(storageKey), { force: true });
}
