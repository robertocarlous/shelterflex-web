"use client";

import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  chartName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`ChartErrorBoundary (${this.props.chartName}) caught:`, error, errorInfo);
    }
  }

  handleRetry = () => {
    this.props.onRetry?.();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="border-3 border-red-300 bg-red-50 p-6 shadow-[4px_4px_0px_0px_rgba(220,38,38,0.3)] flex flex-col items-center justify-center h-[360px] text-center"
          role="alert"
          aria-label={`${this.props.chartName} failed to load`}
        >
          <AlertTriangle className="w-8 h-8 text-red-500 mb-3" aria-hidden="true" />
          <p className="font-mono text-sm font-bold text-red-800">
            Failed to load {this.props.chartName}
          </p>
          <p className="font-mono text-xs text-red-600 mt-1 mb-4 max-w-xs">
            {this.state.error?.message || "An unexpected error occurred while rendering this chart."}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 border-2 border-red-400 bg-white text-red-700 px-3 py-1.5 font-mono text-xs font-bold uppercase shadow-[2px_2px_0px_0px_rgba(220,38,38,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(220,38,38,0.3)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
