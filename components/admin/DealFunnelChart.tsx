"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { ChartSkeleton } from "./ChartSkeleton";
import { ChartEmptyState } from "./ChartEmptyState";

export interface DealFunnelChartProps {
  data?: {
    draft: number;
    active: number;
    at_risk: number;
    completed: number;
    defaulted: number;
  };
  isLoading?: boolean;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const percentage = item.total > 0 ? ((item.count / item.total) * 100).toFixed(1) : "0.0";
    return (
      <div className="border-3 border-foreground bg-white text-black p-3 font-mono text-xs shadow-[3px_3px_0px_0px_rgba(26,26,26,1)]">
        <p className="font-bold border-b-2 border-foreground pb-1 mb-1.5 uppercase">{item.name}</p>
        <p className="flex justify-between gap-4">
          <span>Deals:</span>
          <span className="font-black">{item.count}</span>
        </p>
        <p className="flex justify-between gap-4 text-muted-foreground">
          <span>Share:</span>
          <span className="font-bold">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

function buildSummary(data: NonNullable<DealFunnelChartProps["data"]>) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  return `Draft: ${data.draft}, Active: ${data.active}, At Risk: ${data.at_risk}, Completed: ${data.completed}, Defaulted: ${data.defaulted}. Total: ${total} deals.`;
}

export function DealFunnelChart({ data, isLoading = false }: DealFunnelChartProps) {
  if (isLoading) {
    return <ChartSkeleton />;
  }

  const totalDeals = Object.values(data || {}).reduce((a, b) => a + b, 0);

  const chartData = data
    ? [
        { name: "Draft", count: data.draft, fill: "#94a3b8", total: totalDeals },
        { name: "Active", count: data.active, fill: "#2563eb", total: totalDeals },
        { name: "At Risk", count: data.at_risk, fill: "#eab308", total: totalDeals },
        { name: "Completed", count: data.completed, fill: "#16a34a", total: totalDeals },
        { name: "Defaulted", count: data.defaulted, fill: "#dc2626", total: totalDeals },
      ]
    : [];

  const summary = data ? buildSummary(data) : "No deal data available.";

  return (
    <div
      className="border-3 border-foreground bg-card p-6 shadow-[6px_6px_0px_0px_rgba(26,26,26,1)] flex flex-col justify-between h-[360px] transition-all hover:shadow-[3px_3px_0px_0px_rgba(26,26,26,1)] hover:translate-x-0.5 hover:translate-y-0.5"
      role="figure"
      aria-label={`Deal Funnel Status chart. ${summary}`}
    >
      <div>
        <h3 className="font-mono text-lg font-black uppercase tracking-tight">Deal Funnel Status</h3>
        <p className="font-mono text-xs text-muted-foreground mt-0.5 mb-4">
          Deals overview across the platform lifecycle
        </p>
      </div>

      <div className="flex-1 w-full min-h-0">
        {totalDeals === 0 ? (
          <ChartEmptyState title="No deal data available" description="There are no deals to display for the current filters." />
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                barSize={40}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4" vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                  tick={{ fill: "#000000", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#000000", strokeWidth: 2 }}
                  tick={{ fill: "#000000", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}
                />
                <Tooltip content={CustomTooltip} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} stroke="#000000" strokeWidth={2}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="sr-only">
              <table>
                <caption>Deal Funnel Status</caption>
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Count</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.count}</td>
                      <td>{row.total > 0 ? ((row.count / row.total) * 100).toFixed(1) : "0.0"}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
