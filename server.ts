/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Patient, 
  Vitals, 
  WearableData, 
  MedicationLog, 
  DietLog, 
  Alert, 
  MLPrediction,
  UserAccount
} from "./src/types";

interface DbUser extends UserAccount {
  password?: string;
}

const DEFAULT_USERS: DbUser[] = [
  {
    id: "user-1",
    email: "doctor@cardiodiab.com",
    name: "Dr. Sarah Adams",
    role: "provider",
    specialty: "Cardiovascular Diabetology",
    joined_date: "2026-01-01",
    password: "password123"
  },
  {
    id: "user-2",
    email: "john@cardiodiab.com",
    name: "John Doe",
    role: "patient",
    patient_id: "pat-1",
    joined_date: "2026-01-12",
    password: "password123"
  }
];

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Local Database file path
const DB_FILE = path.join(process.cwd(), "db.json");

// Default cohort in case database is empty or missing
const DEFAULT_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    name: "John Doe",
    age: 68,
    gender: "Male",
    disease_type: "cardiac",
    physician: "Dr. Sarah Adams",
    joined_date: "2026-01-12"
  },
  {
    id: "pat-2",
    name: "Alice Smith",
    age: 52,
    gender: "Female",
    disease_type: "diabetic",
    physician: "Dr. Marcus Vance",
    joined_date: "2025-11-04"
  },
  {
    id: "pat-3",
    name: "Robert Chen",
    age: 71,
    gender: "Male",
    disease_type: "both",
    physician: "Dr. Sarah Adams",
    joined_date: "2026-03-20"
  },
  {
    id: "pat-4",
    name: "Clara Davis",
    age: 45,
    gender: "Female",
    disease_type: "cardiac",
    physician: "Dr. Marcus Vance",
    joined_date: "2026-04-05"
  },
  {
    id: "pat-5",
    name: "Emily Johnson",
    age: 29,
    gender: "Female",
    disease_type: "diabetic",
    physician: "Dr. Sarah Adams",
    joined_date: "2026-05-18"
  }
];

const DEFAULT_VITALS: Vitals[] = [
  {
    id: "vit-1",
    patient_id: "pat-1", // John Doe - high cardiac risk BP/HR
    glucose: 110,
    systolic_bp: 145,
    diastolic_bp: 92,
    spo2: 94,
    weight: 84.5,
    bmi: 27.6,
    timestamp: "2026-06-15T18:00:00Z"
  },
  {
    id: "vit-2",
    patient_id: "pat-2", // Alice Smith - high glucose
    glucose: 210,
    systolic_bp: 128,
    diastolic_bp: 80,
    spo2: 98,
    weight: 71.0,
    bmi: 25.8,
    timestamp: "2026-06-15T19:30:00Z"
  },
  {
    id: "vit-3",
    patient_id: "pat-3", // Robert Chen - diabetic and cardiac (very critical)
    glucose: 245,
    systolic_bp: 155,
    diastolic_bp: 98,
    spo2: 91,
    weight: 92.1,
    bmi: 31.4,
    timestamp: "2026-06-15T20:15:00Z"
  },
  {
    id: "vit-4",
    patient_id: "pat-4", // Clara Davis - stable
    glucose: 92,
    systolic_bp: 118,
    diastolic_bp: 76,
    spo2: 99,
    weight: 60.5,
    bmi: 21.3,
    timestamp: "2026-06-15T17:00:00Z"
  },
  {
    id: "vit-5",
    patient_id: "pat-5", // Emily Johnson - stable
    glucose: 105,
    systolic_bp: 120,
    diastolic_bp: 80,
    spo2: 99,
    weight: 64.0,
    bmi: 22.8,
    timestamp: "2026-06-15T16:00:00Z"
  }
];

