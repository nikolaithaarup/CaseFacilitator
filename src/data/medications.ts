import type { DoseStrength, Medication } from "../domain/cases/types";

// ---------------- Categories ----------------
export type MedicationCategory =
  | "analgesia_sedation"
  | "cardiovascular"
  | "respiratory_allergy"
  | "metabolic_endocrine"
  | "acs_antithrombotic"
  | "fluids"
  | "obstetric"
  | "antidote"
  | "trauma_bleeding";

export const MED_CATEGORY_LABEL: Record<MedicationCategory, string> = {
  analgesia_sedation: "Analgesia / Sedation",
  cardiovascular: "Cardiovascular",
  respiratory_allergy: "Respiratory / Allergy",
  metabolic_endocrine: "Metabolic / Endocrine",
  acs_antithrombotic: "ACS / Antithrombotic",
  fluids: "Fluids / Oxygen",
  obstetric: "Obstetric",
  antidote: "Antidote / Toxicology",
  trauma_bleeding: "Trauma / Bleeding",
};

export const MED_CATEGORY_BY_ID: Record<string, MedicationCategory> = {
  // Analgesia / Sedation
  MED_FENTANYL: "analgesia_sedation",
  MED_DIAZEPAM: "analgesia_sedation",
  MED_MIDAZOLAM: "analgesia_sedation",
  MED_S_KETAMIN: "analgesia_sedation",
  MED_PARACETAMOL: "analgesia_sedation",
  MED_IBUPROFEN: "analgesia_sedation",
  MED_KETOROLAC: "analgesia_sedation",

  // Cardiovascular
  MED_ADRENALIN_IM: "cardiovascular",
  MED_ADRENALIN_IV: "cardiovascular",
  MED_AMIODARON: "cardiovascular",
  MED_ATROPIN: "cardiovascular",
  MED_FUROSEMID: "cardiovascular",
  MED_GLYCERYLNITRAT: "cardiovascular",
  MED_ISOPRENALIN: "cardiovascular",
  MED_LABETALOL: "cardiovascular",

  // Respiratory / Allergy
  MED_SALBUTAMOL: "respiratory_allergy",
  MED_BERODUAL: "respiratory_allergy",
  MED_CLEMASTIN: "respiratory_allergy",
  MED_MEDICINSK_ILT: "respiratory_allergy",
  MED_SOLU_MEDROL: "respiratory_allergy",

  // Metabolic / Endocrine
  MED_GLUKOSE_50: "metabolic_endocrine",
  MED_GLUKAGON: "metabolic_endocrine",
  MED_HYPO_FIT: "metabolic_endocrine",
  MED_GIK: "metabolic_endocrine",
  MED_THIAMIN: "metabolic_endocrine",
  MED_SOLU_CORTEF: "metabolic_endocrine",

  // Fluids
  MED_NACL_ISO: "fluids",

  // ACS / Antithrombotic
  MED_ACETYLSALICYLSYRE: "acs_antithrombotic",
  MED_HEPARIN: "acs_antithrombotic",

  // Antidotes
  MED_NALOXON: "antidote",
  MED_N_ACETYLCYSTEIN: "antidote",

  // Obstetric
  MED_OXYTOCIN: "obstetric",

  // Trauma / Bleeding
  MED_TRANEXAMSYRE: "trauma_bleeding",
};

export function getMedicationCategory(
  id: string
): MedicationCategory | undefined {
  return MED_CATEGORY_BY_ID[id];
}

// ---------------- Dose options (computed per medication) ----------------
export type MedicationDoseOption = {
  id: DoseStrength;
  label: string; // "½ dosis: 0,5 mg"
  factor: number; // 0.5 / 1 / 2
  value: number; // computed numeric dose
  unit: string; // same unit as medication
};

const DOSE_STRENGTH_FACTORS: Array<{
  id: DoseStrength;
  label: string;
  factor: number;
}> = [
  { id: "HALF" as DoseStrength, label: "½ dosis", factor: 0.5 },
  { id: "NORMAL" as DoseStrength, label: "Normal dosis", factor: 1 },
  { id: "DOUBLE" as DoseStrength, label: "Dobbelt dosis", factor: 2 },
];

function formatNumber(n: number): string {
  // keep it readable: 0.25 -> "0,25", 1 -> "1", 2.5 -> "2,5"
  const s = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  return s.replace(".", ",");
}

export function getDoseOptionsForMedication(
  med: Medication | null
): MedicationDoseOption[] {
  if (!med) return [];
  if (med.type !== "drug") return [];

  // normalDose + unit must exist for computed options
  const base = (med as any).normalDose;
  const unit = (med as any).unit;

  if (typeof base !== "number" || !isFinite(base) || !unit) return [];

  return DOSE_STRENGTH_FACTORS.map((d) => {
    const value = base * d.factor;
    return {
      id: d.id,
      factor: d.factor,
      value,
      unit,
      label: `${d.label}: ${formatNumber(value)} ${unit}`,
    };
  });
}

