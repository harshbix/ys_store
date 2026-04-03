import { Component, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error('[UI ERROR]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl space-y-4">
            <h1 className="text-lg font-semibold">YS Store</h1>
            <ErrorState
              title="Unexpected error"
              description="The app hit an unexpected issue. The page shell is still active and you can retry safely."
              onRetry={() => window.location.reload()}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
