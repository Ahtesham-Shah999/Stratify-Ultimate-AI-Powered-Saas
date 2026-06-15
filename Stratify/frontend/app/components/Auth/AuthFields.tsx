"use client";

import { useState, useEffect } from "react";
import { SignInSchema, SignUpSchema } from "@/lib/validations";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { registerUserApi, loginUserApi } from "@/lib/userapi";
import { sendOtpApi } from "@/lib/auth";

type FormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
type FieldKey = keyof FormValues;

export default function AuthFields({ mode, darkMode }: any) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    name: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});

  useEffect(() => {
    setFormValues({ name: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
    setTouched({});
    setServerError("");
  }, [mode]);

  const handleChange = (field: FieldKey, value: string) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    try {
      if (mode === "login") {
        SignInSchema.parse({
          email: field === "email" ? value : formValues.email,
          password: field === "password" ? value : formValues.password,
        });
      } else {
        if (field === "name" && value.length < 8) throw new Error("Username must be at least 8 characters");
        SignUpSchema.parse({ ...formValues, [field]: value });
      }
      setErrors(prev => ({ ...prev, [field]: "" }));
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        const fe = err.issues.find((e: any) => e.path[0] === field);
        setErrors(prev => ({ ...prev, [field]: fe ? fe.message : "" }));
      } else {
        setErrors(prev => ({ ...prev, [field]: err.message }));
      }
    }
  };

  const getBorderColor = (field: FieldKey) => {
    if (!touched[field]) return "rgba(255,255,255,0.1)";
    return errors[field] ? "#E8112D" : "#00e676";
  };

  const getGlowColor = (field: FieldKey) => {
    if (!touched[field]) return undefined;
    return errors[field]
      ? "0 0 0 3px rgba(232,17,45,0.12)"
      : "0 0 0 3px rgba(0,230,118,0.10)";
  };

  const isValid = (f: FieldKey) => touched[f] && !errors[f];

  const handleSubmit = async () => {
    setServerError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await loginUserApi({ email: formValues.email, password: formValues.password });
        localStorage.setItem("token", res.token);
        if (res.user) {
          localStorage.setItem("userData", JSON.stringify(res.user));
          localStorage.setItem("user_id", res.user.id);
          if (res.user.role === "ADMIN" || res.user.role === "admin") {
            router.push("/Admin");
          } else {
            router.push("/Dashboard");
          }
        } else {
          router.push("/Dashboard");
        }
      } else {
        if (formValues.password !== formValues.confirmPassword) {
          setServerError("Passwords do not match");
          setLoading(false);
          return;
        }
        await registerUserApi({ username: formValues.name, email: formValues.email, password: formValues.password });
        await sendOtpApi("TRADER", formValues.email, "OTP Verification");
        setShowOtpDialog(true);
        setTimeout(() => {
          setShowOtpDialog(false);
          localStorage.setItem("otpEmail", formValues.email);
          localStorage.setItem("otpRole", "TRADER");
          router.push("/otpverification");
        }, 2000);
      }
    } catch (err: any) {
      setServerError(err?.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid",
    padding: "0 44px 0 16px",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease",
  };

  return (
    <div className="flex flex-col gap-4 py-2 relative">
      <style>{`
        @keyframes fieldReveal {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        @keyframes checkPop {
          from { transform: translateY(-50%) scale(0.5); opacity: 0; }
          to { transform: translateY(-50%) scale(1); opacity: 1; }
        }
        @keyframes submitPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(232,17,45,0.35); }
          50% { box-shadow: 0 4px 40px rgba(232,17,45,0.6), 0 0 0 4px rgba(232,17,45,0.08); }
        }
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes successSlide {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .auth-field-wrap { animation: fieldReveal 0.4s ease both; }
        .auth-field-wrap:nth-child(1) { animation-delay: 0.05s; }
        .auth-field-wrap:nth-child(2) { animation-delay: 0.1s; }
        .auth-field-wrap:nth-child(3) { animation-delay: 0.15s; }
        .auth-field-wrap:nth-child(4) { animation-delay: 0.2s; }
        .check-icon { animation: checkPop 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
        .error-msg { animation: errorShake 0.4s ease both; }
        .submit-btn-main {
          width: 100%;
          height: 50px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #E8112D 0%, #b00020 100%);
          color: #fff;
          font-weight: 800;
          font-size: 0.92rem;
          font-family: inherit;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          margin-top: 8px;
          transition: transform 0.2s ease, opacity 0.2s ease;
          animation: submitPulse 3s ease-in-out infinite;
        }
        .submit-btn-main::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent);
          transition: left 0.45s ease;
        }
        .submit-btn-main:hover::before { left: 100%; }
        .submit-btn-main:hover { transform: translateY(-2px); }
        .submit-btn-main:active { transform: scale(0.98); }
        .submit-btn-main:disabled { opacity: 0.55; cursor: not-allowed; transform: none; animation: none; }
        .auth-input:focus {
          background: rgba(232,17,45,0.04) !important;
        }
        ::placeholder { color: rgba(255,255,255,0.25) !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 50px #111 inset !important;
          -webkit-text-fill-color: #fff !important;
        }
      `}</style>

      {/* OTP Success Dialog */}
      {showOtpDialog && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-xl"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="text-center p-6"
            style={{ animation: "successSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <div className="text-5xl mb-3">✅</div>
            <p className="text-white font-bold text-lg tracking-wide">Account Created!</p>
            <p className="text-white/50 text-sm mt-1">Redirecting to OTP verification...</p>
            <div className="mt-4 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg,#E8112D,#C9A84C)",
                  animation: "lineGrow 2s linear forwards",
                  width: "0%",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Server Error */}
      {serverError && (
        <div
          className="error-msg flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
          style={{
            background: "rgba(232,17,45,0.1)",
            border: "1px solid rgba(232,17,45,0.3)",
            color: "#ff6b6b",
          }}
        >
          <span>⚠️</span>
          <span>{serverError}</span>
        </div>
      )}

      {/* Username (Signup Only) */}
      {mode === "signup" && (
        <div className="auth-field-wrap relative flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-white/45 pb-1">
            Username
          </label>
          <div className="relative">
            <input
              className="auth-input"
              type="text"
              placeholder="Choose a username (8+ chars)"
              value={formValues.name}
              onChange={e => handleChange("name", e.target.value)}
              style={{
                ...inputBase,
                borderColor: getBorderColor("name"),
                boxShadow: touched.name ? getGlowColor("name") : undefined,
              }}
            />
            {isValid("name") && (
              <span className="check-icon absolute right-3 top-9 -translate-y-1/2 text-green-400 text-base">✓</span>
            )}
          </div>
          {errors.name && touched.name && (
            <p className="error-msg text-xs text-red-400 font-medium pl-1 flex items-center gap-1">
              <span>⚠</span> {errors.name}
            </p>
          )}
        </div>
      )}

      {/* Email */}
      <div className="auth-field-wrap relative flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-white/45 pb-1">
          Email Address
        </label>
        <div className="relative">
          <input
            className="auth-input"
            type="email"
            placeholder="you@stratify.io"
            value={formValues.email}
            onChange={e => handleChange("email", e.target.value)}
            style={{
              ...inputBase,
              borderColor: getBorderColor("email"),
              boxShadow: touched.email ? getGlowColor("email") : undefined,
            }}
          />
          {isValid("email") && (
            <span className="check-icon absolute right-3 top-9 -translate-y-1/2 text-green-400 text-base">✓</span>
          )}
        </div>
        {errors.email && touched.email && (
          <p className="error-msg text-xs text-red-400 font-medium pl-1 flex items-center gap-1">
            <span>⚠</span> {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="auth-field-wrap relative flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-widest text-white/45 pb-1">
          Password
        </label>
        <div className="relative">
          <input
            className="auth-input"
            type={passwordVisible ? "text" : "password"}
            placeholder="Enter your password"
            value={formValues.password}
            onChange={e => handleChange("password", e.target.value)}
            style={{
              ...inputBase,
              paddingRight: "72px",
              borderColor: getBorderColor("password"),
              boxShadow: touched.password ? getGlowColor("password") : undefined,
            }}
          />
          <div className="absolute right-3 top-7 -translate-y-1/2 flex items-center gap-1.5">
            {isValid("password") && (
              <span className="check-icon text-green-400 text-base leading-none">✓</span>
            )}
            <button
              type="button"
              onClick={() => setPasswordVisible(v => !v)}
              className="text-white/40 hover:text-white/80 transition-colors text-sm leading-none"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              title={passwordVisible ? "Hide password" : "Show password"}
            >
              {passwordVisible ? "🙈" : "👁"}
            </button>
          </div>
        </div>
        {errors.password && touched.password && (
          <p className="error-msg text-xs text-red-400 font-medium pl-1 flex items-center gap-1">
            <span>⚠</span> {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password (Signup Only) */}
      {mode === "signup" && (
        <div className="auth-field-wrap relative flex flex-col gap-1">
          <label className="text-xs font-bold uppercase tracking-widest text-white/45 pb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              className="auth-input"
              type={confirmVisible ? "text" : "password"}
              placeholder="Re-enter your password"
              value={formValues.confirmPassword}
              onChange={e => handleChange("confirmPassword", e.target.value)}
              style={{
                ...inputBase,
                paddingRight: "72px",
                borderColor: getBorderColor("confirmPassword"),
                boxShadow: touched.confirmPassword ? getGlowColor("confirmPassword") : undefined,
              }}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isValid("confirmPassword") && (
                <span className="check-icon text-green-400 text-base leading-none">✓</span>
              )}
              <button
                type="button"
                onClick={() => setConfirmVisible(v => !v)}
                className="text-white/40 hover:text-white/80 transition-colors text-sm leading-none"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                {confirmVisible ? "🙈" : "👁"}
              </button>
            </div>
          </div>
          {errors.confirmPassword && touched.confirmPassword && (
            <p className="error-msg text-xs text-red-400 font-medium pl-1 flex items-center gap-1">
              <span>⚠</span> {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {/* Forgot Password */}
      {mode === "login" && (
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              className="w-4 h-4 rounded-md border border-white/15 bg-white/04 flex-shrink-0 group-hover:border-white/30 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)" }}
            />
            <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => router.push("/forgotpassword")}
            className="text-xs font-semibold transition-opacity"
            style={{
              color: "#E8112D",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Forgot Password?
          </button>
        </div>
      )}

      {/* Submit */}
      <button
        className="submit-btn-main"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2.5">
            <span
              style={{
                width: "16px", height: "16px",
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spinLoader 0.65s linear infinite",
              }}
            />
            {mode === "login" ? "Authenticating..." : "Creating Account..."}
          </span>
        ) : (
          mode === "login" ? "Sign In to Terminal →" : "Create Free Account →"
        )}
      </button>
    </div>
  );
}