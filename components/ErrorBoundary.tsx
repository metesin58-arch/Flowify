
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-dvh w-screen bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-white uppercase tracking-widest mb-4">Bir Hata Oluştu</h1>
          <p className="text-xs text-neutral-400 mb-8 max-w-xs leading-relaxed">
            Uygulama beklenmedik bir hata ile karşılaştı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:scale-105 active:scale-95 transition-all"
          >
            YENİLE
          </button>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-red-900/20 border border-red-900/30 rounded-xl text-left w-full max-w-md overflow-auto">
                <p className="text-[10px] font-mono text-red-400 whitespace-pre-wrap">
                    {this.state.error?.toString()}
                </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
