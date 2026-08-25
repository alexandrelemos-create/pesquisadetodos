import Database from "better-sqlite3"
import path from "node:path"
import fs from "node:fs"

const DATA_DIR = path.join(process.cwd(), "data")
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, "micropesquisa.db")

declare global {
  var __mpDb: Database.Database | undefined
}

function createConnection() {
  const db = new Database(DB_PATH)
  db.pragma("journal_mode = WAL")
  db.pragma("foreign_keys = ON")
  return db
}

export const db = globalThis.__mpDb ?? createConnection()

if (process.env.NODE_ENV !== "production") {
  globalThis.__mpDb = db
}

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      headline TEXT NOT NULL DEFAULT '',
      estimated_seconds INTEGER NOT NULL DEFAULT 30,
      triggers TEXT NOT NULL DEFAULT '[]',
      frequency_rule TEXT NOT NULL DEFAULT '{"maxDisplays":1,"periodDays":30}',
      completion_outcome TEXT NOT NULL DEFAULT '{"type":"message","message":"Obrigado pela sua resposta!"}',
      webhook_url TEXT,
      webhook_enabled INTEGER NOT NULL DEFAULT 0,
      webhook_events TEXT NOT NULL DEFAULT '["response_completed"]',
      primary_color TEXT NOT NULL DEFAULT '#171717',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      "order" INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      required INTEGER NOT NULL DEFAULT 1,
      config TEXT NOT NULL DEFAULT '{}',
      skip_rules TEXT NOT NULL DEFAULT '[]',
      default_outcome TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_questions_campaign ON questions(campaign_id);

    CREATE TABLE IF NOT EXISTS response_sessions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      visitor_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_progress',
      started_at TEXT NOT NULL,
      completed_at TEXT,
      outcome TEXT,
      page_url TEXT,
      referrer TEXT,
      user_agent TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_campaign ON response_sessions(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON response_sessions(visitor_id, campaign_id);

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES response_sessions(id) ON DELETE CASCADE,
      question_id TEXT NOT NULL,
      value TEXT NOT NULL,
      answered_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_answers_session ON answers(session_id);

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      event TEXT NOT NULL,
      url TEXT NOT NULL,
      status_code INTEGER,
      success INTEGER NOT NULL DEFAULT 0,
      request_body TEXT NOT NULL,
      response_body TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_campaign ON webhook_deliveries(campaign_id);

    CREATE TABLE IF NOT EXISTS visitor_impressions (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      shown_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_impressions_visitor ON visitor_impressions(campaign_id, visitor_id);
  `)
}

migrate()
