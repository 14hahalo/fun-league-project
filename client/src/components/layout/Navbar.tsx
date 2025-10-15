import { Link, useLocation } from 'react-router-dom';

export const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-orange-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold">
            🏀 Basketball League
          </Link>
          
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-orange-700' 
                  : 'hover:bg-orange-500'
              }`}
            >
              Ana Sayfa
            </Link>
            <Link
              to="/admin"
              className={`px-4 py-2 rounded-lg transition-colors ${
                isActive('/admin') 
                  ? 'bg-orange-700' 
                  : 'hover:bg-orange-500'
              }`}
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};