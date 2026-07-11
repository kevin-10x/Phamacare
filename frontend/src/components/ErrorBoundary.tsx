import { Component, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
          <div className="text-center max-w-md">
            <span className="text-6xl block mb-4">⚠️</span>
            <h1 className="font-display text-2xl font-semibold mb-2">Something went wrong</h1>
            <p className="text-ink/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <Link to="/" className="btn-primary" onClick={() => this.setState({ hasError: false, error: null })}>
              Go back home
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
