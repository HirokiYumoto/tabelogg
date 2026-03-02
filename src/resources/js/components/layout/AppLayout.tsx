import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-20">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
