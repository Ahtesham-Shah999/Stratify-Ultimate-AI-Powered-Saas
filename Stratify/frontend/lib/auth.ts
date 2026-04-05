import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:4000/api/auth"; 
// example: http://localhost:5000/api/auth

// Type for API error response
interface ApiError {
  message: string;
  success?: boolean;
}

// 📌 Send OTP
export const sendOtpApi = async (
  role: "TRADER" | "ADMIN",
  email: string,
  subject: string
) => {
  try {
    const response = await axios.post(`${API_URL}/send-otp/${role}`, {
      email,
      Subject: subject,
    });

    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Error sending OTP" };
  }
};

// 📌 Verify OTP
export const verifyOtpApi = async (
  role: "TRADER" | "ADMIN",
  email: string,
  otp: string
) => {
  try {
    const response = await axios.post(`${API_URL}/verify-otp/${role}`, {
      email,
      otp,
    });

    return response.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Invalid OTP" };
  }
};
