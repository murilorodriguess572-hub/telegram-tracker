import { Link } from 'react-router-dom'
import { Bot, Users, TrendingUp, ArrowRight } from 'lucide-react'
import Badge from '../UI/Badge'
import CountUp from '../UI/CountUp'
import BotStatusBadge from '../UI/BotStatusBadge'

export default function BotCard({ bot }) {
  const { id, name, counts = {}, activeCount = 0, active } = bot

  const entries = counts.entered || 0
  const views = counts.pageviews || 0
  const hotLeads = counts.hotLeads || 0
  const convRate = views > 0 ? ((entries / views) * 100).toFixed(1) : '0.0'

  return (
    <Link
      to={`/bot/${id}`}
      className="block bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#FFD700]/30 hover:bg-[#141414]/80 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#FFD700]/10 rounded-lg flex items-center justify-center">
            <Bot size={18} className="text-[#FFD700]" />
          </div>
          <div>
            <p className="text-white font-medium text-sm leading-tight">{name}</p>
            <Badge variant={active ? 'active' : 'inactive'} className="mt-1">
              {active ? 'Ativo' : 'Inativo'}
            </Badge>
            <div className="mt-2">
              <BotStatusBadge botId={id} />
            </div>
          </div>
        </div>
        <ArrowRight size={16} className="text-gray-600 group-hover:text-[#FFD700] transition-colors" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Entradas</p>
          <p className="text-white font-bold text-lg"><CountUp end={entries} /></p>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-500 text-xs mb-1">Ativos</p>
          <p className="text-white font-bold text-lg flex items-center gap-1">
            <Users size={14} className="text-green-400" />
            <CountUp end={activeCount} />
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#1e1e1e] flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <TrendingUp size={12} />
          Conversão: <span className="text-white font-medium">{convRate}%</span>
        </div>
        {hotLeads > 0 && (
          <Badge variant="hot">{hotLeads} quentes</Badge>
        )}
      </div>
    </Link>
  )
}
