/**
 * API Route: List Documents
 * GET /api/documents/list
 * 
 * Lists documents for a patient or encounter
 */

import { NextRequest, NextResponse } from 'next/server';
import { listFiles } from '@/lib/s3-upload';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const patientId = searchParams.get('patientId');
    const encounterId = searchParams.get('encounterId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing required parameter: patientId' },
        { status: 400 }
      );
    }

    // Build S3 prefix
    const prefix = encounterId
      ? `documents/${patientId}/${encounterId}/`
      : `documents/${patientId}/`;

    // List files from S3
    const files = await listFiles(prefix);

    // Transform to document format
    const documents = files.map((file, index) => ({
      id: `${patientId}-${index}`,
      key: file.key,
      name: file.key.split('/').pop() || 'Unknown',
      type: getFileType(file.key),
      size: file.size,
      uploadedAt: file.lastModified,
      url: file.url,
    }));

    return NextResponse.json({
      success: true,
      documents,
      count: documents.length,
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to list documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getFileType(key: string): string {
  const extension = key.split('.').pop()?.toLowerCase();
  
  const typeMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    mp4: 'video/mp4',
  };

  return typeMap[extension || ''] || 'application/octet-stream';
}
