import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChartEmptyState } from "@/components/admin/ChartEmptyState";

describe("ChartEmptyState", () => {
  it("renders default title and description", () => {
    render(<ChartEmptyState />);
    expect(screen.getByText("No data for this period")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting the date range or filters to see results."),
    ).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <ChartEmptyState
        title="No deals found"
        description="Create a deal to get started."
      />,
    );
    expect(screen.getByText("No deals found")).toBeInTheDocument();
    expect(screen.getByText("Create a deal to get started.")).toBeInTheDocument();
  });

  it("has role=status and aria-label matching title", () => {
    render(<ChartEmptyState title="Empty chart" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Empty chart");
  });
});
