// clients.js
// ─────────────────────────────────────────────────────────────
// Para adicionar um cliente, copie um bloco e preencha.
// Variáveis de ambiente no Railway: CLIENT2_*, CLIENT3_*, etc.
// ─────────────────────────────────────────────────────────────

const clients = {

  // ── CLIENTE 1 ──────────────────────────────────────────────
  "giovani-embaixador": {
    name: "Giovani Embaixador",
    botToken:     process.env.CLIENT1_BOT_TOKEN,
    botUsername:  process.env.CLIENT1_BOT_USERNAME,   // sem @
    chatId:       process.env.CLIENT1_CHAT_ID,
    groupLink:    process.env.CLIENT1_GROUP_LINK,     // link de convite do grupo
    affiliateLink: process.env.CLIENT1_AFFILIATE_LINK, // link da casa de aposta
    expertId:     process.env.CLIENT1_EXPERT_ID,      // Telegram ID numérico do expert
    pixelId:      process.env.CLIENT1_PIXEL_ID,
    capiToken:    process.env.CLIENT1_CAPI_TOKEN,
    pixelTestCode: process.env.CLIENT1_TEST_CODE || null,
    hotLeadDays: 3, // dias no grupo para considerar lead quente
    events: {
      enteredChannel: "EnteredChannel",
      exitedGroup:    "ExitedGroup",
      betClick:       "BetClick",
    }
  },

  // ── CLIENTE 2 ──────────────────────────────────────────────
  // "nome-do-cliente-2": {
  //   name: "Nome do Cliente 2",
  //   botToken:      process.env.CLIENT2_BOT_TOKEN,
  //   botUsername:   process.env.CLIENT2_BOT_USERNAME,
  //   chatId:        process.env.CLIENT2_CHAT_ID,
  //   groupLink:     process.env.CLIENT2_GROUP_LINK,
  //   affiliateLink: process.env.CLIENT2_AFFILIATE_LINK,
  //   expertId:      process.env.CLIENT2_EXPERT_ID,
  //   pixelId:       process.env.CLIENT2_PIXEL_ID,
  //   capiToken:     process.env.CLIENT2_CAPI_TOKEN,
  //   pixelTestCode: null,
  //   hotLeadDays: 3,
  //   events: {
  //     enteredChannel: "EnteredChannel",
  //     exitedGroup:    "ExitedGroup",
  //     betClick:       "BetClick",
  //   }
  // },

  // ── CLIENTE 3 ──────────────────────────────────────────────
  // "nome-do-cliente-3": {
  //   name: "Nome do Cliente 3",
  //   botToken:      process.env.CLIENT3_BOT_TOKEN,
  //   botUsername:   process.env.CLIENT3_BOT_USERNAME,
  //   chatId:        process.env.CLIENT3_CHAT_ID,
  //   groupLink:     process.env.CLIENT3_GROUP_LINK,
  //   affiliateLink: process.env.CLIENT3_AFFILIATE_LINK,
  //   expertId:      process.env.CLIENT3_EXPERT_ID,
  //   pixelId:       process.env.CLIENT3_PIXEL_ID,
  //   capiToken:     process.env.CLIENT3_CAPI_TOKEN,
  //   pixelTestCode: null,
  //   hotLeadDays: 3,
  //   events: {
  //     enteredChannel: "EnteredChannel",
  //     exitedGroup:    "ExitedGroup",
  //     betClick:       "BetClick",
  //   }
  // },

};

module.exports = clients;
