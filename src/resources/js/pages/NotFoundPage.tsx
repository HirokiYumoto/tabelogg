import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">ページが見つかりません</h2>
      <p className="text-gray-500 mb-8 text-center">
        お探しのページは存在しないか、移動した可能性があります。
      </p>
      <Link
        to="/"
        className="rounded-md bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        トップページに戻る
      </Link>
    </div>
  );
}
