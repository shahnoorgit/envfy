import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

/**
 * Generate a unique project ID
 */
export function generateProjectId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString("hex");
  return `env_${timestamp}_${random}`;
}

/**
 * Derive an encryption key from a passphrase using PBKDF2
 */
export function deriveKeyFromPassphrase(
  passphrase: string,
  salt?: Buffer
): { key: Buffer; salt: Buffer } {
  const usedSalt = salt ?? crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(
    passphrase,
    usedSalt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    "sha256"
  );
  return { key, salt: usedSalt };
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");

  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generate a random encryption key (for key storage)
 */
export function generateRandomKey(): Buffer {
  return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Hash a passphrase for verification (not for encryption)
 */
export function hashPassphrase(passphrase: string, salt: Buffer): string {
  return crypto
    .pbkdf2Sync(passphrase, salt, PBKDF2_ITERATIONS, 32, "sha256")
    .toString("hex");
}

