// setup-webhooks.js
// ─────────────────────────────────────────────────────────────
// Utilitário para registrar os webhooks do Telegram
// Execute UMA VEZ após subir o servidor:
//   node setup-webhooks.js --url https://seu-dominio.railway.app
//
// Comandos disponíveis:
//   --url <URL>    Registra os webhooks de todos os clientes
//   --check        Verifica o status atual dos webhooks
//   --delete       Remove todos os webhooks (para resetar)
// ─────────────────────────────────────────────────────────────

require("dotenv").config();
const axios = require("axios");
const clients = require("./clients");

const args = process.argv.slice(2);
const command = args[0];
const serverUrl = args[1];

async function registerWebhooks(baseUrl) {
  console.log(`\n📡 Registrando webhooks para: ${baseUrl}\n`);

  for (const [clientId, client] of Object.entries(clients)) {
    const webhookUrl = `${baseUrl}/webhook/${clientId}`;
    const telegramUrl = `https://api.telegram.org/bot${client.botToken}/setWebhook`;

    try {
      const res = await axios.post(telegramUrl, {
        url: webhookUrl,
        // Só recebe estes tipos de update (mais eficiente)
        allowed_updates: ["chat_member", "my_chat_member", "message"],
        drop_pending_updates: true,
      });

      if (res.data.ok) {
        console.log(`✅ ${client.name}`);
        console.log(`   Webhook: ${webhookUrl}`);
      } else {
        console.log(`❌ ${client.name}: ${res.data.description}`);
      }
    } catch (err) {
      console.error(`❌ ${client.name}: ${err.response?.data?.description || err.message}`);
    }

    console.log();
  }
}

async function checkWebhooks() {
  console.log(`\n🔍 Verificando webhooks atuais...\n`);

  for (const [clientId, client] of Object.entries(clients)) {
    const url = `https://api.telegram.org/bot${client.botToken}/getWebhookInfo`;

    try {
      const res = await axios.get(url);
      const info = res.data.result;

      console.log(`📌 ${client.name} (${clientId})`);
      console.log(`   URL: ${info.url || "(nenhuma)"}`);
      console.log(`   Pendentes: ${info.pending_update_count}`);
      if (info.last_error_message) {
        console.log(`   ⚠️  Último erro: ${info.last_error_message}`);
      }
    } catch (err) {
      console.error(`❌ ${client.name}: ${err.message}`);
    }

    console.log();
  }
}

async function deleteWebhooks() {
  console.log(`\n🗑️  Removendo todos os webhooks...\n`);

  for (const [clientId, client] of Object.entries(clients)) {
    const url = `https://api.telegram.org/bot${client.botToken}/deleteWebhook`;

    try {
      const res = await axios.post(url, { drop_pending_updates: true });
      console.log(`${res.data.ok ? "✅" : "❌"} ${client.name}`);
    } catch (err) {
      console.error(`❌ ${client.name}: ${err.message}`);
    }
  }
}

// Executa o comando
(async () => {
  if (command === "--url" && serverUrl) {
    await registerWebhooks(serverUrl.replace(/\/$/, ""));
  } else if (command === "--check") {
    await checkWebhooks();
  } else if (command === "--delete") {
    await deleteWebhooks();
  } else {
    console.log(`
Uso:
  node setup-webhooks.js --url https://seu-dominio.railway.app
  node setup-webhooks.js --check
  node setup-webhooks.js --delete
    `);
  }
})();
