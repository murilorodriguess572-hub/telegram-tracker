import { useState } from 'react'
import api from '../../lib/api'

export default function ExpertForm({ expert, clientId, onSave, onCancel }) {
  const [name, setName] = useState(expert?.name || '')
  const [slug, setSlug] = useState(expert?.slug || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const autoSlug = (val) => val.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const handleName = (e) => {
    const val = e.target.value
    setName(val)
    if (!expert) setSlug(autoSlug(val))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const result = expert
        ? await api.put(`/experts/${expert.id}`, { name, slug })
        : await api.post('/experts', { name, slug, clientId })
      onSave(result)
    } catch (err) {
      setError(err.error || 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg">{error}</div>}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Nome do Expert</label>
        <input value={name} onChange={handleName} placeholder="Maria da Bet" required className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]/50 placeholder-gray-700" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="maria-da-bet" required className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]/50 placeholder-gray-700" />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
        <button type="submit" disabled={loading} className="px-5 py-2 bg-[#FFD700] text-black text-sm font-medium rounded-lg hover:bg-[#F5C400] disabled:opacity-50">
          {loading ? 'Salvando...' : expert ? 'Salvar' : 'Criar Expert'}
        </button>
      </div>
    </form>
  )
}
