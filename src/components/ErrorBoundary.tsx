import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Undo2, Trash2 } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isCorruptedState: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    isCorruptedState: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    const msg = error?.message || "";
    const isCorrupted = msg.includes("PayloadTooLargeError") || msg.includes("Unexpected token") || msg.includes("SyntaxError");
    return { hasError: true, error, isCorruptedState: isCorrupted };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleResetState = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleResetAppState = () => {
    try {
      localStorage.clear();
      console.log("App state cache cleared successfully.");
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans select-none">
          <div className="w-full max-w-md bg-white border border-[#E1E4E8] rounded-xl p-8 shadow-md text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                {this.state.isCorruptedState ? "Corrupted System State Detected" : "System Interface Disruption"}
              </h1>
              {this.state.isCorruptedState && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg text-left font-medium space-y-1">
                  <span className="font-bold uppercase tracking-wider block text-[9px] text-amber-600">State Corrupted</span>
                  <span>An invalid cache or payload error has been detected. Performing a Hard Reset is recommended to restore operations.</span>
                </div>
              )}
              <p className="text-xs text-slate-500 font-mono leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 text-left overflow-x-auto max-h-40">
                {this.state.error?.message || "An unexpected application error occurred."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                id="reset-state-btn"
                onClick={this.handleResetState}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-[#E1E4E8] bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-3xs"
              >
                <Undo2 className="h-3.5 w-3.5 text-slate-500" />
                <span>Reset View</span>
              </button>
              <button
                id="refresh-page-btn"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0052CC] hover:bg-[#0041a3] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 text-indigo-100" />
                <span>Reload App</span>
              </button>
              <button
                id="reset-app-state-btn"
                onClick={this.handleResetAppState}
                className={`col-span-2 flex items-center justify-center gap-1.5 px-4 py-2.5 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs ${
                  this.state.isCorruptedState 
                    ? "bg-amber-600 hover:bg-amber-700 animate-bounce" 
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5 text-amber-100" />
                <span>{this.state.isCorruptedState ? "⚠️ Hard Reset (Clear Invalid Cache)" : "Reset App State (Clear Cache)"}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
