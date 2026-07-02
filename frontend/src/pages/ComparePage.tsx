import { Link, useParams } from 'react-router-dom';

export function ComparePage() {
  const { id } = useParams();

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        ← Back to dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Compare Product</h1>
      <p className="mt-2 text-slate-600">
        Static before/after for product <span className="font-mono">{id}</span> comes in Step 8.
      </p>
    </div>
  );
}