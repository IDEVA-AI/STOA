import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg text-text transition-colors duration-500">
          <div className="max-w-md w-full text-center px-8">
            <h1 className="serif-display text-4xl mb-4 text-gold">
              Algo deu errado
            </h1>
            {this.state.error && (
              <p className="text-warm-gray text-sm mb-8 font-sans leading-relaxed">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="mono-label px-6 py-3 border border-gold text-gold hover:bg-gold hover:text-bg transition-colors duration-300"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
