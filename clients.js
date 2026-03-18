// clients.js
// ─────────────────────────────────────────────────────────────
// Para adicionar um cliente, copie um bloco e preencha.
// Variáveis de ambiente no Railway: CLIENT2_*, CLIENT3_*, etc.
// ─────────────────────────────────────────────────────────────

const clients = {

  // ── CLIENTE 1 ──────────────────────────────────────────────
  "eduarda-teste-1": {
    name: "Eduarda Teste 1",
    botToken:     process.env.EDUARDA1_BOT_TOKEN,
    botUsername:  process.env.EDUARDA1_BOT_USERNAME,   // sem @
    chatId:       process.env.EDUARDA1_CHAT_ID,
    groupLink:    process.env.EDUARDA1_GROUP_LINK,     // link de convite do grupo
    affiliateLink: process.env.EDUARDA1_AFFILIATE_LINK, // link da casa de aposta
    expertId:     process.env.EDUARDA1_EXPERT_ID,      // Telegram ID numérico do expert
    pixelId:      process.env.EDUARDA1_PIXEL_ID,
    capiToken:    process.env.EDUARDA1_CAPI_TOKEN,
    pixelTestCode: process.env.EDUARDA1_TEST_CODE || null,
    hotLeadDays: 3, // dias no grupo para considerar lead quente
    events: {
      enteredChannel: "EnteredChannel1",
      exitedGroup:    "ExitedGroup1",
      betClick:       "BetClick1",
    }
  },

  // ── CLIENTE 2 ──────────────────────────────────────────────
  // "eduarda-teste-2": {
  //   name: "Eduarda Teste 2",
  //   botToken:      process.env.EDUARDA2_BOT_TOKEN,
  //   botUsername:   process.env.EDUARDA2_BOT_USERNAME,
  //   chatId:        process.env.EDUARDA2_CHAT_ID,
  //   groupLink:     process.env.EDUARDA2_GROUP_LINK,
  //   affiliateLink: process.env.EDUARDA2_AFFILIATE_LINK,
  //   expertId:      process.env.EDUARDA2_EXPERT_ID,
  //   pixelId:       process.env.EDUARDA2_PIXEL_ID,
  //   capiToken:     process.env.EDUARDA2_CAPI_TOKEN,
  //   pixelTestCode: null,
  //   hotLeadDays: 3,
  //   events: {
  //     enteredChannel: "EnteredChannel2",
  //     exitedGroup:    "ExitedGroup2",
  //     betClick:       "BetClick2",
  //   }
  // },

  // ── CLIENTE 3 ──────────────────────────────────────────────
  // "eduarda-teste-3": {
  //   name: "Nome do Cliente 3",
  //   botToken:      process.env.EDUARDA3_BOT_TOKEN,
  //   botUsername:   process.env.EDUARDA3_BOT_USERNAME,
  //   chatId:        process.env.EDUARDA3_CHAT_ID,
  //   groupLink:     process.env.EDUARDA3_GROUP_LINK,
  //   affiliateLink: process.env.EDUARDA3_AFFILIATE_LINK,
  //   expertId:      process.env.EDUARDA3_EXPERT_ID,
  //   pixelId:       process.env.EDUARDA3_PIXEL_ID,
  //   capiToken:     process.env.EDUARDA3_CAPI_TOKEN,
  //   pixelTestCode: null,
  //   hotLeadDays: 3,
  //   events: {
  //     enteredChannel: "EnteredChannel3",
  //     exitedGroup:    "ExitedGroup3",
  //     betClick:       "BetClick3",
  //   }
  // },

};

module.exports = clients;
