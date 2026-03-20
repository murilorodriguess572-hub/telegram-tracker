// routes/api.js
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authMiddleware, requireSuperAdmin } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

// ── helper: verifica acesso ao client ────────────────────────
function canAccessClient(user, clientId) {
  if (user.role === "superadmin") return true;
  return String(user.clientId) === String(clientId);
}

// ════════════════════════════════════════════════════════════
// CLIENTS
// ════════════════════════════════════════════════════════════

router.get("/clients", async (req, res) => {
  if (req.user.role !== "superadmin") {
    const client = await db.getSaasClientById(req.user.clientId);
    return res.json(client ? [client] : []);
  }
  const clients = await db.getSaasClients();
  res.json(clients);
});

router.post("/clients", requireSuperAdmin, async (req, res) => {
  const { name, slug } = req.body;
  if (!name || !slug) return res.status(400).json({ error: "name e slug obrigatórios" });
  const client = await db.createSaasClient(name, slug.toLowerCase().replace(/\s+/g, "-"));
  res.status(201).json(client);
});

router.put("/clients/:id", requireSuperAdmin, async (req, res) => {
  const { name, slug } = req.body;
  const client = await db.updateSaasClient(req.params.id, name, slug);
  if (!client) return res.status(404).json({ error: "Cliente não encontrado" });
  res.json(client);
});

