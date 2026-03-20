import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageWrapper from '../components/Layout/PageWrapper'
import MetricCard from '../components/Cards/MetricCard'
import DateFilter from '../components/UI/DateFilter'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import CountUp from '../components/UI/CountUp'
import api from '../lib/api'
import { Users, TrendingUp, Flame, ChevronRight, UserCircle2 } from 'lucide-react'

export default function ClientPage() {
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
      const res = await api.get(`/metrics/client/${id}?start=${start}&end=${end}`)
      if (currentFetch !== fetchRef.current) return
      setData(res)
    } catch (e) { console.error(e) }
    finally {
      if (currentFetch === fetchRef.current) setLoading(false)
    }
  }

  useEffect(() => { fetchData(startDate, endDate) }, [id, startDate, endDate])

  const totals = data?.experts?.reduce((acc, e) => {
    for (const [k, v] of Object.entries(e.totals || {})) acc[k] = (acc[k] || 0) + v
    return acc
  }, {}) || {}

  return (
    <PageWrapper onRefresh={() => fetchData(startDate, endDate)} loading={loading}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">{data?.client?.name || 'Carregando...'}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{data?.experts?.length || 0} experts</p>
          </div>
          <DateFilter onChange={({ start, end }) => { setStartDate(start); setEndDate(end) }} defaultPreset="7d" />
        </div>

        {loading ? <LoadingSkeleton cards={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Page Views" value={totals.pageviews} icon={Users} color="#3b82f6" />
            <MetricCard label="Entradas" value={totals.entered} icon={TrendingUp} color="#FFD700" />
            <MetricCard label="Hot Leads" value={totals.hotLeads} icon={Flame} color="#f97316" />
            <MetricCard label="Cliques Casa" value={totals.betClicks} icon={TrendingUp} color="#22c55e" />
          </div>
        )}

        {/* Experts */}
        <div className="space-y-4">
          <h2 className="text-white font-semibold text-base">Experts</h2>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-[#141414] rounded-xl skeleton" />)}
            </div>
          ) : (
            <>
              {data?.experts?.length === 0 && (
                <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-5 py-8 text-center text-gray-500 text-sm">
                  Nenhum expert cadastrado.{' '}
                  <Link to="/settings" className="text-[#FFD700] hover:underline">Ir para Configurações</Link>
                </div>
              )}
              {data?.experts?.map((expert) => (
                <Link
                  key={expert.id}
                  to={`/expert/${expert.id}`}
                  className="block bg-[#111111] border border-[#1e1e1e] rounded-xl px-5 py-4 hover:border-[#FFD700]/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1e1e1e] rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCircle2 size={20} className="text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{expert.name}</p>
                      <p className="text-gray-600 text-xs">{expert.bots?.length || 0} bots</p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      {[
                        { label: 'Views', value: expert.totals?.pageviews, color: '#3b82f6' },
                        { label: 'Entradas', value: expert.totals?.entered, color: '#FFD700' },
                        { label: 'Hot Leads', value: expert.totals?.hotLeads, color: '#f97316' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p className="text-sm font-semibold" style={{ color }}><CountUp end={value || 0} /></p>
                          <p className="text-gray-600 text-xs">{label}</p>
                        </div>
                      ))}
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-[#FFD700] transition-colors ml-2" />
                  </div>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