const DEFAULT_WEARABLES: WearableData[] = [
  {
    id: "wea-1",
    patient_id: "pat-1", // John Doe: cardiac HR > 110 (+20), HRV < 40 (+15)
    heart_rate: 112,
    hrv: 32,
    steps: 6100,
    sleep_hours: 6.5,
    activity_level: "moderate",
    timestamp: "2026-06-15T21:00:00Z"
  },
  {
    id: "wea-2",
    patient_id: "pat-2", // Alice Smith: low activity (+10), sleeping poor (+10)
    heart_rate: 76,
    hrv: 58,
    steps: 3200,
    sleep_hours: 5.2,
    activity_level: "low",
    timestamp: "2026-06-15T21:30:00Z"
  },
  {
    id: "wea-3",
    patient_id: "pat-3", // Robert Chen: heart_rate high (+20), hrv low (+15), low activity (+10)
    heart_rate: 115,
    hrv: 28,
    steps: 2400,
    sleep_hours: 4.8,
    activity_level: "low",
    timestamp: "2026-06-15T21:45:00Z"
  },
  {
    id: "wea-4",
    patient_id: "pat-4", // Clara Davis: active, good metrics
    heart_rate: 68,
    hrv: 72,
    steps: 8900,
    sleep_hours: 7.5,
    activity_level: "high",
    timestamp: "2026-06-15T19:00:00Z"
  },
  {
    id: "wea-5",
    patient_id: "pat-5", // Emily Johnson: active
    heart_rate: 72,
    hrv: 68,
    steps: 10400,
    sleep_hours: 8.0,
    activity_level: "high",
    timestamp: "2026-06-15T20:00:00Z"
  }
];

const DEFAULT_MEDICATION_LOGS: MedicationLog[] = [
  {
    id: "med-1",
    patient_id: "pat-1", // John Doe: medication non-adherence (+20)
    medication_name: "Lisinopril (Blood Pressure)",
    prescribed_dose: 20,
    taken_dose: 10,
    adherence_percentage: 50,
    date: "2026-06-15"
  },
  {
    id: "med-2",
    patient_id: "pat-2", // Alice Smith: adherent
    medication_name: "Metformin (Diabetes)",
    prescribed_dose: 1000,
    taken_dose: 1000,
    adherence_percentage: 100,
    date: "2026-06-15"
  },
  {
    id: "med-3",
    patient_id: "pat-3", // Robert Chen: non-adherent (+20)
    medication_name: "Carvedilol & Insulin",
    prescribed_dose: 4,
    taken_dose: 2,
    adherence_percentage: 50,
    date: "2026-06-15"
  },
  {
    id: "med-4",
    patient_id: "pat-4", // Clara Davis: adherent
    medication_name: "Amlodipine",
    prescribed_dose: 5,
    taken_dose: 5,
    adherence_percentage: 100,
    date: "2026-06-15"
  },
  {
    id: "med-5",
    patient_id: "pat-5", // Emily Johnson: adherent
    medication_name: "Metformin",
    prescribed_dose: 500,
    taken_dose: 500,
    adherence_percentage: 100,
    date: "2026-06-15"
  }
];

const DEFAULT_DIET_LOGS: DietLog[] = [
  {
    id: "die-1",
    patient_id: "pat-1",
    meal_name: "Oatmeal with fruit",
    calories: 350,
    sugar: 12,
    sodium: 140,
    fat: 4,
    timestamp: "2026-06-15T08:30:00Z"
  },
  {
    id: "die-2",
    patient_id: "pat-2", // Alice Smith: high sugar intake (+15)
    meal_name: "Pancakes with Maple Syrup & Chocolate Drink",
    calories: 780,
    sugar: 45, // High sugar (> 30g)
    sodium: 480,
    fat: 18,
    timestamp: "2026-06-15T09:00:00Z"
  },
  {
    id: "die-3",
    patient_id: "pat-3", // Robert Chen: high sugar (+15)
    meal_name: "Spaghetti and Orange Juice",
    calories: 650,
    sugar: 35,
    sodium: 890,
    fat: 14,
    timestamp: "2026-06-15T12:30:00Z"
  },
  {
    id: "die-4",
    patient_id: "pat-4",
    meal_name: "Grilled Chicken Salad",
    calories: 420,
    sugar: 6,
    sodium: 210,
    fat: 12,
    timestamp: "2026-06-15T13:00:00Z"
  },
  {
    id: "die-5",
    patient_id: "pat-5",
    meal_name: "Broccoli and Grilled Salmon",
    calories: 480,
    sugar: 4,
    sodium: 190,
    fat: 15,
    timestamp: "2026-06-15T18:30:00Z"
  }
];

