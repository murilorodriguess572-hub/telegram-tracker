// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { sendCapiEvent } = require("./capi");
const clients = require("./clients");
const { saveVisitor, getVisitor, incrementMetric, getAllMetrics } = require("./store");
const { renderDashboard } = require("./dashboard");

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

// ── DASHBOARD ────────────────────────────────────────────────
app.get("/dashboard", (req, res) => {
  res.send(renderDashboard(getAllMetrics(), clients));
});

// ── HEALTH ───────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", clients: Object.keys(clients), timestamp: new Date().toISOString() });
});

// ── PAGE VIEW DA LP ──────────────────────────────────────────
// POST /track/:clientId  { visitorId, fbclid, userAgent }
app.post("/track/:clientId", (req, res) => {
  const { clientId } = req.params;
  const { visitorId, fbclid, userAgent } = req.body;
  const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  if (!clients[clientId]) return res.status(404).json({ error: "Cliente não encontrado" });
  if (!visitorId) return res.status(400).json({ error: "visitorId obrigatório" });

  saveVisitor(visitorId, { fbclid, ip, userAgent, clientId });
  incrementMetric(clientId, "pageviews");

  console.log(`[TRACK] PageView | ${clientId} | visitor:${visitorId} | fbclid:${fbclid || "none"}`);
  res.json({ ok: true });
});

// ── REDIRECT — botão da LP vai para cá ───────────────────────
// GET /go/:clientId/:visitorId
// Registra o clique e redireciona para o bot do Telegram
app.get("/go/:clientId/:visitorId", (req, res) => {
  const { clientId, visitorId } = req.params;
  const client = clients[clientId];

  if (!client) return res.status(404).send("Cliente não encontrado");

  incrementMetric(clientId, "clicks");
  console.log(`[CLICK] ${clientId} | visitor:${visitorId} → bot`);

  res.redirect(`https://t.me/${client.botUsername}?start=${visitorId}`);
});

// ── WEBHOOK DO TELEGRAM ───────────────────────────────────────
app.post("/webhook/:clientId", async (req, res) => {
  res.sendStatus(200);
  const { clientId } = req.params;
  const update = req.body;
  const client = clients[clientId];
  if (!client) return;

  if (update.chat_member) await handleChatMember(client, clientId, update.chat_member);
  if (update.message) await handleBotMessage(client, clientId, update.message);
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
    incrementMetric(clientId, "entered");
    console.log(`[ENTRADA] ${user.first_name} (@${user.username || "sem username"})`);
    await sendCapiEvent(client, client.events.enteredChannel, userData, { group_title: chat.title });
  }

  if (saiu) {
    incrementMetric(clientId, "exited");
    console.log(`[SAÍDA] ${user.first_name} (@${user.username || "sem username"})`);
    await sendCapiEvent(client, client.events.exitedGroup, userData, { group_title: chat.title });
  }
}

// ── /start COM visitorId ──────────────────────────────────────
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
    // Envia mensagem com link do grupo
    const groupLink = client.groupLink;
    if (groupLink) {
      await axios.post(`https://api.telegram.org/bot${client.botToken}/sendMessage`, {
        chat_id: user.id,
        text: `Olá ${user.first_name}! Clique aqui para entrar no grupo 👇\n${groupLink}`,
      }).catch(e => console.error("[BOT MSG]", e.message));
    }
  }
}

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: /dashboard`);
  console.log(`📋 Clientes: ${Object.keys(clients).join(", ")}\n`);
});
