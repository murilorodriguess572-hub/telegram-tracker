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
      client_id   TEXT NOT NULL,
      fbclid      TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (telegram_id, client_id)
    );

    CREATE TABLE IF NOT EXISTS visitor_lp (
      visitor_id  TEXT PRIMARY KEY,
      client_id   TEXT NOT NULL,
      fbclid      TEXT,
      fbp         TEXT,
      ip          TEXT,
      user_agent  TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE visitor_lp ADD COLUMN IF NOT EXISTS fbp        TEXT;
    ALTER TABLE visitor_lp ADD COLUMN IF NOT EXISTS ip         TEXT;
    ALTER TABLE visitor_lp ADD COLUMN IF NOT EXISTS user_agent TEXT;
    ALTER TABLE visitor_lp ADD COLUMN IF NOT EXISTS city       TEXT;
    ALTER TABLE visitor_lp ADD COLUMN IF NOT EXISTS state      TEXT;
    ALTER TABLE visitor_lp ADD COLUMN IF NOT EXISTS country    TEXT;

    ALTER TABLE visitor_bot ADD COLUMN IF NOT EXISTS fbp        TEXT;
    ALTER TABLE visitor_bot ADD COLUMN IF NOT EXISTS ip         TEXT;
    ALTER TABLE visitor_bot ADD COLUMN IF NOT EXISTS user_agent TEXT;
    ALTER TABLE visitor_bot ADD COLUMN IF NOT EXISTS city       TEXT;
    ALTER TABLE visitor_bot ADD COLUMN IF NOT EXISTS state      TEXT;
    ALTER TABLE visitor_bot ADD COLUMN IF NOT EXISTS country    TEXT;

    CREATE TABLE IF NOT EXISTS saas_clients (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      slug       TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS experts (
      id         SERIAL PRIMARY KEY,
      client_id  INTEGER REFERENCES saas_clients(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      slug       TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bots (
      id              SERIAL PRIMARY KEY,
      expert_id       INTEGER REFERENCES experts(id) ON DELETE CASCADE,
      client_id       INTEGER REFERENCES saas_clients(id) ON DELETE CASCADE,
      name            TEXT NOT NULL,
      slug            TEXT UNIQUE NOT NULL,
      bot_token       TEXT,
      bot_username    TEXT,
      chat_id         TEXT,
      group_link      TEXT,
      affiliate_link  TEXT,
      expert_tg_id    TEXT,
      pixel_id        TEXT,
      capi_token      TEXT,
      test_code       TEXT,
      hot_lead_days   INTEGER DEFAULT 3,
      event_entered   TEXT DEFAULT 'EnteredChannel',
      event_exited    TEXT DEFAULT 'ExitedGroup',
      event_bet       TEXT DEFAULT 'BetClick',
      active          BOOLEAN DEFAULT TRUE,
      created_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      name       TEXT NOT NULL,
      email      TEXT UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      role       TEXT NOT NULL DEFAULT 'admin',
      client_id  INTEGER REFERENCES saas_clients(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Banco de dados inicializado");
}

// ── VISITOR LP ────────────────────────────────────────────────

async function saveVisitorLP(visitorId, clientId, data = {}) {
  await pool.query(`
    INSERT INTO visitor_lp (visitor_id, client_id, fbclid, fbp, ip, user_agent, city, state, country, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (visitor_id)
    DO UPDATE SET
      fbclid     = COALESCE($3, visitor_lp.fbclid),
      fbp        = COALESCE($4, visitor_lp.fbp),
      ip         = COALESCE($5, visitor_lp.ip),
      user_agent = COALESCE($6, visitor_lp.user_agent),
      city       = COALESCE($7, visitor_lp.city),
      state      = COALESCE($8, visitor_lp.state),
      country    = COALESCE($9, visitor_lp.country),
      created_at = NOW()
  `, [visitorId, clientId, data.fbclid || null, data.fbp || null, data.ip || null, data.userAgent || null, data.city || null, data.state || null, data.country || null]);
}

async function getVisitorLP(visitorId) {
  const result = await pool.query(
    `SELECT * FROM visitor_lp WHERE visitor_id = $1`, [visitorId]
  );
  return result.rows[0] || null;
}

// ── VISITOR BOT ───────────────────────────────────────────────

async function saveVisitorBot(telegramId, clientId, data = {}) {
  await pool.query(`
    INSERT INTO visitor_bot (telegram_id, client_id, fbclid, fbp, ip, user_agent, city, state, country, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (telegram_id, client_id)
    DO UPDATE SET
      fbclid     = COALESCE($3, visitor_bot.fbclid),
      fbp        = COALESCE($4, visitor_bot.fbp),
      ip         = COALESCE($5, visitor_bot.ip),
      user_agent = COALESCE($6, visitor_bot.user_agent),
      city       = COALESCE($7, visitor_bot.city),
      state      = COALESCE($8, visitor_bot.state),
      country    = COALESCE($9, visitor_bot.country),
      created_at = NOW()
  `, [
    String(telegramId), clientId,
    data.fbclid || null, data.fbp || null,
    data.ip || null, data.userAgent || null,
    data.city || null, data.state || null, data.country || null,
  ]);
}

async function getVisitorBot(telegramId, clientId) {
  const result = await pool.query(
    `SELECT * FROM visitor_bot WHERE telegram_id = $1 AND client_id = $2`,
    [String(telegramId), clientId]
  );
  return result.rows[0] || null;
}

async function clearOtherVisitorBots(telegramId, clientId) {
  await pool.query(
    `DELETE FROM visitor_bot WHERE telegram_id = $1 AND client_id != $2`,
    [String(telegramId), clientId]
  );
}

// ── EVENTOS ───────────────────────────────────────────────────

async function saveEvent(clientId, eventType, data = {}) {
  await pool.query(`
    INSERT INTO events (client_id, event_type, telegram_id, username, first_name, fbclid, days_in_group, metadata)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    clientId, eventType,
    data.telegramId || null, data.username || null,
    data.firstName || null, data.fbclid || null,
    data.daysInGroup || null, JSON.stringify(data.metadata || {}),
  ]);
}

async function getEventCounts(clientId, startDate, endDate) {
  const result = await pool.query(`
    SELECT event_type, COUNT(*) as count
    FROM events
    WHERE client_id = $1
      AND (created_at AT TIME ZONE 'America/Sao_Paulo') >= ($2 AT TIME ZONE 'America/Sao_Paulo')
      AND (created_at AT TIME ZONE 'America/Sao_Paulo') <= ($3 AT TIME ZONE 'America/Sao_Paulo')
    GROUP BY event_type
  `, [clientId, startDate, endDate]);

  const counts = {};
  for (const row of result.rows) counts[row.event_type] = parseInt(row.count);
  return counts;
}

async function getRecentEvents(clientId, limit = 20) {
  const result = await pool.query(`
    SELECT event_type, first_name, username, fbclid, days_in_group,
           (created_at AT TIME ZONE 'America/Sao_Paulo') AS created_at
    FROM events WHERE client_id = $1
    ORDER BY created_at DESC LIMIT $2
  `, [clientId, limit]);
  return result.rows;
}

async function getEventsByDay(clientId, days = 30) {
  const result = await pool.query(`
    SELECT DATE(created_at AT TIME ZONE 'America/Sao_Paulo') as dia,
           COUNT(*) as total
    FROM events
    WHERE client_id = $1 AND event_type = 'entered'
      AND (created_at AT TIME ZONE 'America/Sao_Paulo') >= (NOW() AT TIME ZONE 'America/Sao_Paulo') - INTERVAL '${parseInt(days)} days'
    GROUP BY dia ORDER BY dia
  `, [clientId]);
  return result.rows;
}

async function getEventsByHour(clientId) {
  const result = await pool.query(`
    SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Sao_Paulo') as hora,
           COUNT(*) as total
    FROM events
    WHERE client_id = $1 AND event_type = 'entered'
    GROUP BY hora ORDER BY hora
  `, [clientId]);
  return result.rows;
}

async function getFunnelCounts(clientId, startDate, endDate) {
  const result = await pool.query(`
    SELECT event_type, COUNT(*) as total
    FROM events
    WHERE client_id = $1
      AND (created_at AT TIME ZONE 'America/Sao_Paulo') >= ($2 AT TIME ZONE 'America/Sao_Paulo')
      AND (created_at AT TIME ZONE 'America/Sao_Paulo') <= ($3 AT TIME ZONE 'America/Sao_Paulo')
    GROUP BY event_type
  `, [clientId, startDate, endDate]);
  const counts = {};
  for (const row of result.rows) counts[row.event_type] = parseInt(row.total);
  return counts;
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
  const result = await pool.query(
    `SELECT * FROM members WHERE client_id = $1 AND telegram_id = $2`,
    [clientId, telegramId]
  );
  return result.rows[0] || null;
}

async function getActiveMembers(clientId) {
  const result = await pool.query(`
    SELECT * FROM members WHERE client_id = $1 AND left_at IS NULL
    ORDER BY joined_at DESC
  `, [clientId]);
  return result.rows;
}

async function getMemberStats(clientId) {
  const result = await pool.query(`
    SELECT
      AVG(days_in_group) as media_dias,
      COUNT(*) FILTER (WHERE days_in_group < 1) as frios,
      COUNT(*) FILTER (WHERE days_in_group >= 3) as quentes,
      COUNT(*) FILTER (WHERE left_at IS NULL) as ativos
    FROM members WHERE client_id = $1
  `, [clientId]);
  return result.rows[0];
}

// ── SAAS: CLIENTS ─────────────────────────────────────────────

async function getSaasClients() {
  const result = await pool.query(`SELECT * FROM saas_clients ORDER BY name`);
  return result.rows;
}

async function getSaasClientById(id) {
  const result = await pool.query(`SELECT * FROM saas_clients WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function getSaasClientBySlug(slug) {
  const result = await pool.query(`SELECT * FROM saas_clients WHERE slug = $1`, [slug]);
  return result.rows[0] || null;
}

async function createSaasClient(name, slug) {
  const result = await pool.query(
    `INSERT INTO saas_clients (name, slug) VALUES ($1, $2) RETURNING *`,
    [name, slug]
  );
  return result.rows[0];
}

async function updateSaasClient(id, name, slug) {
  const result = await pool.query(
    `UPDATE saas_clients SET name = $1, slug = $2 WHERE id = $3 RETURNING *`,
    [name, slug, id]
  );
  return result.rows[0] || null;
}

async function deleteSaasClient(id) {
  await pool.query(`DELETE FROM saas_clients WHERE id = $1`, [id]);
}

// ── SAAS: EXPERTS ─────────────────────────────────────────────

async function getExperts(clientId) {
  const result = await pool.query(
    `SELECT * FROM experts WHERE client_id = $1 ORDER BY name`,
    [clientId]
  );
  return result.rows;
}

async function getExpertById(id) {
  const result = await pool.query(`SELECT * FROM experts WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function createExpert(clientId, name, slug) {
  const result = await pool.query(
    `INSERT INTO experts (client_id, name, slug) VALUES ($1, $2, $3) RETURNING *`,
    [clientId, name, slug]
  );
  return result.rows[0];
}

async function updateExpert(id, name, slug) {
  const result = await pool.query(
    `UPDATE experts SET name = $1, slug = $2 WHERE id = $3 RETURNING *`,
    [name, slug, id]
  );
  return result.rows[0] || null;
}

async function deleteExpert(id) {
  await pool.query(`DELETE FROM experts WHERE id = $1`, [id]);
}

// ── SAAS: BOTS ────────────────────────────────────────────────

async function getBots(expertId) {
  const result = await pool.query(
    `SELECT * FROM bots WHERE expert_id = $1 ORDER BY name`,
    [expertId]
  );
  return result.rows;
}

async function getBotsByClient(clientId) {
  const result = await pool.query(
    `SELECT b.*, e.name as expert_name FROM bots b
     JOIN experts e ON e.id = b.expert_id
     WHERE b.client_id = $1 ORDER BY e.name, b.name`,
    [clientId]
  );
  return result.rows;
}

async function getAllBots() {
  const result = await pool.query(
    `SELECT b.*, e.name as expert_name, c.name as client_name
     FROM bots b
     JOIN experts e ON e.id = b.expert_id
     JOIN saas_clients c ON c.id = b.client_id
     WHERE b.active = TRUE
     ORDER BY c.name, e.name, b.name`
  );
  return result.rows;
}

async function getBotById(id) {
  const result = await pool.query(`SELECT * FROM bots WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function getBotBySlug(slug) {
  const result = await pool.query(`SELECT * FROM bots WHERE slug = $1`, [slug]);
  return result.rows[0] || null;
}

async function createBot(data) {
  const result = await pool.query(`
    INSERT INTO bots (expert_id, client_id, name, slug, bot_token, bot_username, chat_id,
      group_link, affiliate_link, expert_tg_id, pixel_id, capi_token, test_code,
      hot_lead_days, event_entered, event_exited, event_bet, active)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    RETURNING *
  `, [
    data.expertId, data.clientId, data.name, data.slug,
    data.botToken || null, data.botUsername || null, data.chatId || null,
    data.groupLink || null, data.affiliateLink || null, data.expertTgId || null,
    data.pixelId || null, data.capiToken || null, data.testCode || null,
    data.hotLeadDays || 3,
    data.eventEntered || 'EnteredChannel',
    data.eventExited || 'ExitedGroup',
    data.eventBet || 'BetClick',
    data.active !== false,
  ]);
  return result.rows[0];
}

async function updateBot(id, data) {
  const result = await pool.query(`
    UPDATE bots SET
      name = $1, slug = $2, bot_token = $3, bot_username = $4, chat_id = $5,
      group_link = $6, affiliate_link = $7, expert_tg_id = $8, pixel_id = $9,
      capi_token = $10, test_code = $11, hot_lead_days = $12,
      event_entered = $13, event_exited = $14, event_bet = $15, active = $16
    WHERE id = $17 RETURNING *
  `, [
    data.name, data.slug, data.botToken || null, data.botUsername || null, data.chatId || null,
    data.groupLink || null, data.affiliateLink || null, data.expertTgId || null,
    data.pixelId || null, data.capiToken || null, data.testCode || null,
    data.hotLeadDays || 3,
    data.eventEntered || 'EnteredChannel',
    data.eventExited || 'ExitedGroup',
    data.eventBet || 'BetClick',
    data.active !== false,
    id,
  ]);
  return result.rows[0] || null;
}

async function deleteBot(id) {
  await pool.query(`DELETE FROM bots WHERE id = $1`, [id]);
}

// ── SAAS: USERS ───────────────────────────────────────────────

async function getUserByEmail(email) {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
  return result.rows[0] || null;
}

async function getUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, role, client_id, created_at FROM users WHERE id = $1`, [id]
  );
  return result.rows[0] || null;
}

async function createUser(name, email, hashedPassword, role, clientId) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role, client_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, client_id, created_at`,
    [name, email, hashedPassword, role, clientId || null]
  );
  return result.rows[0];
}

async function updateUserPassword(id, hashedPassword) {
  await pool.query(`UPDATE users SET password = $1 WHERE id = $2`, [hashedPassword, id]);
}

async function updateUserEmailAndName(id, name, email) {
  await pool.query(`UPDATE users SET name = $1, email = $2 WHERE id = $3`, [name, email, id]);
}

async function getAdminUserByClientId(clientId) {
  const result = await pool.query(
    `SELECT * FROM users WHERE client_id = $1 AND role = 'admin' ORDER BY created_at ASC LIMIT 1`,
    [clientId]
  );
  return result.rows[0] || null;
}

async function getUsers() {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.client_id, c.name as client_name, u.created_at
     FROM users u LEFT JOIN saas_clients c ON c.id = u.client_id ORDER BY u.created_at DESC`
  );
  return result.rows;
}

module.exports = {
  initDB,
  pool,
  saveVisitorLP, getVisitorLP,
  saveVisitorBot, getVisitorBot, clearOtherVisitorBots,
  saveEvent, getEventCounts, getRecentEvents,
  getEventsByDay, getEventsByHour, getFunnelCounts,
  saveMemberJoined, saveMemberLeft, saveMemberBetClick, getMemberDB, getActiveMembers, getMemberStats,
  getSaasClients, getSaasClientById, getSaasClientBySlug, createSaasClient, updateSaasClient, deleteSaasClient,
  getExperts, getExpertById, createExpert, updateExpert, deleteExpert,
  getBots, getBotsByClient, getAllBots, getBotById, getBotBySlug, createBot, updateBot, deleteBot,
  getUserByEmail, getUserById, createUser, updateUserPassword, updateUserEmailAndName, getAdminUserByClientId, getUsers,
};
