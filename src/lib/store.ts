import { create } from 'zustand';

type Section =
  | 'dashboard'
  | 'represented-parties'
  | 'cases'
  | 'sessions'
  | 'calendar'
  | 'delays'
  | 'tasks'
  | 'payments'
  | 'lawyers'
  | 'courts'
  | 'backup'
  | 'archives'
  | 'converter'
  | 'settings';

interface AppState {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedCaseId: number | null;
  setSelectedCaseId: (id: number | null) => void;
  selectedLawyerId: number | null;
  setSelectedLawyerId: (id: number | null) => void;
  selectedTaskId: number | null;
  setSelectedTaskId: (id: number | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setActiveSection: (section) => set({ activeSection: section === 'sessions' || section === 'delays' ? 'calendar' : section, sidebarOpen: false }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  selectedCaseId: null,
  setSelectedCaseId: (id) => set({ selectedCaseId: id }),
  selectedLawyerId: null,
  setSelectedLawyerId: (id) => set({ selectedLawyerId: id }),
  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
}));

export type { Section };
