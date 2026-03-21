import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, RefreshCw } from 'lucide-react'
import { useState } from 'react'

const labels = {
  '': 'Overview', 'clients': 'Clientes', 'client': 'Cliente',
  'expert': 'Expert', 'bot': 'Bot', 'settings': 'Configurações', 'account': 'Conta',
}

export default function TopBar({ onRefresh, loading }) {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)
  const [btnHover, setBtnHover] = useState(false)

  const crumbs = [
    { label: 'Início', to: '/' },
    ...parts
      .filter(p => isNaN(p))
      .map((part) => ({
        label: labels[part] || part,
        to: '/' + parts.slice(0, parts.indexOf(part) + 1).join('/'),
      })),
  ]

  return (
    <header
      style={{
        height: 52, borderBottom: '1px solid #1a1a1a', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', flexShrink: 0,
      }}
    >
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {crumbs.map((crumb, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <ChevronRight size={12} style={{ color: '#333' }} />}
            {i === crumbs.length - 1
              ? <span style={{ color: '#fff', fontWeight: 500, fontSize: 13 }}>{crumb.label}</span>
              : <Link
                  to={crumb.to}
                  style={{ color: '#555', fontSize: 13, textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = '#888'}
                  onMouseLeave={e => e.target.style.color = '#555'}
                >
                  {crumb.label}
                </Link>
            }
          </span>
        ))}
      </nav>

      {onRefresh && (
        <button
          onClick={onRefresh}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: `1px solid ${btnHover ? '#333' : '#1e1e1e'}`,
            background: '#141414', color: btnHover ? '#fff' : '#666',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Atualizar
        </button>
      )}
    </header>
  )
}
