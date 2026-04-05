import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:4000/api/portfolio";
const STRATEGY_API_URL = "http://localhost:4000/api/strategy";

interface ApiError {
  message?: string;
  error?: string;
}

export interface Portfolio {
  _id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface CreatePortfolioPayload {
  user_id: string;
  name: string;
  description?: string;
}

export interface UpdatePortfolioPayload {
  name?: string;
  description?: string;
}

// 1️⃣ Get all portfolios for a user
export const getPortfoliosByUserApi = async (user_id: string): Promise<Portfolio[]> => {
  try {
    const res = await axios.get(`${API_URL}/user/${user_id}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to fetch portfolios" };
  }
};

// 2️⃣ Get portfolio by ID
export const getPortfolioByIdApi = async (portfolio_id: string): Promise<Portfolio> => {
  try {
    const res = await axios.get(`${API_URL}/${portfolio_id}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to fetch portfolio" };
  }
};

// 3️⃣ Create portfolio
export const createPortfolioApi = async (data: CreatePortfolioPayload): Promise<Portfolio> => {
  try {
    const res = await axios.post(`${API_URL}`, data);
    return res.data.portfolio;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to create portfolio" };
  }
};

// 4️⃣ Update portfolio
export const updatePortfolioApi = async (
  portfolio_id: string,
  data: UpdatePortfolioPayload
): Promise<Portfolio> => {
  try {
    const res = await axios.put(`${API_URL}/${portfolio_id}`, data);
    return res.data.portfolio;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to update portfolio" };
  }
};

// 5️⃣ Delete portfolio
export const deletePortfolioApi = async (portfolio_id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${portfolio_id}`);
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to delete portfolio" };
  }
};

// ── Strategy types ──────────────────────────────────────────────────
export interface PortfolioStrategy {
  _id: string;
  name: string;
  description?: string;
  initial_capital?: number;
  engine_type?: string;
  visibility?: string;
  created_at?: string;
}

// 6️⃣ Get strategies inside a portfolio
export const getStrategiesByPortfolioApi = async (
  portfolio_id: string
): Promise<PortfolioStrategy[]> => {
  try {
    const res = await axios.get(
      `${STRATEGY_API_URL}/getbyportfolio/${portfolio_id}`
    );
    return Array.isArray(res.data) ? res.data : [];
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    // 404 just means no strategies yet — return empty array
    if ((error.response?.status ?? 0) === 404) return [];
    throw error.response?.data ?? { message: "Unable to fetch strategies" };
  }
};
