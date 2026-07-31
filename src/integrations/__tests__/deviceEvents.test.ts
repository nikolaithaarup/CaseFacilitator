import { buildCanonicalDeviceEvent } from "../deviceEvents";

describe("canonical defibrillator events", () => {
  test("maps saturation and pulse into a PPJ-compatible vital set", () => {
    const event = buildCanonicalDeviceEvent({
      sessionId: "session-1",
      type: "DEFIB_SAT",
      payload: { spo2: 96, hr: 82 },
      measuredAtEpochMs: 1234,
      generatedAtEpochMs: 1250,
    });

    expect(event.observationKind).toBe("VITAL_SET");
    expect(event.values.spo2Percent).toBe(96);
    expect(event.values.heartRateBpm).toBe(82);
    expect(event.sourceType).toBe("SIMULATED_DEVICE");
    expect(event.idempotencyKey).toBe(event.eventId);
  });

  test("maps NIBP without inventing unrelated measurements", () => {
    const event = buildCanonicalDeviceEvent({
      sessionId: "session-1",
      type: "DEFIB_NIBP",
      payload: { btSys: 128, btDia: 76 },
      measuredAtEpochMs: 2000,
    });

    expect(event.values.systolicMmHg).toBe(128);
    expect(event.values.diastolicMmHg).toBe(76);
    expect(event.values.spo2Percent).toBeNull();
  });

  test("marks a 12-lead acquisition as its own observation kind", () => {
    const event = buildCanonicalDeviceEvent({
      sessionId: "session-1",
      type: "DEFIB_EKG12",
      payload: { ekgKey: "INFERIOR_STEMI" },
      measuredAtEpochMs: 3000,
    });

    expect(event.observationKind).toBe("ECG_12_LEAD_ACQUIRED");
    expect(event.values.rhythmSummary).toBe("INFERIOR_STEMI");
  });
});
