import type { CompareData } from '../types';

interface ComparePanelProps {
  compareData: CompareData;
}

function plainTextFromHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function ComparePanel({ compareData }: ComparePanelProps) {
  const { before, after } = compareData;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Before
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{before.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {plainTextFromHtml(before.descriptionHtml)}
            </p>
          </div>

          <TagList tags={before.tags} />
        </div>
      </section>

      <section className="rounded-lg border border-blue-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-blue-600">
          After
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{after.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {plainTextFromHtml(after.descriptionHtml)}
            </p>
          </div>

          <TagList tags={after.tags} />

          <div>
            <h4 className="text-sm font-semibold text-slate-900">Bullet points</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {after.bulletPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900">SEO keywords</h4>
            <TagList tags={after.seoKeywords} />
          </div>
        </div>
      </section>
    </div>
  );
}