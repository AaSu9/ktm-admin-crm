'use client'

import { useState, useTransition } from 'react'
import { cn, getInitials } from '@/lib/utils'
import { Plus, UserCog, Phone, Mail, TrendingUp, Search, Download, X, Eye, EyeOff, Shield, Edit, Globe, Camera } from 'lucide-react'
import { createAgent, updateAgent, deleteAgent } from '@/app/actions/agents'
import { uploadImage } from '@/app/actions/properties'
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
  avatar?: string | null
  designation?: string | null
  bio?: string | null
  facebookUrl?: string | null
  instagramUrl?: string | null
  whatsappNumber?: string | null
  showOnWebsite?: boolean
}

export function AgentsClient({ initialAgents }: { initialAgents: Agent[] }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [search, setSearch] = useState('')
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    title: string;
    type: 'properties' | 'sold' | 'leads' | 'visits';
    data: any[];
  }>({ isOpen: false, title: '', type: 'properties', data: [] })
  
  const [showForm, setShowForm] = useState(false)
  const [editAgentId, setEditAgentId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const initialFormState = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'AGENT' as 'AGENT' | 'ADMIN' | 'EDITOR',
    avatar: '',
    designation: 'Real Estate Consultant',
    bio: '',
    facebookUrl: '',
    instagramUrl: '',
    whatsappNumber: '',
    showOnWebsite: true,
  }

  // Form state
  const [formData, setFormData] = useState(initialFormState)

  const filtered = agents.filter((a) =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    (a.designation && a.designation.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSubmit = async () => {
    setFormError('')
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required')
      return
    }
    if (!editAgentId && !formData.password) {
      setFormError('Password is required for new team members')
      return
    }

    startTransition(async () => {
      if (editAgentId) {
        // Edit agent flow
        const result = await updateAgent(editAgentId, {
          name: formData.name,
          email: formData.email,
          password: formData.password || undefined,
          phone: formData.phone || '',
          role: formData.role,
          avatar: formData.avatar || '',
          designation: formData.designation || 'Real Estate Consultant',
          bio: formData.bio || '',
          facebookUrl: formData.facebookUrl || '',
          instagramUrl: formData.instagramUrl || '',
          whatsappNumber: formData.whatsappNumber || '',
          showOnWebsite: formData.showOnWebsite,
        })

        if (result.success) {
          setShowForm(false)
          setEditAgentId(null)
          setFormData(initialFormState)
          
          setAgents(prev => prev.map(a => a.id === editAgentId ? {
            ...a,
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.role,
            avatar: formData.avatar || null,
            designation: formData.designation || 'Real Estate Consultant',
            bio: formData.bio || null,
            facebookUrl: formData.facebookUrl || null,
            instagramUrl: formData.instagramUrl || null,
            whatsappNumber: formData.whatsappNumber || null,
            showOnWebsite: formData.showOnWebsite,
          } : a))
        } else {
          setFormError(result.error || 'Failed to update agent')
        }
      } else {
        // Create agent flow
        const result = await createAgent(formData)
        if (result.success) {
          setShowForm(false)
          setFormData(initialFormState)
          
          setAgents(prev => [{
            id: result.agent?.id || Date.now().toString(),
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            role: formData.role,
            isActive: true,
            createdAt: new Date(),
            leads: [], properties: [], visits: [],
            avatar: formData.avatar || null,
            designation: formData.designation || 'Real Estate Consultant',
            bio: formData.bio || null,
            facebookUrl: formData.facebookUrl || null,
            instagramUrl: formData.instagramUrl || null,
            whatsappNumber: formData.whatsappNumber || null,
            showOnWebsite: formData.showOnWebsite,
          }, ...prev])
        } else {
          setFormError(result.error || 'Failed to create agent')
        }
      }
    })
  }

  const startEdit = (agent: Agent) => {
    setEditAgentId(agent.id)
    setFormData({
      name: agent.name || '',
      email: agent.email || '',
      password: '', // Blank by default, doesn't overwrite if left blank
      phone: agent.phone || '',
      role: agent.role as any,
      avatar: agent.avatar || '',
      designation: agent.designation || 'Real Estate Consultant',
      bio: agent.bio || '',
      facebookUrl: agent.facebookUrl || '',
      instagramUrl: agent.instagramUrl || '',
      whatsappNumber: agent.whatsappNumber || '',
      showOnWebsite: agent.showOnWebsite !== undefined ? agent.showOnWebsite : true,
    })
    setShowForm(true)
    // Scroll form into view nicely
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditAgentId(null)
    setFormData(initialFormState)
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
      { key: 'designation', label: 'Designation' },
      { key: 'role', label: 'Role' },
      { key: 'isActive', label: 'Active', format: (v: boolean) => v ? 'Yes' : 'No' },
      { key: 'showOnWebsite', label: 'Show on Website', format: (v: boolean) => v ? 'Yes' : 'No' },
      { key: 'leads', label: 'Leads', format: (v: any[]) => String(v?.length || 0) },
      { key: 'properties', label: 'Properties', format: (v: any[]) => String(v?.length || 0) },
      { key: 'visits', label: 'Visits', format: (v: any[]) => String(v?.length || 0) },
    ], 'team-export')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
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
            onClick={() => {
              if (showForm) {
                handleCancelForm()
              } else {
                setShowForm(true)
              }
            }}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancel' : 'Add Member'}
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
            placeholder="Search team by name, email, or designation..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
          />
        </div>
      </div>

      {/* Form Panel */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
          <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
            {editAgentId ? <Edit className="h-4 w-4 text-emerald-600" /> : <Plus className="h-4 w-4 text-emerald-600" />}
            {editAgentId ? 'Edit Team Member Details' : 'New Team Member'}
          </h3>
          {formError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Core Info */}
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
              <label className="text-xs font-semibold text-gray-500">
                {editAgentId ? 'Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input type="password" value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Min 8 characters" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Phone</label>
              <input value={formData.phone} onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="+977-98XXXXXXXX" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Designation / Job Title</label>
              <input value={formData.designation} onChange={(e) => setFormData(p => ({ ...p, designation: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="e.g. Founder & CEO, Senior Sales Executive" />
            </div>

            <div className="space-y-2 flex flex-col items-center justify-center border border-gray-200/60 bg-gray-50/50 rounded-2xl p-4 md:col-span-1">
              <label className="text-xs font-semibold text-gray-500 self-start">Agent Photo</label>
              
              <div className="relative group w-20 h-20 rounded-full overflow-hidden border border-gray-200 bg-white shadow-xs flex items-center justify-center mt-1">
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Agent Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-gray-400" />
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold animate-pulse">
                    Uploading...
                  </div>
                )}
              </div>

              <input
                type="file"
                id="agent-avatar-upload"
                accept="image/*"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setUploadingAvatar(true)
                  try {
                    const reader = new FileReader()
                    reader.onload = async (event) => {
                      if (event.target?.result) {
                        const base64 = event.target.result as string
                        const url = await uploadImage(base64)
                        setFormData(p => ({ ...p, avatar: url }))
                      }
                      setUploadingAvatar(false)
                    }
                    reader.readAsDataURL(file)
                  } catch (err) {
                    console.error('Avatar upload failed:', err)
                    setUploadingAvatar(false)
                  }
                }}
              />
              
              <label
                htmlFor="agent-avatar-upload"
                className="cursor-pointer text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-colors mt-2"
              >
                Upload Photo / Take Photo
              </label>
            </div>

            {/* Social Links */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">WhatsApp Number</label>
              <input value={formData.whatsappNumber} onChange={(e) => setFormData(p => ({ ...p, whatsappNumber: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="+97798XXXXXXXX" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Facebook Profile Link</label>
              <input value={formData.facebookUrl} onChange={(e) => setFormData(p => ({ ...p, facebookUrl: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="https://facebook.com/..." />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500">Instagram Profile Link</label>
              <input value={formData.instagramUrl} onChange={(e) => setFormData(p => ({ ...p, instagramUrl: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="https://instagram.com/..." />
            </div>

            {/* Bio */}
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-semibold text-gray-500">Bio / About Description</label>
              <textarea value={formData.bio} onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))} rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none" placeholder="Tell customers about their experience, background, or specialization..." />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-50">
            <div className="flex gap-6">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">System Role</label>
                <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as any }))}
                  className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                  <option value="EDITOR">Editor</option>
                </select>
              </div>

              {/* Website visibility */}
              <div className="flex items-center gap-2 mt-5">
                <input
                  type="checkbox"
                  id="showOnWebsite"
                  checked={formData.showOnWebsite}
                  onChange={(e) => setFormData(p => ({ ...p, showOnWebsite: e.target.checked }))}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="showOnWebsite" className="text-xs font-semibold text-gray-700 cursor-pointer flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-gray-400" /> Show on Public Website
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-5 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                {isPending ? 'Saving...' : editAgentId ? 'Save Changes' : 'Create Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-400">
            <UserCog className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>{search ? 'No team members match your search' : 'No team members found'}</p>
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
            <div key={agent.id} className={cn('bg-white rounded-2xl p-5 shadow-sm border transition-all flex flex-col justify-between', agent.isActive ? 'border-gray-100 hover:shadow-md' : 'border-red-100 opacity-60')}>
              <div>
                <div className="flex items-start gap-3 mb-4">
                  {/* Photo Display */}
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner bg-muted">
                    {agent.avatar ? (
                      <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(agent.name)
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-gray-800 truncate">{agent.name}</p>
                      {!agent.isActive && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">Inactive</span>}
                      {agent.showOnWebsite === false && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold" title="Hidden from website">Hidden</span>}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                        agent.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : agent.role === 'EDITOR' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      )}>{agent.role}</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-600 mt-1 truncate" title={agent.designation || 'Real Estate Consultant'}>
                      {agent.designation || 'Real Estate Consultant'}
                    </p>
                  </div>
                </div>

                {agent.bio && (
                  <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 p-2.5 rounded-xl mb-4 italic">
                    "{agent.bio}"
                  </p>
                )}

                <div className="space-y-1.5 mb-4">
                  {agent.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{agent.email}</span>
                    </div>
                  )}
                  {agent.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span>{agent.phone}</span>
                    </div>
                  )}
                  
                  {/* Social links indicators */}
                  {(agent.facebookUrl || agent.instagramUrl || agent.whatsappNumber) && (
                    <div className="flex items-center gap-2 pt-1">
                      {agent.whatsappNumber && <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">WhatsApp</span>}
                      {agent.facebookUrl && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">Facebook</span>}
                      {agent.instagramUrl && <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-md font-medium flex items-center gap-1">Instagram</span>}
                    </div>
                  )}
                </div>
              </div>

              <div>
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
                    onClick={() => startEdit(agent)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-all flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(agent.id, agent.isActive)}
                    className={cn('text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1', agent.isActive ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50')}
                  >
                    {agent.isActive ? <><EyeOff className="h-3 w-3" /> Deactivate</> : <><Eye className="h-3 w-3" /> Activate</>}
                  </button>
                </div>
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

