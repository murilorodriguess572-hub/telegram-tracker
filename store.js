// store.js
const crypto = require("crypto");

// Visitantes da LP: visitorId → { fbclid, ip, userAgent, clientId }
const visitors = new Map();

// Membros do grupo: "clientId:telegramId" → { joinedAt, firstName, username }
const members = new Map();

// Métricas do funil por cliente
const metrics = new Map();

const VISITOR_TTL = 30 * 60 * 1000; // 30 minutos

// ── VISITANTES ────────────────────────────────────────────────

function saveVisitor(visitorId, data) {
  visitors.set(visitorId, { ...data, timestamp: Date.now() });
  setTimeout(() => visitors.delete(visitorId), VISITOR_TTL);
}

function getVisitor(visitorId) {
  return visitors.get(visitorId) || null;
}

// ── MEMBROS DO GRUPO ──────────────────────────────────────────

function memberJoined(clientId, telegramId, userData) {
  const key = `${clientId}:${telegramId}`;
  members.set(key, {
    telegramId,
    firstName: userData.firstName,
    username: userData.username,
    joinedAt: Date.now(),
    clickedBet: false,
    clickedAt: null,
  });
}

function memberLeft(clientId, telegramId) {
  const key = `${clientId}:${telegramId}`;
  const member = members.get(key);
  if (!member) return null;

  const daysInGroup = ((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)).toFixed(1);
  members.delete(key);

  return { ...member, daysInGroup: parseFloat(daysInGroup) };
}

function memberClickedBet(clientId, telegramId) {
  const key = `${clientId}:${telegramId}`;
  const member = members.get(key);
  if (member) {
    member.clickedBet = true;
    member.clickedAt = Date.now();
  }
  return member || null;
}

function getMember(clientId, telegramId) {
  return members.get(`${clientId}:${telegramId}`) || null;
}

function getAllMembers(clientId) {
  const result = [];
  for (const [key, data] of members.entries()) {
    if (key.startsWith(`${clientId}:`)) result.push(data);
  }
  return result;
}

// ── MÉTRICAS ──────────────────────────────────────────────────

function getMetrics(clientId) {
  if (!metrics.has(clientId)) {
    metrics.set(clientId, {
      pageviews: 0,
      clicks: 0,
      entered: 0,
      exited: 0,
      betClicks: 0,
      hotLeads: 0,    // ficou mais de 3 dias
      coldLeads: 0,   // saiu em menos de 24h
      history: [],
    });
  }
  return metrics.get(clientId);
}

function incrementMetric(clientId, field) {
  const m = getMetrics(clientId);
  m[field] = (m[field] || 0) + 1;
  m.history.unshift({ event: field, timestamp: new Date().toISOString() });
  if (m.history.length > 100) m.history.pop();
}

function getAllMetrics() {
  const result = {};
  for (const [clientId, data] of metrics.entries()) {
    result[clientId] = data;
  }
  return result;
}

module.exports = {
  saveVisitor, getVisitor,
  memberJoined, memberLeft, memberClickedBet, getMember, getAllMembers,
  incrementMetric, getMetrics, getAllMetrics,
};
