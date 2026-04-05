import React from "react";
import CapitalChart from "@/app/components/BactestResult/CapitalChart/page";
import MetricsGrid from "@/app/components/BactestResult/MetricsGrid/page";

export default function ChartsAndMetrics() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <CapitalChart />
      <MetricsGrid />
    </div>
  );
}
