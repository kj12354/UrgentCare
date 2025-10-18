'use client';

/**
 * Imaging Order Form Component
 * 
 * Professional imaging order creation with:
 * - Modality selection (X-Ray, CT, MRI, Ultrasound)
 * - Body part/region selection
 * - Urgency levels
 * - Clinical indication
 * - Contrast requirements
 * - Special instructions
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
  Scan, 
  AlertCircle,
  Clock,
  Zap,
  Activity
} from 'lucide-react';

export interface ImagingOrder {
  id?: string;
  modality: string;
  bodyPart: string;
  laterality?: 'left' | 'right' | 'bilateral';
  urgency: 'routine' | 'urgent' | 'stat';
  clinicalIndication: string;
  icd10Codes: string[];
  contrastRequired?: boolean;
  contrastType?: string;
  specialInstructions?: string;
  pregnancyStatus?: 'not_pregnant' | 'pregnant' | 'unknown';
  renalFunction?: string;
  allergies?: string;
  status?: 'pending' | 'scheduled' | 'completed' | 'cancelled';
  orderDate?: Date;
}

interface ImagingOrderFormProps {
  patientId: string;
  encounterId?: string;
  initialOrder?: Partial<ImagingOrder>;
  onSave?: (order: ImagingOrder) => void;
  onCancel?: () => void;
}

const MODALITIES = [
  { value: 'xray', label: 'X-Ray', icon: '📷' },
  { value: 'ct', label: 'CT Scan', icon: '🔍' },
  { value: 'mri', label: 'MRI', icon: '🧲' },
  { value: 'ultrasound', label: 'Ultrasound', icon: '🔊' },
  { value: 'mammography', label: 'Mammography', icon: '🎗️' },
  { value: 'dexa', label: 'DEXA Scan', icon: '🦴' },
  { value: 'nuclear', label: 'Nuclear Medicine', icon: '☢️' },
];

const BODY_PARTS: Record<string, string[]> = {
  xray: [
    'Chest',
    'Abdomen',
    'Spine (Cervical)',
    'Spine (Thoracic)',
    'Spine (Lumbar)',
    'Shoulder',
    'Elbow',
    'Wrist',
    'Hand',
    'Hip',
    'Knee',
    'Ankle',
    'Foot',
  ],
  ct: [
    'Head',
    'Chest',
    'Abdomen/Pelvis',
    'Spine',
    'Extremity',
  ],
  mri: [
    'Brain',
    'Spine (Cervical)',
    'Spine (Thoracic)',
    'Spine (Lumbar)',
    'Shoulder',
    'Knee',
    'Ankle',
  ],
  ultrasound: [
    'Abdomen',
    'Pelvis',
    'Thyroid',
    'Carotid',
    'Venous Doppler',
    'Arterial Doppler',
  ],
  mammography: ['Bilateral Breasts', 'Unilateral Breast'],
  dexa: ['Hip and Spine', 'Forearm'],
  nuclear: ['Bone Scan', 'Cardiac Stress Test', 'Thyroid Scan'],
};

export default function ImagingOrderForm({
  patientId,
  encounterId,
  initialOrder,
  onSave,
  onCancel,
}: ImagingOrderFormProps) {
  const [order, setOrder] = useState<Partial<ImagingOrder>>(
    initialOrder || {
      modality: '',
      bodyPart: '',
      urgency: 'routine',
      clinicalIndication: '',
      icd10Codes: [],
      contrastRequired: false,
      pregnancyStatus: 'unknown',
      status: 'pending',
    }
  );

  const handleModalityChange = (modality: string) => {
    setOrder({
      ...order,
      modality,
      bodyPart: '', // Reset body part when modality changes
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order.modality || !order.bodyPart || !order.clinicalIndication) {
      alert('Please fill in all required fields');
      return;
    }

    const completeOrder: ImagingOrder = {
      modality: order.modality || '',
      bodyPart: order.bodyPart || '',
      laterality: order.laterality,
      urgency: order.urgency || 'routine',
      clinicalIndication: order.clinicalIndication || '',
      icd10Codes: order.icd10Codes || [],
      contrastRequired: order.contrastRequired,
      contrastType: order.contrastType,
      specialInstructions: order.specialInstructions,
      pregnancyStatus: order.pregnancyStatus,
      renalFunction: order.renalFunction,
      allergies: order.allergies,
      status: 'pending',
      orderDate: new Date(),
    };

    onSave?.(completeOrder);
  };

  const availableBodyParts = order.modality ? BODY_PARTS[order.modality] || [] : [];
  const requiresLaterality = order.bodyPart && 
    ['Shoulder', 'Elbow', 'Wrist', 'Hand', 'Hip', 'Knee', 'Ankle', 'Foot'].includes(order.bodyPart);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          New Imaging Order
        </CardTitle>
        <CardDescription>
          Order diagnostic imaging studies
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Modality Selection */}
          <div className="space-y-2">
            <Label>Imaging Modality *</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {MODALITIES.map((modality) => (
                <Button
                  key={modality.value}
                  type="button"
                  variant={order.modality === modality.value ? 'default' : 'outline'}
                  onClick={() => handleModalityChange(modality.value)}
                  className="h-auto py-3 flex-col"
                >
                  <span className="text-2xl mb-1">{modality.icon}</span>
                  <span className="text-xs">{modality.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Body Part Selection */}
          {order.modality && (
            <div className="space-y-2">
              <Label htmlFor="bodyPart">Body Part/Region *</Label>
              <select
                id="bodyPart"
                value={order.bodyPart}
                onChange={(e) => setOrder({ ...order, bodyPart: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Select body part...</option>
                {availableBodyParts.map(part => (
                  <option key={part} value={part}>{part}</option>
                ))}
              </select>
            </div>
          )}

          {/* Laterality */}
          {requiresLaterality && (
            <div className="space-y-2">
              <Label>Laterality</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['left', 'right', 'bilateral'] as const).map((lat) => (
                  <Button
                    key={lat}
                    type="button"
                    variant={order.laterality === lat ? 'default' : 'outline'}
                    onClick={() => setOrder({ ...order, laterality: lat })}
                  >
                    {lat.charAt(0).toUpperCase() + lat.slice(1)}
                  </Button>
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

          {/* Clinical Indication */}
          <div className="space-y-2">
            <Label htmlFor="clinicalIndication">Clinical Indication *</Label>
            <Textarea
              id="clinicalIndication"
              value={order.clinicalIndication}
              onChange={(e) => setOrder({ ...order, clinicalIndication: e.target.value })}
              placeholder="Reason for imaging, symptoms, relevant history..."
              rows={3}
              required
            />
          </div>

          {/* Contrast */}
          {(order.modality === 'ct' || order.modality === 'mri') && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="contrast"
                  checked={order.contrastRequired}
                  onCheckedChange={(checked) => 
                    setOrder({ ...order, contrastRequired: checked as boolean })
                  }
                />
                <label htmlFor="contrast" className="text-sm cursor-pointer">
                  Contrast required
                </label>
              </div>

              {order.contrastRequired && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="contrastType">Contrast Type</Label>
                    <select
                      id="contrastType"
                      value={order.contrastType}
                      onChange={(e) => setOrder({ ...order, contrastType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select contrast type...</option>
                      <option value="IV">IV Contrast</option>
                      <option value="Oral">Oral Contrast</option>
                      <option value="Both">Both IV and Oral</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renalFunction">Renal Function (eGFR)</Label>
                    <Input
                      id="renalFunction"
                      value={order.renalFunction}
                      onChange={(e) => setOrder({ ...order, renalFunction: e.target.value })}
                      placeholder="e.g., >60 mL/min/1.73m²"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergies">Contrast Allergies</Label>
                    <Input
                      id="allergies"
                      value={order.allergies}
                      onChange={(e) => setOrder({ ...order, allergies: e.target.value })}
                      placeholder="Any known contrast allergies"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pregnancy Status */}
          {(order.modality === 'xray' || order.modality === 'ct') && (
            <div className="space-y-2">
              <Label>Pregnancy Status</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['not_pregnant', 'pregnant', 'unknown'] as const).map((status) => (
                  <Button
                    key={status}
                    type="button"
                    variant={order.pregnancyStatus === status ? 'default' : 'outline'}
                    onClick={() => setOrder({ ...order, pregnancyStatus: status })}
                    className="text-xs"
                  >
                    {status === 'not_pregnant' && 'Not Pregnant'}
                    {status === 'pregnant' && 'Pregnant'}
                    {status === 'unknown' && 'Unknown'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <Textarea
              id="specialInstructions"
              value={order.specialInstructions}
              onChange={(e) => setOrder({ ...order, specialInstructions: e.target.value })}
              placeholder="Any special positioning, views, or considerations..."
              rows={2}
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
              <Scan className="h-4 w-4 mr-2" />
              Create Imaging Order
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
