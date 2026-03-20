import { useState } from 'react'
import { Calendar } from 'lucide-react'

const presets = [
  { label: 'Hoje', value: 'today' },
  { label: '7 dias', value: '7d' },
  { label: '30 dias', value: '30d' },
  { label: 'Personalizado', value: 'custom' },
]

function getDateRange(preset) {
  const tz = 'America/Sao_Paulo'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })
  if (preset === 'today') return { start: today, end: today }
  if (preset === '7d') {
    const d = new Date(); d.setDate(d.getDate() - 6)
    return { start: d.toLocaleDateString('en-CA', { timeZone: tz }), end: today }
  }
  if (preset === '30d') {
    const d = new Date(); d.setDate(d.getDate() - 29)
    return { start: d.toLocaleDateString('en-CA', { timeZone: tz }), end: today }
  }
  return { start: today, end: today }
}

export default function DateFilter({ onChange }) {
  const [active, setActive] = useState('today')
  const [custom, setCustom] = useState({ start: '', end: '' })

  const handlePreset = (value) => {
    setActive(value)
    if (value !== 'custom') onChange(getDateRange(value))
  }

  const handleCustom = (field, val) => {
    const next = { ...custom, [field]: val }
    setCustom(next)
    if (next.start && next.end) onChange(next)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar size={16} className="text-gray-500" />
      <div className="flex items-center bg-[#141414] border border-[#1e1e1e] rounded-lg overflow-hidden">
        {presets.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-all ${
              active === p.value
                ? 'bg-[#FFD700] text-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {active === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={custom.start}
            onChange={(e) => handleCustom('start', e.target.value)}
            className="bg-[#141414] border border-[#1e1e1e] text-gray-300 text-xs rounded-lg px-2 py-1.5"
          />
          <span className="text-gray-600 text-xs">até</span>
          <input
            type="date"
            value={custom.end}
            onChange={(e) => handleCustom('end', e.target.value)}
            className="bg-[#141414] border border-[#1e1e1e] text-gray-300 text-xs rounded-lg px-2 py-1.5"
          />
        </div>
      )}
    </div>
  )
}

export { getDateRange }