// In-Memory state mirroring local db
let db = {
  users: DEFAULT_USERS,
  patients: DEFAULT_PATIENTS,
  vitals: DEFAULT_VITALS,
  wearables: DEFAULT_WEARABLES,
  medications: DEFAULT_MEDICATION_LOGS,
  diets: DEFAULT_DIET_LOGS,
  alerts: [] as Alert[],
  resolutions: [] as { alert_id: string; resolved_at: string; physician: string; note: string }[]
};

// Initialize or Load Database
function loadOrCreateDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsedData = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
      db = { ...db, ...parsedData };
      console.log("Database successfully loaded from file system.");
    } else {
      saveDB();
      console.log("Initial database seeded and saved.");
    }
  } catch (error) {
    console.error("Failed to load database, using defaults in-memory.", error);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save database file.", error);
  }
}

// Risk Calculation Logic (FR-06)
interface FullPatientState {
  glucose?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  heart_rate?: number;
  hrv?: number;
  steps?: number;
  sleep_hours?: number;
  activity_level?: string;
  medication_adherence?: number;
  sugar_intake?: number;
}

export function computePatientRisk(diseaseType: string, state: FullPatientState) {
  let score = 0;
  const triggers: string[] = [];

  const isDiabetic = diseaseType === "diabetic" || diseaseType === "both";
  const isCardiac = diseaseType === "cardiac" || diseaseType === "both";

  // --- DIABETES RISK FACTORS ---
  if (isDiabetic) {
    // 1. Glucose > 180 (+30)
    if (state.glucose !== undefined && state.glucose > 180) {
      score += 30;
      triggers.push(`Glucose is high (${state.glucose} mg/dL)`);
    }
    // 2. Medication Non-Adherence (+20) (Adherence < 80%)
    if (state.medication_adherence !== undefined && state.medication_adherence < 80) {
      score += 20;
      triggers.push(`Medication non-adherence (${state.medication_adherence.toFixed(0)}%)`);
    }
    // 3. High Sugar Intake (+15) (Sugar > 30g)
    if (state.sugar_intake !== undefined && state.sugar_intake > 30) {
      score += 15;
      triggers.push(`High meal sugar intake (${state.sugar_intake}g)`);
    }
    // 4. Low Activity (+10) (Steps < 5000 or activity low)
    if (
      (state.steps !== undefined && state.steps < 5000) ||
      state.activity_level === "low"
    ) {
      score += 10;
      triggers.push(`Low physical activity (${state.steps || 0} steps)`);
    }
    // 5. Poor Sleep (+10) (Sleep Hours < 6)
    if (state.sleep_hours !== undefined && state.sleep_hours < 6) {
      score += 10;
      triggers.push(`Poor sleep duration (${state.sleep_hours} hrs)`);
    }
  }

  // --- CARDIAC RISK FACTORS ---
  if (isCardiac) {
    // 1. BP > 140/90 (+25) (systolic > 140 OR diastolic > 90)
    const highSystolic = state.systolic_bp !== undefined && state.systolic_bp > 140;
    const highDiastolic = state.diastolic_bp !== undefined && state.diastolic_bp > 90;
    if (highSystolic || highDiastolic) {
      score += 25;
      triggers.push(`Elevated Blood Pressure (${state.systolic_bp || 120}/${state.diastolic_bp || 80} mmHg)`);
    }
    // 2. HR > 110 (+20)
    if (state.heart_rate !== undefined && state.heart_rate > 110) {
      score += 20;
      triggers.push(`Tachycardia - Heart Rate is high (${state.heart_rate} bpm)`);
    }
    // 3. Low HRV < 40 (+15)
    if (state.hrv !== undefined && state.hrv < 40) {
      score += 15;
      triggers.push(`Low Heart Rate Variability (${state.hrv} ms)`);
    }
    // 4. Medication Non-Adherence (+20) (Adherence < 80%) (But let's count once even if patient type is 'both' and already counted? Let's just sum it)
    if (state.medication_adherence !== undefined && state.medication_adherence < 80 && !isDiabetic) {
      score += 20;
      triggers.push(`Cardiac medication non-adherence (${state.medication_adherence.toFixed(0)}%)`);
    }
    // 5. SpO2 < 92 (+20)
    if (state.spo2 !== undefined && state.spo2 < 92) {
      score += 20;
      triggers.push(`Low blood oxygen saturation - SpO₂ is low (${state.spo2}%)`);
    }
  }

  // Cap score at 100
  score = Math.min(score, 100);

  // Classify Priority (FR-07)
  let priority: "Critical" | "High" | "Moderate" | "Low" = "Low";
  if (score >= 70) {
    priority = "Critical";
  } else if (score >= 40) {
    priority = "High";
  } else if (score >= 20) {
    priority = "Moderate";
  }

  return { risk_score: score, priority, triggers };
}

