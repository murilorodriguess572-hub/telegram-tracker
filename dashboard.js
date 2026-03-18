// dashboard.js
function renderDashboard(clientsData, clients) {
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const cards = Object.entries(clients).map(([clientId, client]) => {
    const { counts, members, recentEvents } = clientsData[clientId] || { counts: {}, members: [], recentEvents: [] };

    const entered   = counts["entered"] || 0;
    const exited    = counts["exited"] || 0;
    const pageviews = counts["pageviews"] || 0;
    const clicks    = counts["clicks"] || 0;
    const betClicks = counts["betClicks"] || 0;
    const hotLeads  = counts["hotLeads"] || 0;
    const coldLeads = counts["coldLeads"] || 0;

    const convClick = clicks > 0 ? ((entered / clicks) * 100).toFixed(1) : "0.0";
    const convBet   = entered > 0 ? ((betClicks / entered) * 100).toFixed(1) : "0.0";
    const hotLeadDays = client.hotLeadDays || 3;

    const memberRows = members.slice(0, 10).map(mem => {
      const days = mem.days_in_group
        ? parseFloat(mem.days_in_group).toFixed(1)
        : ((Date.now() - new Date(mem.joined_at)) / (1000 * 60 * 60 * 24)).toFixed(1);
      const isHot = parseFloat(days) >= hotLeadDays;
      return `
        <tr>
          <td>${mem.first_name || "—"} ${mem.username ? "<span style='color:#555'>@" + mem.username + "</span>" : ""}</td>
          <td>${days}d</td>
          <td>${isHot ? "<span class='badge hot'>🔥 Quente</span>" : "<span class='badge cold'>❄️ Frio</span>"}</td>
          <td>${mem.clicked_bet ? "<span class='badge bet'>✅</span>" : "—"}</td>
        </tr>`;
    }).join("");

    const eventRows = recentEvents.slice(0, 8).map(e => {
      const icons  = { pageviews: "👁️", clicks: "🖱️", entered: "✅", exited: "🚪", betClicks: "🎯", hotLeads: "🔥", coldLeads: "❄️" };
      const labels = { pageviews: "Page View", clicks: "Clique LP", entered: "Entrou", exited: "Saiu", betClicks: "Clique casa", hotLeads: "Lead quente", coldLeads: "Lead frio" };
      const time = new Date(e.created_at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      return `<tr><td>${icons[e.event_type] || "•"}</td><td>${labels[e.event_type] || e.event_type}</td><td style="color:#555;font-size:11px">${e.first_name || ""}</td><td style="color:#444;font-size:11px">${time}</td></tr>`;
    }).join("");

    return `
    <div class="card">
      <div class="card-header">
        <span class="dot"></span>
        <strong>${client.name}</strong>
        <span style="color:#444;font-size:12px;margin-left:auto">${members.length} no grupo agora</span>
      </div>
      <div class="metrics">
        <div class="metric"><span class="icon">👁️</span><div class="val">${pageviews}</div><div class="lbl">Page Views</div></div>
        <div class="metric"><span class="icon">🖱️</span><div class="val">${clicks}</div><div class="lbl">Cliques LP</div></div>
        <div class="metric highlight"><span class="icon">✅</span><div class="val">${entered}</div><div class="lbl">Entradas</div></div>
        <div class="metric"><span class="icon">🎯</span><div class="val">${betClicks}</div><div class="lbl">Cliques casa</div></div>
        <div class="metric"><span class="icon">🔥</span><div class="val">${hotLeads}</div><div class="lbl">Leads quentes</div></div>
        <div class="metric"><span class="icon">❄️</span><div class="val">${coldLeads}</div><div class="lbl">Leads frios</div></div>
      </div>
      <div class="conversions">
        <div class="conv-item"><span>Clique → Entrada</span><strong>${convClick}%</strong></div>
        <div class="conv-item"><span>Entrada → Casa</span><strong>${convBet}%</strong></div>
        <div class="conv-item"><span>Saídas</span><strong>${exited}</strong></div>
      </div>
      ${memberRows ? `
      <div class="section">
        <div class="section-title">Membros ativos agora</div>
        <table class="mt"><thead><tr><th>Membro</th><th>Tempo</th><th>Status</th><th>Casa</th></tr></thead><tbody>${memberRows}</tbody></table>
      </div>` : ""}
      ${eventRows ? `
      <div class="section">
        <div class="section-title">Últimos eventos</div>
        <table>${eventRows}</table>
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
  h1{font-size:18px;font-weight:600;margin-bottom:12px}
  .filters{display:flex;gap:10px;align-items:center;margin-bottom:20px;flex-wrap:wrap}
  .filters label{font-size:12px;color:#555}
  .filters input{background:#141414;border:1px solid #222;color:#e0e0e0;padding:6px 10px;border-radius:6px;font-size:12px}
  .filters button{background:#222;border:1px solid #333;color:#e0e0e0;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer}
  .filters button:hover{background:#2a2a2a}
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
  .badge{font-size:11px;padding:2px 6px;border-radius:4px}
  .badge.hot{color:#f97316}.badge.cold{color:#60a5fa}.badge.bet{color:#22c55e}
  @media(max-width:600px){.metrics{grid-template-columns:repeat(3,1fr)}.conversions{flex-direction:column}}
</style>
</head>
<body>
  <h1>📊 Telegram Tracker</h1>
  <div class="filters">
    <label>De: <input type="date" id="startDate"></label>
    <label>Até: <input type="date" id="endDate"></label>
    <button onclick="applyFilter()">Filtrar</button>
    <button onclick="resetFilter()">Hoje</button>
    <button onclick="filterDays(7)">7 dias</button>
    <button onclick="filterDays(30)">30 dias</button>
    <span style="color:#333;font-size:11px;margin-left:auto">Atualizado: ${now}</span>
  </div>
  <div id="cards">${cards}</div>
<script>
  function pad(n){return String(n).padStart(2,'0')}
  function toDateStr(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function applyFilter(){
    const s=document.getElementById('startDate').value;
    const e=document.getElementById('endDate').value;
    if(s&&e) window.location.href='/dashboard?start='+s+'&end='+e;
  }
  function resetFilter(){
    const t=toDateStr(new Date());
    window.location.href='/dashboard?start='+t+'&end='+t;
  }
  function filterDays(n){
    const end=new Date();
    const start=new Date();
    start.setDate(start.getDate()-n);
    window.location.href='/dashboard?start='+toDateStr(start)+'&end='+toDateStr(end);
  }
  // Preenche os inputs com as datas atuais da URL
  const params=new URLSearchParams(location.search);
  if(params.get('start')) document.getElementById('startDate').value=params.get('start');
  if(params.get('end')) document.getElementById('endDate').value=params.get('end');
</script>
</body>
</html>`;
}

module.exports = { renderDashboard };
