import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, transcribeMedicalAudio } from "@/lib/whisper";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const patientContext = formData.get("patientContext");

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], {
      type: audioFile.type,
    });

    // Transcribe with or without patient context
    let result;
    if (patientContext) {
      const context = JSON.parse(patientContext as string);
      result = await transcribeMedicalAudio(audioBlob, context);
    } else {
      result = await transcribeAudio(audioBlob);
    }

    return NextResponse.json({
      transcript: result.text,
      duration: result.duration,
      language: result.language,
      segments: result.segments,
    });
  } catch (error) {
    console.error("Transcription API error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
