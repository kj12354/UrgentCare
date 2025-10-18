/**
 * Claude API Integration for SOAP Note Generation
 * 
 * Uses Anthropic's Claude API to generate structured SOAP notes from
 * patient encounter transcripts. Includes medical context awareness,
 * ICD-10 code suggestions, and structured formatting.
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * SOAP Note Structure
 */
export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Codes: ICD10Code[];
  chiefComplaint: string;
  hpi: string; // History of Present Illness
  ros: string; // Review of Systems
  physicalExam: string;
  diagnosis: string[];
  medications: Medication[];
  procedures: string[];
  followUp: string;
}

export interface ICD10Code {
  code: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

/**
 * Generate SOAP note from transcript using Claude
 */
export async function generateSOAPNote(
  transcript: string,
  chiefComplaint: string,
  patientContext?: {
    age?: number;
    gender?: string;
    allergies?: string[];
    medications?: string[];
    medicalHistory?: string[];
  }
): Promise<SOAPNote> {
  const prompt = buildSOAPPrompt(transcript, chiefComplaint, patientContext);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent medical documentation
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text content from Claude's response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    // Parse the structured response
    const soapNote = parseSOAPResponse(responseText);
    
    return soapNote;
  } catch (error) {
    console.error('Error generating SOAP note:', error);
    throw new Error('Failed to generate SOAP note. Please try again.');
  }
}

/**
 * Build the prompt for Claude with medical context
 */
function buildSOAPPrompt(
  transcript: string,
  chiefComplaint: string,
  patientContext?: {
    age?: number;
    gender?: string;
    allergies?: string[];
    medications?: string[];
    medicalHistory?: string[];
  }
): string {
  const contextSection = patientContext ? `
**Patient Context:**
- Age: ${patientContext.age || 'Unknown'}
- Gender: ${patientContext.gender || 'Unknown'}
- Allergies: ${patientContext.allergies?.join(', ') || 'None reported'}
- Current Medications: ${patientContext.medications?.join(', ') || 'None'}
- Medical History: ${patientContext.medicalHistory?.join(', ') || 'None reported'}
` : '';

  return `You are an expert medical scribe assistant. Generate a comprehensive SOAP note from the following patient encounter transcript.

**Chief Complaint:** ${chiefComplaint}
${contextSection}

**Encounter Transcript:**
${transcript}

**Instructions:**
1. Create a detailed SOAP note following standard medical documentation format
2. Extract all relevant clinical information from the transcript
3. Suggest appropriate ICD-10 codes with confidence levels
4. Include specific medications with dosages if mentioned
5. Organize information clearly and professionally
6. Use medical terminology appropriately
7. Be thorough but concise

**Output Format (JSON):**
Return ONLY a valid JSON object with this exact structure:
{
  "chiefComplaint": "Brief chief complaint",
  "subjective": "Detailed subjective section including HPI",
  "hpi": "History of Present Illness - detailed narrative",
  "ros": "Review of Systems - organized by system",
  "objective": "Objective findings including vital signs and physical exam",
  "physicalExam": "Detailed physical examination findings",
  "assessment": "Clinical assessment and differential diagnosis",
  "diagnosis": ["Primary diagnosis", "Secondary diagnosis"],
  "plan": "Treatment plan and recommendations",
  "icd10Codes": [
    {
      "code": "ICD-10 code",
      "description": "Code description",
      "confidence": "high|medium|low"
    }
  ],
  "medications": [
    {
      "name": "Medication name",
      "dosage": "Dosage amount",
      "frequency": "Frequency",
      "duration": "Duration",
      "instructions": "Special instructions"
    }
  ],
  "procedures": ["Procedures performed"],
  "followUp": "Follow-up instructions"
}

Generate the SOAP note now:`;
}

/**
 * Parse Claude's response into structured SOAP note
 */
function parseSOAPResponse(response: string): SOAPNote {
  try {
    // Extract JSON from response (Claude might wrap it in markdown)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and structure the response
    const soapNote: SOAPNote = {
      chiefComplaint: parsed.chiefComplaint || '',
      subjective: parsed.subjective || '',
      hpi: parsed.hpi || '',
      ros: parsed.ros || '',
      objective: parsed.objective || '',
      physicalExam: parsed.physicalExam || '',
      assessment: parsed.assessment || '',
      diagnosis: Array.isArray(parsed.diagnosis) ? parsed.diagnosis : [],
      plan: parsed.plan || '',
      icd10Codes: Array.isArray(parsed.icd10Codes) ? parsed.icd10Codes : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      procedures: Array.isArray(parsed.procedures) ? parsed.procedures : [],
      followUp: parsed.followUp || '',
    };

    return soapNote;
  } catch (error) {
    console.error('Error parsing SOAP response:', error);
    
    // Return a fallback structure with the raw response
    return {
      chiefComplaint: '',
      subjective: response,
      hpi: '',
      ros: '',
      objective: '',
      physicalExam: '',
      assessment: '',
      diagnosis: [],
      plan: '',
      icd10Codes: [],
      medications: [],
      procedures: [],
      followUp: '',
    };
  }
}

/**
 * Suggest ICD-10 codes based on symptoms/diagnosis
 */
export async function suggestICD10Codes(
  symptoms: string[],
  diagnosis?: string
): Promise<ICD10Code[]> {
  const prompt = `As a medical coding expert, suggest appropriate ICD-10 codes for the following:

**Symptoms:** ${symptoms.join(', ')}
${diagnosis ? `**Diagnosis:** ${diagnosis}` : ''}

Return ONLY a JSON array of ICD-10 codes with this format:
[
  {
    "code": "ICD-10 code",
    "description": "Full description",
    "confidence": "high|medium|low"
  }
]

Provide 3-5 most relevant codes:`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '[]';

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const codes = JSON.parse(jsonMatch[0]);
    return Array.isArray(codes) ? codes : [];
  } catch (error) {
    console.error('Error suggesting ICD-10 codes:', error);
    return [];
  }
}

/**
 * Refine/improve an existing SOAP note
 */
export async function refineSOAPNote(
  currentNote: Partial<SOAPNote>,
  feedback: string
): Promise<SOAPNote> {
  const prompt = `Refine the following SOAP note based on the feedback provided.

**Current SOAP Note:**
${JSON.stringify(currentNote, null, 2)}

**Feedback/Changes Requested:**
${feedback}

Return an improved version in the same JSON format as the original.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';

    return parseSOAPResponse(responseText);
  } catch (error) {
    console.error('Error refining SOAP note:', error);
    throw new Error('Failed to refine SOAP note. Please try again.');
  }
}
