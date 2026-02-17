import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePrefectures } from '@/hooks/useRestaurants';

export default function SiteHeader() {
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: prefectures } = usePrefectures();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [prefectureId, setPrefectureId] = useState(searchParams.get('prefecture_id') || '');

  // Sync state when URL params change externally
  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '');
    setPrefectureId(searchParams.get('prefecture_id') || '');
  }, [searchParams]);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (prefectureId) params.set('prefecture_id', prefectureId);
    navigate(`/?${params.toString()}`);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between gap-2 sm:gap-4">

        {/* Logo */}
        <div className="flex-shrink-0">
          <Link
            to="/"
            className="font-bold text-2xl text-orange-500 tracking-tighter flex items-center gap-2"
          >
            <span className="text-3xl">🍜</span>
            <span className="hidden lg:inline">tabelogg</span>
          </Link>
        </div>

        {/* Search bar */}
        <div className="flex flex-grow max-w-2xl mx-2 sm:mx-4">
          <form
            onSubmit={handleSearch}
            className="w-full flex rounded-md shadow-sm border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 bg-gray-50"
          >
            {/* Prefecture select */}
            <div className="relative w-24 sm:w-32 flex-shrink-0 border-r border-gray-200">
              <select
                value={prefectureId}
                onChange={(e) => setPrefectureId(e.target.value)}
                className="w-full h-full py-2 pl-2 sm:pl-3 pr-6 sm:pr-8 text-xs sm:text-sm bg-transparent border-none focus:ring-0 text-gray-700 cursor-pointer truncate"
              >
                <option value="">エリア</option>
                {prefectures?.map((pref) => (
                  <option key={pref.id} value={pref.id}>
                    {pref.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword input */}
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="店名など"
              className="flex-grow py-2 px-2 sm:px-4 text-xs sm:text-sm border-none focus:ring-0 text-gray-700 placeholder-gray-400 min-w-0"
            />

            {/* Search button */}
            <button
              type="submit"
              className="bg-orange-100 hover:bg-orange-200 text-orange-600 px-3 sm:px-4 flex items-center justify-center transition border-l border-gray-200 flex-shrink-0"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Auth section - Desktop */}
        <div className="flex-shrink-0 hidden sm:flex items-center space-x-2 sm:space-x-4">
          {user ? (
            <div className="flex items-center gap-3">
              {/* User name (PC only) */}
              <span className="text-sm font-bold text-gray-700 hidden lg:inline truncate max-w-[100px]">
                {user.name}さん
              </span>

              {/* Admin dashboard button (admin only) */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-1.5 rounded-full transition duration-300 shadow-sm border border-red-200 hover:border-red-300"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap">管理者</span>
                </Link>
              )}

              {/* My page link */}
              <Link
                to="/mypage"
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-600 px-3 py-1.5 rounded-full transition duration-300 shadow-sm border border-gray-200 hover:border-orange-200"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-xs sm:text-sm font-bold whitespace-nowrap">マイページ</span>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-gray-400 hover:text-red-500 font-bold transition whitespace-nowrap pt-1"
              >
                ログアウト
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs sm:text-sm text-gray-600 hover:text-orange-500 font-bold transition whitespace-nowrap"
              >
                ログイン
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-full transition shadow-md whitespace-nowrap"
              >
                登録
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden flex-shrink-0 text-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 shadow-lg px-4 pb-4 pt-2 space-y-2">
          {user ? (
            <>
              <div className="text-sm font-bold text-gray-700 py-2 border-b border-gray-100">
                {user.name}さん
              </div>
              <Link
                to="/mypage"
                className="block py-2 text-sm text-gray-700 hover:text-orange-500 font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                マイページ
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="block py-2 text-sm text-red-600 hover:text-red-700 font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  管理者ダッシュボード
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 text-sm text-gray-400 hover:text-red-500 font-bold"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block py-2 text-sm text-gray-600 hover:text-orange-500 font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                ログイン
              </Link>
              <Link
                to="/register"
                className="block py-2 text-sm text-orange-500 hover:text-orange-600 font-bold"
                onClick={() => setMobileMenuOpen(false)}
              >
                登録
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