// ---------------- Medications ----------------
export const MEDICATIONS: Medication[] = [
  // ===== ANALGESIA / SEDATION =====
  {
    id: "MED_FENTANYL",
    name: "Fentanyl",
    type: "drug",
    normalDose: 1,
    unit: "µg/kg",
  },
  {
    id: "MED_DIAZEPAM",
    name: "Diazepam",
    type: "drug",
    normalDose: 10,
    unit: "mg",
  },
  {
    id: "MED_MIDAZOLAM",
    name: "Midazolam (buccal)",
    type: "drug",
    normalDose: 10,
    unit: "mg",
  },
  {
    id: "MED_S_KETAMIN",
    name: "S-ketamin",
    type: "drug",
    normalDose: 0.25,
    unit: "mg/kg",
  },
  {
    id: "MED_PARACETAMOL",
    name: "Paracetamol",
    type: "drug",
    normalDose: 1000,
    unit: "mg",
  },
  {
    id: "MED_IBUPROFEN",
    name: "Ibuprofen",
    type: "drug",
    normalDose: 400,
    unit: "mg",
  },
  {
    id: "MED_KETOROLAC",
    name: "Ketorolac",
    type: "drug",
    normalDose: 15,
    unit: "mg",
  },

  // ===== CARDIOVASCULAR =====
  {
    id: "MED_ADRENALIN_IM",
    name: "Adrenalin (IM)",
    type: "drug",
    normalDose: 0.3,
    unit: "mg",
  },
  {
    id: "MED_ADRENALIN_IV",
    name: "Adrenalin (IV)",
    type: "drug",
    normalDose: 1,
    unit: "mg",
  },
  {
    id: "MED_AMIODARON",
    name: "Amiodaron",
    type: "drug",
    normalDose: 300,
    unit: "mg",
  },
  {
    id: "MED_ATROPIN",
    name: "Atropin",
    type: "drug",
    normalDose: 0.5,
    unit: "mg",
  },
  {
    id: "MED_FUROSEMID",
    name: "Furosemid",
    type: "drug",
    normalDose: 40,
    unit: "mg",
  },
  {
    id: "MED_GLYCERYLNITRAT",
    name: "Glycerylnitrat",
    type: "drug",
    normalDose: 0.4,
    unit: "mg",
  },
  {
    id: "MED_ISOPRENALIN",
    name: "Isoprenalin",
    type: "drug",
    normalDose: 0.02,
    unit: "µg/kg/min",
  },
  {
    id: "MED_LABETALOL",
    name: "Labetalol",
    type: "drug",
    normalDose: 1,
    unit: "mg/min",
  },

  // ===== RESPIRATORY / ALLERGY =====
  {
    id: "MED_SALBUTAMOL",
    name: "Salbutamol",
    type: "drug",
    normalDose: 2.5,
    unit: "mg",
  },
  {
    id: "MED_BERODUAL",
    name: "Berodual",
    type: "drug",
    normalDose: 4,
    unit: "ml",
  },
  {
    id: "MED_CLEMASTIN",
    name: "Clemastin",
    type: "drug",
    normalDose: 2,
    unit: "mg",
  },

  // IMPORTANT: oxygen must be type "oxygen" for your CaseDetailScreen logic
  {
    id: "MED_MEDICINSK_ILT",
    name: "Medicinsk ilt",
    type: "oxygen",
    oxygenFlows: [2, 4, 6, 8, 10, 12, 15],
  },

  {
    id: "MED_SOLU_MEDROL",
    name: "Solu-Medrol",
    type: "drug",
    normalDose: 40,
    unit: "mg",
  },

  // ===== METABOLIC / ENDOCRINE =====
  {
    id: "MED_GLUKOSE_50",
    name: "Glukose 50%",
    type: "drug",
    normalDose: 50,
    unit: "ml",
  },
  {
    id: "MED_GLUKAGON",
    name: "Glukagon",
    type: "drug",
    normalDose: 1,
    unit: "mg",
  },
  {
    id: "MED_HYPO_FIT",
    name: "Hypo-Fit",
    type: "drug",
    normalDose: 18,
    unit: "g",
  },
  {
    id: "MED_GIK",
    name: "GIK / GI-drop",
    type: "drug",
    normalDose: 500,
    unit: "ml",
  },
  {
    id: "MED_THIAMIN",
    name: "Thiamin",
    type: "drug",
    normalDose: 200,
    unit: "mg",
  },
  {
    id: "MED_SOLU_CORTEF",
    name: "Solu-Cortef",
    type: "drug",
    normalDose: 100,
    unit: "mg",
  },

  // ===== FLUIDS =====
  {
    id: "MED_NACL_ISO",
    name: "NaCl 0,9%",
    type: "drug",
    normalDose: 500,
    unit: "ml",
  },

  // ===== ACS / ANTITHROMBOTIC =====
  {
    id: "MED_ACETYLSALICYLSYRE",
    name: "Acetylsalicylsyre",
    type: "drug",
    normalDose: 300,
    unit: "mg",
  },
  {
    id: "MED_HEPARIN",
    name: "Heparin",
    type: "drug",
    normalDose: 10000,
    unit: "IE",
  },

  // ===== ANTIDOTES =====
  {
    id: "MED_NALOXON",
    name: "Naloxon",
    type: "drug",
    normalDose: 0.4,
    unit: "mg",
  },
  {
    id: "MED_N_ACETYLCYSTEIN",
    name: "N-acetylcystein",
    type: "drug",
    normalDose: 200,
    unit: "mg/kg",
  },

  // ===== OBSTETRIC =====
  {
    id: "MED_OXYTOCIN",
    name: "Oxytocin",
    type: "drug",
    normalDose: 10,
    unit: "IE",
  },

  // ===== TRAUMA / BLEEDING =====
  {
    id: "MED_TRANEXAMSYRE",
    name: "Tranexamsyre",
    type: "drug",
    normalDose: 1,
    unit: "g",
  },
];

// Keep named exports only (avoid default-export footguns)
export default { MEDICATIONS, getDoseOptionsForMedication };
