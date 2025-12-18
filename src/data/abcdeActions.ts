import type { AbcdeAction } from "../domain/cases/types";

export const ABCDE_ACTIONS: AbcdeAction[] = [
  { id: "A_LOOK", letter: "A", label: "Inspicer mund/svælg" },
  { id: "A_POSITION", letter: "A", label: "Luftvejslejring / kæbeløft" },
  { id: "A_RUBENS", letter: "A", label: "Rubens ballon / poseventilation" },
  { id: "A_NPA", letter: "A", label: "Anlæg NPA" },
  { id: "A_OPA", letter: "A", label: "Anlæg OPA" },
  { id: "A_LMA", letter: "A", label: "Larynxmaske" },

  { id: "B_INSPECT", letter: "B", label: "Inspicer thorax / RF" },
  { id: "B_STETHO", letter: "B", label: "Stetoskopér lunger" },
  { id: "B_NASAL_O2", letter: "B", label: "Næsebrille O₂" },
  { id: "B_HUDSON", letter: "B", label: "Hudson maske" },
  { id: "B_NEBULISER", letter: "B", label: "Nebulisator (fx Ventoline)" },
  { id: "B_NEEDLE_DECOMP", letter: "B", label: "Nåledekompression" },
  { id: "B_ETT", letter: "B", label: "Tube (intubation)" },
  { id: "B_BINASAL", letter: "B", label: "Binasal tube + kapnografi" },

  { id: "C_BP", letter: "C", label: "Mål blodtryk" },
  { id: "C_PULSE", letter: "C", label: "Tæl puls / rytme" },
  { id: "C_IV", letter: "C", label: "Anlæg IV-adgang" },
  { id: "C_IO", letter: "C", label: "Anlæg IO-adgang" },
  { id: "C_EKG4", letter: "C", label: "EKG 4-afledninger" },
  { id: "C_EKG12", letter: "C", label: "EKG 12-afledninger" },

  { id: "D_GCS", letter: "D", label: "Vurder GCS" },
  { id: "D_BS", letter: "D", label: "Mål blodsukker" },
  { id: "D_PUPILS", letter: "D", label: "Tjek pupiller" },

  { id: "E_TEMP", letter: "E", label: "Mål temperatur" },
  { id: "E_TOPTOE", letter: "E", label: "Top-til-tå inspektion" },
];
export default ABCDE_ACTIONS;
