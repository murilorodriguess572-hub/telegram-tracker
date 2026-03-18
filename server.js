// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { sendCapiEvent } = require("./capi");
const clients = require("./clients");
const { saveVisitor, getVisitor } = require("./store");
const { renderDashboard } = require("./dashboard");
const db = require("./db");

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const PORT = process.env.PORT || 3000;

// ── DASHBOARD COM FILTRO DE DATA ──────────────────────────────
app.get("/dashboard", async (req, res) => {
  const today = new Date().toISOString().split("T")[0];
  const start = req.query.start || today;
  const end   = req.query.end   || today;

  const startDate = new Date(start + "T00:00:00-03:00");
  const endDate   = new Date(end   + "T23:59:59-03:00");

  const clientsData = {};
  for (const clientId of Object.keys(clients)) {
    const [counts, members, recentEvents] = await Promise.all([
      db.getEventCounts(clientId, startDate, endDate),
      db.getActiveMembers(clientId),
      db.getRecentEvents(clientId, 20),
    ]);
    clientsData[clientId] = { counts, members, recentEvents };
  }

  res.send(renderDashboard(clientsData, clients));
});

// ── HEALTH ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", clients: Object.keys(clients), timestamp: new Date().toISOString() });
});

// ── PAGE VIEW DA LP ───────────────────────────────────────────
app.post("/track/:clientId", async (req, res) => {
  const { clientId } = req.params;
  const { visitorId, fbclid, userAgent } = req.body;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  if (!clients[clientId]) return res.status(404).json({ error: "Cliente não encontrado" });
  if (!visitorId) return res.status(400).json({ error: "visitorId obrigatório" });

  saveVisitor(visitorId, { fbclid, ip, userAgent, clientId });
  await db.saveEvent(clientId, "pageviews", { fbclid, metadata: { userAgent } });

  console.log(`[TRACK] PageView | ${clientId} | fbclid:${fbclid || "none"}`);
  res.json({ ok: true });
});

// ── REDIRECT DO BOTÃO DA LP ───────────────────────────────────
app.get("/go/:clientId/:visitorId", async (req, res) => {
  const { clientId, visitorId } = req.params;
  const client = clients[clientId];
  if (!client) return res.status(404).send("Cliente não encontrado");

  await db.saveEvent(clientId, "clicks", { metadata: { visitorId } });
  console.log(`[CLICK] ${clientId} | visitor:${visitorId} → bot`);
  res.redirect(`https://t.me/${client.botUsername}?start=${visitorId}`);
});

// ── LINK DA CASA DE APOSTA ────────────────────────────────────
app.get("/bet/:clientId/:telegramId", async (req, res) => {
  const { clientId, telegramId } = req.params;
  const client = clients[clientId];
  if (!client) return res.status(404).send("Cliente não encontrado");

  const member = await db.getMemberDB(clientId, telegramId);
  await db.saveMemberBetClick(clientId, telegramId);

  const daysInGroup = member
    ? ((Date.now() - new Date(member.joined_at)) / (1000 * 60 * 60 * 24)).toFixed(1)
    : null;

  await db.saveEvent(clientId, "betClicks", {
    telegramId,
    firstName: member?.first_name,
    username: member?.username,
    daysInGroup,
  });

  console.log(`[BET] ${clientId} | TG:${telegramId} | ${daysInGroup}d no grupo`);

  if (member) {
    await sendCapiEvent(client, client.events.betClick, {
      telegramId,
      username: member.username,
      firstName: member.first_name,
    }, { days_in_group: daysInGroup });
  }

  res.redirect(client.affiliateLink);
});