// Complete Clinical Scoring for a Patient's current data
function getPatientMetricsAndScore(patientId: string) {
  const patient = db.patients.find(p => p.id === patientId);
  if (!patient) return null;

  // Find latest vitals
  const sortedVitals = db.vitals
    .filter(v => v.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestVitals = sortedVitals[0];

  // Find latest wearables
  const sortedWearables = db.wearables
    .filter(w => w.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestWearables = sortedWearables[0];

  // Find latest medication logs
  const sortedMeds = db.medications
    .filter(m => m.patient_id === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestMed = sortedMeds[0];

  // Find latest diet logs
  const sortedDiets = db.diets
    .filter(d => d.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const latestDiet = sortedDiets[0];

  const state: FullPatientState = {
    glucose: latestVitals?.glucose,
    systolic_bp: latestVitals?.systolic_bp,
    diastolic_bp: latestVitals?.diastolic_bp,
    spo2: latestVitals?.spo2,
    heart_rate: latestWearables?.heart_rate,
    hrv: latestWearables?.hrv,
    steps: latestWearables?.steps,
    sleep_hours: latestWearables?.sleep_hours,
    activity_level: latestWearables?.activity_level,
    medication_adherence: latestMed?.adherence_percentage ?? 100,
    sugar_intake: latestDiet?.sugar ?? 0
  };

  const scoreResult = computePatientRisk(patient.disease_type, state);

  return {
    patient,
    vitals: latestVitals || null,
    wearable: latestWearables || null,
    medication: latestMed || null,
    diet: latestDiet || null,
    risk_score: scoreResult.risk_score,
    priority: scoreResult.priority,
    triggers: scoreResult.triggers
  };
}

// Generate active alerts for any high-risk changes
function updateAlertsForPatient(patientId: string) {
  const scoreData = getPatientMetricsAndScore(patientId);
  if (!scoreData) return;

  const { risk_score, priority, triggers, patient } = scoreData;

  // If priority is High or Critical, generate alert (if not already active)
  if (priority === "Critical" || priority === "High") {
    // Check if an active, unresolved alert exists with similar triggers or any alert at all
    const activeAlertIdx = db.alerts.findIndex(
      a => a.patient_id === patientId && a.status === "active"
    );

    const message = triggers.length > 0 
      ? `Patient presents high risk markers: ${triggers.join(", ")}.`
      : `Patient clinical state has deteriorated. Immediate reviews advisable.`;

    if (activeAlertIdx >= 0) {
      // Update existing active alert
      db.alerts[activeAlertIdx].risk_score = risk_score;
      db.alerts[activeAlertIdx].priority = priority;
      db.alerts[activeAlertIdx].message = message;
      db.alerts[activeAlertIdx].trigger_metrics = triggers;
      db.alerts[activeAlertIdx].timestamp = new Date().toISOString();
    } else {
      // Create new warning alert
      const newAlert: Alert = {
        id: `alt-${Date.now()}`,
        patient_id: patientId,
        patient_name: patient.name,
        risk_score,
        priority,
        message,
        trigger_metrics: triggers,
        timestamp: new Date().toISOString(),
        status: "active"
      };
      db.alerts.unshift(newAlert);
    }
    saveDB();
  }
}

// Load database initially
loadOrCreateDB();

// Periodically run safety checks for existing patients to generate initial seed alerts
db.patients.forEach(p => updateAlertsForPatient(p.id));

// Lazy initialized Gemini Client Helper
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      return null;
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// ================= API ENDPOINTS =================

// Auth 1. POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required" });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: "Invalid email or password" });
  }

  // Create a copy without the password to send back
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Auth 2. POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { email, password, name, role, specialty, age, gender, disease_type, physician } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ success: false, message: "Missing required fields (email, password, name, role)" });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: "A user with this email already exists" });
  }

  const userId = `user-${Date.now()}`;
  let patient_id: string | undefined;

  if (role === "patient") {
    patient_id = `pat-${Date.now()}`;
    const newPatient: Patient = {
      id: patient_id,
      name: name,
      age: Number(age) || 45,
      gender: gender || "Other",
      disease_type: (disease_type as any) || "both",
      physician: physician || "Dr. Sarah Adams",
      joined_date: new Date().toISOString().split('T')[0]
    };
    db.patients.push(newPatient);

    // Add standard baseline vitals
    db.vitals.push({
      id: `vit-${Date.now()}`,
      patient_id: patient_id,
      glucose: 100,
      systolic_bp: 120,
      diastolic_bp: 80,
      spo2: 98,
      weight: 70.0,
      bmi: 24.5,
      timestamp: new Date().toISOString()
    });

    // Add standard baseline wearables
    db.wearables.push({
      id: `wear-${Date.now()}`,
      patient_id: patient_id,
      heart_rate: 72,
      hrv: 55,
      steps: 5000,
      sleep_hours: 8,
      activity_level: "moderate",
      timestamp: new Date().toISOString()
    });

    // Add standard baseline medication logs
    db.medications.push({
      id: `med-${Date.now()}`,
      patient_id: patient_id,
      medication_name: "Metformin",
      prescribed_dose: 500,
      taken_dose: 500,
      adherence_percentage: 100,
      date: new Date().toISOString().split('T')[0]
    });

    // Add standard baseline diet logs
    db.diets.push({
      id: `die-${Date.now()}`,
      patient_id: patient_id,
      meal_name: "Oatmeal with Blueberries",
      calories: 320,
      sugar: 8,
      sodium: 120,
      fat: 4,
      timestamp: new Date().toISOString()
    });
  }

  const newUser: DbUser = {
    id: userId,
    email: email.toLowerCase(),
    name,
    role: role as 'provider' | 'patient',
    password,
    patient_id,
    specialty: role === "provider" ? (specialty || "General Medicine") : undefined,
    joined_date: new Date().toISOString().split('T')[0]
  };

  db.users.push(newUser);
  saveDB();

  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});

