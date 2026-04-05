import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:4000/api/strategy"; 
// example: http://localhost:5000/api/strategy

/* ---------------------- TYPES ---------------------- */
interface ApiError {
  message?: string;
  error?: string;
}

export interface GeneratedRules {
  pair?: string | null;
  indicator?: string | null;
  buy?: string | null;
  sell?: string | null;
  stop_loss?: number | null;
  take_profit?: number | null;
  timeframe?: string | null;
}

export interface CreateStrategyPayload {
  owner_id: string;
  name: string;
  description?: string;
  language_input: string;
  generated_rules?: GeneratedRules;
  code_blob: string;
  initial_capital?: number;
  engine_type?: "BACKTEST" | "PAPER";
  visibility?: "PRIVATE" | "PUBLIC";
}

export interface UpdateStrategyPayload {
  name?: string;
  description?: string;
  language_input?: string;
  generated_rules?: GeneratedRules;
  code_blob?: string;
  initial_capital?: number;
  engine_type?: "BACKTEST" | "PAPER";
  visibility?: "PRIVATE" | "PUBLIC";
  portfolio_id?: string;
}

export interface ParseStrategyPayload {
  language_input: string;
  user_id?: string;
}

/* ---------------------- API FUNCTIONS ---------------------- */

// 1️⃣ CREATE STRATEGY
export const createStrategyApi = async (data: CreateStrategyPayload) => {
  try {
    const res = await axios.post(`${API_URL}/create`, data);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to create strategy" };
  }
};

// 2️⃣ GET ALL STRATEGIES
export const getAllStrategiesApi = async () => {
  try {
    const res = await axios.get(`${API_URL}/all`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to fetch strategies" };
  }
};

// 3️⃣ GET STRATEGIES BY USER
export const getStrategiesByUserApi = async (userId: string) => {
  try {
    const res = await axios.get(`${API_URL}/getbyuser/${userId}`);

    // Handles both cases:
    // Case 1: backend returns array directly
    // Case 2: backend returns { success, data }

    if (Array.isArray(res.data)) {
      return res.data;
    }

    if (res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data;
    }

    return [];
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to fetch user's strategies" };
  }
};

// 4️⃣ GET STRATEGY BY ID
export const getStrategyByIdApi = async (strategyId: string) => {
  try {
    const res = await axios.get(`${API_URL}/getbyid/${strategyId}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to fetch strategy" };
  }
};

// 5️⃣ UPDATE STRATEGY
export const updateStrategyApi = async (
  strategyId: string,
  data: UpdateStrategyPayload
) => {
  try {
    const res = await axios.post(`${API_URL}/updatebyid/${strategyId}`, data);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to update strategy" };
  }
};

// 6️⃣ DELETE STRATEGY
export const deleteStrategyApi = async (strategyId: string) => {
  try {
    const res = await axios.delete(`${API_URL}/deletebyid/${strategyId}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to delete strategy" };
  }
};

// 7️⃣ PARSE STRATEGY USING PYTHON API
export const parsedStrategyApi = async (data: ParseStrategyPayload) => {
  try {
    console.log("yes kka bcaha ",data);
    const res = await axios.post(`${API_URL}/parsedstrategy`, data);
    console.log(res.data)
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Failed to parse strategy" };
  }
};
