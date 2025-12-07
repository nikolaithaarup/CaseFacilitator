// src/domain/cases/repository.ts
import type { CaseScenario, SchoolPeriod } from "./types";

export interface CaseRepository {
  getPeriods(): Promise<SchoolPeriod[]>;
  getCasesForPeriod(period: SchoolPeriod): Promise<CaseScenario[]>;
  getCase(id: string): Promise<CaseScenario | null>;
}
