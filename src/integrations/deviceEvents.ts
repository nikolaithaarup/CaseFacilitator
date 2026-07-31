export const DEVICE_EVENT_SCHEMA_VERSION = 1 as const;

export type FacilitatorDefibEventType =
  | "DEFIB_NIBP"
  | "DEFIB_SAT"
  | "DEFIB_ETCO2"
  | "DEFIB_BS"
  | "DEFIB_TEMP"
  | "DEFIB_EKG4"
  | "DEFIB_EKG12"
  | "DEFIB_CHARGE"
  | "DEFIB_SHOCK"
  | "DEFIB_ANALYZE"
  | "DEFIB_RHYTHM_CALLOUT"
  | "DEFIB_ROSC"
  | "DEFIB_STRIP_SHARED";

export type CanonicalObservationValues = {
  heartRateBpm: number | null;
  systolicMmHg: number | null;
  diastolicMmHg: number | null;
  spo2Percent: number | null;
  respiratoryRatePerMin: number | null;
  etco2Kpa: number | null;
  temperatureCelsius: number | null;
  bloodGlucoseMmolL: number | null;
  rhythmSummary: string;
};

export type CanonicalDeviceEvent = {
  schemaVersion: typeof DEVICE_EVENT_SCHEMA_VERSION;
  fictional: true;
  eventId: string;
  idempotencyKey: string;
  sessionId: string;
  sourceSystem: "SYNAPSE_FACILITATOR";
  sourceDeviceId: string;
  sourceType: "SIMULATED_DEVICE";
  eventType: FacilitatorDefibEventType;
  observationKind: "VITAL_SET" | "ECG_12_LEAD_ACQUIRED" | "DEVICE_ACTION";
  measuredAtEpochMs: number;
  generatedAtEpochMs: number;
  values: CanonicalObservationValues;
  rawPayload: Record<string, unknown>;
};

function finiteOrNull(value: unknown): number | null {
  const candidate = typeof value === "number" ? value : Number(value);
  return Number.isFinite(candidate) ? candidate : null;
}

function textOrEmpty(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

function stableEventId(sessionId: string, type: string, measuredAtEpochMs: number): string {
  const safeSession = sessionId.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 64);
  return `device-${safeSession}-${type.toLowerCase()}-${Math.max(0, Math.round(measuredAtEpochMs))}`;
}

export function buildCanonicalDeviceEvent(params: {
  sessionId: string;
  type: FacilitatorDefibEventType;
  payload: Record<string, unknown>;
  measuredAtEpochMs: number;
  generatedAtEpochMs?: number;
  sourceDeviceId?: string;
}): CanonicalDeviceEvent {
  const { sessionId, type, payload, measuredAtEpochMs } = params;
  const eventId = stableEventId(sessionId, type, measuredAtEpochMs);
  const rhythm = textOrEmpty(payload.ekgKey ?? payload.rhythmKey);

  const values: CanonicalObservationValues = {
    heartRateBpm: type === "DEFIB_SAT" ? finiteOrNull(payload.hr) : null,
    systolicMmHg: type === "DEFIB_NIBP" ? finiteOrNull(payload.btSys) : null,
    diastolicMmHg: type === "DEFIB_NIBP" ? finiteOrNull(payload.btDia) : null,
    spo2Percent: type === "DEFIB_SAT" ? finiteOrNull(payload.spo2) : null,
    respiratoryRatePerMin: null,
    etco2Kpa: type === "DEFIB_ETCO2" ? finiteOrNull(payload.etco2) : null,
    temperatureCelsius: type === "DEFIB_TEMP" ? finiteOrNull(payload.temp) : null,
    bloodGlucoseMmolL: type === "DEFIB_BS" ? finiteOrNull(payload.bs) : null,
    rhythmSummary: rhythm,
  };

  const observationKind =
    type === "DEFIB_EKG12"
      ? "ECG_12_LEAD_ACQUIRED"
      : ["DEFIB_NIBP", "DEFIB_SAT", "DEFIB_ETCO2", "DEFIB_BS", "DEFIB_TEMP"].includes(type)
        ? "VITAL_SET"
        : "DEVICE_ACTION";

  return {
    schemaVersion: DEVICE_EVENT_SCHEMA_VERSION,
    fictional: true,
    eventId,
    idempotencyKey: eventId,
    sessionId,
    sourceSystem: "SYNAPSE_FACILITATOR",
    sourceDeviceId: params.sourceDeviceId?.trim() || "facilitator-defib-1",
    sourceType: "SIMULATED_DEVICE",
    eventType: type,
    observationKind,
    measuredAtEpochMs,
    generatedAtEpochMs: params.generatedAtEpochMs ?? Date.now(),
    values,
    rawPayload: payload,
  };
}
