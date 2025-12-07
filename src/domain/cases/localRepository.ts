// src/domain/cases/localRepository.ts
import { ALL_CASES } from "./generator";
import type { CaseScenario, SchoolPeriod } from "./types";

export function getAllCases(): CaseScenario[] {
  return ALL_CASES;
}

export function getCasesByPeriod(period: SchoolPeriod): CaseScenario[] {
  return ALL_CASES.filter((c: CaseScenario) =>
    c.schoolPeriods.includes(period),
  );
}
