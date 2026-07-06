/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users, 
  Activity, 
  ShieldAlert, 
  Database,
  CloudLightning,
  ChevronRight,
  TrendingDown,
  User,
  Clock,
  LogOut,
  Stethoscope
} from 'lucide-react';
import ProviderDashboard from './components/ProviderDashboard';
import PatientDashboard from './components/PatientDashboard';
import AuthScreen from './components/AuthScreen';
import { Patient, Vitals, WearableData, MedicationLog, DietLog, Alert, UserAccount } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activePortal, setActivePortal] = useState<'provider' | 'patient'>('provider');
  
  // App state
  const [patients, setPatients] = useState<(Patient & { 
    risk_score: number; 
    priority: 'Critical' | 'High' | 'Moderate' | 'Low';
    vitals: Vitals | null;
    wearable: WearableData | null;
    medication: MedicationLog | null;
    diet: DietLog | null;
    triggers: string[];
  })[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Selected Patient for Patient Logger Portal switch
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat-1');
  const [loading, setLoading] = useState(true);
  const [syncCount, setSyncCount] = useState(0);

  // Load session from localStorage on startup
  useEffect(() => {
    const stored = localStorage.getItem('cardio_user');
    if (stored) {
      try {
        const user = JSON.parse(stored) as UserAccount;
        setCurrentUser(user);
        setActivePortal(user.role);
        if (user.role === 'patient' && user.patient_id) {
          setSelectedPatientId(user.patient_id);
        }
      } catch (err) {
        console.error("Failed to restore authentication state:", err);
      }
    }
  }, []);

  const fetchCohortData = async () => {
    try {
      // Load current patient queue
      const patientsRes = await fetch('/api/patients');
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
        
        // Match selection based on patient authentication if logged in
        if (currentUser?.role === 'patient' && currentUser.patient_id) {
          setSelectedPatientId(currentUser.patient_id);
        } else if (patientsData.length > 0 && !patientsData.find((p: any) => p.id === selectedPatientId)) {
          setSelectedPatientId(patientsData[0].id);
        }
      }

      // Load alert signals
      const logRes = await fetch('/api/alerts');
      if (logRes.ok) {
        const alertsData = await logRes.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error("Clinical server fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCohortData();
  }, [syncCount, currentUser]);

  const triggerDataRefresh = () => {
    setSyncCount(prev => prev + 1);
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('cardio_user', JSON.stringify(user));
    setActivePortal(user.role);
    if (user.role === 'patient' && user.patient_id) {
      setSelectedPatientId(user.patient_id);
    }
    triggerDataRefresh();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cardio_user');
  };

  // If there is no active session, prompt registration or login
  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-indigo-100 flex flex-col">
      
      {/* Top Application Header */}
      <header className="bg-white border-b border-gray-150 sticky top-0 z-40 shadow-xxs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-rose-500 to-indigo-600 text-white rounded-xl shadow-sm">
              <Heart className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-gray-900 font-sans">
                CardioDiab Remote Monitoring
              </h1>
              <p className="text-xxs font-semibold font-mono text-indigo-600 flex items-center">
                <Database className="h-3 w-3 mr-1" />
                <span>CLINICAL DECISION SERVER &bull; SECURE CONTEXT</span>
              </p>
            </div>
          </div>

          {/* Nav switcher tabbed menu / Patient lock */}
          {currentUser.role === 'provider' ? (
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                onClick={() => setActivePortal('provider')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                  activePortal === 'provider'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-150'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Provider Dashboard</span>
              </button>
              <button
                onClick={() => setActivePortal('patient')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                  activePortal === 'patient'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-150'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <User className="h-4 w-4" />
                <span>Patient Log Portal</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-xl shadow-xxs">
              <Activity className="h-4 w-4 text-rose-600 animate-pulse" />
              <span>Personal Tracking Terminal (HIPAA Locked)</span>
            </div>
          )}

          {/* Quick sync stats, User badge & Sign Out button */}
          <div className="flex items-center space-x-4">
            
            {/* Logged in User Profile Info Tag */}
            <div className="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 pl-3 pr-4 py-1.5 rounded-xl">
              <div className="h-7 w-7 rounded-lg bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-700">
                {currentUser.role === 'provider' ? (
                  <Stethoscope className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4 text-rose-600" />
                )}
              </div>
              <div className="text-left">
                <p className="text-xxs font-bold text-slate-800 leading-tight">{currentUser.name}</p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide leading-none mt-0.5">
                  {currentUser.role === 'provider' ? (currentUser.specialty || 'Healthcare Specialist') : 'Patient'}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              id="header-logout-btn"
              title="Sign Out of Session"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all duration-150 flex items-center justify-center cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>

            <span className="text-gray-250 hidden sm:inline">|</span>

            {/* Sync counter */}
            <div className="hidden sm:flex items-center space-x-2 text-xxs font-mono text-gray-500">
              <button 
                onClick={triggerDataRefresh}
                className="hover:text-indigo-600 flex items-center space-x-1 cursor-pointer"
              >
                <CloudLightning className="h-3 w-3 text-green-500 animate-pulse" />
                <span>Sync Queue</span>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading && patients.length === 0 ? (
          <div id="app-loading-screen" className="flex flex-col items-center justify-center py-40 space-y-3">
            <Activity className="h-10 w-10 text-indigo-600 animate-spin" />
            <h3 className="text-sm font-semibold text-gray-700">Connecting CardioDiab telemetry clusters...</h3>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Direct Warning Indicator if Alerts exist */}
            {activePortal === 'patient' && alerts.some(a => a.patient_id === selectedPatientId && a.status === 'active') && (
              <div id="patient-advisory-banner" className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between text-xs text-rose-800">
                <span className="inline-flex items-center font-semibold">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-600 mr-2 animate-bounce" />
                  <span>Clinical Attention Flagged: Your physician has been notified due to critical vital trends.</span>
                </span>
                <span className="font-mono text-rose-500 font-bold">Unresolved telemetry alert</span>
              </div>
            )}

            {/* Render portal selection active portal */}
            {activePortal === 'provider' ? (
              <ProviderDashboard 
                patients={patients} 
                alerts={alerts} 
                onRefreshData={triggerDataRefresh} 
              />
            ) : (
              <PatientDashboard
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onRefreshData={triggerDataRefresh}
                isRestrictedPatient={currentUser.role === 'patient'}
              />
            )}

          </div>
        )}

      </main>

      {/* Hospital Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-slate-800 rounded text-rose-500 font-bold">
              <Heart className="h-4 w-4" />
            </div>
            <p className="font-mono font-medium">CardioDiab v1.0 &bull; Remote Chronic Illness Prioritization Cluster</p>
          </div>
          <p className="text-slate-500 text-xxs font-mono">
            Complies completely with remote clinical vital monitoring protocols & HIPAA standards. For review and simulation only.
          </p>
        </div>
      </footer>

    </div>
  );
}
