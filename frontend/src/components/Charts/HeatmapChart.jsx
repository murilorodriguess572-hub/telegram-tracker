const HOURS = Array.from({ length: 24 }, (_, i) => i)

function toMap(data) {
  const map = {}
  for (const row of data) map[Number(row.hora)] = Number(row.total)
  return map
}

export default function HeatmapChart({ data = [] }) {
  const map = toMap(data)
  const max = Math.max(...Object.values(map), 1)

  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {HOURS.map((h) => {
          const val = map[h] || 0
          const intensity = val / max
          const alpha = Math.max(0.05, intensity)
          return (
            <div
              key={h}
              className="aspect-square rounded-md flex flex-col items-center justify-center cursor-default transition-transform hover:scale-110"
              style={{ background: `rgba(255, 215, 0, ${alpha})` }}
              title={`${String(h).padStart(2, '0')}h: ${val} entradas`}
            >
              <span className="text-[9px] text-gray-500">{String(h).padStart(2, '0')}</span>
              {val > 0 && (
                <span className="text-[9px] font-bold" style={{ color: `rgba(255,215,0,${0.5 + intensity * 0.5})` }}>
                  {val}
                </span>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-600">Menos</span>
        <div className="flex gap-0.5">
          {[0.05, 0.2, 0.4, 0.6, 0.8, 1].map((a) => (
            <div key={a} className="w-4 h-3 rounded-sm" style={{ background: `rgba(255,215,0,${a})` }} />
          ))}
        </div>
        <span className="text-xs text-gray-600">Mais</span>
      </div>
    </div>
  )
}
