import axios from "axios";

const API_URL = "http://localhost:4000/api/post";

// ── Types ──────────────────────────────────────────────────────────────────────
export interface BacktestMetrics {
  total_profit?: number | null;
  initial_capital?: number | null;
  final_capital?: number | null;
  win_rate?: number | null;
  sharpe_ratio?: number | null;
  max_drawdown?: number | null;
  trades_count?: number | null;
  timeframe?: string | null;
}

export interface Post {
  _id?: string;
  user_id: string;
  strategy_id: string;
  title: string;
  body: string;
  is_featured: boolean;
  strategy_name?: string;
  backtest_metrics?: BacktestMetrics;
}

// 1️⃣ Create Post
export const createPost = async (data: Post) => {
  const response = await axios.post(`${API_URL}/create`, data);
  return response.data;
};

// 2️⃣ Get All Posts
export const getAllPosts = async () => {
  const response = await axios.get(`${API_URL}/all`);
  return response.data;
};

// 3️⃣ Get Featured Posts
export const getFeaturedPosts = async () => {
  const response = await axios.get(`${API_URL}/featured`);
  return response.data;
};

// 4️⃣ Get Post by ID
export const getPostById = async (id: string) => {
  const response = await axios.get(`${API_URL}/getbyid/${id}`);
  return response.data;
};

// 5️⃣ Get Posts by User
export const getPostsByUser = async (userId: string) => {
  const response = await axios.get(`${API_URL}/getbyuser/${userId}`);
  return response.data;
};

// 6️⃣ Get Posts by Strategy
export const getPostsByStrategy = async (strategyId: string) => {
  const response = await axios.get(`${API_URL}/getbystrategy/${strategyId}`);
  return response.data;
};

// 7️⃣ Update Post
export const updatePost = async (
  id: string,
  data: { title?: string; body?: string; is_featured?: boolean }
) => {
  const response = await axios.post(`${API_URL}/updatebyid/${id}`, data);
  return response.data;
};

// 8️⃣ Delete Post
export const deletePost = async (id: string) => {
  const response = await axios.delete(`${API_URL}/deletebyid/${id}`);
  return response.data;
};

// 9️⃣ Vote on Post (Reddit-style: "up" | "down" — toggles)
export const votePost = async (
  postId: string,
  userId: string,
  vote: "up" | "down"
) => {
  const response = await axios.post(`${API_URL}/vote/${postId}`, {
    user_id: userId,
    vote,
  });
  return response.data;
};

// 🔟 Share backtest results as a community post
export const shareBacktestResults = async (data: {
  user_id: string;
  strategy_id: string;
  strategy_name: string;
  title: string;
  body: string;
  backtest_metrics: BacktestMetrics;
}) => {
  const response = await axios.post(`${API_URL}/create`, {
    ...data,
    is_featured: false,
  });
  return response.data;
};