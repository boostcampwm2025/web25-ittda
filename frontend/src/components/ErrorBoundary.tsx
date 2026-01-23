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
    // 404 에러는 not-found 페이지로
    if ('code' in error && error.code === 'NOT_FOUND') {
      return { hasError: true, error };
    }

    // 시스템 에러 (네트워크, 파싱 등)는 Fallback UI 표시
    const isSystemError =
      !('code' in error) ||
      error.code === 'NETWORK_ERROR' ||
      error.code === 'PARSE_ERROR';

    if (isSystemError) {
      return { hasError: true, error };
    }

    // 그 외 비즈니스 에러는 Toast로만 표시
    return { hasError: false, error: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error({ error, errorInfo });
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
