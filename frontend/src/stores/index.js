import { create } from 'zustand'

// ── App Store ──────────────────────────────────────────────────
export const useAppStore = create((set) => ({
  selectedFarm: null,
  selectedZone: null,
  selectedCountry: 'India',
  language: 'en',
  judgesMode: false,

  setFarm: (farm) => set({ selectedFarm: farm }),
  setZone: (zone) => set({ selectedZone: zone }),
  setCountry: (c) => set({ selectedCountry: c }),
  setLanguage: (l) => set({ language: l }),
  toggleJudgesMode: () => set((s) => ({ judgesMode: !s.judgesMode })),
}))

// ── Weather Store ──────────────────────────────────────────────
export const useWeatherStore = create((set) => ({
  current: null,
  forecast: [],
  loading: false,
  error: null,
  lastFetch: null,

  setWeather: (current, forecast) => set({ current, forecast, loading: false, lastFetch: Date.now() }),
  setLoading: (b) => set({ loading: b }),
  setError: (e) => set({ error: e, loading: false }),
}))

// ── Alert Store ────────────────────────────────────────────────
export const useAlertStore = create((set, get) => ({
  alerts: [],

  addAlert: (alert) => set((s) => ({
    alerts: [{ id: Date.now(), ...alert }, ...s.alerts].slice(0, 50),
  })),
  dismiss: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  clearAll: () => set({ alerts: [] }),
}))

// ── Toast Store ────────────────────────────────────────────────
export const useToastStore = create((set) => ({
  toasts: [],
  show: (message, type = 'info') => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4000)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
