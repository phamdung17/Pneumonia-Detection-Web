import { create } from 'zustand';

export const useTaskStore = create((set) => ({
  activePredictTaskId: null,
  activeBatchId: null,
  setActivePredictTaskId: (activePredictTaskId) => set({ activePredictTaskId }),
  setActiveBatchId: (activeBatchId) => set({ activeBatchId }),
}));
