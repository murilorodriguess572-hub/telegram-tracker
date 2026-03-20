const variants = {
  hot:     'bg-orange-500/15 text-orange-400 border border-orange-500/25',
  cold:    'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  active:  'bg-green-500/15 text-green-400 border border-green-500/25',
  inactive:'bg-gray-500/15 text-gray-400 border border-gray-500/25',
  yellow:  'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/25',
  red:     'bg-red-500/15 text-red-400 border border-red-500/25',
}

export default function Badge({ variant = 'active', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.active} ${className}`}>
      {children}
    </span>
  )
}
