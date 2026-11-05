import { readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const DB_DIR = join(process.cwd(), "db");
const DB_PATH = join(DB_DIR, "restaurant.sqlite");
const MIGRATIONS_DIR = join(DB_DIR, "migrations");
const SEED_TABLES = ["businesses", "categories", "distributors", "invoices", "purchases"];

if (process.argv.includes("--reset")) {
  for (const suffix of ["", "-journal", "-wal", "-shm"]) {
    rmSync(DB_PATH + suffix, { force: true });
  }
  console.log("Deleted the database");
}

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const applied = new Set(
  db.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version),
);
let needsSeed = applied.size === 0;

const files = readdirSync(MIGRATIONS_DIR).filter((file) => file.endsWith(".sql")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  db.exec("BEGIN");
  try {
    db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    db.prepare("INSERT INTO schema_migrations (version) VALUES (?)").run(file);
    console.log(`Applied ${file}`);
    if (needsSeed) {
      loadSeed();
      needsSeed = false;
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

db.close();

// Runs right after the first migration, so later migrations see the same rows on every database.
function loadSeed() {
  const seed = JSON.parse(readFileSync(join(DB_DIR, "seed.json"), "utf8"));
  for (const table of SEED_TABLES) {
    for (const row of seed[table]) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => "?").join(", ");
      db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`).run(
        ...columns.map((column) => row[column]),
      );
    }
  }
  console.log("Loaded the seed");
}
