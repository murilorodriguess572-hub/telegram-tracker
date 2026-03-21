import { useState } from 'react'
import PageWrapper from '../components/Layout/PageWrapper'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'
import { Lock, Shield, Pencil, Check, X } from 'lucide-react'

const roleLabels = { superadmin: 'Super Admin', admin: 'Administrador' }

const inputStyle = {
  width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a',
  color: '#fff', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
}
const inputFocus = {
  onFocus: e => { e.target.style.borderColor = 'rgba(255,215,0,0.4)' },
  onBlur:  e => { e.target.style.borderColor = '#2a2a2a' },
}

export default function Account() {
  const { user } = useAuth()
  const [tab, setTab] = useState('profile')
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameMsg, setNameMsg] = useState(null)

  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [passLoading, setPassLoading] = useState(false)
  const [passMsg, setPassMsg] = useState(null)

  const handleSaveName = async () => {
    if (!name.trim()) return
    setNameLoading(true); setNameMsg(null)
    try {
      setNameMsg({ type: 'success', text: 'Nome atualizado!' })
      setEditingName(false)
    } catch {
      setNameMsg({ type: 'error', text: 'Erro ao salvar' })
    } finally { setNameLoading(false) }
  }

  const handleChangePass = async (e) => {
    e.preventDefault()
    if (newPass !== confirm) { setPassMsg({ type: 'error', text: 'As senhas não coincidem' }); return }
    if (newPass.length < 6) { setPassMsg({ type: 'error', text: 'Mínimo 6 caracteres' }); return }
    setPassLoading(true); setPassMsg(null)
    try {
      await api.post('/auth/change-password', { currentPassword: current, newPassword: newPass })
      setPassMsg({ type: 'success', text: 'Senha alterada com sucesso!' })
      setCurrent(''); setNewPass(''); setConfirm('')
    } catch (err) {
      setPassMsg({ type: 'error', text: err.error || 'Senha atual incorreta' })
    } finally { setPassLoading(false) }
  }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const tabs = [
    { key: 'profile', label: 'Perfil' },
    { key: 'password', label: 'Segurança' },
  ]

  return (
    <PageWrapper>
      <div style={{ maxWidth: 560 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 26, margin: 0 }}>Minha Conta</h1>
          <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>Gerencie suas informações e segurança</p>
        </div>

        {/* Avatar + info */}
        <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: '24px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
            background: '#FFD700', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#000', fontWeight: 800, fontSize: 22 }}>{initials}</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 17, margin: 0 }}>{user?.name}</p>
            <p style={{ color: '#555', fontSize: 13, margin: '3px 0 8px' }}>{user?.email}</p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)',
              color: '#FFD700', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
            }}>
              <Shield size={11} />
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              background: tab === t.key ? '#FFD700' : 'transparent',
              color: tab === t.key ? '#000' : '#555',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Aba Perfil */}
        {tab === 'profile' && (
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Informações do Perfil</h2>
              {!editingName ? (
                <button onClick={() => setEditingName(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  color: '#aaa', fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                }}>
                  <Pencil size={12} /> Editar
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setEditingName(false); setName(user?.name || '') }} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer' }}>
                    <X size={13} />
                  </button>
                  <button onClick={handleSaveName} disabled={nameLoading} style={{ background: '#FFD700', border: 'none', color: '#000', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
                    <Check size={13} />
                  </button>
                </div>
              )}
            </div>

            {nameMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
                background: nameMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                color: nameMsg.type === 'success' ? '#4ade80' : '#f87171',
                border: `1px solid ${nameMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {nameMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>Nome Completo</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={!editingName}
                  style={{ ...inputStyle, opacity: editingName ? 1 : 0.6, cursor: editingName ? 'text' : 'default' }}
                  {...(editingName ? inputFocus : {})}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>
                  Email <span style={{ color: '#333', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(não editável)</span>
                </label>
                <input value={user?.email || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'default' }} />
              </div>
            </div>
          </div>
        )}

        {/* Aba Segurança */}
        {tab === 'password' && (
          <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <Lock size={16} style={{ color: '#FFD700' }} />
              <h2 style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Alterar Senha</h2>
            </div>

            {passMsg && (
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13,
                background: passMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                color: passMsg.type === 'success' ? '#4ade80' : '#f87171',
                border: `1px solid ${passMsg.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePass} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Senha Atual',         value: current,  set: setCurrent },
                { label: 'Nova Senha',           value: newPass,  set: setNewPass },
                { label: 'Confirmar Nova Senha', value: confirm,  set: setConfirm },
              ].map(({ label, value, set }) => (
                <div key={label}>
                  <label style={{ display: 'block', color: '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 7 }}>{label}</label>
                  <input type="password" value={value} onChange={e => set(e.target.value)} required style={inputStyle} {...inputFocus} />
                </div>
              ))}
              <div style={{ paddingTop: 4 }}>
                <button type="submit" disabled={passLoading} style={{
                  background: passLoading ? '#b8950a' : '#FFD700', color: '#000',
                  fontWeight: 700, fontSize: 14, padding: '12px 28px',
                  borderRadius: 10, border: 'none', cursor: passLoading ? 'not-allowed' : 'pointer',
                  boxShadow: passLoading ? 'none' : '0 2px 12px rgba(255,215,0,0.25)',
                }}>
                  {passLoading ? 'Salvando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </PageWrapper>
  )
}
