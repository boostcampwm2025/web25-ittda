'use client';

import { Component, ReactNode, ErrorInfo, ComponentType } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface FallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

type ErrorBoundaryProps = {
  FallbackComponent: ComponentType<FallbackProps>;
  onReset: () => void;
  children: ReactNode;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };

    this.resetErrorBoundary = this.resetErrorBoundary.bind(this);
  }

  /** 에러 상태 변경 */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.log({ error, errorInfo });
  }

  /** 에러 상태 기본 초기화 */
  resetErrorBoundary(): void {
    this.props.onReset();

    this.setState({
      hasError: false,
      error: null,
    });
  }

  render() {
    const { state, props } = this;

    const { hasError, error } = state;

    const { FallbackComponent, children } = props;

    if (hasError && error) {
      return (
        <FallbackComponent
          error={error}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return children;
  }
}

export default ErrorBoundary;
