'use client';

/**
 * Prescription List Component
 * 
 * Displays and manages patient prescriptions with:
 * - Active and historical prescriptions
 * - Status tracking
 * - Print/send functionality
 * - Edit and cancel options
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pill, 
  Printer, 
  Send, 
  Edit, 
  X,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface Prescription {
  id: string;
  medicationName: string;
  genericName?: string;
  dosage: string;
  form: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  instructions: string;
  indication?: string;
  prescribedDate: Date;
  status: 'draft' | 'sent' | 'filled' | 'cancelled';
  prescriber?: string;
  pharmacy?: string;
}

interface PrescriptionListProps {
  prescriptions: Prescription[];
  onEdit?: (prescription: Prescription) => void;
  onCancel?: (prescriptionId: string) => void;
  onSend?: (prescriptionId: string) => void;
  onPrint?: (prescriptionId: string) => void;
}

export default function PrescriptionList({
  prescriptions,
  onEdit,
  onCancel,
  onSend,
  onPrint,
}: PrescriptionListProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'filled' | 'cancelled'>('all');

  const getStatusBadge = (status: Prescription['status']) => {
    const variants = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      sent: { color: 'bg-blue-100 text-blue-800', icon: Send },
      filled: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const { color, icon: Icon } = variants[status];

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    if (filter === 'all') return true;
    if (filter === 'active') return rx.status === 'sent' || rx.status === 'draft';
    return rx.status === filter;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Prescriptions
            </CardTitle>
            <CardDescription>
              {prescriptions.length} prescription{prescriptions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            {(['all', 'active', 'filled', 'cancelled'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredPrescriptions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No prescriptions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{rx.medicationName}</h3>
                      {getStatusBadge(rx.status)}
                    </div>
                    {rx.genericName && (
                      <p className="text-sm text-gray-600">Generic: {rx.genericName}</p>
                    )}
                    {rx.indication && (
                      <p className="text-sm text-gray-600">For: {rx.indication}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {rx.status === 'draft' && onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(rx)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {(rx.status === 'draft' || rx.status === 'sent') && onSend && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSend(rx.id)}
                        title="Send to Pharmacy"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {onPrint && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPrint(rx.id)}
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    )}
                    {rx.status !== 'cancelled' && rx.status !== 'filled' && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(rx.id)}
                        title="Cancel"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Dosage</p>
                    <p className="font-medium">{rx.dosage} {rx.form}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Frequency</p>
                    <p className="font-medium">{rx.frequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">{rx.quantity}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Refills</p>
                    <p className="font-medium">{rx.refills}</p>
                  </div>
                </div>

                {/* Additional Info */}
                {(rx.duration || rx.instructions) && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {rx.duration && (
                      <div className="text-sm">
                        <span className="text-gray-500">Duration: </span>
                        <span className="font-medium">{rx.duration}</span>
                      </div>
                    )}
                    {rx.instructions && (
                      <div className="text-sm">
                        <span className="text-gray-500">Instructions: </span>
                        <span>{rx.instructions}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-gray-500">
                  <span>Prescribed: {formatDate(rx.prescribedDate)}</span>
                  {rx.prescriber && <span>By: {rx.prescriber}</span>}
                  {rx.pharmacy && <span>Pharmacy: {rx.pharmacy}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
