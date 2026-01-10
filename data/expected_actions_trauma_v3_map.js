// expected_actions_trauma_v3_map.js
module.exports = {
  TRA_v3_001_TENSION_PNEUMOTHORAX: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "CHEST_SEAL", recommendedBeforeSec: 90 },
    { actionId: "NEEDLE_DECOMPRESSION", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "BVM", recommendedBeforeSec: 120 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 180 },
  ],

  TRA_v3_002_TRAUMATIC_AMPUTATION: [
    { actionId: "TOURNIQUET", recommendedBeforeSec: 30, mustBeBeforeSec: 60 },
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 30, mustBeBeforeSec: 60 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "IO_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 600 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 120 },
  ],

  TRA_v3_003_PELVIC_FRACTURE: [
    { actionId: "PELVIC_BINDER", recommendedBeforeSec: 120, mustBeBeforeSec: 240 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 120 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 120 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_004_FLAIL_CHEST: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "BVM", recommendedBeforeSec: 180, mustBeBeforeSec: 420 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_005_TBI_WITH_VOMITING: [
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "SUCTION", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "PUPILS_CHECK", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_006_SPINAL_CORD_INJURY_SUSPECTED: [
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120, mustBeBeforeSec: 600 },
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 300 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_007_BURNS_2ND_3RD_DEGREE: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 120 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 120 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 120 },
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 300 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
  ],

  TRA_v3_008_CRUSH_INJURY: [
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 180 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_009_OPEN_FOREARM_FRACTURE: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 120 },
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_010_BLUNT_ABDOMINAL_TRAUMA: [
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 120, mustBeBeforeSec: 300 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
  ],

  TRA_v3_011_PENETRATING_ABDOMINAL_TRAUMA: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 120, mustBeBeforeSec: 300 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
  ],

  TRA_v3_012_NEAR_DROWNING_HYPOTHERMIA: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "BVM", recommendedBeforeSec: 120, mustBeBeforeSec: 420 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 60 },
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_013_FALL_FROM_HEIGHT_MULTITRAUMA: [
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "PELVIC_BINDER", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 120 },
  ],

  TRA_v3_014_FACIAL_TRAUMA_BLEEDING_AIRWAY_RISK: [
    { actionId: "SUCTION", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_015_OPEN_PNEUMOTHORAX: [
    { actionId: "CHEST_SEAL", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "BVM", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_016_SCALP_LACERATION_MAJOR_BLEED: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_017_HAND_LACERATION: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 180 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 900 },
  ],

  TRA_v3_018_COMPARTMENT_SYNDROME_SUSPECTED: [
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 300 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 600 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_019_EYE_INJURY: [
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 600 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 900 },
  ],

  TRA_v3_020_SIMPLE_PNEUMOTHORAX: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 120 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 120 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_021_HIP_DISLOCATION: [
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 600 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 900 },
  ],

  TRA_v3_022_FEMUR_FRACTURE: [
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 120, mustBeBeforeSec: 600 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 120 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_023_SHOULDER_DISLOCATION: [
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 900 },
  ],

  TRA_v3_024_ANKLE_FRACTURE_DISLOCATION: [
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 600 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 900 },
  ],

  TRA_v3_025_PENETRATING_NECK_TRAUMA: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300 },
  ],

  TRA_v3_026_SPLENIC_RUPTURE_SUSPECTED: [
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 120, mustBeBeforeSec: 300 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
  ],

  TRA_v3_027_FACIAL_TRAUMA_AIRWAY_RISK: [
    { actionId: "SUCTION", recommendedBeforeSec: 60, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],
    TRA_v3_028_EL_ULYKKE: [
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 120 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 240 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_029_IMPALEMENT_LAAR: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 180, mustBeBeforeSec: 420 },
  ],

  TRA_v3_030_CSPINE_TRAUME: [
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 60, mustBeBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_031_TRAUME_HYPOTERMI: [
    { actionId: "KEEP_WARM", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_032_MISTANKE_TAMPONADE: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "BVM", recommendedBeforeSec: 120, mustBeBeforeSec: 420 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 240 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 120 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 180, mustBeBeforeSec: 420 },
  ],

  TRA_v3_033_PEDS_HOVEDTRAUME: [
    { actionId: "SUCTION", recommendedBeforeSec: 45, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "PUPILS_CHECK", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 300 },
  ],

  TRA_v3_034_AABEN_UNDERBENSFRAKTUR: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 120 },
    { actionId: "EXPOSE_EXAMINE", recommendedBeforeSec: 300 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 300 },
    { actionId: "MED_FENTANYL", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_035_BRONKOSPASME_VED_THORAXTRAUME: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 45, mustBeBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 45, mustBeBeforeSec: 180 },
    { actionId: "BVM", recommendedBeforeSec: 120, mustBeBeforeSec: 420 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_036_EVISERATION: [
    { actionId: "CONTROL_MAJOR_BLEEDING", recommendedBeforeSec: 90, mustBeBeforeSec: 240 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 180 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 180, mustBeBeforeSec: 420 },
  ],

  TRA_v3_037_LUNGEKONTUSION_SKUM: [
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 45, mustBeBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 45, mustBeBeforeSec: 180 },
    { actionId: "BVM", recommendedBeforeSec: 120, mustBeBeforeSec: 420 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 300 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

  TRA_v3_038_MULTITRAUME_BUSULYKKE: [
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 90, mustBeBeforeSec: 240 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "IV_ACCESS", recommendedBeforeSec: 180 },
    { actionId: "MED_TRANEXAMSYRE", recommendedBeforeSec: 300, mustBeBeforeSec: 900 },
    { actionId: "MED_NACL_ISO", recommendedBeforeSec: 300 },
    { actionId: "KEEP_WARM", recommendedBeforeSec: 180 },
  ],

  TRA_v3_039_ANSIGTSTRAUME_BLOD_I_SVAELG: [
    { actionId: "SUCTION", recommendedBeforeSec: 45, mustBeBeforeSec: 120 },
    { actionId: "OXYGEN_APPLIED", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "MED_MEDICINSK_ILT", recommendedBeforeSec: 60, mustBeBeforeSec: 180 },
    { actionId: "CSPINE_STABILIZATION", recommendedBeforeSec: 180 },
    { actionId: "ITLS_LOAD_AND_GO", recommendedBeforeSec: 600 },
  ],

};
