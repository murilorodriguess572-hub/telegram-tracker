export default function FunnelViz({ counts }) {
  const steps = [
    { label: 'Page Views',        value: counts.pageviews  || 0, color: '#3b82f6' },
    { label: 'Cliques LP',        value: counts.clicks     || 0, color: '#8b5cf6' },
    { label: 'Entraram no Grupo', value: counts.entered    || 0, color: '#FFD700' },
    { label: 'Clicaram na Casa',  value: counts.betClicks  || 0, color: '#f97316' },
  ]

  const max = steps[0].value || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const pct = Math.max((step.value / max) * 100, step.value > 0 ? 4 : 0)
        const conv = i > 0 && steps[i - 1].value > 0
          ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
          : null

        return (
          <div key={step.label}>
            <div style={{ position: 'relative', marginBottom: 2 }}>
              <div style={{
                height: 52,
                background: step.color,
                width: `${pct}%`,
                minWidth: step.value > 0 ? 60 : 0,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                transition: 'width 0.6s ease',
                opacity: 0.92,
              }}>
                <span style={{ color: '#000', fontWeight: 700, fontSize: 13 }}>{step.label}</span>
                <span style={{ color: '#000', fontWeight: 900, fontSize: 20 }}>{step.value.toLocaleString('pt-BR')}</span>
              </div>
              {conv !== null && (
                <div style={{
                  position: 'absolute', left: `${pct}%`, top: '50%',
                  transform: 'translate(8px, -50%)',
                  background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: 6, padding: '2px 8px',
                  fontSize: 11, color: '#aaa', whiteSpace: 'nowrap',
                }}>
                  {conv}% conv.
                </div>
              )}
            </div>
            {i < steps.length - 1 && (
              <div style={{ textAlign: 'left', paddingLeft: 20, color: '#333', fontSize: 16, lineHeight: 1, marginBottom: 2 }}>▼</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
