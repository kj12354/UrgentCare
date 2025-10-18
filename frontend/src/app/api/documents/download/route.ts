/**
 * API Route: Download Document
 * GET /api/documents/download
 * 
 * Generates presigned URL for downloading a document
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPresignedDownloadUrl } from '@/lib/s3-upload';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Missing required parameter: key' },
        { status: 400 }
      );
    }

    // Generate presigned URL (valid for 1 hour)
    const url = await getPresignedDownloadUrl(key, 3600);

    return NextResponse.json({
      success: true,
      url,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Error generating download URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate download URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
