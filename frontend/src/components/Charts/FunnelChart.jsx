import CountUp from '../UI/CountUp'
import { ArrowDown, LogOut } from 'lucide-react'

const steps = [
  { key: 'pageviews', label: 'Page Views', color: '#3b82f6', bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'clicks',    label: 'Cliques LP', color: '#8b5cf6', bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'entered',   label: 'Entraram no Grupo', color: '#FFD700', bg: 'bg-[#FFD700]/10 border-[#FFD700]/20' },
  { key: 'betClicks', label: 'Clicaram na Casa', color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/20' },
  { key: 'hotLeads',  label: 'Hot Leads', color: '#22c55e', bg: 'bg-green-500/10 border-green-500/20' },
]

function rate(a, b) {
  if (!b || b === 0) return null
  return ((a / b) * 100).toFixed(1)
}

export default function FunnelChart({ counts = {} }) {
  const exitedTotal = counts.exitedTotal ?? ((counts.coldLeads || 0) + (counts.exited || 0) + (counts.hotLeads || 0))
  const entered = counts.entered || 0
  const exitRate = entered > 0 ? ((exitedTotal / entered) * 100).toFixed(1) : null
  const maxVal = counts[steps[0].key] || 1

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const value = counts[step.key] || 0
        const prev = i > 0 ? (counts[steps[i - 1].key] || 0) : null
        const conversion = prev !== null ? rate(value, prev) : null
        const width = Math.max(15, Math.min(100, (value / maxVal) * 100))

        return (
          <div key={step.key}>
            <div className={`border rounded-xl p-4 ${step.bg} transition-all hover:scale-[1.01]`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">{step.label}</span>
                <div className="flex items-center gap-3">
                  {conversion !== null && (
                    <span className="text-xs text-gray-500">{conversion}% conv.</span>
                  )}
                  <span className="text-xl font-bold text-white">
                    <CountUp end={value} />
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${width}%`, background: step.color }}
                />
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowDown size={14} className="text-gray-700" />
              </div>
            )}
          </div>
        )
      })}

      {/* Saídas do grupo */}
      <div className="pt-1">
        <div className="border rounded-xl p-4 bg-red-500/5 border-red-500/15 transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <LogOut size={14} className="text-red-400" />
              <span className="text-sm font-medium text-gray-300">Saídas do grupo</span>
              <span className="text-[10px] text-gray-600 bg-black/30 px-2 py-0.5 rounded-full">
                coldLeads + exited + hotLeads
              </span>
            </div>
            <div className="flex items-center gap-3">
              {exitRate !== null && (
                <span className="text-xs text-gray-500">{exitRate}% dos que entraram</span>
              )}
              <span className="text-xl font-bold text-red-400">
                <CountUp end={exitedTotal} />
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(15, Math.min(100, (exitedTotal / maxVal) * 100))}%`, background: '#ef4444' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
