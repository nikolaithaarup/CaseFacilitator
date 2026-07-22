import type { CaseScenario } from "../types";
import { loadCasesWithFallback } from "../fallbackRepository";

const localCase: CaseScenario = {
  id: "local-fictional", title: "Local fictional", subtitle: "", dispatchText: "",
  schoolPeriods: [1], acuity: "AKUT", difficulty: 1, diagnosis: "Fictional",
  actionDiagnoses: [], caseType: "TEST",
  patientInfo: { age: 40, sex: "K", chiefComplaint: "Fictional", history: "", meds: [] },
  initialStateId: "S0",
  states: [{ id: "S0", vitals: { hr: 80, rr: 14, btSys: 120, btDia: 70, spo2: 98 }, abcde: { A: "", B: "", C: "", D: "", E: "" } }],
  transitions: [], expectedActions: [],
};

describe("case source fallback", () => {
  it("prefers a non-empty remote source without mixing local cases", async () => {
    const result = await loadCasesWithFallback(async () => [localCase], () => [{ ...localCase, id: "other" }]);
    expect(result.mode).toBe("REMOTE_CANONICAL");
    expect(result.cases.map((item) => item.id)).toEqual(["local-fictional"]);
  });

  it("uses marked bundled fictional fallback when remote fails", async () => {
    const result = await loadCasesWithFallback(async () => { throw new Error("offline"); }, () => [localCase]);
    expect(result).toMatchObject({ schemaVersion: 1, fictional: true, mode: "LOCAL_FICTIONAL_FALLBACK" });
  });

  it("rejects invalid local cases", async () => {
    await expect(loadCasesWithFallback(async () => [], () => [{ ...localCase, id: "" }])).rejects.toThrow();
  });
});
