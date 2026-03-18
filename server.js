// server.js
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { sendCapiEvent } = require("./capi");
const clients = require("./clients");
const {
  saveVisitor, getVisitor,
  memberJoined, memberLeft, memberClickedBet, getMember, getAllMembers,
  incrementMetric, getAllMetrics,
} = require("./store");
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

// ── DASHBOARD ─────────────────────────────────────────────────
app.get("/dashboard", (req, res) => {
  const allMetrics = getAllMetrics();
  const allMembers = {};
  for (const clientId of Object.keys(clients)) {
    allMembers[clientId] = getAllMembers(clientId);
  }
  res.send(renderDashboard(allMetrics, allMembers, clients));
});

// ── HEALTH ────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", clients: Object.keys(clients), timestamp: new Date().toISOString() });
});

// ── PAGE VIEW DA LP ───────────────────────────────────────────
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

// ── REDIRECT DO BOTÃO DA LP ───────────────────────────────────
app.get("/go/:clientId/:visitorId", (req, res) => {
  const { clientId, visitorId } = req.params;
  const client = clients[clientId];
  if (!client) return res.status(404).send("Cliente não encontrado");

  incrementMetric(clientId, "clicks");
  console.log(`[CLICK] ${clientId} | visitor:${visitorId} → bot`);
  res.redirect(`https://t.me/${client.botUsername}?start=${visitorId}`);
});

// ── LINK DA CASA DE APOSTA (botão inline do grupo) ────────────
// Quando membro clica no botão do grupo, passa por aqui
app.get("/bet/:clientId/:telegramId", async (req, res) => {
  const { clientId, telegramId } = req.params;
  const client = clients[clientId];
  if (!client) return res.status(404).send("Cliente não encontrado");

  const member = getMember(clientId, telegramId);
  memberClickedBet(clientId, telegramId);
  incrementMetric(clientId, "betClicks");

  const daysInGroup = member
    ? ((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)).toFixed(1)
    : "?";

  console.log(`[BET CLICK] ${clientId} | TG:${telegramId} | ${daysInGroup} dias no grupo`);

  // Dispara evento no Facebook
  if (member) {
    const userData = {
      telegramId: member.telegramId,
      username: member.username,
      firstName: member.firstName,
    };
    await sendCapiEvent(client, client.events.betClick, userData, {
      days_in_group: daysInGroup,
    });
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

  // Entrada/saída no grupo
  if (update.chat_member) await handleChatMember(client, clientId, update.chat_member);

  // Mensagem para o bot (do expert ou do usuário)
  if (update.message) await handleBotMessage(client, clientId, update.message);

  // Clique em botão inline
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
    memberJoined(clientId, user.id, userData);

    // Só dispara evento se o usuário passou pelo bot
    const passouPeloBot = getVisitor(`tg_${user.id}`);
    if (passouPeloBot) {
      incrementMetric(clientId, "entered");
      console.log(`[ENTRADA RASTREADA] ${user.first_name} | fbclid:${fbclid || "none"}`);
      await sendCapiEvent(client, client.events.enteredChannel, { ...userData, fbclid }, { group_title: chat.title });
    } else {
      console.log(`[ENTRADA IGNORADA] ${user.first_name} | não passou pelo bot`);
    }
  }

  if (saiu) {
    const memberData = memberLeft(clientId, user.id);
    incrementMetric(clientId, "exited");

    if (memberData) {
      const days = memberData.daysInGroup;
      const hotLeadDays = client.hotLeadDays || 3;

      if (days < 1) {
        incrementMetric(clientId, "coldLeads");
        console.log(`[SAÍDA FRIA] ${user.first_name} | ${days} dias no grupo`);
      } else if (days >= hotLeadDays) {
        incrementMetric(clientId, "hotLeads");
        console.log(`[SAÍDA QUENTE] ${user.first_name} | ${days} dias no grupo`);
      } else {
        console.log(`[SAÍDA] ${user.first_name} | ${days} dias no grupo`);
      }
    }

    await sendCapiEvent(client, client.events.exitedGroup, { ...userData, fbclid }, {});
  }
}

// ── MENSAGEM PARA O BOT ───────────────────────────────────────
async function handleBotMessage(client, clientId, message) {
  const user = message.from;
  if (!user || user.is_bot) return;
  const text = message.text || "";

  // /start com visitorId (vindo da LP)
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
    return;
  }
}

// ── PUBLICA MENSAGEM DO EXPERT NO GRUPO COM BOTÃO ─────────────
async function publishExpertMessage(client, clientId, text) {
  const betUrl = `https://telegram-tracker-production.up.railway.app/bet/${clientId}/TELEGRAM_ID`;

  // O botão inline usa uma URL com placeholder — o callback_query resolve o ID real
  // Aqui usamos callback_data para identificar o clique
  await axios.post(`https://api.telegram.org/bot${client.botToken}/sendMessage`, {
    chat_id: client.chatId,
    text: text,
    reply_markup: {
      inline_keyboard: [[
        {
          text: "🎯 Acessar casa de aposta",
          callback_data: `bet:${clientId}`,
        }
      ]]
    }
  }).catch(e => console.error("[PUBLISH]", e.message));

  console.log(`[EXPERT] Mensagem publicada no grupo | ${clientId}`);
}

// ── CLIQUE NO BOTÃO INLINE ────────────────────────────────────
async function handleCallbackQuery(client, clientId, callbackQuery) {
  const { data, from, id } = callbackQuery;

  // Responde ao Telegram imediatamente (obrigatório)
  await axios.post(`https://api.telegram.org/bot${client.botToken}/answerCallbackQuery`, {
    callback_query_id: id,
  }).catch(() => {});

  if (data === `bet:${clientId}`) {
    const member = getMember(clientId, from.id);
    memberClickedBet(clientId, from.id);
    incrementMetric(clientId, "betClicks");

    const daysInGroup = member
      ? ((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)).toFixed(1)
      : "?";

    console.log(`[BET CLICK] ${from.first_name} | ${daysInGroup} dias no grupo`);

    // Envia o link da casa por mensagem privada rastreada
    const betLink = `https://telegram-tracker-production.up.railway.app/bet/${clientId}/${from.id}`;
    await botSend(client.botToken, from.id,
      `Clique aqui para acessar 👇\n${betLink}`
    );

    // Dispara evento no Facebook
    if (member) {
      await sendCapiEvent(client, client.events.betClick, {
        telegramId: from.id,
        username: from.username,
        firstName: from.first_name,
      }, { days_in_group: daysInGroup });
    }
  }
}

// ── HELPER: Enviar mensagem pelo bot ──────────────────────────
async function botSend(botToken, chatId, text) {
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text,
  }).catch(e => console.error("[BOT SEND]", e.message));
}

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: /dashboard`);
  console.log(`📋 Clientes: ${Object.keys(clients).join(", ")}\n`);
});
