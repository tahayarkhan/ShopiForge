type DiffPart = {
    type: 'equal' | 'removed' | 'added';
    text: string;
  };
  
  /** Split on spaces but keep tokens for display */
  function tokenize(text: string): string[] {
    return text.trim().length === 0 ? [] : text.trim().split(/\s+/);
  }
  
  /**
   * Greedy word diff: walk both token lists.
   * Not perfect LCS, but clear for short product titles.
   */
  export function diffWords(before: string, after: string): DiffPart[] {
    const a = tokenize(before);
    const b = tokenize(after);
    const parts: DiffPart[] = [];
    let i = 0;
    let j = 0;
  
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        parts.push({ type: 'equal', text: a[i]! });
        i += 1;
        j += 1;
        continue;
      }
  
      // Look ahead: is a[i] appearing later in b? then it's an insertion in after
      const aInB = i < a.length ? b.indexOf(a[i]!, j) : -1;
      const bInA = j < b.length ? a.indexOf(b[j]!, i) : -1;
  
      if (i < a.length && (j >= b.length || aInB === -1 || (bInA !== -1 && bInA <= aInB))) {
        parts.push({ type: 'removed', text: a[i]! });
        i += 1;
      } else if (j < b.length) {
        parts.push({ type: 'added', text: b[j]! });
        j += 1;
      }
    }
  
    return parts;
  }
  
  type DiffHighlightProps = {
    before: string;
    after: string;
    /** Which side are we rendering? */
    side: 'before' | 'after';
    className?: string;
  };
  
  export function DiffHighlight({
    before,
    after,
    side,
    className = '',
  }: DiffHighlightProps) {
    const parts = diffWords(before, after);
  
    const visible =
      side === 'before'
        ? parts.filter((p) => p.type !== 'added')
        : parts.filter((p) => p.type !== 'removed');
  
    return (
      <span className={className}>
        {visible.map((part, idx) => {
          if (part.type === 'equal') {
            return (
              <span key={idx}>
                {idx > 0 ? ' ' : ''}
                {part.text}
              </span>
            );
          }
  
          if (part.type === 'removed') {
            return (
              <span
                key={idx}
                className="mx-0.5 rounded bg-[var(--color-danger)]/15 px-0.5 text-[var(--color-danger)] line-through"
              >
                {idx > 0 ? ' ' : ''}
                {part.text}
              </span>
            );
          }
  
          // added
          return (
            <span
              key={idx}
              className="mx-0.5 rounded bg-[var(--color-mint)]/20 px-0.5 text-[var(--color-mint)]"
            >
              {idx > 0 ? ' ' : ''}
              {part.text}
            </span>
          );
        })}
      </span>
    );
  }