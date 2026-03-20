import { useState } from 'react'
import api from '../../lib/api'

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

function Field({ label, required, children }) {
  return (
    <div>
      <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
        {label} {required && <span style={{ color: '#FFD700' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

export default function ExpertForm({ expert, clientId, onSave, onCancel }) {
  const [name,    setName]    = useState(expert?.name || '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = expert
        ? await api.put(`/experts/${expert.id}`, { name })
        : await api.post('/experts', { name, clientId })
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

      <Field label="Nome do Expert" required>
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
          {loading ? 'Salvando...' : expert ? 'Salvar alterações' : 'Criar Expert'}
        </button>
      </div>
    </form>
  )
}
