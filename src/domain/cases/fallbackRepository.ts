import { getAllCases } from "./localRepository";
import { normalizeCaseScenario } from "./normalize";
import type { CaseScenario } from "./types";

export type CaseSourceMode = "REMOTE_CANONICAL" | "LOCAL_FICTIONAL_FALLBACK";

export interface SourcedCases {
  schemaVersion: 1;
  fictional: true;
  mode: CaseSourceMode;
  provenance: string;
  cases: CaseScenario[];
}

function validateLocalCase(input: CaseScenario): CaseScenario {
  const normalized = normalizeCaseScenario(input);
  if (!normalized.id || normalized.patientInfo.age < 0 || normalized.patientInfo.age > 120) {
    throw new Error("Invalid bundled fictional case");
  }
  return normalized;
}

export async function loadCasesWithFallback(
  remoteLoader: () => Promise<CaseScenario[]>,
  localLoader: () => CaseScenario[] = getAllCases,
): Promise<SourcedCases> {
  try {
    const remote = (await remoteLoader()).map(normalizeCaseScenario);
    if (!remote.length) throw new Error("Remote case source returned no cases");
    return {
      schemaVersion: 1,
      fictional: true,
      mode: "REMOTE_CANONICAL",
      provenance: "firestore:cases_v3",
      cases: remote,
    };
  } catch {
    const local = localLoader().map(validateLocalCase);
    if (!local.length) throw new Error("No valid fictional cases are available");
    return {
      schemaVersion: 1,
      fictional: true,
      mode: "LOCAL_FICTIONAL_FALLBACK",
      provenance: "bundled:generated-fictional-v1",
      cases: local,
    };
  }
}
