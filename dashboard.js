// dashboard.js
// Retorna o HTML do dashboard de métricas

function renderDashboard(allMetrics, clients) {
  const rows = Object.entries(allMetrics).map(([clientId, m]) => {
    const client = clients[clientId];
    const convClick = m.clicks > 0 ? ((m.entered / m.clicks) * 100).toFixed(1) : "0.0";
    const convPage  = m.pageviews > 0 ? ((m.entered / m.pageviews) * 100).toFixed(1) : "0.0";

    const historyRows = (m.history || []).slice(0, 10).map(h => {
      const icons = { pageviews: "👁️", clicks: "🖱️", entered: "✅", exited: "🚪" };
      const labels = { pageviews: "Page View", clicks: "Clique no botão", entered: "Entrou no grupo", exited: "Saiu do grupo" };
      const time = new Date(h.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
      return `<tr><td>${icons[h.event] || "•"}</td><td>${labels[h.event] || h.event}</td><td style="color:#888;font-size:12px">${time}</td></tr>`;
    }).join("");

    return `
      <div class="card">
        <div class="card-header">
          <span class="dot"></span>
          <strong>${client?.name || clientId}</strong>
        </div>
        <div class="metrics">
          <div class="metric">
            <span class="metric-icon">👁️</span>
            <div class="metric-value">${m.pageviews}</div>
            <div class="metric-label">Page Views</div>
          </div>
          <div class="metric">
            <span class="metric-icon">🖱️</span>
            <div class="metric-value">${m.clicks}</div>
            <div class="metric-label">Cliques no botão</div>
          </div>
          <div class="metric highlight">
            <span class="metric-icon">✅</span>
            <div class="metric-value">${m.entered}</div>
            <div class="metric-label">Entradas no grupo</div>
          </div>
          <div class="metric">
            <span class="metric-icon">🚪</span>
            <div class="metric-value">${m.exited}</div>
            <div class="metric-label">Saídas do grupo</div>
          </div>
        </div>
        <div class="conversions">
          <div class="conv-item">
            <span>Clique → Entrada</span>
            <strong>${convClick}%</strong>
          </div>
          <div class="conv-item">
            <span>Page View → Entrada</span>
            <strong>${convPage}%</strong>
          </div>
        </div>
        ${historyRows ? `
        <div class="history">
          <div class="history-title">Últimos eventos</div>
          <table>${historyRows}</table>
        </div>` : ""}
      </div>
    `;
  }).join("");

  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Telegram Tracker — Dashboard</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0f0f0f; color: #e0e0e0; padding: 24px; }
  h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
  .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
  .card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 15px; }
  .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; }
  .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
  .metric { background: #111; border-radius: 8px; padding: 14px; text-align: center; }
  .metric.highlight { border: 1px solid #22c55e22; background: #0a1a0a; }
  .metric-icon { font-size: 18px; display: block; margin-bottom: 6px; }
  .metric-value { font-size: 28px; font-weight: 700; line-height: 1; }
  .metric-label { font-size: 11px; color: #666; margin-top: 4px; }
  .conversions { display: flex; gap: 12px; margin-bottom: 16px; }
  .conv-item { flex: 1; background: #111; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #aaa; }
  .conv-item strong { color: #e0e0e0; font-size: 16px; }
  .history { margin-top: 4px; }
  .history-title { font-size: 12px; color: #555; margin-bottom: 8px; }
  .history table { width: 100%; border-collapse: collapse; }
  .history td { padding: 5px 8px; font-size: 13px; border-bottom: 1px solid #222; }
  .history tr:last-child td { border-bottom: none; }
  .refresh { position: fixed; bottom: 20px; right: 20px; background: #1a1a1a; border: 1px solid #333; color: #aaa; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; text-decoration: none; }
  .refresh:hover { background: #222; }
  @media (max-width: 600px) { .metrics { grid-template-columns: repeat(2, 1fr); } .conversions { flex-direction: column; } }
</style>
</head>
<body>
  <h1>📊 Telegram Tracker</h1>
  <p class="subtitle">Atualizado em ${now} • <a href="/dashboard" style="color:#555">Atualizar</a></p>
  ${rows || '<div class="card" style="color:#555;text-align:center;padding:40px">Nenhum evento registrado ainda.</div>'}
  <a class="refresh" href="/dashboard">↻ Atualizar</a>
</body>
</html>`;
}

module.exports = { renderDashboard };
