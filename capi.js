// capi.js
// ─────────────────────────────────────────────────────────────
// Envia eventos para o Facebook via Conversions API (server-side)
// Documentação: https://developers.facebook.com/docs/marketing-api/conversions-api
// ─────────────────────────────────────────────────────────────

const axios = require("axios");

const META_API_VERSION = "v19.0";
const META_CAPI_URL = (pixelId) =>
  `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;

/**
 * Envia um evento para o Meta via Conversions API
 *
 * @param {object} client     - Objeto do cliente (de clients.js)
 * @param {string} eventName  - Nome do evento (ex: "EnteredChannel")
 * @param {object} userData   - Dados do usuário (ex: { telegram_id, first_name })
 * @param {object} customData - Dados extras opcionais
 */
async function sendCapiEvent(client, eventName, userData = {}, customData = {}) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Monta o payload no formato exigido pelo Meta
  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: timestamp,
        action_source: "other",   // "other" = origem não-web (bot, backend, etc.)

        // Dados do usuário — quanto mais campos, melhor a correspondência
        user_data: {
          // external_id: hash SHA256 de um ID único do usuário
          // Usamos o ID do Telegram como identificador externo
          external_id: userData.telegramId
            ? hashValue(String(userData.telegramId))
            : undefined,

          // Se tiver email (ex: coletado na LP), inclua aqui hasheado
          // em: userData.email ? hashValue(userData.email.toLowerCase().trim()) : undefined,
        },

        // Dados customizados do evento
        custom_data: {
          telegram_user_id: userData.telegramId,
          telegram_username: userData.username || null,
          telegram_first_name: userData.firstName || null,
          ...customData,
        },
      },
    ],

    // Código de teste — só use durante testes no Events Manager
    // Remove automaticamente quando pixelTestCode não está definido
    ...(client.pixelTestCode && { test_event_code: client.pixelTestCode }),
  };

  try {
    const response = await axios.post(META_CAPI_URL(client.pixelId), payload, {
      params: { access_token: client.capiToken },
      headers: { "Content-Type": "application/json" },
    });

    console.log(`[CAPI ✓] ${client.name} → ${eventName} | Resultado:`, response.data);
    return { success: true, data: response.data };

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error(`[CAPI ✗] ${client.name} → ${eventName} | Erro:`, errData);
    return { success: false, error: errData };
  }
}

/**
 * Gera hash SHA256 de um valor (exigido pelo Meta para dados pessoais)
 */
function hashValue(value) {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = { sendCapiEvent };
