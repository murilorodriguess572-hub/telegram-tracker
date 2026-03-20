import { useEffect, useState } from 'react'
import api from '../../lib/api'
import { Wifi, WifiOff, Loader } from 'lucide-react'

export default function BotStatusBadge({ botId }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/bot-status/${botId}`)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false))
  }, [botId])

  if (loading) return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#555' }}>
      <Loader size={11} className="animate-spin" /> Verificando...
    </span>
  )

  const webhookOk = status?.webhook?.connected
  const chatOk    = status?.chat?.connected
  const allOk     = webhookOk && chatOk

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
        background: allOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        color: allOk ? '#4ade80' : '#f87171',
        border: `1px solid ${allOk ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
      }}>
        {allOk ? <Wifi size={11} /> : <WifiOff size={11} />}
        {allOk ? 'Conectado' : 'Problema detectado'}
      </span>
      {!webhookOk && (
        <span style={{ fontSize: 10, color: '#f87171' }}>
          ⚠ Webhook: {status?.webhook?.lastError || status?.webhook?.error || 'não configurado'}
        </span>
      )}
      {!chatOk && (
        <span style={{ fontSize: 10, color: '#f87171' }}>
          ⚠ Grupo: {status?.chat?.error || 'bot não está no grupo'}
        </span>
      )}
    </div>
  )
}
