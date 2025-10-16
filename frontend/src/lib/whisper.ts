import OpenAI from "openai";

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface TranscriptionResult {
  text: string;
  duration: number;
  language?: string;
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

/**
 * Transcribe audio using OpenAI Whisper API
 * @param audioBlob - Audio blob to transcribe
 * @param options - Transcription options
 * @returns Transcription result
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options?: {
    language?: string;
    prompt?: string;
    temperature?: number;
    responseFormat?: "json" | "text" | "srt" | "verbose_json" | "vtt";
  }
): Promise<TranscriptionResult> {
  try {
    // Get OpenAI client (lazy initialization)
    const openai = getOpenAIClient();
    
    // Convert blob to File object (required by OpenAI SDK)
    const file = new File([audioBlob], "audio.webm", { type: audioBlob.type });

    // Call Whisper API
    const response = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: options?.language || "en",
      prompt: options?.prompt || "Medical encounter transcription. Include medical terminology, symptoms, diagnoses, and treatment plans.",
      temperature: options?.temperature || 0.2, // Lower temperature for more accurate medical transcription
      response_format: options?.responseFormat || "verbose_json",
    });

    // Parse response based on format
    if (options?.responseFormat === "text") {
      return {
        text: response as unknown as string,
        duration: 0,
      };
    }

    // For verbose_json format
    const verboseResponse = response as any;
    
    return {
      text: verboseResponse.text || "",
      duration: verboseResponse.duration || 0,
      language: verboseResponse.language,
      segments: verboseResponse.segments?.map((seg: any) => ({
        id: seg.id,
        start: seg.start,
        end: seg.end,
        text: seg.text,
      })),
    };
  } catch (error) {
    console.error("Whisper transcription error:", error);
    throw new Error("Failed to transcribe audio. Please try again.");
  }
}

/**
 * Transcribe audio with medical context optimization
 * @param audioBlob - Audio blob to transcribe
 * @param patientContext - Optional patient context for better accuracy
 * @returns Transcription result
 */
export async function transcribeMedicalAudio(
  audioBlob: Blob,
  patientContext?: {
    chiefComplaint?: string;
    medicalHistory?: string[];
    currentMedications?: string[];
  }
): Promise<TranscriptionResult> {
  // Build context-aware prompt
  let prompt = "Medical encounter transcription. ";
  
  if (patientContext?.chiefComplaint) {
    prompt += `Chief complaint: ${patientContext.chiefComplaint}. `;
  }
  
  if (patientContext?.medicalHistory && patientContext.medicalHistory.length > 0) {
    prompt += `Medical history: ${patientContext.medicalHistory.join(", ")}. `;
  }
  
  if (patientContext?.currentMedications && patientContext.currentMedications.length > 0) {
    prompt += `Current medications: ${patientContext.currentMedications.join(", ")}. `;
  }

  return transcribeAudio(audioBlob, {
    prompt,
    temperature: 0.1, // Very low temperature for medical accuracy
    responseFormat: "verbose_json",
  });
}

/**
 * Convert audio format for better Whisper compatibility
 * Note: This is a placeholder. In production, you'd use a library like ffmpeg.wasm
 * @param audioBlob - Audio blob to convert
 * @returns Converted audio blob
 */
export async function convertAudioFormat(audioBlob: Blob): Promise<Blob> {
  // For now, just return the original blob
  // In production, you'd convert to a format Whisper prefers (e.g., MP3, WAV)
  return audioBlob;
}
