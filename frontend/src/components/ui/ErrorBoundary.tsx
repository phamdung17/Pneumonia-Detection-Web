import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-red-50/30 rounded-3xl border border-red-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Đã xảy ra lỗi hệ thống</h2>
          <p className="text-slate-500 max-w-md mb-8">
            Chúng tôi xin lỗi vì sự bất tiện này. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên nếu lỗi vẫn tiếp diễn.
          </p>
          <div className="bg-white p-4 rounded-xl border border-red-100 mb-8 w-full max-w-lg overflow-auto max-h-40 text-left">
             <code className="text-xs text-red-500 font-mono">
               {error?.message || "Lỗi không xác định"}
             </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95"
          >
            <RefreshCcw size={18} />
            Tải lại trang
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
