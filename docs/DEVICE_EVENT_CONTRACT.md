# Canonical simulated device events

`src/integrations/deviceEvents.ts` defines the first stable Facilitator-side device contract.

Every defibrillator interaction is persisted independently of PPJ entitlement. The event contains:

- schema version and fictional marker;
- deterministic event/idempotency key;
- session and simulated device identity;
- source system/type;
- event and observation kind;
- measurement/generation times;
- normalized observation values;
- original payload for backward compatibility.

Current normalized mappings:

- SAT → SpO2 and heart rate;
- NIBP → systolic and diastolic pressure;
- EtCO2 → kPa;
- temperature → Celsius;
- blood glucose → mmol/L;
- 12-lead → ECG acquisition plus rhythm summary.

The final PPJ relay must add PPJ-specific incident/unit/patient context, delivery receipts, retry policy and authorization. Do not make that relay conditional on whether the event was generated; only consumption is entitlement-dependent.
