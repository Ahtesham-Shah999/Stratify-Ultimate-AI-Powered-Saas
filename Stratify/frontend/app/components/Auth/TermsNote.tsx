"use client";

export default function TermsNote({ darkMode }: any) {
  return (
    <div className="mt-6 text-center">
      <style>{`
        @keyframes termsReveal {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .terms-link {
          color: rgba(255,255,255,0.45);
          text-decoration: underline;
          text-underline-offset: 2px;
          text-decoration-color: rgba(255,255,255,0.15);
          transition: color 0.2s ease, text-decoration-color 0.2s ease;
          font-weight: 600;
        }
        .terms-link:hover {
          color: #E8112D;
          text-decoration-color: rgba(232,17,45,0.5);
        }
      `}</style>

      <p
        className="text-xs leading-relaxed"
        style={{
          color: "rgba(255,255,255,0.25)",
          animation: "termsReveal 0.6s ease 0.5s both",
        }}
      >
        By continuing, you agree to Stratify's{" "}
        <a className="terms-link" href="#">
          Terms of Service
        </a>{" "}
        and{" "}
        <a className="terms-link" href="#">
          Privacy Policy
        </a>
        .
      </p>

      {/* Security badge row */}
      <div
        className="flex items-center justify-center gap-3 mt-4"
        style={{ animation: "termsReveal 0.6s ease 0.65s both" }}
      >
        {["🔒 SOC2", "🛡 Encrypted", "⚡ 99.9% Uptime"].map((b, i) => (
          <span
            key={i}
            className="text-xs font-semibold"
            style={{
              color: "rgba(255,255,255,0.18)",
              letterSpacing: "0.04em",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.1)" : "none",
              paddingRight: i < 2 ? "12px" : 0,
            }}
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}