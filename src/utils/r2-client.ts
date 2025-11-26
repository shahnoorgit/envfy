import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2Credentials } from "../config/r2-credentials.js";

let client: S3Client | null = null;

/**
 * Get the S3 client configured for Cloudflare R2
 */
export function getR2Client(): S3Client {
  if (client) return client;

  const creds = getR2Credentials();

  client = new S3Client({
    region: "auto",
    endpoint: creds.endpoint,
    credentials: {
      accessKeyId: creds.accessKey,
      secretAccessKey: creds.secretKey,
    },
  });

  return client;
}

/**
 * Upload encrypted data to R2
 */
export async function uploadToR2(
  projectId: string,
  encryptedData: string
): Promise<void> {
  const creds = getR2Credentials();
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: creds.bucket,
    Key: `${projectId}/env.encrypted`,
    Body: encryptedData,
    ContentType: "application/octet-stream",
  });

  await client.send(command);
}

/**
 * Download encrypted data from R2
 */
export async function downloadFromR2(projectId: string): Promise<string> {
  const creds = getR2Credentials();
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: creds.bucket,
    Key: `${projectId}/env.encrypted`,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error("No data found for this project");
  }

  return await response.Body.transformToString();
}

/**
 * Check if encrypted data exists for a project
 */
export async function existsInR2(projectId: string): Promise<boolean> {
  const creds = getR2Credentials();
  const client = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: creds.bucket,
      Key: `${projectId}/env.encrypted`,
    });

    await client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

