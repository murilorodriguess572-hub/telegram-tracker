// db.js
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      client_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      telegram_id TEXT,
      username TEXT,
      first_name TEXT,
      fbclid TEXT,
      days_in_group NUMERIC,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS members (
      id SERIAL PRIMARY KEY,
      client_id TEXT NOT NULL,
      telegram_id TEXT NOT NULL,
      first_name TEXT,
      username TEXT,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      left_at TIMESTAMPTZ,
      days_in_group NUMERIC,
      clicked_bet BOOLEAN DEFAULT FALSE,
      clicked_bet_at TIMESTAMPTZ,
      UNIQUE(client_id, telegram_id)
    );

    CREATE TABLE IF NOT EXISTS visitor_bot (
      telegram_id TEXT NOT NULL,
      client_id TEXT NOT NULL,
      fbclid TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (telegram_id, client_id)
    );

    -- Salva fbclid da LP persistido no banco (não expira com reinício)
    CREATE TABLE IF NOT EXISTS visitor_lp (
      visitor_id TEXT PRIMARY KEY,
      client_id  TEXT NOT NULL,
      fbclid     TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Banco de dados inicializado");
}

// ── VISITOR LP — salva fbclid da LP no banco ─────────────────

async function saveVisitorLP(visitorId, clientId, fbclid) {
  await pool.query(`
    INSERT INTO visitor_lp (visitor_id, client_id, fbclid, created_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (visitor_id)
    DO UPDATE SET fbclid = $3, created_at = NOW()
  `, [visitorId, clientId, fbclid || null]);
}

async function getVisitorLP(visitorId) {
  const result = await pool.query(`
    SELECT * FROM visitor_lp WHERE visitor_id = $1
  `, [visitorId]);
  return result.rows[0] || null;
}

// ── VISITOR BOT — qual bot o usuário usou ────────────────────

async function saveVisitorBot(telegramId, clientId, fbclid) {
  await pool.query(`
    INSERT INTO visitor_bot (telegram_id, client_id, fbclid, created_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (telegram_id, client_id)
    DO UPDATE SET fbclid = COALESCE($3, visitor_bot.fbclid), created_at = NOW()
  `, [String(telegramId), clientId, fbclid || null]);
}

async function getVisitorBot(telegramId, clientId) {
  const result = await pool.query(`
    SELECT * FROM visitor_bot WHERE telegram_id = $1 AND client_id = $2
  `, [String(telegramId), clientId]);
  return result.rows[0] || null;
}

// ── EVENTOS ───────────────────────────────────────────────────

async function saveEvent(clientId, eventType, data = {}) {
  await pool.query(`
    INSERT INTO events (client_id, event_type, telegram_id, username, first_name, fbclid, days_in_group, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    clientId, eventType,
    data.telegramId || null,
    data.username || null,
    data.firstName || null,
    data.fbclid || null,
    data.daysInGroup || null,
    JSON.stringify(data.metadata || {}),
  ]);
}

async function getEventCounts(clientId, startDate, endDate) {
  const result = await pool.query(`
    SELECT event_type, COUNT(*) as count
    FROM events
    WHERE client_id = $1 AND created_at >= $2 AND created_at <= $3
    GROUP BY event_type
  `, [clientId, startDate, endDate]);

  const counts = {};
  for (const row of result.rows) counts[row.event_type] = parseInt(row.count);
  return counts;
}

async function getRecentEvents(clientId, limit = 20) {
  const result = await pool.query(`
    SELECT event_type, first_name, username, fbclid, days_in_group, created_at
    FROM events WHERE client_id = $1
    ORDER BY created_at DESC LIMIT $2
  `, [clientId, limit]);
  return result.rows;
}

// ── MEMBROS ───────────────────────────────────────────────────

async function saveMemberJoined(clientId, telegramId, data = {}) {
  await pool.query(`
    INSERT INTO members (client_id, telegram_id, first_name, username, joined_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (client_id, telegram_id)
    DO UPDATE SET joined_at = NOW(), left_at = NULL, days_in_group = NULL
  `, [clientId, telegramId, data.firstName || null, data.username || null]);
}

async function saveMemberLeft(clientId, telegramId) {
  const result = await pool.query(`
    UPDATE members
    SET left_at = NOW(),
        days_in_group = EXTRACT(EPOCH FROM (NOW() - joined_at)) / 86400
    WHERE client_id = $1 AND telegram_id = $2
    RETURNING *
  `, [clientId, telegramId]);
  return result.rows[0] || null;
}

async function saveMemberBetClick(clientId, telegramId) {
  await pool.query(`
    UPDATE members SET clicked_bet = TRUE, clicked_bet_at = NOW()
    WHERE client_id = $1 AND telegram_id = $2
  `, [clientId, telegramId]);
}

async function getMemberDB(clientId, telegramId) {
  const result = await pool.query(`
    SELECT * FROM members WHERE client_id = $1 AND telegram_id = $2
  `, [clientId, telegramId]);
  return result.rows[0] || null;
}

async function getActiveMembers(clientId) {
  const result = await pool.query(`
    SELECT * FROM members WHERE client_id = $1 AND left_at IS NULL
    ORDER BY joined_at DESC
  `, [clientId]);
  return result.rows;
}

async function clearOtherVisitorBots(telegramId, clientId) {
  await pool.query(
    `DELETE FROM visitor_bot WHERE telegram_id = $1 AND client_id != $2`,
    [String(telegramId), clientId]
  );
}

module.exports = {
  initDB,
  saveVisitorLP, getVisitorLP,
  saveVisitorBot, getVisitorBot,
  saveEvent, getEventCounts, getRecentEvents,
  saveMemberJoined, saveMemberLeft, saveMemberBetClick, getMemberDB, getActiveMembers, clearOtherVisitorBots,
};

// Adicionar ao final do db.js — antes do module.exports
