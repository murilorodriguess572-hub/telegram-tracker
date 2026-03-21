// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const { sendCapiEvent } = require("./capi");
const { saveVisitor, getVisitor } = require("./store");
const { renderDashboard } = require("./dashboard");
const db = require("./db");
const { getGeoFromIP } = require("./geo");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }));

const PORT = process.env.PORT || 3000;

// ── Clients carregados do banco ───────────────────────────────
let clientsMap = {};

async function loadClientsFromDB() {
  const bots = await db.getAllBots();
  const map = {};
  for (const bot of bots) {
    map[bot.slug] = {
      name:          bot.name,
      botToken:      bot.bot_token,
      botUsername:   bot.bot_username,
      chatId:        bot.chat_id,
      groupLink:     bot.group_link,
      affiliateLink: bot.affiliate_link,
      expertId:      bot.expert_tg_id,
      pixelId:       bot.pixel_id,
      capiToken:     bot.capi_token,
      pixelTestCode: bot.test_code || null,
      hotLeadDays:   bot.hot_lead_days || 3,
      events: {
        enteredChannel: bot.event_entered || "EnteredChannel",
        exitedGroup:    bot.event_exited  || "ExitedGroup",
        betClick:       bot.event_bet     || "BetClick",
      },
    };
  }
  clientsMap = map;
  console.log(`🔄 Bots carregados do banco: ${Object.keys(map).join(", ") || "(nenhum)"}`);
}

function getClient(clientId) {
  return clientsMap[clientId] || null;
}

// ── API Routes ────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/api"));
app.use("/api", require("./routes/botStatus"));

// ── DASHBOARD (legado HTML) ───────────────────────────────────
app.get("/dashboard", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const start = req.query.start || today;
  const end   = req.query.end   || today;
  const startDate = new Date(start + "T00:00:00-03:00");
  const endDate   = new Date(end   + "T23:59:59-03:00");

  const clientsData = {};
  for (const clientId of Object.keys(clientsMap)) {
    const [counts, members, recentEvents] = await Promise.all([
      db.getEventCounts(clientId, startDate, endDate),
      db.getActiveMembers(clientId),
      db.getRecentEvents(clientId, 20),
    ]);
    clientsData[clientId] = { counts, members, recentEvents };
  }
  res.send(renderDashboard(clientsData, clientsMap));
});

// ── HEALTH ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", bots: Object.keys(clientsMap), timestamp: new Date().toISOString() });
});

// ── PAGE VIEW DA LP ───────────────────────────────────────────
app.post("/track/:clientId", async (req, res) => {
  const { clientId } = req.params;
  const { visitorId, fbclid, fbp, userAgent } = req.body;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;

  if (!getClient(clientId)) return res.status(404).json({ error: "Cliente não encontrado" });
  if (!visitorId) return res.status(400).json({ error: "visitorId obrigatório" });

  const visitorData = { fbclid, fbp, ip, userAgent, clientId };
  const geo = await getGeoFromIP(ip);
  if (geo.city) visitorData.city = geo.city;
  if (geo.state) visitorData.state = geo.state;
  if (geo.country) visitorData.country = geo.country;

  saveVisitor(visitorId, visitorData);
  await db.saveVisitorLP(visitorId, clientId, visitorData);
  await db.saveEvent(clientId, "pageviews", { fbclid });

  console.log(`[TRACK] PageView | ${clientId} | fbclid:${fbclid || "none"}`);
  res.json({ ok: true });
});

// ── REDIRECT DO BOTÃO DA LP ───────────────────────────────────
app.get("/go/:clientId/:visitorId", async (req, res) => {
  const { clientId, visitorId } = req.params;
  const client = getClient(clientId);
  if (!client) return res.status(404).send("Cliente não encontrado");

  await db.saveEvent(clientId, "clicks", { metadata: { visitorId } });
  console.log(`[CLICK] ${clientId} | visitor:${visitorId}`);
  res.redirect(`https://t.me/${client.botUsername}?start=${visitorId}`);
});

// ── LINK DA CASA DE APOSTA ────────────────────────────────────
app.get("/bet/:clientId/:telegramId", async (req, res) => {
  const { clientId, telegramId } = req.params;
  const client = getClient(clientId);
  if (!client) return res.status(404).send("Cliente não encontrado");

  const member = await db.getMemberDB(clientId, telegramId);
  const visitorBot = await db.getVisitorBot(telegramId, clientId);
  await db.saveMemberBetClick(clientId, telegramId);

  const daysInGroup = member
    ? ((Date.now() - new Date(member.joined_at)) / (1000 * 60 * 60 * 24)).toFixed(1)
    : null;

  await db.saveEvent(clientId, "betClicks", {
    telegramId, firstName: member?.first_name,
    username: member?.username, daysInGroup,
  });

  if (member) {
    await sendCapiEvent(client, client.events.betClick, {
      telegramId, username: member.username, firstName: member.first_name,
      fbclid: visitorBot?.fbclid, fbp: visitorBot?.fbp,
      ip: visitorBot?.ip, userAgent: visitorBot?.user_agent,
      city: visitorBot?.city, state: visitorBot?.state, country: visitorBot?.country,
    }, { days_in_group: daysInGroup });
  }

  res.redirect(client.affiliateLink);
});

