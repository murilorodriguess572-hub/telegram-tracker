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
    if (newPass.length < 6)  { setMsg({ type: 'error', text: 'Mínimo 6 caracteres' }); return }
    setLoading(true); setMsg(null)
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: newPass })
      setMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrent(''); setNewPass(''); setConfirm('')
    } catch (err) {
      setMsg({ type: 'error', text: err.error || 'Erro ao alterar senha' })
    } finally { setLoading(false) }
  }

  const inputCls = "w-full text-white text-sm rounded-xl px-4 py-3 focus:outline-none transition-all"
  const inputStyle = { background: '#0d0d0d', border: '1px solid #2a2a2a' }
  const inputFocus = {
    onFocus: e => { e.target.style.borderColor = 'rgba(255,215,0,0.4)' },
    onBlur:  e => { e.target.style.borderColor = '#2a2a2a' },
  }

  return (
    <PageWrapper>
      <div style={{ maxWidth: 520 }} className="space-y-5">

        <div>
          <h1 className="text-white font-bold" style={{ fontSize: 28 }}>Minha Conta</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie suas informações e segurança</p>
        </div>

        {/* Perfil */}
        <div className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ width: 52, height: 52, background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.15)' }}
            >
              <UserCircle size={26} style={{ color: '#FFD700' }} />
            </div>
            <div>
              <p className="text-white font-semibold text-base">{user?.name}</p>
              <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
            style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', width: 'fit-content' }}
          >
            <Shield size={14} style={{ color: '#FFD700' }} />
            <span className="text-gray-400 text-sm">{roleLabels[user?.role] || user?.role}</span>
          </div>
        </div>

        {/* Alterar senha */}
        <div className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
          <div className="flex items-center gap-2.5 mb-6">
            <Lock size={17} style={{ color: '#FFD700' }} />
            <h2 className="text-white font-semibold text-base">Alterar Senha</h2>
          </div>

          {msg && (
            <div
              className="text-sm px-4 py-3 rounded-xl mb-5"
              style={{
                background: msg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${msg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                color: msg.type === 'success' ? '#4ade80' : '#f87171',
              }}
            >
              {msg.text}
            </div>
          )}

          <form onSubmit={handleChangePass} className="space-y-4">
            {[
              { label: 'Senha Atual',          value: current,  set: setCurrent },
              { label: 'Nova Senha',            value: newPass,  set: setNewPass },
              { label: 'Confirmar Nova Senha',  value: confirm,  set: setConfirm },
            ].map(({ label, value, set }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-400" style={{ marginBottom: 8 }}>{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={e => set(e.target.value)}
                  required
                  className={inputCls}
                  style={inputStyle}
                  {...inputFocus}
                />
              </div>
            ))}

            <div style={{ paddingTop: 4 }}>
              <button
                type="submit"
                disabled={loading}
                className="text-sm font-semibold rounded-xl text-black transition-all disabled:opacity-50"
                style={{
                  background: loading ? '#b8950a' : '#FFD700',
                  padding: '12px 28px',
                  boxShadow: loading ? 'none' : '0 2px 12px rgba(255,215,0,0.25)',
                }}
              >
                {loading ? 'Salvando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </PageWrapper>
  )
}
