import Badge from '../UI/Badge'
import { User, Clock } from 'lucide-react'

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000)
  if (secs < 60) return `${secs}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}min`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`
  return `${Math.floor(secs / 86400)}d`
}

export default function MemberRow({ member, hotLeadDays = 3 }) {
  const { first_name, username, joined_at, clicked_bet, days_in_group } = member
  const daysActive = ((Date.now() - new Date(joined_at)) / 86400000).toFixed(1)
  const isHot = parseFloat(daysActive) >= hotLeadDays

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#141414]/50 transition-colors px-2 rounded">
      <div className="w-8 h-8 bg-[#1e1e1e] rounded-full flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate">{first_name || 'Anônimo'}</p>
        {username && <p className="text-gray-500 text-xs">@{username}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={11} />
          {timeAgo(joined_at)}
        </div>
        {clicked_bet && <Badge variant="yellow">Casa</Badge>}
        <Badge variant={isHot ? 'hot' : 'cold'}>{isHot ? 'Quente' : 'Frio'}</Badge>
      </div>
    </div>
  )
}
