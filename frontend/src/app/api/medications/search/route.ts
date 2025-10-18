/**
 * API Route: Medication Search
 * GET /api/medications/search
 * 
 * Searches for medications by name
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock medication database
// In production, integrate with FDA API or medication database
const MEDICATIONS = [
  { name: 'Amoxicillin', brandName: 'Amoxil', genericName: 'Amoxicillin', form: 'Capsule', route: 'Oral' },
  { name: 'Azithromycin', brandName: 'Zithromax', genericName: 'Azithromycin', form: 'Tablet', route: 'Oral' },
  { name: 'Lisinopril', brandName: 'Prinivil', genericName: 'Lisinopril', form: 'Tablet', route: 'Oral' },
  { name: 'Metformin', brandName: 'Glucophage', genericName: 'Metformin', form: 'Tablet', route: 'Oral' },
  { name: 'Ibuprofen', brandName: 'Advil', genericName: 'Ibuprofen', form: 'Tablet', route: 'Oral' },
  { name: 'Acetaminophen', brandName: 'Tylenol', genericName: 'Acetaminophen', form: 'Tablet', route: 'Oral' },
  { name: 'Omeprazole', brandName: 'Prilosec', genericName: 'Omeprazole', form: 'Capsule', route: 'Oral' },
  { name: 'Atorvastatin', brandName: 'Lipitor', genericName: 'Atorvastatin', form: 'Tablet', route: 'Oral' },
  { name: 'Levothyroxine', brandName: 'Synthroid', genericName: 'Levothyroxine', form: 'Tablet', route: 'Oral' },
  { name: 'Amlodipine', brandName: 'Norvasc', genericName: 'Amlodipine', form: 'Tablet', route: 'Oral' },
  { name: 'Albuterol', brandName: 'Proventil', genericName: 'Albuterol', form: 'Inhaler', route: 'Inhalation' },
  { name: 'Prednisone', brandName: 'Deltasone', genericName: 'Prednisone', form: 'Tablet', route: 'Oral' },
  { name: 'Gabapentin', brandName: 'Neurontin', genericName: 'Gabapentin', form: 'Capsule', route: 'Oral' },
  { name: 'Hydrochlorothiazide', brandName: 'Microzide', genericName: 'Hydrochlorothiazide', form: 'Tablet', route: 'Oral' },
  { name: 'Losartan', brandName: 'Cozaar', genericName: 'Losartan', form: 'Tablet', route: 'Oral' },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ medications: [] });
    }

    // Search medications
    const results = MEDICATIONS.filter(med =>
      med.name.toLowerCase().includes(query.toLowerCase()) ||
      med.brandName.toLowerCase().includes(query.toLowerCase()) ||
      med.genericName.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10); // Limit to 10 results

    return NextResponse.json({
      success: true,
      medications: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Error searching medications:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search medications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
