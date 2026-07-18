export type SchoolPeriod = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Acuity = "AKUT" | "SUBAKUT";
export type CaseCategory = "MEDICAL" | "TRAUMA" | "HLR";
export type HlrLevel = "BLS" | "ALS";

export type AbcdeLetter = "A" | "B" | "C" | "D" | "E";
export type SamplerLetter = "S" | "A" | "M" | "P" | "L" | "E" | "R";
export type OpqrstLetter = "O" | "P" | "Q" | "R" | "S" | "T";
export type MidasheLetter = "M" | "I" | "D" | "A" | "S" | "H" | "E";

export type ActionImportance =
  | "CRITICAL"
  | "IMPORTANT"
  | "OPTIONAL"
  | "FORBIDDEN";
export type DoseStrength = "HALF" | "NORMAL" | "DOUBLE";
export type MedicationType = "drug" | "oxygen";
export type AssistanceChoice = "EKSTRA_AMBULANCE" | "AKUTBIL" | "LAEGEBIL";
export type Screen = "home" | "caseList" | "caseDetail" | "summary";

export interface PatientVitals {
  hr: number;
  rr: number;
  btSys: number;
  btDia: number;
  spo2: number;
  // Older case definitions may not contain all monitor values.
  etco2?: number;
  temp?: number;
  bs?: number;
  gcs?: number;
  painNrs?: number;
}

export interface PatientAbcde {
  A: string;
  B: string;
  C: string;
  D: string;
  E: string;
}

export interface PatientState {
  id: string;
  vitals: PatientVitals;
  abcde: PatientAbcde;
  extraInfo?: string;
}

export interface Transition {
  id: string;
  fromStateId: string;
  toStateId: string;
  actionId: string;
  feedbackToFacilitator: string;
}

export interface ExpectedAction {
  actionId: string;
  importance: ActionImportance;
  recommendedBeforeSec?: number;
  mustBeforeSec?: number;
  timeTargetsSec?: {
    green: number;
    yellow: number;
    red: number;
  };
  title?: string;
  label?: string;
  actionLabel?: string;
  successText?: string;
  improveText?: string;
  criticalText?: string;
}

export interface CaseMetadata {
  hlrLevel?: HlrLevel;
  [key: string]: unknown;
}

export interface CaseScenario {
  id: string;
  title: string;
  subtitle: string;
  dispatchText: string;
  schoolPeriods: SchoolPeriod[];
  acuity: Acuity;
  difficulty: 1 | 2 | 3;
  diagnosis: string;
  actionDiagnoses: string[];
  caseType: string;
  category?: CaseCategory;
  meta?: CaseMetadata;
  patientInfo: {
    age: number;
    sex: "M" | "K";
    chiefComplaint: string;
    history: string;
    meds: string[];
  };
  initialStateId: string;
  states: PatientState[];
  transitions: Transition[];
  expectedActions: ExpectedAction[];
}

export interface AbcdeAction {
  id: string;
  letter: AbcdeLetter;
  label: string;
}

export interface Medication {
  id: string;
  name: string;
  type: MedicationType;
  normalDose?: number;
  unit?: string;
  note?: string;
  oxygenFlows?: number[];
}

export interface ActionLogMetadata {
  doseStrength?: DoseStrength;
  baseDose?: number | null;
  factor?: number;
  actualDose?: number;
  unit?: string;
  oxygenFlow?: number;
  triage?: "CRITICAL" | "NONCRITICAL";
  assistance?: AssistanceChoice | boolean;
  cpr?: {
    type: string;
    level: HlrLevel;
    [key: string]: unknown;
  };
  source?: "DEFIB" | "FACILITATOR" | "SYSTEM";
  originalType?: string;
  payload?: Record<string, unknown> | null;
}

export interface ActionLogEntry {
  id: string;
  timeMs: number;
  actionId: string;
  description: string;
  resultingStateId: string;
  meta?: ActionLogMetadata;
}

export interface EvaluatedAction {
  expected: ExpectedAction;
  logEntry?: ActionLogEntry;
  status: "GREEN" | "YELLOW" | "RED";
  comment: string;
}
