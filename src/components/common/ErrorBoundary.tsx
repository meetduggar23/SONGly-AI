import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="max-w-md text-sm text-secondary-text">
            An unexpected error occurred. Reload the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
