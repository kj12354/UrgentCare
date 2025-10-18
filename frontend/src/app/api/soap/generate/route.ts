/**
 * API Route: Generate SOAP Note
 * POST /api/soap/generate
 * 
 * Generates a structured SOAP note from a transcript using Claude API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSOAPNote } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, chiefComplaint, patientContext } = body;

    // Validate required fields
    if (!transcript || !chiefComplaint) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript and chiefComplaint' },
        { status: 400 }
      );
    }

    // Validate transcript length
    if (transcript.length < 10) {
      return NextResponse.json(
        { error: 'Transcript is too short to generate a meaningful SOAP note' },
        { status: 400 }
      );
    }

    // Generate SOAP note using Claude
    const soapNote = await generateSOAPNote(
      transcript,
      chiefComplaint,
      patientContext
    );

    return NextResponse.json({
      success: true,
      soapNote,
      metadata: {
        transcriptLength: transcript.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in SOAP generation API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate SOAP note',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
