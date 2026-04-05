"use client";

export default function AuthFooter({ mode, setMode, darkMode }: any) {
  const textColor = darkMode ? "text-white/60" : "text-black/60";

  return (
    <div className="pt-6 text-center">
      <p className={`text-sm ${textColor}`}>
        {mode === "login" ? (
          <>
            Don't have an account?{" "}
            <span
              onClick={() => setMode("signup")}
              className="font-bold underline hover:text-primary cursor-pointer"
            >
              Sign Up
            </span>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <span
              onClick={() => setMode("login")}
              className="font-bold underline hover:text-primary cursor-pointer"
            >
              Log In
            </span>
          </>
        )}
      </p>
    </div>
  );
}
