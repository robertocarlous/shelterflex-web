import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KPICard } from "@/components/admin/KPICard";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
}));

describe("KPICard", () => {
  const baseProps = {
    title: "Total Users",
    value: 1234,
  };

  it("renders skeleton when isLoading", () => {
    render(<KPICard {...baseProps} isLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading metric");
  });

  it("renders value and title when loaded", () => {
    render(<KPICard {...baseProps} />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("renders change badge with positive trend", () => {
    render(<KPICard {...baseProps} change={12.5} changeLabel="vs last month" />);
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders change badge with negative trend", () => {
    render(<KPICard {...baseProps} change={-5.2} changeLabel="vs last month" />);
    expect(screen.getByText("-5.2%")).toBeInTheDocument();
  });

  it("renders role=figure with aria-label containing title and value", () => {
    render(<KPICard {...baseProps} change={10} changeLabel="vs last month" />);
    const figure = screen.getByRole("figure");
    expect(figure).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Total Users"),
    );
    expect(figure).toHaveAttribute("aria-label", expect.stringContaining("1234"));
  });

  it("shows 'Live updates active' when no change prop", () => {
    render(<KPICard {...baseProps} />);
    expect(screen.getByText("Live updates active")).toBeInTheDocument();
  });
});
