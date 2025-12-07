// src/domain/cases/generator.ts
import type {
    Acuity,
    CaseScenario,
    PatientState,
    SchoolPeriod,
} from "./types";

// ---------- Case templates for auto-generation ----------

const CASE_TEMPLATES: {
  code: string;
  diagnosis: string;
  chiefComplaint: string;
  subtitleExtra: string;
  actionDiagnoses: string[];
  acuity: Acuity;
}[] = [
  {
    code: "AKS",
    diagnosis: "Mistanke om akut koronart syndrom.",
    chiefComplaint: "brystsmerter og åndenød",
    subtitleExtra: "brystsmerter og let åndenød gennem 2 dage",
    actionDiagnoses: ["I21 Akut myokardieinfarkt", "I20 Angina pectoris"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Nyopstået AFLI",
    diagnosis: "Nyopstået atrieflimren med hurtig ventrikelrespons.",
    chiefComplaint: "hjertebanken og svimmelhed",
    subtitleExtra: "hjertebanken og uro i brystet siden i går",
    actionDiagnoses: ["I48 Atrieflimren", "R42 Svimmelhed"],
    acuity: "SUBAKUT" as Acuity,
  },
  {
    code: "SVT",
    diagnosis: "Supraventrikulær takykardi.",
    chiefComplaint: "pludseligt indsættende hjertebanken",
    subtitleExtra: "pludseligt opstået hjertebanken og ubehag",
    actionDiagnoses: ["I47 Supraventrikulær takykardi"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Anafylaksi",
    diagnosis: "Mistanke om anafylaktisk reaktion.",
    chiefComplaint: "hævelse, kløe og vejrtrækningsbesvær",
    subtitleExtra: "pludselig kløe, udslæt og åndenød efter eksposition",
    actionDiagnoses: ["T78 Anafylaktisk chok", "L50 Urticaria"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Astma-exacerbation",
    diagnosis: "Akut forværring af astma.",
    chiefComplaint: "hvæsende vejrtrækning og åndenød",
    subtitleExtra: "tiltagende hvæsende vejrtrækning gennem 1 dag",
    actionDiagnoses: ["J45 Astma"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "KOL-exacerbation",
    diagnosis: "Akut forværring af KOL.",
    chiefComplaint: "tiltagende åndenød og hoste",
    subtitleExtra: "tiltagende åndenød og hoste gennem 3 dage",
    actionDiagnoses: ["J44 KOL"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Hypoglykæmi",
    diagnosis: "Symptomgivende hypoglykæmi.",
    chiefComplaint: "konfusion og svedtendens",
    subtitleExtra: "tiltagende konfusion, svedtendens og uro",
    actionDiagnoses: ["E16 Hypoglykæmi"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Sepsis",
    diagnosis: "Mistanke om sepsis.",
    chiefComplaint: "feber, kulderystelser og påvirket almentilstand",
    subtitleExtra: "høj feber og almen påvirket tilstand gennem 1 dag",
    actionDiagnoses: ["A41 Sepsis"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Hovedtraume",
    diagnosis: "Let til moderat hovedtraume.",
    chiefComplaint: "hovedpine efter fald/traume",
    subtitleExtra: "hovedpine og kortvarig bevidsthedspåvirkning efter fald",
    actionDiagnoses: ["S06 Hjernerystelse"],
    acuity: "AKUT" as Acuity,
  },
  {
    code: "Mavesmerter",
    diagnosis: "Akutte mavesmerter – uklar årsag.",
    chiefComplaint: "mavesmerter",
    subtitleExtra: "kolikagtige mavesmerter gennem nogle timer",
    actionDiagnoses: ["R10 Mavesmerter"],
    acuity: "SUBAKUT" as Acuity,
  },
];

// ---------- Single-case generator ----------

export function generateCaseForPeriod(
  period: SchoolPeriod,
  index: number,
): CaseScenario {
  const template = CASE_TEMPLATES[(period * 31 + index) % CASE_TEMPLATES.length];

  const age = 20 + period * 3 + index;
  const sex: "M" | "K" = index % 2 === 0 ? "M" : "K";
  const sexWord = sex === "M" ? "Mand" : "Kvinde";
  const typeWord =
    template.code === "Hovedtraume" ? "tilskadekomst" : "sygdom";

  const title = `skp ${period} – ${template.code} – ${sex} ${age} ${typeWord}`;
  const subtitle = `(${sexWord.toLowerCase()} ${age} år, ${template.subtitleExtra})`;

  const dispatchText = `Kørsel B til ${typeWord}. ${sexWord.toLowerCase()} ${age} med ${template.chiefComplaint}.`;

  const history =
    `SAMPLER: S – ${template.chiefComplaint}. A – ingen kendte allergier oplyst. M – relevant fast medicin jf. egen læge. P – evt. tidligere kendt sygdom svarende til aktionsdiagnosen (${template.code}). L – symptomer gennem timer til få dage. E – ingen nylig rejse eller større ændring udover aktuelle symptomer. R – kontaktet 1-1-2 pga. tiltagende gener.\n` +
    "OPQRST: O – debut inden for de sidste timer til dage. P – kan påvirkes af aktivitet eller hvile afhængigt af case. Q – karakter af smerte/ubehag afhænger af aktionsdiagnosen. R – lokalisation afhænger af case. S – moderat til svær gene. T – gradvist eller pludseligt indsættende.";

  const baseVitals: PatientState["vitals"] = {
    hr: template.code === "Hypoglykæmi" ? 110 : 100,
    rr:
      template.code === "Astma-exacerbation" ||
      template.code === "KOL-exacerbation" ||
      template.code === "Anafylaksi" ||
      template.code === "Sepsis"
        ? 26
        : 20,
    btSys: 125,
    btDia: 78,
    spo2:
      template.code === "Astma-exacerbation" ||
      template.code === "KOL-exacerbation" ||
      template.code === "Anafylaksi"
        ? 92
        : 96,
    temp: template.code === "Sepsis" ? 39.0 : 37.2,
    painNrs:
      template.code === "Hovedtraume" || template.code === "Mavesmerter"
        ? 7
        : 4,
  };

  const abcde: PatientState["abcde"] = {
    A:
      template.code === "Anafylaksi"
        ? "Hæs stemme, let hævelse af læber/tunge, kan stadig tale."
        : "Fri luftvej, kan tale hele sætninger eller korte fraser.",
    B:
      template.code === "Astma-exacerbation" ||
      template.code === "KOL-exacerbation"
        ? "Forlænget ekspirium, hvæsende vejrtrækning, øget RF."
        : template.code === "Anafylaksi"
        ? "Inspiratorisk stridor tendens, øget RF."
        : template.code === "Sepsis"
        ? "Let øget RF, ellers rimelig luftskifte."
        : "RF let forhøjet eller normal, ingen udtalte bilaterale bilyde.",
    C:
      template.code === "Hypoglykæmi"
        ? "Tachykardi, BT let forhøjet, kapillærrespons < 3 sek."
        : template.code === "Sepsis"
        ? "HR tachykard, BT kan være let lavt, kapillærrespons > 3 sek."
        : "HR let forhøjet, BT normal, kapillærrespons < 3 sek.",
    D:
      template.code === "Hovedtraume"
        ? "GCS 15, hovedpine, evt. kortvarig amnesi. Pupiller isokore."
        : template.code === "Hypoglykæmi"
        ? "GCS 14, konfus, svedende."
        : "GCS 15, klar og orienteret, evt. påvirket af smerte/ubehag.",
    E:
      template.code === "Hovedtraume"
        ? "Lokal ømhed på caput, ingen tydelige frakturer."
        : template.code === "Sepsis"
        ? "Varm, rødlig hud, evt. petekkier afhængigt af fokus."
        : "Ingen oplagte traumer, hudfarve passende eller let bleg.",
  };

  const stateId = `${template.code.toLowerCase()}_${period}_${index}`;

  return {
    id: stateId,
    title,
    subtitle,
    dispatchText,
    schoolPeriods: [period],
    acuity: template.acuity,
    difficulty: (period <= 2 ? 1 : period <= 5 ? 2 : 3) as 1 | 2 | 3,
    diagnosis: template.diagnosis,
    actionDiagnoses: template.actionDiagnoses,
    caseType: template.code,
    patientInfo: {
      age,
      sex,
      chiefComplaint: template.chiefComplaint,
      history,
      meds: ["Fast medicin jf. egen læge"],
    },
    initialStateId: stateId,
    states: [
      {
        id: stateId,
        vitals: baseVitals,
        abcde,
        extraInfo:
          "Case er generisk og kan bruges til både ABCDE, farmakologi og sygdomslære alt efter fokus.",
      },
    ],
    transitions: [],
    expectedActions: [],
  };
}

// ---------- Generate all cases for all skoleperioder ----------

export const ALL_CASES: CaseScenario[] = (() => {
  const arr: CaseScenario[] = [];
  for (let p = 1 as SchoolPeriod; p <= 8; p = (p + 1) as SchoolPeriod) {
    for (let i = 1; i <= 30; i++) {
      arr.push(generateCaseForPeriod(p, i));
    }
  }
  return arr;
})();
