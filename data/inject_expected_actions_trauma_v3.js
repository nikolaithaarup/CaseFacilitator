/**
 * data/inject_expected_actions_trauma_v3.js
 *
 * Adds/overwrites expectedActions on each case in cases_v3_trauma.json
 * based on a mapping.
 *
 * Usage:
 *   node data/inject_expected_actions_trauma_v3.js data/cases_v3_trauma.json
 */

const fs = require("fs");
const path = require("path");

// Load mapping (supports both CommonJS module.exports and accidental ESM default export)
const rawMapModule = require("./expected_actions_trauma_v3_map");
const map = rawMapModule?.default ?? rawMapModule ?? {};

function normalizeId(value) {
  return String(value ?? "")
    .trim()
    .replace(/^"+|"+$/g, ""); // strips accidental quotes
}

const [, , casesPathArg] = process.argv;

if (!casesPathArg) {
  console.error(
    "Missing path to cases json.\nUsage: node data/inject_expected_actions_trauma_v3.js data/cases_v3_trauma.json"
  );
  process.exit(1);
}

const casesPath = path.resolve(process.cwd(), casesPathArg);

if (!fs.existsSync(casesPath)) {
  console.error("File not found:", casesPath);
  process.exit(1);
}

let cases;
try {
  cases = JSON.parse(fs.readFileSync(casesPath, "utf8"));
} catch (e) {
  console.error("Invalid JSON:", e.message);
  process.exit(1);
}

if (!Array.isArray(cases)) {
  console.error("Expected top-level JSON array of cases.");
  process.exit(1);
}

const mapKeys = Object.keys(map).map(normalizeId);
const mapKeySet = new Set(mapKeys);

console.log(`Loaded expected-actions map with ${mapKeys.length} keys.`);

let injected = 0;
let missing = 0;

const missingIds = [];

for (const c of cases) {
  const id = normalizeId(c?.id);
  const expected = map[id] ?? map[normalizeId(id)] ?? null;

  if (expected) {
    c.expectedActions = expected;
    injected++;
  } else {
    missing++;
    missingIds.push(id);
  }
}

fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2), "utf8");

console.log(`Done. Injected expectedActions into ${injected} cases.`);
console.log(`No mapping found for ${missing} cases (left unchanged).`);

// Show useful debugging samples
console.log("\nSample case IDs from JSON:");
console.log(missingIds.slice(0, 8).map((x) => `- ${x}`).join("\n") || "(none)");

console.log("\nSample keys from map:");
console.log(mapKeys.slice(0, 8).map((x) => `- ${x}`).join("\n") || "(none)");

if (mapKeys.length && missingIds.length) {
  // Quick hint if prefixes look different
  const casePrefix = (missingIds[0] || "").split("_").slice(0, 3).join("_");
  const mapPrefix = (mapKeys[0] || "").split("_").slice(0, 3).join("_");
  if (casePrefix && mapPrefix && casePrefix !== mapPrefix) {
    console.log(
      `\n⚠️ Prefix mismatch hint: cases look like "${casePrefix}..." but map looks like "${mapPrefix}..."`
    );
  }
}

console.log(`\nUpdated file: ${casesPath}`);