router.delete("/clients/:id", requireSuperAdmin, async (req, res) => {
  await db.deleteSaasClient(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
// EXPERTS
// ════════════════════════════════════════════════════════════

router.get("/experts", async (req, res) => {
  const clientId = req.user.role === "superadmin"
    ? req.query.clientId
    : req.user.clientId;
  if (!clientId) return res.status(400).json({ error: "clientId obrigatório" });
  if (!canAccessClient(req.user, clientId)) return res.status(403).json({ error: "Acesso negado" });
  const experts = await db.getExperts(clientId);
  res.json(experts);
});

router.post("/experts", requireSuperAdmin, async (req, res) => {
  const { clientId, name, slug } = req.body;
  if (!clientId || !name || !slug) return res.status(400).json({ error: "Campos obrigatórios" });
  const expert = await db.createExpert(clientId, name, slug.toLowerCase().replace(/\s+/g, "-"));
  res.status(201).json(expert);
});

router.put("/experts/:id", requireSuperAdmin, async (req, res) => {
  const { name, slug } = req.body;
  const expert = await db.updateExpert(req.params.id, name, slug);
  if (!expert) return res.status(404).json({ error: "Expert não encontrado" });
  res.json(expert);
});

router.delete("/experts/:id", requireSuperAdmin, async (req, res) => {
  await db.deleteExpert(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
// BOTS
// ════════════════════════════════════════════════════════════

router.get("/bots/:id(\\d+)", async (req, res) => {
  const bot = await db.getBotById(req.params.id);
  if (!bot) return res.status(404).json({ error: "Bot não encontrado" });
  res.json(bot);
});

router.get("/bots", async (req, res) => {
  const { expertId, clientId } = req.query;
  if (expertId) {
    const bots = await db.getBots(expertId);
    return res.json(bots);
  }
  if (clientId) {
    if (!canAccessClient(req.user, clientId)) return res.status(403).json({ error: "Acesso negado" });
    const bots = await db.getBotsByClient(clientId);
    return res.json(bots);
  }
  if (req.user.role === "superadmin") {
    const bots = await db.getAllBots();
    return res.json(bots);
  }
  return res.status(400).json({ error: "expertId ou clientId obrigatório" });
});

router.post("/bots", requireSuperAdmin, async (req, res) => {
  const data = req.body;
  if (!data.expertId || !data.clientId || !data.name || !data.slug) {
    return res.status(400).json({ error: "Campos obrigatórios: expertId, clientId, name, slug" });
  }
  const bot = await db.createBot(data);
  res.status(201).json(bot);
});

router.put("/bots/:id", requireSuperAdmin, async (req, res) => {
  const bot = await db.updateBot(req.params.id, req.body);
  if (!bot) return res.status(404).json({ error: "Bot não encontrado" });
  res.json(bot);
});

router.delete("/bots/:id", requireSuperAdmin, async (req, res) => {
  await db.deleteBot(req.params.id);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════
// METRICS
// ════════════════════════════════════════════════════════════

function parseDateRange(query) {
  const tz = "America/Sao_Paulo";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: tz });
  const start = query.start || today;
  const end = query.end || today;
  return {
    startDate: new Date(start + "T00:00:00-03:00"),
    endDate: new Date(end + "T23:59:59-03:00"),
  };
}

// GET /api/metrics/:botSlug
router.get("/metrics/:botSlug", async (req, res) => {
  const { botSlug } = req.params;
  const { startDate, endDate } = parseDateRange(req.query);

  const [counts, members, recentEvents, byDay, byHour, memberStats] = await Promise.all([
    db.getEventCounts(botSlug, startDate, endDate),
    db.getActiveMembers(botSlug),
    db.getRecentEvents(botSlug, 30),
    db.getEventsByDay(botSlug, req.query.days || 30),
    db.getEventsByHour(botSlug),
    db.getMemberStats(botSlug),
  ]);

  res.json({ counts, members, recentEvents, byDay, byHour, memberStats });
});

// GET /api/metrics/expert/:expertId
router.get("/metrics/expert/:expertId", async (req, res) => {
  const { expertId } = req.params;
  const { startDate, endDate } = parseDateRange(req.query);

  const expert = await db.getExpertById(expertId);
  if (!expert) return res.status(404).json({ error: "Expert não encontrado" });
  if (!canAccessClient(req.user, expert.client_id)) return res.status(403).json({ error: "Acesso negado" });

  const bots = await db.getBots(expertId);
  const botsMetrics = await Promise.all(
    bots.map(async (bot) => {
      const [counts, activeMembers] = await Promise.all([
        db.getEventCounts(bot.slug, startDate, endDate),
        db.getActiveMembers(bot.slug),
      ]);
      return { ...bot, counts, activeCount: activeMembers.length };
    })
  );

  res.json({ expert, bots: botsMetrics });
});

// GET /api/metrics/client/:clientId
router.get("/metrics/client/:clientId", async (req, res) => {
  const { clientId } = req.params;
  if (!canAccessClient(req.user, clientId)) return res.status(403).json({ error: "Acesso negado" });

  const { startDate, endDate } = parseDateRange(req.query);
  const client = await db.getSaasClientById(clientId);
  if (!client) return res.status(404).json({ error: "Cliente não encontrado" });

  const experts = await db.getExperts(clientId);
  const expertsMetrics = await Promise.all(
    experts.map(async (expert) => {
      const bots = await db.getBots(expert.id);
      const botsData = await Promise.all(
        bots.map(async (bot) => {
          const counts = await db.getEventCounts(bot.slug, startDate, endDate);
          return { ...bot, counts };
        })
      );
      const totals = botsData.reduce((acc, bot) => {
        for (const [k, v] of Object.entries(bot.counts || {})) {
          acc[k] = (acc[k] || 0) + v;
        }
        return acc;
      }, {});
      return { ...expert, bots: botsData, totals };
    })
  );

  res.json({ client, experts: expertsMetrics });
});

// GET /api/metrics/overview (superadmin)
router.get("/metrics/overview", requireSuperAdmin, async (req, res) => {
  const { startDate, endDate } = parseDateRange(req.query);
  const clients = await db.getSaasClients();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
  const todayStart = new Date(today + "T00:00:00-03:00");
  const todayEnd = new Date(today + "T23:59:59-03:00");

  const clientsData = await Promise.all(
    clients.map(async (client) => {
      const bots = await db.getBotsByClient(client.id);
      let totalEntered = 0, totalToday = 0;
      for (const bot of bots) {
        const [periodCounts, todayCounts] = await Promise.all([
          db.getEventCounts(bot.slug, startDate, endDate),
          db.getEventCounts(bot.slug, todayStart, todayEnd),
        ]);
        totalEntered += periodCounts.entered || 0;
        totalToday += todayCounts.entered || 0;
      }
      return { ...client, botsCount: bots.length, totalEntered, totalToday };
    })
  );

  res.json({ clients: clientsData, total: clients.length });
});

// GET /api/members/:botSlug
router.get("/members/:botSlug", async (req, res) => {
  const members = await db.getActiveMembers(req.params.botSlug);
  res.json(members);
});

// GET /api/events/:botSlug
router.get("/events/:botSlug", async (req, res) => {
  const limit = parseInt(req.query.limit) || 30;
  const events = await db.getRecentEvents(req.params.botSlug, limit);
  res.json(events);
});

// ════════════════════════════════════════════════════════════
// USERS (superadmin)
// ════════════════════════════════════════════════════════════

router.get("/users", requireSuperAdmin, async (req, res) => {
  const users = await db.getUsers();
  res.json(users);
});

router.post("/users", requireSuperAdmin, async (req, res) => {
  const { name, email, password, role, clientId } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: "Campos obrigatórios" });
  const hashed = await bcrypt.hash(password, 10);
  const user = await db.createUser(name, email.toLowerCase(), hashed, role, clientId || null);
  res.status(201).json(user);
});

module.exports = router;
