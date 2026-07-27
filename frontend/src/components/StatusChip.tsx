type StatusFamily = 'neutral' | 'active' | 'success' | 'danger' | 'warning';

function familyForStatus(status: string): StatusFamily {
  const s = status.toLowerCase();

  if (s === 'processing') return 'active';

  if (
    s === 'completed' ||
    s === 'pushed' ||
    s === 'active' // Shopify product ACTIVE
  ) {
    return 'success';
  }

  if (s === 'failed' || s === 'partial') return 'danger';

  if (s === 'usedfallback' || s === 'draft') return 'warning';

  // pending, skipped, and unknowns
  return 'neutral';
}

const familyStyles: Record<StatusFamily, string> = {
  neutral: 'bg-[var(--color-muted)]/15 text-[var(--color-muted)]',
  active:
    'animate-pulse-soft bg-[var(--color-forge)]/15 text-[var(--color-forge)]',
  success: 'bg-[var(--color-mint)]/15 text-[var(--color-mint)]',
  danger: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]',
  warning: 'bg-amber-500/15 text-amber-700',
};

type StatusChipProps = {
  status: string;
  /** Optional label override; defaults to the status string */
  label?: string;
  className?: string;
};

export function StatusChip({ status, label, className = '' }: StatusChipProps) {
  const family = familyForStatus(status);

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        familyStyles[family],
        className,
      ].join(' ')}
    >
      {label ?? status}
    </span>
  );
}