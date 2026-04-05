import axios, { AxiosError } from "axios";

const API_URL = "http://localhost:4000/api/user";
// example: http://localhost:5000/api/user

// -------- TYPES --------
interface ApiError {
  message?: string;
  error?: string;
}

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: "TRADER" | "ADMIN";
}

interface LoginPayload {
  email: string;
  password: string;
}

interface UpdateUserPayload {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

interface UserSettingsPayload {
  user_id: string;
  timezone?: string;
  notification_pref?: string;
}

// -------- API FUNCTIONS --------

// 1️⃣ REGISTER USER
export const registerUserApi = async (data: RegisterPayload) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, data);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Registration failed" };
  }
};

// 2️⃣ LOGIN USER
export const loginUserApi = async (data: {
  email: string;
  password: string;
}) => {
  try {
    console.log("Sending data", data);
    const res = await axios.post(`${API_URL}/login`, data);
    console.log("Response:", res.data);
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("Axios error response:", err.response?.data);
      throw err.response?.data ?? { message: "Login failed" };
    }
    throw { message: "Login failed (unknown error)" };
  }
};
//check email
export const checkEmailApi = async (email: string) => {
  try {
    console.log("Checking email:", email);

    const res = await axios.post(
      `${API_URL}/checkemail/${email}`,
      {}, // empty body
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Only store token in localStorage if running in browser
    if (res.data.token && typeof window !== "undefined") {
      console.log("yess")
      localStorage.setItem("token", res.data.token);
    }

    console.log("Response:", res.data);
    return res.data; // { exists: true/false, token?, user? }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("Axios error response:", err.response?.data);
      throw err.response?.data ?? { message: "Check email failed" };
    }
    console.error("Unknown error:", err);
    throw { message: "Check email failed (unknown error)" };
  }
};
// 3️⃣ UPDATE USER
export const updateUserApi = async (email: string, data: UpdateUserPayload) => {
  try {
    const res = await axios.put(`${API_URL}/update-user/${email}`, data);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Update failed" };
  }
};

// 4️⃣ GET USER BY ID
export const getUserByIdApi = async (id: string) => {
  try {
    const res = await axios.get(`${API_URL}/getuserbyid/${id}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to fetch user" };
  }
};

// 5️⃣ DELETE USER
export const deleteUserApi = async (id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/deleteuser/${id}`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to delete user" };
  }
};

// 6️⃣ GET ALL TRADERS
export const getAllUsersApi = async () => {
  try {
    const res = await axios.get(`${API_URL}/getAllusers`);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to fetch users" };
  }
};

// 7️⃣ SET USER SETTINGS
export const setUserSettingsApi = async (data: UserSettingsPayload) => {
  try {
    const res = await axios.post(`${API_URL}/setUserSettings`, data);
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to save settings" };
  }
};

// 8️⃣ UPDATE USER SETTINGS
export const updateUserSettingsApi = async (
  userId: string,
  data: UserSettingsPayload
) => {
  try {
    const res = await axios.post(
      `${API_URL}/updateUserSettings/${userId}`,
      data
    );
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to update settings" };
  }
};

// 9️⃣ UPLOAD PROFILE PIC
export const uploadProfilePicApi = async (userId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("profile_pic", file);

    const res = await axios.post(`${API_URL}/upload-pic/${userId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (err: unknown) {
    const error = err as AxiosError<ApiError>;
    throw error.response?.data ?? { message: "Unable to upload profile picture" };
  }
};
