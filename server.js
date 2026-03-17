// server.js
// ─────────────────────────────────────────────────────────────
// Backend principal do Telegram Tracker
// Recebe webhooks do Telegram e dispara eventos no Meta via CAPI
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const { sendCapiEvent } = require("./capi");
const clients = require("./clients");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
// ROTA DE SAÚDE — Railway/Render usam isso pra saber se o app
// está rodando. Acesse: https://seu-dominio.com/health
// ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    clients: Object.keys(clients),
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────
// WEBHOOK DO TELEGRAM — Rota por cliente
// URL: https://seu-dominio.com/webhook/:clientId
//
// Cada cliente tem sua própria rota, então o mesmo servidor
// gerencia múltiplas campanhas sem interferência
// ─────────────────────────────────────────────────────────────
app.post("/webhook/:clientId", async (req, res) => {
  // Responde 200 imediatamente — o Telegram requer resposta rápida
  res.sendStatus(200);

  const { clientId } = req.params;
  const update = req.body;

  // Verifica se o cliente existe
  const client = clients[clientId];
  if (!client) {
    console.warn(`[WEBHOOK] Cliente não encontrado: ${clientId}`);
    return;
  }

  console.log(`\n[WEBHOOK] ${client.name} → update recebido:`, JSON.stringify(update, null, 2));

  // ── EVENTO: CHAT_MEMBER (entrada/saída/aprovação no grupo) ──
  // O Telegram envia "chat_member" quando o status de um membro muda
  if (update.chat_member) {
    await handleChatMember(client, update.chat_member);
    return;
  }

  // ── EVENTO: MY_CHAT_MEMBER (bot adicionado/removido) ────────
  // Útil para saber se o bot ainda está no grupo
  if (update.my_chat_member) {
    const status = update.my_chat_member.new_chat_member?.status;
    console.log(`[BOT STATUS] ${client.name} → Bot agora é: ${status}`);
    return;
  }

  // ── EVENTO: MENSAGEM PARA O BOT ─────────────────────────────
  // Quando o usuário interage com o bot (ex: /start após clicar no link)
  if (update.message) {
    await handleBotMessage(client, update.message);
    return;
  }
});

// ─────────────────────────────────────────────────────────────
// HANDLER: Entrada e saída no grupo
// ─────────────────────────────────────────────────────────────
async function handleChatMember(client, chatMember) {
  const { new_chat_member, old_chat_member, from, chat } = chatMember;

  // Confirma que é o chat correto (segurança)
  if (String(chat.id) !== String(client.chatId)) {
    console.warn(`[CHAT_MEMBER] Chat ID não corresponde: recebido ${chat.id}, esperado ${client.chatId}`);
    return;
  }

  const user = new_chat_member?.user || from;
  const userData = {
    telegramId: user.id,
    username: user.username,
    firstName: user.first_name,
  };

  const oldStatus = old_chat_member?.status; // "left", "kicked", "member", "administrator", etc.
  const newStatus = new_chat_member?.status;

  console.log(`[CHAT_MEMBER] ${client.name} | @${user.username || user.first_name} | ${oldStatus} → ${newStatus}`);

  // ── ENTROU no grupo ──────────────────────────────────────────
  // old: "left" ou "kicked" → new: "member" ou "administrator"
  const entrou =
    (oldStatus === "left" || oldStatus === "kicked") &&
    (newStatus === "member" || newStatus === "administrator" || newStatus === "creator");

  if (entrou) {
    console.log(`[EVENTO] Entrada detectada: ${user.first_name} (@${user.username})`);
    await sendCapiEvent(client, client.events.enteredChannel, userData, {
      group_title: chat.title,
      group_id: chat.id,
    });
    return;
  }

  // ── SAIU do grupo ────────────────────────────────────────────
  // old: "member" ou "administrator" → new: "left" ou "kicked"
  const saiu =
    (oldStatus === "member" || oldStatus === "administrator" || oldStatus === "restricted") &&
    (newStatus === "left" || newStatus === "kicked");

  if (saiu) {
    console.log(`[EVENTO] Saída detectada: ${user.first_name} (@${user.username})`);
    await sendCapiEvent(client, client.events.exitedGroup, userData, {
      group_title: chat.title,
      group_id: chat.id,
      was_kicked: newStatus === "kicked",
    });
    return;
  }
}

// ─────────────────────────────────────────────────────────────
// HANDLER: Interação com o Bot (ex: usuário manda /start)
// ─────────────────────────────────────────────────────────────
async function handleBotMessage(client, message) {
  const user = message.from;
  if (!user || user.is_bot) return;

  const userData = {
    telegramId: user.id,
    username: user.username,
    firstName: user.first_name,
  };

  // Só rastreia o /start (primeiro contato)
  if (message.text === "/start") {
    console.log(`[EVENTO] InteractedBot: ${user.first_name} enviou /start`);
    await sendCapiEvent(client, client.events.interactedBot, userData, {
      message_text: "/start",
    });
  }
}

// ─────────────────────────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando na porta ${PORT}`);
  console.log(`📋 Clientes ativos: ${Object.keys(clients).join(", ")}`);
  console.log(`\n🔗 Configure os webhooks do Telegram para:`);

  Object.keys(clients).forEach((clientId) => {
    console.log(`   → /webhook/${clientId}  (${clients[clientId].name})`);
  });

  console.log(`\n💡 Health check: GET /health\n`);
});
