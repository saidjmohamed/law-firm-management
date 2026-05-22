import { create } from 'zustand';

export type Section = 'dashboard' | 'clients' | 'cases' | 'sessions' | 'finance' | 'documents';

interface AppState {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
