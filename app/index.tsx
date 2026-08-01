// app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Firebase
import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signOut,
} from "firebase/auth";
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
import { styles } from "../src/styles/indexStyles";

// Data
import { getDoseOptionsForMedication } from "../src/data/medications";

// Utils
import { stripUndefined } from "../src/utils/format";
import { buildJoinUrls, parseJoinRole } from "../src/utils/joinLinks";

// Services
import { saveRun } from "../src/services/runs";
import { getUserProfile } from "../src/services/users";

import {
  joinSession,
  listenToSession,
  setFacilitatorFocus,
  setSessionFinished,
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
  listenSessionEvents,
  logSessionEvent,
  type SessionEvent,
} from "../src/services/sessionEvents";

// Domain
import { useSimulationLifecycle } from "../src/application/simulation/useSimulationLifecycle";
import {
  loadCasesWithFallback,
  type CaseSourceMode,
} from "../src/domain/cases/fallbackRepository";
import { normalizeCaseScenario } from "../src/domain/cases/normalize";
import type {
  AbcdeAction,
  AbcdeLetter,
  ActionLogEntry,
  CaseCategory,
  CaseScenario,
  DoseStrength,
  HlrLevel,
  Medication,
  MidasheLetter,
  OpqrstLetter,
  SamplerLetter,
} from "../src/domain/cases/types";
import type { SimulationCommand } from "../src/domain/simulation/types";

// Screens
import { CaseDetailScreen } from "../src/screens/CaseDetailScreen";
import { CaseListScreen } from "../src/screens/CaseListScreen";
import { CaseSetupScreen } from "../src/screens/CaseSetupScreen";
import CasesHubScreen from "../src/screens/CasesHubScreen";
import { ContactScreen } from "../src/screens/ContactScreen";
import { DefibScreen } from "../src/screens/DefibScreen";
import { DocumentsScreen } from "../src/screens/DocumentsScreen";
import { HlrCaseScreen } from "../src/screens/HlrCaseScreen";
import { InviteQrScreen } from "../src/screens/InviteQrScreen";
import { PortalRequiredScreen } from "../src/screens/PortalRequiredScreen";
import { MainMenuScreen } from "../src/screens/MainMenuScreen";
import { useStaffAccess } from "./_layout";
import { endPortalSession } from "../src/services/portalBridge";
import { PickFocusScreen } from "../src/screens/PickFocusScreen";
import { RunDetailScreen } from "../src/screens/RunDetailScreen";
import { RunHistoryScreen } from "../src/screens/RunHistoryScreen";
import { ScanQrScreen } from "../src/screens/ScanQrScreen";
import { SummaryScreen } from "../src/screens/SummaryScreen";
import { TraumeCaseScreen } from "../src/screens/TraumeCaseScreen";

// Evaluation helpers
import {
  evaluateCase,
  eventToLogEntry,
  mapDefibEventToActionId,
} from "../src/utils/caseEvaluation";

// ---------- Types ----------
type Screen =
  | "landing"
  | "mainMenu"
  | "casesHub"
  | "medicalCases"
  | "traumaCases"
  | "hlrCases"
  | "caseSetup"
  | "inviteQr"
  | "scanQr"
  | "pickFocus"
  | "defib"
  | "defibDemo"
  | "caseDetail"
  | "summary"
  | "history"
  | "runDetail"
  | "settings"
  | "contact"
  | "documents";

type UnitsRunConfig = {
  ambulancer: number;
  akutbil: number;
  laegebil: number;
};

type CprCallout =
  | "ARREST_RECOGNIZED"
  | "CPR_STARTED"
  | "PADS_ON"
  | "RHYTHM_CHECK"
  | "AIRWAY"
  | "IV_IO"
  | "ROSC";

type CprLevel = HlrLevel;

type UserProfile = {
  uid: string;
  displayName: string;
  role: string; // e.g. "student" | "facilitator" | "admin"
  orgId: string; // read-only, from profile
};

