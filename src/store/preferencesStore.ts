import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  /** Show hover/focus tooltips on icon buttons throughout the app. */
  tooltipsEnabled: boolean;
  setTooltipsEnabled: (value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      tooltipsEnabled: true,
      setTooltipsEnabled: (value) => set({ tooltipsEnabled: value }),
    }),
    { name: "ahia-preferences" }
  )
);
