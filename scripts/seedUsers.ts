import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  role: "student" | "school" | "enterprise" | "admin";
  orgId: string;
};

// -------------------- INIT --------------------
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = admin.auth();
const db = admin.firestore();

// -------------------- HELPERS --------------------
async function upsertAuthUser(u: SeedUser): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(u.email);
    await auth.updateUser(existing.uid, {
      displayName: u.displayName,
      password: u.password,
    });
    return existing.uid;
  } catch (e: any) {
    if (e.code === "auth/user-not-found") {
      const created = await auth.createUser({
        email: u.email,
        password: u.password,
        displayName: u.displayName,
      });
      return created.uid;
    }
    throw e;
  }
}

async function upsertUserDoc(uid: string, u: SeedUser) {
  const ref = db.collection("users").doc(uid);

  await ref.set(
    {
      uid,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      orgId: u.orgId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// -------------------- MAIN --------------------
async function main() {
  const filePath = path.join(process.cwd(), "seed", "users.seed.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const users = JSON.parse(raw) as SeedUser[];

  console.log(`🔧 Seeding ${users.length} users…`);

  for (const u of users) {
    const uid = await upsertAuthUser(u);
    await upsertUserDoc(uid, u);
    console.log(`✅ ${u.email} → ${uid}`);
  }

  console.log("🎉 User seeding complete.");
}

main().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
