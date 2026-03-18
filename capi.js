// capi.js
const axios = require("axios");

const META_API_VERSION = "v19.0";
const META_CAPI_URL = (pixelId) =>
  `https://graph.facebook.com/${META_API_VERSION}/${pixelId}/events`;

async function sendCapiEvent(client, eventName, userData = {}, customData = {}) {
  const timestamp = Math.floor(Date.now() / 1000);
  const crypto = require("crypto");

  const hash = (val) => val ? crypto.createHash("sha256").update(String(val)).digest("hex") : undefined;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: timestamp,
        action_source: "other",
        user_data: {
          external_id: hash(userData.telegramId),
          // fbc é o formato que o Facebook usa para o fbclid
          fbc: userData.fbclid ? `fb.1.${timestamp}.${userData.fbclid}` : undefined,
        },
        custom_data: {
          telegram_user_id: userData.telegramId,
          telegram_username: userData.username || null,
          telegram_first_name: userData.firstName || null,
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

    console.log(`[CAPI ✓] ${client.name} → ${eventName} | fbclid:${userData.fbclid || "none"}`);
    return { success: true, data: response.data };

  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error(`[CAPI ✗] ${client.name} → ${eventName} | Erro:`, errData);
    return { success: false, error: errData };
  }
}

module.exports = { sendCapiEvent };
