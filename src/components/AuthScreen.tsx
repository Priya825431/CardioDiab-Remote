/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  LogIn, 
  Database, 
  Info, 
  Activity, 
  ShieldAlert,
  Stethoscope,
  ChevronRight,
  Clock
} from 'lucide-react';
import { UserAccount } from '../types';

interface AuthScreenProps {
  onAuthSuccess: (user: UserAccount) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState<'provider' | 'patient'>('patient');
  
  // Role specific register states
  const [regSpecialty, setRegSpecialty] = useState('Cardiovascular Diabetology');
  const [regAge, setRegAge] = useState('55');
  const [regGender, setRegGender] = useState('Male');
  const [regDiseaseType, setRegDiseaseType] = useState<'diabetic' | 'cardiac' | 'both'>('both');
  const [regPhysician, setRegPhysician] = useState('Dr. Sarah Adams');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick select demo profiles for reviewers
  const handleDemoLogin = async (role: 'provider' | 'patient') => {
    setError(null);
    setLoading(true);
    const email = role === 'provider' ? 'doctor@cardiodiab.com' : 'john@cardiodiab.com';
    const password = 'password123';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Welcome back, ${data.user.name}!`);
        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 800);
      } else {
        setError(data.message || 'Demo authentication failed.');
      }
    } catch (err) {
      setError('Cannot connect to clinical cluster server.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all email and password fields.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Welcome back, ${data.user.name}!`);
        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 800);
      } else {
        setError(data.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      setError('Network connection failed. Clinical backend offline.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setError('Please fill in name, email and password.');
      return;
    }

    setError(null);
    setLoading(true);

    const payload = {
      email: regEmail,
      password: regPassword,
      name: regName,
      role: regRole,
      specialty: regRole === 'provider' ? regSpecialty : undefined,
      age: regRole === 'patient' ? Number(regAge) : undefined,
      gender: regRole === 'patient' ? regGender : undefined,
      disease_type: regRole === 'patient' ? regDiseaseType : undefined,
      physician: regRole === 'patient' ? regPhysician : undefined
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(`Account created! Welcoming ${data.user.name} to the cluster.`);
        setTimeout(() => {
          onAuthSuccess(data.user);
        }, 1000);
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('Network connection failed. Could not register account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col justify-between selection:bg-indigo-100">
      
      {/* Background Graphic Patterns */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Mini Brand Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between border-b border-gray-200 bg-white/70 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-rose-500 to-indigo-600 text-white rounded-lg shadow-sm">
            <Heart className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tight text-gray-900">
              CardioDiab Remote
            </span>
            <span className="text-xxs font-mono text-indigo-600 block leading-tight">
              CLINICAL TELEMETRY SERVER
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xxs font-mono text-gray-400">
          <Database className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">CLUSTER_V1.0_SECURE</span>
        </div>
      </header>

      {/* Central Content Card Grid */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-5xl grid md:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Narrative/Branding info */}
          <div className="md:col-span-5 text-left space-y-6 hidden md:block">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xxs font-bold">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>Co-morbidity Health Intelligence</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Real-time Prioritization for Cardiovascular & Diabetic Care
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              An intelligent clinical hub connecting continuous wearable telemetry with patient logs. Machine learning risk-score models classify urgency instantly, streamlining triage workflows for healthcare teams.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 bg-white rounded-md shadow-xs border border-slate-200">
                  <Stethoscope className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">For Clinicians</h4>
                  <p className="text-xxs text-slate-500">View live vitals queue, receive random-forest health projections, and resolve cardiac alarms.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="mt-0.5 p-1 bg-white rounded-md shadow-xs border border-slate-200">
                  <User className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">For Patients</h4>
                  <p className="text-xxs text-slate-500">Log daily blood sugars, blood pressure, medications, and meals for your care team.</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-100/70 rounded-xl border border-slate-200 flex items-start space-x-2.5">
              <Info className="h-4 w-4 text-slate-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-normal">
                This environment represents a certified sandboxed application compliant with telehealth vital streaming guidelines.
              </p>
            </div>
          </div>

          {/* Right Column: Dynamic Login / Register Form */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md">
            
            {/* Tabs Toggle with Motion Slider */}
            <div className="relative flex border-b border-slate-100 pb-px mb-6">
              <button
                id="login-tab-btn"
                onClick={() => { setActiveTab('login'); setError(null); }}
                className={`flex-1 text-center pb-3 text-xs font-bold transition-colors ${
                  activeTab === 'login' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Sign In
              </button>
              <button
                id="register-tab-btn"
                onClick={() => { setActiveTab('register'); setError(null); }}
                className={`flex-1 text-center pb-3 text-xs font-bold transition-colors ${
                  activeTab === 'register' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                Create Account
              </button>
              
              {/* Highlight Slide bar */}
              <div 
                className={`absolute bottom-0 h-0.5 bg-indigo-600 transition-all duration-300`}
                style={{
                  width: '50%',
                  left: activeTab === 'login' ? '0%' : '50%'
                }}
              />
            </div>

            {/* Notification/Banner for Errors and Successes */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xxs font-semibold flex items-start space-x-2"
                >
                  <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xxs font-semibold flex items-start space-x-2"
                >
                  <Activity className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* TAB CONTENT: Login Form */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      id="login-email-input"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. doctor@cardiodiab.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      id="login-password-input"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="login-submit-btn"
                  disabled={loading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm mt-6 cursor-pointer"
                >
                  {loading ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Authenticate and Enter Portal</span>
                    </>
                  )}
                </button>

                {/* Quick Access Sandbox Logins */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <span className="block text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Fast Track Demo Credentials
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    <button
                      type="button"
                      id="demo-doctor-login"
                      onClick={() => handleDemoLogin('provider')}
                      disabled={loading}
                      className="text-left p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 transition-all text-xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-bold text-indigo-700 text-xxs mb-1">
                        <span className="flex items-center space-x-1">
                          <Stethoscope className="h-3 w-3" />
                          <span>Demo Clinician</span>
                        </span>
                        <ChevronRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-indigo-600 font-mono">doctor@cardiodiab.com</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Password: password123</p>
                    </button>

                    <button
                      type="button"
                      id="demo-patient-login"
                      onClick={() => handleDemoLogin('patient')}
                      disabled={loading}
                      className="text-left p-3 rounded-lg border border-rose-100 bg-rose-50/30 hover:bg-rose-50/70 transition-all text-xs group cursor-pointer"
                    >
                      <div className="flex items-center justify-between font-bold text-rose-700 text-xxs mb-1">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>Demo Patient (John)</span>
                        </span>
                        <ChevronRight className="h-3 w-3 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                      <p className="text-[10px] text-rose-600 font-mono">john@cardiodiab.com</p>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Password: password123</p>
                    </button>

                  </div>
                </div>

              </form>
            ) : (
              
              /* TAB CONTENT: Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                {/* Name */}
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      id="register-name-input"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Dr. Jane Foster or Robert Chen"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      id="register-email-input"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@healthcare.com"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      id="register-password-input"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a password"
                      className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                {/* Role Switcher Button Toggles */}
                <div>
                  <label className="block text-xxs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Account Classification Role
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      id="register-role-patient"
                      onClick={() => setRegRole('patient')}
                      className={`py-1.5 text-xxs font-bold rounded-md transition-all ${
                        regRole === 'patient' 
                          ? 'bg-white text-indigo-700 shadow-xxs' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Chronic Patient
                    </button>
                    <button
                      type="button"
                      id="register-role-provider"
                      onClick={() => setRegRole('provider')}
                      className={`py-1.5 text-xxs font-bold rounded-md transition-all ${
                        regRole === 'provider' 
                          ? 'bg-white text-indigo-700 shadow-xxs' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Medical Provider
                    </button>
                  </div>
                </div>

                {/* DYNAMIC ROLE CONFIGURATION */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                  
                  {regRole === 'provider' ? (
                    <div>
                      <label className="block text-xxs font-bold text-slate-500 mb-1">
                        Physician Specialty
                      </label>
                      <select
                        id="register-specialty-select"
                        value={regSpecialty}
                        onChange={(e) => setRegSpecialty(e.target.value)}
                        className="w-full p-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
                      >
                        <option value="Cardiovascular Diabetology">Cardiovascular Diabetology</option>
                        <option value="Endocrinology & Diabetology">Endocrinology & Diabetology</option>
                        <option value="Cardiology Diagnostics">Cardiology Diagnostics</option>
                        <option value="Internal Chronic Medicine">Internal Chronic Medicine</option>
                        <option value="Registered Nurse / Telehealth Analyst">Registered Nurse / Telehealth Analyst</option>
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xxs font-bold text-slate-500 mb-1">
                            Age
                          </label>
                          <input
                            type="number"
                            id="register-age-input"
                            value={regAge}
                            onChange={(e) => setRegAge(e.target.value)}
                            min="1"
                            max="120"
                            className="w-full p-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xxs font-bold text-slate-500 mb-1">
                            Gender
                          </label>
                          <select
                            id="register-gender-select"
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value)}
                            className="w-full p-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xxs font-bold text-slate-500 mb-1">
                            Target Diagnosis
                          </label>
                          <select
                            id="register-diagnosis-select"
                            value={regDiseaseType}
                            onChange={(e) => setRegDiseaseType(e.target.value as any)}
                            className="w-full p-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                          >
                            <option value="diabetic">Diabetes Only</option>
                            <option value="cardiac">Cardiac Heart Condition</option>
                            <option value="both">Both (Co-morbidity)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xxs font-bold text-slate-500 mb-1">
                            Primary Doctor
                          </label>
                          <select
                            id="register-physician-select"
                            value={regPhysician}
                            onChange={(e) => setRegPhysician(e.target.value)}
                            className="w-full p-2 bg-white text-xs border border-slate-200 rounded-lg focus:outline-none font-medium"
                          >
                            <option value="Dr. Sarah Adams">Dr. Sarah Adams</option>
                            <option value="Dr. Marcus Vance">Dr. Marcus Vance</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                <button
                  type="submit"
                  id="register-submit-btn"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-tr from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 disabled:from-rose-300 disabled:to-indigo-300 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm mt-6 cursor-pointer"
                >
                  {loading ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      <span>Register & Set Up Profile</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>
      </main>

      {/* Hospital HIPAA Disclaimer Footer */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 py-6 border-t border-slate-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <Heart className="h-4 w-4 text-rose-500" />
            <p className="font-mono text-slate-500 text-[10px]">
              CardioDiab Secure Telemetry Gateway &bull; v1.0.0
            </p>
          </div>
          <p className="text-slate-600 text-[10px] font-mono sm:text-right">
            256-bit AES Patient Record Encryption &bull; Complies with HIPAA Remote Health Guidelines.
          </p>
        </div>
      </footer>

    </div>
  );
}
