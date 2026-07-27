import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartSkeleton, KPISkeleton } from "@/components/admin/ChartSkeleton";

describe("ChartSkeleton", () => {
  it("renders a loading status with aria-label", () => {
    render(<ChartSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Loading chart");
  });

  it("renders sr-only loading text", () => {
    render(<ChartSkeleton />);
    expect(screen.getByText("Loading chart data…")).toBeInTheDocument();
  });

  it("renders range button placeholders when showRangeButtons is true", () => {
    const { container } = render(<ChartSkeleton showRangeButtons />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });

  it("does not render range button placeholders by default", () => {
    const { container } = render(<ChartSkeleton />);
    const skeletons = container.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeLessThanOrEqual(3);
  });
});

describe("KPISkeleton", () => {
  it("renders a loading status with aria-label", () => {
    render(<KPISkeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Loading metric");
  });

  it("renders sr-only loading text", () => {
    render(<KPISkeleton />);
    expect(screen.getByText("Loading metric data…")).toBeInTheDocument();
  });
});
