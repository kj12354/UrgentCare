import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

/**
 * Generate presigned URL for uploading a file
 * @param key - S3 key for the file
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Presigned URL for upload
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  const s3Client = getS3Client();
  
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ServerSideEncryption: "AES256",
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return presignedUrl;
}

/**
 * Generate presigned URL for downloading a file
 * @param key - S3 key for the file
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Presigned URL for download
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  const s3Client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return presignedUrl;
}

/**
 * Delete a file from S3
 * @param key - S3 key for the file to delete
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  const s3Client = getS3Client();
  
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * List files in a specific folder
 * @param prefix - Folder prefix (e.g., "documents/patient-123/")
 * @param maxKeys - Maximum number of files to return
 * @returns Array of file metadata
 */
export async function listFiles(
  prefix: string,
  maxKeys: number = 100
): Promise<Array<{
  key: string;
  size: number;
  lastModified: Date;
  url: string;
}>> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  const s3Client = getS3Client();
  
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });

  const response = await s3Client.send(command);
  
  if (!response.Contents) {
    return [];
  }

  return response.Contents.map(item => ({
    key: item.Key || "",
    size: item.Size || 0,
    lastModified: item.LastModified || new Date(),
    url: `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${item.Key}`,
  }));
}

/**
 * Upload document with metadata
 * @param file - File to upload
 * @param metadata - Document metadata
 * @returns Upload result
 */
export interface DocumentMetadata {
  patientId: string;
  encounterId?: string;
  documentType: string;
  description?: string;
  uploadedBy?: string;
}

export async function uploadDocument(
  file: File,
  metadata: DocumentMetadata
): Promise<UploadResult> {
  const bucket = process.env.AWS_S3_BUCKET;
  
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  // Generate organized key
  const timestamp = Date.now();
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `documents/${metadata.patientId}/${metadata.encounterId || "general"}/${timestamp}-${sanitizedFilename}`;

  // Convert to buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const s3Client = getS3Client();
  
  // Upload to S3 with metadata
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type || "application/octet-stream",
    ServerSideEncryption: "AES256",
    Metadata: {
      patientId: metadata.patientId,
      encounterId: metadata.encounterId || "",
      documentType: metadata.documentType,
      description: metadata.description || "",
      uploadedBy: metadata.uploadedBy || "",
      uploadedAt: new Date().toISOString(),
      originalFilename: file.name,
      fileSize: file.size.toString(),
    },
  });

  await s3Client.send(command);

  const url = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
  
  return {
    key,
    url,
    bucket,
  };
}
