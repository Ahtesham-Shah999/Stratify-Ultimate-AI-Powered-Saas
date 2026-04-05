// lib/googleAuth.ts
import { signIn } from "next-auth/react";

/**
 * Trigger Google OAuth login
 * @param callbackUrl Optional URL to redirect after login
 */
export const googleAuth = async (callbackUrl: string = "/dashboard") => {
  try {
    await signIn("google", { callbackUrl });
  } catch (err) {
    console.error("Google sign-in error:", err);
    throw new Error("Google sign-in failed");
  }
};
