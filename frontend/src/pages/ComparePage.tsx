import { Link, useParams } from 'react-router-dom';
import { ComparePanel } from '../components/ComparePanel';
import { getCompareData } from '../mocks/products';

export function ComparePage() {
  const { id } = useParams();
  const compareData = id ? getCompareData(id) : undefined;

  if (!compareData) {
    return (
      <div>
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          Back to dashboard
        </Link>

        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-slate-900">Product not found</h1>
          <p className="mt-2 text-slate-600">
            No mock compare data exists for this product.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
        Back to dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Compare</h1>
          <p className="mt-1 text-slate-600">
            Review the original listing beside the simulated optimized version.
          </p>
        </div>

        <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          Preview - AI optimization simulated
        </span>
      </div>

      <div className="mt-6">
        <ComparePanel compareData={compareData} />
      </div>
    </div>
  );
}