/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Search, 
  Plus, 
  Check, 
  Droplet, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  ArrowRight,
  UserPlus,
  RefreshCw,
  FolderLock,
  Flame,
  Brain,
  ChevronDown,
  Loader2,
  Calendar
} from 'lucide-react';
import { Patient, Vitals, WearableData, MedicationLog, DietLog, Alert, MLPrediction } from '../types';

interface ProviderDashboardProps {
  patients: (Patient & { 
    risk_score: number; 
    priority: 'Critical' | 'High' | 'Moderate' | 'Low';
    vitals: Vitals | null;
    wearable: WearableData | null;
    medication: MedicationLog | null;
    diet: DietLog | null;
    triggers: string[];
  })[];
  alerts: Alert[];
  onRefreshData: () => void;
}

export default function ProviderDashboard({
  patients,
  alerts,
  onRefreshData
}: ProviderDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetails, setPatientDetails] = useState<any | null>(null);
  const [mlPrediction, setMlPrediction] = useState<MLPrediction | null>(null);
  const [loadingMl, setLoadingMl] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New registry enrollment state
  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAge, setRegAge] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regDisease, setRegDisease] = useState<'diabetic' | 'cardiac' | 'both'>('diabetic');
  const [regPhysician, setRegPhysician] = useState('Dr. Sarah Adams');

  // Form override on the spot for physicians state
  const [docVitalsOverride, setDocVitalsOverride] = useState(false);
  const [overrideGlucose, setOverrideGlucose] = useState('');
  const [overrideSystolic, setOverrideSystolic] = useState('');
  const [overrideDiastolic, setOverrideDiastolic] = useState('');
  const [overrideSpo2, setOverrideSpo2] = useState('');

  // Resolution modal note
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolutionPhysician, setResolutionPhysician] = useState('Dr. Sarah Adams');
  const [resolutionNote, setResolutionNote] = useState('');

  // Resolutions history
  const [resolutions, setResolutions] = useState<any[]>([]);

  const fetchResolutions = async () => {
    try {
      const res = await fetch('/api/resolutions');
      if (res.ok) {
        const data = await res.json();
        setResolutions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchResolutions();
  }, []);

  const handlePatientSelect = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setMlPrediction(null);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientDetails(data);
        // Reset overrides prefilled
        if (data.vitals) {
          setOverrideGlucose(data.vitals.glucose.toString());
          setOverrideSystolic(data.vitals.systolic_bp.toString());
          setOverrideDiastolic(data.vitals.diastolic_bp.toString());
          setOverrideSpo2(data.vitals.spo2.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const triggerMLPrediction = async (patientId: string) => {
    setLoadingMl(true);
    setMlPrediction(null);
    try {
      const res = await fetch(`/api/patients/${patientId}/ml-prediction`);
      if (res.ok) {
        const data = await res.json();
        setMlPrediction(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMl(false);
    }
  };

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regAge || !regPhysician) return;

    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          age: Number(regAge),
          gender: regGender,
          disease_type: regDisease,
          physician: regPhysician
        })
      });

      if (res.ok) {
        setRegName('');
        setRegAge('');
        setShowRegForm(false);
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !overrideGlucose || !overrideSystolic || !overrideDiastolic || !overrideSpo2) return;

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glucose: Number(overrideGlucose),
          systolic_bp: Number(overrideSystolic),
          diastolic_bp: Number(overrideDiastolic),
          spo2: Number(overrideSpo2),
          weight: 75 // Generic consult weights
        })
      });

      if (res.ok) {
        setDocVitalsOverride(false);
        handlePatientSelect(selectedPatientId);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveAlertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlertId) return;

    try {
      const res = await fetch(`/api/alerts/${resolvingAlertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physician: resolutionPhysician,
          note: resolutionNote
        })
      });

      if (res.ok) {
        setResolvingAlertId(null);
        setResolutionNote('');
        fetchResolutions();
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sparkline builder mapping over historical telemetry
  function Sparkline({ values, color, minVal, maxVal }: { values: number[], color: string, minVal: number, maxVal: number }) {
    if (!values || values.length === 0) return <span className="text-gray-400 text-xs text-mono">Steady</span>;
    const width = 200;
    const height = 40;
    const recent = [...values].slice(0, 7).reverse(); // max 7 records
    if (recent.length === 1) recent.push(recent[0]);

    const range = maxVal - minVal || 1;
    const coords = recent.map((val, idx) => {
      const x = (idx / (recent.length - 1)) * (width - 10) + 5;
      const normalizedY = (val - minVal) / range;
      const y = height - (normalizedY * (height - 10) + 5);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="h-10 w-44" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={coords}
        />
      </svg>
    );
  }

  // Filter cohort list
  const filteredPatients = patients.filter(p => {
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.disease_type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <div id="provider-portal-grid" className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      
      {/* Alert feeds and priority indexes (8 Cols) */}
      <div id="provider-main-feed" className="xl:col-span-8 space-y-6">

        {/* Priority Alert banner stack */}
        {activeAlerts.length > 0 && (
          <div id="alert-feed-container" className="p-5 bg-rose-50 border border-rose-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center text-rose-800 text-sm font-bold">
                <Flame className="h-5 w-5 text-rose-600 mr-2 animate-bounce" />
                <span>Active Clinical Alert Center ({activeAlerts.length})</span>
              </span>
              <span className="text-rose-600 font-mono text-xxs tracking-wider uppercase font-bold">High/Critical Vitals Detected</span>
            </div>

            <div className="space-y-3">
              {activeAlerts.map(alert => (
                <div key={alert.id} id={`alert-item-${alert.id}`} className="p-4 bg-white rounded-xl border border-rose-150 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xxs">
                  <div className="space-y-1 md:max-w-xl">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-900">{alert.patient_name}</span>
                      <span className={`text-xxs font-extrabold font-mono px-2 py-0.5 rounded uppercase tracking-wider ${alert.priority === 'Critical' ? 'bg-red-600 text-white animate-pulse' : 'bg-orange-500 text-white'}`}>
                        {alert.priority}
                      </span>
                      <span className="text-gray-400 font-mono text-xxs">Score: {alert.risk_score}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-mono">{alert.message}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handlePatientSelect(alert.patient_id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 border border-indigo-100"
                    >
                      Inspect Profile
                    </button>
                    <button
                      onClick={() => setResolvingAlertId(alert.id)}
                      className="text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 rounded-lg flex items-center shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      <span>Take Action</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority Patients Queue */}
        <div id="patients-queue" className="bg-white rounded-2xl border border-gray-150 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-sans">Prioritized Patient Care Queue</h3>
              <p className="text-xs text-gray-500 mt-0.5">Continuous clinical vital scoring and compliance telemetry models.</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name/disease..."
                  className="pl-9 pr-4 py-2 border border-gray-200 bg-gray-50 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-44 sm:w-56"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <button
                onClick={() => setShowRegForm(!showRegForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold inline-flex items-center shadow-sm"
              >
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Register Patient</span>
              </button>
            </div>
          </div>

          {/* Registry enrollment slide form */}
          {showRegForm && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-5 text-xs animate-fadeIn">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center"><UserPlus className="h-4 w-4 text-indigo-500 mr-1.5" /> Register New Clinical Patient Profile</h4>
              <form onSubmit={handleRegisterPatient} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="col-span-3">
                  <label className="text-xxs font-bold text-gray-500 uppercase h-4 block">Name</label>
                  <input type="text" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5" placeholder="John" value={regName} onChange={e=>setRegName(e.target.value)} required />
                </div>
                <div className="col-span-2">
                  <label className="text-xxs font-bold text-gray-500 uppercase h-4 block">Age</label>
                  <input type="number" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5" placeholder="62" value={regAge} onChange={e=>setRegAge(e.target.value)} required />
                </div>
                <div className="col-span-2">
                  <label className="text-xxs font-bold text-gray-500 uppercase h-4 block">Gender</label>
                  <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5" value={regGender} onChange={e=>setRegGender(e.target.value)}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xxs font-bold text-gray-500 uppercase h-4 block">Disease</label>
                  <select className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 capitalize" value={regDisease} onChange={e=>setRegDisease(e.target.value as any)}>
                    <option value="diabetic">diabetic</option>
                    <option value="cardiac">cardiac</option>
                    <option value="both">both (cardiodiabetic)</option>
                  </select>
                </div>
                <div className="col-span-3 flex items-end">
                  <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-1.5 hover:bg-indigo-700 font-bold">Enroll Profile</button>
                </div>
              </form>
            </div>
          )}

          {/* Patient Card Grid list (Priority Queue order) */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {filteredPatients.length > 0 ? (
              filteredPatients.map(patient => {
                const priorityStyles = {
                  Critical: 'border-l-4 border-l-red-600 bg-red-50/20 hover:bg-red-50/40',
                  High: 'border-l-4 border-l-orange-500 bg-orange-50/20 hover:bg-orange-50/40',
                  Moderate: 'border-l-4 border-l-yellow-500 bg-yellow-50/20 hover:bg-yellow-50/40',
                  Low: 'border-l-4 border-l-green-600 bg-green-50/10 hover:bg-green-50/20'
                }[patient.priority];

                const scoreBadge = {
                  Critical: 'bg-red-100 text-red-700 border-red-200',
                  High: 'bg-orange-100 text-orange-700 border-orange-200',
                  Moderate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                  Low: 'bg-green-100 text-green-700 border-green-200'
                }[patient.priority];

                const isSelected = selectedPatientId === patient.id;

                return (
                  <div
                    key={patient.id}
                    id={`patient-card-${patient.id}`}
                    onClick={() => handlePatientSelect(patient.id)}
                    className={`p-4 rounded-xl border border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-all duration-150 ${priorityStyles} ${
                      isSelected ? 'ring-2 ring-indigo-500 shadow-md' : 'shadow-xxs'
                    }`}
                  >
                    {/* Basic info */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">{patient.name}</span>
                        <span className={`text-xxs px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider ${scoreBadge}`}>
                          {patient.priority} Risk ({patient.risk_score})
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">
                        Age {patient.age} &bull; {patient.gender} &bull; Diagnosis: <span className="capitalize font-semibold text-gray-700">{patient.disease_type}</span>
                      </p>
                    </div>

                    {/* Vitals Telemetry overview */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-gray-400 font-mono text-xxs">Glucose</span>
                        <p className={`font-mono font-medium ${patient.vitals && patient.vitals.glucose > 180 ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
                          {patient.vitals?.glucose ? `${patient.vitals.glucose} mg/dL` : 'No logs'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-gray-400 font-mono text-xxs">Blood Pressure</span>
                        <p className={`font-mono font-medium ${patient.vitals && (patient.vitals.systolic_bp > 140 || patient.vitals.diastolic_bp > 90) ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
                          {patient.vitals?.systolic_bp ? `${patient.vitals.systolic_bp}/${patient.vitals.diastolic_bp}` : 'No logs'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-gray-400 font-mono text-xxs">Sensation SpO₂</span>
                        <p className={`font-mono font-medium ${patient.vitals && patient.vitals.spo2 < 92 ? 'text-rose-500 font-bold' : 'text-gray-800'}`}>
                          {patient.vitals?.spo2 ? `${patient.vitals.spo2}%` : 'No logs'}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-gray-400 font-mono text-xxs">Heart Rate</span>
                        <p className={`font-mono font-medium ${patient.wearable && patient.wearable.heart_rate > 110 ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
                          {patient.wearable?.heart_rate ? `${patient.wearable.heart_rate} bpm` : 'No sync'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end text-indigo-600 shrink-0">
                      <ChevronDown className={`h-5 w-5 transform transition-transform duration-150 ${isSelected ? 'rotate-180 text-indigo-700' : ''}`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 font-mono text-center py-12">No patient profiles matching query.</p>
            )}
          </div>
        </div>

        {/* Clinical Resolution Log registry */}
        <div id="intervention-history" className="bg-white rounded-2xl border border-gray-150 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center font-sans">
            <CheckCircle className="h-4.5 w-4.5 text-green-600 mr-2" />
            <span>Permanent Intervention Registry & History</span>
          </h3>
          <div className="space-y-3 font-mono text-xs max-h-60 overflow-y-auto pr-1">
            {resolutions.length > 0 ? (
              resolutions.map((res, i) => (
                <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-bold text-gray-800 text-xxs">
                    <span>Resolved by: {res.physician}</span>
                    <span className="text-gray-400">{new Date(res.resolved_at).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{res.note}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 py-8 text-center bg-gray-50 rounded-xl">No physical clinical resolutions compiled during this session.</p>
            )}
          </div>
        </div>

      </div>

      {/* Expanded Clinical Analytics & AI recommendation drawer (4 Cols) */}
      <div id="provider-sidebar" className="xl:col-span-4 space-y-6">

        {/* Selected Clinical Inspection Details block */}
        <div id="inspection-profile" className="p-5 bg-white rounded-2xl border border-gray-150 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 border-b border-dashed border-gray-100 pb-3 flex items-center justify-between font-sans">
            <span>Specialist Telemetry Inspector</span>
            <Activity className="h-4 w-4 text-indigo-600" />
          </h3>

          {!selectedPatientId ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <FolderLock className="h-8 w-8 text-gray-300 mb-3" />
              <p className="text-xs text-gray-400 font-mono">Select a patient card to explore deep vitals histories and generative clinical predictions.</p>
            </div>
          ) : loadingDetails ? (
            <div className="py-20 text-center flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
              <span className="text-xs text-gray-500 font-mono">Retrieving medical databases...</span>
            </div>
          ) : patientDetails ? (
            <div className="mt-4 space-y-6">
              
              {/* Patient Basic and Overrides */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-md font-bold text-gray-900 font-sans">{patientDetails.patient.name}</h4>
                  <p className="text-xxs font-mono text-gray-400">ID: {patientDetails.patient.id} &bull; Joined: {patientDetails.patient.joined_date}</p>
                </div>

                <button
                  onClick={() => setDocVitalsOverride(!docVitalsOverride)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xxs font-semibold px-2 py-1 rounded border border-indigo-150"
                >
                  Override Vitals
                </button>
              </div>

              {/* Doctor override fields on the spot */}
              {docVitalsOverride && (
                <form onSubmit={handleOverrideSubmit} className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-3 text-xxs">
                  <h5 className="font-bold text-indigo-900 uppercase">Consultation Override Form</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-500 font-bold">Glucose</label>
                      <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 bg-white" value={overrideGlucose} onChange={e=>setOverrideGlucose(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-gray-500 font-bold">Systolic BP</label>
                      <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 bg-white" value={overrideSystolic} onChange={e=>setOverrideSystolic(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-gray-500 font-bold">Diastolic BP</label>
                      <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 bg-white" value={overrideDiastolic} onChange={e=>setOverrideDiastolic(e.target.value)} required />
                    </div>
                    <div>
                      <label className="text-gray-500 font-bold">Oxygen SpO2</label>
                      <input type="number" className="w-full border border-gray-200 rounded px-2 py-1 bg-white" value={overrideSpo2} onChange={e=>setOverrideSpo2(e.target.value)} required />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-1">
                    <button type="button" onClick={()=>setDocVitalsOverride(false)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">Cancel</button>
                    <button type="submit" className="px-2 py-1 bg-indigo-600 text-white rounded font-bold">Set Override</button>
                  </div>
                </form>
              )}

              {/* Sparkline graphics & Trends (Glucose & BP) */}
              <div className="space-y-4">
                <div className="border border-gray-100 p-3 rounded-xl space-y-1 bg-slate-50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700">Fasting Blood Glucose Sparklines</span>
                    <span className="text-indigo-600 font-mono font-semibold">{overrideGlucose || patientDetails.vitals?.glucose} mg/dL</span>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <Sparkline 
                      values={patientDetails.history.vitals.map((v: Vitals) => v.glucose)} 
                      color="#4f46e5" 
                      minVal={50} 
                      maxVal={250} 
                    />
                  </div>
                </div>

                <div className="border border-gray-100 p-3 rounded-xl space-y-1 bg-slate-50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700">Systolic Blood Pressure Sparklines</span>
                    <span className="text-rose-600 font-mono font-semibold">{overrideSystolic || patientDetails.vitals?.systolic_bp} mmHg</span>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <Sparkline 
                      values={patientDetails.history.vitals.map((v: Vitals) => v.systolic_bp)} 
                      color="#e11d48" 
                      minVal={80} 
                      maxVal={180} 
                    />
                  </div>
                </div>
              </div>

              {/* Advanced ML Predictive deterioration layer */}
              <div className="border border-dashed border-gray-200 mt-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center font-mono">
                    <Brain className="h-4 w-4 text-emerald-600 mr-1" /> Machine Learning Engine
                  </span>
                  <button
                    onClick={() => triggerMLPrediction(patientDetails.patient.id)}
                    className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-lg border border-emerald-150 inline-flex items-center shadow-xxs"
                    disabled={loadingMl}
                  >
                    {loadingMl ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    <span>Run ML Inference</span>
                  </button>
                </div>

                {/* Inference Outputs */}
                {mlPrediction ? (
                  <div className="mt-3 p-3 bg-emerald-50/50 border border-emerald-150 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold">Predicted State:</span>
                      <span className={`px-2 py-0.5 rounded text-white font-extrabold ${mlPrediction.status === 'Stable' ? 'bg-green-600' : 'bg-rose-600 animate-pulse'}`}>
                        {mlPrediction.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold">Confidence Ratio:</span>
                      <span>{mlPrediction.confidence}%</span>
                    </div>

                    <div className="border-t border-dashed border-emerald-200 pt-2 space-y-1.5 leading-relaxed">
                      <span className="text-emerald-800 font-extrabold">Clinical Hypothesis Summary:</span>
                      <p className="text-gray-600 font-sans font-medium leading-relaxed">{mlPrediction.narrative}</p>
                    </div>

                    <div className="border-t border-dashed border-emerald-200 pt-2 space-y-1.5">
                      <span className="text-emerald-800 font-extrabold">Physician Recommendation Steps (AI-driven):</span>
                      <p className="text-gray-600 whitespace-pre-line font-sans font-medium leading-relaxed">{mlPrediction.recommendation}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xxs text-gray-400 mt-2 font-mono">
                    Run our Scikit-Learn/Random-Forest model coupled with Gemini Clinical AI to generate tailored risk hypotheses.
                  </p>
                )}
              </div>

            </div>
          ) : null}
        </div>

      </div>

      {/* Resolution dialog input panel context */}
      {resolvingAlertId && (
        <div id="resolution-backdrop" className="fixed inset-0 bg-black/40 backdrop-blur-xxs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleResolveAlertSubmit} className="bg-white rounded-2xl border border-gray-150 shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 font-sans flex items-center">
              <ShieldAlert className="h-5 w-5 text-indigo-600 mr-2" />
              <span>Resolve Active Warning Alert</span>
            </h3>
            
            <p className="text-xs text-gray-500">File a physical resolution and record clinical decision logs to the permanent healthcare registry.</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-bold mb-1 font-mono">Attending Clinical Physician</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-mono"
                  value={resolutionPhysician}
                  onChange={e => setResolutionPhysician(e.target.value)}
                >
                  <option>Dr. Sarah Adams</option>
                  <option>Dr. Marcus Vance</option>
                  <option>Clinician Nurse Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-bold mb-1 font-mono">Intervention Record & Clinician Notes</label>
                <textarea
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 h-28 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-sans"
                  placeholder="e.g. Conducted patient teleconsultation. Advised on taking full 20mg Lisinopril dose. Scheduled blood test review for tomorrow."
                  value={resolutionNote}
                  onChange={e => setResolutionNote(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
              <button
                type="button"
                onClick={() => setResolvingAlertId(null)}
                className="bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md"
              >
                File Resolution
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
