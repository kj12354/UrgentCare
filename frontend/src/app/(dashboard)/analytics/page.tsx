'use client';

/**
 * Analytics Dashboard Page
 * 
 * Comprehensive analytics and reporting with:
 * - Key performance indicators
 * - Patient volume trends
 * - Revenue metrics
 * - Common diagnoses
 * - Prescription patterns
 * - Provider productivity
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Activity, 
  DollarSign, 
  TrendingUp,
  Calendar,
  FileText,
  Pill,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  totalPatients: number;
  totalEncounters: number;
  totalRevenue: number;
  averageWaitTime: number;
  patientGrowth: number;
  encounterGrowth: number;
  revenueGrowth: number;
  commonDiagnoses: Array<{ code: string; description: string; count: number }>;
  topPrescriptions: Array<{ medication: string; count: number }>;
  encountersByDay: Array<{ day: string; count: number }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demonstration
  const mockData: AnalyticsData = {
    totalPatients: 1247,
    totalEncounters: 3891,
    totalRevenue: 487650,
    averageWaitTime: 18,
    patientGrowth: 12.5,
    encounterGrowth: 8.3,
    revenueGrowth: 15.7,
    commonDiagnoses: [
      { code: 'J06.9', description: 'Upper respiratory infection', count: 234 },
      { code: 'I10', description: 'Essential hypertension', count: 189 },
      { code: 'E11.9', description: 'Type 2 diabetes', count: 156 },
      { code: 'M54.5', description: 'Low back pain', count: 142 },
      { code: 'J02.9', description: 'Acute pharyngitis', count: 128 },
    ],
    topPrescriptions: [
      { medication: 'Amoxicillin', count: 312 },
      { medication: 'Lisinopril', count: 267 },
      { medication: 'Metformin', count: 245 },
      { medication: 'Ibuprofen', count: 198 },
      { medication: 'Azithromycin', count: 176 },
    ],
    encountersByDay: [
      { day: 'Mon', count: 87 },
      { day: 'Tue', count: 92 },
      { day: 'Wed', count: 95 },
      { day: 'Thu', count: 89 },
      { day: 'Fri', count: 102 },
      { day: 'Sat', count: 45 },
      { day: 'Sun', count: 23 },
    ],
  };

  const data = analytics || mockData;

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    prefix = '',
    suffix = '' 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: any; 
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{value.toLocaleString()}{suffix}
        </div>
        {change !== undefined && (
          <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Overview of clinic performance and metrics</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Patients"
          value={data.totalPatients}
          change={data.patientGrowth}
          icon={Users}
        />
        <StatCard
          title="Total Encounters"
          value={data.totalEncounters}
          change={data.encounterGrowth}
          icon={Activity}
        />
        <StatCard
          title="Total Revenue"
          value={data.totalRevenue}
          change={data.revenueGrowth}
          icon={DollarSign}
          prefix="$"
        />
        <StatCard
          title="Avg Wait Time"
          value={data.averageWaitTime}
          icon={Clock}
          suffix=" min"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Encounters by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Encounters by Day</CardTitle>
            <CardDescription>Weekly encounter distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.encountersByDay.map((day) => {
                const maxCount = Math.max(...data.encountersByDay.map(d => d.count));
                const percentage = (day.count / maxCount) * 100;
                
                return (
                  <div key={day.day} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.day}</span>
                      <span className="text-gray-600">{day.count} encounters</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Common Diagnoses */}
        <Card>
          <CardHeader>
            <CardTitle>Common Diagnoses</CardTitle>
            <CardDescription>Top 5 diagnoses this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.commonDiagnoses.map((diagnosis, index) => (
                <div key={diagnosis.code} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{diagnosis.description}</p>
                    <p className="text-xs text-gray-500">{diagnosis.code}</p>
                  </div>
                  <div className="flex-shrink-0 text-sm font-semibold text-gray-700">
                    {diagnosis.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle>Top Prescriptions</CardTitle>
            <CardDescription>Most prescribed medications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPrescriptions.map((rx, index) => {
                const maxCount = Math.max(...data.topPrescriptions.map(r => r.count));
                const percentage = (rx.count / maxCount) * 100;
                
                return (
                  <div key={rx.medication} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{rx.medication}</span>
                      <span className="text-gray-600">{rx.count} prescriptions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Additional metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Avg Encounter Duration</span>
              <span className="font-semibold">24 min</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Patient Satisfaction</span>
              <span className="font-semibold">4.7/5.0</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">No-Show Rate</span>
              <span className="font-semibold">8.2%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-sm text-gray-600">Follow-up Rate</span>
              <span className="font-semibold">76.3%</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Avg Revenue/Encounter</span>
              <span className="font-semibold">$125</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
