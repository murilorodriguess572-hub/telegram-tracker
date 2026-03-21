import { Link } from 'react-router-dom'
import { Bot, ArrowRight } from 'lucide-react'
import CountUp from '../UI/CountUp'
import BotStatusBadge from '../UI/BotStatusBadge'

export default function BotCard({ bot }) {
  const { id, name, counts = {}, activeCount = 0, slug } = bot
  const entries     = counts.entered   || 0
  const views       = counts.pageviews || 0
  const hotLeads    = counts.hotLeads  || 0
  const exitedByBot = counts.exitedByBot || 0
  const convRate      = views > 0    ? ((entries / views) * 100).toFixed(1) : '0.0'
  const retentionRate = entries > 0  ? (((entries - exitedByBot) / entries) * 100).toFixed(0) : '100'

  return (
    <Link
      to={`/bot/${id}`}
      style={{
        display: 'block', background: '#111', border: '1px solid #1e1e1e',
        borderRadius: 14, overflow: 'hidden', textDecoration: 'none',
        transition: 'border-color 0.2s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.25)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Header */}
      <div style={{ background: '#141414', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.12)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot size={16} style={{ color: '#FFD700' }} />
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.2 }}>{name}</p>
            <p style={{ color: '#444', fontSize: 10, fontFamily: 'monospace', marginTop: 2 }}>{slug}</p>
          </div>
        </div>
        <ArrowRight size={14} style={{ color: '#333' }} />
      </div>

      {/* Status */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #141414' }}>
        <BotStatusBadge botId={id} />
      </div>

      {/* Métricas principais */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: '#141414' }}>
        {[
          { label: 'Entradas',  value: entries,     color: '#FFD700' },
          { label: 'Ativos',    value: activeCount,  color: '#4ade80' },
          { label: 'Hot Leads', value: hotLeads,     color: '#f97316' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111', padding: '12px 14px', textAlign: 'center' }}>
            <p style={{ color, fontWeight: 700, fontSize: 20 }}><CountUp end={value} /></p>
            <p style={{ color: '#555', fontSize: 10, marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Rodapé — conversão e retenção */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#141414' }}>
        <div style={{ background: '#0d0d0d', padding: '10px 14px' }}>
          <p style={{ color: '#555', fontSize: 10, marginBottom: 3 }}>Conv. (views→entrada)</p>
          <p style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{convRate}%</p>
        </div>
        <div style={{ background: '#0d0d0d', padding: '10px 14px' }}>
          <p style={{ color: '#555', fontSize: 10, marginBottom: 3 }}>Retenção do bot</p>
          <p style={{ color: exitedByBot > 0 ? '#f97316' : '#4ade80', fontWeight: 600, fontSize: 13 }}>
            {retentionRate}% <span style={{ color: '#444', fontSize: 10 }}>({exitedByBot} saíram)</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
