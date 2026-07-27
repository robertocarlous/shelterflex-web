import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChartErrorBoundary } from "@/components/admin/ChartErrorBoundary";

function Thrower(): React.ReactNode {
  throw new Error("Chart render failed");
}

describe("ChartErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ChartErrorBoundary chartName="Test Chart">
        <div>Chart content</div>
      </ChartErrorBoundary>,
    );
    expect(screen.getByText("Chart content")).toBeInTheDocument();
  });

  it("renders error fallback when child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ChartErrorBoundary chartName="Revenue">
        <Thrower />
      </ChartErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Failed to load Revenue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("calls onRetry when retry is clicked", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onRetry = vi.fn();

    render(
      <ChartErrorBoundary chartName="Funnel" onRetry={onRetry}>
        <Thrower />
      </ChartErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows children after error state is reset with non-throwing content", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { unmount } = render(
      <ChartErrorBoundary chartName="Funnel">
        <Thrower />
      </ChartErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    unmount();

    render(
      <ChartErrorBoundary chartName="Funnel">
        <div>Recovered content</div>
      </ChartErrorBoundary>,
    );
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });

  it("does not take down sibling when one child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <div>
        <ChartErrorBoundary chartName="Failing">
          <Thrower />
        </ChartErrorBoundary>
        <ChartErrorBoundary chartName="Working">
          <div>Healthy chart</div>
        </ChartErrorBoundary>
      </div>,
    );

    expect(screen.getByText("Failed to load Failing")).toBeInTheDocument();
    expect(screen.getByText("Healthy chart")).toBeInTheDocument();
  });
});
