import { useState } from 'react'
import api from '../../lib/api'
import { Eye, EyeOff } from 'lucide-react'

// ── Estilos reutilizáveis ─────────────────────────────────────
const inputStyle = {
  width: '100%',
  background: '#0d0d0d',
  border: '1px solid #2a2a2a',
  borderRadius: 10,
  color: '#fff',
  fontSize: 14,
  padding: '12px 14px',
  minHeight: 44,
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
}
const focusOn  = e => { e.target.style.borderColor = 'rgba(255,215,0,0.45)' }
const focusOff = e => { e.target.style.borderColor = '#2a2a2a' }

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
        {label} {required && <span style={{ color: '#FFD700' }}>*</span>}
      </label>
      {children}
      {hint && <p style={{ color: '#555', fontSize: 11, marginTop: 6 }}>{hint}</p>}
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
      <span style={{ color: '#555', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
    </div>
  )
}

export default function ClientForm({ client, onSave, onCancel }) {
  const isEdit = !!client

  const [name,     setName]     = useState(client?.name  || '')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isEdit) {
      if (!email) { setError('Email é obrigatório'); return }
      if (!password) { setError('Senha é obrigatória'); return }
      if (password.length < 6) { setError('Senha mínima de 6 caracteres'); return }
      if (password !== confirm) { setError('As senhas não coincidem'); return }
    }

    if (isEdit && password && password.length < 6) {
      setError('Senha mínima de 6 caracteres'); return
    }
    if (isEdit && password && password !== confirm) {
      setError('As senhas não coincidem'); return
    }

    setLoading(true)
    try {
      let result
      if (isEdit) {
        const payload = { name, slug: client.slug }
        if (email) payload.email = email
        if (password) payload.password = password
        result = await api.put(`/clients/${client.id}`, payload)
      } else {
        result = await api.post('/clients', { name, email, password })
      }
      onSave(result)
    } catch (err) {
      setError(err.error || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          color: '#f87171', fontSize: 13, padding: '12px 16px', borderRadius: 10,
        }}>
          {error}
        </div>
      )}

      {/* Nome */}
      <Field label="Nome do cliente" required>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
          onFocus={focusOn}
          onBlur={focusOff}
        />
      </Field>

      {/* Acesso ao dashboard */}
      <>
        <Divider label={isEdit ? 'Alterar acesso ao dashboard' : 'Acesso ao dashboard'} />

        <p style={{ color: '#666', fontSize: 12, marginTop: -8 }}>
          {isEdit
            ? 'Deixe em branco os campos que não deseja alterar.'
            : 'Esses dados criam o login do cliente para acessar o dashboard.'}
        </p>

        <Field label="Email de acesso" required={!isEdit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required={!isEdit}
            style={inputStyle}
            onFocus={focusOn}
            onBlur={focusOff}
          />
        </Field>

        <Field label={isEdit ? 'Nova senha' : 'Senha'} required={!isEdit} hint="Mínimo 6 caracteres">
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required={!isEdit}
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={focusOn}
              onBlur={focusOff}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        <Field label="Confirmar senha" required={!isEdit || !!password}>
          <input
            type={showPass ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required={!isEdit || !!password}
            style={inputStyle}
            onFocus={focusOn}
            onBlur={focusOff}
          />
        </Field>
      </>

      {/* Ações */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '12px 24px', borderRadius: 10, border: '1px solid #2a2a2a',
            background: 'transparent', color: '#9ca3af', fontSize: 14, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = '#3a3a3a' }}
          onMouseLeave={e => { e.target.style.color = '#9ca3af'; e.target.style.borderColor = '#2a2a2a' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: loading ? '#b8950a' : '#FFD700',
            color: '#000', fontWeight: 700, fontSize: 14,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 2px 14px rgba(255,215,0,0.25)',
            transition: 'all 0.2s',
          }}
        >
          {loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar cliente'}
        </button>
      </div>
    </form>
  )
}
