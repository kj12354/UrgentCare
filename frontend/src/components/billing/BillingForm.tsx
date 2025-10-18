'use client';

/**
 * Billing Form Component
 * 
 * Professional billing and insurance management with:
 * - CPT code selection
 * - ICD-10 code linking
 * - Insurance information
 * - Charge calculation
 * - Payment tracking
 * - Claim generation
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Plus,
  X,
  CreditCard,
  FileText,
  Search
} from 'lucide-react';

export interface BillingCode {
  code: string;
  description: string;
  charge: number;
  units: number;
}

export interface Insurance {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName?: string;
  relationship?: string;
  copay?: number;
}

export interface Claim {
  id?: string;
  encounterId: string;
  patientId: string;
  codes: BillingCode[];
  icd10Codes: string[];
  insurance?: Insurance;
  totalCharges: number;
  insurancePayment?: number;
  patientPayment?: number;
  balance: number;
  status: 'draft' | 'submitted' | 'paid' | 'denied' | 'partial';
  submittedDate?: Date;
}

interface BillingFormProps {
  encounterId: string;
  patientId: string;
  icd10Codes?: string[];
  onSave?: (claim: Claim) => void;
  onCancel?: () => void;
}

const COMMON_CPT_CODES = [
  { code: '99213', description: 'Office visit - established patient, moderate', charge: 125.00 },
  { code: '99214', description: 'Office visit - established patient, detailed', charge: 175.00 },
  { code: '99203', description: 'Office visit - new patient, moderate', charge: 150.00 },
  { code: '99204', description: 'Office visit - new patient, detailed', charge: 200.00 },
  { code: '99205', description: 'Office visit - new patient, comprehensive', charge: 250.00 },
  { code: '99211', description: 'Office visit - minimal', charge: 75.00 },
  { code: '99212', description: 'Office visit - problem focused', charge: 100.00 },
  { code: '36415', description: 'Venipuncture', charge: 25.00 },
  { code: '81000', description: 'Urinalysis', charge: 15.00 },
  { code: '85025', description: 'Complete blood count', charge: 35.00 },
  { code: '80053', description: 'Comprehensive metabolic panel', charge: 45.00 },
  { code: '93000', description: 'Electrocardiogram', charge: 85.00 },
];

export default function BillingForm({
  encounterId,
  patientId,
  icd10Codes = [],
  onSave,
  onCancel,
}: BillingFormProps) {
  const [selectedCodes, setSelectedCodes] = useState<BillingCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [insurance, setInsurance] = useState<Partial<Insurance>>({});
  const [hasInsurance, setHasInsurance] = useState(true);
  const [insurancePayment, setInsurancePayment] = useState<number>(0);
  const [patientPayment, setPatientPayment] = useState<number>(0);

  const handleAddCode = (cptCode: typeof COMMON_CPT_CODES[0]) => {
    const exists = selectedCodes.find(c => c.code === cptCode.code);
    if (exists) {
      // Increment units
      setSelectedCodes(selectedCodes.map(c => 
        c.code === cptCode.code ? { ...c, units: c.units + 1 } : c
      ));
    } else {
      setSelectedCodes([...selectedCodes, { ...cptCode, units: 1 }]);
    }
  };

  const handleRemoveCode = (code: string) => {
    setSelectedCodes(selectedCodes.filter(c => c.code !== code));
  };

  const handleUpdateUnits = (code: string, units: number) => {
    if (units < 1) {
      handleRemoveCode(code);
      return;
    }
    setSelectedCodes(selectedCodes.map(c => 
      c.code === code ? { ...c, units } : c
    ));
  };

  const calculateTotal = () => {
    return selectedCodes.reduce((sum, code) => sum + (code.charge * code.units), 0);
  };

  const calculateBalance = () => {
    const total = calculateTotal();
    return total - insurancePayment - patientPayment;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedCodes.length === 0) {
      alert('Please add at least one billing code');
      return;
    }

    const totalCharges = calculateTotal();
    const balance = calculateBalance();

    const claim: Claim = {
      encounterId,
      patientId,
      codes: selectedCodes,
      icd10Codes,
      insurance: hasInsurance ? insurance as Insurance : undefined,
      totalCharges,
      insurancePayment: insurancePayment || 0,
      patientPayment: patientPayment || 0,
      balance,
      status: balance === 0 ? 'paid' : 'draft',
    };

    onSave?.(claim);
  };

  const filteredCodes = COMMON_CPT_CODES.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Billing & Insurance
        </CardTitle>
        <CardDescription>
          Create claim and manage billing for this encounter
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* CPT Code Search */}
          <div className="space-y-2">
            <Label>Add Billing Codes (CPT)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search CPT codes..."
                className="pl-10"
              />
            </div>
            <div className="border rounded-md max-h-48 overflow-y-auto">
              {filteredCodes.map((code) => (
                <button
                  key={code.code}
                  type="button"
                  onClick={() => handleAddCode(code)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium">{code.code}</div>
                    <div className="text-sm text-gray-600">{code.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${code.charge.toFixed(2)}</div>
                    <Plus className="h-4 w-4 text-blue-600 ml-auto" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Codes */}
          {selectedCodes.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Codes</Label>
              <div className="border rounded-md divide-y">
                {selectedCodes.map((code) => (
                  <div key={code.code} className="p-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{code.code}</div>
                      <div className="text-sm text-gray-600">{code.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Units:</Label>
                      <Input
                        type="number"
                        value={code.units}
                        onChange={(e) => handleUpdateUnits(code.code, parseInt(e.target.value))}
                        className="w-16 text-center"
                        min="1"
                      />
                    </div>
                    <div className="text-right w-24">
                      <div className="font-semibold">
                        ${(code.charge * code.units).toFixed(2)}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCode(code.code)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance Information */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasInsurance"
                checked={hasInsurance}
                onChange={(e) => setHasInsurance(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="hasInsurance" className="text-sm font-medium cursor-pointer">
                Patient has insurance
              </label>
            </div>

            {hasInsurance && (
              <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="provider">Insurance Provider</Label>
                    <Input
                      id="provider"
                      value={insurance.provider}
                      onChange={(e) => setInsurance({ ...insurance, provider: e.target.value })}
                      placeholder="e.g., Blue Cross"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="policyNumber">Policy Number</Label>
                    <Input
                      id="policyNumber"
                      value={insurance.policyNumber}
                      onChange={(e) => setInsurance({ ...insurance, policyNumber: e.target.value })}
                      placeholder="Policy #"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="groupNumber">Group Number</Label>
                    <Input
                      id="groupNumber"
                      value={insurance.groupNumber}
                      onChange={(e) => setInsurance({ ...insurance, groupNumber: e.target.value })}
                      placeholder="Group #"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copay">Copay Amount</Label>
                    <Input
                      id="copay"
                      type="number"
                      step="0.01"
                      value={insurance.copay}
                      onChange={(e) => setInsurance({ ...insurance, copay: parseFloat(e.target.value) })}
                      placeholder="$0.00"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Information */}
          <div className="space-y-3">
            <Label>Payment Information</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="insurancePayment">Insurance Payment</Label>
                <Input
                  id="insurancePayment"
                  type="number"
                  step="0.01"
                  value={insurancePayment}
                  onChange={(e) => setInsurancePayment(parseFloat(e.target.value) || 0)}
                  placeholder="$0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientPayment">Patient Payment</Label>
                <Input
                  id="patientPayment"
                  type="number"
                  step="0.01"
                  value={patientPayment}
                  onChange={(e) => setPatientPayment(parseFloat(e.target.value) || 0)}
                  placeholder="$0.00"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          {selectedCodes.length > 0 && (
            <div className="p-4 bg-gray-50 border rounded-md space-y-2">
              <h4 className="font-medium">Billing Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Charges:</span>
                  <span className="font-semibold">${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Insurance Payment:</span>
                  <span className="font-semibold">-${insurancePayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Patient Payment:</span>
                  <span className="font-semibold">-${patientPayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t font-bold text-base">
                  <span>Balance Due:</span>
                  <span className={calculateBalance() > 0 ? 'text-red-600' : 'text-green-600'}>
                    ${calculateBalance().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit">
              <FileText className="h-4 w-4 mr-2" />
              Create Claim
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
