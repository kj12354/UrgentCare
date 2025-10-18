'use client';

/**
 * SOAP Note Editor Component
 * 
 * Professional medical documentation editor with:
 * - Structured SOAP format (Subjective, Objective, Assessment, Plan)
 * - ICD-10 code management
 * - Medication tracking
 * - Edit/view modes
 * - Auto-save functionality
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Edit3, 
  Save, 
  Copy, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Pill,
  Stethoscope,
  ClipboardList,
  Activity
} from 'lucide-react';
import { SOAPNote, ICD10Code, Medication } from '@/lib/claude';

interface SOAPNoteEditorProps {
  initialNote?: Partial<SOAPNote>;
  onSave?: (note: SOAPNote) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  readOnly?: boolean;
}

export default function SOAPNoteEditor({
  initialNote,
  onSave,
  onGenerate,
  isGenerating = false,
  readOnly = false,
}: SOAPNoteEditorProps) {
  const [note, setNote] = useState<Partial<SOAPNote>>(initialNote || {});
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('soap');

  // Update note when initialNote changes
  useEffect(() => {
    if (initialNote) {
      setNote(initialNote);
      setHasChanges(false);
    }
  }, [initialNote]);

  const updateField = (field: keyof SOAPNote, value: any) => {
    setNote(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    if (onSave && isValidNote(note)) {
      onSave(note as SOAPNote);
      setHasChanges(false);
    }
  };

  const handleCopy = async () => {
    const formatted = formatSOAPForCopy(note);
    await navigator.clipboard.writeText(formatted);
  };

  const addICD10Code = () => {
    const newCode: ICD10Code = {
      code: '',
      description: '',
      confidence: 'medium',
    };
    updateField('icd10Codes', [...(note.icd10Codes || []), newCode]);
  };

  const updateICD10Code = (index: number, field: keyof ICD10Code, value: any) => {
    const codes = [...(note.icd10Codes || [])];
    codes[index] = { ...codes[index], [field]: value };
    updateField('icd10Codes', codes);
  };

  const removeICD10Code = (index: number) => {
    const codes = [...(note.icd10Codes || [])];
    codes.splice(index, 1);
    updateField('icd10Codes', codes);
  };

  const addMedication = () => {
    const newMed: Medication = {
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
    };
    updateField('medications', [...(note.medications || []), newMed]);
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const meds = [...(note.medications || [])];
    meds[index] = { ...meds[index], [field]: value };
    updateField('medications', meds);
  };

  const removeMedication = (index: number) => {
    const meds = [...(note.medications || [])];
    meds.splice(index, 1);
    updateField('medications', meds);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <CardTitle>SOAP Note</CardTitle>
                <CardDescription>
                  {note.chiefComplaint || 'No chief complaint recorded'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onGenerate && (
                <Button
                  onClick={onGenerate}
                  disabled={isGenerating}
                  variant="outline"
                  size="sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'AI Generate'}
                </Button>
              )}
              {!readOnly && (
                <>
                  <Button
                    onClick={() => setIsEditing(!isEditing)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {isEditing ? 'Preview' : 'Edit'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </>
              )}
              <Button onClick={handleCopy} variant="ghost" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="soap">
            <Stethoscope className="h-4 w-4 mr-2" />
            SOAP
          </TabsTrigger>
          <TabsTrigger value="codes">
            <ClipboardList className="h-4 w-4 mr-2" />
            ICD-10 Codes
          </TabsTrigger>
          <TabsTrigger value="medications">
            <Pill className="h-4 w-4 mr-2" />
            Medications
          </TabsTrigger>
          <TabsTrigger value="details">
            <Activity className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* SOAP Tab */}
        <TabsContent value="soap" className="space-y-4">
          {/* Subjective */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subjective</CardTitle>
              <CardDescription>Patient's reported symptoms and history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Chief Complaint</label>
                    <Input
                      value={note.chiefComplaint || ''}
                      onChange={(e) => updateField('chiefComplaint', e.target.value)}
                      placeholder="Brief description of main complaint"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">History of Present Illness (HPI)</label>
                    <Textarea
                      value={note.hpi || ''}
                      onChange={(e) => updateField('hpi', e.target.value)}
                      placeholder="Detailed history of the present illness..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Review of Systems (ROS)</label>
                    <Textarea
                      value={note.ros || ''}
                      onChange={(e) => updateField('ros', e.target.value)}
                      placeholder="Systematic review of body systems..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {note.chiefComplaint && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Chief Complaint</p>
                      <p className="mt-1">{note.chiefComplaint}</p>
                    </div>
                  )}
                  {note.hpi && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">HPI</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.hpi}</p>
                    </div>
                  )}
                  {note.ros && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">ROS</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.ros}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Objective */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Objective</CardTitle>
              <CardDescription>Observable findings and measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Physical Examination</label>
                    <Textarea
                      value={note.physicalExam || ''}
                      onChange={(e) => updateField('physicalExam', e.target.value)}
                      placeholder="Vital signs, physical exam findings..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Additional Objective Findings</label>
                    <Textarea
                      value={note.objective || ''}
                      onChange={(e) => updateField('objective', e.target.value)}
                      placeholder="Lab results, imaging, other objective data..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {note.physicalExam && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Physical Exam</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.physicalExam}</p>
                    </div>
                  )}
                  {note.objective && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Additional Findings</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.objective}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assessment</CardTitle>
              <CardDescription>Clinical impression and diagnosis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Clinical Assessment</label>
                    <Textarea
                      value={note.assessment || ''}
                      onChange={(e) => updateField('assessment', e.target.value)}
                      placeholder="Clinical reasoning, differential diagnosis..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Diagnoses (one per line)</label>
                    <Textarea
                      value={note.diagnosis?.join('\n') || ''}
                      onChange={(e) => updateField('diagnosis', e.target.value.split('\n').filter(d => d.trim()))}
                      placeholder="Primary diagnosis&#10;Secondary diagnosis"
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {note.assessment && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Clinical Assessment</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.assessment}</p>
                    </div>
                  )}
                  {note.diagnosis && note.diagnosis.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Diagnoses</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        {note.diagnosis.map((dx, i) => (
                          <li key={i}>{dx}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan</CardTitle>
              <CardDescription>Treatment plan and follow-up</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="text-sm font-medium">Treatment Plan</label>
                    <Textarea
                      value={note.plan || ''}
                      onChange={(e) => updateField('plan', e.target.value)}
                      placeholder="Treatment recommendations, patient education..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Follow-Up Instructions</label>
                    <Textarea
                      value={note.followUp || ''}
                      onChange={(e) => updateField('followUp', e.target.value)}
                      placeholder="Follow-up appointments, when to return..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {note.plan && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Treatment Plan</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.plan}</p>
                    </div>
                  )}
                  {note.followUp && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Follow-Up</p>
                      <p className="mt-1 whitespace-pre-wrap">{note.followUp}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ICD-10 Codes Tab */}
        <TabsContent value="codes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ICD-10 Codes</CardTitle>
                  <CardDescription>Diagnosis codes for billing and records</CardDescription>
                </div>
                {isEditing && (
                  <Button onClick={addICD10Code} size="sm">
                    Add Code
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {note.icd10Codes && note.icd10Codes.length > 0 ? (
                <div className="space-y-3">
                  {note.icd10Codes.map((code, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {isEditing ? (
                        <>
                          <div className="flex-1 space-y-2">
                            <Input
                              value={code.code}
                              onChange={(e) => updateICD10Code(index, 'code', e.target.value)}
                              placeholder="ICD-10 Code (e.g., J06.9)"
                              className="font-mono"
                            />
                            <Input
                              value={code.description}
                              onChange={(e) => updateICD10Code(index, 'description', e.target.value)}
                              placeholder="Description"
                            />
                            <select
                              value={code.confidence}
                              onChange={(e) => updateICD10Code(index, 'confidence', e.target.value)}
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="high">High Confidence</option>
                              <option value="medium">Medium Confidence</option>
                              <option value="low">Low Confidence</option>
                            </select>
                          </div>
                          <Button
                            onClick={() => removeICD10Code(index)}
                            variant="ghost"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono font-semibold">{code.code}</code>
                            <Badge variant={
                              code.confidence === 'high' ? 'default' :
                              code.confidence === 'medium' ? 'secondary' : 'outline'
                            }>
                              {code.confidence}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{code.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No ICD-10 codes added yet</p>
                  {isEditing && (
                    <Button onClick={addICD10Code} variant="outline" size="sm" className="mt-2">
                      Add First Code
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medications Tab */}
        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Medications</CardTitle>
                  <CardDescription>Prescribed medications and instructions</CardDescription>
                </div>
                {isEditing && (
                  <Button onClick={addMedication} size="sm">
                    Add Medication
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {note.medications && note.medications.length > 0 ? (
                <div className="space-y-3">
                  {note.medications.map((med, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      {isEditing ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={med.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              placeholder="Medication name"
                            />
                            <Input
                              value={med.dosage}
                              onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                              placeholder="Dosage (e.g., 500mg)"
                            />
                            <Input
                              value={med.frequency}
                              onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                              placeholder="Frequency (e.g., twice daily)"
                            />
                            <Input
                              value={med.duration}
                              onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                              placeholder="Duration (e.g., 7 days)"
                            />
                          </div>
                          <Input
                            value={med.instructions || ''}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="Special instructions (optional)"
                          />
                          <Button
                            onClick={() => removeMedication(index)}
                            variant="ghost"
                            size="sm"
                          >
                            Remove
                          </Button>
                        </>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold">{med.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {med.dosage} - {med.frequency} for {med.duration}
                          </p>
                          {med.instructions && (
                            <p className="text-sm text-gray-500 mt-1 italic">{med.instructions}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No medications prescribed</p>
                  {isEditing && (
                    <Button onClick={addMedication} variant="outline" size="sm" className="mt-2">
                      Add First Medication
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Procedures and other information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div>
                  <label className="text-sm font-medium">Procedures Performed (one per line)</label>
                  <Textarea
                    value={note.procedures?.join('\n') || ''}
                    onChange={(e) => updateField('procedures', e.target.value.split('\n').filter(p => p.trim()))}
                    placeholder="List procedures performed..."
                    rows={4}
                    className="mt-1"
                  />
                </div>
              ) : (
                <div>
                  {note.procedures && note.procedures.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Procedures</p>
                      <ul className="list-disc list-inside space-y-1">
                        {note.procedures.map((proc, i) => (
                          <li key={i}>{proc}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No procedures recorded</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      {hasChanges && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span>You have unsaved changes</span>
        </div>
      )}
    </div>
  );
}

// Helper functions
function isValidNote(note: Partial<SOAPNote>): note is SOAPNote {
  return !!(note.subjective || note.objective || note.assessment || note.plan);
}

function formatSOAPForCopy(note: Partial<SOAPNote>): string {
  let formatted = '';
  
  if (note.chiefComplaint) {
    formatted += `CHIEF COMPLAINT\n${note.chiefComplaint}\n\n`;
  }
  
  formatted += `SUBJECTIVE\n`;
  if (note.hpi) formatted += `HPI: ${note.hpi}\n`;
  if (note.ros) formatted += `ROS: ${note.ros}\n`;
  formatted += '\n';
  
  formatted += `OBJECTIVE\n`;
  if (note.physicalExam) formatted += `Physical Exam: ${note.physicalExam}\n`;
  if (note.objective) formatted += `${note.objective}\n`;
  formatted += '\n';
  
  formatted += `ASSESSMENT\n`;
  if (note.assessment) formatted += `${note.assessment}\n`;
  if (note.diagnosis && note.diagnosis.length > 0) {
    formatted += `Diagnoses:\n${note.diagnosis.map(d => `- ${d}`).join('\n')}\n`;
  }
  formatted += '\n';
  
  formatted += `PLAN\n`;
  if (note.plan) formatted += `${note.plan}\n`;
  if (note.followUp) formatted += `Follow-up: ${note.followUp}\n`;
  
  if (note.icd10Codes && note.icd10Codes.length > 0) {
    formatted += `\nICD-10 CODES\n`;
    note.icd10Codes.forEach(code => {
      formatted += `${code.code} - ${code.description}\n`;
    });
  }
  
  if (note.medications && note.medications.length > 0) {
    formatted += `\nMEDICATIONS\n`;
    note.medications.forEach(med => {
      formatted += `${med.name} ${med.dosage} - ${med.frequency} for ${med.duration}\n`;
      if (med.instructions) formatted += `  ${med.instructions}\n`;
    });
  }
  
  return formatted;
}
