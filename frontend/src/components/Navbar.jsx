import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, ChefHat, Sparkles, LogOut, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/authSlice';
import { selectTotalItems } from '../redux/cartSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);
  const totalItems = useSelector(selectTotalItems);

  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    dispatch(logoutUser());
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 font-sans antialiased">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#E85D35] rounded-sm flex items-center justify-center text-white shadow-sm group-hover:bg-[#d44c25] transition-colors">
              <ChefHat size={18} />
            </div>

            <span className="font-serif text-lg font-medium text-neutral-900 tracking-tight">
              Company A Biryani
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-2">

            {user?.role === 'admin' && (
              <Link
                to="/admin/menu"
                className="text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-sm hover:bg-neutral-50 transition-colors"
              >
                Menu CMS
              </Link>
            )}

            {user?.role === 'kitchen' && (
              <Link
                to="/kitchen"
                className="text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-sm hover:bg-neutral-50 transition-colors"
              >
                Kitchen Display
              </Link>
            )}

            {user?.role === 'catering_manager' && (
              <Link
                to="/catering/dashboard"
                className="text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-sm hover:bg-neutral-50 transition-colors"
              >
                Catering Dashboard
              </Link>
            )}

            {user?.role === 'customer' && (
              <Link
                to="/orders"
                className="text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-sm hover:bg-neutral-50 transition-colors"
              >
                My Orders
              </Link>
            )}

            {user?.role === 'customer' && (
              <Link
                to="/party-order"
                className="text-xs font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-900 px-3 py-2 rounded-sm hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
              >
                <PartyPopper size={13} className="text-[#E85D35]" />
                Party Order
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">

            <Link
              to="/cart"
              className="relative p-2 text-neutral-700 hover:text-neutral-900 transition-colors rounded-sm hover:bg-neutral-50"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={20} />

              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#E85D35] text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-xs">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative group hidden md:block">
                <button className="flex items-center gap-2 p-2 text-neutral-700 hover:text-neutral-900 rounded-sm hover:bg-neutral-50 transition-colors">
                  <User size={18} />

                  <span className="text-xs font-mono max-w-[120px] truncate">
                    {user.name || user.mobile}
                  </span>
                </button>

                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-neutral-200 rounded-sm shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">

                  <div className="p-3.5 border-b border-neutral-100 bg-neutral-50/50">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <Sparkles size={11} className="text-[#E85D35]" />
                      Loyalty Points
                    </p>

                    <p className="font-mono font-bold text-[#E85D35] text-sm mt-0.5">
                      {user.loyaltyPoints || 0} pts
                    </p>
                  </div>

                  {user.role === 'customer' && (
                    <Link
                      to="/orders"
                      className="block px-3.5 py-2.5 text-xs font-mono text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border-b border-neutral-100 transition-colors"
                    >
                      My Orders History
                    </Link>
                  )}

                  {user.role === 'customer' && (
                    <Link
                      to="/party-orders"
                      className="block px-3.5 py-2.5 text-xs font-mono text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 border-b border-neutral-100 transition-colors"
                    >
                      My Party Orders
                    </Link>
                  )}

                  <button
                    onClick={logout}
                    className="w-full text-left px-3.5 py-2.5 text-xs font-mono text-red-600 hover:bg-red-50 flex items-center justify-between transition-colors"
                  >
                    <span>Sign Out</span>
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex bg-[#E85D35] hover:bg-[#d44c25] text-white px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-colors shadow-xs"
              >
                Sign In
              </Link>
            )}

            <button
              className="md:hidden p-2 text-neutral-700 hover:text-neutral-900"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-neutral-200/80 bg-white px-6 py-4 space-y-3 font-mono text-xs">

          {user && (
            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-sm mb-2 flex justify-between items-center">
              <div>
                <p className="text-neutral-900 font-medium truncate max-w-[180px]">
                  {user.name || user.mobile}
                </p>

                <p className="text-[10px] text-neutral-400">
                  Points:{' '}
                  <strong className="text-[#E85D35]">
                    {user.loyaltyPoints || 0} pts
                  </strong>
                </p>
              </div>
            </div>
          )}

          {user?.role === 'customer' && (
            <Link
              to="/orders"
              className="block py-2 text-neutral-700 hover:text-neutral-900 uppercase tracking-wider"
              onClick={() => setMenuOpen(false)}
            >
              My Orders
            </Link>
          )}

          {user?.role === 'customer' && (
            <Link
              to="/party-order"
              className="flex items-center gap-2 py-2 text-neutral-700 hover:text-neutral-900 uppercase tracking-wider"
              onClick={() => setMenuOpen(false)}
            >
              <PartyPopper size={14} className="text-[#E85D35]" /> Party Order
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin/menu"
              className="block py-2 text-neutral-700 hover:text-neutral-900 uppercase tracking-wider"
              onClick={() => setMenuOpen(false)}
            >
              Menu CMS
            </Link>
          )}

          {user?.role === 'kitchen' && (
            <Link
              to="/kitchen"
              className="block py-2 text-neutral-700 hover:text-neutral-900 uppercase tracking-wider"
              onClick={() => setMenuOpen(false)}
            >
              Kitchen Display
            </Link>
          )}

          {user?.role === 'catering_manager' && (
            <Link
              to="/catering/dashboard"
              className="block py-2 text-neutral-700 hover:text-neutral-900 uppercase tracking-wider"
              onClick={() => setMenuOpen(false)}
            >
              Catering Dashboard
            </Link>
          )}

          {user ? (
            <button
              onClick={logout}
              className="w-full text-left py-2 text-red-600 font-semibold uppercase tracking-wider border-t border-neutral-100 pt-3"
            >
              Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="w-full bg-[#E85D35] text-white py-3 rounded-sm flex items-center justify-center uppercase tracking-wider font-semibold shadow-xs"
              onClick={() => setMenuOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
