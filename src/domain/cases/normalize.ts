import type {
  ActionImportance,
  CaseCategory,
  CaseScenario,
  ExpectedAction,
  PatientAbcde,
  PatientState,
  PatientVitals,
  SchoolPeriod,
  Transition,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function normalizeCategory(value: unknown): CaseCategory | undefined {
  return value === "MEDICAL" || value === "TRAUMA" || value === "HLR"
    ? value
    : undefined;
}

function optionalNumberProperty(key: string, value: unknown): Record<string, number> {
  const number = optionalFiniteNumber(value);
  return number === undefined ? {} : { [key]: number };
}

function normalizeVitals(value: unknown): PatientVitals {
  const raw = asRecord(value);
  const temp = optionalFiniteNumber(raw.temp) ?? optionalFiniteNumber(raw.tempC);
  return {
    hr: asFiniteNumber(raw.hr, 0),
    rr: asFiniteNumber(raw.rr, 0),
    btSys: asFiniteNumber(raw.btSys, 0),
    btDia: asFiniteNumber(raw.btDia, 0),
    spo2: asFiniteNumber(raw.spo2, 0),
    ...optionalNumberProperty("etco2", raw.etco2),
    ...(temp === undefined ? {} : { temp }),
    ...optionalNumberProperty("bs", raw.bs),
    ...optionalNumberProperty("gcs", raw.gcs),
    ...optionalNumberProperty("painNrs", raw.painNrs),
  };
}

function normalizeAbcde(value: unknown): PatientAbcde {
  const raw = asRecord(value);
  return {
    A: asString(raw.A),
    B: asString(raw.B),
    C: asString(raw.C),
    D: asString(raw.D),
    E: asString(raw.E),
  };
}

function normalizeState(value: unknown, index: number): PatientState {
  const raw = asRecord(value);
  return {
    id: asString(raw.id, `state_${index}`),
    vitals: normalizeVitals(raw.vitals),
    abcde: normalizeAbcde(raw.abcde),
    ...(asString(raw.extraInfo) ? { extraInfo: asString(raw.extraInfo) } : {}),
  };
}

function normalizeTransition(value: unknown): Transition | null {
  const raw = asRecord(value);
  const fromStateId = asString(raw.fromStateId);
  const toStateId = asString(raw.toStateId);
  const actionId = asString(raw.actionId);
  if (!fromStateId || !toStateId || !actionId) return null;
  return {
    id: asString(raw.id, `${fromStateId}_${actionId}_${toStateId}`),
    fromStateId,
    toStateId,
    actionId,
    feedbackToFacilitator: asString(raw.feedbackToFacilitator),
  };
}

function copyOptionalStrings(
  source: UnknownRecord,
  keys: string[],
): Record<string, string> {
  return Object.fromEntries(
    keys.flatMap((key) =>
      typeof source[key] === "string" && source[key] ? [[key, source[key]]] : [],
    ),
  );
}

function normalizeExpectedAction(value: unknown): ExpectedAction | null {
  const raw = asRecord(value);
  const actionId = asString(raw.actionId).trim().replace(/^"+|"+$/g, "");
  if (!actionId) return null;
  const validImportance: ActionImportance[] = [
    "CRITICAL",
    "IMPORTANT",
    "OPTIONAL",
    "FORBIDDEN",
  ];
  const importance = validImportance.includes(raw.importance as ActionImportance)
    ? (raw.importance as ActionImportance)
    : "OPTIONAL";
  const timing = asRecord(raw.timeTargetsSec);
  const green = optionalFiniteNumber(timing.green);
  const yellow = optionalFiniteNumber(timing.yellow);
  const red = optionalFiniteNumber(timing.red);

  return {
    actionId,
    importance,
    ...optionalNumberProperty("recommendedBeforeSec", raw.recommendedBeforeSec),
    ...optionalNumberProperty("mustBeforeSec", raw.mustBeforeSec),
    ...(green !== undefined && yellow !== undefined && red !== undefined
      ? { timeTargetsSec: { green, yellow, red } }
      : {}),
    ...copyOptionalStrings(raw, [
      "title",
      "label",
      "actionLabel",
      "successText",
      "improveText",
      "criticalText",
    ]),
  };
}

function normalizeSchoolPeriods(value: unknown): SchoolPeriod[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((period) => asFiniteNumber(period, 0))
    .filter((period): period is SchoolPeriod => period >= 1 && period <= 8);
}

export function normalizeCaseScenario(input: unknown): CaseScenario {
  const raw = asRecord(input);
  const patient = asRecord(raw.patientInfo);
  const states = (Array.isArray(raw.states) ? raw.states : []).map(normalizeState);
  const initialStateId = asString(raw.initialStateId, states[0]?.id);
  const id = asString(raw.id);
  const title = asString(raw.title);

  if (!id) throw new Error("Case is missing id");
  if (!title) throw new Error(`Case ${id} is missing title`);
  if (!initialStateId || !states.some((state) => state.id === initialStateId)) {
    throw new Error(`Case ${id} has no valid initial state`);
  }

  const category = normalizeCategory(raw.category);
  const meta = asRecord(raw.meta);
  const difficulty = asFiniteNumber(raw.difficulty, 1);

  return {
    id,
    title,
    subtitle: asString(raw.subtitle),
    dispatchText: asString(raw.dispatchText),
    schoolPeriods: normalizeSchoolPeriods(raw.schoolPeriods),
    acuity: raw.acuity === "SUBAKUT" ? "SUBAKUT" : "AKUT",
    difficulty: difficulty === 2 || difficulty === 3 ? difficulty : 1,
    diagnosis: asString(raw.diagnosis),
    actionDiagnoses: Array.isArray(raw.actionDiagnoses)
      ? raw.actionDiagnoses.filter((item): item is string => typeof item === "string")
      : [],
    caseType: asString(raw.caseType),
    ...(category ? { category } : {}),
    ...(Object.keys(meta).length ? { meta } : {}),
    patientInfo: {
      age: asFiniteNumber(patient.age, 0),
      sex: patient.sex === "K" ? "K" : "M",
      chiefComplaint: asString(patient.chiefComplaint),
      history: asString(patient.history),
      meds: Array.isArray(patient.meds)
        ? patient.meds.filter((item): item is string => typeof item === "string")
        : [],
    },
    initialStateId,
    states,
    transitions: (Array.isArray(raw.transitions) ? raw.transitions : [])
      .map(normalizeTransition)
      .filter((item): item is Transition => item !== null),
    expectedActions: (Array.isArray(raw.expectedActions) ? raw.expectedActions : [])
      .map(normalizeExpectedAction)
      .filter((item): item is ExpectedAction => item !== null),
  };
}
