import { useState } from 'react'
import api from '../../lib/api'
import IntegrationScript from '../UI/IntegrationScript'

const defaultData = {
  name: '', slug: '', botToken: '', botUsername: '', chatId: '',
  groupLink: '', affiliateLink: '', expertTgId: '', pixelId: '',
  capiToken: '', testCode: '', hotLeadDays: 3,
  eventEntered: 'EnteredChannel', eventExited: 'ExitedGroup', eventBet: 'BetClick',
  active: true,
}

const inputStyle = {
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  padding: '10px 14px',
  color: '#fff',
  fontSize: 13,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#666',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

function Field({ label, name, value, onChange, placeholder, type = 'text', hint, readOnly }) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle,
          borderColor: focused ? 'rgba(255,215,0,0.5)' : '#2a2a2a',
          color: readOnly ? '#444' : '#fff',
          cursor: readOnly ? 'default' : 'text',
        }}
      />
      {hint && <p style={{ fontSize: 11, color: '#3a3a3a', marginTop: 4 }}>{hint}</p>}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#FFD700', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>
          {title}
        </span>
        <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function Grid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange({ target: { name: 'active', type: 'checkbox', checked: !checked } })}
        style={{
          width: 40, height: 22, borderRadius: 11,
          background: checked ? '#FFD700' : '#2a2a2a',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%',
          background: checked ? '#000' : '#555',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: checked ? '#fff' : '#555', transition: 'color 0.2s' }}>
        Bot ativo
      </span>
    </label>
  )
}

export default function BotForm({ bot, expertId, clientId, onSave, onCancel }) {
  const [data, setData] = useState(bot ? {
    name: bot.name, slug: bot.slug, botToken: bot.bot_token || '',
    botUsername: bot.bot_username || '', chatId: bot.chat_id || '',
    groupLink: bot.group_link || '', affiliateLink: bot.affiliate_link || '',
    expertTgId: bot.expert_tg_id || '', pixelId: bot.pixel_id || '',
    capiToken: bot.capi_token || '', testCode: bot.test_code || '',
    hotLeadDays: bot.hot_lead_days || 3,
    eventEntered: bot.event_entered || 'EnteredChannel',
    eventExited: bot.event_exited || 'ExitedGroup',
    eventBet: bot.event_bet || 'BetClick',
    active: bot.active !== false,
  } : { ...defaultData })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const autoSlug = data.name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        .slice(0, 40) + '-' + Date.now().toString(36)
      const payload = { ...data, slug: bot ? data.slug : autoSlug, expertId, clientId }
      const result = bot
        ? await api.put(`/bots/${bot.id}`, payload)
        : await api.post('/bots', payload)
      onSave(result)
    } catch (err) {
      setError(err.error || 'Erro ao salvar bot')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, padding: '10px 14px', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Seção 1 — Identificação */}
      <Section title="Identificação">
        <Field label="Nome do Bot" name="name" value={data.name} onChange={onChange} placeholder="Bot 1 - Criativo Video" />
        {bot && (
          <Field
            label="Slug (ID único)"
            name="slug"
            value={data.slug}
            onChange={() => {}}
            readOnly
            hint="O slug não pode ser alterado após a criação."
          />
        )}
      </Section>

      {/* Seção 2 — Telegram */}
      <Section title="Telegram">
        <Grid cols={2}>
          <Field label="Token do Bot" name="botToken" value={data.botToken} onChange={onChange} placeholder="1234567890:ABCD..." />
          <Field label="Username do Bot" name="botUsername" value={data.botUsername} onChange={onChange} placeholder="meubot (sem @)" />
        </Grid>
        <Grid cols={2}>
          <Field label="Chat ID do Grupo" name="chatId" value={data.chatId} onChange={onChange} placeholder="-1001234567890" />
          <Field label="Telegram ID do Expert" name="expertTgId" value={data.expertTgId} onChange={onChange} placeholder="123456789" />
        </Grid>
        <Field label="Link de Convite do Grupo" name="groupLink" value={data.groupLink} onChange={onChange} placeholder="https://t.me/+..." />
      </Section>

      {/* Seção 3 — Monetização */}
      <Section title="Monetização">
        <Field label="Link de Afiliado / Casa de Aposta" name="affiliateLink" value={data.affiliateLink} onChange={onChange} placeholder="https://..." />
      </Section>

      {/* Seção 4 — Meta CAPI */}
      <Section title="Meta CAPI">
        <Grid cols={2}>
          <Field label="Pixel ID" name="pixelId" value={data.pixelId} onChange={onChange} placeholder="803910052153187" />
          <Field label="Token CAPI" name="capiToken" value={data.capiToken} onChange={onChange} placeholder="EAA..." />
        </Grid>
        <Grid cols={2}>
          <Field label="Código de Teste Pixel" name="testCode" value={data.testCode} onChange={onChange} placeholder="TEST12345" />
          <Field label="Dias para Lead Quente" name="hotLeadDays" value={data.hotLeadDays} onChange={onChange} type="number" />
        </Grid>
      </Section>

      {/* Seção 5 — Eventos */}
      <Section title="Eventos">
        <Grid cols={3}>
          <Field label="Evento Entrou" name="eventEntered" value={data.eventEntered} onChange={onChange} placeholder="EnteredChannel1" />
          <Field label="Evento Saiu" name="eventExited" value={data.eventExited} onChange={onChange} placeholder="ExitedGroup1" />
          <Field label="Evento Casa" name="eventBet" value={data.eventBet} onChange={onChange} placeholder="BetClick1" />
        </Grid>
      </Section>

      {/* Toggle ativo */}
      <div style={{ padding: '4px 0' }}>
        <Toggle checked={data.active} onChange={onChange} />
      </div>

      {/* Script de integração */}
      {bot?.slug && (
        <div onClick={(e) => e.stopPropagation()}>
          <IntegrationScript botSlug={bot.slug} appUrl={window.location.origin} />
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: 'transparent', border: '1px solid #2a2a2a', color: '#666', cursor: 'pointer',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#444'; e.target.style.color = '#aaa' }}
          onMouseLeave={e => { e.target.style.borderColor = '#2a2a2a'; e.target.style.color = '#666' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: '#FFD700', color: '#000', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Salvando...' : bot ? 'Salvar Alterações' : 'Criar Bot'}
        </button>
      </div>
    </form>
  )
}
