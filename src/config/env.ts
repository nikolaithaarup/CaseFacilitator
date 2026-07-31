export type PublicEnvironment = {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  useFirebaseEmulators: boolean;
  emulatorProjectId: string;
  access: {
    allowStandalone: boolean;
    portalUrl: string;
    launchAudience: string;
    backendBaseUrl?: string;
  };
};

function required(name: string, value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) {
    throw new Error(
      `Mangler miljøvariablen ${name}. Kopiér .env.example til .env.local og udfyld Firebase-webkonfigurationen.`,
    );
  }
  return normalized;
}

function exactBoolean(name: string, value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new Error(`${name} skal være enten true eller false.`);
}

function normalizedUrl(name: string, value: string | undefined, fallback: string): string {
  const normalized = value?.trim() || fallback;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${name} skal være en gyldig absolut URL.`);
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error(`${name} skal bruge HTTPS uden for localhost.`);
  }
  return parsed.toString().replace(/\/$/, "");
}

const useFirebaseEmulators = exactBoolean(
  "EXPO_PUBLIC_USE_FIREBASE_EMULATORS",
  process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS,
);

const access = {
  allowStandalone: exactBoolean(
    "EXPO_PUBLIC_FACILITATOR_ALLOW_STANDALONE",
    process.env.EXPO_PUBLIC_FACILITATOR_ALLOW_STANDALONE,
  ),
  portalUrl: normalizedUrl(
    "EXPO_PUBLIC_SYNAPSE_PORTAL_URL",
    process.env.EXPO_PUBLIC_SYNAPSE_PORTAL_URL,
    "https://portal.synapsestudio.dk",
  ),
  launchAudience:
    process.env.EXPO_PUBLIC_FACILITATOR_LAUNCH_AUDIENCE?.trim() ||
    "synapse-facilitator-v1",
  backendBaseUrl: process.env.EXPO_PUBLIC_FACILITATOR_BACKEND_BASE_URL?.trim()
    ? normalizedUrl(
        "EXPO_PUBLIC_FACILITATOR_BACKEND_BASE_URL",
        process.env.EXPO_PUBLIC_FACILITATOR_BACKEND_BASE_URL,
        "https://localhost",
      )
    : undefined,
};

export const publicEnvironment: PublicEnvironment = useFirebaseEmulators
  ? {
      firebase: {
        apiKey: "demo-api-key",
        authDomain: "127.0.0.1",
        projectId:
          process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_PROJECT_ID?.trim() ||
          "demo-synapse-facilitator",
        storageBucket: "demo-synapse-facilitator.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:demo",
      },
      useFirebaseEmulators: true,
      emulatorProjectId:
        process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_PROJECT_ID?.trim() ||
        "demo-synapse-facilitator",
      access,
    }
  : {
      firebase: {
        apiKey: required(
          "EXPO_PUBLIC_FIREBASE_API_KEY",
          process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        ),
        authDomain: required(
          "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
          process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        ),
        projectId: required(
          "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
          process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
        ),
        storageBucket: required(
          "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
          process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        ),
        messagingSenderId: required(
          "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
          process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        ),
        appId: required(
          "EXPO_PUBLIC_FIREBASE_APP_ID",
          process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
        ),
        measurementId:
          process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
      },
      useFirebaseEmulators: false,
      emulatorProjectId: "demo-synapse-facilitator",
      access,
    };
