#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const args = new Set(process.argv.slice(2));
const skipNetwork = args.has("--skip-network");
const allowPlaceholders = args.has("--allow-placeholders");

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  if (!existsSync(filePath)) return {};
  const values = {};
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    )
      value = value.slice(1, -1);
    values[key] = value;
  }
  return values;
}

const fileEnv = loadEnvFile(".env.local");
const get = (key) => process.env[key] ?? fileEnv[key] ?? "";
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
];
const placeholders = [/example\./i, /your[-_]/i, /changeme/i, /replace[-_]/i, /<.+>/];
const failures = [];
const warnings = [];

for (const key of required) {
  const value = get(key);
  if (!value) failures.push(`${key} is missing`);
  else if (!allowPlaceholders && placeholders.some((pattern) => pattern.test(value)))
    failures.push(`${key} still contains a placeholder`);
}

const supabaseUrl = get("NEXT_PUBLIC_SUPABASE_URL");
let parsedSupabaseUrl;
if (supabaseUrl) {
  try {
    parsedSupabaseUrl = new URL(supabaseUrl);
    if (!/^https?:$/.test(parsedSupabaseUrl.protocol))
      failures.push("NEXT_PUBLIC_SUPABASE_URL must use http or https");
    if (parsedSupabaseUrl.hostname.endsWith("supabase.co"))
      failures.push(
        "Supabase Cloud endpoint is forbidden for the Russian production contour",
      );
  } catch {
    failures.push("NEXT_PUBLIC_SUPABASE_URL is not a valid URL");
  }
}

const appUrl = get("NEXT_PUBLIC_APP_URL");
if (appUrl) {
  try {
    new URL(appUrl);
  } catch {
    failures.push("NEXT_PUBLIC_APP_URL is not a valid URL");
  }
}

for (const key of ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]) {
  if (!get(key))
    warnings.push(`${key} is not configured — live media remains in placeholder mode`);
}
if (get("PAYMENT_PROVIDER") && get("PAYMENT_PROVIDER") !== "stub") {
  warnings.push(
    "PAYMENT_PROVIDER is not stub — verify legal, age and payment readiness separately",
  );
}

function report() {
  if (failures.length > 0) {
    console.error("Self-hosted preflight failed:");
    for (const failure of failures) console.error(`  - ${failure}`);
  } else {
    console.log("Configuration preflight passed.");
  }
  if (warnings.length > 0) {
    console.log("Warnings:");
    for (const warning of warnings) console.log(`  - ${warning}`);
  }
}

report();
if (failures.length > 0) {
  process.exitCode = 1;
  process.exit();
}

if (skipNetwork) {
  console.log("Network probes skipped by --skip-network.");
  process.exit();
}

const publishableKey = get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
async function probe(label, url, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log(`✓ ${label}`);
  } catch (error) {
    failures.push(
      `${label}: ${error instanceof Error ? error.message : "request failed"}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

const base = parsedSupabaseUrl.toString().replace(/\/$/, "");
await probe("Supabase Auth health", `${base}/auth/v1/health`, {
  apikey: publishableKey,
});
await probe("public cities read", `${base}/rest/v1/cities?select=id,name&limit=1`, {
  apikey: publishableKey,
  Authorization: `Bearer ${publishableKey}`,
});

if (failures.length > 0) {
  console.error("Network preflight failed:");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exitCode = 1;
} else {
  console.log("Self-hosted network preflight passed. No personal data was requested.");
}
