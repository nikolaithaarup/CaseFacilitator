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

const useFirebaseEmulators = process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === "true";

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
    };
