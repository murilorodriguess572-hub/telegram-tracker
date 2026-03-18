// clients.js
const clients = {
  "giovani-embaixador": {
    name: "Giovani Embaixador",
    botToken: process.env.CLIENT1_BOT_TOKEN,
    botUsername: process.env.CLIENT1_BOT_USERNAME,  // ex: "teste_hypebot" (sem @)
    chatId: process.env.CLIENT1_CHAT_ID,
    groupLink: process.env.CLIENT1_GROUP_LINK,      // ex: "https://t.me/+xlijuzUkoQ9iYTlx"
    pixelId: process.env.CLIENT1_PIXEL_ID,
    capiToken: process.env.CLIENT1_CAPI_TOKEN,
    pixelTestCode: process.env.CLIENT1_TEST_CODE || null,
    events: {
      enteredChannel: "EnteredChannel",
      exitedGroup: "ExitedGroup",
      interactedBot: "InteractedBot",
    }
  },
};

module.exports = clients;
