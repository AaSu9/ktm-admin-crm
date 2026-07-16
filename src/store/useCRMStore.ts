import { create } from 'zustand'

interface CRMState {
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  selectedLeadId: string | null
  setSelectedLeadId: (id: string | null) => void
  selectedPropertyId: string | null
  setSelectedPropertyId: (id: string | null) => void
}

export const useCRMStore = create<CRMState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  selectedLeadId: null,
  setSelectedLeadId: (id) => set({ selectedLeadId: id }),
  selectedPropertyId: null,
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
}))
