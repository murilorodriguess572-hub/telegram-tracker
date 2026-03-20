import { useState } from 'react'
import PageWrapper from '../components/Layout/PageWrapper'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { UserCircle, Lock, Shield } from 'lucide-react'

const roleLabels = { superadmin: 'Super Admin', admin: 'Admin', viewer: 'Visualizador' }

export default function Account() {
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleChangePass = async (e) => {
    e.preventDefault()
    if (newPass !== confirm) { setMsg({ type: 'error', text: 'As senhas não coincidem' }); return }
    if (newPass.length < 6) { setMsg({ type: 'error', text: 'Mínimo 6 caracteres' }); return }
    setLoading(true); setMsg(null)
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: newPass })
      setMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrent(''); setNewPass(''); setConfirm('')
    } catch (err) {
      setMsg({ type: 'error', text: err.error || 'Erro ao alterar senha' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-lg space-y-6">
        <h1 className="text-white text-2xl font-bold">Minha Conta</h1>

        {/* Profile card */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 bg-[#FFD700]/10 rounded-full flex items-center justify-center">
              <UserCircle size={28} className="text-[#FFD700]" />
            </div>
            <div>
              <p className="text-white font-semibold">{user?.name}</p>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-gray-500" />
            <span className="text-gray-400 text-sm">{roleLabels[user?.role] || user?.role}</span>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-[#FFD700]" />
            <h2 className="text-white font-semibold text-base">Alterar Senha</h2>
          </div>

          {msg && (
            <div className={`text-sm px-4 py-3 rounded-lg mb-4 ${
              msg.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleChangePass} className="space-y-4">
            {[
              { label: 'Senha Atual', value: current, onChange: setCurrent },
              { label: 'Nova Senha', value: newPass, onChange: setNewPass },
              { label: 'Confirmar Nova Senha', value: confirm, onChange: setConfirm },
            ].map(({ label, value, onChange }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  required
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/50"
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#FFD700] text-black text-sm font-medium rounded-lg hover:bg-[#F5C400] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  )
}
