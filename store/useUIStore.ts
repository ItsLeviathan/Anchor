import { create } from 'zustand';

/**
 * Pure UI state (what's open, what's focused) lives here. Server data
 * belongs in TanStack Query; local domain data (tasks, events, etc., from
 * Phase 2 onward) belongs in the local database / its own store. Keeping
 * these separate is a deliberate architecture rule, not an accident.
 */
interface UIState {
  isAddSheetOpen: boolean;
  setAddSheetOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isAddSheetOpen: false,
  setAddSheetOpen: (open) => set({ isAddSheetOpen: open }),
}));
