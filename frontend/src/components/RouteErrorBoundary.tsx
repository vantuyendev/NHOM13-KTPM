import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_: Error, __: ErrorInfo) {
    // Keep silent and show fallback UI.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Trang hồ sơ gặp lỗi hiển thị</h2>
          <p className="text-sm text-gray-600 mb-4">Vui lòng tải lại trang hoặc quay về trang trước rồi thử lại.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
