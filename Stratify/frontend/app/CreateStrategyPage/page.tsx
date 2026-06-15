"use client";
import { motion } from "framer-motion";
import CreateStrategyForm from "@/app/components/createstrategy/CreateStrategyForm/page";
import { useTheme } from "@/context/theme-context";

export default function CreateStrategyPage() {
  const { darkMode } = useTheme();

  return (
    <>
      <div className={`min-h-screen ${darkMode ? "bg-black" : "bg-[#f8f5f5]"}`}>
        {/* Main content — fade up */}
        <motion.main
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          className={`px-4 py-10 ${darkMode ? "text-white" : "text-black"}`}
        >
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm opacity-50">
              <span>Dashboard</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="font-semibold opacity-100" style={{ opacity: 1 }}>
                Create Strategy
              </span>
            </div>

            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
              className="text-4xl font-black"
            >
              Create New Strategy
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
            >
              <CreateStrategyForm />
            </motion.div>

          </div>
        </motion.main>
      </div>
    </>
  );
}
