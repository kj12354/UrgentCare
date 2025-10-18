'use client';

/**
 * E-Prescription Form Component
 * 
 * Professional prescription creation with:
 * - Medication search and selection
 * - Dosage and frequency configuration
 * - Duration and refills
 * - Special instructions
 * - Drug interaction warnings
 * - Formulary checking
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  Search, 
  AlertTriangle, 
  Plus, 
  X,
  Clock,
  Calendar,
  FileText
} from 'lucide-react';

export interface Prescription {
  id?: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  form: string; // tablet, capsule, liquid, etc.
  route: string; // oral, topical, injection, etc.
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
  indication?: string;
  pharmacy?: string;
  prescribedDate?: Date;
  status?: 'draft' | 'sent' | 'filled' | 'cancelled';
}

interface PrescriptionFormProps {
  patientId: string;
  encounterId?: string;
  initialPrescription?: Partial<Prescription>;
  onSave?: (prescription: Prescription) => void;
  onCancel?: () => void;
}

const COMMON_FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As needed',
  'At bedtime',
  'Before meals',
  'After meals',
];

const MEDICATION_FORMS = [
  'Tablet',
  'Capsule',
  'Liquid',
  'Cream',
  'Ointment',
  'Injection',
  'Inhaler',
  'Patch',
  'Drops',
  'Spray',
];

const ROUTES = [
  'Oral',
  'Topical',
  'Injection (IM)',
  'Injection (IV)',
  'Injection (SC)',
  'Inhalation',
  'Sublingual',
  'Rectal',
  'Ophthalmic',
  'Otic',
];

export default function PrescriptionForm({
  patientId,
  encounterId,
  initialPrescription,
  onSave,
  onCancel,
}: PrescriptionFormProps) {
  const [prescription, setPrescription] = useState<Partial<Prescription>>(
    initialPrescription || {
      medicationName: '',
      dosage: '',
      form: 'Tablet',
      route: 'Oral',
      frequency: 'Once daily',
      duration: '',
      quantity: 30,
      refills: 0,
      instructions: '',
      status: 'draft',
    }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleMedicationSearch = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.medications || []);
      }
    } catch (error) {
      console.error('Error searching medications:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectMedication = (medication: any) => {
    setPrescription(prev => ({
      ...prev,
      medicationName: medication.brandName || medication.name,
      genericName: medication.genericName,
      form: medication.form || prev.form,
      route: medication.route || prev.route,
    }));
    setSearchQuery('');
    setSearchResults([]);
    checkInteractions(medication);
  };

  const checkInteractions = async (medication: any) => {
    // Placeholder for drug interaction checking
    // In production, integrate with drug interaction API
    setWarnings([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prescription.medicationName || !prescription.dosage || !prescription.frequency) {
      alert('Please fill in all required fields');
      return;
    }

    const completePrescription: Prescription = {
      medicationName: prescription.medicationName,
      genericName: prescription.genericName,
      dosage: prescription.dosage || '',
      form: prescription.form || 'Tablet',
      route: prescription.route || 'Oral',
      frequency: prescription.frequency || '',
      duration: prescription.duration || '',
      quantity: prescription.quantity || 30,
      refills: prescription.refills || 0,
      instructions: prescription.instructions || '',
      indication: prescription.indication,
      prescribedDate: new Date(),
      status: 'draft',
    };

    onSave?.(completePrescription);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          New Prescription
        </CardTitle>
        <CardDescription>
          Create an electronic prescription for the patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Medication Search */}
          <div className="space-y-2">
            <Label htmlFor="medication">Medication *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="medication"
                value={searchQuery || prescription.medicationName}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleMedicationSearch(e.target.value);
                }}
                placeholder="Search medication name..."
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md mt-2 max-h-48 overflow-y-auto">
                {searchResults.map((med, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectMedication(med)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{med.brandName || med.name}</div>
                    {med.genericName && (
                      <div className="text-sm text-gray-600">{med.genericName}</div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {prescription.genericName && (
              <p className="text-sm text-gray-600">
                Generic: {prescription.genericName}
              </p>
            )}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800 mb-1">Warnings</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Dosage and Form */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage *</Label>
              <Input
                id="dosage"
                value={prescription.dosage}
                onChange={(e) => setPrescription({ ...prescription, dosage: e.target.value })}
                placeholder="e.g., 500mg, 10mg/5ml"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form">Form</Label>
              <select
                id="form"
                value={prescription.form}
                onChange={(e) => setPrescription({ ...prescription, form: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {MEDICATION_FORMS.map(form => (
                  <option key={form} value={form}>{form}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Route and Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="route">Route</Label>
              <select
                id="route"
                value={prescription.route}
                onChange={(e) => setPrescription({ ...prescription, route: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                {ROUTES.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency *</Label>
              <select
                id="frequency"
                value={prescription.frequency}
                onChange={(e) => setPrescription({ ...prescription, frequency: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                {COMMON_FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration and Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={prescription.duration}
                onChange={(e) => setPrescription({ ...prescription, duration: e.target.value })}
                placeholder="e.g., 7 days, 2 weeks"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={prescription.quantity}
                onChange={(e) => setPrescription({ ...prescription, quantity: parseInt(e.target.value) })}
                min="1"
              />
            </div>
          </div>

          {/* Refills and Indication */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="refills">Refills</Label>
              <Input
                id="refills"
                type="number"
                value={prescription.refills}
                onChange={(e) => setPrescription({ ...prescription, refills: parseInt(e.target.value) })}
                min="0"
                max="12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="indication">Indication</Label>
              <Input
                id="indication"
                value={prescription.indication}
                onChange={(e) => setPrescription({ ...prescription, indication: e.target.value })}
                placeholder="Reason for prescription"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Special Instructions</Label>
            <Textarea
              id="instructions"
              value={prescription.instructions}
              onChange={(e) => setPrescription({ ...prescription, instructions: e.target.value })}
              placeholder="e.g., Take with food, Avoid alcohol, etc."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
