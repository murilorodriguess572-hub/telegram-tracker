import {
  ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 shadow-xl">
      <p className="text-gray-400 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: <span className="text-white">{p.value?.toLocaleString('pt-BR')}</span>
        </p>
      ))}
    </div>
  )
}

export default function LineChart({ data = [], lines = [], height = 260 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
        <XAxis dataKey="dia" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />}
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name || line.dataKey}
            stroke={line.color || '#FFD700'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: line.color || '#FFD700' }}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  )
}
