import { useEffect, useState } from 'react'
import PageWrapper from '../components/Layout/PageWrapper'
import ClientForm from '../components/Forms/ClientForm'
import ExpertForm from '../components/Forms/ExpertForm'
import BotForm from '../components/Forms/BotForm'
import api from '../lib/api'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Building2, UserCircle2, Bot } from 'lucide-react'

function Modal({ title, children, onClose, wide }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: '#111', border: '1px solid #2a2a2a', borderRadius: 20,
          borderTop: '3px solid #FFD700',
          width: '100%', maxWidth: wide ? 640 : 520,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #1e1e1e' }}>
          <h3 style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = '#555'}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 32 }}>{children}</div>
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

function Badge({ children, color = '#555', bg = 'rgba(255,255,255,0.05)' }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
      background: bg, color, border: `1px solid ${color}22`,
    }}>
      {children}
    </span>
  )
}

function ActionBtn({ onClick, title, icon: Icon, hoverColor = '#FFD700' }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 32, height: 32, borderRadius: 8, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hovered ? `${hoverColor}18` : 'transparent',
        color: hovered ? hoverColor : '#444',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={16} />
    </button>
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
      <div style={{ maxWidth: 860 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 28, margin: 0 }}>Configurações</h1>
            <p style={{ color: '#555', fontSize: 13, marginTop: 4 }}>Gerencie clientes, experts e bots</p>
          </div>
          <button
            onClick={() => setModal({ type: 'client' })}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', background: '#FFD700', color: '#000',
              fontWeight: 700, fontSize: 13, borderRadius: 10, border: 'none',
              cursor: 'pointer', boxShadow: '0 2px 16px rgba(255,215,0,0.25)',
            }}
          >
            <Plus size={15} /> Novo Cliente
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: 60, borderRadius: 14 }} />
            ))}
          </div>
        ) : (

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Empty state */}
            {clients.length === 0 && (
              <div style={{
                background: '#111', border: '1px solid #1e1e1e', borderRadius: 14,
                padding: '48px 24px', textAlign: 'center',
              }}>
                <Building2 size={32} style={{ color: '#222', margin: '0 auto 12px' }} />
                <p style={{ color: '#444', fontSize: 14, marginBottom: 16 }}>Nenhum cliente ainda.</p>
                <button
                  onClick={() => setModal({ type: 'client' })}
                  style={{
                    background: '#FFD700', color: '#000', fontWeight: 700, fontSize: 13,
                    padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  }}
                >
                  + Criar primeiro cliente
                </button>
              </div>
            )}

            {clients.map(client => {
              const expertList = experts[client.id] || []
              const isExpanded = !!expanded[client.id]

              return (
                <div key={client.id} style={{
                  background: '#111', border: '1px solid #1e1e1e',
                  borderRadius: 14, overflow: 'hidden',
                }}>
                  {/* Client header */}
                  <div style={{
                    background: '#141414', padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <button
                      onClick={() => toggleClient(client.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#444', display: 'flex', alignItems: 'center' }}
                    >
                      {isExpanded
                        ? <ChevronDown size={16} style={{ color: '#555' }} />
                        : <ChevronRight size={16} style={{ color: '#555' }} />}
                    </button>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9,
                      background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Building2 size={15} style={{ color: '#FFD700' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{client.name}</span>
                    </div>
                    <Badge color="#FFD700" bg="rgba(255,215,0,0.08)">
                      {expertList.length > 0 ? expertList.length : (isExpanded ? expertList.length : '?')} experts
                    </Badge>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <ActionBtn
                        onClick={() => setModal({ type: 'expert', clientId: client.id })}
                        title="Adicionar Expert"
                        icon={Plus}
                        hoverColor="#4ade80"
                      />
                      <ActionBtn
                        onClick={() => setModal({ type: 'client', data: client })}
                        title="Editar Cliente"
                        icon={Pencil}
                        hoverColor="#FFD700"
                      />
                      <ActionBtn
                        onClick={() => handleDeleteClient(client)}
                        title="Excluir Cliente"
                        icon={Trash2}
                        hoverColor="#ef4444"
                      />
                    </div>
                  </div>

                  {/* Experts */}
                  {isExpanded && (
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {expertList.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                          <UserCircle2 size={24} style={{ color: '#222', margin: '0 auto 8px' }} />
                          <p style={{ color: '#444', fontSize: 12, marginBottom: 10 }}>Nenhum expert neste cliente.</p>
                          <button
                            onClick={() => setModal({ type: 'expert', clientId: client.id })}
                            style={{
                              background: 'rgba(168,85,247,0.1)', color: '#a855f7', fontSize: 12,
                              fontWeight: 600, padding: '7px 16px', borderRadius: 8,
                              border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer',
                            }}
                          >
                            + Adicionar Expert
                          </button>
                        </div>
                      ) : expertList.map(expert => {
                        const botList = bots[expert.id] || []
                        const expertExpanded = !!expanded[`e-${expert.id}`]

                        return (
                          <div key={expert.id} style={{
                            background: '#0d0d0d', border: '1px solid #181818',
                            borderRadius: 10, overflow: 'hidden',
                          }}>
                            {/* Expert header */}
                            <div style={{
                              background: '#0f0f0f', padding: '11px 14px',
                              display: 'flex', alignItems: 'center', gap: 8,
                            }}>
                              <button
                                onClick={() => toggleExpert(expert.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                              >
                                {expertExpanded
                                  ? <ChevronDown size={14} style={{ color: '#444' }} />
                                  : <ChevronRight size={14} style={{ color: '#444' }} />}
                              </button>
                              <div style={{
                                width: 26, height: 26, borderRadius: 7,
                                background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <UserCircle2 size={13} style={{ color: '#a855f7' }} />
                              </div>
                              <span style={{ color: '#ccc', fontSize: 13, fontWeight: 500, flex: 1 }}>{expert.name}</span>
                              <Badge color="#a855f7" bg="rgba(168,85,247,0.08)">
                                {botList.length > 0 ? botList.length : (expertExpanded ? botList.length : '?')} bots
                              </Badge>
                              <div style={{ display: 'flex', gap: 1 }}>
                                <ActionBtn
                                  onClick={() => setModal({ type: 'bot', expertId: expert.id, clientId: client.id })}
                                  title="Adicionar Bot"
                                  icon={Plus}
                                  hoverColor="#4ade80"
                                />
                                <ActionBtn
                                  onClick={() => setModal({ type: 'expert', data: expert, clientId: client.id })}
                                  title="Editar Expert"
                                  icon={Pencil}
                                  hoverColor="#FFD700"
                                />
                                <ActionBtn
                                  onClick={() => handleDeleteExpert(expert, client.id)}
                                  title="Excluir Expert"
                                  icon={Trash2}
                                  hoverColor="#ef4444"
                                />
                              </div>
                            </div>

                            {/* Bots */}
                            {expertExpanded && (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {botList.length === 0 ? (
                                  <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                                    <Bot size={20} style={{ color: '#1e1e1e', margin: '0 auto 8px' }} />
                                    <p style={{ color: '#333', fontSize: 12, marginBottom: 10 }}>Nenhum bot cadastrado.</p>
                                    <button
                                      onClick={() => setModal({ type: 'bot', expertId: expert.id, clientId: client.id })}
                                      style={{
                                        background: 'rgba(255,215,0,0.08)', color: '#FFD700', fontSize: 12,
                                        fontWeight: 600, padding: '7px 16px', borderRadius: 8,
                                        border: '1px solid rgba(255,215,0,0.15)', cursor: 'pointer',
                                      }}
                                    >
                                      + Adicionar Bot
                                    </button>
                                  </div>
                                ) : botList.map((bot, i) => (
                                  <div key={bot.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 16px',
                                    borderBottom: i < botList.length - 1 ? '1px solid #141414' : 'none',
                                    background: '#0a0a0a',
                                  }}>
                                    <div style={{
                                      width: 24, height: 24, borderRadius: 6,
                                      background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.1)',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                      <Bot size={12} style={{ color: '#FFD700' }} />
                                    </div>
                                    <span style={{ color: '#bbb', fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0 }}>{bot.name}</span>
                                    <span style={{ color: '#2a2a2a', fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>{bot.slug}</span>
                                    <span style={{
                                      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                                      background: bot.active ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
                                      color: bot.active ? '#4ade80' : '#ef4444',
                                      border: bot.active ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(239,68,68,0.2)',
                                    }}>
                                      {bot.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                    <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                                      <ActionBtn
                                        onClick={() => setModal({ type: 'bot', data: bot, expertId: expert.id, clientId: client.id })}
                                        title="Editar Bot"
                                        icon={Pencil}
                                        hoverColor="#FFD700"
                                      />
                                      <ActionBtn
                                        onClick={() => handleDeleteBot(bot, expert.id)}
                                        title="Excluir Bot"
                                        icon={Trash2}
                                        hoverColor="#ef4444"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
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
        <Modal title={modal.data ? 'Editar Bot' : 'Novo Bot'} onClose={closeModal} wide>
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
