import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:4000/api/backtest";

/* ---------------------- TYPES ---------------------- */
interface ApiError {
  message?: string;
  error?: string;
}

export interface RunBacktestPayload {
  strategy_id: string;
  generated_rules?: any;
  timeframe: string;
  initial_capital: number;
  start_date?: string;
  end_date?: string;
  timeout?: number;
}

/* ---------------------- API FUNCTIONS ---------------------- */

// 1️⃣ RUN BACKTEST
export const runBacktestApi = async (data: RunBacktestPayload) => {
  try {
    const res = await axios.post(`${API_URL}/run`, data);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to run backtest" };
  }
};

// 2️⃣ GET BACKTEST BY ID
export const getBacktestByIdApi = async (backtestId: string) => {
  try {
    const res = await axios.get(`${API_URL}/getbyid/${backtestId}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to fetch backtest by ID" };
  }
};

// 3️⃣ GET BACKTESTS BY STRATEGY
export const getBacktestsByStrategyApi = async (strategyId: string) => {
  try {
    const res = await axios.get(`${API_URL}/getbystrategy/${strategyId}`);
    
    // Checks if the response body itself is an array
    if (Array.isArray(res.data)) {
      return res.data;
    }
    
    // Or if the array is wrapped in a data field
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    
    return [];
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to fetch backtests for strategy" };
  }
};

// 4️⃣ GET BACKTESTS BY USER
export const getBacktestsByUserApi = async (userId: string) => {
  try {
    const res = await axios.get(`${API_URL}/getbyuser/${userId}`);

    // Checks if the response body itself is an array
    if (Array.isArray(res.data)) {
      return res.data;
    }
    
    // Or if the array is wrapped in a data field
    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    
    return [];
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to fetch user's backtests" };
  }
};
