// src/services/users.ts
import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";

export type UserRole = "student" | "facilitator" | "admin" | "defib_device";

export type UserProfile = {
  uid: string;
  displayName: string;
  role: UserRole;
  orgId: string;
  createdAt?: any;
  updatedAt?: any;
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function upsertUserProfile(input: {
  uid: string;
  displayName: string;
  role: UserRole;
  orgId: string;
}): Promise<void> {
  const ref = doc(db, "users", input.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      uid: input.uid,
      displayName: input.displayName.trim(),
      role: input.role,
      orgId: input.orgId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    } satisfies UserProfile);
    return;
  }

  await updateDoc(ref, {
    displayName: input.displayName.trim(),
    role: input.role,
    orgId: input.orgId,
    updatedAt: serverTimestamp(),
  });
}

export function requireAuthUser(user: User | null): asserts user is User {
  if (!user) throw new Error("Not authenticated");
}
