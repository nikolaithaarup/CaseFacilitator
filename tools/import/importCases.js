// tools/import/importCases.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

console.log("Importer starting...");

admin.initializeApp({
  credential: admin.credential.cert(require("./serviceAccountKey.json")),
});

const db = admin.firestore();

async function run() {
  const casesPath = path.join(__dirname, "cases.json");
  const raw = fs.readFileSync(casesPath, "utf8");
  const casesArr = JSON.parse(raw);

  if (!Array.isArray(casesArr)) {
    throw new Error("cases.json must be an array of CaseScenario objects");
  }

  console.log("Loaded cases:", casesArr.length);

  let batch = db.batch();
  let n = 0;

  for (const c of casesArr) {
    if (!c || typeof c !== "object") throw new Error("Invalid case entry");
    if (!c.id || typeof c.id !== "string") throw new Error("Case missing string id");

    const ref = db.collection("cases").doc(c.id);
    batch.set(ref, c, { merge: true });
    n++;

    // Firestore batch limit is 500 ops; stay under it
    if (n % 450 === 0) {
      await batch.commit();
      console.log("Committed:", n);
      batch = db.batch();
    }
  }

  await batch.commit();
  console.log("Done. Uploaded:", n);
}

run()
  .then(() => console.log("Importer finished."))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
