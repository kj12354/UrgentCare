/**
 * API Route: Upload Document
 * POST /api/documents/upload
 * 
 * Handles document uploads to S3 with metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadDocument, DocumentMetadata } from '@/lib/s3-upload';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const encounterId = formData.get('encounterId') as string | null;
    const documentType = formData.get('documentType') as string;
    const description = formData.get('description') as string | null;
    const uploadedBy = formData.get('uploadedBy') as string | null;

    // Validate required fields
    if (!file || !patientId) {
      return NextResponse.json(
        { error: 'Missing required fields: file and patientId' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Prepare metadata
    const metadata: DocumentMetadata = {
      patientId,
      encounterId: encounterId || undefined,
      documentType: documentType || 'general',
      description: description || undefined,
      uploadedBy: uploadedBy || undefined,
    };

    // Upload to S3
    const result = await uploadDocument(file, metadata);

    return NextResponse.json({
      success: true,
      key: result.key,
      url: result.url,
      bucket: result.bucket,
      filename: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
