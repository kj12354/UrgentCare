'use client';

/**
 * Lab Order Form Component
 * 
 * Professional lab order creation with:
 * - Common lab panels
 * - Individual test selection
 * - Urgency levels
 * - Special instructions
 * - ICD-10 code association
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FlaskConical, 
  Search, 
  Plus,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';

export interface LabTest {
  code: string;
  name: string;
  category: string;
  description?: string;
}

export interface LabOrder {
  id?: string;
  tests: LabTest[];
  urgency: 'routine' | 'urgent' | 'stat';
  clinicalInfo: string;
  icd10Codes: string[];
  specialInstructions?: string;
  fastingRequired?: boolean;
  collectionDate?: Date;
  status?: 'pending' | 'collected' | 'processing' | 'completed' | 'cancelled';
}

interface LabOrderFormProps {
  patientId: string;
  encounterId?: string;
  initialOrder?: Partial<LabOrder>;
  onSave?: (order: LabOrder) => void;
  onCancel?: () => void;
}

const COMMON_PANELS = [
  {
    name: 'Basic Metabolic Panel (BMP)',
    tests: [
      { code: 'BMP', name: 'Basic Metabolic Panel', category: 'Chemistry' },
    ],
  },
  {
    name: 'Comprehensive Metabolic Panel (CMP)',
    tests: [
      { code: 'CMP', name: 'Comprehensive Metabolic Panel', category: 'Chemistry' },
    ],
  },
  {
    name: 'Complete Blood Count (CBC)',
    tests: [
      { code: 'CBC', name: 'Complete Blood Count with Differential', category: 'Hematology' },
    ],
  },
  {
    name: 'Lipid Panel',
    tests: [
      { code: 'LIPID', name: 'Lipid Panel', category: 'Chemistry' },
    ],
  },
  {
    name: 'Thyroid Panel',
    tests: [
      { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Endocrinology' },
      { code: 'T4', name: 'Free T4', category: 'Endocrinology' },
      { code: 'T3', name: 'Free T3', category: 'Endocrinology' },
    ],
  },
  {
    name: 'Liver Function Tests (LFT)',
    tests: [
      { code: 'LFT', name: 'Liver Function Panel', category: 'Chemistry' },
    ],
  },
  {
    name: 'Hemoglobin A1C',
    tests: [
      { code: 'HBA1C', name: 'Hemoglobin A1C', category: 'Chemistry' },
    ],
  },
  {
    name: 'Urinalysis',
    tests: [
      { code: 'UA', name: 'Urinalysis Complete', category: 'Urinalysis' },
    ],
  },
];

const INDIVIDUAL_TESTS = [
  { code: 'GLUCOSE', name: 'Glucose', category: 'Chemistry' },
  { code: 'CREAT', name: 'Creatinine', category: 'Chemistry' },
  { code: 'BUN', name: 'Blood Urea Nitrogen', category: 'Chemistry' },
  { code: 'NA', name: 'Sodium', category: 'Chemistry' },
  { code: 'K', name: 'Potassium', category: 'Chemistry' },
  { code: 'CL', name: 'Chloride', category: 'Chemistry' },
  { code: 'CO2', name: 'Carbon Dioxide', category: 'Chemistry' },
  { code: 'CA', name: 'Calcium', category: 'Chemistry' },
  { code: 'WBC', name: 'White Blood Cell Count', category: 'Hematology' },
  { code: 'RBC', name: 'Red Blood Cell Count', category: 'Hematology' },
  { code: 'HGB', name: 'Hemoglobin', category: 'Hematology' },
  { code: 'HCT', name: 'Hematocrit', category: 'Hematology' },
  { code: 'PLT', name: 'Platelet Count', category: 'Hematology' },
  { code: 'PT', name: 'Prothrombin Time', category: 'Coagulation' },
  { code: 'PTT', name: 'Partial Thromboplastin Time', category: 'Coagulation' },
  { code: 'INR', name: 'INR', category: 'Coagulation' },
];

export default function LabOrderForm({
  patientId,
  encounterId,
  initialOrder,
  onSave,
  onCancel,
}: LabOrderFormProps) {
  const [order, setOrder] = useState<Partial<LabOrder>>(
    initialOrder || {
      tests: [],
      urgency: 'routine',
      clinicalInfo: '',
      icd10Codes: [],
      fastingRequired: false,
      status: 'pending',
    }
  );

  const [searchQuery, setSearchQuery] = useState('');

  const handleAddPanel = (panel: typeof COMMON_PANELS[0]) => {
    setOrder(prev => ({
      ...prev,
      tests: [...(prev.tests || []), ...panel.tests],
    }));
  };

  const handleToggleTest = (test: LabTest) => {
    setOrder(prev => {
      const tests = prev.tests || [];
      const exists = tests.some(t => t.code === test.code);
      
      return {
        ...prev,
        tests: exists
          ? tests.filter(t => t.code !== test.code)
          : [...tests, test],
      };
    });
  };

  const isTestSelected = (testCode: string): boolean => {
    return (order.tests || []).some(t => t.code === testCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order.tests || order.tests.length === 0) {
      alert('Please select at least one test');
      return;
    }

    if (!order.clinicalInfo) {
      alert('Please provide clinical information');
      return;
    }

    const completeOrder: LabOrder = {
      tests: order.tests,
      urgency: order.urgency || 'routine',
      clinicalInfo: order.clinicalInfo || '',
      icd10Codes: order.icd10Codes || [],
      specialInstructions: order.specialInstructions,
      fastingRequired: order.fastingRequired,
      status: 'pending',
    };

    onSave?.(completeOrder);
  };

  const filteredTests = INDIVIDUAL_TESTS.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          New Lab Order
        </CardTitle>
        <CardDescription>
          Order laboratory tests for the patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Common Panels */}
          <div className="space-y-2">
            <Label>Common Lab Panels</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_PANELS.map((panel) => (
                <Button
                  key={panel.name}
                  type="button"
                  variant="outline"
                  onClick={() => handleAddPanel(panel)}
                  className="justify-start h-auto py-2"
                >
                  <Plus className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-left">{panel.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Individual Tests */}
          <div className="space-y-2">
            <Label>Individual Tests</Label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tests..."
                className="pl-10"
              />
            </div>
            <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
              {filteredTests.map((test) => (
                <div key={test.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={test.code}
                    checked={isTestSelected(test.code)}
                    onCheckedChange={() => handleToggleTest(test)}
                  />
                  <label
                    htmlFor={test.code}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <span className="font-medium">{test.name}</span>
                    <span className="text-gray-500 ml-2">({test.code})</span>
                  </label>
                  <Badge variant="secondary" className="text-xs">
                    {test.category}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Tests */}
          {order.tests && order.tests.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Tests ({order.tests.length})</Label>
              <div className="flex flex-wrap gap-2">
                {order.tests.map((test) => (
                  <Badge key={test.code} variant="default">
                    {test.name}
                    <button
                      type="button"
                      onClick={() => handleToggleTest(test)}
                      className="ml-2 hover:text-red-200"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Urgency */}
          <div className="space-y-2">
            <Label>Urgency *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['routine', 'urgent', 'stat'] as const).map((urgency) => (
                <Button
                  key={urgency}
                  type="button"
                  variant={order.urgency === urgency ? 'default' : 'outline'}
                  onClick={() => setOrder({ ...order, urgency })}
                  className="justify-start"
                >
                  {urgency === 'routine' && <Clock className="h-4 w-4 mr-2" />}
                  {urgency === 'urgent' && <AlertCircle className="h-4 w-4 mr-2" />}
                  {urgency === 'stat' && <Zap className="h-4 w-4 mr-2" />}
                  {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Clinical Information */}
          <div className="space-y-2">
            <Label htmlFor="clinicalInfo">Clinical Information *</Label>
            <Textarea
              id="clinicalInfo"
              value={order.clinicalInfo}
              onChange={(e) => setOrder({ ...order, clinicalInfo: e.target.value })}
              placeholder="Reason for testing, symptoms, diagnosis..."
              rows={3}
              required
            />
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              value={order.specialInstructions}
              onChange={(e) => setOrder({ ...order, specialInstructions: e.target.value })}
              placeholder="Any special handling or collection instructions..."
              rows={2}
            />
          </div>

          {/* Fasting Required */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fasting"
              checked={order.fastingRequired}
              onCheckedChange={(checked) => 
                setOrder({ ...order, fastingRequired: checked as boolean })
              }
            />
            <label htmlFor="fasting" className="text-sm cursor-pointer">
              Fasting required (8-12 hours)
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <FlaskConical className="h-4 w-4 mr-2" />
              Create Lab Order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
