import CountUp from '../UI/CountUp'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function MetricCard({ label, value, icon: Icon, color = '#FFD700', suffix = '', sub, change }) {
  const hasChange = change !== undefined && change !== null
  const isPositive = change > 0
  const isNeutral  = change === 0

  return (
    <div
      className="relative rounded-xl overflow-hidden transition-all duration-300 cursor-default group"
      style={{ background: '#111', border: '1px solid #1e1e1e', padding: 24 }}
      onMouseEnter={e => {
        e.currentTarget.style.border  = `1px solid ${color}35`
        e.currentTarget.style.boxShadow = `0 0 28px ${color}0e`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.border  = '1px solid #1e1e1e'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* glow bg */}
      <div
        className="absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `${color}15`, transform: 'translate(35%,-35%)' }}
      />

      {/* Linha topo: ícone + badge variação */}
      <div className="flex items-start justify-between mb-5">
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ width: 48, height: 48, background: `${color}12`, border: `1px solid ${color}20` }}
        >
          {Icon && <Icon size={24} style={{ color }} />}
        </div>
        {hasChange && (
          <div
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: isNeutral ? '#ffffff0a' : isPositive ? '#22c55e15' : '#ef444415',
              color: isNeutral ? '#6b7280' : isPositive ? '#4ade80' : '#f87171',
            }}
          >
            {isNeutral ? <Minus size={11} /> : isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      {/* Número grande */}
      <p className="text-[34px] font-bold text-white leading-none mb-2">
        <CountUp end={Number(value) || 0} suffix={suffix} />
      </p>

      {/* Label */}
      <p className="text-gray-500 text-sm">{label}</p>
      {sub && <p className="text-gray-700 text-xs mt-1">{sub}</p>}
    </div>
  )
}
