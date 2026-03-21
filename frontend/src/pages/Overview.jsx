import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/Layout/PageWrapper'
import api from '../lib/api'
import { Building2, Bot, TrendingUp, ChevronRight, LogOut } from 'lucide-react'

function StatusDot({ ok }) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: ok ? '#22c55e' : '#ef4444',
      boxShadow: ok ? '0 0 6px #22c55e88' : '0 0 6px #ef444488',
      flexShrink: 0,
    }} />
  )
}

function BotStatusInline({ botId }) {
  const [status, setStatus] = useState(null)
  useEffect(() => {
    api.get(`/bot-status/${botId}`).then(setStatus).catch(() => {})
  }, [botId])
  if (!status) return <span style={{ color: '#444', fontSize: 11 }}>verificando...</span>
  const ok = status?.webhook?.connected && status?.chat?.connected
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: ok ? '#22c55e' : '#ef4444' }}>
      <StatusDot ok={ok} />
      {ok ? 'Conectado' : (status?.webhook?.lastError || status?.chat?.error || 'Problema')}
    </span>
  )
}

export default function Overview() {
  const [clients, setClients] = useState([])
  const [botsMap, setBotsMap] = useState({})
  const [metricsMap, setMetricsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  const tz = 'America/Sao_Paulo'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const cls = await api.get('/clients')
      setClients(cls)

      for (const client of cls) {
        const bots = await api.get(`/bots?clientId=${client.id}`)
        setBotsMap(prev => ({ ...prev, [client.id]: bots }))

        let entered = 0, exited = 0
        for (const bot of bots) {
          try {
            const m = await api.get(`/metrics/${bot.slug}?start=${today}&end=${today}`)
            entered += m.counts?.entered || 0
            exited += (m.counts?.exitedTotal || 0) + (m.counts?.coldLeads || 0) + (m.counts?.exited || 0) + (m.counts?.hotLeads || 0)
          } catch {}
        }
        setMetricsMap(prev => ({ ...prev, [client.id]: { entered, exited } }))
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const totalClients = clients.length
  const totalBots = Object.values(botsMap).reduce((s, b) => s + b.length, 0)
  const totalEntered = Object.values(metricsMap).reduce((s, m) => s + m.entered, 0)
  const totalExited = Object.values(metricsMap).reduce((s, m) => s + m.exited, 0)

  return (
    <PageWrapper onRefresh={load} loading={loading}>
      <div style={{ maxWidth: 1000 }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 26, margin: 0 }}>Visão Geral</h1>
          <p style={{ color: '#444', fontSize: 13, marginTop: 4 }}>
            Monitoramento em tempo real — {new Date().toLocaleDateString('pt-BR', { timeZone: tz, weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>

        {/* Cards resumo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Clientes',      value: totalClients, color: '#FFD700', icon: Building2 },
            { label: 'Bots',          value: totalBots,    color: '#60a5fa', icon: Bot },
            { label: 'Entradas hoje', value: totalEntered, color: '#4ade80', icon: TrendingUp },
            { label: 'Saídas hoje',   value: totalExited,  color: '#f87171', icon: LogOut },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Icon size={15} style={{ color }} />
                <span style={{ color: '#555', fontSize: 12 }}>{label}</span>
              </div>
              <p style={{ color, fontWeight: 800, fontSize: 28, margin: 0 }}>
                {loading ? '—' : value}
              </p>
            </div>
          ))}
        </div>

        {/* Lista de clientes com bots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {clients.length === 0 && !loading && (
            <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#fff', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Nenhum cliente ainda</p>
              <p style={{ color: '#444', fontSize: 13, marginBottom: 20 }}>Comece criando seu primeiro cliente nas configurações.</p>
              <Link to="/settings" style={{ background: '#FFD700', color: '#000', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 8, textDecoration: 'none' }}>
                Ir para Configurações →
              </Link>
            </div>
          )}

          {clients.map(client => {
            const bots = botsMap[client.id] || []
            const metrics = metricsMap[client.id] || { entered: 0, exited: 0 }
            const isOpen = expanded[client.id]

            return (
              <div key={client.id} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 14, overflow: 'hidden' }}>
                {/* Client header */}
                <div
                  onClick={() => setExpanded(p => ({ ...p, [client.id]: !isOpen }))}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', cursor: 'pointer', background: isOpen ? '#141414' : '#111' }}
                >
                  <Building2 size={16} style={{ color: '#FFD700', flexShrink: 0 }} />
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: 14, flex: 1 }}>{client.name}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginRight: 12 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#4ade80', fontWeight: 700, fontSize: 16, margin: 0 }}>{loading ? '—' : metrics.entered}</p>
                      <p style={{ color: '#444', fontSize: 10, margin: 0 }}>entradas hoje</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#f87171', fontWeight: 700, fontSize: 16, margin: 0 }}>{loading ? '—' : metrics.exited}</p>
                      <p style={{ color: '#444', fontSize: 10, margin: 0 }}>saídas hoje</p>
                    </div>
                    <span style={{ color: '#555', fontSize: 11, background: '#1a1a1a', padding: '2px 8px', borderRadius: 5 }}>
                      {bots.length} bots
                    </span>
                  </div>

                  <Link
                    to={`/client/${client.id}`}
                    onClick={e => e.stopPropagation()}
                    style={{ color: '#FFD700', fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,215,0,0.08)', padding: '4px 10px', borderRadius: 6, flexShrink: 0 }}
                  >
                    Ver →
                  </Link>

                  <ChevronRight size={14} style={{ color: '#333', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </div>

                {/* Bots list */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid #1a1a1a' }}>
                    {bots.length === 0 && (
                      <p style={{ color: '#444', fontSize: 12, padding: '12px 20px' }}>Nenhum bot cadastrado.</p>
                    )}
                    {bots.map(bot => (
                      <Link
                        key={bot.id}
                        to={`/bot/${bot.id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 10px 36px', borderBottom: '1px solid #141414', textDecoration: 'none', background: 'transparent' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <Bot size={13} style={{ color: '#FFD700', flexShrink: 0 }} />
                        <span style={{ color: '#ccc', fontSize: 12, flex: 1 }}>{bot.name}</span>
                        <span style={{ color: '#333', fontSize: 10, fontFamily: 'monospace' }}>{bot.slug}</span>
                        <BotStatusInline botId={bot.id} />
                        <ChevronRight size={12} style={{ color: '#333' }} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </PageWrapper>
  )
}
