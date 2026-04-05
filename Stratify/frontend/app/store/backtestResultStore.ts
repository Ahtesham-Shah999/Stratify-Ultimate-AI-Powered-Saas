import { create } from 'zustand';

export interface Trade {
  action: 'BUY' | 'SELL';
  price: number;
  time: string;
  profit: number | null;
}

export interface BacktestResultData {
  _id?: string;
  strategy_id?: string;
  timeframe?: string;
  initial_capital?: number;
  final_capital?: number | null;
  profit_loss: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
  trades_count: number;
  trades: Trade[];
  symbol?: string;
  created_at?: string;
}

interface BacktestResultState {
  currentBacktest: BacktestResultData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentBacktest: (result: BacktestResultData) => void;
  clearCurrentBacktest: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useBacktestResultStore = create<BacktestResultState>((set) => ({
  currentBacktest: null,
  isLoading: false,
  error: null,

  setCurrentBacktest: (result) => set({ currentBacktest: result, error: null }),
  clearCurrentBacktest: () => set({ currentBacktest: null, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
