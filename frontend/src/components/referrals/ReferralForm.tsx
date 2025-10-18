'use client';

/**
 * Referral Form Component
 * 
 * Professional referral creation with:
 * - Specialty selection
 * - Provider search
 * - Urgency levels
 * - Clinical information
 * - Insurance verification
 * - Document attachment
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Search, 
  AlertCircle,
  Clock,
  Zap,
  FileText,
  Phone,
  MapPin
} from 'lucide-react';

export interface Referral {
  id?: string;
  specialty: string;
  providerName?: string;
  providerPhone?: string;
  providerAddress?: string;
  urgency: 'routine' | 'urgent' | 'stat';
  reason: string;
  clinicalSummary: string;
  diagnosis: string;
  icd10Codes: string[];
  requestedServices?: string;
  insuranceVerified?: boolean;
  attachedDocuments?: string[];
  status?: 'pending' | 'sent' | 'scheduled' | 'completed' | 'cancelled';
  referralDate?: Date;
  expirationDate?: Date;
}

interface ReferralFormProps {
  patientId: string;
  encounterId?: string;
  initialReferral?: Partial<Referral>;
  onSave?: (referral: Referral) => void;
  onCancel?: () => void;
}

const SPECIALTIES = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Obstetrics/Gynecology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology (ENT)',
  'Physical Therapy',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Surgery',
  'Urology',
];

export default function ReferralForm({
  patientId,
  encounterId,
  initialReferral,
  onSave,
  onCancel,
}: ReferralFormProps) {
  const [referral, setReferral] = useState<Partial<Referral>>(
    initialReferral || {
      specialty: '',
      urgency: 'routine',
      reason: '',
      clinicalSummary: '',
      diagnosis: '',
      icd10Codes: [],
      insuranceVerified: false,
      status: 'pending',
    }
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [providerResults, setProviderResults] = useState<any[]>([]);

  const handleProviderSearch = async (query: string) => {
    if (query.length < 3) {
      setProviderResults([]);
      return;
    }

    // Mock provider search - in production, integrate with provider directory
    const mockProviders = [
      {
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        phone: '(555) 123-4567',
        address: '123 Medical Plaza, Suite 200',
      },
      {
        name: 'Dr. Michael Chen',
        specialty: 'Orthopedics',
        phone: '(555) 234-5678',
        address: '456 Health Center, Floor 3',
      },
      {
        name: 'Dr. Emily Rodriguez',
        specialty: 'Dermatology',
        phone: '(555) 345-6789',
        address: '789 Wellness Blvd, Suite 100',
      },
    ];

    const filtered = mockProviders.filter(
      p => p.name.toLowerCase().includes(query.toLowerCase()) ||
           p.specialty.toLowerCase().includes(query.toLowerCase())
    );

    setProviderResults(filtered);
  };

  const handleSelectProvider = (provider: any) => {
    setReferral(prev => ({
      ...prev,
      providerName: provider.name,
      providerPhone: provider.phone,
      providerAddress: provider.address,
      specialty: provider.specialty,
    }));
    setSearchQuery('');
    setProviderResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!referral.specialty || !referral.reason || !referral.clinicalSummary) {
      alert('Please fill in all required fields');
      return;
    }

    const completeReferral: Referral = {
      specialty: referral.specialty || '',
      providerName: referral.providerName,
      providerPhone: referral.providerPhone,
      providerAddress: referral.providerAddress,
      urgency: referral.urgency || 'routine',
      reason: referral.reason || '',
      clinicalSummary: referral.clinicalSummary || '',
      diagnosis: referral.diagnosis || '',
      icd10Codes: referral.icd10Codes || [],
      requestedServices: referral.requestedServices,
      insuranceVerified: referral.insuranceVerified,
      attachedDocuments: referral.attachedDocuments,
      status: 'pending',
      referralDate: new Date(),
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    };

    onSave?.(completeReferral);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          New Referral
        </CardTitle>
        <CardDescription>
          Create a referral to a specialist or service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Specialty Selection */}
          <div className="space-y-2">
            <Label htmlFor="specialty">Specialty *</Label>
            <select
              id="specialty"
              value={referral.specialty}
              onChange={(e) => setReferral({ ...referral, specialty: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select specialty...</option>
              {SPECIALTIES.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          {/* Provider Search */}
          <div className="space-y-2">
            <Label htmlFor="provider">Referring To (Optional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="provider"
                value={searchQuery || referral.providerName}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleProviderSearch(e.target.value);
                }}
                placeholder="Search provider name..."
                className="pl-10"
              />
            </div>

            {/* Provider Search Results */}
            {providerResults.length > 0 && (
              <div className="border rounded-md mt-2 max-h-48 overflow-y-auto">
                {providerResults.map((provider, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectProvider(provider)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{provider.name}</div>
                    <div className="text-sm text-gray-600">{provider.specialty}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <Phone className="inline h-3 w-3 mr-1" />
                      {provider.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Provider Info */}
            {referral.providerName && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="font-medium text-blue-900">{referral.providerName}</div>
                {referral.providerPhone && (
                  <div className="text-sm text-blue-700 mt-1">
                    <Phone className="inline h-3 w-3 mr-1" />
                    {referral.providerPhone}
                  </div>
                )}
                {referral.providerAddress && (
                  <div className="text-sm text-blue-700 mt-1">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    {referral.providerAddress}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <Label>Urgency *</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['routine', 'urgent', 'stat'] as const).map((urgency) => (
                <Button
                  key={urgency}
                  type="button"
                  variant={referral.urgency === urgency ? 'default' : 'outline'}
                  onClick={() => setReferral({ ...referral, urgency })}
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

          {/* Reason for Referral */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Referral *</Label>
            <Input
              id="reason"
              value={referral.reason}
              onChange={(e) => setReferral({ ...referral, reason: e.target.value })}
              placeholder="e.g., Evaluation of chest pain, Management of diabetes"
              required
            />
          </div>

          {/* Clinical Summary */}
          <div className="space-y-2">
            <Label htmlFor="clinicalSummary">Clinical Summary *</Label>
            <Textarea
              id="clinicalSummary"
              value={referral.clinicalSummary}
              onChange={(e) => setReferral({ ...referral, clinicalSummary: e.target.value })}
              placeholder="Relevant history, symptoms, findings, and treatments..."
              rows={4}
              required
            />
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnosis</Label>
            <Input
              id="diagnosis"
              value={referral.diagnosis}
              onChange={(e) => setReferral({ ...referral, diagnosis: e.target.value })}
              placeholder="Primary diagnosis"
            />
          </div>

          {/* Requested Services */}
          <div className="space-y-2">
            <Label htmlFor="requestedServices">Requested Services</Label>
            <Textarea
              id="requestedServices"
              value={referral.requestedServices}
              onChange={(e) => setReferral({ ...referral, requestedServices: e.target.value })}
              placeholder="Specific tests, procedures, or consultations requested..."
              rows={2}
            />
          </div>

          {/* Insurance Verification */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="insuranceVerified"
              checked={referral.insuranceVerified}
              onChange={(e) => setReferral({ ...referral, insuranceVerified: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="insuranceVerified" className="text-sm cursor-pointer">
              Insurance verified and referral authorized
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
              <UserPlus className="h-4 w-4 mr-2" />
              Create Referral
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
