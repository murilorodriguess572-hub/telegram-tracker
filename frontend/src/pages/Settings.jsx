import { useEffect, useState } from 'react'
import PageWrapper from '../components/Layout/PageWrapper'
import ClientForm from '../components/Forms/ClientForm'
import ExpertForm from '../components/Forms/ExpertForm'
import BotForm from '../components/Forms/BotForm'
import api from '../lib/api'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, UserCircle2, Bot } from 'lucide-react'

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e1e]">
          <h3 className="text-white font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-6 max-w-sm w-full">
        <p className="text-white text-sm mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600">Excluir</button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  const [clients, setClients] = useState([])
  const [expanded, setExpanded] = useState({})
  const [experts, setExperts] = useState({})
  const [bots, setBots] = useState({})
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    setLoading(true)
    const data = await api.get('/clients')
    setClients(data)
    setLoading(false)
  }

  useEffect(() => { fetchClients() }, [])

  const toggleClient = async (clientId) => {
    const next = !expanded[clientId]
    setExpanded(prev => ({ ...prev, [clientId]: next }))
    if (next && !experts[clientId]) {
      const data = await api.get(`/experts?clientId=${clientId}`)
      setExperts(prev => ({ ...prev, [clientId]: data }))
    }
  }

  const toggleExpert = async (expertId) => {
    const next = !expanded[`e-${expertId}`]
    setExpanded(prev => ({ ...prev, [`e-${expertId}`]: next }))
    if (next && !bots[expertId]) {
      const data = await api.get(`/bots?expertId=${expertId}`)
      setBots(prev => ({ ...prev, [expertId]: data }))
    }
  }

  const closeModal = () => setModal(null)

  const handleDeleteClient = (client) => {
    setConfirm({
      message: `Excluir cliente "${client.name}"? Isso também excluirá todos os experts e bots.`,
      onConfirm: async () => {
        await api.delete(`/clients/${client.id}`)
        setClients(prev => prev.filter(c => c.id !== client.id))
        setConfirm(null)
      }
    })
  }

  const handleDeleteExpert = (expert, clientId) => {
    setConfirm({
      message: `Excluir expert "${expert.name}" e todos os seus bots?`,
      onConfirm: async () => {
        await api.delete(`/experts/${expert.id}`)
        setExperts(prev => ({ ...prev, [clientId]: prev[clientId]?.filter(e => e.id !== expert.id) }))
        setConfirm(null)
      }
    })
  }

  const handleDeleteBot = (bot, expertId) => {
    setConfirm({
      message: `Excluir bot "${bot.name}"?`,
      onConfirm: async () => {
        await api.delete(`/bots/${bot.id}`)
        setBots(prev => ({ ...prev, [expertId]: prev[expertId]?.filter(b => b.id !== bot.id) }))
        setConfirm(null)
      }
    })
  }

  return (
    <PageWrapper>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Configurações</h1>
            <p className="text-gray-500 text-sm mt-0.5">Gerencie clientes, experts e bots</p>
          </div>
          <button
            onClick={() => setModal({ type: 'client' })}
            className="flex items-center gap-2 px-4 py-2 bg-[#FFD700] text-black text-sm font-medium rounded-lg hover:bg-[#F5C400] transition-colors"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-[#141414] rounded-xl skeleton" />)}</div>
        ) : (
          <div className="space-y-3">
            {clients.length === 0 && (
              <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl px-5 py-8 text-center text-gray-500 text-sm">
                Nenhum cliente ainda. Clique em "Novo Cliente" para começar.
              </div>
            )}
            {clients.map(client => (
              <div key={client.id} className="bg-[#111111] border border-[#1e1e1e] rounded-xl overflow-hidden">
                {/* Client header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => toggleClient(client.id)} className="flex items-center gap-2 flex-1 text-left">
                    {expanded[client.id] ? <ChevronDown size={16} className="text-gray-500" /> : <ChevronRight size={16} className="text-gray-500" />}
                    <Building2 size={16} className="text-[#FFD700]" />
                    <span className="text-white font-medium text-sm">{client.name}</span>
                    <span className="text-gray-600 text-xs ml-1">/{client.slug}</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setModal({ type: 'expert', clientId: client.id })}
                      className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition-all"
                      title="Adicionar Expert"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => setModal({ type: 'client', data: client })}
                      className="p-1.5 text-gray-500 hover:text-[#FFD700] hover:bg-[#FFD700]/10 rounded-lg transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Experts */}
                {expanded[client.id] && (
                  <div className="border-t border-[#1a1a1a]">
                    {(experts[client.id] || []).map(expert => (
                      <div key={expert.id} className="border-b border-[#1a1a1a] last:border-0">
                        <div className="flex items-center gap-3 px-6 py-2.5">
                          <button onClick={() => toggleExpert(expert.id)} className="flex items-center gap-2 flex-1 text-left">
                            {expanded[`e-${expert.id}`] ? <ChevronDown size={14} className="text-gray-600" /> : <ChevronRight size={14} className="text-gray-600" />}
                            <UserCircle2 size={14} className="text-purple-400" />
                            <span className="text-gray-300 text-sm">{expert.name}</span>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setModal({ type: 'bot', expertId: expert.id, clientId: client.id })}
                              className="p-1 text-gray-600 hover:text-green-400 hover:bg-green-400/10 rounded transition-all"
                              title="Adicionar Bot"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              onClick={() => setModal({ type: 'expert', data: expert, clientId: client.id })}
                              className="p-1 text-gray-600 hover:text-[#FFD700] hover:bg-[#FFD700]/10 rounded transition-all"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteExpert(expert, client.id)}
                              className="p-1 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Bots */}
                        {expanded[`e-${expert.id}`] && (
                          <div className="pl-12 pr-4 pb-2 space-y-1">
                            {(bots[expert.id] || []).map(bot => (
                              <div key={bot.id} className="flex items-center gap-2 px-3 py-2 bg-[#0d0d0d] rounded-lg">
                                <Bot size={13} className="text-[#FFD700]" />
                                <span className="text-gray-400 text-xs flex-1">{bot.name}</span>
                                <span className="text-gray-700 text-xs font-mono">{bot.slug}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setModal({ type: 'bot', data: bot, expertId: expert.id, clientId: client.id })}
                                    className="p-1 text-gray-600 hover:text-[#FFD700] rounded transition-all"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBot(bot, expert.id)}
                                    className="p-1 text-gray-600 hover:text-red-400 rounded transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {bots[expert.id]?.length === 0 && (
                              <p className="text-gray-700 text-xs px-3 py-2">Nenhum bot. Clique em + para adicionar.</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {experts[client.id]?.length === 0 && (
                      <p className="text-gray-700 text-xs px-6 py-3">Nenhum expert. Clique em + para adicionar.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'client' && (
        <Modal title={modal.data ? 'Editar Cliente' : 'Novo Cliente'} onClose={closeModal}>
          <ClientForm
            client={modal.data}
            onSave={(saved) => {
              if (modal.data) setClients(prev => prev.map(c => c.id === saved.id ? saved : c))
              else setClients(prev => [...prev, saved])
              closeModal()
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal?.type === 'expert' && (
        <Modal title={modal.data ? 'Editar Expert' : 'Novo Expert'} onClose={closeModal}>
          <ExpertForm
            expert={modal.data}
            clientId={modal.clientId}
            onSave={(saved) => {
              setExperts(prev => ({
                ...prev,
                [modal.clientId]: modal.data
                  ? (prev[modal.clientId] || []).map(e => e.id === saved.id ? saved : e)
                  : [...(prev[modal.clientId] || []), saved]
              }))
              if (!expanded[modal.clientId]) toggleClient(modal.clientId)
              closeModal()
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {modal?.type === 'bot' && (
        <Modal title={modal.data ? 'Editar Bot' : 'Novo Bot'} onClose={closeModal}>
          <BotForm
            bot={modal.data}
            expertId={modal.expertId}
            clientId={modal.clientId}
            onSave={(saved) => {
              setBots(prev => ({
                ...prev,
                [modal.expertId]: modal.data
                  ? (prev[modal.expertId] || []).map(b => b.id === saved.id ? saved : b)
                  : [...(prev[modal.expertId] || []), saved]
              }))
              closeModal()
            }}
            onCancel={closeModal}
          />
        </Modal>
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </PageWrapper>
  )
}
