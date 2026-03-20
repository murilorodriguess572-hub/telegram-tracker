import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/Layout/PageWrapper'
import MetricCard from '../components/Cards/MetricCard'
import DateFilter, { getDateRange } from '../components/UI/DateFilter'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import CountUp from '../components/UI/CountUp'
import LineChart from '../components/Charts/LineChart'
import api from '../lib/api'
import { TrendingUp, Bot, Building2, Flame, ChevronRight } from 'lucide-react'

// ── Agrega entradas por dia somando todos os bots ─────────────
async function fetchLineData(bots, days = 7) {
  const tz = 'America/Sao_Paulo'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  const from  = new Date(); from.setDate(from.getDate() - (days - 1))
  const start = from.toLocaleDateString('en-CA', { timeZone: tz })

  const dayMap = {}
  await Promise.all(
    bots.map(async (bot) => {
      try {
        const m = await api.get(`/metrics/${bot.slug}?start=${start}&end=${today}&days=${days}`)
        ;(m.byDay || []).forEach(row => {
          dayMap[row.dia] = (dayMap[row.dia] || 0) + Number(row.total)
        })
      } catch {}
    })
  )

  // Garante todos os dias no range, mesmo sem dados
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-CA', { timeZone: tz })
    const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: tz })
    result.push({ dia: label, total: dayMap[key] || 0 })
  }
  return result
}

function ClientRow({ client }) {
  return (
    <Link
      to={`/client/${client.id}`}
      className="flex items-center gap-4 px-5 py-4 transition-colors group"
      style={{ borderBottom: '1px solid #141414' }}
      onMouseEnter={e => e.currentTarget.style.background = '#111'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 36, height: 36, background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.12)' }}
      >
        <Building2 size={16} style={{ color: '#FFD700' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm">{client.name}</p>
        <p className="text-gray-600 text-xs mt-0.5">{client.botsCount} {client.botsCount === 1 ? 'bot' : 'bots'}</p>
      </div>
      <div className="flex items-center gap-8 text-right mr-2">
        <div>
          <p className="text-white text-sm font-semibold"><CountUp end={client.totalEntered || 0} /></p>
          <p className="text-gray-600 text-[11px]">período</p>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#4ade80' }}><CountUp end={client.totalToday || 0} /></p>
          <p className="text-gray-600 text-[11px]">hoje</p>
        </div>
      </div>
      <ChevronRight size={14} className="text-gray-700 group-hover:text-[#FFD700] transition-colors flex-shrink-0" />
    </Link>
  )
}

export default function Overview() {
  const [data,      setData]      = useState(null)
  const [lineData,  setLineData]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [chartLoad, setChartLoad] = useState(true)
  const [dateRange, setDateRange] = useState(getDateRange('today'))

  const loadAll = useCallback(async () => {
    setLoading(true)
    setChartLoad(true)
    try {
      const [overview, allBots] = await Promise.all([
        api.get(`/metrics/overview?start=${dateRange.start}&end=${dateRange.end}`),
        api.get('/bots'),
      ])
      setData(overview)

      // Gráfico com dados reais dos últimos 7 dias
      if (allBots?.length) {
        const ld = await fetchLineData(allBots, 7)
        setLineData(ld)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false); setChartLoad(false) }
  }, [dateRange])

  useEffect(() => { loadAll() }, [loadAll])

  const totalEntered = data?.clients?.reduce((s, c) => s + (c.totalEntered || 0), 0) || 0
  const totalToday   = data?.clients?.reduce((s, c) => s + (c.totalToday   || 0), 0) || 0
  const totalBots    = data?.clients?.reduce((s, c) => s + (c.botsCount    || 0), 0) || 0
  const totalClients = data?.total || 0

  return (
    <PageWrapper onRefresh={loadAll} loading={loading}>
      <div className="space-y-6" style={{ maxWidth: 1100 }}>

        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-white font-bold tracking-tight" style={{ fontSize: 28 }}>
              Visão Geral
            </h1>
            <p className="text-gray-500 text-sm mt-1">Resumo de todos os clientes e bots</p>
          </div>
          <DateFilter onChange={setDateRange} />
        </div>

        {/* Cards */}
        {loading ? <LoadingSkeleton cards={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Clientes"          value={totalClients} icon={Building2}  color="#FFD700" />
            <MetricCard label="Bots Ativos"        value={totalBots}    icon={Bot}         color="#60a5fa" />
            <MetricCard label="Entradas (período)" value={totalEntered} icon={TrendingUp}  color="#FFD700" />
            <MetricCard label="Entradas Hoje"      value={totalToday}   icon={Flame}       color="#fb923c" />
          </div>
        )}

        {/* Gráfico + Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Gráfico linha */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <div>
                <p className="text-white font-semibold text-sm">Entradas por dia</p>
                <p className="text-gray-600 text-xs mt-0.5">Todos os bots · últimos 7 dias</p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,215,0,0.1)', color: '#FFD700' }}>
                7 dias
              </span>
            </div>
            <div className="px-4 pb-4 pt-2">
              {chartLoad ? (
                <div className="rounded-lg skeleton" style={{ height: 200 }} />
              ) : lineData.every(d => d.total === 0) ? (
                <div className="flex items-center justify-center" style={{ height: 200 }}>
                  <p className="text-gray-600 text-sm">Nenhuma entrada nos últimos 7 dias</p>
                </div>
              ) : (
                <LineChart
                  data={lineData}
                  lines={[{ dataKey: 'total', name: 'Entradas', color: '#FFD700' }]}
                  height={200}
                />
              )}
            </div>
          </div>

          {/* Resumo lateral */}
          <div className="rounded-xl overflow-hidden" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
              <p className="text-white font-semibold text-sm">Resumo do período</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {[
                { label: 'Clientes',          value: totalClients, color: '#FFD700' },
                { label: 'Bots configurados', value: totalBots,    color: '#60a5fa' },
                { label: 'Total de entradas', value: totalEntered, color: '#FFD700' },
                { label: 'Entradas hoje',     value: totalToday,   color: '#4ade80' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{label}</span>
                  <span className="font-bold text-sm" style={{ color }}>
                    {loading ? '—' : <CountUp end={value} />}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid #1a1a1a' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <p className="text-white font-semibold text-sm">Clientes</p>
            <Link
              to="/settings"
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: '#FFD700', background: 'rgba(255,215,0,0.07)' }}
            >
              + Novo cliente
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl skeleton" />)}
            </div>
          ) : data?.clients?.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-gray-500 text-sm mb-2">Nenhum cliente cadastrado ainda</p>
              <Link to="/settings" className="text-sm hover:underline" style={{ color: '#FFD700' }}>
                Ir para Configurações →
              </Link>
            </div>
          ) : (
            <div>
              {data.clients.map(client => <ClientRow key={client.id} client={client} />)}
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  )
}
