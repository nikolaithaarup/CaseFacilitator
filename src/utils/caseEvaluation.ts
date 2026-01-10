import type {
  ActionLogEntry,
  CaseScenario,
  EvaluatedAction,
} from "../domain/cases/types";
import type { SessionEvent } from "../services/sessionEvents";

export function makeRunId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function rhythmKeyFromScenario(s: CaseScenario): string {
  const t = (s.caseType || "").toLowerCase();
  if (t.includes("svt")) return "SVT";
  if (t.includes("afli") || t.includes("af")) return "AF";
  if (t.includes("stemi")) return "STEMI";
  if (t.includes("aks")) return "ACS";
  if (t.includes("vf")) return "VF";
  if (t.includes("vt")) return "VT";
  return "SINUS";
}

// ✅ FIX: normalize Firestore/action IDs (removes accidental quotes + trims)
function normalizeId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/^"+|"+$/g, "");
}

export function evaluateCase(
  scenario: CaseScenario,
  log: ActionLogEntry[]
): { evaluated: EvaluatedAction[]; extraActions: ActionLogEntry[] } {
  const expectedActions = Array.isArray((scenario as any)?.expectedActions)
    ? (scenario as any).expectedActions
    : [];

  const logByActionId: Record<string, ActionLogEntry[]> = {};

  for (const entry of log) {
    const id = normalizeId(entry.actionId);
    if (!id) continue;
    (logByActionId[id] ??= []).push(entry);
  }

  const evaluated: EvaluatedAction[] = [];

  for (const exp of expectedActions) {
    const expId = normalizeId(exp.actionId);
    const entries = logByActionId[expId] || [];
    const first = entries[0];

    if (!first) {
      if (exp.importance === "CRITICAL") {
        evaluated.push({ expected: exp, status: "RED", comment: "Kritisk tiltag blev aldrig udført." });
      } else if (exp.importance === "IMPORTANT") {
        evaluated.push({ expected: exp, status: "YELLOW", comment: "Vigtigt tiltag mangler – kunne styrke behandlingen." });
      }
      continue;
    }

    const timeSec = first.timeMs / 1000;

    if (exp.importance === "FORBIDDEN") {
      evaluated.push({ expected: exp, logEntry: first, status: "RED", comment: "Tiltag der ikke burde udføres i dette case." });
      continue;
    }

    const tt = (exp as any).timeTargetsSec as
      | { green: number; yellow: number; red: number }
      | undefined;

    if (tt && Number.isFinite(tt.green) && Number.isFinite(tt.yellow) && Number.isFinite(tt.red)) {
      if (timeSec <= tt.green) {
        evaluated.push({ expected: exp, logEntry: first, status: "GREEN", comment: `Udført til tiden (≤ ${tt.green} sek).` });
      } else if (timeSec <= tt.yellow) {
        evaluated.push({ expected: exp, logEntry: first, status: "YELLOW", comment: `Udført, men kunne være hurtigere (≤ ${tt.yellow} sek).` });
      } else if (timeSec <= tt.red) {
        evaluated.push({ expected: exp, logEntry: first, status: "RED", comment: `Udført for sent (>${tt.yellow} sek).` });
      } else {
        evaluated.push({ expected: exp, logEntry: first, status: "RED", comment: `Udført alt for sent (> ${tt.red} sek).` });
      }
      continue;
    }

    if (exp.mustBeforeSec != null && timeSec > exp.mustBeforeSec) {
      evaluated.push({ expected: exp, logEntry: first, status: "RED", comment: `Udført for sent (efter ${exp.mustBeforeSec} sek).` });
    } else if (exp.recommendedBeforeSec != null && timeSec > exp.recommendedBeforeSec) {
      evaluated.push({ expected: exp, logEntry: first, status: "YELLOW", comment: "Udført, men senere end anbefalet." });
    } else {
      evaluated.push({ expected: exp, logEntry: first, status: "GREEN", comment: "Udført passende og til tiden." });
    }
  }

  const expectedIds = new Set(expectedActions.map((e: any) => normalizeId(e.actionId)));
  const extraActions = log.filter((e) => !expectedIds.has(normalizeId(e.actionId)));

  return { evaluated, extraActions };
}


export function mapDefibEventToActionId(evType: string): string {
  switch (evType) {
    case "DEFIB_SAT":
      return "B_SPO2_MEASURE";

    case "DEFIB_NIBP":
      return "C_BP_MEASURE";

    case "DEFIB_BS":
      return "D_BGL_CHECK";

    case "DEFIB_TEMP":
      return "E_TEMPERATURE_ASSESS";

    // Pick ONE canonical id for EtCO2.
    // If you already have an action id in your cases, use that instead.
    case "DEFIB_ETCO2":
      return "B_ETCO2_MEASURE"; // <-- make sure your cases use this if you want it evaluated

    // If you want to distinguish 4 vs 12 lead, you can make two ids.
    // Otherwise map both to your existing ECG action id.
    case "DEFIB_EKG4":
    case "DEFIB_EKG12":
      return "C_ECG_4_12_LEAD";

    // These are “defib-only” workflow events; keep them as-is unless you want evaluation rules for them.
    case "DEFIB_CHARGE":
      return "DEFIB_CHARGE";
    case "DEFIB_SHOCK":
      return "DEFIB_SHOCK";

    default:
      return evType;
  }
}

export function eventToLogEntry(ev: SessionEvent): ActionLogEntry {
  const actionId = mapDefibEventToActionId(ev.type);

  const pretty =
    ev.type === "DEFIB_NIBP"
      ? `Defib NIBP: ${ev.payload?.btSys}/${ev.payload?.btDia}`
      : ev.type === "DEFIB_SAT"
      ? `Defib SAT: SpO₂ ${ev.payload?.spo2}% · Puls ${ev.payload?.hr}/min`
      : ev.type === "DEFIB_ETCO2"
      ? `Defib EtCO₂: ${ev.payload?.etco2 ?? "—"} kPa`
      : ev.type === "DEFIB_BS"
      ? `Defib BS: ${ev.payload?.bs ?? "—"} mmol/L`
      : ev.type === "DEFIB_TEMP"
      ? `Defib Temp: ${ev.payload?.temp ?? "—"} °C`
      : ev.type === "DEFIB_EKG4"
      ? `Defib EKG4 acquired`
      : ev.type === "DEFIB_EKG12"
      ? `Defib EKG12 acquired`
      : ev.type === "DEFIB_CHARGE"
      ? `Defib CHARGE`
      : ev.type === "DEFIB_SHOCK"
      ? `Defib SHOCK`
      : `Defib event: ${ev.type}`;

  return {
    id: `EV_${ev.type}_${ev.tRelMs}`,
    timeMs: ev.tRelMs,
    actionId,
    description: pretty,
    resultingStateId: "external",
    meta: {
      source: "DEFIB",
      originalType: ev.type,
      payload: ev.payload ?? null,
    },
  };
}