// ── WEBHOOK DO TELEGRAM ───────────────────────────────────────
app.post("/webhook/:clientId", async (req, res) => {
  res.sendStatus(200);
  const { clientId } = req.params;
  const update = req.body;
  const client = getClient(clientId);
  if (!client) return;

  if (update.chat_member)    await handleChatMember(client, clientId, update.chat_member);
  if (update.message)        await handleBotMessage(client, clientId, update.message);
  if (update.callback_query) await handleCallbackQuery(client, clientId, update.callback_query);
});

// ── ENTRADA/SAÍDA NO GRUPO ────────────────────────────────────
async function handleChatMember(client, clientId, chatMember) {
  const { new_chat_member, old_chat_member, from, chat } = chatMember;
  if (String(chat.id) !== String(client.chatId)) return;

  const user = new_chat_member?.user || from;
  const userData = { telegramId: user.id, username: user.username, firstName: user.first_name };

  const oldStatus = old_chat_member?.status;
  const newStatus = new_chat_member?.status;

  const entrou = (oldStatus === "left" || oldStatus === "kicked") &&
    (newStatus === "member" || newStatus === "administrator" || newStatus === "creator");

  const saiu = (oldStatus === "member" || oldStatus === "administrator" || oldStatus === "restricted") &&
    (newStatus === "left" || newStatus === "kicked");

  if (entrou) {
    await db.saveMemberJoined(clientId, user.id, userData);
    const visitorBot = await db.getVisitorBot(user.id, clientId);
    if (visitorBot) {
      const enriched = {
        ...userData,
        fbclid: visitorBot.fbclid, fbp: visitorBot.fbp,
        ip: visitorBot.ip, userAgent: visitorBot.user_agent,
        city: visitorBot.city, state: visitorBot.state, country: visitorBot.country,
      };
      await db.saveEvent(clientId, "entered", enriched);
      console.log(`[ENTRADA ✅] ${clientId} | ${user.first_name} | fbclid:${visitorBot.fbclid || "none"}`);
      await sendCapiEvent(client, client.events.enteredChannel, enriched, { group_title: chat.title });
    } else {
      console.log(`[ENTRADA IGNORADA] ${clientId} | ${user.first_name} | não usou este bot`);
    }
  }

  if (saiu) {
    const memberData = await db.saveMemberLeft(clientId, user.id);
    const days = memberData ? parseFloat(memberData.days_in_group) : 0;
    const hotLeadDays = client.hotLeadDays || 3;
    const eventType = days < 1 ? "coldLeads" : days >= hotLeadDays ? "hotLeads" : "exited";

    // Saída categorizada por bot (frio/morno/quente)
    await db.saveEvent(clientId, eventType, { ...userData, daysInGroup: days });

    // Saída total do CANAL (independente do bot)
    await db.saveEvent(clientId, "exitedTotal", { ...userData, daysInGroup: days });

    // Saída do lead que entrou POR ESTE BOT (retenção por bot)
    const visitorBot = await db.getVisitorBot(user.id, clientId);
    if (visitorBot) {
      await db.saveEvent(clientId, "exitedByBot", { ...userData, daysInGroup: days });
    }

    console.log(`[SAÍDA] ${clientId} | ${user.first_name} | ${days.toFixed(1)}d | ${eventType}`);
    await sendCapiEvent(client, client.events.exitedGroup, userData, { days_in_group: days });
  }
}

// ── MENSAGEM PARA O BOT ───────────────────────────────────────
async function handleBotMessage(client, clientId, message) {
  const user = message.from;
  if (!user || user.is_bot) return;
  const text = message.text || "";

  if (text.startsWith("/start")) {
    const visitorId = text.split(" ")[1];
    let visitorData = {};

    if (visitorId) {
      const visitorMem = getVisitor(visitorId);
      if (visitorMem) {
        visitorData = visitorMem;
      } else {
        const visitorDB = await db.getVisitorLP(visitorId);
        if (visitorDB) {
          visitorData = { fbclid: visitorDB.fbclid, fbp: visitorDB.fbp, ip: visitorDB.ip, userAgent: visitorDB.user_agent };
        }
      }
    }

    await db.saveVisitorBot(user.id, clientId, visitorData);
    await db.clearOtherVisitorBots(user.id, clientId);
    console.log(`[BOT /start] ${clientId} | TG:${user.id} | fbclid:${visitorData.fbclid || "none"}`);

    if (client.groupLink) {
      await axios.post(`https://api.telegram.org/bot${client.botToken}/sendMessage`, {
        chat_id: user.id,
        text: `Olá ${user.first_name}! Clique no botão abaixo para entrar no grupo 👇`,
        reply_markup: { inline_keyboard: [[{ text: "✅ Entrar no grupo", url: client.groupLink }]] }
      }).catch(e => console.error("[BOT SEND]", e.message));
    }
    return;
  }

  if (String(user.id) === String(client.expertId) && text) {
    await publishExpertMessage(client, clientId, text);
  }
}

