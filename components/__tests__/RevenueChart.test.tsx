import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RevenueChart } from "@/components/admin/RevenueChart";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

describe("RevenueChart", () => {
  const sampleData = [
    { date: "2026-05-01", feeType: "platform_fee", amount: 50000 },
    { date: "2026-05-01", feeType: "underwriting_fee", amount: 20000 },
    { date: "2026-05-02", feeType: "platform_fee", amount: 60000 },
  ];

  it("renders chart skeleton when isLoading", () => {
    render(<RevenueChart isLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading chart");
  });

  it("renders empty state when data is empty", () => {
    render(<RevenueChart data={[]} />);
    expect(
      screen.getByText("No revenue recorded in this timeframe"),
    ).toBeInTheDocument();
  });

  it("renders chart with data", () => {
    render(<RevenueChart data={sampleData} />);
    expect(screen.getByRole("heading", { name: "Platform Revenue" })).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("has range selector buttons", () => {
    render(<RevenueChart data={sampleData} />);
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("30d")).toBeInTheDocument();
    expect(screen.getByText("90d")).toBeInTheDocument();
  });

  it("has role=figure with aria-label containing summary", () => {
    render(<RevenueChart data={sampleData} />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("Platform Revenue"));
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("days of data"));
  });

  it("includes sr-only table for accessibility when data present", () => {
    render(<RevenueChart data={sampleData} />);
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("does not render sr-only table when empty", () => {
    render(<RevenueChart data={[]} />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});
