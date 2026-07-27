import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
  } from 'react';
  import { ToastViewport, type ToastMessage, type ToastVariant } from './Toast';
  
  type ToastApi = {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  
  const ToastContext = createContext<ToastApi | null>(null);
  
  const DISMISS_MS = 3500;
  
  export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
    const dismiss = useCallback((id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
  
    const push = useCallback(
      (variant: ToastVariant, message: string) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, variant }]);
        window.setTimeout(() => dismiss(id), DISMISS_MS);
      },
      [dismiss],
    );
  
    const api = useMemo<ToastApi>(
      () => ({
        success: (message) => push('success', message),
        error: (message) => push('error', message),
        info: (message) => push('info', message),
      }),
      [push],
    );
  
    return (
      <ToastContext.Provider value={api}>
        {children}
        <ToastViewport toasts={toasts} onDismiss={dismiss} />
      </ToastContext.Provider>
    );
  }
  
  /** Call from any child of ToastProvider */
  export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) {
      throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
  }