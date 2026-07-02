import type { ProductInputSnapshot } from '../types';

interface ComparePanelProps {
  before: ProductInputSnapshot;
  after: ProductInputSnapshot & {
    bulletPoints?: string[];
    seoKeywords?: string[];
  };
}

export function ComparePanel({ before, after }: ComparePanelProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Before
        </h2>
        <p className="font-medium">{before.title}</p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          After
        </h2>
        <p className="font-medium">{after.title}</p>
      </section>
    </div>
  );
}