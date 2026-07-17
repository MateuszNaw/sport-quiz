/**
 * Seed curated questions from src/data/questions/*.json into MongoDB.
 *
 * Usage: node --env-file=.env.local scripts/seed-mongodb.mjs
 */
import { createHash } from "crypto";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const QUESTIONS_DIR = path.join(ROOT, "src", "data", "questions");

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI. Run with: node --env-file=.env.local scripts/seed-mongodb.mjs");
  process.exit(1);
}

function excludeKey(q) {
  switch (q.quizType) {
    case "multiple-choice":
    case "timeline":
      return String(q.prompt || "").toLowerCase();
    case "true-false":
      return String(q.statement || "").toLowerCase();
    case "guess-score":
      return String(q.fixture || "").toLowerCase();
    case "guess-player":
      return String(q.answer || "").toLowerCase();
    default:
      return JSON.stringify(q).toLowerCase();
  }
}

function docId(sport, difficulty, key) {
  return createHash("sha256").update(`${sport}|${difficulty}|${key}`).digest("hex").slice(0, 24);
}

async function main() {
  const files = (await readdir(QUESTIONS_DIR)).filter((f) => f.endsWith(".json"));
  const docs = [];

  for (const file of files) {
    const match = file.match(/^([a-z0-9]+)-(easy|medium|hard)\.json$/i);
    if (!match) {
      console.warn(`Skipping unexpected file: ${file}`);
      continue;
    }
    const sport = match[1].toLowerCase();
    const difficulty = match[2].toLowerCase();
    const raw = JSON.parse(await readFile(path.join(QUESTIONS_DIR, file), "utf-8"));
    if (!Array.isArray(raw)) {
      console.warn(`Skipping non-array file: ${file}`);
      continue;
    }

    for (const entry of raw) {
      const key = excludeKey(entry);
      const body = { ...entry, sport, difficulty };
      docs.push({
        _id: docId(sport, difficulty, key),
        sport,
        difficulty,
        quizType: entry.quizType,
        excludeKey: key,
        body,
      });
    }
    console.log(`  ${file}: ${raw.length} questions`);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "sportiq");
  const col = db.collection("questions");

  // Idempotent upsert so re-running the seed is safe.
  let upserted = 0;
  const BATCH = 200;
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const ops = slice.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true,
      },
    }));
    const result = await col.bulkWrite(ops, { ordered: false });
    upserted += (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.matchedCount || 0);
  }

  await col.createIndex({ sport: 1, difficulty: 1, quizType: 1 });
  await col.createIndex({ sport: 1, excludeKey: 1 });

  const total = await col.countDocuments();
  console.log(`\nSeeded ${docs.length} question docs (${upserted} write ops). Collection size: ${total}`);

  await db.collection("leagues").createIndex({ members: 1 });
  console.log("Indexes ready on questions and leagues.");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
