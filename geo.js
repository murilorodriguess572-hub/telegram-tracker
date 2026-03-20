// geo.js
// Geolocalização por IP usando ip-api.com (gratuito, sem chave)
// Limite: 45 requisições/minuto no plano gratuito
const axios = require("axios");

const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora

async function getGeoFromIP(ip) {
  if (!ip || ip === "127.0.0.1" || ip === "::1") return {};

  // Verifica cache
  const cached = cache.get(ip);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=city,regionName,countryCode`, {
      timeout: 2000,
    });

    if (res.data?.city) {
      const data = {
        city:    res.data.city?.toLowerCase().trim() || null,
        state:   res.data.regionName?.toLowerCase().trim() || null,
        country: res.data.countryCode?.toLowerCase().trim() || null,
      };
      cache.set(ip, { data, ts: Date.now() });
      return data;
    }
  } catch (e) {
    // Silencioso — geolocalização é opcional
  }

  return {};
}

module.exports = { getGeoFromIP };
