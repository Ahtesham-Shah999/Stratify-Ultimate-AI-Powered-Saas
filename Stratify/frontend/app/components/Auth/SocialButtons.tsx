"use client";

import { signIn } from "next-auth/react";

export default function SocialButtons({ darkMode }: any) {

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <button
        onClick={() => signIn("google")}
        className="flex hover:cursor-pointer h-11 flex-1 items-center justify-center gap-3 rounded-lg border border-gray-300/50 bg-white text-black hover:bg-white/10"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 10.2V14h5.7c-.2 1.4-1.7 4-5.7 4-3.4 0-6.2-2.8-6.2-6.2S8.6 5.6 12 5.6c1.9 0 3.2.8 3.9 1.5l2.7-2.7C16.5 2.6 14.5 1.8 12 1.8 6.9 1.8 2.8 5.9 2.8 11s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-9 0-.6-.1-1-.2-1.5H12z"
          />
        </svg>
        Continue With Google
      </button>
    </div>
  );
}
