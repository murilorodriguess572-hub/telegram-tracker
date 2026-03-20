import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff } from 'lucide-react'

const inputBase = {
  background: '#0d0d0d',
  border: '1px solid #2a2a2a',
  color: '#fff',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 14,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s',
}

export default function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const user = await login(email, password)
      navigate(user.role === 'superadmin' ? '/' : `/client/${user.clientId}`)
    } catch (err) {
      setError(err.error || 'Email ou senha incorretos')
    } finally { setLoading(false) }
  }

  const focusStyle = (e) => { e.target.style.borderColor = 'rgba(255,215,0,0.5)' }
  const blurStyle  = (e) => { e.target.style.borderColor = '#2a2a2a' }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      {/* glow de fundo */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,215,0,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative' }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: '#FFD700', borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 32px rgba(255,215,0,0.3)', marginBottom: 16,
          }}>
            <Zap size={26} color="#000" fill="#000" />
          </div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>Expert Tracking</p>
          <p style={{ color: '#555', fontSize: 14 }}>Dashboard de performance</p>
        </div>

        {/* Card */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 20, padding: 28 }}>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 17, marginBottom: 24 }}>Entrar na conta</p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171', fontSize: 13, padding: '12px 16px', borderRadius: 12, marginBottom: 20,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={inputBase}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>

            <div>
              <label style={{ display: 'block', color: '#9ca3af', fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ ...inputBase, paddingRight: 44 }}
                  onFocus={focusStyle}
                  onBlur={blurStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#555', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? '#b8950a' : '#FFD700',
                color: '#000', fontWeight: 700, fontSize: 14,
                padding: '13px 24px', borderRadius: 12, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(255,215,0,0.3)',
                transition: 'all 0.2s', marginTop: 4,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#333', fontSize: 12, marginTop: 24 }}>
          Expert Tracking © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
