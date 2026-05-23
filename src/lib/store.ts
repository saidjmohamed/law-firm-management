import { create } from 'zustand';

type Section = 
  | 'dashboard'
  | 'clients'
  | 'cases'
  | 'sessions'
  | 'calendar'
  | 'payments'
  | 'delays'
  | 'courts'
  | 'archives'
  | 'backup'
  | 'settings';

interface AppState {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedCaseId: number | null;
  setSelectedCaseId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedCaseId: null,
  setSelectedCaseId: (id) => set({ selectedCaseId: id }),
}));

export type { Section };
