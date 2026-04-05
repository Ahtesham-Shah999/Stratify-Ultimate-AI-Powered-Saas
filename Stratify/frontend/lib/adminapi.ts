const API_BASE_URL = "http://localhost:4000/api";

export const getAllUsersApi = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch users");
  }
  return response.json();
};

export const deleteUserApi = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete user");
  }
  return response.json();
};

export const getAuditLogsApi = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/auditlogs`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch audit logs");
  }
  return response.json();
};

export const getAllStrategiesApi = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/strategies`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch strategies");
  }
  return response.json();
};
