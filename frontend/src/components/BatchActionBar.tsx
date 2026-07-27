interface BatchActionBarProps {
  selectedCount: number;
  maxCount?: number;
  tone: string;
  optimizing: boolean;
  error: string | null;
  onClear: () => void;
  onOptimize: () => void;
}

export function BatchActionBar({
  selectedCount,
  maxCount = 50,
  tone,
  optimizing,
  error,
  onClear,
  onOptimize,
}: BatchActionBarProps) {
  return (
    <div className="animate-slide-up sticky bottom-4 z-10 mt-4 rounded-lg border border-(--color-forge)/30 bg-(--color-paper)/95 p-4 shadow-md backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-(--color-ink)">
            {selectedCount} selected
            <span className="ml-2 font-normal text-(--color-muted)">
              · tone: <span className="capitalize">{tone}</span>
              {selectedCount >= maxCount && ` · max ${maxCount}`}
            </span>
          </p>
          {error && (
            <p className="mt-1 text-sm text-(--color-danger)" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={optimizing}
            className="rounded-md border border-(--color-ink)/20 px-3 py-1.5 text-sm font-medium text-(--color-ink) hover:bg-(--color-ink)/5 disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onOptimize}
            disabled={optimizing || selectedCount === 0}
            className="rounded-md bg-(--color-forge) px-3 py-1.5 text-sm font-medium text-(--color-paper) hover:bg-(--color-forge-hover) disabled:opacity-50"
          >
            {optimizing ? 'Queuing...' : 'Optimize selected'}
          </button>
        </div>
      </div>
    </div>
  );
}