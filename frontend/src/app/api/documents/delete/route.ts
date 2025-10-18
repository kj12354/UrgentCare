/**
 * API Route: Delete Document
 * DELETE /api/documents/delete
 * 
 * Deletes a document from S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteFileFromS3 } from '@/lib/s3-upload';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Missing required field: key' },
        { status: 400 }
      );
    }

    // Delete from S3
    await deleteFileFromS3(key);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
