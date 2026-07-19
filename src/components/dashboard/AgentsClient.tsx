'use client'

import { useState, useTransition } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { Plus, UserCog, Phone, Mail, TrendingUp, Search, Download, X, Eye, EyeOff, Shield } from 'lucide-react'
import { createAgent, updateAgent, deleteAgent } from '@/app/actions/agents'
import { exportToCSV } from '@/lib/csvExport'

interface Agent {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  isActive: boolean
  createdAt: Date | string
  leads: any[]
  properties: any[]
  visits: any[]
}

export function AgentsClient({ initialAgents }: { initialAgents: Agent[] }) {
  const [agents, setAgents] = useState(initialAgents)
  const [search, setSearch] = useState('')
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    title: string;
    type: 'properties' | 'sold' | 'leads' | 'visits';
    data: any[];
  }>({ isOpen: false, title: '', type: 'properties', data: [] })
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', role: 'AGENT' as 'AGENT' | 'ADMIN' | 'EDITOR',
  })

  const filtered = agents.filter((a) =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    setFormError('')
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Name, email, and password are required')
      return
    }
    startTransition(async () => {
      const result = await createAgent(formData)
      if (result.success) {
        setShowForm(false)
        setFormData({ name: '', email: '', password: '', phone: '', role: 'AGENT' })
        // Optimistic add
        setAgents(prev => [{
          id: result.agent?.id || Date.now().toString(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          isActive: true,
          createdAt: new Date(),
          leads: [], properties: [], visits: [],
        }, ...prev])
      } else {
        setFormError(result.error || 'Failed to create agent')
      }
    })
  }

  const handleToggleActive = (id: string, isActive: boolean) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a))
    startTransition(() => {
      if (isActive) {
        deleteAgent(id) // soft deactivate
      } else {
        updateAgent(id, { isActive: true })
      }
    })
  }

  const handleExportCSV = () => {
    exportToCSV(filtered, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'isActive', label: 'Active', format: (v: boolean) => v ? 'Yes' : 'No' },
      { key: 'leads', label: 'Leads', format: (v: any[]) => String(v?.length || 0) },
      { key: 'properties', label: 'Properties', format: (v: any[]) => String(v?.length || 0) },
      { key: 'visits', label: 'Visits', format: (v: any[]) => String(v?.length || 0) },
    ], 'agents-export')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
          <p className="text-gray-500 text-sm">{agents.filter(a => a.isActive).length} active · {agents.length} total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Agent'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Add Agent Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-emerald-600" /> New Agent</h3>
          {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Full Name *</label>
              <input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Raj Kumar Sharma" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Email *</label>
              <input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="raj@realtocrm.com" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Password *</label>
              <input type="password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Min 8 characters" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Phone</label>
              <input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="+977-98XXXXXXXX" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Role</label>
              <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as any }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="AGENT">Agent</option>
                <option value="ADMIN">Admin</option>
                <option value="EDITOR">Editor</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              disabled={isPending}
              className="mt-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <UserCog className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>{search ? 'No agents match your search' : 'No agents found'}</p>
          </div>
        ) : filtered.map((agent) => {
          // Calculate aggregate stats including assigned properties
          const directLeads = agent.leads || []
          const directVisits = agent.visits || []
          const properties = agent.properties || []
          
          const propertyLeads = properties.flatMap((p: any) => p.leads || [])
          const propertyVisits = properties.flatMap((p: any) => p.visits || [])
          
          const allLeads = [...directLeads, ...propertyLeads]
          // Deduplicate leads by id just in case a lead is both directly assigned and via property
          const uniqueLeads = Array.from(new Map(allLeads.map((l: any) => [l.id, l])).values())
          
          const allVisits = [...directVisits, ...propertyVisits]
          const uniqueVisits = Array.from(new Map(allVisits.map((v: any) => [v.id, v])).values())

          const totalProperties = properties.length
          const soldProperties = properties.filter((p: any) => p.status === 'SOLD' || p.status === 'RENTED').length
          const completedVisits = uniqueVisits.filter((v: any) => v.status === 'COMPLETED').length

          return (
            <div key={agent.id} className={cn('bg-white rounded-2xl p-5 shadow-sm border transition-all', agent.isActive ? 'border-gray-100 hover:shadow-md' : 'border-red-100 opacity-60')}>
              <div className="flex items-center gap-3 mb-4">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg', agent.isActive ? 'bg-gradient-to-br from-emerald-400 to-emerald-700' : 'bg-gray-400')}>
                  {getInitials(agent.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-800 truncate">{agent.name}</p>
                    {!agent.isActive && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">Inactive</span>}
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    agent.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : agent.role === 'EDITOR' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  )}>{agent.role}</span>
                </div>
              </div>
              <div className="space-y-1.5 mb-4">
                {agent.email && <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-3.5 w-3.5 text-gray-400" /><span className="truncate">{agent.email}</span></div>}
                {agent.phone && <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="h-3.5 w-3.5 text-gray-400" />{agent.phone}</div>}
              </div>
              <div className="grid grid-cols-4 gap-2 pt-4 border-t border-gray-100">
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors group"
                  onClick={() => setDetailsModal({ isOpen: true, title: 'Properties Assigned', type: 'properties', data: properties })}
                >
                  <p className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">{totalProperties}</p>
                  <p className="text-[11px] text-gray-400">Properties</p>
                </div>
                <div 
                  className="text-center cursor-pointer hover:bg-emerald-50 p-1.5 rounded-lg transition-colors group"
                  onClick={() => setDetailsModal({ isOpen: true, title: 'Sold Properties', type: 'sold', data: properties.filter((p: any) => p.status === 'SOLD' || p.status === 'RENTED') })}
                >
                  <p className="text-lg font-bold text-emerald-600 group-hover:text-emerald-700 transition-colors">{soldProperties}</p>
                  <p className="text-[11px] text-gray-400">Sold</p>
                </div>
                <div 
                  className="text-center cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg transition-colors group"
                  onClick={() => setDetailsModal({ isOpen: true, title: 'Leads', type: 'leads', data: uniqueLeads })}
                >
                  <p className="text-lg font-bold text-gray-800 group-hover:text-emerald-600 transition-colors">{uniqueLeads.length}</p>
                  <p className="text-[11px] text-gray-400">Leads</p>
                </div>
                <div 
                  className="text-center cursor-pointer hover:bg-blue-50 p-1.5 rounded-lg transition-colors group"
                  onClick={() => setDetailsModal({ isOpen: true, title: 'Visits', type: 'visits', data: uniqueVisits })}
                >
                  <p className="text-lg font-bold text-blue-600 group-hover:text-blue-700 transition-colors">{completedVisits}</p>
                  <p className="text-[11px] text-gray-400">Visits</p>
                </div>
              </div>
              {totalProperties > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Sell Rate</span>
                    <span className="font-semibold text-emerald-600">{Math.round((soldProperties / totalProperties) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.round((soldProperties / totalProperties) * 100)}%` }} />
                  </div>
                </div>
              )}
              {/* Actions */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleToggleActive(agent.id, agent.isActive)}
                  className={cn('text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1', agent.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50')}
                >
                  {agent.isActive ? <><EyeOff className="h-3 w-3" /> Deactivate</> : <><Eye className="h-3 w-3" /> Activate</>}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Details Modal */}
      {detailsModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800">{detailsModal.title}</h2>
              <button 
                onClick={() => setDetailsModal({ ...detailsModal, isOpen: false })}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {detailsModal.data.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p>No items found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detailsModal.data.map((item: any, i: number) => (
                    <div key={item.id || i} className="p-4 rounded-xl border border-gray-100 bg-white hover:border-emerald-100 hover:shadow-sm transition-all flex items-center justify-between">
                      {(detailsModal.type === 'properties' || detailsModal.type === 'sold') && (
                        <>
                          <div>
                            <p className="font-semibold text-gray-800">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.location}</p>
                          </div>
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', 
                            item.status === 'SOLD' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                          )}>
                            {item.status}
                          </span>
                        </>
                      )}
                      
                      {detailsModal.type === 'leads' && (
                        <>
                          <div>
                            <p className="font-semibold text-gray-800">{item.full_name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              {item.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {item.phone}</span>}
                              {item.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3"/> {item.email}</span>}
                            </div>
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700">
                            {item.status || 'NEW'}
                          </span>
                        </>
                      )}

                      {detailsModal.type === 'visits' && (
                        <>
                          <div>
                            <p className="font-semibold text-gray-800">{item.clientName}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              {item.clientPhone && <span className="flex items-center gap-1"><Phone className="h-3 w-3"/> {item.clientPhone}</span>}
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', 
                            item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                          )}>
                            {item.status}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
