// app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

// Firebase
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../src/firebase/firebase";

// Camera
import { useCameraPermissions } from "expo-camera";

// Styles
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "../src/styles/indexStyles";

// Data
import { getDoseOptionsForMedication } from "../src/data/medications";
import { type OrgChoice } from "../src/data/orgChoices";

// Utils
import { stripUndefined } from "../src/utils/format";
import { buildJoinUrl, parseJoinRole } from "../src/utils/joinLinks";

// Services
import { getUserProfile } from "../src/services/users";

import {
  createSession,
  joinSession,
  listenToSession,
  setFacilitatorFocus,
  setSessionRunning,
  type FacilitatorFocus,
  type SessionDoc,
} from "../src/services/sessions";

import {
  listenLiveState,
  publishLiveState,
  type SessionLiveState,
} from "../src/services/sessionState";

import {
  loadSessionEvents,
  logSessionEvent,
  type SessionEvent,
} from "../src/services/sessionEvents";

// Domain
import type {
  AbcdeAction,
  AbcdeLetter,
  ActionLogEntry,
  AssistanceChoice, // ✅ NEW: import from types
  CaseScenario,
  DoseStrength,
  EvaluatedAction,
  Medication,
  MidasheLetter,
  OpqrstLetter,
  PatientState,
  SamplerLetter,
} from "../src/domain/cases/types";

// Screens
import { CaseDetailScreen } from "../src/screens/CaseDetailScreen";
import CaseListScreen from "../src/screens/CaseListScreen";
import CaseSetupScreen from "../src/screens/CaseSetupScreen";
import { DefibScreen } from "../src/screens/DefibScreen";
import { InviteQrScreen } from "../src/screens/InviteQrScreen";
import { LoginScreen } from "../src/screens/LoginScreen";
import { PickFocusScreen } from "../src/screens/PickFocusScreen";
import { ScanQrScreen } from "../src/screens/ScanQrScreen";
import { SummaryScreen } from "../src/screens/SummaryScreen";

// If you moved evaluation helpers into a file:
import { evaluateCase, eventToLogEntry } from "../src/utils/caseEvaluation";

// ---------- App screens ----------
type AppScreen =
  | "login"
  | "caseList"
  | "caseSetup"
  | "inviteQr"
  | "scanQr"
  | "pickFocus"
  | "defib"
  | "caseDetail"
  | "summary";

type UnitsRunConfig = {
  ambulancer: number;
  akutbil: number;
  laegebil: number;
};

// ---------- Helpers that may remain here ----------
function rhythmKeyFromScenario(s: CaseScenario): string {
  const t = (s.caseType || "").toLowerCase();
  if (t.includes("svt")) return "SVT";
  if (t.includes("afli") || t.includes("af")) return "AF";
  if (t.includes("stemi")) return "STEMI";
  if (t.includes("aks")) return "ACS";
  if (t.includes("vf")) return "VF";
  if (t.includes("vt")) return "VT";
  return "SINUS";
}

function makeRunId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function loadAllCasesFromFirestore(): Promise<CaseScenario[]> {
  const snap = await getDocs(collection(db, "cases_v2"));
  const cases: CaseScenario[] = [];
  snap.forEach((docSnap) => {
    const data: any = docSnap.data();
    if (!data?.title || typeof data.title !== "string") return;
    if (!data?.id || typeof data.id !== "string") return;
    cases.push(data as CaseScenario);
  });

  cases.sort((a, b) =>
    String(a.title || "").localeCompare(String(b.title || ""))
  );
  return cases;
}

