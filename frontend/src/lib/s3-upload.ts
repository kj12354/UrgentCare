import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Lazy initialization of S3 client
let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3ClientInstance;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
}

/**
 * Upload audio file to S3
 * @param file - Audio blob to upload
 * @param patientId - Patient ID for organizing files
 * @param encounterId - Encounter ID for organizing files
 * @returns Upload result with S3 key and URL
 */
export async function uploadAudioToS3(
  file: Blob,
  patientId: string,
  encounterId: string
): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  // Generate unique filename
  const timestamp = Date.now();
  const key = `audio/${patientId}/${encounterId}/${timestamp}.webm`;

  // Convert blob to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get S3 client (lazy initialization)
  const s3Client = getS3Client();
  
  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type || "audio/webm",
    ServerSideEncryption: "AES256", // HIPAA compliance
    Metadata: {
      patientId,
      encounterId,
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  // Return result
  const url = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  
  return {
    key,
    url,
    bucket,
  };
}

/**
 * Upload any file to S3 (for documents, images, etc.)
 * @param file - File to upload
 * @param folder - Folder path in S3
 * @param filename - Optional custom filename
 * @returns Upload result with S3 key and URL
 */
export async function uploadFileToS3(
  file: File | Blob,
  folder: string,
  filename?: string
): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  // Generate filename if not provided
  const timestamp = Date.now();
  const name = filename || `${timestamp}-${file instanceof File ? file.name : "file"}`;
  const key = `${folder}/${name}`;

  // Convert to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Get S3 client (lazy initialization)
  const s3Client = getS3Client();
  
  // Upload to S3
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type || "application/octet-stream",
    ServerSideEncryption: "AES256", // HIPAA compliance
    Metadata: {
      uploadedAt: new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  // Return result
  const url = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  
  return {
    key,
    url,
    bucket,
  };
}
