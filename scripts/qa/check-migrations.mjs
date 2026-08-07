#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const migrationPattern = /^(\d{14})_([a-z0-9_]+)\.sql$/;

const names = (await readdir(migrationsDir))
  .filter((name) => name.endsWith(".sql"))
  .sort((a, b) => a.localeCompare(b));

const seenVersions = new Set();
const problems = [];
const migrationNames = [];
for (const name of names) {
  const match = name.match(migrationPattern);
  if (!match) {
    problems.push(`${name}: expected YYYYMMDDHHMMSS_name.sql`);
    continue;
  }
  const [, version] = match;
  if (seenVersions.has(version))
    problems.push(`${name}: duplicate migration version ${version}`);
  seenVersions.add(version);

  const contents = await readFile(path.join(migrationsDir, name), "utf8");
  if (!contents.trim()) problems.push(`${name}: file is empty`);
  migrationNames.push(name);
}

if (!migrationNames.some((name) => name.endsWith("_initial_schema.sql"))) {
  problems.push("initial schema migration is missing");
}

if (problems.length > 0) {
  console.error("Migration preflight failed:");
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exitCode = 1;
} else {
  console.log(`Migration preflight passed: ${migrationNames.length} SQL migrations.`);
  console.log(`First: ${migrationNames[0]}`);
  console.log(`Last:  ${migrationNames.at(-1)}`);
}
