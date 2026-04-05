import { create } from "zustand";

interface TradeAlert {
  type: string;
  text: string;
  time: string;
}

interface AlertStore {
  alerts: TradeAlert[];
  unreadCount: number;
  notificationsEnabled: boolean;
  addAlert: (alert: TradeAlert) => void;
  toggleNotifications: () => void;
  clearAlerts: () => void;
  clearUnread: () => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  unreadCount: 0,
  notificationsEnabled: true,
  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100), // Keep last 100
      unreadCount: state.notificationsEnabled ? state.unreadCount + 1 : state.unreadCount,
    })),
  toggleNotifications: () =>
    set((state) => ({ notificationsEnabled: !state.notificationsEnabled })),
  clearAlerts: () => set({ alerts: [], unreadCount: 0 }),
  clearUnread: () => set({ unreadCount: 0 }),
}));
