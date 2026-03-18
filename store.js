// store.js
// ─────────────────────────────────────────────────────────────
// Armazenamento em memória para fbclid e métricas do funil
// ─────────────────────────────────────────────────────────────

// Visitantes: visitorId → { fbclid, ip, userAgent, timestamp }
const visitors = new Map();

// Métricas do funil por cliente
const metrics = new Map();

// Tempo máximo que um visitante fica salvo (30 minutos)
const VISITOR_TTL = 30 * 60 * 1000;

// ── VISITANTES ────────────────────────────────────────────────

function saveVisitor(visitorId, data) {
  visitors.set(visitorId, {
    ...data,
    timestamp: Date.now(),
  });

  // Remove automaticamente após 30 minutos
  setTimeout(() => visitors.delete(visitorId), VISITOR_TTL);
}

function getVisitor(visitorId) {
  return visitors.get(visitorId) || null;
}

// ── MÉTRICAS ──────────────────────────────────────────────────

function getMetrics(clientId) {
  if (!metrics.has(clientId)) {
    metrics.set(clientId, {
      pageviews: 0,
      clicks: 0,
      entered: 0,
      exited: 0,
      history: [], // últimos 50 eventos
    });
  }
  return metrics.get(clientId);
}

function incrementMetric(clientId, field) {
  const m = getMetrics(clientId);
  m[field] = (m[field] || 0) + 1;

  // Salva no histórico
  m.history.unshift({
    event: field,
    timestamp: new Date().toISOString(),
  });

  // Mantém só os últimos 50
  if (m.history.length > 50) m.history.pop();
}

function getAllMetrics() {
  const result = {};
  for (const [clientId, data] of metrics.entries()) {
    result[clientId] = data;
  }
  return result;
}

module.exports = { saveVisitor, getVisitor, incrementMetric, getMetrics, getAllMetrics };
