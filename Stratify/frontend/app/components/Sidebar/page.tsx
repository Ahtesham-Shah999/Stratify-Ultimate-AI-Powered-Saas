import Link from "next/link";
import { useTheme } from "@/context/theme-context";

export default function Sidebar({ menuItems, bottomItems }: any) {
  const { darkMode } = useTheme();

  return (
    <aside
      className={`hidden md:flex w-64 flex-col gap-8 p-4 border-r 
      ${darkMode ? "bg-black border-[#2d2d2d]" : "bg-[#f8f5f5] border-[#e5e7eb]"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-2">
        <div
          className="size-10 bg-center bg-no-repeat bg-cover rounded-full"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD0joYCX-G_PL8ykwM0nZqDi_OpjF7WJA-pMhH2PoLxczLX0tkxvMWArwln1RfsmiJYjejwgExloeBfCt-oM_bF-FmC8j6YqZ-Dn_WV12eUWh6JaHS1uJ4yKlO5pcd5CdRQhAAj-o1_fXFskyKFHbYfrytyQs9s3XYLYkONAd1bPHdpKxDxG7D_IafgNDjwYQpYK52_HapiK21FFBZOOGA2L6vdbqRJlPb-13PkifTbl7VLeVHNM7k1blKwBMRq5ExhYT_-IVKaJGPP')",
          }}
        />
        <div className="flex flex-col">
          <h1 className={`text-base font-bold ${darkMode ? "text-white" : "text-black"}`}>
            Stratify
          </h1>
          <p className={`text-sm ${darkMode ? "text-neutral-400" : "text-neutral-600"}`}>
            AI Crypto Trading
          </p>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item: any, idx: any) => {
          const isActive = item.active;

          return (
            <Link
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${
                  isActive
                    ? "bg-red-500/20 text-red-500"
                    : darkMode
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-black hover:bg-black/5 hover:text-black"
                }
              `}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                {item.icon}
              </span>
              <p className="text-sm font-medium">{item.label}</p>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Items */}
      <div className="mt-auto flex flex-col gap-1">
        {bottomItems.map((item: any, idx: any) => {
          if (item.onClick) {
            return (
              <button
                key={idx}
                onClick={item.onClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left
                  ${
                    item.isDanger
                      ? "text-red-500 hover:bg-red-500/10"
                      : darkMode
                      ? "text-white/70 hover:text-white hover:bg-white/10"
                      : "text-black hover:text-black hover:bg-black/5"
                  }
                `}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <p className="text-sm font-medium">{item.label}</p>
              </button>
            );
          }

          return (
            <Link
              key={idx}
              href={item.href || "#"}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                ${
                  darkMode
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-black hover:text-black hover:bg-black/5"
                }
              `}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <p className="text-sm font-medium">{item.label}</p>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
