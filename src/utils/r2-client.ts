import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getR2Credentials } from "../config/r2-credentials.js";
import { DEFAULT_STAGE } from "./config.js";

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
 * Get the R2 key for a project and stage.
 * New format: {projectId}/{stage}/env.encrypted
 * Legacy format: {projectId}/env.encrypted (for backward compatibility)
 */
function getR2Key(projectId: string, stage: string = DEFAULT_STAGE): string {
  return `${projectId}/${stage}/env.encrypted`;
}

/**
 * Get the legacy R2 key (without stage) for backward compatibility
 */
function getLegacyR2Key(projectId: string): string {
  return `${projectId}/env.encrypted`;
}

/**
 * Upload encrypted data to R2
 */
export async function uploadToR2(
  projectId: string,
  encryptedData: string,
  stage: string = DEFAULT_STAGE
): Promise<void> {
  const creds = getR2Credentials();
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: creds.bucket,
    Key: getR2Key(projectId, stage),
    Body: encryptedData,
    ContentType: "application/octet-stream",
  });

  await client.send(command);
}

/**
 * Download encrypted data from R2
 * First tries the new stage-based key, then falls back to legacy key for backward compatibility
 */
export async function downloadFromR2(
  projectId: string,
  stage: string = DEFAULT_STAGE
): Promise<string> {
  const creds = getR2Credentials();
  const client = getR2Client();

  // First try the new stage-based key
  const stageKey = getR2Key(projectId, stage);
  
  try {
  const command = new GetObjectCommand({
    Bucket: creds.bucket,
      Key: stageKey,
  });

  const response = await client.send(command);

    if (!response.Body) {
      throw new Error("No data found");
    }

    return await response.Body.transformToString();
  } catch (error) {
    // If stage is development, try legacy key for backward compatibility
    if (stage === DEFAULT_STAGE) {
      const legacyKey = getLegacyR2Key(projectId);
      try {
        const legacyCommand = new GetObjectCommand({
          Bucket: creds.bucket,
          Key: legacyKey,
        });

        const response = await client.send(legacyCommand);

  if (!response.Body) {
    throw new Error("No data found for this project");
  }

  return await response.Body.transformToString();
      } catch {
        throw new Error(`No data found for this project (stage: ${stage})`);
      }
    }
    throw new Error(`No data found for this project (stage: ${stage})`);
  }
}

/**
 * Check if encrypted data exists for a project and stage
 * First checks the new stage-based key, then falls back to legacy key for backward compatibility
 */
export async function existsInR2(
  projectId: string,
  stage: string = DEFAULT_STAGE
): Promise<boolean> {
  const creds = getR2Credentials();
  const client = getR2Client();

  // First try the new stage-based key
  const stageKey = getR2Key(projectId, stage);

  try {
    const command = new HeadObjectCommand({
      Bucket: creds.bucket,
      Key: stageKey,
    });

    await client.send(command);
    return true;
  } catch {
    // If stage is development, try legacy key for backward compatibility
    if (stage === DEFAULT_STAGE) {
      const legacyKey = getLegacyR2Key(projectId);
      try {
        const legacyCommand = new HeadObjectCommand({
          Bucket: creds.bucket,
          Key: legacyKey,
        });

        await client.send(legacyCommand);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
