import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Zap, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const user = await login(email, password)
      navigate(user.role === 'superadmin' ? '/' : `/client/${user.clientId}`)
    } catch (err) {
      setError(err.error || 'Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FFD700]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-[#FFD700] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#FFD700]/20">
            <Zap size={28} className="text-black" fill="black" />
          </div>
          <h1 className="text-white text-2xl font-bold">Expert Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard de performance</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-5">Entrar na conta</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#FFD700]/50 placeholder-gray-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2.5 pr-10 focus:outline-none focus:border-[#FFD700]/50 placeholder-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] text-black font-semibold text-sm rounded-lg py-2.5 hover:bg-[#F5C400] disabled:opacity-60 transition-colors mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-700 text-xs mt-6">
          Expert Tracking © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
