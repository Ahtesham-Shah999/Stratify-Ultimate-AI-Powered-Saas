"use client";
import { useTheme } from "@/context/theme-context";
import DashboardCards from "@/app/components/Dashboard/DashboardCards/page";
import AISentimentSnapshot from "@/app/components/Dashboard/AISentimentSnapshot/page";
import MyStrategies from "@/app/components/Dashboard/MyStrategies/page";
import StrategyAlertsAndMarketSnapshot from "@/app/components/Dashboard/StrategyAlertsAndMarketSnapshot/page";
import StrategyPerformance from "@/app/components/Dashboard/StrategyPerformance/page";


        
export default function Dashboard() {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <div>
      
    <div className={`${darkMode?"bg-[#230f0f]":"bg-[#f8f5f5]"} p-6`}>
      <DashboardCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <StrategyPerformance />
            <MyStrategies />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <AISentimentSnapshot />
          </div>
        </div>
    </div>
    </div>
  );
}
