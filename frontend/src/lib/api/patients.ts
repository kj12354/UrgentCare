/**
 * Patient API service
 * Handles all patient-related API calls
 */

import { apiClient } from '../api-client';
import { Patient } from '@/types/patient';

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dob: string; // ISO date string
  phone?: string;
}

export interface UpdatePatientDto {
  firstName: string;
  lastName: string;
  dob: string; // ISO date string
  phone?: string;
}

export const patientApi = {
  /**
   * Get all patients
   */
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/api/patients');
  },

  /**
   * Get patient by ID
   */
  async getById(id: string): Promise<Patient> {
    return apiClient.get<Patient>(`/api/patients/${id}`);
  },

  /**
   * Search patients by name or phone
   */
  async search(query: string): Promise<Patient[]> {
    return apiClient.get<Patient[]>(`/api/patients/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Create new patient
   */
  async create(data: CreatePatientDto): Promise<Patient> {
    return apiClient.post<Patient>('/api/patients', data);
  },

  /**
   * Update existing patient
   */
  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    return apiClient.put<Patient>(`/api/patients/${id}`, data);
  },

  /**
   * Delete patient
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/patients/${id}`);
  },
};
