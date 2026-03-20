import { useState } from 'react'
import { Copy, Check, Code2 } from 'lucide-react'

export default function IntegrationScript({ botSlug, appUrl }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const url = appUrl || 'https://telegram-tracker-production.up.railway.app'

  const script = `<script>
(function () {
  var BACKEND = "${url}";
  var CLIENT  = "${botSlug}";

  function getVisitorId() {
    var id = localStorage.getItem("_tid");
    if (!id) {
      id = "v" + Math.random().toString(36).substr(2, 8) + Date.now();
      localStorage.setItem("_tid", id);
    }
    return id;
  }

  function getFbclid() {
    var fb = new URLSearchParams(location.search).get("fbclid");
    if (fb) localStorage.setItem("_fbc", fb);
    return localStorage.getItem("_fbc");
  }

  function getFbp() {
    var match = document.cookie.match(/(^|;)\\s*_fbp=([^;]+)/);
    return match ? match[2] : null;
  }

  var vid    = getVisitorId();
  var fbclid = getFbclid();

  setTimeout(function () {
    var fbp = getFbp();
    fetch(BACKEND + "/track/" + CLIENT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId: vid,
        fbclid:    fbclid,
        fbp:       fbp,
        userAgent: navigator.userAgent,
      })
    }).catch(function () {});
  }, 1500);

  function patchButtons() {
    document.querySelectorAll('a[href*="t.me"], a[href*="telegram.me"]').forEach(function (btn) {
      btn.href   = BACKEND + "/go/" + CLIENT + "/" + vid;
      btn.target = "_blank";
    });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", patchButtons)
    : patchButtons();

  setTimeout(patchButtons, 2000);
})();
<\/script>`

  const copy = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginTop: 16, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden', background: '#0d0d0d' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#aaa', fontSize: 13, fontWeight: 600 }}>
          <Code2 size={15} style={{ color: '#FFD700' }} />
          Script de Integração (LP)
        </span>
        <span style={{ color: '#555', fontSize: 12 }}>{open ? '▲ Fechar' : '▼ Mostrar'}</span>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid #1e1e1e', padding: 16 }}>
          <p style={{ color: '#555', fontSize: 11, marginBottom: 10 }}>
            Cole este script antes do <code style={{ color: '#FFD700' }}>&lt;/body&gt;</code> da sua landing page.
          </p>
          <div style={{ position: 'relative' }}>
            <pre style={{
              background: '#111', border: '1px solid #1e1e1e', borderRadius: 8,
              padding: '12px 16px', fontSize: 11, color: '#ccc', overflowX: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200,
              overflowY: 'auto', margin: 0,
            }}>
              {script}
            </pre>
            <button
              onClick={copy}
              style={{
                position: 'absolute', top: 8, right: 8,
                display: 'flex', alignItems: 'center', gap: 5,
                background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,215,0,0.1)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,215,0,0.2)'}`,
                color: copied ? '#4ade80' : '#FFD700',
                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
