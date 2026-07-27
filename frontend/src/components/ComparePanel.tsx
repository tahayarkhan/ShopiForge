import type { CompareData } from '../types';
import { DiffHighlight } from './DiffHighlight';
import { sanitizeHtml } from '../lib/sanitizeHtml';


interface ComparePanelProps {
  compareData: CompareData;
}

function HtmlPane({ html, label }: { html: string; label: string }) {
  const clean = sanitizeHtml(html || '');
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </p>
      <div
        className="max-h-80 max-w-none overflow-y-auto rounded-md border border-[var(--color-ink)]/10 bg-[var(--color-paper)] p-3 text-sm leading-6 text-[var(--color-ink)]"
        dangerouslySetInnerHTML={{ __html: clean }}
      />
    </div>
  );
}


function classifyTags(beforeTags: string[], afterTags: string[]) {
  const beforeSet = new Set(beforeTags);
  const afterSet = new Set(afterTags);
  const removed = beforeTags.filter((t) => !afterSet.has(t));
  const added = afterTags.filter((t) => !beforeSet.has(t));
  const shared = beforeTags.filter((t) => afterSet.has(t));
  return { removed, added, shared };
}


function TagChip({
  tag,
  kind,
}: {
  tag: string;
  kind: 'removed' | 'added' | 'shared';
}) {
  const styles = {
    removed:
      'bg-[var(--color-danger)]/10 text-[var(--color-danger)] line-through',
    added: 'bg-[var(--color-mint)]/15 text-[var(--color-mint)]',
    shared: 'bg-[var(--color-ink)]/5 text-[var(--color-muted)]',
  }[kind];

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {tag}
    </span>
  );
}



export function ComparePanel({ compareData }: ComparePanelProps) {
  const { before, after } = compareData;
  const { removed, added, shared } = classifyTags(before.tags, after.tags);


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Before
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              <DiffHighlight before={before.title} after={after.title} side="before" />
            </h3>
            <HtmlPane html={before.descriptionHtml} label="Description" />
          </div>

          <div className="flex flex-wrap gap-2">
            {removed.map((t) => (
              <TagChip key={`r-${t}`} tag={t} kind="removed" />
            ))}
            {shared.map((t) => (
              <TagChip key={`s-${t}`} tag={t} kind="shared" />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-600">
          After
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              <DiffHighlight before={before.title} after={after.title} side="after" />
            </h3>
            <HtmlPane html={after.descriptionHtml} label="Description" />
          </div>

          <div className="flex flex-wrap gap-2">
            {shared.map((t) => (
              <TagChip key={`s-${t}`} tag={t} kind="shared" />
            ))}
            {added.map((t) => (
              <TagChip key={`a-${t}`} tag={t} kind="added" />
            ))}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[var(--color-ink)]">
              Bullet points ({after.bulletPoints.length})
            </h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-ink)]">
              {after.bulletPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {after.bulletPoints.length === 0 && (
              <p className="mt-2 text-sm text-[var(--color-muted)]">None</p>
            )}
          </div>

          
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-ink)]">
              SEO keywords ({after.seoKeywords.length})
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {after.seoKeywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-[var(--color-forge)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-forge)]"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}