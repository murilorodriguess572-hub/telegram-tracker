import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, RefreshCw } from 'lucide-react'

const labels = {
  '': 'Overview', 'clients': 'Clientes', 'client': 'Cliente',
  'expert': 'Expert', 'bot': 'Bot', 'settings': 'Configurações', 'account': 'Conta',
}

export default function TopBar({ onRefresh, loading }) {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  const crumbs = [
    { label: 'Início', to: '/' },
    ...parts
      .filter(p => isNaN(p)) // oculta IDs numéricos
      .map((part, i) => ({
        label: labels[part] || part,
        to: '/' + parts.slice(0, parts.indexOf(part) + 1).join('/'),
      })),
  ]

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0"
      style={{ height: 52, borderBottom: '1px solid #1a1a1a', background: '#0a0a0a' }}
    >
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-gray-700" />}
            {i === crumbs.length - 1
              ? <span className="text-white font-medium">{crumb.label}</span>
              : <Link to={crumb.to} className="text-gray-600 hover:text-gray-400 transition-colors">{crumb.label}</Link>
            }
          </span>
        ))}
      </nav>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      )}
    </header>
  )
}