// ── WEBHOOK DO TELEGRAM ───────────────────────────────────────
app.post("/webhook/:clientId", async (req, res) => {
  res.sendStatus(200);
  const { clientId } = req.params;
  const update = req.body;
  const client = clients[clientId];
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
  const visitorData = getVisitor(`tg_${user.id}`);
  const fbclid = visitorData?.fbclid || null;

  const oldStatus = old_chat_member?.status;
  const newStatus = new_chat_member?.status;

  const entrou = (oldStatus === "left" || oldStatus === "kicked") &&
    (newStatus === "member" || newStatus === "administrator" || newStatus === "creator");

  const saiu = (oldStatus === "member" || oldStatus === "administrator" || oldStatus === "restricted") &&
    (newStatus === "left" || newStatus === "kicked");

  if (entrou) {
    await db.saveMemberJoined(clientId, user.id, userData);

    const passouPeloBot = getVisitor(`tg_${user.id}`);
    if (passouPeloBot) {
      await db.saveEvent(clientId, "entered", { ...userData, fbclid });
      console.log(`[ENTRADA] ${user.first_name} | fbclid:${fbclid || "none"}`);
      await sendCapiEvent(client, client.events.enteredChannel, { ...userData, fbclid }, { group_title: chat.title });
    } else {
      console.log(`[ENTRADA IGNORADA] ${user.first_name} | não passou pelo bot`);
    }
  }

  if (saiu) {
    const memberData = await db.saveMemberLeft(clientId, user.id);
    const days = memberData ? parseFloat(memberData.days_in_group) : 0;
    const hotLeadDays = client.hotLeadDays || 3;

    const eventType = days < 1 ? "coldLeads" : days >= hotLeadDays ? "hotLeads" : "exited";
    await db.saveEvent(clientId, eventType, { ...userData, daysInGroup: days });

    console.log(`[SAÍDA] ${user.first_name} | ${days.toFixed(1)} dias | ${eventType}`);
    await sendCapiEvent(client, client.events.exitedGroup, { ...userData, fbclid }, { days_in_group: days });
  }
}

// ── MENSAGEM PARA O BOT ───────────────────────────────────────
async function handleBotMessage(client, clientId, message) {
  const user = message.from;
  if (!user || user.is_bot) return;
  const text = message.text || "";

  if (text.startsWith("/start")) {
    const visitorId = text.split(" ")[1];
    if (visitorId) {
      const visitor = getVisitor(visitorId);
      if (visitor) {
        saveVisitor(`tg_${user.id}`, { ...visitor, telegramId: user.id });
        console.log(`[BOT] /start | visitor:${visitorId} | fbclid:${visitor.fbclid || "none"}`);
      }
    }
    if (client.groupLink) {
      await botSend(client.botToken, user.id,
        `Olá ${user.first_name}! Clique aqui para entrar no grupo 👇\n${client.groupLink}`
      );
    }
    return;
  }

  // Mensagem do expert → publica no grupo com botão
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
      inline_keyboard: [[{
        text: "🎯 Acessar casa de aposta",
        callback_data: `bet:${clientId}`,
      }]]
    }
  }).catch(e => console.error("[PUBLISH]", e.message));
  console.log(`[EXPERT] Mensagem publicada | ${clientId}`);
}

// ── CLIQUE NO BOTÃO INLINE ────────────────────────────────────
async function handleCallbackQuery(client, clientId, callbackQuery) {
  const { data, from, id } = callbackQuery;

  await axios.post(`https://api.telegram.org/bot${client.botToken}/answerCallbackQuery`, {
    callback_query_id: id,
  }).catch(() => {});

  if (data === `bet:${clientId}`) {
    const member = await db.getMemberDB(clientId, from.id);
    await db.saveMemberBetClick(clientId, from.id);

    const daysInGroup = member
      ? ((Date.now() - new Date(member.joined_at)) / (1000 * 60 * 60 * 24)).toFixed(1)
      : "?";

    await db.saveEvent(clientId, "betClicks", {
      telegramId: from.id,
      firstName: from.first_name,
      username: from.username,
      daysInGroup,
    });

    console.log(`[BET CLICK] ${from.first_name} | ${daysInGroup}d no grupo`);

    const betLink = `https://telegram-tracker-production.up.railway.app/bet/${clientId}/${from.id}`;
    await botSend(client.botToken, from.id, `Clique aqui para acessar 👇\n${betLink}`);

    if (member) {
      await sendCapiEvent(client, client.events.betClick, {
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name,
      }, { days_in_group: daysInGroup });
    }
  }
}

// ── HELPER ────────────────────────────────────────────────────
async function botSend(botToken, chatId, text) {
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId, text,
  }).catch(e => console.error("[BOT SEND]", e.message));
}

// ── INICIALIZAÇÃO ─────────────────────────────────────────────
(async () => {
  await db.initDB();
  app.listen(PORT, () => {
    console.log(`\n✅ Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: /dashboard`);
    console.log(`📋 Clientes: ${Object.keys(clients).join(", ")}\n`);
  });
})();