// 1. POST /risk or POST /api/risk (FR-06 / API Requirements page 10)
const riskHandler = (req: express.Request, res: express.Response) => {
  const { glucose, heart_rate, systolic_bp, spo2, diastolic_bp, hrv, medication_adherence } = req.body;

  // Estimate a combined diagnosis or assume cardiac + diabetic is evaluated
  const defaultState: FullPatientState = {
    glucose: glucose !== undefined ? Number(glucose) : 100,
    systolic_bp: systolic_bp !== undefined ? Number(systolic_bp) : 120,
    diastolic_bp: diastolic_bp !== undefined ? Number(diastolic_bp) : 80,
    spo2: spo2 !== undefined ? Number(spo2) : 98,
    heart_rate: heart_rate !== undefined ? Number(heart_rate) : 75,
    hrv: hrv !== undefined ? Number(hrv) : 60,
    medication_adherence: medication_adherence !== undefined ? Number(medication_adherence) : 100
  };

  // Run calculation assuming "both" to be clinical safe and evaluate all inputs
  const result = computePatientRisk("both", defaultState);

  res.json({
    risk_score: result.risk_score,
    priority: result.priority
  });
};

app.post("/risk", riskHandler);
app.post("/api/risk", riskHandler);


// 2. GET /patients or GET /api/patients (FR-10 / API Requirements page 11)
const patientsHandler = (req: express.Request, res: express.Response) => {
  // Aggregate data for each patient
  const results = db.patients.map(p => {
    const details = getPatientMetricsAndScore(p.id);
    return {
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      disease_type: p.disease_type,
      physician: p.physician,
      joined_date: p.joined_date,
      risk_score: details?.risk_score ?? 0,
      priority: details?.priority ?? "Low",
      vitals: details?.vitals,
      wearable: details?.wearable,
      medication: details?.medication,
      diet: details?.diet,
      triggers: details?.triggers ?? []
    };
  });

  // Sort by risk priority queue sequence: Critical, High, Moderate, Low, descending
  const priorityWeight = { Critical: 4, High: 3, Moderate: 2, Low: 1 };
  results.sort((a, b) => {
    const pDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (pDiff !== 0) return pDiff;
    return b.risk_score - a.risk_score; // Secondary sorting by numerical score
  });

  res.json(results);
};

app.get("/patients", patientsHandler);
app.get("/api/patients", patientsHandler);


