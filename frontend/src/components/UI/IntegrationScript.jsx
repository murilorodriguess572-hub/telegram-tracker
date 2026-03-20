import { useState } from 'react'
import { Copy, Check, Code2 } from 'lucide-react'

export default function IntegrationScript({ botSlug, appUrl }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const url = appUrl || window.location.origin
  const script = `<script src="${url}/script/${botSlug}.js" async><\/script>`

  const copy = () => {
    navigator.clipboard.writeText(script)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ marginTop: 16, border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden', background: '#0d0d0d' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
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
              onClick={(e) => { e.stopPropagation(); copy() }}
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
