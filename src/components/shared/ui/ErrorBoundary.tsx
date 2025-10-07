'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 🧱 ERROR BOUNDARY ДЛЯ КЛЮЧЕВЫХ УЧАСТКОВ UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.log('❌ ErrorBoundary: отлов ошибки', { error });
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.log('❌ ErrorBoundary: подробности', { error, info });
    this.props.onError?.(error, info);
  }

  private handleRetry = () => {
    console.log('🔄 ErrorBoundary: повторная попытка восстановления');
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          message={this.state.error?.message}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export type { ErrorBoundaryProps };
