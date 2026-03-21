import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Settings, LogOut, Zap, UserCircle } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', superOnly: false },
  { to: '/settings', icon: Settings, label: 'Configurações', superOnly: true },
  { to: '/account', icon: UserCircle, label: 'Minha Conta', superOnly: false },
]

const roleLabel = { superadmin: 'Super Admin', admin: 'Admin', viewer: 'Visualizador' }

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login') }
  const items = navItems.filter(i => !i.superOnly || user?.role === 'superadmin')

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{ width: 220, background: '#0d0d0d', borderRight: '1px solid #1a1a1a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <div
          className="flex items-center justify-center rounded-lg flex-shrink-0"
          style={{ width: 32, height: 32, background: '#FFD700', boxShadow: '0 0 16px rgba(255,215,0,0.3)' }}
        >
          <Zap size={16} color="#000" fill="#000" />
        </div>
        <div className="leading-none">
          <p className="text-white font-bold text-sm">Expert</p>
          <p className="font-bold text-sm" style={{ color: '#FFD700' }}>Tracking</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <p style={{ fontSize: 10, fontWeight: 700, color: '#333', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8, paddingLeft: 4 }}>Menu</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid #FFD700' : '3px solid transparent',
                background: isActive ? 'rgba(255,215,0,0.08)' : 'transparent',
                color: isActive ? '#FFD700' : '#555',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.style.background.includes('rgba(255,215,0,0.08)')) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = '#888'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.style.background.includes('rgba(255,215,0,0.08)')) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#555'
                }
              }}
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} style={{ color: isActive ? '#FFD700' : '#444', flexShrink: 0 }} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg mb-1" style={{ background: '#111' }}>
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 28, height: 28, background: 'rgba(255,215,0,0.1)' }}
          >
            <UserCircle size={15} style={{ color: '#FFD700' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-gray-600 text-[11px] truncate">{roleLabel[user?.role]}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-[13px] text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </aside>
  )
}
