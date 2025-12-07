// src/domain/cases/types.ts

// ----- Basic enums/unions -----

export type SchoolPeriod = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type Acuity = "AKUT" | "SUBAKUT";

export type AbcdeLetter = "A" | "B" | "C" | "D" | "E";
export type SamplerLetter = "S" | "A" | "M" | "P" | "L" | "E" | "R";
export type OpqrstLetter = "O" | "P" | "Q" | "R" | "S" | "T";

export type ActionImportance =
  | "CRITICAL"
  | "IMPORTANT"
  | "OPTIONAL"
  | "FORBIDDEN";

export type DoseStrength = "HALF" | "NORMAL" | "DOUBLE";

export type MedicationType = "drug" | "oxygen";

export type Screen = "home" | "caseList" | "caseDetail" | "summary";

// ----- Core case model -----

export interface PatientVitals {
  hr: number;
  rr: number;
  btSys: number;
  btDia: number;
  spo2: number;
  temp?: number;
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
}

export interface CaseScenario {
  id: string;
  title: string;        // "skp 1 – AKS – M 58 sygdom"
  subtitle: string;     // "(mand 58 år, ...)"
  dispatchText: string;
  schoolPeriods: SchoolPeriod[];
  acuity: Acuity;
  difficulty: 1 | 2 | 3;
  diagnosis: string;
  actionDiagnoses: string[];
  caseType: string;     // "AKS", "Hypoglykæmi", "SVT", ...
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

// ----- Actions, meds, evaluation -----

export interface AbcdeAction {
  id: string;
  letter: AbcdeLetter;
  label: string;
}

export interface Medication {
  id: string;
  name: string;
  type: MedicationType;
  normalDose?: number;   // you fill these in from Region H guidelines
  unit?: string;         // "mg", "µg", "ml", etc.
  note?: string;
  oxygenFlows?: number[]; // for medicinsk ilt
}

export interface ActionLogEntry {
  id: string;
  timeMs: number;
  actionId: string;
  description: string;
  resultingStateId: string;
}

export interface EvaluatedAction {
  expected: ExpectedAction;
  logEntry?: ActionLogEntry;
  status: "GREEN" | "YELLOW" | "RED";
  comment: string;
}
