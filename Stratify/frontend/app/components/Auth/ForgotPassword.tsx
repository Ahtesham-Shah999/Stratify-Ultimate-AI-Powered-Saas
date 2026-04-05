"use client";

import { useState } from "react";
import { z } from "zod";
import { useTheme } from "@/context/theme-context";
import { useRouter } from "next/navigation";
import { sendOtpApi } from "@/lib/auth";
import { checkEmailApi } from "@/lib/userapi";

// Zod schema for email validation
const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export default function ForgotPassword() {
  const { darkMode } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState(""); // For email existence check
  const [loading, setLoading] = useState(false); // For loading state during async operations

  // Function to handle email change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setTouched(true);

    try {
      ForgotPasswordSchema.parse({ email: e.target.value });
      setError("");
    } catch (err: any) {
      setError(err.errors ? err.errors[0].message : "Invalid input");
    }
  };

  const getInputBorder = () => {
    if (!touched) return darkMode ? "border-white/20" : "border-gray-300";
    return error ? "border-red-500" : "border-green-500";
  };

  const navigatetootp = () => {
    localStorage.setItem("otpEmail", email);
    localStorage.setItem("otpRole", "TRADER"); // or "ADMIN"
    router.push("/verifyotpforgot"); // Redirect to OTP verification
  };

  const checkUserExistence = async () => {
    try {
      setEmailError(""); // Reset the error message
      setLoading(true);

      const res = await checkEmailApi(email);

      if (res.exists) {
        // If the email exists, send OTP and navigate
        await sendOtpApi("TRADER", email, "Otp verification");
        navigatetootp(); // Redirect to OTP verification page
      } else {
        setEmailError("Email not found. Please check your email address.");
      }
    } catch (err: any) {
      setEmailError("Email Not Found!");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!error && email) {
      // Proceed with email existence check when the form is submitted
      checkUserExistence();
    }
  };

  return (
    <div
      className={`relative flex min-h-screen w-full flex-col items-center justify-center p-4 ${
        darkMode ? "bg-[#0F0F0F]" : "bg-[#F8F5F5]"
      }`}
    >
      {/* Glow background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1/2 w-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent blur-3xl"
      ></div>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-md rounded-xl border p-8 shadow-2xl backdrop-blur-lg ${
          darkMode
            ? "bg-black/30 border-white/10"
            : "bg-white/30 border-gray-300/30"
        }`}
      >
        <div className="text-center mb-8">
          <h1 className="text-white tracking-tight text-3xl font-bold leading-tight">
            Forgot Password
          </h1>
          <p className="text-gray-400 text-base font-normal mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-white text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleChange}
              onBlur={() => setTouched(true)}
              className={`form-input w-full rounded-lg border px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none transition-colors ${getInputBorder()}`}
            />
            {error && <p className="text-red-500 text-sm pt-1">{error}</p>}
          </div>

          {/* Email Existence Error */}
          {emailError && <p className="text-red-500 text-sm pt-1">{emailError}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !!error || !email}
            className="glow w-full h-12 rounded-lg bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending OTP..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            className="text-gray-400 text-sm font-medium hover:text-white transition-colors cursor-pointer"
            href="/login"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}
