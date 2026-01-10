/**
 * seed_cases_v3_hlr.js
 * Usage:
 *   node seed.js ./serviceAccountKey.json ./cases_v3_hlr.json
 *
 * Notes:
 * - Writes to collection: cases_v3
 * - Uses scenario.id as Firestore document id
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const COLLECTION = "cases_v3";

function readJson(filePath) {
  const abs = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(abs, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const [, , serviceAccountPath, casesPath] = process.argv;

  if (!serviceAccountPath || !casesPath) {
    console.error("Missing args.\nUsage: node seed.js ./serviceAccountKey.json ./cases_v3_hlr.json");
    process.exit(1);
  }

  const serviceAccount = readJson(serviceAccountPath);
  const cases = readJson(casesPath);

  if (!Array.isArray(cases) || cases.length === 0) {
    throw new Error("Cases JSON must be a non-empty array.");
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  // Basic sanity checks to avoid corrupt uploads
  for (const c of cases) {
    if (!c || typeof c !== "object") throw new Error("Invalid case object in array.");
    if (!c.id || typeof c.id !== "string") throw new Error("Each case must have string id.");
    if (!c.title || typeof c.title !== "string") throw new Error(`Case ${c.id} missing title.`);
    if (!c.initialStateId || typeof c.initialStateId !== "string") throw new Error(`Case ${c.id} missing initialStateId.`);
    if (!Array.isArray(c.states) || c.states.length === 0) throw new Error(`Case ${c.id} missing states array.`);
    if (!Array.isArray(c.transitions)) c.transitions = [];
  }

  // Batch write (500 limit per batch — we're only doing ~10)
  const batch = db.batch();

  cases.forEach((scenario) => {
    const ref = db.collection(COLLECTION).doc(String(scenario.id));

    // Optional: ensure category is present so your categoryForScenario works immediately
    if (!scenario.category) scenario.category = "HLR";

    batch.set(ref, scenario, { merge: true });
  });

  await batch.commit();

  console.log(`✅ Seed complete: ${cases.length} cases written to ${COLLECTION}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
