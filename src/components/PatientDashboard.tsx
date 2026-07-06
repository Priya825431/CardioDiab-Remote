/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Activity, 
  Calendar, 
  Plus, 
  Check, 
  Droplet, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle,
  Clock,
  ChevronRight,
  User,
  Coffee,
  Database
} from 'lucide-react';
import { Patient, Vitals, WearableData, MedicationLog, DietLog } from '../types';

interface PatientDashboardProps {
  patients: (Patient & { risk_score: number; priority: string })[];
  selectedPatientId: string;
  onSelectPatient: (id: string) => void;
  onRefreshData: () => void;
  isRestrictedPatient?: boolean;
}

export default function PatientDashboard({
  patients,
  selectedPatientId,
  onSelectPatient,
  onRefreshData,
  isRestrictedPatient = false
}: PatientDashboardProps) {
  const [patientData, setPatientData] = useState<{
    patient: Patient | null;
    vitals: Vitals | null;
    wearable: WearableData | null;
    medication: MedicationLog | null;
    diet: DietLog | null;
    risk_score: number;
    priority: string;
    triggers: string[];
    history: {
      vitals: Vitals[];
      wearables: WearableData[];
      medications: MedicationLog[];
      diets: DietLog[];
    };
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'vitals' | 'activity' | 'medication' | 'diet'>('vitals');
  const [successMsg, setSuccessMsg] = useState('');

  // Vital Sign Log form states
  const [glucose, setGlucose] = useState('');
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');

  // Wearable Log form states
  const [heartRate, setHeartRate] = useState('');
  const [hrv, setHrv] = useState('');
  const [steps, setSteps] = useState('');
  const [sleep, setSleep] = useState('');
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high'>('moderate');

  // Medication Log form states
  const [medName, setMedName] = useState('');
  const [prescribedDose, setPrescribedDose] = useState('');
  const [takenDose, setTakenDose] = useState('');

  // Diet Log form states
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [sugar, setSugar] = useState('');
  const [sodium, setSodium] = useState('');
  const [fat, setFat] = useState('');

  const fetchPatientDetails = async () => {
    if (!selectedPatientId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/patients/${selectedPatientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientData(data);
        
        // Prefill forms with latest records where applicable
        if (data.vitals) {
          setGlucose(data.vitals.glucose.toString());
          setSystolic(data.vitals.systolic_bp.toString());
          setDiastolic(data.vitals.diastolic_bp.toString());
          setSpo2(data.vitals.spo2.toString());
          setWeight(data.vitals.weight.toString());
        }
        if (data.wearable) {
          setHeartRate(data.wearable.heart_rate.toString());
          setHrv(data.wearable.hrv.toString());
          setSteps(data.wearable.steps.toString());
          setSleep(data.wearable.sleep_hours.toString());
          setActivityLevel(data.wearable.activity_level);
        }
      }
    } catch (e) {
      console.error("Error fetching patient medical details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientDetails();
  }, [selectedPatientId]);

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!glucose || !systolic || !diastolic || !spo2 || !weight) return;

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          glucose: Number(glucose),
          systolic_bp: Number(systolic),
          diastolic_bp: Number(diastolic),
          spo2: Number(spo2),
          weight: Number(weight)
        })
      });

      if (res.ok) {
        showToast("Vitals logged and synchronized successfully.");
        fetchPatientDetails();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWearablesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heartRate || !hrv || !steps || !sleep) return;

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/wearables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heart_rate: Number(heartRate),
          hrv: Number(hrv),
          steps: Number(steps),
          sleep_hours: Number(sleep),
          activity_level: activityLevel
        })
      });

      if (res.ok) {
        showToast("Wearable telemetry synced with clinic server.");
        fetchPatientDetails();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMedicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !prescribedDose || !takenDose) return;

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/medications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication_name: medName,
          prescribed_dose: Number(prescribedDose),
          taken_dose: Number(takenDose)
        })
      });

      if (res.ok) {
        showToast("Medication dosage tracked and logged.");
        setMedName('');
        setPrescribedDose('');
        setTakenDose('');
        fetchPatientDetails();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDietSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || !calories || !sugar) return;

    try {
      const res = await fetch(`/api/patients/${selectedPatientId}/diet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meal_name: mealName,
          calories: Number(calories),
          sugar: Number(sugar),
          sodium: sodium ? Number(sodium) : undefined,
          fat: fat ? Number(fat) : undefined
        })
      });

      if (res.ok) {
        showToast("Meal and sugar metrics logged successfully.");
        setMealName('');
        setCalories('');
        setSugar('');
        setSodium('');
        setFat('');
        fetchPatientDetails();
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedPatientId) {
    return (
      <div id="patient-no-selection" className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-150 shadow-sm text-center">
        <User className="h-12 w-12 text-gray-400 mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-gray-800">No Patient Selected</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">Please select a patient using the account switcher to explore their interactive input telemetry and logs.</p>
      </div>
    );
  }

  const currentPatient = patients.find(p => p.id === selectedPatientId);
  if (!currentPatient) return null;

  const currentRisk = patientData?.risk_score ?? 0;
  const currentPriority = patientData?.priority ?? "Low";

  // Priority styling
  const priorityColors = {
    Critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-600 text-white animate-pulse' },
    High: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-500 text-white' },
    Moderate: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-500 text-white' },
    Low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-600 text-white' }
  }[currentPriority] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', badge: 'bg-gray-500 text-white' };

  return (
    <div id="patient-dashboard-container" className="space-y-6">
      
      {/* Toast Notification */}
      {successMsg && (
        <div id="toast-success" className="fixed top-4 right-4 z-50 flex items-center bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg border border-gray-800 transition-all duration-300 transform scale-100">
          <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {/* Patient header portal selector */}
      <div id="patient-portal-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-gray-150 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <User className="h-6 w-6" id="patient-icon-header" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-900 font-sans" id="patient-title-name">{currentPatient.name}</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${priorityColors.badge}`}>
                {currentPriority} Priority (Risk: {currentRisk})
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Age {currentPatient.age} &bull; {currentPatient.gender} &bull; Chronic Diagnosis: <span className="capitalize font-medium text-gray-700">{currentPatient.disease_type}</span>
            </p>
          </div>
        </div>

        {!isRestrictedPatient && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-medium font-mono">Patient Switcher</span>
            <select 
              id="patient-portal-switch" 
              className="text-sm border border-gray-200 bg-gray-50 rounded-lg px-3 py-1.5 font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedPatientId}
              onChange={(e) => onSelectPatient(e.target.value)}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.disease_type})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Core clinical numbers & triggers */}
      <div id="patient-metrics-overview-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Compliance Meter */}
        <div id="patient-compliance-card" className="p-5 bg-white rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Therapeutic Adherence</span>
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
            </div>
            
            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900" id="patient-adherence-value">
                {patientData?.medication?.adherence_percentage ?? 100}%
              </span>
              <span className="text-xs text-gray-500">of prescribed meds consumed</span>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${patientData?.medication?.adherence_percentage ?? 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Prescribed: {patientData?.medication?.medication_name || "Daily protocols"}
            </p>
          </div>
        </div>

        {/* Nutritional Diet Gauge */}
        <div id="patient-diet-card" className="p-5 bg-white rounded-2xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Latest Meal Load</span>
              <Coffee className="h-4.5 w-4.5 text-amber-500" />
            </div>

            <div className="mt-4 flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900" id="latest-meal-sugar">
                {patientData?.diet?.sugar ?? 0}g
              </span>
              <span className="text-xs text-gray-500">sugar in single meal</span>
            </div>
          </div>

          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Sodium: {patientData?.diet?.sodium ?? 0} mg</span>
              <span className="text-gray-400">Calories: {patientData?.diet?.calories ?? 0} kcal</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">Fats: {patientData?.diet?.fat ?? 0}g</span>
              <span className={((patientData?.diet?.sugar ?? 0) > 30) ? "text-rose-600 font-medium" : "text-green-600 font-medium"}>
                {((patientData?.diet?.sugar ?? 0) > 30) ? "High Glycemic Limit" : "Safe Zone"}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical Alert warning context */}
        <div id="patient-risk-warning-card" className={`p-5 rounded-2xl border ${priorityColors.border} ${priorityColors.bg} flex flex-col justify-between`}>
          <div>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${priorityColors.text}`}>Clinical Assessment</span>
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>

            <div className="mt-3">
              {patientData?.triggers && patientData.triggers.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-rose-800">Trigger warnings active:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {patientData.triggers.slice(0, 3).map((trig, idx) => (
                      <li key={idx} className="text-xs font-mono text-gray-700">{trig}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-gray-600 font-mono leading-relaxed">
                  No critical metabolic or hemodynamic triggers parsed. Continue regular inputs to maintain health scores.
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs font-mono border-t border-dashed border-gray-200 pt-2 text-gray-500">
            <span>Last checked:</span>
            <span>{patientData?.vitals?.timestamp ? new Date(patientData.vitals.timestamp).toLocaleTimeString() : "Just now"}</span>
          </div>
        </div>

      </div>

      {/* Input Tabbed logs and form collection */}
      <div id="patient-input-portal-container" className="bg-white rounded-2xl border border-gray-150 shadow-sm">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {[
            { id: 'vitals', label: 'Monitor Vitals', icon: Droplet },
            { id: 'activity', label: 'Wearable Sync', icon: Activity },
            { id: 'medication', label: 'Track Medications', icon: Clock },
            { id: 'diet', label: 'Diet Log', icon: Coffee }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-5 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-all duration-150 ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/20' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'vitals' && (
            <form onSubmit={handleVitalsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Blood Glucose (mg/dL)</label>
                  <input 
                    type="number" 
                    id="input-glucose"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 110"
                    value={glucose}
                    onChange={e => setGlucose(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Safe: Fasting &bull; 70 - 100 mg/dL. Alert if &gt; 180.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Blood Pressure (Systolic/Diastolic)</label>
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      id="input-systolic"
                      className="w-1/2 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Systolic e.g. 120"
                      value={systolic}
                      onChange={e => setSystolic(e.target.value)}
                      required
                    />
                    <span className="self-center text-gray-400">/</span>
                    <input 
                      type="number" 
                      id="input-diastolic"
                      className="w-1/2 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Diastolic e.g. 80"
                      value={diastolic}
                      onChange={e => setDiastolic(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xxs text-gray-400 mt-1">Normal: 120/80 mmHg. Cardiac risk if &gt; 140/90.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Oxygen Saturation SpO₂ (%)</label>
                  <input 
                    type="number" 
                    id="input-spo2"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 98"
                    value={spo2}
                    onChange={e => setSpo2(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Normal: 95 - 100%. Critical cardiac signal if &lt; 92%.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Weight (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    id="input-weight"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 72.5"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Used to automatically compute BMI trends.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button 
                  type="submit" 
                  id="btn-vitals-submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Log Vitals and Sync</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'activity' && (
            <form onSubmit={handleWearablesSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Heart Rate (bpm)</label>
                  <input 
                    type="number" 
                    id="input-heartrate"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 72"
                    value={heartRate}
                    onChange={e => setHeartRate(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Normal: 60-100 bpm resting. Cardiac risk if &gt; 110.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Heart Rate Variability HRV (ms)</label>
                  <input 
                    type="number" 
                    id="input-hrv"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 55"
                    value={hrv}
                    onChange={e => setHrv(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Low HRV (&lt; 40ms) signals autonomous nervous distress.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Steps Walked (Daily)</label>
                  <input 
                    type="number" 
                    id="input-steps"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 8500"
                    value={steps}
                    onChange={e => setSteps(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Targets: &gt; 5000 is healthy. Diabetic alert if steps are low.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Night Sleep (Hours)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    id="input-sleep"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 7.5"
                    value={sleep}
                    onChange={e => setSleep(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Rest-cycle targets. Alert triggers if sleep &lt; 6 hrs.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Activity Intensity Level</label>
                  <div className="flex space-x-2 mt-1">
                    {['low', 'moderate', 'high'].map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setActivityLevel(lvl as any)}
                        className={`flex-1 py-2 text-xs font-semibold capitalize rounded-xl border transition-all duration-100 ${
                          activityLevel === lvl 
                            ? 'bg-indigo-600 text-white border-indigo-700' 
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button 
                  type="submit" 
                  id="btn-wearable-submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center"
                >
                  <Activity className="h-4 w-4 mr-1.5" />
                  <span>Sync Wearable Sensors</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'medication' && (
            <form onSubmit={handleMedicationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Medication Name</label>
                  <input 
                    type="text" 
                    id="input-med-name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Metformin"
                    value={medName}
                    onChange={e => setMedName(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Name of the prescribed daily therapeutic medication.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Prescribed Dosage (mg/units)</label>
                  <input 
                    type="number" 
                    id="input-prescribed"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 1000"
                    value={prescribedDose}
                    onChange={e => setPrescribedDose(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Full dosage scheduled by the cardiologist / physician.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Taken Dosage (mg/units)</label>
                  <input 
                    type="number" 
                    id="input-taken"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 1000"
                    value={takenDose}
                    onChange={e => setTakenDose(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">Actual dose consumed today to check compliance.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button 
                  type="submit" 
                  id="btn-med-submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center"
                >
                  <Clock className="h-4 w-4 mr-1.5" />
                  <span>Log Dosage Intake</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'diet' && (
            <form onSubmit={handleDietSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Meal Description</label>
                  <input 
                    type="text" 
                    id="input-meal-name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Grilled salmon with quinoa"
                    value={mealName}
                    onChange={e => setMealName(e.target.value)}
                    required
                  />
                  <p className="text-xxs text-gray-400 mt-1">List items and snacks in this meal period.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Calories (kcal)</label>
                  <input 
                    type="number" 
                    id="input-calories"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 550"
                    value={calories}
                    onChange={e => setCalories(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Sugar (g)</label>
                  <input 
                    type="number" 
                    id="input-sugar"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 12"
                    value={sugar}
                    onChange={e => setSugar(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Sodium (mg)</label>
                  <input 
                    type="number" 
                    id="input-sodium"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 180"
                    value={sodium}
                    onChange={e => setSodium(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-50">
                <button 
                  type="submit" 
                  id="btn-diet-submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center"
                >
                  <Coffee className="h-4 w-4 mr-1.5" />
                  <span>Log Nutrition Item</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Historical logs timeline summaries */}
      <div id="patient-timeline-logs-grid" className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Vitals records */}
        <div id="patient-vitals-history-panel" className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4 font-sans">
            <Droplet className="h-4 w-4 text-rose-500 mr-2" />
            <span>Vital Signs Log History</span>
          </h3>
          <div className="overflow-y-auto max-h-60 space-y-3 pr-1">
            {patientData?.history?.vitals && patientData.history.vitals.length > 0 ? (
              patientData.history.vitals.map((v, i) => (
                <div key={v.id || i} className="flex justify-between items-center text-xs p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">
                      Glucose: <span className="font-mono text-indigo-600">{v.glucose} mg/dL</span>
                    </p>
                    <p className="text-gray-500 font-mono">
                      BP: {v.systolic_bp}/{v.diastolic_bp} mmHg &bull; SpO₂: {v.spo2}%
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 font-mono text-xxs block">
                      {new Date(v.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400 font-mono text-xxs block">
                      {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 font-mono py-8 text-center bg-gray-50 rounded-xl">No vitals logs gathered yet.</p>
            )}
          </div>
        </div>

        {/* Daily meals journal */}
        <div id="patient-diet-history-panel" className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4 font-sans">
            <Coffee className="h-4 w-4 text-amber-500 mr-2" />
            <span>Nutrition & Meal Log</span>
          </h3>
          <div className="overflow-y-auto max-h-60 space-y-3 pr-1">
            {patientData?.history?.diets && patientData.history.diets.length > 0 ? (
              patientData.history.diets.map((d, i) => (
                <div key={d.id || i} className="flex justify-between items-center text-xs p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800 truncate max-w-[200px]">{d.meal_name}</p>
                    <p className="text-gray-500 font-mono">
                      Cal: {d.calories} kcal &bull; Sugar: <span className={d.sugar > 30 ? "text-rose-600 font-bold" : "text-gray-600"}>{d.sugar}g</span>
                    </p>
                  </div>
                  <div className="text-right font-mono text-xxs text-gray-400">
                    <span>{new Date(d.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 font-mono py-8 text-center bg-gray-50 rounded-xl">No meal logs recorded today.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
