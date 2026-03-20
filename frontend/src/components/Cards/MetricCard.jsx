import CountUp from '../UI/CountUp'

export default function MetricCard({ label, value, icon: Icon, color = '#FFD700', suffix = '', sub }) {
  return (
    <div className="bg-[#141414] border border-[#1e1e1e] rounded-xl p-5 hover:border-[#2a2a2a] transition-all group">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-500 text-sm">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-white mb-1">
        <CountUp end={Number(value) || 0} suffix={suffix} />
      </p>
      {sub && <p className="text-xs text-gray-600">{sub}</p>}
    </div>
  )
}
