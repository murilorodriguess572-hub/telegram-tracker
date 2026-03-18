// dashboard.js
function renderDashboard(allMetrics, allMembers, clients) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const cards = Object.entries(clients).map(([clientId, client]) => {
    const m = allMetrics[clientId] || {};
    const members = allMembers[clientId] || [];

    const convClick   = m.clicks > 0 ? ((m.entered / m.clicks) * 100).toFixed(1) : "0.0";
    const convBet     = m.entered > 0 ? ((m.betClicks / m.entered) * 100).toFixed(1) : "0.0";
    const hotLeadDays = client.hotLeadDays || 3;

    // Membros ativos no grupo agora
    const activeSorted = [...members].sort((a, b) => b.joinedAt - a.joinedAt);
    const memberRows = activeSorted.slice(0, 10).map(mem => {
      const days = ((Date.now() - mem.joinedAt) / (1000 * 60 * 60 * 24)).toFixed(1);
      const isHot = parseFloat(days) >= hotLeadDays;
      const clickedBet = mem.clickedBet;
      return `
        <tr>
          <td>${mem.firstName || "—"} ${mem.username ? "<span style='color:#555'>@" + mem.username + "</span>" : ""}</td>
          <td>${days} dias</td>
          <td>${isHot ? "<span class='badge hot'>🔥 Quente</span>" : "<span class='badge cold'>❄️ Frio</span>"}</td>
          <td>${clickedBet ? "<span class='badge bet'>✅ Clicou</span>" : "—"}</td>
        </tr>`;
    }).join("");

    // Histórico de eventos
    const historyRows = (m.history || []).slice(0, 8).map(h => {
      const icons = { pageviews: "👁️", clicks: "🖱️", entered: "✅", exited: "🚪", betClicks: "🎯", hotLeads: "🔥", coldLeads: "❄️" };
      const labels = { pageviews: "Page View", clicks: "Clique na LP", entered: "Entrou no grupo", exited: "Saiu do grupo", betClicks: "Clicou na casa", hotLeads: "Lead quente saiu", coldLeads: "Lead frio saiu" };
      const time = new Date(h.timestamp).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
      return `<tr><td>${icons[h.event] || "•"}</td><td>${labels[h.event] || h.event}</td><td style="color:#555;font-size:11px">${time}</td></tr>`;
    }).join("");

    return `
    <div class="card">
      <div class="card-header">
        <span class="dot"></span>
        <strong>${client.name}</strong>
        <span style="color:#444;font-size:12px;margin-left:auto">${members.length} no grupo agora</span>
      </div>

      <div class="metrics">
        <div class="metric"><span class="icon">👁️</span><div class="val">${m.pageviews || 0}</div><div class="lbl">Page Views</div></div>
        <div class="metric"><span class="icon">🖱️</span><div class="val">${m.clicks || 0}</div><div class="lbl">Cliques LP</div></div>
        <div class="metric highlight"><span class="icon">✅</span><div class="val">${m.entered || 0}</div><div class="lbl">Entradas</div></div>
        <div class="metric"><span class="icon">🎯</span><div class="val">${m.betClicks || 0}</div><div class="lbl">Cliques casa</div></div>
        <div class="metric"><span class="icon">🔥</span><div class="val">${m.hotLeads || 0}</div><div class="lbl">Leads quentes</div></div>
        <div class="metric"><span class="icon">❄️</span><div class="val">${m.coldLeads || 0}</div><div class="lbl">Leads frios</div></div>
      </div>

      <div class="conversions">
        <div class="conv-item"><span>Clique LP → Entrada</span><strong>${convClick}%</strong></div>
        <div class="conv-item"><span>Entrada → Clique casa</span><strong>${convBet}%</strong></div>
        <div class="conv-item"><span>Saídas do grupo</span><strong>${m.exited || 0}</strong></div>
      </div>

      ${memberRows ? `
      <div class="section">
        <div class="section-title">Membros ativos agora (${members.length})</div>
        <table class="members-table">
          <thead><tr><th>Membro</th><th>Tempo</th><th>Status</th><th>Casa</th></tr></thead>
          <tbody>${memberRows}</tbody>
        </table>
      </div>` : ""}

      ${historyRows ? `
      <div class="section">
        <div class="section-title">Últimos eventos</div>
        <table>${historyRows}</table>
      </div>` : ""}
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tracker Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0a0a0a;color:#e0e0e0;padding:20px}
  h1{font-size:18px;font-weight:600;margin-bottom:2px}
  .sub{color:#444;font-size:12px;margin-bottom:20px}
  .card{background:#141414;border:1px solid #222;border-radius:12px;padding:20px;margin-bottom:16px}
  .card-header{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:14px}
  .dot{width:7px;height:7px;background:#22c55e;border-radius:50%}
  .metrics{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:12px}
  .metric{background:#0f0f0f;border-radius:8px;padding:12px 8px;text-align:center}
  .metric.highlight{border:1px solid #22c55e22;background:#0a140a}
  .icon{font-size:16px;display:block;margin-bottom:4px}
  .val{font-size:24px;font-weight:700;line-height:1}
  .lbl{font-size:10px;color:#555;margin-top:3px}
  .conversions{display:flex;gap:8px;margin-bottom:12px}
  .conv-item{flex:1;background:#0f0f0f;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#666}
  .conv-item strong{color:#e0e0e0;font-size:15px}
  .section{margin-top:12px}
  .section-title{font-size:11px;color:#444;margin-bottom:6px}
  table{width:100%;border-collapse:collapse}
  td,th{padding:5px 8px;font-size:12px;border-bottom:1px solid #1a1a1a;text-align:left}
  th{color:#555;font-weight:500}
  tr:last-child td{border-bottom:none}
  .badge{font-size:11px;padding:2px 6px;border-radius:4px;background:#1a1a1a}
  .badge.hot{color:#f97316}
  .badge.cold{color:#60a5fa}
  .badge.bet{color:#22c55e}
  .members-table td:nth-child(2){color:#666}
  @media(max-width:600px){.metrics{grid-template-columns:repeat(3,1fr)}.conversions{flex-direction:column}}
</style>
</head>
<body>
  <h1>📊 Telegram Tracker</h1>
  <p class="sub">Atualizado: ${now} · <a href="/dashboard" style="color:#333">↻ Atualizar</a></p>
  ${cards || '<div class="card" style="color:#444;text-align:center;padding:40px">Nenhum evento ainda.</div>'}
</body>
</html>`;
}

module.exports = { renderDashboard };
