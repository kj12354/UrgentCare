"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Edit2, Save } from "lucide-react";

interface TranscriptionSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface TranscriptionDisplayProps {
  transcript: string;
  duration?: number;
  language?: string;
  segments?: TranscriptionSegment[];
  onSave?: (editedTranscript: string) => void;
  isEditable?: boolean;
}

export function TranscriptionDisplay({
  transcript,
  duration,
  language,
  segments,
  onSave,
  isEditable = true,
}: TranscriptionDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcript);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText(transcript);
    setIsEditing(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transcription</CardTitle>
            <CardDescription>
              {duration && `Duration: ${formatDuration(duration)}`}
              {language && ` • Language: ${language.toUpperCase()}`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing && isEditable && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              </>
            )}
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
            placeholder="Edit transcription..."
          />
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {editedText}
              </p>
            </div>

            {segments && segments.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">Segments</h4>
                  <Badge variant="secondary">{segments.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0 font-mono text-xs">
                          {formatTimestamp(segment.start)}
                        </Badge>
                        <p className="text-sm flex-1">{segment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!transcript && !isEditing && (
          <div className="text-center py-12 text-gray-500">
            <p>No transcription available yet.</p>
            <p className="text-sm mt-2">Record audio and click "Transcribe" to generate text.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
