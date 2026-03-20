import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, Settings, LogOut, Zap, ChevronRight, UserCircle
} from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', superOnly: false },
  { to: '/clients', icon: Users, label: 'Clientes', superOnly: true },
  { to: '/settings', icon: Settings, label: 'Configurações', superOnly: true },
  { to: '/account', icon: UserCircle, label: 'Minha Conta', superOnly: false },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const items = navItems.filter(item => !item.superOnly || user?.role === 'superadmin')

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0d0d0d] border-r border-[#1e1e1e] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#FFD700] rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-black" fill="black" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Expert</p>
            <p className="text-[#FFD700] font-bold text-sm leading-none">Tracking</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group ${
                isActive
                  ? 'bg-[#FFD700]/10 text-[#FFD700] font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-[#1e1e1e]">
        <div className="px-3 py-2 mb-1">
          <p className="text-white text-sm font-medium truncate">{user?.name}</p>
          <p className="text-gray-500 text-xs truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </aside>
  )
}
