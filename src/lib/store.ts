import { create } from 'zustand';

type Section = 
  | 'dashboard'
  | 'clients'
  | 'cases'
  | 'sessions'
  | 'payments'
  | 'delays'
  | 'archives'
  | 'backup'
  | 'settings';

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

export type { Section };
