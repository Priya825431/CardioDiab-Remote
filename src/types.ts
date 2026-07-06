/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  disease_type: 'diabetic' | 'cardiac' | 'both';
  physician: string;
  joined_date: string;
}

export interface Vitals {
  id: string;
  patient_id: string;
  glucose: number; // mg/dL
  systolic_bp: number; // mmHg
  diastolic_bp: number; // mmHg
  spo2: number; // %
  weight: number; // kg
  bmi: number;
  timestamp: string;
}

export interface WearableData {
  id: string;
  patient_id: string;
  heart_rate: number; // bpm
  hrv: number; // ms
  steps: number;
  sleep_hours: number;
  activity_level: 'low' | 'moderate' | 'high';
  timestamp: string;
}

export interface MedicationLog {
  id: string;
  patient_id: string;
  medication_name: string;
  prescribed_dose: number;
  taken_dose: number;
  adherence_percentage: number; // (taken_dose / prescribed_dose) * 100
  date: string;
}

export interface DietLog {
  id: string;
  patient_id: string;
  meal_name: string;
  calories: number;
  sugar: number; // grams
  sodium: number; // mg
  fat: number; // grams
  timestamp: string;
}

export interface Alert {
  id: string;
  patient_id: string;
  patient_name: string;
  risk_score: number;
  priority: 'Critical' | 'High' | 'Moderate' | 'Low';
  message: string;
  trigger_metrics: string[];
  timestamp: string;
  status: 'active' | 'resolved';
  resolution?: string;
}

export interface MLPrediction {
  status: 'Stable' | 'Requires Intervention';
  confidence: number; // percentage
  narrative: string;
  risk_factors: string[];
  recommendation: string;
}

export interface RiskCalculationRequest {
  glucose: number;
  heart_rate: number;
  systolic_bp: number;
  spo2: number;
  diastolic_bp?: number;
  hrv?: number;
  activity_level?: 'low' | 'moderate' | 'high';
  steps?: number;
  sleep_hours?: number;
  medication_adherence?: number;
  sugar_intake?: number;
}

export interface RiskCalculationResponse {
  risk_score: number;
  priority: 'Critical' | 'High' | 'Moderate' | 'Low';
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'provider' | 'patient';
  patient_id?: string; // If role is 'patient', links to Patient
  specialty?: string;   // If role is 'provider'
  joined_date: string;
}

