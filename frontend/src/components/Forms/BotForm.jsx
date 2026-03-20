import { useState } from 'react'
import api from '../../lib/api'

const defaultData = {
  name: '', slug: '', botToken: '', botUsername: '', chatId: '',
  groupLink: '', affiliateLink: '', expertTgId: '', pixelId: '',
  capiToken: '', testCode: '', hotLeadDays: 3,
  eventEntered: 'EnteredChannel', eventExited: 'ExitedGroup', eventBet: 'BetClick',
  active: true,
}

function Field({ label, name, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#FFD700]/50 placeholder-gray-700"
      />
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
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
      const payload = { ...data, expertId, clientId }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Nome do Bot" name="name" value={data.name} onChange={onChange} placeholder="Bot 1 - Criativo Video" />
        <Field label="Slug (ID único)" name="slug" value={data.slug} onChange={onChange} placeholder="maria-bot-1" hint="Usado nas URLs. Não altere após criar." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Token do Bot" name="botToken" value={data.botToken} onChange={onChange} placeholder="1234567890:ABCD..." />
        <Field label="Username do Bot" name="botUsername" value={data.botUsername} onChange={onChange} placeholder="meubot (sem @)" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Chat ID do Grupo" name="chatId" value={data.chatId} onChange={onChange} placeholder="-1001234567890" />
        <Field label="Telegram ID do Expert" name="expertTgId" value={data.expertTgId} onChange={onChange} placeholder="123456789" />
      </div>

      <Field label="Link de Convite do Grupo" name="groupLink" value={data.groupLink} onChange={onChange} placeholder="https://t.me/+..." />
      <Field label="Link de Afiliado (Casa de Aposta)" name="affiliateLink" value={data.affiliateLink} onChange={onChange} placeholder="https://..." />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Pixel ID" name="pixelId" value={data.pixelId} onChange={onChange} placeholder="803910052153187" />
        <Field label="Token CAPI" name="capiToken" value={data.capiToken} onChange={onChange} placeholder="EAA..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Código de Teste Pixel" name="testCode" value={data.testCode} onChange={onChange} placeholder="TEST12345" />
        <Field label="Dias para Lead Quente" name="hotLeadDays" value={data.hotLeadDays} onChange={onChange} type="number" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Evento Entrou" name="eventEntered" value={data.eventEntered} onChange={onChange} placeholder="EnteredChannel1" />
        <Field label="Evento Saiu" name="eventExited" value={data.eventExited} onChange={onChange} placeholder="ExitedGroup1" />
        <Field label="Evento Casa" name="eventBet" value={data.eventBet} onChange={onChange} placeholder="BetClick1" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="active" id="active" checked={data.active} onChange={onChange} className="accent-[#FFD700]" />
        <label htmlFor="active" className="text-sm text-gray-300">Bot ativo</label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 bg-[#FFD700] text-black text-sm font-medium rounded-lg hover:bg-[#F5C400] disabled:opacity-50 transition-colors">
          {loading ? 'Salvando...' : bot ? 'Salvar Alterações' : 'Criar Bot'}
        </button>
      </div>
    </form>
  )
}
