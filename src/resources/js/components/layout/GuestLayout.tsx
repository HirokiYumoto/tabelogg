import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

export default function GuestLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4">
      <Link to="/" className="font-bold text-orange-500 mb-8 flex items-center gap-2">
        <span className="text-4xl">🍜</span>
        <span className="text-3xl tracking-tighter">tabelogg</span>
      </Link>
      <div className="w-full max-w-md bg-white shadow-md rounded-lg p-8">
        <Outlet />
      </div>
    </div>
  );
}
