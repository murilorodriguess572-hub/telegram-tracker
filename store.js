// store.js — apenas visitantes da LP em memória (membros e eventos no PostgreSQL)
const visitors = new Map();
const VISITOR_TTL = 30 * 60 * 1000;

function saveVisitor(visitorId, data) {
  visitors.set(visitorId, { ...data, timestamp: Date.now() });
  setTimeout(() => visitors.delete(visitorId), VISITOR_TTL);
}

function getVisitor(visitorId) {
  return visitors.get(visitorId) || null;
}

module.exports = { saveVisitor, getVisitor };
