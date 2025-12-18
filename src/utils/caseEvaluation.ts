import type { ActionLogEntry, CaseScenario, EvaluatedAction } from "../domain/cases/types";
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
  log: ActionLogEntry[],
): { evaluated: EvaluatedAction[]; extraActions: ActionLogEntry[] } {
  const logByActionId: Record<string, ActionLogEntry[]> = {};

  // ✅ FIX: store log entries by normalized actionId
  for (const entry of log) {
    const id = normalizeId(entry.actionId);
    if (!id) continue;

    if (!logByActionId[id]) logByActionId[id] = [];
    logByActionId[id].push(entry);
  }

  const evaluated: EvaluatedAction[] = [];

  // Optional debug (helps if Firestore has weird IDs)
  if (__DEV__) {
    console.log(
      "EVAL expected IDs:",
      scenario.expectedActions.map((e) => normalizeId(e.actionId)),
    );
    console.log("EVAL logged IDs:", Object.keys(logByActionId));
  }

  for (const exp of scenario.expectedActions) {
    const expId = normalizeId(exp.actionId);
    const entries = logByActionId[expId] || [];
    const first = entries[0];

    // Never done
    if (!first) {
      if (exp.importance === "CRITICAL") {
        evaluated.push({
          expected: exp,
          status: "RED",
          comment: "Kritisk tiltag blev aldrig udført.",
        });
      } else if (exp.importance === "IMPORTANT") {
        evaluated.push({
          expected: exp,
          status: "YELLOW",
          comment: "Vigtigt tiltag mangler – kunne styrke behandlingen.",
        });
      }
      continue;
    }

    const timeSec = first.timeMs / 1000;

    // Forbidden
    if (exp.importance === "FORBIDDEN") {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "RED",
        comment: "Tiltag der ikke burde udføres i dette case.",
      });
      continue;
    }

    // ✅ NEW: 3-threshold grading if present
    const tt = (exp as any).timeTargetsSec as
      | { green: number; yellow: number; red: number }
      | undefined;

    if (tt && Number.isFinite(tt.green) && Number.isFinite(tt.yellow) && Number.isFinite(tt.red)) {
      if (timeSec <= tt.green) {
        evaluated.push({
          expected: exp,
          logEntry: first,
          status: "GREEN",
          comment: `Udført til tiden (≤ ${tt.green} sek).`,
        });
      } else if (timeSec <= tt.yellow) {
        evaluated.push({
          expected: exp,
          logEntry: first,
          status: "YELLOW",
          comment: `Udført, men kunne være hurtigere (≤ ${tt.yellow} sek).`,
        });
      } else if (timeSec <= tt.red) {
        evaluated.push({
          expected: exp,
          logEntry: first,
          status: "RED",
          comment: `Udført for sent (>${tt.yellow} sek).`,
        });
      } else {
        evaluated.push({
          expected: exp,
          logEntry: first,
          status: "RED",
          comment: `Udført alt for sent (> ${tt.red} sek).`,
        });
      }
      continue;
    }

    // ♻️ Backwards-compatible: recommended/must
    if (exp.mustBeforeSec != null && timeSec > exp.mustBeforeSec) {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "RED",
        comment: `Udført for sent (efter ${exp.mustBeforeSec} sek).`,
      });
    } else if (exp.recommendedBeforeSec != null && timeSec > exp.recommendedBeforeSec) {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "YELLOW",
        comment: "Udført, men senere end anbefalet.",
      });
    } else {
      evaluated.push({
        expected: exp,
        logEntry: first,
        status: "GREEN",
        comment: "Udført passende og til tiden.",
      });
    }
  }

  // ✅ FIX: extraActions must compare normalized IDs too
  const expectedIds = new Set(scenario.expectedActions.map((e) => normalizeId(e.actionId)));
  const extraActions = log.filter((e) => !expectedIds.has(normalizeId(e.actionId)));

  return { evaluated, extraActions };
}

export function eventToLogEntry(ev: SessionEvent): ActionLogEntry {
  const pretty =
    ev.type === "DEFIB_NIBP"
      ? `Defib NIBP: ${ev.payload?.btSys}/${ev.payload?.btDia}`
      : ev.type === "DEFIB_SAT"
      ? `Defib SAT: SpO₂ ${ev.payload?.spo2}% · Puls ${ev.payload?.hr}/min`
      : ev.type === "DEFIB_ETCO2"
      ? `Defib EtCO₂: ${ev.payload?.etco2 ?? "?"} kPa`
      : `Defib EKG: ${ev.payload?.rhythmKey ?? "?"}`;

  return {
    id: `EV_${ev.type}_${ev.tRelMs}`,
    timeMs: ev.tRelMs,
    actionId: ev.type,
    description: pretty,
    resultingStateId: "external",
  };
}
