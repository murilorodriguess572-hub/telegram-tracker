import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import PageWrapper from '../components/Layout/PageWrapper'
import MetricCard from '../components/Cards/MetricCard'
import MemberRow from '../components/Cards/MemberRow'
import DateFilter from '../components/UI/DateFilter'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import { SkeletonRow } from '../components/UI/LoadingSkeleton'
import LineChart from '../components/Charts/LineChart'
import FunnelChart from '../components/Charts/FunnelChart'
import HeatmapChart from '../components/Charts/HeatmapChart'
import api from '../lib/api'
import IntegrationScript from '../components/UI/IntegrationScript'
import { Users, TrendingUp, Flame, MousePointer, Clock, Activity, LogOut } from 'lucide-react'

function Section({ title, children }) {
  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1e1e1e]">
        <h3 className="text-white font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function BotPage() {
  const { id } = useParams()
  const [botInfo, setBotInfo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const fetchRef = useRef(0)
  const tz = 'America/Sao_Paulo'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const [startDate, setStartDate] = useState(sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: tz }))
  const [endDate, setEndDate] = useState(today)

  const fetchData = async (start, end) => {
    const currentFetch = ++fetchRef.current
    if (!metrics) setLoading(true)
    else setRefreshing(true)
    try {
      const bot = await api.get(`/bots/${id}`)
      if (currentFetch !== fetchRef.current) return
      setBotInfo(bot)
      const m = await api.get(`/metrics/${bot.slug}?start=${start}&end=${end}&days=30`)
      if (currentFetch !== fetchRef.current) return
      setMetrics(m)
    } catch (e) { console.error(e) }
    finally {
      if (currentFetch === fetchRef.current) { setLoading(false); setRefreshing(false) }
    }
  }

  useEffect(() => { fetchData(startDate, endDate) }, [id, startDate, endDate])

  const counts = metrics?.counts || {}
  const convRate = counts.pageviews > 0 ? ((counts.entered / counts.pageviews) * 100).toFixed(1) : '0.0'
  const byDay = (metrics?.byDay || []).map(r => ({ dia: r.dia?.slice(5), total: Number(r.total) }))

  return (
    <PageWrapper onRefresh={() => fetchData(startDate, endDate)} loading={loading} refreshing={refreshing}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{botInfo?.name || 'Bot'}</h1>
            <p className="text-gray-600 text-xs font-mono mt-0.5">{botInfo?.slug}</p>
          </div>
          <DateFilter onChange={({ start, end }) => { setStartDate(start); setEndDate(end) }} defaultPreset="7d" />
        </div>

        {loading ? <LoadingSkeleton cards={5} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard label="Page Views" value={counts.pageviews} icon={Users} color="#3b82f6" />
            <MetricCard label="Entradas" value={counts.entered} icon={TrendingUp} color="#FFD700" />
            <MetricCard label="Hot Leads" value={counts.hotLeads} icon={Flame} color="#f97316" />
            <MetricCard label="Cliques Casa" value={counts.betClicks} icon={MousePointer} color="#22c55e" />
            <MetricCard
              label="Saídas Totais"
              value={counts.exitedTotal ?? ((counts.coldLeads || 0) + (counts.exited || 0) + (counts.hotLeads || 0))}
              icon={LogOut}
              color="#ef4444"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Funil de Conversão">
            {loading
              ? <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-[#1a1a1a] rounded-lg skeleton" />)}</div>
              : <FunnelChart counts={counts} />
            }
          </Section>

          <Section title={`Membros Ativos (${metrics?.members?.length || 0})`}>
            {loading
              ? <div>{[1,2,3,4].map(i => <SkeletonRow key={i} />)}</div>
              : (
                <div className="max-h-80 overflow-y-auto">
                  {metrics?.members?.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nenhum membro ativo</p>}
                  {metrics?.members?.map((m, i) => <MemberRow key={i} member={m} hotLeadDays={botInfo?.hot_lead_days || 3} />)}
                </div>
              )
            }
          </Section>
        </div>

        <Section title="Entradas por Dia (últimos 30 dias)">
          {loading
            ? <div className="h-60 bg-[#1a1a1a] rounded-lg skeleton" />
            : <LineChart data={byDay} lines={[{ dataKey: 'total', name: 'Entradas', color: '#FFD700' }]} />
          }
        </Section>

        <Section title="Distribuição por Hora do Dia">
          {loading
            ? <div className="h-20 bg-[#1a1a1a] rounded-lg skeleton" />
            : <HeatmapChart data={metrics?.byHour || []} />
          }
        </Section>

        {botInfo?.slug && (
          <Section title="Script de Integração">
            <IntegrationScript
              botSlug={botInfo.slug}
              appUrl={window.location.origin}
            />
          </Section>
        )}

        <Section title="Eventos Recentes">
          {loading
            ? <div>{[1,2,3].map(i => <SkeletonRow key={i} />)}</div>
            : (
              <div className="max-h-72 overflow-y-auto">
                {(metrics?.recentEvents || []).map((ev, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
                    <Activity size={14} className="text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-mono text-[#FFD700]/80">{ev.event_type}</span>
                      {ev.first_name && <span className="text-gray-400 text-xs ml-2">{ev.first_name}</span>}
                      {ev.username && <span className="text-gray-600 text-xs ml-1">@{ev.username}</span>}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600 text-xs flex-shrink-0">
                      <Clock size={11} />
                      {new Date(ev.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                {(!metrics?.recentEvents?.length) && <p className="text-gray-500 text-sm text-center py-4">Nenhum evento ainda</p>}
              </div>
            )
          }
        </Section>
      </div>
    </PageWrapper>
  )
}
