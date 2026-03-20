import { useState } from 'react'
import { Calendar } from 'lucide-react'

const presets = [
  { label: 'Hoje',          value: 'today' },
  { label: '7 dias',        value: '7d'    },
  { label: '30 dias',       value: '30d'   },
  { label: 'Personalizado', value: 'custom'},
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
  const [active, setActive]   = useState('today')
  const [custom, setCustom]   = useState({ start: '', end: '' })
  const [tempCustom, setTemp] = useState({ start: '', end: '' })

  const handlePreset = (value) => {
    setActive(value)
    if (value !== 'custom') onChange(getDateRange(value))
  }

  const handleApply = () => {
    if (tempCustom.start && tempCustom.end) {
      setCustom(tempCustom)
      onChange(tempCustom)
    }
  }

  const inputStyle = {
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    color: '#ccc',
    borderRadius: 8,
    padding: '6px 10px',
    fontSize: 12,
    outline: 'none',
    colorScheme: 'dark',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {/* Barra de presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Calendar size={14} style={{ color: '#555' }} />
        <div style={{
          display: 'flex', background: '#111', border: '1px solid #1e1e1e',
          borderRadius: 10, overflow: 'hidden', padding: 3, gap: 2,
        }}>
          {presets.map((p) => (
            <button
              key={p.value}
              onClick={() => handlePreset(p.value)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 7,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: active === p.value ? '#FFD700' : 'transparent',
                color:      active === p.value ? '#000'    : '#666',
              }}
              onMouseEnter={e => { if (active !== p.value) e.target.style.color = '#fff' }}
              onMouseLeave={e => { if (active !== p.value) e.target.style.color = '#666' }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs de data personalizada */}
      {active === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="date"
            value={tempCustom.start}
            onChange={e => setTemp(p => ({ ...p, start: e.target.value }))}
            style={inputStyle}
          />
          <span style={{ color: '#444', fontSize: 12 }}>até</span>
          <input
            type="date"
            value={tempCustom.end}
            onChange={e => setTemp(p => ({ ...p, end: e.target.value }))}
            style={inputStyle}
          />
          <button
            onClick={handleApply}
            style={{
              background: '#FFD700', color: '#000', fontWeight: 700,
              fontSize: 12, padding: '6px 14px', borderRadius: 8,
              border: 'none', cursor: 'pointer',
            }}
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  )
}

export { getDateRange }
