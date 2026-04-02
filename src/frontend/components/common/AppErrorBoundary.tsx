import React from "react";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

function formatStack(error: Error): string | null {
  return error.stack ?? null;
}

export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Renderer crashed while rendering the React tree.", error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const { error } = this.state;

    return (
      <div
        style={{
          boxSizing: "border-box",
          minHeight: "100vh",
          padding: "24px",
          background: "#fff7ed",
          color: "#7c2d12",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: "12px" }}>Renderer failed to start</h1>
        <p style={{ marginTop: 0, marginBottom: "12px", lineHeight: 1.6 }}>
          The Electron shell loaded, but the React application crashed while rendering.
          Reload the window after fixing the error, or check the console for the stack trace.
        </p>
        <pre
          style={{
            margin: 0,
            padding: "16px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            borderRadius: "12px",
            background: "#ffedd5",
            color: "#9a3412",
          }}
        >
          {error.message}
          {formatStack(error) ? `\n\n${formatStack(error)}` : ""}
        </pre>
      </div>
    );
  }
}
