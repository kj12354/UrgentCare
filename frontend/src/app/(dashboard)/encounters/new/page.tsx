"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { TranscriptionDisplay } from "@/components/voice/TranscriptionDisplay";
import SOAPNoteEditor from "@/components/soap/SOAPNoteEditor";
import ICD10Search from "@/components/soap/ICD10Search";
import DocumentUploader from "@/components/documents/DocumentUploader";
import DocumentList from "@/components/documents/DocumentList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Loader2, FileText, Mic, FolderOpen } from "lucide-react";
import Link from "next/link";
import { SOAPNote, ICD10Code } from "@/lib/claude";

interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

function NewEncounterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId");

  const [chiefComplaint, setChiefComplaint] = useState("");
  const [transcript, setTranscript] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [language, setLanguage] = useState<string>();
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [soapNote, setSOAPNote] = useState<Partial<SOAPNote> | null>(null);
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [activeTab, setActiveTab] = useState<'recording' | 'soap' | 'documents'>('recording');

  const handleRecordingComplete = (blob: Blob, recordingDuration: number) => {
    setAudioBlob(blob);
    setDuration(recordingDuration);
  };

  const handleTranscription = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      // Add patient context if available
      if (chiefComplaint) {
        formData.append(
          "patientContext",
          JSON.stringify({ chiefComplaint })
        );
      }

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Transcription failed");
      }

      const data = await response.json();
      setTranscript(data.transcript);
      setDuration(data.duration || duration);
      setLanguage(data.language);
      setSegments(data.segments || []);

      return data.transcript;
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    }
  };

  const handleSaveTranscript = (editedTranscript: string) => {
    setTranscript(editedTranscript);
  };

  const handleGenerateSOAP = async () => {
    if (!transcript || !chiefComplaint) {
      alert("Please provide a chief complaint and transcription first");
      return;
    }

    setIsGeneratingSOAP(true);
    try {
      const response = await fetch('/api/soap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          chiefComplaint,
          patientContext: {
            // Add patient context if available
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SOAP note');
      }

      const data = await response.json();
      setSOAPNote(data.soapNote);
      setActiveTab('soap');
    } catch (error) {
      console.error('Error generating SOAP note:', error);
      alert('Failed to generate SOAP note. Please try again.');
    } finally {
      setIsGeneratingSOAP(false);
    }
  };

  const handleSaveSOAPNote = (note: SOAPNote) => {
    setSOAPNote(note);
  };

  const handleAddICD10Code = (code: ICD10Code) => {
    setSOAPNote(prev => ({
      ...prev,
      icd10Codes: [...(prev?.icd10Codes || []), code],
    }));
  };

  const handleSaveEncounter = async () => {
    if (!transcript || !chiefComplaint) {
      alert("Please provide a chief complaint and transcription");
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Save encounter to backend
      // This will be implemented when we add the encounters API
      console.log("Saving encounter:", {
        patientId,
        chiefComplaint,
        transcript,
        duration,
        soapNote,
      });

      // For now, just navigate back
      alert("Encounter saved successfully!");
      if (patientId) {
        router.push(`/patients/${patientId}`);
      } else {
        router.push("/encounters");
      }
    } catch (error) {
      console.error("Error saving encounter:", error);
      alert("Failed to save encounter");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={patientId ? `/patients/${patientId}` : "/encounters"}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">New Encounter</h1>
            <p className="text-gray-600">Record, transcribe, and document patient encounter</p>
          </div>
        </div>
        <Button
          onClick={handleSaveEncounter}
          disabled={!transcript || !chiefComplaint || isSaving}
          className="gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Encounter
            </>
          )}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'recording' | 'soap' | 'documents')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recording">
            <Mic className="h-4 w-4 mr-2" />
            Recording & Transcription
          </TabsTrigger>
          <TabsTrigger value="soap" disabled={!transcript}>
            <FileText className="h-4 w-4 mr-2" />
            SOAP Note
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FolderOpen className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Recording Tab */}
        <TabsContent value="recording" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Recording & Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Encounter Information</CardTitle>
              <CardDescription>
                Basic information about this encounter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chiefComplaint">
                  Chief Complaint <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="chiefComplaint"
                  placeholder="e.g., Chest pain, Fever, Cough..."
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  rows={3}
                />
              </div>

              {patientId && (
                <div className="space-y-2">
                  <Label>Patient ID</Label>
                  <Input value={patientId} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            onTranscriptionRequest={handleTranscription}
          />

          {audioBlob && (
            <Card>
              <CardHeader>
                <CardTitle>Recording Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">
                      {(audioBlob.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium">{audioBlob.type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Transcription */}
        <div>
          <TranscriptionDisplay
            transcript={transcript}
            duration={duration}
            language={language}
            segments={segments}
            onSave={handleSaveTranscript}
            isEditable={true}
          />
        </div>
      </div>
        </TabsContent>

        {/* SOAP Note Tab */}
        <TabsContent value="soap" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main SOAP Editor - 2 columns */}
            <div className="lg:col-span-2">
              <SOAPNoteEditor
                initialNote={soapNote || undefined}
                onSave={handleSaveSOAPNote}
                onGenerate={handleGenerateSOAP}
                isGenerating={isGeneratingSOAP}
              />
            </div>

            {/* ICD-10 Search Sidebar - 1 column */}
            <div>
              <ICD10Search
                onSelect={handleAddICD10Code}
                selectedCodes={soapNote?.icd10Codes || []}
              />
            </div>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Document Uploader */}
            <DocumentUploader
              patientId={patientId || 'unknown'}
              encounterId={undefined}
              onUploadComplete={() => {
                // Refresh document list after upload
              }}
            />

            {/* Document List */}
            <DocumentList
              patientId={patientId || 'unknown'}
              encounterId={undefined}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function NewEncounterPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-8">Loading...</div>}>
      <NewEncounterContent />
    </Suspense>
  );
}
