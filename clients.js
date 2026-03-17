// clients.js
// ─────────────────────────────────────────────────────────────
// Cada objeto é um cliente (uma campanha / empresa).
// Para adicionar um novo cliente, basta copiar um bloco e preencher.
//
// Como obter cada valor:
//   botToken      → @BotFather no Telegram → /newbot
//   chatId        → api.telegram.org/bot<TOKEN>/getUpdates (negativo ex: -1001234567890)
//   pixelId       → Meta Business Manager → Gerenciador de Eventos → Pixel → ID
//   capiToken     → Meta Business Manager → Pixel → Configurações → Token de Acesso (CAPI)
//   pixelTestCode → Opcional. Events Manager → Testar Eventos → código de teste (ex: TEST12345)
// ─────────────────────────────────────────────────────────────

const clients = {

  // ── CLIENTE 1 ──────────────────────────────────────────────
  "giovani-embaixador": {
    name: "Giovani Embaixador",
    botToken: process.env.CLIENT1_BOT_TOKEN,
    chatId: process.env.CLIENT1_CHAT_ID,           // ex: "-1001788683675"
    pixelId: process.env.CLIENT1_PIXEL_ID,         // ex: "1237762288544453"
    capiToken: process.env.CLIENT1_CAPI_TOKEN,
    pixelTestCode: process.env.CLIENT1_TEST_CODE || null,  // remove em produção

    // Nomes dos eventos (personalizáveis por cliente)
    events: {
      enteredChannel: "EnteredChannel",
      exitedGroup:    "ExitedGroup",
      interactedBot:  "InteractedBot",
    }
  },

  // ── CLIENTE 2 (exemplo de como adicionar mais) ─────────────
  // "outro-cliente": {
  //   name: "Outro Cliente",
  //   botToken: process.env.CLIENT2_BOT_TOKEN,
  //   chatId: process.env.CLIENT2_CHAT_ID,
  //   pixelId: process.env.CLIENT2_PIXEL_ID,
  //   capiToken: process.env.CLIENT2_CAPI_TOKEN,
  //   pixelTestCode: null,
  //   events: {
  //     enteredChannel: "EnteredChannel",
  //     exitedGroup: "ExitedGroup",
  //     interactedBot: "InteractedBot",
  //   }
  // },

};

module.exports = clients;
