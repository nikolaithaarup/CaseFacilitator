import type { DoseStrength, Medication } from "../domain/cases/types";

export const MEDICATIONS: Medication[] = [
  // --- ANALGESIA / SEDATION ---
  { id: "MED_FENTANYL", name: "Fentanyl", type: "drug", normalDose: null, unit: "µg" },
  { id: "MED_S_KETAMIN", name: "S-ketamin", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_MIDAZOLAM", name: "Midazolam", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_DIAZEPAM", name: "Diazepam", type: "drug", normalDose: null, unit: "mg" },

  // --- CARDIOVASCULAR ---
  { id: "MED_ADRENALIN_IM", name: "Adrenalin (IM)", type: "drug", normalDose: 0.3, unit: "mg" },
  { id: "MED_ADRENALIN_IV", name: "Adrenalin (IV)", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_ISOPRENALIN", name: "Isoprenalin", type: "drug", normalDose: null, unit: "µg/min" },
  { id: "MED_AMIODARON", name: "Amiodaron", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_ATROPIN", name: "Atropin", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_LABETALOL", name: "Labetalol", type: "drug", normalDose: null, unit: "mg" },
  {
    id: "MED_GLYCERINTRINITRAT",
    name: "Glycerylnitrat",
    type: "drug",
    normalDose: null,
    unit: "mg",
  },

  // --- RESPIRATORY / ALLERGY ---
  { id: "MED_SALBUTAMOL", name: "Salbutamol", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_CLEMASTIN", name: "Clemastin", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_SOLU_CORTEF", name: "Solu-Cortef", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_SOLU_MEDROL", name: "Solu-Medrol", type: "drug", normalDose: null, unit: "mg" },

  // --- METABOLIC / ENDOCRINE ---
  { id: "MED_GLUCOSE_50", name: "Glukose 50%", type: "drug", normalDose: null, unit: "ml" },
  { id: "MED_GLUCAGON", name: "Glukagon", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_GIK", name: "Glukose-Insulin-Kalium", type: "drug", normalDose: null, unit: "ml" },
  { id: "MED_THIAMIN", name: "Thiamin", type: "drug", normalDose: null, unit: "mg" },

  // --- GI / NAUSEA ---
  { id: "MED_ONDANSETRON", name: "Ondansetron", type: "drug", normalDose: null, unit: "mg" },

  // --- INFECTION / TOX ---
  {
    id: "MED_N_ACETYLCYSTEIN",
    name: "N-acetylcystein",
    type: "drug",
    normalDose: null,
    unit: "mg",
  },

  // --- OB / BLEEDING ---
  { id: "MED_OXYTOCIN", name: "Oxytocin", type: "drug", normalDose: null, unit: "IE" },
  { id: "MED_TRANEXAMSYRE", name: "Tranexamsyre", type: "drug", normalDose: null, unit: "mg" },

  // --- PAIN / FEVER ---
  { id: "MED_PARACETAMOL", name: "Paracetamol", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_IBUPROFEN", name: "Ibuprofen", type: "drug", normalDose: null, unit: "mg" },
  { id: "MED_KETOROLAC", name: "Ketorolac", type: "drug", normalDose: null, unit: "mg" },

  // --- FLUIDS ---
  {
    id: "MED_NACL_ISO",
    name: "Natriumklorid (NaCl iso)",
    type: "drug",
    normalDose: null,
    unit: "ml",
  },

  // --- OTHER ---
  { id: "MED_HYPOFIT", name: "Hypo-Fit", type: "drug", normalDose: null, unit: "ml" },
  { id: "MED_HEPARIN", name: "Heparin", type: "drug", normalDose: null, unit: "IE" },

  // --- OXYGEN ---
  {
    id: "MED_OXYGEN",
    name: "Medicinsk ilt",
    type: "oxygen",
    oxygenFlows: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15],
  },
];

export const DOSE_OPTIONS: { id: DoseStrength; label: string; factor: number }[] = [
  { id: "HALF", label: "½ dosis", factor: 0.5 },
  { id: "NORMAL", label: "Normal dosis", factor: 1 },
  { id: "DOUBLE", label: "Dobbelt dosis", factor: 2 },
];
export default { MEDICATIONS, DOSE_OPTIONS };
