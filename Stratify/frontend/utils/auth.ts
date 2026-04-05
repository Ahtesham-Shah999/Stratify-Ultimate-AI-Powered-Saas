// utils/auth.ts
export function isLoggedIn() {
  if (typeof window === "undefined") return false;  // Make sure we're in the browser (client-side)

  const token = localStorage.getItem("token");
  if (!token) return false; // no token → not logged in

  try {
    const payload = JSON.parse(atob(token.split(".")[1])); // decode token
    const expiry = payload.exp * 1000; // expiration time
    return Date.now() < expiry; // true if token not expired
  } catch {
    return false;
  }
}
