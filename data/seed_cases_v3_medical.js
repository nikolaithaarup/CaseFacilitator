/**
 * seed_cases_v3_medical.js
 *
 * Usage:
 *   node seed_cases_v3_medical.js
 *
 * Requirements:
 *   npm i firebase-admin
 *
 * Setup:
 *   1) Put your service account json somewhere safe (DO NOT COMMIT IT)
 *   2) Set GOOGLE_APPLICATION_CREDENTIALS to that file path OR edit KEY_PATH below.
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Option A: env var GOOGLE_APPLICATION_CREDENTIALS
// Option B: hardcode key path (not recommended for repos)
const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, "serviceAccountKey.json");

const COLLECTION = "cases_v3";
const JSON_PATH = path.join(__dirname, "cases_v3_medical.json");

// ---------- Init ----------
if (!admin.apps.length) {
  const serviceAccount = require(KEY_PATH);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ---------- Helpers ----------
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function validateCase(c) {
  const requiredTop = ["id", "title", "dispatchText", "patientInfo", "initialStateId", "states", "transitions"];
  for (const k of requiredTop) {
    if (c[k] === undefined || c[k] === null) throw new Error(`Case ${c.id || "UNKNOWN"} missing field: ${k}`);
  }
  if (!Array.isArray(c.states) || c.states.length < 2) throw new Error(`Case ${c.id} must have states[]`);
  if (!Array.isArray(c.transitions)) throw new Error(`Case ${c.id} must have transitions[]`);
  return true;
}

async function seed() {
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const cases = JSON.parse(raw);

  if (!Array.isArray(cases)) throw new Error("JSON must be an array of cases.");

  // validate
  cases.forEach(validateCase);

  console.log(`Loaded ${cases.length} cases from ${JSON_PATH}`);

  // Batched writes: 500 ops per batch limit
  const batches = chunk(cases, 450);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = db.batch();
    const part = batches[bi];

    for (const c of part) {
      const ref = db.collection(COLLECTION).doc(String(c.id));
      batch.set(ref, {
        ...c,
        category: c.category || "MEDICAL",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    await batch.commit();
    console.log(`Committed batch ${bi + 1}/${batches.length} (${part.length} cases)`);
  }

  console.log(`✅ Done. Seeded into collection: ${COLLECTION}`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
