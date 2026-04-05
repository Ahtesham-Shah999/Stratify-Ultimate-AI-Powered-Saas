"use client";
import { motion } from "framer-motion";
import Sidebar from "@/app/components/Sidebar/page";
import CreateStrategyForm from "@/app/components/createstrategy/CreateStrategyForm/page";
import RuleList from "@/app/components/createstrategy/RuleList/page";
import { useTheme } from "@/context/theme-context";
import { useStrategyStore } from "@/app/store/strategyStore";

export default function CreateStrategyPage() {
  const { darkMode } = useTheme();
  const { parsed } = useStrategyStore();

  const menuItems = [
    { label: "Dashboard", href: "/Dashboard", icon: "dashboard" },
    { label: "Create Strategy", href: "/CreateStrategyPage", icon: "add_circle", active: true },
    { label: "My Strategies", href: "/BacktestPage", icon: "list_alt" },
    { label: "Portfolio", href: "/PortfolioPage", icon: "pie_chart" },
    { label: "Community", href: "/CommunityFeedPage", icon: "group" },
  ];

  const bottomItems = [
    { label: "Settings", href: "#", icon: "settings" },
    { label: "Help", href: "#", icon: "help" },
  ];

  const rules = parsed?.generated_rules
    ? [
        {
          type: "Entry Condition",
          pair: parsed.generated_rules.pair ?? "—",
          indicator: parsed.generated_rules.indicator ?? "—",
          condition: "≥",
          value: parsed.generated_rules.buy ?? "—",
          icon: "login",
          color: "text-green-500",
          bg: "bg-green-500/10",
        },
        {
          type: "Exit Condition",
          pair: parsed.generated_rules.pair ?? "—",
          indicator: parsed.generated_rules.indicator ?? "—",
          condition: "≤",
          value: parsed.generated_rules.sell ?? "—",
          icon: "logout",
          color: "text-red-500",
          bg: "bg-red-500/10",
        },
        ...(parsed.generated_rules.stop_loss != null
          ? [
              {
                type: "Stop Loss",
                pair: parsed.generated_rules.pair ?? "—",
                indicator: "Risk",
                condition: "at",
                value: `${parsed.generated_rules.stop_loss}%`,
                icon: "do_not_disturb_on",
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
            ]
          : []),
        ...(parsed.generated_rules.take_profit != null
          ? [
              {
                type: "Take Profit",
                pair: parsed.generated_rules.pair ?? "—",
                indicator: "Target",
                condition: "at",
                value: `${parsed.generated_rules.take_profit}%`,
                icon: "trending_up",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <div className={`flex min-h-screen ${darkMode ? "bg-black" : "bg-[#f8f5f5]"}`}>
      {/* Sidebar — slide in from left */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Sidebar menuItems={menuItems} bottomItems={bottomItems} />
      </motion.div>

      {/* Main content — fade up */}
      <motion.main
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
        className={`flex-1 overflow-y-auto px-4 py-10 ${darkMode ? "text-white" : "text-black"}`}
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {rules.length > 0 ? (
              <RuleList rules={rules} />
            ) : (
              <div
                className={`rounded-xl border border-dashed p-8 text-center ${
                  darkMode ? "border-gray-700 text-gray-500" : "border-gray-300 text-gray-400"
                }`}
              >
                <span className="material-symbols-outlined text-4xl mb-2 block">rule</span>
                <p className="text-sm">
                  Generated rules will appear here after you describe your strategy above.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </motion.main>
    </div>
    </>
  );
}
