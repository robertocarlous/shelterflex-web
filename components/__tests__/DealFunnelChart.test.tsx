import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DealFunnelChart } from "@/components/admin/DealFunnelChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe("DealFunnelChart", () => {
  const sampleData = {
    draft: 5,
    active: 12,
    at_risk: 3,
    completed: 20,
    defaulted: 2,
  };

  it("renders chart skeleton when isLoading", () => {
    render(<DealFunnelChart isLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading chart");
    expect(screen.getByText("Loading chart data…")).toBeInTheDocument();
  });

  it("renders empty state when data is all zeros", () => {
    render(
      <DealFunnelChart data={{ draft: 0, active: 0, at_risk: 0, completed: 0, defaulted: 0 }} />,
    );
    expect(screen.getByText("No deal data available")).toBeInTheDocument();
  });

  it("renders empty state when data is undefined", () => {
    render(<DealFunnelChart />);
    expect(screen.getByText("No deal data available")).toBeInTheDocument();
  });

  it("renders the chart with data", () => {
    render(<DealFunnelChart data={sampleData} />);
    expect(screen.getByRole("heading", { name: "Deal Funnel Status" })).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("has role=figure with aria-label containing summary", () => {
    render(<DealFunnelChart data={sampleData} />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("Draft: 5"));
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("Active: 12"));
  });

  it("includes sr-only table for accessibility", () => {
    render(<DealFunnelChart data={sampleData} />);
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getAllByText("Draft").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);
  });
});