// ---------- Helpers ----------
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
  const snap = await getDocs(collection(db, "cases_v3"));
  const cases: CaseScenario[] = [];
  snap.forEach((docSnap) => {
    try {
      cases.push(normalizeCaseScenario({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
      console.warn(`Skipping invalid case ${docSnap.id}:`, error);
    }
  });

  cases.sort((a, b) =>
    String(a.title || "").localeCompare(String(b.title || "")),
  );
  return cases;
}

// Heuristic: tag HLR cases without changing DB schema yet
function isHlrCase(c: CaseScenario): boolean {
  const t = `${c.caseType ?? ""} ${c.title ?? ""} ${
    c.subtitle ?? ""
  }`.toLowerCase();
  return (
    t.includes("hlr") || t.includes("arrest") || t.includes("cardiac arrest")
  );
}

function isTraumaCase(c: CaseScenario): boolean {
  const t = `${c.caseType ?? ""} ${c.title ?? ""} ${
    c.subtitle ?? ""
  }`.toLowerCase();
  return (
    t.includes("traume") ||
    t.includes("trauma") ||
    t.includes("blødning") ||
    t.includes("bleeding") ||
    t.includes("fracture") ||
    t.includes("fraktur") ||
    t.includes("tbi") ||
    t.includes("head injury")
  );
}

function buildDemoVitals(_tSec: number) {
  // "Normal patient" demo vitals (stable baseline, small natural noise)
  const w = (n: number, spread: number) =>
    Math.round(n + (Math.random() * 2 - 1) * spread);
  const wf = (n: number, spread: number) =>
    Number((n + (Math.random() * 2 - 1) * spread).toFixed(1));

  return {
    hr: w(78, 2), // small noise
    rr: w(14, 1),
    btSys: 128, // keep stable (remeasure only happens on defib side)
    btDia: 78, // stable
    spo2: w(97, 1), // tiny noise
    etco2: wf(5.2, 0.1), // tiny noise
    temp: 36.8, // stable
    bs: 6.1, // stable
  };
}

// ---------- Component ----------
export default function Index() {
  const staffAccess = useStaffAccess();
  const isStaffAuthorised = staffAccess === "AUTHORISED_STAFF";
  // Auth
  const [authReady, setAuthReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  // Navigation
  const [screen, setScreen] = useState<Screen>("landing");
  const [scanQrBackScreen, setScanQrBackScreen] = useState<Screen>("caseSetup");
  const [caseListBackScreen, setCaseListBackScreen] =
    useState<Screen>("casesHub");

  // Profile + cases
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingCases, setLoadingCases] = useState(false);
  const [allCases, setAllCases] = useState<CaseScenario[]>([]);
  const [selectedCaseTemplate, setSelectedCaseTemplate] =
    useState<CaseScenario | null>(null);
  const [caseCategory, setCaseCategory] = useState<CaseCategory>("MEDICAL");
  const [caseSourceMode, setCaseSourceMode] =
    useState<CaseSourceMode>("REMOTE_CANONICAL");
  const [hlrMode, setHlrMode] = useState<HlrLevel>("BLS");

  // Run browsing
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runsReloadKey, setRunsReloadKey] = useState(0);

  // Setup overrides
  const [setupSex, setSetupSex] = useState<"M" | "K">("M");
  const [setupAge, setSetupAge] = useState<number>(50);
  const [units, setUnits] = useState<UnitsRunConfig>({
    ambulancer: 1,
    akutbil: 0,
    laegebil: 0,
  });
  const [facilitatorsCount, setFacilitatorsCount] = useState<number>(1);

  const [demoStartedAt, setDemoStartedAt] = useState<number>(() => Date.now());
  const [demoLiveState, setDemoLiveState] = useState<SessionLiveState | null>(
    null,
  );

  // Session / pairing
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionDoc, setSessionDoc] = useState<SessionDoc | null>(null);
  const cprLevel: CprLevel = hlrMode;

  const [pendingJoinSessionId, setPendingJoinSessionId] = useState<
    string | null
  >(null);
  const [pendingJoinRole, setPendingJoinRole] = useState<
    "FACILITATOR" | "DEFIB"
  >("FACILITATOR");

  const pendingJoinRef = useRef<string | null>(null);
  useEffect(() => {
    pendingJoinRef.current = pendingJoinSessionId;
  }, [pendingJoinSessionId]);
  // Live state for defib
  const [liveState, setLiveState] = useState<SessionLiveState | null>(null);
  const [pickedFocus, setPickedFocus] = useState<FacilitatorFocus>("ALL");

  const sessionUnsubRef = useRef<null | (() => void)>(null);
  const liveUnsubRef = useRef<null | (() => void)>(null);

  const simulation = useSimulationLifecycle();
  const {
    scenario,
    currentState,
    simulationState,
    log,
    transitionFeedback,
    startSimulation,
    resetSimulation,
    applyCommand,
  } = simulation;

  // Run/timer/log
  const [elapsedMs, setElapsedMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<AbcdeLetter>("A");

  // Run identity
  const [runId, setRunId] = useState<string | null>(null);
  const [runStartedAtEpochMs, setRunStartedAtEpochMs] = useState<number | null>(
    null,
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
    null,
  );

  const [popupText, setPopupText] = useState<string | null>(null);

  // Defib UI state
  const [defibOn, setDefibOn] = useState(false);
  const [defibBusy, setDefibBusy] = useState<
    | null
    | "NIBP"
    | "SAT"
    | "ETCO2"
    | "BS"
    | "TEMP"
    | "EKG12"
    | "CHARGE"
    | "SHOCK"
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

  async function doLogout() {
    try {
      await endPortalSession().catch(() => {});
      await signOut(auth);
    } finally {
      cleanupSessionListener();

      // ✅ clear session + live state
      setSessionId(null);
      setSessionDoc(null);
      setLiveState(null);

      setPendingJoinSessionId(null);
      setPendingJoinRole("FACILITATOR");

      // Reset defibrillator UI state.
      setDefibOn(false);
      setDefibBusy(null);
      setDefibDisplay("");
      setDefibEkgKey(null);

      // ✅ clear profile + cases
      setProfile(null);
      setAllCases([]);
      setSelectedCaseTemplate(null);

      // ✅ clear run state
      resetSimulation();
      setElapsedMs(0);
      setRunId(null);
      setRunStartedAtEpochMs(null);

      setScreen("landing");
    }
  }

  function categoryForScenario(c: CaseScenario): CaseCategory {
    if (c.category) return c.category;

    if (isHlrCase(c)) return "HLR";
    if (isTraumaCase(c)) return "TRAUMA";
    return "MEDICAL";
  }

  const hadUserRef = useRef(false);

  // ---------- Auth bootstrap ----------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      const hasUser = !!user;
      if (hasUser) hadUserRef.current = true;

      setIsAuthed(hasUser);
      setAuthReady(true);

      console.log("AUTH:", {
        uid: user?.uid ?? null,
        anon: user?.isAnonymous ?? null,
        email: user?.email ?? null,
      });
    });

    return () => unsub();
  }, []);

  // ✅ Web-only: read query params on first load
  // Example: http://192.168.x.x:8081/--/join?sessionId=...&role=defib
  useEffect(() => {
    if (Platform.OS !== "web") return;

    try {
      const u = new URL(window.location.href);
      const sid = u.searchParams.get("sessionId");
      const roleRaw = u.searchParams.get("role");

      if (sid) {
        const role = parseJoinRole(roleRaw);
        setPendingJoinSessionId(sid);
        setPendingJoinRole(role);
        // ✅ Don't hard-navigate here; let join driver effect do it once auth is ready
      }
    } catch (e) {
      console.warn("web url parse failed", e);
    }
  }, []);

  async function ensureAuthForJoin(role: "FACILITATOR" | "DEFIB") {
    if (auth.currentUser) return;

    // ✅ Defib should not require credentials: use anonymous auth
    if (role === "DEFIB") {
      try {
        if (Platform.OS === "web") {
          await setPersistence(auth, browserSessionPersistence).catch(() => {});
        }
        await signInAnonymously(auth);
        return;
      } catch (e) {
        console.warn("anonymous sign-in failed:", e);
      }
    }

    // Permanent facilitators must arrive with a restored Portal product session.
    setScreen("landing");
  }

  // ✅ Join driver: once we have a pending join and auth is ready, navigate safely
  useEffect(() => {
    (async () => {
      if (!pendingJoinSessionId) return;
      if (!authReady) return;

      await ensureAuthForJoin(pendingJoinRole);

      // if still no user (facilitator without login), stop here
      if (!auth.currentUser) return;
      if (pendingJoinRole === "FACILITATOR" && !isStaffAuthorised) return;

      setScreen(pendingJoinRole === "DEFIB" ? "defib" : "pickFocus");
    })();
  }, [pendingJoinSessionId, pendingJoinRole, authReady, isStaffAuthorised]);

  // Demo vitals ticker
  useEffect(() => {
    if (screen !== "defibDemo") return;

    const startedAt = Date.now();
    setDemoStartedAt(startedAt);

    const id = setInterval(() => {
      const tSec = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      const vitals = buildDemoVitals(tSec);
      setDemoLiveState({
        vitals,
        abcde: {
          A: "",
          B: "",
          C: "",
          D: "",
          E: "",
        },
        rhythmKey: "SINUS",
        updatedAt: Date.now(),
      });
    }, 900);

    return () => clearInterval(id);
  }, [screen]);

  // When auth changes, load profile + cases once (and don't stomp join flow)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!authReady) return;

      const user = auth.currentUser;
      if (user?.isAnonymous || !isStaffAuthorised) {
        if (pendingJoinRole !== "DEFIB") {
          setProfile(null);
          setAllCases([]);
        }
        return;
      }
      if (!user) {
        if (cancelled) return;

        setProfile(null);
        setAllCases([]);

        // ✅ Only go to landing if we truly don't have a user session
        // If we've previously had a user, ignore transient web flicker
        if (!hadUserRef.current) {
          setScreen("landing");
        }

        return;
      }

      try {
        const uid = user.uid;
        const p = await getUserProfile(uid);

        if (cancelled) return;

        // ✅ Don’t block app if profile missing (debug-friendly)
        if (!p) {
          setProfile({
            uid,
            displayName: user.email ?? "Bruger",
            role: "unknown",
            orgId: "unknown",
          });
        } else {
          setProfile({
            uid,
            displayName: p.displayName ?? "Bruger",
            role: p.role ?? "unknown",
            orgId: p.orgId ?? "unknown",
          });
        }

        setLoadingCases(true);
        const sourcedCases = await loadCasesWithFallback(
          loadAllCasesFromFirestore,
        );
        if (cancelled) return;

        setAllCases(sourcedCases.cases);
        setCaseSourceMode(sourcedCases.mode);
        setLoadingCases(false);

        // ✅ CRITICAL: don't stomp join navigation
        if (!pendingJoinRef.current) {
          setScreen("mainMenu");
        }
      } catch (e) {
        console.warn("bootstrap failed:", e);
        if (cancelled) return;

        setLoadingCases(false);
        Alert.alert("Fejl", "Kunne ikke hente brugerprofil eller cases.");
        if (!pendingJoinRef.current) setScreen("landing");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, isAuthed, isStaffAuthorised, pendingJoinRole]);

  // ---------- Deep link handler (native + web Linking) ----------
  useEffect(() => {
    const handleUrl = (url: string) => {
      const parsed = Linking.parse(url);
      const path = String(parsed?.path ?? "").replace(/^\//, "");
      const host = String(parsed?.hostname ?? "").replace(/^\//, "");
      const route = (path || host).replace(/^\//, "");

      const sid = (parsed.queryParams?.sessionId as string) || null;
      const role = parseJoinRole(parsed.queryParams?.role);

      const isJoin =
        route === "join" ||
        route === "--/join" ||
        route.endsWith("join") ||
        (!!sid && (route === "" || route === "index"));

      if (isJoin && sid) {
        setPendingJoinSessionId(sid);
        setPendingJoinRole(role);
        // The join driver navigates once authentication is ready.
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

  async function ensureSessionListener(sid: string) {
    cleanupSessionListener();
    sessionUnsubRef.current = listenToSession(
      sid,
      (data) => {
        setSessionDoc(data);
        if (data?.hlrMode === "BLS" || data?.hlrMode === "ALS")
          setHlrMode(data.hlrMode);
      },
      (e) => console.warn("Session listen error:", e),
    );
    liveUnsubRef.current = listenLiveState(
      sid,
      (st) => setLiveState(st),
      (e) => console.warn("Live state listen error:", e),
    );
  }

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

  // Auto-join defib when landing on defib screen via QR/deeplink/web query
  useEffect(() => {
    (async () => {
      if (screen !== "defib") return;
      const sid = pendingJoinSessionId;
      if (!sid) return;

      // ✅ Must be authed (anonymous ok)
      if (!authReady) return;
      if (!auth.currentUser) return;

      try {
        const docSnap = await joinSession({ sessionId: sid, role: "DEFIB" });
        setSessionId(sid);
        setSessionDoc(docSnap);
        await ensureSessionListener(sid);
      } catch (e: any) {
        console.error(e);
        Alert.alert(
          "Defib join fejl",
          e?.message ?? "Kunne ikke joine session.",
        );
        setScreen("landing");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, pendingJoinSessionId, authReady, isAuthed]);

  // Realtime legacy compatibility subscription. Canonical persistence remains opt-in.
  useEffect(() => {
    if (!sessionId) {
      setRemoteEvents([]);
      return;
    }
    return listenSessionEvents(sessionId, setRemoteEvents, (error) =>
      console.warn("listenSessionEvents:", error),
    );
  }, [sessionId]);

  const mergedTimeline = useMemo(() => {
    const evEntries = remoteEvents.map(eventToLogEntry);
    const all = [...log, ...evEntries];
    all.sort((a, b) => a.timeMs - b.timeMs);
    return all;
  }, [log, remoteEvents]);

  const evaluation = useMemo(() => {
    if (!scenario) return { evaluated: [], extraActions: [] };
    try {
      return evaluateCase(scenario, mergedTimeline);
    } catch (e) {
      console.warn("evaluateCase failed:", e);
      return { evaluated: [], extraActions: [] };
    }
  }, [scenario, mergedTimeline]);

  const medicalCases = useMemo(() => {
    // “Everything you have now” becomes Medicinske.
    // We exclude HLR, and we exclude trauma if you start tagging them later.
    return allCases.filter((c) => !isHlrCase(c) && !isTraumaCase(c));
  }, [allCases]);

  const traumaCases = useMemo(() => {
    return allCases.filter(isTraumaCase);
  }, [allCases]);

  const hlrCases = useMemo(() => {
    return allCases.filter(isHlrCase);
  }, [allCases]);

  const startCase = (c: CaseScenario) => {
    const selectedHlrMode = c.meta?.hlrLevel;
    if (selectedHlrMode === "BLS" || selectedHlrMode === "ALS") {
      setHlrMode(selectedHlrMode);
    }
    startSimulation(c);
    setCaseCategory(categoryForScenario(c));

    setElapsedMs(0);
    setRunning(false);
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

  // ---------- Actions & handlers ----------
  const caseStarted = running || elapsedMs > 0;
  const locked = !caseStarted;

  const guardLocked = () => {
    if (locked) {
      Alert.alert(
        "Start casen først",
        "Tryk på 'GO – start timer' før du bruger funktionerne.",
      );
      return true;
    }
    return false;
  };

  const executeSimulationCommand = (command: SimulationCommand) => {
    return applyCommand(command);
  };

  const handleActionPress = (action: AbcdeAction) => {
    if (guardLocked()) return;
    executeSimulationCommand({
      type: "ACTION",
      commandId: `${Date.now()}_${action.id}`,
      actionId: action.id,
      occurredAtMs: elapsedMs,
      description: action.label,
    });
  };

  const handleRegisterMedication = () => {
    if (guardLocked()) return;
    if (!scenario || !simulationState) return;

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
          "Kunne ikke beregne dosis for det valgte præparat.",
        );
        return;
      }

      actionId = selectedMedication.id;
      meta = {
        doseStrength: selectedDose,
        baseDose: selectedMedication.normalDose ?? null,
        factor: doseMeta.factor,
        actualDose: doseMeta.value,
        unit: doseMeta.unit,
      };
      description = `Medicin: ${selectedMedication.name} – ${doseMeta.label}.`;
    }

    executeSimulationCommand({
      type: "MEDICATION",
      commandId: `${Date.now()}_${actionId}`,
      actionId,
      occurredAtMs: elapsedMs,
      description,
      metadata: meta,
    });

    setSelectedMedication(null);
    setSelectedDose(null);
    setSelectedOxygenFlow(null);
  };

  const handleLogTriage = (isCritical: boolean) => {
    if (guardLocked()) return;
    if (!scenario || !simulationState) return;

    const actionId = isCritical
      ? "PATIENT_TRIAGE_CRITICAL"
      : "PATIENT_TRIAGE_NONCRITICAL";
    const description = isCritical
      ? "Triage: Kritisk patient."
      : "Triage: Ikke kritisk patient.";

    executeSimulationCommand({
      type: "ACTION",
      commandId: `${Date.now()}_${actionId}`,
      actionId,
      occurredAtMs: elapsedMs,
      description,
      metadata: { triage: isCritical ? "CRITICAL" : "NONCRITICAL" },
    });
  };

  const handleRegisterAssistance = async () => {
    if (guardLocked()) return;
    if (!scenario || !simulationState) return;

    const actionId = "ASSIST_REGISTERED";
    const description = "Assistance registreret.";

    executeSimulationCommand({
      type: "ASSISTANCE",
      commandId: `${Date.now()}_${actionId}`,
      actionId,
      occurredAtMs: elapsedMs,
      description,
      assistance: true,
      metadata: { assistance: true },
    });

    // Optional: also log to session timeline if you’re in a session
    if (sessionId) {
      try {
        await logSessionEvent({
          sessionId,
          type: "ASSISTANCE_REGISTERED", // string is fine if your SessionEvent typing allows it
          tRelMs: sessionRelNowMs(),
          payload: { actionId },
          note: description,
          source: "FACILITATOR",
        });
      } catch (e) {
        console.warn("logSessionEvent assistance failed:", e);
      }
    }
  };

  const handleLogCprCallout = (
    type: CprCallout,
    extra: Record<string, unknown> = {},
  ) => {
    if (guardLocked()) return;
    if (!scenario || !simulationState) return;

    const actionId = `CPR_${type}`;
    const description =
      type === "ARREST_RECOGNIZED"
        ? "CPR: Cardiac arrest erkendt."
        : type === "CPR_STARTED"
          ? "CPR: HLR startet."
          : type === "PADS_ON"
            ? "CPR: Pads påsat."
            : type === "RHYTHM_CHECK"
              ? "CPR: Rytmetjek."
              : type === "AIRWAY"
                ? "CPR: Luftvej håndteret."
                : type === "IV_IO"
                  ? "CPR: IV/IO etableret."
                  : type === "ROSC"
                    ? "CPR: ROSC."
                    : `CPR: ${type}`;

    executeSimulationCommand({
      type: "CPR",
      commandId: `${Date.now()}_${actionId}`,
      actionId,
      occurredAtMs: elapsedMs,
      description,
      metadata: {
        cpr: {
          type,
          level: cprLevel,
          ...extra,
        },
      },
    });
  };

  async function handleDefibAction(
    type: SessionEvent["type"],
    payload: Record<string, unknown>,
    note?: string,
  ) {
    if (!sessionId) return;
    const occurredAtMs = sessionRelNowMs();
    await logSessionEvent({
      sessionId,
      type,
      tRelMs: occurredAtMs,
      payload,
      note,
      source: "DEFIB",
    });

    // A defib-only client has no local scenario. If the defib is running in the
    // same module instance as a case, apply any matching case transition while
    // retaining the existing Firestore event as the timeline source.
    if (scenario && simulationState) {
      applyCommand(
        {
          type: "DEFIBRILLATOR",
          commandId: `${Date.now()}_${type}`,
          actionId: mapDefibEventToActionId(type),
          occurredAtMs,
          description: note ?? type,
          metadata: { source: "DEFIB", originalType: type, payload },
        },
        { recordLog: false },
      );
    }
  }

  async function saveSummaryWithFeedback() {
    if (!scenario) return;

    const uid = auth.currentUser?.uid ?? null;
    const allowGrade = (profile?.role ?? "").toLowerCase() === "student";

    const payload = stripUndefined({
      runId: runId ?? makeRunId(),
      createdAtEpochMs: runStartedAtEpochMs ?? Date.now(),
      createdAtServer: serverTimestamp(),
      caseCategory: caseCategory ?? null,

      sessionId: sessionId ?? null,
      caseId: scenario.id ?? null,
      caseTitle: scenario.title ?? null,
      patient: scenario.patientInfo ?? null,

      orgId: profile?.orgId ?? null,
      user: {
        uid,
        displayName: profile?.displayName ?? null,
        role: profile?.role ?? null,
      },
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
        grade: allowGrade ? feedbackGrade.trim() || null : null,
      },
    });

    setSavingFeedback(true);
    try {
      const key = "casefacilitator:runs";
      const existingRaw = await AsyncStorage.getItem(key);
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(payload);
      await AsyncStorage.setItem(key, JSON.stringify(existing.slice(0, 20)));

      const effectiveRunId = payload.runId as string;

      await saveRun({
        runId: effectiveRunId,
        orgId: profile?.orgId ?? null, // keep field if backend expects it
        sessionId: sessionId ?? null,
        caseCategory: caseCategory ?? null,
        hlrMode: caseCategory === "HLR" ? hlrMode : null,

        caseId: scenario.id ?? null,
        caseTitle: scenario.title ?? null,

        focus: pickedFocus ?? null,

        totalTimeMs: elapsedMs,
        timeline: mergedTimeline,

        acronyms: {
          sampler: samplerState,
          opqrst: opqrstState,
          midashe: midasheState,
        },

        feedbackText: feedbackText.trim() || null,
        feedbackGrade: allowGrade ? feedbackGrade.trim() || null : null,

        traineeDisplayName:
          profile?.displayName ?? auth.currentUser?.displayName ?? null,
      });

      Alert.alert("Gemt", "Feedback + summary gemt lokalt og i backend.");
      setFeedbackOpen(false);
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Kunne ikke gemme", e?.message ?? "Ukendt fejl.");
    } finally {
      setSavingFeedback(false);
    }
  }

  // ---------- Render ----------
  if (screen === "landing") {
    return <PortalRequiredScreen />;
  }

  if (screen === "mainMenu") {
    const who = profile
      ? `${profile.displayName} • ${profile.orgId} • ${profile.role}`
      : "Ingen profil indlæst";

    return (
      <SafeAreaView style={styles.container}>
        <MainMenuScreen
          profileLabel={
            caseSourceMode === "LOCAL_FICTIONAL_FALLBACK"
              ? `${who} · LOCAL FICTIONAL MODE`
              : who
          }
          onLogout={doLogout}
          onOpenProfile={() => {
            Alert.alert(
              "Profile",
              "Profile screen not wired in this state-machine version yet.",
            );
          }}
          onOpenCases={() => setScreen("casesHub")}
          onOpenScanQr={() => {
            setScanQrBackScreen("mainMenu");
            setScreen("scanQr");
          }}
          onOpenDocuments={() => setScreen("documents")}
          onOpenHistory={() => setScreen("history")}
          onOpenSettings={() => setScreen("settings")}
          onOpenContact={() => setScreen("contact")}
        />

        {/* ✅ DEV button overlay (only show in development builds) */}
        {__DEV__ && (
          <View
            style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#4b5563" }]}
              onPress={() => setScreen("defibDemo")}
            >
              <Text style={styles.buttonText}>DEV: Open Defib Demo</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (screen === "casesHub") {
    const who = profile
      ? `${profile.displayName} • ${profile.orgId} • ${profile.role}`
      : "Ingen profil indlæst";

    return (
      <CasesHubScreen
        profileLabel={who}
        onBack={() => setScreen("mainMenu")}
        onOpenMedical={() => setScreen("medicalCases")}
        onOpenTrauma={() => setScreen("traumaCases")}
        onOpenHlr={() => setScreen("hlrCases")}
      />
    );
  }

  if (screen === "defibDemo") {
    const sid = "DEMO_SESSION";

    const demoDoc: any = {
      status: "RUNNING",
      startedAtEpochMs: demoStartedAt,
    };

    return (
      <SafeAreaView style={styles.container}>
        <DefibScreen
          sessionId={sid}
          sessionDoc={demoDoc}
          liveState={demoLiveState}
          defibOn={defibOn}
          defibBusy={defibBusy}
          defibDisplay={defibDisplay}
          defibEkgKey={defibEkgKey}
          onBack={() => setScreen("mainMenu")}
          onTogglePower={() => {
            setDefibOn((p) => !p);
            setDefibDisplay("");
            setDefibEkgKey(null);
            setDefibBusy(null);
          }}
          onSetBusy={setDefibBusy}
          onSetDisplay={setDefibDisplay}
          onSetEkgKey={setDefibEkgKey}
          onLogDefib={async () => {}}
          sessionRelNowMs={() => Math.max(0, Date.now() - demoStartedAt)}
        />
      </SafeAreaView>
    );
  }

  if (screen === "settings") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => setScreen("mainMenu")}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Themes, units, toggles… (coming next)
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === "history") {
    return (
      <RunHistoryScreen
        reloadKey={runsReloadKey}
        onBack={() => {
          setSelectedRunId(null);
          setScreen("mainMenu");
        }}
        onOpenRun={(id) => {
          setSelectedRunId(id);
          setScreen("runDetail");
        }}
      />
    );
  }

  if (screen === "runDetail") {
    if (!selectedRunId) {
      setScreen("history");
      return null;
    }

    return (
      <RunDetailScreen
        runId={selectedRunId}
        onBack={() => setScreen("history")}
        onDeleted={() => setRunsReloadKey((k) => k + 1)}
      />
    );
  }

  if (screen === "medicalCases") {
    return (
      <CaseListScreen
        title="Medicinske cases"
        profile={profile}
        allCases={medicalCases}
        loadingCases={loadingCases}
        onBack={() => setScreen("casesHub")}
        onPickCase={(c) => {
          setCaseListBackScreen("medicalCases");
          setSelectedCaseTemplate(c);
          setCaseCategory(categoryForScenario(c));
          setSetupSex(c.patientInfo?.sex ?? "M");
          setSetupAge(c.patientInfo?.age ?? 50);
          setUnits({ ambulancer: 1, akutbil: 0, laegebil: 0 });
          setFacilitatorsCount(1);
          setScreen("caseSetup");
        }}
      />
    );
  }

  if (screen === "traumaCases") {
    return (
      <TraumeCaseScreen
        profile={profile}
        allCases={traumaCases}
        loadingCases={loadingCases}
        onBack={() => setScreen("casesHub")}
        onPickCase={(c) => {
          setCaseListBackScreen("traumaCases");
          setSelectedCaseTemplate(c);
          setSetupSex(c.patientInfo?.sex ?? "M");
          setSetupAge(c.patientInfo?.age ?? 50);
          setUnits({ ambulancer: 1, akutbil: 0, laegebil: 0 });
          setFacilitatorsCount(1);
          setCaseCategory(categoryForScenario(c));
          setScreen("caseSetup");
        }}
      />
    );
  }

  if (screen === "hlrCases") {
    return (
      <HlrCaseScreen
        profile={profile}
        allCases={hlrCases}
        loadingCases={loadingCases}
        onBack={() => setScreen("casesHub")}
        onPickCase={(c) => {
          setCaseListBackScreen("hlrCases");
          setSelectedCaseTemplate(c);
          setSetupSex(c.patientInfo?.sex ?? "M");
          setSetupAge(c.patientInfo?.age ?? 50);
          setUnits({ ambulancer: 1, akutbil: 0, laegebil: 0 });
          setFacilitatorsCount(1);
          setCaseCategory(categoryForScenario(c));
          setScreen("caseSetup");
        }}
      />
    );
  }

  if (screen === "contact") {
    return <ContactScreen onBack={() => setScreen("mainMenu")} />;
  }

  if (screen === "documents") {
    return <DocumentsScreen onBack={() => setScreen("mainMenu")} />;
  }

  if (screen === "caseSetup") {
    return (
      <CaseSetupScreen
        selectedCaseTemplate={selectedCaseTemplate}
        setupSex={setupSex}
        setupAge={setupAge}
        units={units}
        facilitatorsCount={facilitatorsCount}
        hlrLevel={hlrMode}
        onSetSex={setSetupSex}
        onSetAge={setSetupAge}
        onSetUnits={setUnits}
        onSetFacilitatorsCount={setFacilitatorsCount}
        onSetHlrLevel={setHlrMode}
        onBack={() => setScreen(caseListBackScreen)}
        onScanQr={() => {
          setScanQrBackScreen("caseSetup");
          setScreen("scanQr");
        }}
        onStartSoloCase={(derivedScenario) => {
          if (units.ambulancer + units.akutbil + units.laegebil <= 0) {
            Alert.alert(
              "Ingen enheder",
              "Angiv mindst 1 enhed (fx 1 ambulance).",
            );
            return;
          }
          startCase(derivedScenario);
        }}
        onCreateSessionInvite={async () => {
          if (!profile || !selectedCaseTemplate) return;

          try {
            const uid = auth.currentUser?.uid;
            if (!uid) {
              Alert.alert(
                "Auth fejl",
                "Ingen bruger fundet (auth.currentUser er null).",
              );
              return;
            }

            // Make a session id (safe for doc id)
            const sid = `${Date.now()}_${Math.random()
              .toString(36)
              .slice(2, 10)}`;

            // 1) Create session doc WITH ownerUid (required by the updated rules)
            await setDoc(doc(db, "sessions", sid), {
              createdByUid: uid,
              createdAt: serverTimestamp(),
              status: "SETUP",
              orgId: profile.orgId,
              caseId: selectedCaseTemplate.id,
              facilitatorsCount,
              units,
              patient: { sex: setupSex, age: setupAge },
              hlrMode,
            });

            // 2) Immediately create your own membership doc (prevents "read requires member" deadlock)
            await setDoc(doc(db, "sessions", sid, "members", uid), {
              role: "facilitator",
              createdAt: serverTimestamp(),
              displayName: profile.displayName ?? null,
              orgId: profile.orgId ?? null,
            });

            setSessionId(sid);
            await ensureSessionListener(sid);
            setScreen("inviteQr");
          } catch (e: any) {
            console.error(e);
            Alert.alert(
              "Session fejl",
              e?.message ?? "Kunne ikke oprette session.",
            );
          }
        }}
      />
    );
  }

  if (screen === "inviteQr") {
    const fac = sessionId ? buildJoinUrls(sessionId, "facilitator") : null;
    const def = sessionId ? buildJoinUrls(sessionId, "defib") : null;

    return (
      <InviteQrScreen
        sessionId={sessionId}
        facNativeUrl={fac?.nativeUrl ?? null}
        facWebUrl={fac?.webUrl ?? null}
        defNativeUrl={def?.nativeUrl ?? null}
        defWebUrl={def?.webUrl ?? null}
        onBack={() => setScreen("caseSetup")}
      />
    );
  }

  if (screen === "scanQr") {
    return (
      <ScanQrScreen
        perm={perm ?? null}
        requestPerm={requestPerm}
        onBack={() => setScreen(scanQrBackScreen)}
        onParsedInvite={({ sessionId: sid, role }) => {
          setPendingJoinSessionId(sid);
          setPendingJoinRole(role);
          // ✅ join driver effect navigates when auth is ready
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
            setScreen("mainMenu");
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
              `Du er nu i sessionen.\nFokus: ${pickedFocus}`,
            );
            setScreen("caseSetup");
          } catch (e: any) {
            console.error(e);
            Alert.alert("Join fejl", e?.message ?? "Kunne ikke joine session.");
            setScreen("mainMenu");
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
        defibBusy={defibBusy as any}
        defibDisplay={defibDisplay}
        defibEkgKey={defibEkgKey}
        onBack={() => setScreen("mainMenu")}
        onTogglePower={() => {
          setDefibOn((p) => !p);
          setDefibDisplay("");
          setDefibEkgKey(null);
          setDefibBusy(null);
        }}
        onSetBusy={(v) => setDefibBusy(v as any)}
        onSetDisplay={(s) => setDefibDisplay(s)}
        onSetEkgKey={(k) => setDefibEkgKey(k)}
        onLogDefib={handleDefibAction}
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
          onPress={() => setScreen("mainMenu")}
        >
          <Text style={styles.buttonText}>Til menu</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (screen === "summary") {
    const { evaluated } = evaluation;
    const allowGrade = (profile?.role ?? "").toLowerCase() === "student";

    return (
      <SummaryScreen
        scenario={scenario!}
        sessionId={sessionId}
        runId={runId}
        elapsedMs={elapsedMs}
        mergedTimeline={mergedTimeline}
        evaluated={evaluated as any}
        samplerState={samplerState}
        opqrstState={opqrstState}
        midasheState={midasheState}
        allowGrade={allowGrade}
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
          resetSimulation();
          setElapsedMs(0);
          setRunId(null);
          setRunStartedAtEpochMs(null);
          setScreen("casesHub");
        }}
        onRunAgain={() => {
          setRunning(false);
          setScreen("caseSetup");
        }}
      />
    );
  }

  // DEFAULT: CASE DETAIL
  return (
    <CaseDetailScreen
      mode={caseCategory}
      scenario={scenario!}
      currentState={currentState!}
      elapsedMs={elapsedMs}
      running={running}
      popupText={popupText}
      transitionFeedback={transitionFeedback}
      remoteEventCount={remoteEvents.length}
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
      onLogTriage={handleLogTriage}
      cprLevel={cprLevel}
      onLogCprCallout={handleLogCprCallout}
      onRegisterAssistance={handleRegisterAssistance}
      onBackToSetup={() => {
        setRunning(false);
        setScreen("caseSetup");
      }}
      onStartTimer={startTimer}
      onActionPress={handleActionPress}
      onRegisterMedication={handleRegisterMedication}
      onFinishCaseToSummary={() => {
        setRunning(false);
        if (sessionId && sessionDoc?.createdByUid === auth.currentUser?.uid) {
          setSessionFinished(sessionId).catch((error) =>
            console.warn("setSessionFinished:", error),
          );
        }
        setScreen("summary");
      }}
    />
  );
}
