/**
 * seed_cases_v3_trauma.js
 *
 * Seeds TRAUMA cases into Firestore collection: cases_v3
 *
 * Usage:
 *   node data/seed_cases_v3_trauma.js <serviceAccountKey.json> <cases_v3_trauma.json>
 *
 * Example (PowerShell):
 *   node data\seed_cases_v3_trauma.js "C:\Users\nikol\Code\Firebase\casefacilitator-admin.json" data\cases_v3_trauma.json
 *
 * Optional:
 *   Add a 3rd arg "WIPE" to delete existing docs in the collection first:
 *     node data\seed_cases_v3_trauma.js "<key>" "<json>" WIPE
 *
 * Requirements:
 *   npm i firebase-admin
 */

const admin = require("firebase-admin");
const fs = require("fs");

const [, , serviceAccountPath, casesPath, wipeArg] = process.argv;

const COLLECTION = "cases_v3";
const WIPE = String(wipeArg || "").toUpperCase() === "WIPE";

function usageAndExit() {
  console.log("Usage:");
  console.log("  node data/seed_cases_v3_trauma.js <serviceAccountKey.json> <cases.json> [WIPE]");
  console.log("");
  console.log("Example:");
  console.log('  node data\\seed_cases_v3_trauma.js "C:\\Users\\nikol\\Code\\Firebase\\casefacilitator-admin.json" data\\cases_v3_trauma.json');
  console.log("");
  console.log("Optional WIPE:");
  console.log('  node data\\seed_cases_v3_trauma.js "<key>" "<json>" WIPE');
  process.exit(1);
}

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
  if (!Array.isArray(c.states) || c.states.length < 2) throw new Error(`Case ${c.id} must have states[] (min 2)`);
  if (!Array.isArray(c.transitions)) throw new Error(`Case ${c.id} must have transitions[]`);
  return true;
}

async function deleteCollection(db, collectionPath, batchSize = 400) {
  const colRef = db.collection(collectionPath);

  while (true) {
    const snap = await colRef.limit(batchSize).get();
    if (snap.empty) break;

    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();

    console.log(`Deleted ${snap.size} docs from ${collectionPath}...`);
  }
}

async function seed() {
  if (!serviceAccountPath || !casesPath) usageAndExit();
  if (!fs.existsSync(serviceAccountPath)) throw new Error(`Service account key not found: ${serviceAccountPath}`);
  if (!fs.existsSync(casesPath)) throw new Error(`Cases JSON not found: ${casesPath}`);

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const db = admin.firestore();

  const casesRaw = fs.readFileSync(casesPath, "utf8");
  const cases = JSON.parse(casesRaw);

  if (!Array.isArray(cases)) throw new Error("JSON must be an array of cases.");

  cases.forEach(validateCase);

  console.log(`Loaded ${cases.length} cases from ${casesPath}`);
  console.log(`Target collection: ${COLLECTION}`);
  console.log(`Mode: TRAUMA`);
  if (WIPE) console.log("WIPE enabled: will delete all existing docs in target collection first.");

  if (WIPE) {
    await deleteCollection(db, COLLECTION);
    console.log("Wipe complete.");
  }

  // Batched writes: 500 ops per batch limit (keep margin)
  const batches = chunk(cases, 450);

  for (let bi = 0; bi < batches.length; bi++) {
    const batch = db.batch();
    const part = batches[bi];

    for (const c of part) {
      const ref = db.collection(COLLECTION).doc(String(c.id));
      batch.set(
        ref,
        {
          ...c,
          category: c.category || "TRAUMA",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    console.log(`Committed batch ${bi + 1}/${batches.length} (${part.length} cases)`);
  }

  console.log(`✅ Seed complete: ${cases.length} cases written to ${COLLECTION}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
