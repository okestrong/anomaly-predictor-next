import { create } from 'zustand';

interface UIState {
  // Empty for now - removed fullscreen state
}

export const useUIStore = create<UIState>(() => ({}));