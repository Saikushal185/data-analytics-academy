import pg from 'pg'
const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/daa',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Initialize schema
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, item_id)
  );

  CREATE TABLE IF NOT EXISTS xp_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    source TEXT NOT NULL,
    item_id TEXT,
    amount INTEGER NOT NULL,
    ts TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS badges (
    user_id INTEGER NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, badge_id)
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    topic_id TEXT,
    correct INTEGER NOT NULL,
    ts TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reviews (
    user_id INTEGER NOT NULL,
    card_id TEXT NOT NULL,
    ease REAL NOT NULL DEFAULT 2.5,
    interval_days INTEGER NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    due_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_reviewed TIMESTAMP,
    PRIMARY KEY (user_id, card_id)
  );

  CREATE TABLE IF NOT EXISTS activity (
    user_id INTEGER NOT NULL,
    day TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, day)
  );

  CREATE TABLE IF NOT EXISTS skills (
    user_id INTEGER NOT NULL,
    track_id TEXT NOT NULL,
    level TEXT NOT NULL,
    PRIMARY KEY (user_id, track_id)
  );

  CREATE TABLE IF NOT EXISTS user_prefs (
    user_id INTEGER PRIMARY KEY,
    display_name TEXT,
    daily_goal INTEGER NOT NULL DEFAULT 3,
    theme TEXT NOT NULL DEFAULT 'system',
    onboarded INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reset_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    track_id TEXT NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS custom_tracks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    quiz_questions TEXT,
    challenges TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS custom_modules (
    id SERIAL PRIMARY KEY,
    track_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    subtopics TEXT NOT NULL DEFAULT '[]',
    lessons TEXT,
    srs_cards TEXT
  );

  CREATE TABLE IF NOT EXISTS custom_lessons (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    code_example TEXT DEFAULT '',
    note TEXT DEFAULT '',
    has_code INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS custom_quiz_questions (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS custom_srs_cards (
    id SERIAL PRIMARY KEY,
    module_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    interval INTEGER DEFAULT 1,
    ease_factor REAL DEFAULT 2.5,
    next_review TIMESTAMP DEFAULT NOW()
  );
`).catch(console.error)

export async function ensurePrefs(userId) {
  await pool.query('INSERT INTO user_prefs (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [userId])
}

const db = {
  prepare: (sql) => {
    let count = 0;
    const pgSql = sql.replace(/\?/g, () => '$' + (++count));
    const finalSql = pgSql.replace(/INSERT OR IGNORE/ig, 'INSERT').replace(/ON CONFLICT DO NOTHING/ig, '') + (pgSql.toLowerCase().includes('insert or ignore') ? ' ON CONFLICT DO NOTHING' : '');

    return {
      run: async (...args) => {
        const isInsert = finalSql.trim().toLowerCase().startsWith('insert');
        const querySql = isInsert && !finalSql.toLowerCase().includes('returning ') 
           ? finalSql + ' RETURNING *'
           : finalSql;
        try {
          const res = await pool.query(querySql, args);
          return { lastInsertRowid: res.rows[0]?.id, changes: res.rowCount };
        } catch(e) {
          console.error(e);
          return { lastInsertRowid: null, changes: 0 };
        }
      },
      all: async (...args) => {
        try {
          const res = await pool.query(finalSql, args);
          return res.rows;
        } catch(e) {
          console.error(e);
          return [];
        }
      },
      get: async (...args) => {
        try {
          const res = await pool.query(finalSql, args);
          return res.rows[0];
        } catch(e) {
          console.error(e);
          return null;
        }
      }
    }
  },
  transaction: (fn) => async (...args) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txDb = {
        prepare: (sql) => {
          let count = 0;
          const pgSql = sql.replace(/\?/g, () => '$' + (++count));
          const finalSql = pgSql.replace(/INSERT OR IGNORE/ig, 'INSERT').replace(/ON CONFLICT DO NOTHING/ig, '') + (pgSql.toLowerCase().includes('insert or ignore') ? ' ON CONFLICT DO NOTHING' : '');
          return {
            run: async (...runArgs) => {
              const isInsert = finalSql.trim().toLowerCase().startsWith('insert');
              const querySql = isInsert && !finalSql.toLowerCase().includes('returning ') ? finalSql + ' RETURNING *' : finalSql;
              const res = await client.query(querySql, runArgs);
              return { lastInsertRowid: res.rows[0]?.id, changes: res.rowCount };
            },
            all: async (...allArgs) => {
              const res = await client.query(finalSql, allArgs);
              return res.rows;
            },
            get: async (...getArgs) => {
              const res = await client.query(finalSql, getArgs);
              return res.rows[0];
            }
          }
        }
      };
      
      const result = await fn(txDb, ...args);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export default db
