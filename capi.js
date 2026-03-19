// capi.js
const axios = require("axios");
const crypto = require("crypto");

const META_API_VERSION = "v19.0";
const META_CAPI_URL = (pixelId) =>
  `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;

const hash = (val) => val
  ? crypto.createHash("sha256").update(String(val).trim().toLowerCase()).digest("hex")
  : undefined;

async function sendCapiEvent(client, eventName, userData = {}, customData = {}) {
  const timestamp = Math.floor(Date.now() / 1000);

  // Formata fbc a partir do fbclid
  const fbc = userData.fbclid
    ? `fb.1.${timestamp}.${userData.fbclid}`
    : userData.fbc || undefined;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: timestamp,
        action_source: "other",

        user_data: {
          // Identificação
          external_id: hash(userData.telegramId),
          client_ip_address: userData.ip || undefined,
          client_user_agent: userData.userAgent || undefined,

          // Atribuição Facebook
          fbc: fbc,
          fbp: userData.fbp || undefined,

          // Localização (hasheado)
          ct:  userData.city    ? hash(userData.city)    : undefined,
          st:  userData.state   ? hash(userData.state)   : undefined,
          country: userData.country ? hash(userData.country) : undefined,
        },

        custom_data: {
          telegram_user_id: userData.telegramId,
          telegram_username: userData.username || null,
          fbclid: userData.fbclid || null,
          ...customData,
        },
      },
    ],
    ...(client.pixelTestCode && { test_event_code: client.pixelTestCode }),
  };

  try {
    const response = await axios.post(META_CAPI_URL(client.pixelId), payload, {
      params: { access_token: client.capiToken },
      headers: { "Content-Type": "application/json" },
    });

    console.log(`[CAPI ✓] ${client.name} → ${eventName} | fbclid:${userData.fbclid || "none"} | fbc:${fbc ? "sim" : "não"} | fbp:${userData.fbp ? "sim" : "não"}`);
    return { success: true, data: response.data };

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error(`[CAPI ✗] ${client.name} → ${eventName} | Erro:`, errData);
    return { success: false, error: errData };
  }
}

module.exports = { sendCapiEvent };
