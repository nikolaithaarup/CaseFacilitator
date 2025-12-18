// src/data/ekg/ekgLookup.ts
// Static require() only (RN limitation). JPG/PNG both fine.

export const ekgImageLookup: Record<string, any> = {
  //  SINUS: require("../../../assets/ekg/SINUS.png"),
  SVT: require("../../../assets/ekg/Supraventricular tachycardia 1.jpg"),
  AF: require("../../../assets/ekg/Atrial fibrillation 1.jpg"),
  STEMI: require("../../../assets/ekg/Inferior STEMI 1.jpg"),
  VF: require("../../../assets/ekg/VF 1.jpg"),
  VT: require("../../../assets/ekg/Monomorphic VT 1.jpg"),
  WPW: require("../../../assets/ekg/WPW.jpg"),
  TdP: require("../../../assets/ekg/VF TdP.jpeg"),
  Hyperkalemia: require("../../../assets/ekg/Hyperkalemia.jpg"),
};