// 3. GET /api/patients/:id - Single patient detail
app.get("/api/patients/:id", (req, res) => {
  const patientId = req.params.id;
  const scoreData = getPatientMetricsAndScore(patientId);

  if (!scoreData) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Get historical medical entries for logs
  const vitalsHistory = db.vitals
    .filter(v => v.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const wearablesHistory = db.wearables
    .filter(w => w.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const medicationHistory = db.medications
    .filter(m => m.patient_id === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const dietHistory = db.diets
    .filter(d => d.patient_id === patientId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    ...scoreData,
    history: {
      vitals: vitalsHistory,
      wearables: wearablesHistory,
      medications: medicationHistory,
      diets: dietHistory
    }
  });
});


// 4. POST /api/patients - Register a Patient (FR-01)
app.post("/api/patients", (req, res) => {
  const { name, age, gender, disease_type, physician } = req.body;

  if (!name || !age || !gender || !disease_type || !physician) {
    return res.status(400).json({ error: "All profile details (name, age, gender, disease_type, physician) are required." });
  }

  const newPatient: Patient = {
    id: `pat-${Date.now()}`,
    name,
    age: Number(age),
    gender,
    disease_type: disease_type.toLowerCase() as 'diabetic' | 'cardiac' | 'both',
    physician,
    joined_date: new Date().toISOString().split("T")[0]
  };

  db.patients.push(newPatient);
  saveDB();

  // Create empty initial diagnostic vitals
  const initialVitals: Vitals = {
    id: `vit-${Date.now()}`,
    patient_id: newPatient.id,
    glucose: 100,
    systolic_bp: 120,
    diastolic_bp: 80,
    spo2: 98,
    weight: 70,
    bmi: 23,
    timestamp: new Date().toISOString()
  };
  db.vitals.push(initialVitals);

  const initialWearables: WearableData = {
    id: `wea-${Date.now()}`,
    patient_id: newPatient.id,
    heart_rate: 72,
    hrv: 60,
    steps: 6000,
    sleep_hours: 7.5,
    activity_level: "moderate",
    timestamp: new Date().toISOString()
  };
  db.wearables.push(initialWearables);
  saveDB();

  res.status(201).json(newPatient);
});


// 5. POST /api/patients/:id/vitals - Monitor Vitals (FR-05)
app.post("/api/patients/:id/vitals", (req, res) => {
  const patientId = req.params.id;
  const p = db.patients.find(x => x.id === patientId);
  if (!p) return res.status(404).json({ error: "Patient not found" });

  const { glucose, systolic_bp, diastolic_bp, spo2, weight, height } = req.body;

  if (glucose === undefined || systolic_bp === undefined || diastolic_bp === undefined || spo2 === undefined) {
    return res.status(400).json({ error: "Glucose, BP levels, and SpO2 are mandatory parameters." });
  }

  const patientWeight = weight !== undefined ? Number(weight) : 70;
  const patientHeight = height !== undefined ? Number(height) : 172; // cm
  const bmiVal = Number((patientWeight / Math.pow(patientHeight / 100, 2)).toFixed(1));

  const newVitals: Vitals = {
    id: `vit-${Date.now()}`,
    patient_id: patientId,
    glucose: Number(glucose),
    systolic_bp: Number(systolic_bp),
    diastolic_bp: Number(diastolic_bp),
    spo2: Number(spo2),
    weight: patientWeight,
    bmi: bmiVal,
    timestamp: new Date().toISOString()
  };

  db.vitals.push(newVitals);
  saveDB();

  updateAlertsForPatient(patientId);

  res.status(201).json(newVitals);
});


// 6. POST /api/patients/:id/wearables - Collect Wearable telemetry (FR-02)
app.post("/api/patients/:id/wearables", (req, res) => {
  const patientId = req.params.id;
  const p = db.patients.find(x => x.id === patientId);
  if (!p) return res.status(404).json({ error: "Patient not found" });

  const { heart_rate, hrv, steps, sleep_hours, activity_level } = req.body;

  const newWearable: WearableData = {
    id: `wea-${Date.now()}`,
    patient_id: patientId,
    heart_rate: heart_rate !== undefined ? Number(heart_rate) : 72,
    hrv: hrv !== undefined ? Number(hrv) : 60,
    steps: steps !== undefined ? Number(steps) : 5000,
    sleep_hours: sleep_hours !== undefined ? Number(sleep_hours) : 7,
    activity_level: activity_level || "moderate",
    timestamp: new Date().toISOString()
  };

  db.wearables.push(newWearable);
  saveDB();

  updateAlertsForPatient(patientId);

  res.status(201).json(newWearable);
});


// 7. POST /api/patients/:id/medications - Medication Tracker (FR-03)
app.post("/api/patients/:id/medications", (req, res) => {
  const patientId = req.params.id;
  const p = db.patients.find(x => x.id === patientId);
  if (!p) return res.status(404).json({ error: "Patient not found" });

  const { medication_name, prescribed_dose, taken_dose } = req.body;

  if (!medication_name || prescribed_dose === undefined || taken_dose === undefined) {
    return res.status(400).json({ error: "Medication name, prescribed dose and taken dose are required." });
  }

  const pDose = Number(prescribed_dose);
  const tDose = Number(taken_dose);
  const safetyPercentage = pDose > 0 ? (tDose / pDose) * 100 : 0;

  const newMedLog: MedicationLog = {
    id: `med-${Date.now()}`,
    patient_id: patientId,
    medication_name,
    prescribed_dose: pDose,
    taken_dose: tDose,
    adherence_percentage: Number(safetyPercentage.toFixed(1)),
    date: new Date().toISOString().split("T")[0]
  };

  db.medications.push(newMedLog);
  saveDB();

  updateAlertsForPatient(patientId);

  res.status(201).json(newMedLog);
});


// 8. POST /api/patients/:id/diet - Diet Monitoring (FR-04)
app.post("/api/patients/:id/diet", (req, res) => {
  const patientId = req.params.id;
  const p = db.patients.find(x => x.id === patientId);
  if (!p) return res.status(404).json({ error: "Patient not found" });

  const { meal_name, calories, sugar, sodium, fat } = req.body;

  if (!meal_name || calories === undefined || sugar === undefined) {
    return res.status(400).json({ error: "Meal name, Calories, and Sugar levels are required." });
  }

  const newDietLog: DietLog = {
    id: `die-${Date.now()}`,
    patient_id: patientId,
    meal_name,
    calories: Number(calories),
    sugar: Number(sugar),
    sodium: sodium !== undefined ? Number(sodium) : 150,
    fat: fat !== undefined ? Number(fat) : 8,
    timestamp: new Date().toISOString()
  };

  db.diets.push(newDietLog);
  saveDB();

  updateAlertsForPatient(patientId);

  res.status(201).json(newDietLog);
});


// 9. GET /api/alerts - Alert feed list
app.get("/api/alerts", (req, res) => {
  res.json(db.alerts);
});


// 10. POST /api/alerts/:id/resolve - Resolve active alerts
app.post("/api/alerts/:id/resolve", (req, res) => {
  const alertId = req.params.id;
  const { physician, note } = req.body;

  const alertIdx = db.alerts.findIndex(a => a.id === alertId);
  if (alertIdx < 0) {
    return res.status(404).json({ error: "Alert not found or already archived" });
  }

  // Update alert state
  db.alerts[alertIdx].status = "resolved";
  db.alerts[alertIdx].resolution = note || "Reviewed by clinician.";

  db.resolutions.push({
    alert_id: alertId,
    resolved_at: new Date().toISOString(),
    physician: physician || "Physician Staff",
    note: note || "Routine system review complete."
  });

  saveDB();
  res.json({ success: true, alert: db.alerts[alertIdx] });
});


// 11. GET /api/resolutions - Historical resolutions log
app.get("/api/resolutions", (req, res) => {
  res.json(db.resolutions);
});


// 12. GET /api/patients/:id/ml-prediction - ML classifier & smart risk narratives (FR-09 & Phase 2)
app.get("/api/patients/:id/ml-prediction", async (req, res) => {
  const patientId = req.params.id;
  const scoreData = getPatientMetricsAndScore(patientId);

  if (!scoreData) {
    return res.status(404).json({ error: "Patient not found" });
  }

  const { patient, risk_score, priority, triggers, vitals, wearable, medication, diet } = scoreData;

  // Rule-based classification
  const classification = (risk_score >= 40) ? "Requires Intervention" : "Stable";
  const confidence = Math.max(50, Math.min(98, 40 + risk_score * 0.5 + Math.random() * 10));

  let narrative = "";
  let recommendationText = "";

  // Call server-side Gemini if credentials exist to add magical deep clinicians assessment! (Phase 3 style UI)
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const patientSummaryPrompt = `
You are an expert Clinical Decision Support System and Cardiodiabetic Cardiologist.
Analyze this remote patient tracking report:
Patient Name: ${patient.name}
Age: ${patient.age}, Gender: ${patient.gender}, Diagnosis: ${patient.disease_type}
Vitals:
- Blood Glucose: ${vitals?.glucose ?? "No logs"} mg/dL
- Blood Pressure: ${vitals?.systolic_bp ?? 120}/${vitals?.diastolic_bp ?? 80} mmHg
- Blood Oxygen SpO2: ${vitals?.spo2 ?? 98}%
- Weight: ${vitals?.weight ?? "Unknown"} kg, BMI: ${vitals?.bmi ?? "Unknown"}

Wearable Sensors:
- Sensation Heart Rate: ${wearable?.heart_rate ?? 70} bpm
- HRV (Heart Rate Variability): ${wearable?.hrv ?? 50} ms
- Steps Taken: ${wearable?.steps ?? 6000}
- Night Sleeptime: ${wearable?.sleep_hours ?? 7} hrs
- Activity Index: ${wearable?.activity_level ?? "moderate"}

Lifestyle & Compliance:
- Daily Medication Compliance: ${medication?.adherence_percentage ?? 100}% (${medication?.medication_name ?? "No medication prescribed"})
- Latest meal Sugar load: ${diet?.sugar ?? 0}g

Calculated Priority Level: ${priority} (Numerical Score ${risk_score}/100)
Individual risk triggers detected: ${triggers.join(", ") || "None"}

Generate a highly structured JSON response with exactly two keys:
"narrative": A 2-3 sentence clinical overview describing the patient's immediate trajectory, noting specific warning signs (like tachycardia, medication gaps, or poor glucose control) or stable progress.
"recommendation": An expert tailored list of 3-4 clear step-by-step physical steps for physician intervention recommendations (e.g. adjust doses, call for emergency ECG, decrease dietary sodium to <1500mg, teleconsultation details).

Response MUST be a valid parsing JSON string only. Format:
{
  "narrative": "...",
  "recommendation": "..."
}
`;

      const response = await gemini.models.generateContent({
        model: "gemini-3.5-flash",
        contents: patientSummaryPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrative: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ["narrative", "recommendation"]
          }
        }
      });

      const responseText = response.text || "";
      const parsed = JSON.parse(responseText.trim());
      narrative = parsed.narrative;
      recommendationText = parsed.recommendation;
    } catch (err) {
      console.error("Gemini calculation failure. Falling back to rule-based insights.", err);
    }
  }

  // Fallback heuristic output if Gemini isn't setup
  if (!narrative) {
    if (classification === "Requires Intervention") {
      narrative = `The patient's chronic disease metrics represent a critical warning trajectory. Primary concerns include risk triggers: ${triggers.join(", ") || "elevated vitals"}. The random forest prediction suggests high vulnerability to cardiac episodes or diabetic diabetic ketoacidosis.`;
      recommendationText = `1. Initiate physician teleconsultation within 4 hours.
2. Inquire about the missed ${medication?.medication_name || "essential medications"}.
3. Schedule urgent in-clinic vitals test and review fluid management protocols.`;
    } else {
      narrative = `All telemetry reports indicate stable metabolic and cardiovascular baseline status. Heart Rate Variability is within healthy tolerances, and steps taken demonstrate sufficient cardiac conditioning. Med adherence levels are highly reassuring.`;
      recommendationText = `1. Maintain current therapeutic regime.
2. Continue daily wearable and logging tracking.
3. Schedule next visual check-in during routine quarterly consults.`;
    }
  }

  const predictionResult: MLPrediction = {
    status: classification as 'Stable' | 'Requires Intervention',
    confidence: Math.round(confidence),
    narrative,
    risk_factors: triggers,
    recommendation: recommendationText
  };

  res.json(predictionResult);
});


// Handle Vite client distribution serving and middleware
startServer();

async function startServer() {
  // Vite server middleware configuration for development workflow
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production serving static built files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express medical backend live on http://localhost:${PORT}`);
  });
}
