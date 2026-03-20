const express = require("express");
const axios = require("axios");
const db = require("../db");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();
router.use(authMiddleware);

router.get("/bot-status/:botId", async (req, res) => {
  const bot = await db.getBotById(req.params.botId);
  if (!bot) return res.status(404).json({ error: "Bot não encontrado" });

  const result = { botId: bot.id, slug: bot.slug, name: bot.name, webhook: null, chat: null };

  try {
    // Verifica webhook
    const wh = await axios.get(
      `https://api.telegram.org/bot${bot.bot_token}/getWebhookInfo`,
      { timeout: 4000 }
    );
    const info = wh.data.result;
    result.webhook = {
      connected: !!info.url && info.url.includes(bot.slug),
      url: info.url || null,
      pending: info.pending_update_count || 0,
      lastError: info.last_error_message || null,
    };
  } catch {
    result.webhook = { connected: false, url: null, error: "Timeout ou token inválido" };
  }

  try {
    // Verifica se bot está no grupo
    const chat = await axios.get(
      `https://api.telegram.org/bot${bot.bot_token}/getChat`,
      { params: { chat_id: bot.chat_id }, timeout: 4000 }
    );
    result.chat = {
      connected: chat.data.ok,
      title: chat.data.result?.title || null,
      type: chat.data.result?.type || null,
    };
  } catch {
    result.chat = { connected: false, title: null, error: "Bot não está no grupo ou chat_id inválido" };
  }

  res.json(result);
});

module.exports = router;
