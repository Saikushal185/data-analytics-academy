// SQLite connection + schema. better-sqlite3 is synchronous and file-based.
// DB location is configurable via DATA_DIR so a deployed persistent disk works.
import Database from 'better-sqlite3'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || __dirname
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const db = new Database(join(dataDir, 'data.db'))
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Gamification: XP ledger (levels derived from the running total).
  CREATE TABLE IF NOT EXISTS xp_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    item_id TEXT,
    amount INTEGER NOT NULL,
    ts TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_events(user_id);

  CREATE TABLE IF NOT EXISTS badges (
    user_id INTEGER NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Quiz attempts power scoring + weak-area detection.
  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    topic_id TEXT,
    correct INTEGER NOT NULL,
    ts TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id);

  -- Spaced repetition (SM-2) review cards.
  CREATE TABLE IF NOT EXISTS reviews (
    user_id INTEGER NOT NULL,
    card_id TEXT NOT NULL,
    ease REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    due_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_reviewed TEXT,
    PRIMARY KEY (user_id, card_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- One row per active day (for streaks + heatmap), server-side & cross-device.
  CREATE TABLE IF NOT EXISTS activity (
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, day),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Assessment placement per track.
  CREATE TABLE IF NOT EXISTS skills (
    user_id INTEGER NOT NULL,
    track_id TEXT NOT NULL,
    level TEXT NOT NULL,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_prefs (
    user_id INTEGER PRIMARY KEY,
    display_name TEXT,
    daily_goal INTEGER NOT NULL DEFAULT 3,
    theme TEXT NOT NULL DEFAULT 'system',
    onboarded INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reset_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    track_id TEXT NOT NULL,
    issued_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS custom_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    quiz_questions TEXT,
    challenges TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS custom_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    lessons TEXT,
    srs_cards TEXT,
    FOREIGN KEY (track_id) REFERENCES custom_tracks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`)

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all()
  if (!columns.some((col) => col.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

// Older local databases used `subtopics` for generated module lesson content.
// CREATE TABLE IF NOT EXISTS does not evolve those tables, so keep startup
// migrations here for existing installs and persistent deployed disks.
ensureColumn('custom_modules', 'lessons', 'TEXT')
ensureColumn('custom_modules', 'srs_cards', 'TEXT')

const customModuleColumns = db.prepare('PRAGMA table_info(custom_modules)').all()
const hasLegacySubtopics = customModuleColumns.some((col) => col.name === 'subtopics')
if (hasLegacySubtopics) {
  db.prepare(`
    UPDATE custom_modules
    SET lessons = subtopics
    WHERE (lessons IS NULL OR lessons = '') AND subtopics IS NOT NULL AND subtopics != ''
  `).run()
}

// Ensure every user has a prefs row.
export function ensurePrefs(userId) {
  db.prepare('INSERT OR IGNORE INTO user_prefs (user_id) VALUES (?)').run(userId)
}

export default db
