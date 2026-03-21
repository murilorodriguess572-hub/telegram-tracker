export default function FunnelViz({ counts }) {
  const steps = [
    { label: 'Page Views', value: counts.pageviews || 0, color: '#3b82f6' },
    { label: 'Cliques LP', value: counts.clicks    || 0, color: '#8b5cf6' },
    { label: 'Entraram',   value: counts.entered   || 0, color: '#FFD700' },
    { label: 'Casa',       value: counts.betClicks || 0, color: '#f97316' },
  ]

  const max = Math.max(...steps.map(s => s.value), 1)

  return (
    <div style={{ width: '100%', padding: '8px 0' }}>
      {/* Barras verticais alinhadas na base */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 200, width: '100%' }}>
        {steps.map((step) => {
          const heightPct = Math.max((step.value / max) * 100, step.value > 0 ? 8 : 2)
          return (
            <div key={step.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <span style={{ color: step.color, fontWeight: 800, fontSize: 22 }}>
                {step.value.toLocaleString('pt-BR')}
              </span>
              <div style={{
                width: '100%',
                height: `${heightPct}%`,
                background: step.color,
                borderRadius: '6px 6px 0 0',
                opacity: 0.9,
                transition: 'height 0.6s ease',
                minHeight: 4,
              }} />
            </div>
          )
        })}
      </div>

      {/* Labels e conversão abaixo */}
      <div style={{ display: 'flex', gap: 2, marginTop: 0 }}>
        {steps.map((step, i) => {
          const conv = i > 0 && steps[i - 1].value > 0
            ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
            : null
          return (
            <div key={step.label} style={{ flex: 1, padding: '8px 4px', borderTop: `2px solid ${step.color}`, background: '#0d0d0d' }}>
              <p style={{ color: '#aaa', fontSize: 11, fontWeight: 600, margin: 0 }}>{step.label}</p>
              {conv !== null && (
                <p style={{ color: '#555', fontSize: 10, margin: '2px 0 0' }}>{conv}% conv.</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