// ---------- Component ----------
export default function Index() {
  // Screens + login org (legacy)
  const [screen, setScreen] = useState<AppScreen>("login");
  const [selectedOrg, setSelectedOrg] = useState<OrgChoice | null>(null);

  // Auth + cases loading
  const [authReady, setAuthReady] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);
  const [allCases, setAllCases] = useState<CaseScenario[]>([]);
  const [selectedCaseTemplate, setSelectedCaseTemplate] =
    useState<CaseScenario | null>(null);

  const router = useRouter();

  // Setup overrides
  const [setupSex, setSetupSex] = useState<"M" | "K">("M");
  const [setupAge, setSetupAge] = useState<number>(50);
  const [units, setUnits] = useState<UnitsRunConfig>({
    ambulancer: 1,
    akutbil: 0,
    laegebil: 0,
  });
  const [facilitatorsCount, setFacilitatorsCount] = useState<number>(1);

  // Session / pairing
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDoc, setSessionDoc] = useState<SessionDoc | null>(null);

  const [pendingJoinSessionId, setPendingJoinSessionId] = useState<
    string | null
  >(null);
  const [pendingJoinRole, setPendingJoinRole] = useState<
    "FACILITATOR" | "DEFIB"
  >("FACILITATOR");

  // Live state for defib
  const [liveState, setLiveState] = useState<SessionLiveState | null>(null);

  const [pickedFocus, setPickedFocus] = useState<FacilitatorFocus>("ALL");

  const sessionUnsubRef = useRef<null | (() => void)>(null);
  const liveUnsubRef = useRef<null | (() => void)>(null);

  // Live case state (lead device)
  const [scenario, setScenario] = useState<CaseScenario | null>(null);
  const [currentState, setCurrentState] = useState<PatientState | null>(null);

  // --- Assistance (UI state only) ---
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [selectedAssistance, setSelectedAssistance] =
    useState<AssistanceChoice | null>(null);

  // Run/timer/log
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<ActionLogEntry[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<AbcdeLetter>("A");

  // Run identity
  const [runId, setRunId] = useState<string | null>(null);
  const [runStartedAtEpochMs, setRunStartedAtEpochMs] = useState<number | null>(
    null
  );

  // Acronyms
  const initialSampler: Record<SamplerLetter, boolean> = {
    S: false,
    A: false,
    M: false,
    P: false,
    L: false,
    E: false,
    R: false,
  };
  const initialOpqrst: Record<OpqrstLetter, boolean> = {
    O: false,
    P: false,
    Q: false,
    R: false,
    S: false,
    T: false,
  };
  const initialMidashe: Record<MidasheLetter, boolean> = {
    M: false,
    I: false,
    D: false,
    A: false,
    S: false,
    H: false,
    E: false,
  };

  const [samplerState, setSamplerState] =
    useState<Record<SamplerLetter, boolean>>(initialSampler);
  const [opqrstState, setOpqrstState] =
    useState<Record<OpqrstLetter, boolean>>(initialOpqrst);
  const [midasheState, setMidasheState] =
    useState<Record<MidasheLetter, boolean>>(initialMidashe);

  // UI expanded toggles
  const [abcdeActionsExpanded, setAbcdeActionsExpanded] = useState(true);
  const [samplerExpanded, setSamplerExpanded] = useState(false);
  const [opqrstExpanded, setOpqrstExpanded] = useState(false);
  const [midasheExpanded, setMidasheExpanded] = useState(false);
  const [medExpanded, setMedExpanded] = useState(false);

  // Med selection
  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);
  const [selectedDose, setSelectedDose] = useState<DoseStrength | null>(null);
  const [selectedOxygenFlow, setSelectedOxygenFlow] = useState<number | null>(
    null
  );

  const [popupText, setPopupText] = useState<string | null>(null);

  // Defib UI state
  const [defibOn, setDefibOn] = useState(false);
  const [defibBusy, setDefibBusy] = useState<
    null | "NIBP" | "SAT" | "ECG" | "ETCO2"
  >(null);
  const [defibDisplay, setDefibDisplay] = useState<string>("");
  const [defibEkgKey, setDefibEkgKey] = useState<string | null>(null);

  // Summary events
  const [remoteEvents, setRemoteEvents] = useState<SessionEvent[]>([]);

  // Feedback / grading
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackGrade, setFeedbackGrade] = useState<string>("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Camera permission (QR scanner)
  const [perm, requestPerm] = useCameraPermissions();

  // ---- Auth bootstrap ----
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) await signInAnonymously(auth);
        setAuthReady(true);
      } catch (e) {
        console.error(e);
        Alert.alert("Firebase auth fejl", "Kunne ikke logge ind anonymt.");
      }
    });
    return () => unsub();
  }, []);

  function cleanupSessionListener() {
    if (sessionUnsubRef.current) {
      sessionUnsubRef.current();
      sessionUnsubRef.current = null;
    }
    if (liveUnsubRef.current) {
      liveUnsubRef.current();
      liveUnsubRef.current = null;
    }
  }

  async function ensureSessionListener(sid: string) {
    cleanupSessionListener();
    sessionUnsubRef.current = listenToSession(
      sid,
      (data) => setSessionDoc(data),
      (e) => console.warn("Session listen error:", e)
    );
    liveUnsubRef.current = listenLiveState(
      sid,
      (st) => setLiveState(st),
      (e) => console.warn("Live state listen error:", e)
    );
  }

  // ---- Profile loading ----
  useEffect(() => {
    (async () => {
      if (!authReady) return;
      const user = auth.currentUser;
      if (!user) return;

      try {
        const profile = await getUserProfile(user.uid);
        if (!profile) {
          router.replace("/profile");
          return;
        }
      } catch (e) {
        console.warn("profile check failed:", e);
      }
    })();
  }, [authReady, router]);

  // ---- Deep link handler ----
  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
      if (parsed?.path === "join") {
        const sid = (parsed.queryParams?.sessionId as string) || null;
        const role = parseJoinRole(parsed.queryParams?.role);
        if (sid) {
          setPendingJoinSessionId(sid);
          setPendingJoinRole(role);
          if (role === "DEFIB") setScreen("defib");
          else setScreen("pickFocus");
        }
      }
    };

    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    Linking.getInitialURL().then((url) => url && handleUrl(url));

    return () => sub.remove();
  }, []);

  // timer
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsedMs((prev) => prev + 1000), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Lead: publish live state when currentState changes (only if session exists)
  useEffect(() => {
    if (!sessionId) return;
    if (!scenario || !currentState) return;
    publishLiveState({
      sessionId,
      currentState,
      rhythmKey: rhythmKeyFromScenario(scenario),
    }).catch((e) => console.warn("publishLiveState error:", e));
  }, [sessionId, scenario, currentState]);

  // Auto-join defib when landing on defib screen via QR/deeplink
  useEffect(() => {
    (async () => {
      if (screen !== "defib") return;
      const sid = pendingJoinSessionId;
      if (!sid) return;

      try {
        const docSnap = await joinSession({ sessionId: sid, role: "DEFIB" });
        setSessionId(sid);
        setSessionDoc(docSnap);
        await ensureSessionListener(sid);
      } catch (e: any) {
        console.error(e);
        Alert.alert(
          "Defib join fejl",
          e?.message ?? "Kunne ikke joine session."
        );
        setScreen("login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, pendingJoinSessionId]);

  // Load remote events when entering summary (and sessionId exists)
  useEffect(() => {
    (async () => {
      if (screen !== "summary") return;
      if (!sessionId) return;
      try {
        const evs = await loadSessionEvents(sessionId);
        setRemoteEvents(evs);
      } catch (e) {
        console.warn("loadSessionEvents:", e);
        setRemoteEvents([]);
      }
    })();
  }, [screen, sessionId]);

  const mergedTimeline = useMemo(() => {
    const evEntries = remoteEvents.map(eventToLogEntry);
    const all = [...log, ...evEntries];
    all.sort((a, b) => a.timeMs - b.timeMs);
    return all;
  }, [log, remoteEvents]);

  const evaluation = useMemo(() => {
    if (!scenario) {
      return {
        evaluated: [] as EvaluatedAction[],
        extraActions: [] as ActionLogEntry[],
      };
    }
    return evaluateCase(scenario, mergedTimeline);
  }, [scenario, mergedTimeline]);

  const startCase = (c: CaseScenario) => {
    setScenario(c);
    const initState = c.states.find((s) => s.id === c.initialStateId)!;
    setCurrentState(initState);

    setElapsedMs(0);
    setRunning(false);
    setLog([]);
    setSelectedLetter("A");

    setSamplerState(initialSampler);
    setOpqrstState(initialOpqrst);
    setMidasheState(initialMidashe);

    setAbcdeActionsExpanded(true);
    setSamplerExpanded(false);
    setOpqrstExpanded(false);
    setMidasheExpanded(false);
    setMedExpanded(false);

    setSelectedMedication(null);
    setSelectedDose(null);
    setSelectedOxygenFlow(null);

    setPopupText(null);

    setRunId(null);
    setRunStartedAtEpochMs(null);

    setFeedbackOpen(false);
    setFeedbackText("");
    setFeedbackGrade("");
    setSavingFeedback(false);

    setScreen("caseDetail");
  };

  async function startTimer() {
    const newRunId = makeRunId();
    setRunId(newRunId);
    setRunStartedAtEpochMs(Date.now());

    setRunning(true);

    if (sessionId) {
      try {
        await setSessionRunning(sessionId);
      } catch (e) {
        console.warn("setSessionRunning failed:", e);
      }
    }
  }

  function sessionRelNowMs(): number {
    if (!sessionDoc?.startedAtEpochMs) return 0;
    return Math.max(0, Date.now() - sessionDoc.startedAtEpochMs);
  }

  // ---------- Actions & handlers used by screens ----------
  const caseStarted = running || elapsedMs > 0;
  const locked = !caseStarted;

  const guardLocked = () => {
    if (locked) {
      Alert.alert(
        "Start casen først",
        "Tryk på 'GO – start timer' før du bruger funktionerne."
      );
      return true;
    }
    return false;
  };

  const handleActionPress = (action: AbcdeAction) => {
    if (guardLocked()) return;
    if (!scenario || !currentState) return;

    const transition = scenario.transitions.find(
      (t) => t.fromStateId === currentState.id && t.actionId === action.id
    );
    const newState =
      transition && scenario.states.find((s) => s.id === transition.toStateId);
    const resultingState = newState || currentState;

    if (newState) setCurrentState(newState);

    const entry: ActionLogEntry = {
      id: `${Date.now()}_${action.id}`,
      timeMs: elapsedMs,
      actionId: action.id,
      description: `${action.label}`,
      resultingStateId: resultingState.id,
    };

    setLog((prev) => [...prev, entry]);
  };

  const handleRegisterMedication = () => {
    if (guardLocked()) return;
    if (!scenario || !currentState) return;

    if (!selectedMedication) {
      Alert.alert("Manglende valg", "Vælg et præparat.");
      return;
    }

    let description = "";
    let actionId = "";
    let meta: ActionLogEntry["meta"] = {};

    if (selectedMedication.type === "oxygen") {
      if (selectedOxygenFlow == null) {
        Alert.alert("Manglende valg", "Vælg liter/min for ilt.");
        return;
      }

      actionId = selectedMedication.id;

      meta = { oxygenFlow: selectedOxygenFlow };
      description = `Medicinsk ilt: ${selectedOxygenFlow} L/min.`;
    } else {
      if (!selectedDose) {
        Alert.alert("Manglende valg", "Vælg dosis (½ / normal / dobbelt).");
        return;
      }

      const doseOptions = getDoseOptionsForMedication(selectedMedication);
      const doseMeta = doseOptions.find((d) => d.id === selectedDose);

      if (!doseMeta) {
        Alert.alert(
          "Fejl",
          "Kunne ikke beregne dosis for det valgte præparat."
        );
        return;
      }

      actionId = selectedMedication.id;

      meta = {
        doseStrength: selectedDose,
        baseDose: (selectedMedication as any).normalDose ?? null,
        factor: doseMeta.factor,
        actualDose: doseMeta.value,
        unit: doseMeta.unit,
      };

      description = `Medicin: ${selectedMedication.name} – ${doseMeta.label}.`;
    }

    const entry: ActionLogEntry = {
      id: `${Date.now()}_${actionId}`,
      timeMs: elapsedMs,
      actionId,
      description,
      resultingStateId: currentState.id,
      meta,
    };
    // ✅ Apply state transition for meds too (if defined in scenario.transitions)
    const medTransition = scenario.transitions.find(
      (t) => t.fromStateId === currentState.id && t.actionId === actionId
    );

    const medNewState =
      medTransition &&
      scenario.states.find((s) => s.id === medTransition.toStateId);

    if (medNewState) {
      setCurrentState(medNewState);
    }

    setLog((prev) => [...prev, entry]);

    setSelectedMedication(null);
    setSelectedDose(null);
    setSelectedOxygenFlow(null);
  };

  const handleLogTriage = (isCritical: boolean) => {
    if (guardLocked()) return;
    if (!scenario || !currentState) return;

    const actionId = isCritical
      ? "PATIENT_TRIAGE_CRITICAL"
      : "PATIENT_TRIAGE_NONCRITICAL";
    const description = isCritical
      ? "Triage: Kritisk patient."
      : "Triage: Ikke kritisk patient.";

    const entry: ActionLogEntry = {
      id: `${Date.now()}_${actionId}`,
      timeMs: elapsedMs,
      actionId,
      description,
      resultingStateId: currentState.id,
      meta: { triage: isCritical ? "CRITICAL" : "NONCRITICAL" },
    };

    setLog((prev) => [...prev, entry]);
  };

  const handleLogAssistance = (choice: AssistanceChoice) => {
    if (guardLocked()) return;
    if (!currentState) return;

    const label =
      choice === "EKSTRA_AMBULANCE"
        ? "Ekstra ambulance"
        : choice === "AKUTBIL"
        ? "Akutbil"
        : "Lægebil";

    const actionId = `ASSIST_${choice}`;

    const entry: ActionLogEntry = {
      id: `${Date.now()}_${actionId}`,
      timeMs: elapsedMs,
      actionId,
      description: `Tilkald assistance: ${label}.`,
      resultingStateId: currentState.id,
      meta: { assistance: choice },
    };

    setLog((prev) => [...prev, entry]);
  };

  async function saveSummaryWithFeedback() {
    if (!scenario) return;

    const uid = auth.currentUser?.uid ?? null;

    const payload = stripUndefined({
      runId: runId ?? makeRunId(),
      createdAtEpochMs: runStartedAtEpochMs ?? Date.now(),
      createdAtServer: serverTimestamp(),

      sessionId: sessionId ?? null,
      caseId: scenario.id ?? null,
      caseTitle: scenario.title ?? null,
      patient: scenario.patientInfo ?? null,

      org: {
        orgId: selectedOrg?.id ?? null,
        orgRole: selectedOrg?.role ?? null,
      },
      user: { uid },
      focus: pickedFocus ?? null,

      totalTimeMs: elapsedMs,
      timeline: mergedTimeline,

      acronyms: {
        sampler: samplerState,
        opqrst: opqrstState,
        midashe: midasheState,
      },

      feedback: {
        text: feedbackText.trim() || null,
        grade:
          selectedOrg?.role === "school" ? feedbackGrade.trim() || null : null,
      },
    });

    setSavingFeedback(true);
    try {
      const key = "casefacilitator:runs";
      const existingRaw = await AsyncStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(payload);
      await AsyncStorage.setItem(key, JSON.stringify(existing.slice(0, 250)));

      const effectiveRunId = payload.runId as string;

      if (sessionId) {
        const ref = doc(db, "sessions", sessionId, "runs", effectiveRunId);
        await setDoc(ref, payload, { merge: true });
      } else {
        const ref = doc(db, "runs", effectiveRunId);
        await setDoc(ref, payload, { merge: true });
      }

      Alert.alert("Gemt", "Feedback + summary gemt lokalt og i backend.");
      setFeedbackOpen(false);
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Kunne ikke gemme", e?.message ?? "Ukendt fejl.");
    } finally {
      setSavingFeedback(false);
    }
  }

  // ---------- Render screens ----------
  if (screen === "login") {
    return (
      <LoginScreen
        authReady={authReady}
        loadingCases={loadingCases}
        onPickOrg={async (org) => {
          try {
            setSelectedOrg(org);
            setLoadingCases(true);
            const cases = await loadAllCasesFromFirestore();
            setAllCases(cases);
            setLoadingCases(false);
            setScreen("caseList");
          } catch (e) {
            console.error(e);
            setLoadingCases(false);
            Alert.alert(
              "Kunne ikke hente cases",
              "Tjek Firestore regler + internet."
            );
          }
        }}
        onScanQr={() => setScreen("scanQr")}
      />
    );
  }

  if (screen === "caseList") {
    return (
      <CaseListScreen
        selectedOrg={selectedOrg}
        allCases={allCases}
        onBackToLogin={() => {
          cleanupSessionListener();
          setSessionId(null);
          setSessionDoc(null);
          setLiveState(null);
          setSelectedOrg(null);
          setAllCases([]);
          setScreen("login");
        }}
        onPickCase={(c) => {
          setSelectedCaseTemplate(c);
          setSetupSex(c.patientInfo?.sex ?? "M");
          setSetupAge(c.patientInfo?.age ?? 50);
          setUnits({ ambulancer: 1, akutbil: 0, laegebil: 0 });
          setFacilitatorsCount(1);
          setScreen("caseSetup");
        }}
      />
    );
  }

  if (screen === "caseSetup") {
    return (
      <CaseSetupScreen
        selectedOrg={selectedOrg}
        selectedCaseTemplate={selectedCaseTemplate}
        setupSex={setupSex}
        setupAge={setupAge}
        units={units}
        facilitatorsCount={facilitatorsCount}
        onSetSex={setSetupSex}
        onSetAge={setSetupAge}
        onSetUnits={setUnits}
        onSetFacilitatorsCount={setFacilitatorsCount}
        onBack={() => setScreen("caseList")}
        onScanQr={() => setScreen("scanQr")}
        onStartSoloCase={(derivedScenario) => {
          if (units.ambulancer + units.akutbil + units.laegebil <= 0) {
            Alert.alert(
              "Ingen enheder",
              "Angiv mindst 1 enhed (fx 1 ambulance)."
            );
            return;
          }
          startCase(derivedScenario);
        }}
        onCreateSessionInvite={async () => {
          if (!selectedOrg || !selectedCaseTemplate) return;
          try {
            const { sessionId: sid } = await createSession({
              caseId: selectedCaseTemplate.id,
              orgId: selectedOrg.id,
              facilitatorsCount,
              units,
              patient: { sex: setupSex, age: setupAge },
            });
            setSessionId(sid);
            await ensureSessionListener(sid);
            setScreen("inviteQr");
          } catch (e: any) {
            console.error(e);
            Alert.alert(
              "Session fejl",
              e?.message ?? "Kunne ikke oprette session."
            );
          }
        }}
      />
    );
  }

  if (screen === "inviteQr") {
    const facUrl = sessionId ? buildJoinUrl(sessionId, "facilitator") : null;
    const defUrl = sessionId ? buildJoinUrl(sessionId, "defib") : null;

    return (
      <InviteQrScreen
        sessionId={sessionId}
        facUrl={facUrl}
        defUrl={defUrl}
        onBack={() => setScreen("caseSetup")}
      />
    );
  }

  if (screen === "scanQr") {
    return (
      <ScanQrScreen
        perm={perm ?? null}
        requestPerm={requestPerm}
        onBack={() => setScreen(selectedOrg ? "caseSetup" : "login")}
        onParsedInvite={({ sessionId: sid, role }) => {
          setPendingJoinSessionId(sid);
          setPendingJoinRole(role);

          if (role === "DEFIB") setScreen("defib");
          else setScreen("pickFocus");
        }}
      />
    );
  }

  if (screen === "pickFocus") {
    return (
      <PickFocusScreen
        sessionId={pendingJoinSessionId}
        pickedFocus={pickedFocus}
        onPickFocus={(f) => setPickedFocus(f)}
        onJoin={async () => {
          const sid = pendingJoinSessionId;
          if (!sid) {
            Alert.alert("Mangler session", "Ingen sessionId fundet.");
            setScreen("login");
            return;
          }

          try {
            const docSnap = await joinSession({
              sessionId: sid,
              role: "FACILITATOR",
            });
            setSessionId(sid);
            setSessionDoc(docSnap);
            await ensureSessionListener(sid);
            await setFacilitatorFocus(sid, pickedFocus);

            Alert.alert(
              "Joined",
              `Du er nu i sessionen.\nFokus: ${pickedFocus}`
            );
            setScreen(selectedOrg ? "caseSetup" : "login");
          } catch (e: any) {
            console.error(e);
            Alert.alert("Join fejl", e?.message ?? "Kunne ikke joine session.");
            setScreen("login");
          }
        }}
      />
    );
  }

  if (screen === "defib") {
    return (
      <DefibScreen
        sessionId={sessionId}
        sessionDoc={sessionDoc}
        liveState={liveState}
        defibOn={defibOn}
        defibBusy={defibBusy}
        defibDisplay={defibDisplay}
        defibEkgKey={defibEkgKey}
        onBack={() => setScreen("login")}
        onTogglePower={() => {
          setDefibOn((p) => !p);
          setDefibDisplay("");
          setDefibEkgKey(null);
          // optional: also clear busy
          setDefibBusy(null);
        }}
        onSetBusy={(v) => setDefibBusy(v)}
        onSetDisplay={(s) => setDefibDisplay(s)}
        onSetEkgKey={(k) => setDefibEkgKey(k)}
        onLogDefib={async (type, payload, note) => {
          if (!sessionId) return;
          await logSessionEvent({
            sessionId,
            type,
            tRelMs: sessionRelNowMs(),
            payload,
            note,
            source: "DEFIB",
          });
        }}
        sessionRelNowMs={sessionRelNowMs}
      />
    );
  }

  // Guard: only these screens need a scenario loaded
  if (
    (screen === "summary" || screen === "caseDetail") &&
    (!scenario || !currentState)
  ) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Ingen case valgt.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setScreen("login")}
        >
          <Text style={styles.buttonText}>Til login</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ---------- SUMMARY ----------
  if (screen === "summary") {
    const { evaluated, extraActions } = evaluation;

    return (
      <SummaryScreen
        scenario={scenario!}
        sessionId={sessionId}
        runId={runId}
        elapsedMs={elapsedMs}
        mergedTimeline={mergedTimeline}
        evaluated={evaluated}
        samplerState={samplerState}
        opqrstState={opqrstState}
        midasheState={midasheState}
        selectedOrgRole={selectedOrg?.role ?? null}
        feedbackOpen={feedbackOpen}
        feedbackText={feedbackText}
        feedbackGrade={feedbackGrade}
        savingFeedback={savingFeedback}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onCloseFeedback={() => setFeedbackOpen(false)}
        onSetFeedbackText={setFeedbackText}
        onSetFeedbackGrade={setFeedbackGrade}
        onSaveSummaryWithFeedback={saveSummaryWithFeedback}
        onBackToSetup={() => {
          setRunning(false);
          setScreen("caseSetup");
        }}
        onBackToCases={() => {
          setRunning(false);
          setScenario(null);
          setCurrentState(null);
          setLog([]);
          setElapsedMs(0);
          setRunId(null);
          setRunStartedAtEpochMs(null);
          setScreen("caseList");
        }}
        onRunAgain={() => {
          setRunning(false);
          setScreen("caseSetup");
        }}
      />
    );
  }

  // ---------- DEFAULT: CASE DETAIL ----------
  return (
    <CaseDetailScreen
      scenario={scenario!}
      currentState={currentState!}
      elapsedMs={elapsedMs}
      running={running}
      popupText={popupText}
      selectedLetter={selectedLetter}
      setSelectedLetter={setSelectedLetter}
      abcdeActionsExpanded={abcdeActionsExpanded}
      setAbcdeActionsExpanded={setAbcdeActionsExpanded}
      samplerExpanded={samplerExpanded}
      setSamplerExpanded={setSamplerExpanded}
      opqrstExpanded={opqrstExpanded}
      setOpqrstExpanded={setOpqrstExpanded}
      midasheExpanded={midasheExpanded}
      setMidasheExpanded={setMidasheExpanded}
      medExpanded={medExpanded}
      setMedExpanded={setMedExpanded}
      samplerState={samplerState}
      setSamplerState={setSamplerState}
      opqrstState={opqrstState}
      setOpqrstState={setOpqrstState}
      midasheState={midasheState}
      setMidasheState={setMidasheState}
      selectedMedication={selectedMedication}
      setSelectedMedication={setSelectedMedication}
      selectedDose={selectedDose}
      setSelectedDose={setSelectedDose}
      selectedOxygenFlow={selectedOxygenFlow}
      setSelectedOxygenFlow={setSelectedOxygenFlow}
      onBackToSetup={() => {
        setRunning(false);
        setScreen("caseSetup");
      }}
      onStartTimer={startTimer}
      onActionPress={handleActionPress}
      onRegisterMedication={handleRegisterMedication}
      onFinishCaseToSummary={() => {
        setRunning(false);
        setScreen("summary");
      }}
      // ✅ NEW
      onLogTriage={handleLogTriage}
      onConfirmAssistance={handleLogAssistance}
      assistanceModalOpen={assistanceModalOpen}
      setAssistanceModalOpen={setAssistanceModalOpen}
      selectedAssistance={selectedAssistance}
      setSelectedAssistance={setSelectedAssistance}
    />
  );
}
