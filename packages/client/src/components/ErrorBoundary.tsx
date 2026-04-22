import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StateScreen } from './StateScreen';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <StateScreen
          mascotState="sad"
          title={this.props.fallbackMessage ?? '뭔가 이상해'}
          description="다시 시도해볼까?"
          action={{ label: '↻ 다시', onClick: () => location.reload() }}
        />
      );
    }
    return this.props.children;
  }
}
