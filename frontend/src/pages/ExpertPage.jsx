import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import PageWrapper from '../components/Layout/PageWrapper'
import MetricCard from '../components/Cards/MetricCard'
import BotCard from '../components/Cards/BotCard'
import DateFilter from '../components/UI/DateFilter'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import LineChart from '../components/Charts/LineChart'
import api from '../lib/api'
import { Users, TrendingUp, Flame, MousePointer } from 'lucide-react'

export default function ExpertPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const fetchRef = useRef(0)
  const tz = 'America/Sao_Paulo'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const [startDate, setStartDate] = useState(sevenDaysAgo.toLocaleDateString('en-CA', { timeZone: tz }))
  const [endDate, setEndDate] = useState(today)

  const fetchData = async (start, end) => {
    const currentFetch = ++fetchRef.current
    setLoading(true)
    try {
      const res = await api.get(`/metrics/expert/${id}?start=${start}&end=${end}`)
      if (currentFetch !== fetchRef.current) return
      setData(res)
    } catch (e) { console.error(e) }
    finally {
      if (currentFetch === fetchRef.current) setLoading(false)
    }
  }

  useEffect(() => { fetchData(startDate, endDate) }, [id, startDate, endDate])

  const totals = data?.bots?.reduce((acc, b) => {
    for (const [k, v] of Object.entries(b.counts || {})) acc[k] = (acc[k] || 0) + v
    return acc
  }, {}) || {}

  // Aggregate daily chart data from all bots (simplified: just totals per bot)
  const convRate = totals.pageviews > 0
    ? ((totals.entered / totals.pageviews) * 100).toFixed(1)
    : '0.0'

  return (
    <PageWrapper onRefresh={() => fetchData(startDate, endDate)} loading={loading}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{data?.expert?.name || 'Carregando...'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{data?.bots?.length || 0} bots</p>
          </div>
          <DateFilter onChange={({ start, end }) => { setStartDate(start); setEndDate(end) }} defaultPreset="7d" />
        </div>

        {loading ? <LoadingSkeleton cards={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Page Views" value={totals.pageviews} icon={Users} color="#3b82f6" />
            <MetricCard label="Entradas" value={totals.entered} icon={TrendingUp} color="#FFD700" />
            <MetricCard label="Hot Leads" value={totals.hotLeads} icon={Flame} color="#f97316" />
            <MetricCard label="Taxa de Conv." value={null} icon={MousePointer} color="#22c55e" sub={`${convRate}% (views → entradas)`} />
          </div>
        )}

        {/* Bots grid */}
        <div>
          <h2 className="text-white font-semibold text-base mb-4">Bots</h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-44 bg-[#141414] rounded-xl skeleton" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.bots?.map(bot => (
                <BotCard key={bot.id} bot={bot} />
              ))}
              {data?.bots?.length === 0 && (
                <div className="col-span-3 text-center text-gray-500 text-sm py-8">
                  Nenhum bot cadastrado para este expert.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
