import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] p-6 rounded-3xl bg-[#0F0F17] border-2 border-red-500/40 text-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl m-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-black text-white">
              {this.props.fallbackTitle || 'حدث تنبيه في عرض البيانات'}
            </h3>
            <p className="text-xs text-slate-400">
              تم حماية التطبيق من الإغلاق. يمكنك استعادة العرض وتحديث البيانات بنقرة واحدة.
            </p>
            {this.state.error?.message && (
              <p className="text-[10px] font-mono text-red-400 bg-red-950/40 px-2.5 py-1 rounded-lg border border-red-900/40 mt-2">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl gold-gradient-bg text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:brightness-110 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استعادة وتحديث الشاشة</span>
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>الرئيسية</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
