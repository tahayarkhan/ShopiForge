export type ToastVariant = 'success' | 'error' | 'info';

export type ToastMessage = {
  id: string;
  message: string;
  variant: ToastVariant;
};

const variantStyles: Record<ToastVariant, string> = {
  success:
    'border-(--color-mint)/30 bg-(--color-mint)/10 text-(--color-mint)',
  error:
    'border-(--color-danger)/30 bg-(--color-danger)/10 text-(--color-danger)',
  info:
    'border-(--color-ink)/15 bg-(--color-ink)/5 text-(--color-ink)',
};

type ToastProps = {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
};

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      role="status"
      className={[
        'animate-slide-up pointer-events-auto flex min-w-240px max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-sm',
        variantStyles[toast.variant],
      ].join(' ')}
    >
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

type ToastViewportProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

/** Fixed corner stack — host this in AppLayout */
export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}