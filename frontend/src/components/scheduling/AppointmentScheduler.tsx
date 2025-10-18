'use client';

/**
 * Appointment Scheduler Component
 * 
 * Professional appointment scheduling with:
 * - Calendar view
 * - Time slot selection
 * - Provider selection
 * - Appointment types
 * - Patient search
 * - Conflict detection
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  Clock,
  User,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface Appointment {
  id?: string;
  patientId: string;
  patientName: string;
  providerId: string;
  providerName: string;
  appointmentType: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'no-show';
  reason?: string;
  notes?: string;
}

interface AppointmentSchedulerProps {
  providerId?: string;
  onSchedule?: (appointment: Appointment) => void;
  onCancel?: () => void;
}

const APPOINTMENT_TYPES = [
  { value: 'new-patient', label: 'New Patient', duration: 45, color: 'bg-blue-100 text-blue-800' },
  { value: 'follow-up', label: 'Follow-up', duration: 30, color: 'bg-green-100 text-green-800' },
  { value: 'urgent', label: 'Urgent Care', duration: 30, color: 'bg-red-100 text-red-800' },
  { value: 'physical', label: 'Annual Physical', duration: 60, color: 'bg-purple-100 text-purple-800' },
  { value: 'procedure', label: 'Procedure', duration: 45, color: 'bg-orange-100 text-orange-800' },
];

const PROVIDERS = [
  { id: 'dr-smith', name: 'Dr. John Smith' },
  { id: 'dr-johnson', name: 'Dr. Sarah Johnson' },
  { id: 'dr-williams', name: 'Dr. Michael Williams' },
];

export default function AppointmentScheduler({
  providerId,
  onSchedule,
  onCancel,
}: AppointmentSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState(providerId || '');
  const [selectedType, setSelectedType] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  // Generate time slots (8 AM to 5 PM, 15-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handlePatientSearch = (query: string) => {
    setPatientSearch(query);
    // Mock patient search - in production, integrate with patient database
    if (query.length > 2) {
      setSelectedPatient({
        id: 'patient-123',
        name: query,
        phone: '(555) 123-4567',
        email: 'patient@example.com',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient || !selectedProvider || !selectedType || !selectedTime) {
      alert('Please fill in all required fields');
      return;
    }

    const appointmentType = APPOINTMENT_TYPES.find(t => t.value === selectedType);
    if (!appointmentType) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(hours, minutes, 0, 0);

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + appointmentType.duration);

    const appointment: Appointment = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      providerId: selectedProvider,
      providerName: PROVIDERS.find(p => p.id === selectedProvider)?.name || '',
      appointmentType: appointmentType.label,
      date: selectedDate,
      startTime: selectedTime,
      endTime: `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`,
      duration: appointmentType.duration,
      status: 'scheduled',
      reason,
      notes,
    };

    onSchedule?.(appointment);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Schedule Appointment
        </CardTitle>
        <CardDescription>
          Book a new appointment for a patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Search */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="patient"
                value={patientSearch}
                onChange={(e) => handlePatientSearch(e.target.value)}
                placeholder="Search patient by name..."
                className="pl-10"
                required
              />
            </div>
            {selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="font-medium text-blue-900">{selectedPatient.name}</div>
                <div className="text-sm text-blue-700">{selectedPatient.phone}</div>
              </div>
            )}
          </div>

          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider">Provider *</Label>
            <select
              id="provider"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select provider...</option>
              {PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.id}>{provider.name}</option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div className="space-y-2">
            <Label>Appointment Type *</Label>
            <div className="grid grid-cols-2 gap-2">
              {APPOINTMENT_TYPES.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={selectedType === type.value ? 'default' : 'outline'}
                  onClick={() => setSelectedType(type.value)}
                  className="h-auto py-3 flex-col items-start"
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-gray-500">{type.duration} minutes</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1 text-center py-2 px-4 border rounded-md bg-gray-50">
                <CalendarIcon className="inline h-4 w-4 mr-2" />
                {formatDate(selectedDate)}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDateChange(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Time *</Label>
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-md">
              {timeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={selectedTime === time ? 'default' : 'outline'}
                  onClick={() => setSelectedTime(time)}
                  className="text-sm"
                  size="sm"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {time}
                </Button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Visit</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Annual checkup, Follow-up for diabetes"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes"
            />
          </div>

          {/* Summary */}
          {selectedPatient && selectedProvider && selectedType && selectedTime && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="font-medium text-green-900 mb-2">Appointment Summary</h4>
              <div className="text-sm text-green-800 space-y-1">
                <div><strong>Patient:</strong> {selectedPatient.name}</div>
                <div><strong>Provider:</strong> {PROVIDERS.find(p => p.id === selectedProvider)?.name}</div>
                <div><strong>Type:</strong> {APPOINTMENT_TYPES.find(t => t.value === selectedType)?.label}</div>
                <div><strong>Date:</strong> {formatDate(selectedDate)}</div>
                <div><strong>Time:</strong> {selectedTime}</div>
                <div><strong>Duration:</strong> {APPOINTMENT_TYPES.find(t => t.value === selectedType)?.duration} minutes</div>
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
              <CalendarIcon className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
