import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PlayerRole } from '../../types/auth.types';
import { useActiveSeason } from '../../hooks/useActiveSeason';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { activeSeason } = useActiveSeason();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('nav')) {
        setIsMobileMenuOpen(false);
      }
      if (isProfileDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, isProfileDropdownOpen]);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = async () => {
    await logout();
    setIsProfileDropdownOpen(false);
    navigate('/');
  };

  const isAdmin = user?.role === PlayerRole.ADMIN;

  const navLinks = [
    { path: '/', label: 'Ana Sayfa', icon: '🏠' },
    { path: '/matches', label: 'Maçlar', icon: '🏀' },
    { path: '/players', label: 'Oyuncular', icon: '👥' },
    { path: '/statistics', label: 'İstatistikler', icon: '📊' },
  ];

  if (isAdmin) {
    navLinks.push({ path: '/admin', label: 'Admin Panel', icon: '⚙️' });
  }

  return (
    <nav className="sticky top-0 z-50 h-[150px] bg-black border-b-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.3)] relative flex
      flex-row items-center
    ">
      
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(249,115,22,0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249,115,22,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      <div className="h-[2px] absolute top-40 z-500 bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_15px_rgba(249,115,22,0.8)]"></div>

      <div className="container mx-auto px-4 relative">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/"
            className="flex items-center space-x-3 group relative"
          >
            <div className="relative ">
              <div className="absolute inset-0 bg-orange-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative w-24 h-24 flex items-center justify-center rounded-lg border-2 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.9)] transition-all group-hover:scale-110 overflow-hidden bg-black/50">
                <img
                  src="/img/enballerz-logo-2.png"
                  alt="enBallerZ Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-orange-400"></div>
              <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-orange-400"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-orange-400"></div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-orange-400"></div>
            </div>

            <div className="flex flex-col items-center text-center">
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 tracking-wider group-hover:tracking-widest transition-all [text-shadow:0_0_20px_rgba(249,115,22,0.5)]">
                ENBALLERZ
              </span>
              <div className="flex items-center space-x-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-orange-500 to-transparent"></div>
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em]">
                  {activeSeason ? `Sezon ${activeSeason.name}` : 'Sezon 2025-2026'}
                </span>
                <div className="h-[1px] w-8 bg-gradient-to-l from-orange-500 to-transparent"></div>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative group"
              >
                <div className={`relative px-6 py-2 font-semibold transition-all duration-300 overflow-hidden ${
                  isActive(link.path)
                    ? 'text-orange-400'
                    : 'text-gray-400 hover:text-orange-400'
                }`}>
                  <div className={`absolute inset-0 border border-orange-500/30 transition-all duration-300 ${
                    isActive(link.path) ? 'border-orange-500' : 'group-hover:border-orange-500/50'
                  }`} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                  </div>

                  {isActive(link.path) && (
                    <div className="absolute inset-0 bg-orange-500/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.3)]"></div>
                  )}

                  <span className="relative flex items-center space-x-2 z-10">
                    <span className="text-base">{link.icon}</span>
                    <span className="text-sm uppercase tracking-wider">{link.label}</span>
                  </span>

                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>

                {isActive(link.path) && (
                  <div className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-3 px-4 py-2 border border-orange-500/40 hover:border-orange-500 transition-all duration-300 bg-black/50 group relative overflow-hidden"
                  style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/10 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="relative w-9 h-9 clip-hexagon bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(249,115,22,0.5)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.8)] transition-all z-10">
                    {user.nickname?.charAt(0).toUpperCase()}
                  </div>

                  <div className="text-left z-10">
                    <div className="text-xs font-bold text-orange-400">{user.nickname}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role}</div>
                  </div>

                  <svg
                    className={`w-3 h-3 text-orange-400 transition-transform z-10 ${
                      isProfileDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>

                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-gray-900 border-2 border-orange-500/50 shadow-[0_0_30px_rgba(249,115,22,0.4)] z-50 animate-slideDown" style={{ clipPath: 'polygon(0 12px, 12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}>
                    <div className="p-1">
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-orange-500/10 transition-colors group relative"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">👤</span>
                        <span className="text-gray-300 font-medium text-sm">Profilim</span>
                        <div className="absolute right-2 w-1 h-4 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </Link>
                      <Link
                        to="/change-password"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-orange-500/10 transition-colors group relative"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">🔐</span>
                        <span className="text-gray-300 font-medium text-sm">Şifre Değiştir</span>
                        <div className="absolute right-2 w-1 h-4 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </Link>
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-red-500/10 transition-colors w-full text-left group relative"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
                        <span className="text-red-400 font-medium text-sm">Çıkış Yap</span>
                        <div className="absolute right-2 w-1 h-4 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="relative flex items-center space-x-2 px-6 py-2.5 border-2 border-orange-500 bg-black hover:bg-orange-500/10 font-bold transition-all duration-300 group overflow-hidden"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                <span className="text-lg relative z-10">🔓</span>
                <span className="text-orange-400 text-sm uppercase tracking-wider relative z-10">Giriş Yap</span>

                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange-300"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-orange-300"></div>
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative w-12 h-12 border-2 border-orange-500/50 hover:border-orange-500 bg-black transition-all group"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="space-y-1.5">
                <span className={`block w-5 h-[2px] bg-orange-400 transition-all shadow-[0_0_5px_rgba(249,115,22,0.8)] ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
                <span className={`block w-5 h-[2px] bg-orange-400 transition-all shadow-[0_0_5px_rgba(249,115,22,0.8)] ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block w-5 h-[2px] bg-orange-400 transition-all shadow-[0_0_5px_rgba(249,115,22,0.8)] ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
              </div>
            </div>
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 mt-4 animate-slideDown bg-black/95 backdrop-blur-md border-t border-orange-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] -mx-4 px-4 pt-4">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 border border-orange-500/30 transition-all relative group ${
                    isActive(link.path)
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                      : 'text-gray-400 hover:bg-orange-500/5 hover:border-orange-500/50'
                  }`}
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-semibold text-sm uppercase tracking-wider">{link.label}</span>
                  {isActive(link.path) && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                  )}
                </Link>
              ))}

              <div className="h-[1px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent my-3"></div>

              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 border border-orange-500/30 text-gray-400 hover:bg-orange-500/5 hover:border-orange-500/50 transition-all"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    <span className="text-lg">👤</span>
                    <span className="font-semibold text-sm uppercase tracking-wider">Profilim</span>
                  </Link>
                  <Link
                    to="/change-password"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 border border-orange-500/30 text-gray-400 hover:bg-orange-500/5 hover:border-orange-500/50 transition-all"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    <span className="text-lg">🔐</span>
                    <span className="font-semibold text-sm uppercase tracking-wider">Şifre Değiştir</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 border-2 border-red-500/50 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500 transition-all w-full"
                    style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                  >
                    <span className="text-lg">🚪</span>
                    <span className="font-semibold text-sm uppercase tracking-wider">Çıkış Yap</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 border-2 border-orange-500 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all font-bold"
                  style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                >
                  <span className="text-lg">🔓</span>
                  <span className="text-sm uppercase tracking-wider">Giriş Yap</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
    </nav>
  );
};
