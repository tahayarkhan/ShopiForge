interface BatchActionBarProps {
    selectedCount: number;
    maxCount?: number;
    optimizing: boolean;
    error: string | null;
    onClear: () => void;
    onOptimize: () => void;
}

export function BatchActionBar({
    selectedCount,
    maxCount = 50,
    optimizing,
    error,
    onClear,
    onOptimize,
  }: BatchActionBarProps) {
    return (
      <div className="sticky top-0 z-10 mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {selectedCount} selected
              {selectedCount >= maxCount && (
                <span className="ml-2 text-slate-500">(max {maxCount})</span>
              )}
            </p>
            {error && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              disabled={optimizing}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onOptimize}
              disabled={optimizing || selectedCount === 0}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {optimizing ? 'Queuing...' : 'Optimize selected'}
            </button>
          </div>
        </div>
      </div>
    );
}
  