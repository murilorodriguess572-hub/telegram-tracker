import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, RefreshCw } from 'lucide-react'

const labels = {
  '': 'Overview',
  'clients': 'Clientes',
  'expert': 'Expert',
  'bot': 'Bot',
  'settings': 'Configurações',
  'account': 'Minha Conta',
}

export default function TopBar({ onRefresh, loading }) {
  const location = useLocation()
  const parts = location.pathname.split('/').filter(Boolean)

  const crumbs = [
    { label: 'Home', to: '/' },
    ...parts.map((part, i) => ({
      label: labels[part] || part,
      to: '/' + parts.slice(0, i + 1).join('/'),
    })),
  ]

  return (
    <header className="h-14 border-b border-[#1e1e1e] px-6 flex items-center justify-between bg-[#0a0a0a] sticky top-0 z-30">
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <span key={crumb.to} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-gray-600" />}
            {i === crumbs.length - 1 ? (
              <span className="text-white font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.to} className="text-gray-500 hover:text-gray-300 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      )}
    </header>
  )
}
