/**
 * API Route: Suggest ICD-10 Codes
 * POST /api/soap/icd10
 * 
 * Suggests ICD-10 codes based on symptoms and diagnosis
 */

import { NextRequest, NextResponse } from 'next/server';
import { suggestICD10Codes } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symptoms, diagnosis } = body;

    // Validate required fields
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required field: symptoms (must be a non-empty array)' },
        { status: 400 }
      );
    }

    // Get ICD-10 code suggestions
    const codes = await suggestICD10Codes(symptoms, diagnosis);

    return NextResponse.json({
      success: true,
      codes,
      metadata: {
        symptomsCount: symptoms.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in ICD-10 suggestion API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to suggest ICD-10 codes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