// ── PUBLICA MENSAGEM DO EXPERT ────────────────────────────────
async function publishExpertMessage(client, clientId, text) {
  await axios.post(`https://api.telegram.org/bot${client.botToken}/sendMessage`, {
    chat_id: client.chatId,
    text,
    reply_markup: {
      inline_keyboard: [[{ text: "🎯 Acessar casa de aposta", callback_data: `bet:${clientId}` }]]
    }
  }).catch(e => console.error("[PUBLISH]", e.message));
}

// ── CLIQUE NO BOTÃO INLINE ────────────────────────────────────
async function handleCallbackQuery(client, clientId, callbackQuery) {
  const { data, from, id } = callbackQuery;

  await axios.post(`https://api.telegram.org/bot${client.botToken}/answerCallbackQuery`, {
    callback_query_id: id,
  }).catch(() => {});

  if (data === `bet:${clientId}`) {
    const member = await db.getMemberDB(clientId, from.id);
    const visitorBot = await db.getVisitorBot(from.id, clientId);
    await db.saveMemberBetClick(clientId, from.id);

    const daysInGroup = member
      ? ((Date.now() - new Date(member.joined_at)) / (1000 * 60 * 60 * 24)).toFixed(1)
      : "?";

    await db.saveEvent(clientId, "betClicks", {
      telegramId: from.id, firstName: from.first_name,
      username: from.username, daysInGroup,
    });

    const appUrl = process.env.APP_URL || "https://telegram-tracker-production.up.railway.app";
    const betLink = `${appUrl}/bet/${clientId}/${from.id}`;
    await axios.post(`https://api.telegram.org/bot${client.botToken}/sendMessage`, {
      chat_id: from.id,
      text: `Clique abaixo para acessar 👇`,
      reply_markup: { inline_keyboard: [[{ text: "🎯 Acessar agora", url: betLink }]] }
    }).catch(e => console.error("[BOT SEND]", e.message));

    if (member) {
      await sendCapiEvent(client, client.events.betClick, {
        telegramId: from.id, username: from.username, firstName: from.first_name,
        fbclid: visitorBot?.fbclid, fbp: visitorBot?.fbp,
        ip: visitorBot?.ip, userAgent: visitorBot?.user_agent,
      }, { days_in_group: daysInGroup });
    }
  }
}

// ── Script de integração dinâmico ────────────────────────────
app.get("/script/:clientId.js", (req, res) => {
  const { clientId } = req.params;
  const appUrl = process.env.APP_URL || `https://${req.headers.host}`;

  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.send(`(function () {
  var BACKEND = "${appUrl}";
  var CLIENT  = "${clientId}";

  function getVisitorId() {
    var id = localStorage.getItem("_tid");
    if (!id) {
      id = "v" + Math.random().toString(36).substr(2, 8) + Date.now();
      localStorage.setItem("_tid", id);
    }
    return id;
  }

  function getFbclid() {
    var fb = new URLSearchParams(location.search).get("fbclid");
    if (fb) localStorage.setItem("_fbc", fb);
    return localStorage.getItem("_fbc");
  }

  function getFbp() {
    var match = document.cookie.match(/(^|;)\\s*_fbp=([^;]+)/);
    return match ? match[2] : null;
  }

  var vid    = getVisitorId();
  var fbclid = getFbclid();

  setTimeout(function () {
    fetch(BACKEND + "/track/" + CLIENT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: vid, fbclid: fbclid, fbp: getFbp(), userAgent: navigator.userAgent })
    }).catch(function () {});
  }, 1500);

  function patchButtons() {
    document.querySelectorAll('a[href*="t.me"], a[href*="telegram.me"]').forEach(function (btn) {
      btn.href = BACKEND + "/go/" + CLIENT + "/" + vid;
      btn.target = "_blank";
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", patchButtons)
    : patchButtons();

  setTimeout(patchButtons, 2000);
})();`);
});

// ── Serve React frontend em produção ─────────────────────────
const frontendDist = path.join(__dirname, "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) res.status(200).send("Frontend não compilado. Execute: cd frontend && npm run build");
  });
});

// ── INICIALIZAÇÃO ─────────────────────────────────────────────
(async () => {
  await db.initDB();
  await loadClientsFromDB();
  app.listen(PORT, () => {
    console.log(`\n✅ Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard legado: /dashboard`);
    console.log(`🔑 API: /api/auth/login\n`);
  });
})();
