'use client';

/**
 * Patient Portal Dashboard Component
 * 
 * Patient-facing dashboard with:
 * - Upcoming appointments
 * - Recent visits
 * - Test results
 * - Medications
 * - Messages
 * - Document access
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Appointment {
  id: string;
  date: Date;
  time: string;
  provider: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

interface TestResult {
  id: string;
  name: string;
  date: Date;
  status: 'pending' | 'ready' | 'reviewed';
  abnormal: boolean;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  refillsRemaining: number;
  prescribedDate: Date;
}

interface Message {
  id: string;
  from: string;
  subject: string;
  date: Date;
  read: boolean;
}

export default function PatientPortalDashboard() {
  // Mock data - in production, fetch from API
  const upcomingAppointments: Appointment[] = [
    {
      id: '1',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      provider: 'Dr. Sarah Johnson',
      type: 'Follow-up',
      status: 'upcoming',
    },
    {
      id: '2',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      time: '2:30 PM',
      provider: 'Dr. Michael Chen',
      type: 'Annual Physical',
      status: 'upcoming',
    },
  ];

  const testResults: TestResult[] = [
    {
      id: '1',
      name: 'Complete Blood Count',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'ready',
      abnormal: false,
    },
    {
      id: '2',
      name: 'Lipid Panel',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'ready',
      abnormal: true,
    },
  ];

  const medications: Medication[] = [
    {
      id: '1',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      refillsRemaining: 3,
      prescribedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      refillsRemaining: 0,
      prescribedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      from: 'Dr. Sarah Johnson',
      subject: 'Your recent lab results',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '2',
      from: 'UrgentCare Clinic',
      subject: 'Appointment reminder',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ];

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string, abnormal?: boolean) => {
    if (status === 'pending') {
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
    if (status === 'ready' && abnormal) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Abnormal</Badge>;
    }
    if (status === 'ready') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Ready</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Patient Portal</h1>
        <p className="text-gray-600">Welcome back! Here's your health overview.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button className="h-auto py-4 flex-col">
          <Calendar className="h-6 w-6 mb-2" />
          <span>Schedule Appointment</span>
        </Button>
        <Button className="h-auto py-4 flex-col" variant="outline">
          <MessageSquare className="h-6 w-6 mb-2" />
          <span>Message Provider</span>
        </Button>
        <Button className="h-auto py-4 flex-col" variant="outline">
          <Pill className="h-6 w-6 mb-2" />
          <span>Request Refill</span>
        </Button>
        <Button className="h-auto py-4 flex-col" variant="outline">
          <Download className="h-6 w-6 mb-2" />
          <span>Download Records</span>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>Your scheduled visits</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{apt.provider}</div>
                        <div className="text-sm text-gray-600">{apt.type}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(apt.date)} at {apt.time}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>Recent lab and imaging results</CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No test results available</p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(result.date)}
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(result.status, result.abnormal)}
                        </div>
                      </div>
                      {result.status === 'ready' && (
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Current Medications
            </CardTitle>
            <CardDescription>Your active prescriptions</CardDescription>
          </CardHeader>
          <CardContent>
            {medications.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active medications</p>
            ) : (
              <div className="space-y-3">
                {medications.map((med) => (
                  <div key={med.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{med.name} {med.dosage}</div>
                        <div className="text-sm text-gray-600">{med.frequency}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {med.refillsRemaining} refills remaining
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={med.refillsRemaining === 0 ? 'default' : 'outline'}
                      >
                        {med.refillsRemaining === 0 ? 'Request Refill' : 'Refill'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
              {messages.filter(m => !m.read).length > 0 && (
                <Badge className="ml-2 bg-red-500">
                  {messages.filter(m => !m.read).length} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Communications with your care team</CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No messages</p>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-4 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                      !msg.read ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{msg.from}</div>
                          {!msg.read && (
                            <Badge className="bg-blue-500 text-xs">New</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{msg.subject}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(msg.date)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Health Summary</CardTitle>
          <CardDescription>Quick overview of your health information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">A+</div>
              <div className="text-sm text-gray-600 mt-1">Blood Type</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">120/80</div>
              <div className="text-sm text-gray-600 mt-1">Blood Pressure</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">5.6%</div>
              <div className="text-sm text-gray-600 mt-1">HbA1c</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">180</div>
              <div className="text-sm text-gray-600 mt-1">Cholesterol</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
