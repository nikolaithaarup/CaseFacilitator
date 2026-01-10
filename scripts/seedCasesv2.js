const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./serviceAccountKey.json"); 
// put this file next to the script (DON'T commit it)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function run() {
  const jsonPath = path.join(__dirname, "..", "data", "cases_v2_seed_20.json");
  const cases = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  const batchSize = 400;
  let batch = db.batch();
  let count = 0;

  for (const c of cases) {
    const ref = db.collection("cases_v2").doc(c.id);
    batch.set(ref, c, { merge: true });
    count++;

    if (count % batchSize === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`Committed ${count} cases...`);
    }
  }

  await batch.commit();
  console.log(`✅ Done. Seeded ${count} cases into cases_v2`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
