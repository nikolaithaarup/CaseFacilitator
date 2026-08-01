import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { Buffer } from "node:buffer";
import crypto from "node:crypto";

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

export async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing server environment variable ${name}`);
  return value;
}

export function admin() {
  if (!getApps().length) {
    const raw = required("FIREBASE_SERVICE_ACCOUNT_JSON");
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
  return { auth: getAuth(), db: getFirestore() };
}

const cookieName =
  process.env.PRODUCT_SESSION_COOKIE_NAME || "synapse_product_session";
const maxAge = 300;
function secret() {
  return required("PRODUCT_SESSION_SECRET");
}
function sign(encoded) {
  return crypto
    .createHmac("sha256", secret())
    .update(encoded)
    .digest("base64url");
}
export function encodeSession(value) {
  const encoded = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}
export function decodeSession(req) {
  const cookies = Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        const i = v.indexOf("=");
        return i < 0 ? [v, ""] : [v.slice(0, i), v.slice(i + 1)];
      }),
  );
  const token = cookies[cookieName];
  if (!token) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;
  const expected = sign(encoded);
  const a = Buffer.from(sig),
    b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (
    !value?.session?.leaseExpiresAt ||
    Date.parse(value.session.leaseExpiresAt) <= Date.now()
  )
    return null;
  return value;
}
export function setSessionCookie(res, value) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=${encodeSession(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`,
  );
}
export function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  );
}
export function stableUid(prefix, entitlement) {
  const digest = crypto
    .createHash("sha256")
    .update(
      `${entitlement.organisationId}:${entitlement.trainingSessionId}:${entitlement.subjectType}:${entitlement.subjectId}`,
    )
    .digest("hex")
    .slice(0, 40);
  return `${prefix}_${digest}`;
}
export function binding(entitlement) {
  return crypto
    .createHmac("sha256", secret())
    .update(
      `${entitlement.launchId}:${entitlement.organisationId}:${entitlement.trainingSessionId}:${entitlement.subjectId}:${entitlement.revocationVersion}`,
    )
    .digest("hex");
}
export async function redeemWithPortal({
  code,
  state,
  audience,
  redirectUri,
  modulePath,
  secretName,
}) {
  const portal = (
    process.env.SYNAPSE_PORTAL_INTERNAL_URL ||
    process.env.SYNAPSE_PORTAL_URL ||
    "https://portal.synapsestudio.dk"
  ).replace(/\/$/, "");
  const response = await fetch(`${portal}${modulePath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${required(secretName)}`,
    },
    body: JSON.stringify({ code, state, audience, redirectUri }),
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const e = new Error("Portal redemption denied");
    e.status = response.status;
    throw e;
  }
  return body;
}
export { Timestamp };
