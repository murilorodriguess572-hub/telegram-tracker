import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/Layout/PageWrapper'
import MetricCard from '../components/Cards/MetricCard'
import DateFilter, { getDateRange } from '../components/UI/DateFilter'
import LoadingSkeleton from '../components/UI/LoadingSkeleton'
import CountUp from '../components/UI/CountUp'
import api from '../lib/api'
import { Users, Bot, TrendingUp, Building2, ChevronRight } from 'lucide-react'

export default function Overview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(getDateRange('today'))

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/metrics/overview?start=${dateRange.start}&end=${dateRange.end}`)
      setData(res)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [dateRange])

  const totalEntered = data?.clients?.reduce((s, c) => s + c.totalEntered, 0) || 0
  const totalToday = data?.clients?.reduce((s, c) => s + c.totalToday, 0) || 0
  const totalBots = data?.clients?.reduce((s, c) => s + c.botsCount, 0) || 0

  return (
    <PageWrapper onRefresh={fetch} loading={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-white text-2xl font-bold">Overview</h1>
            <p className="text-gray-500 text-sm mt-0.5">Visão geral de todos os clientes</p>
          </div>
          <DateFilter onChange={setDateRange} />
        </div>

        {/* Metric Cards */}
        {loading ? <LoadingSkeleton cards={4} /> : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Clientes" value={data?.total} icon={Building2} color="#8b5cf6" />
            <MetricCard label="Bots Ativos" value={totalBots} icon={Bot} color="#3b82f6" />
            <MetricCard label="Entradas (período)" value={totalEntered} icon={TrendingUp} color="#FFD700" />
            <MetricCard label="Entradas Hoje" value={totalToday} icon={Users} color="#22c55e" />
          </div>
        )}

        {/* Clients list */}
        <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <h2 className="text-white font-semibold text-base">Clientes</h2>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-[#1a1a1a] rounded-lg skeleton" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#1a1a1a]">
              {data?.clients?.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">
                  Nenhum cliente cadastrado ainda.{' '}
                  <Link to="/settings" className="text-[#FFD700] hover:underline">Ir para Configurações</Link>
                </div>
              )}
              {data?.clients?.map((client) => (
                <Link
                  key={client.id}
                  to={`/client/${client.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-[#141414] transition-colors group"
                >
                  <div className="w-9 h-9 bg-[#FFD700]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-[#FFD700]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">{client.name}</p>
                    <p className="text-gray-600 text-xs">{client.botsCount} bots</p>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-white text-sm font-semibold"><CountUp end={client.totalEntered} /></p>
                      <p className="text-gray-600 text-xs">no período</p>
                    </div>
                    <div>
                      <p className="text-green-400 text-sm font-semibold"><CountUp end={client.totalToday} /></p>
                      <p className="text-gray-600 text-xs">hoje</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-600 group-hover:text-[#FFD700] transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}
