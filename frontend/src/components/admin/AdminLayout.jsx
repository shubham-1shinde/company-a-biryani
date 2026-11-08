
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Utensils,
  ShoppingBag,
  Users,
  Store,
  LogOut,
  ChefHat,
  Menu,
  X,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import { logoutUser } from '../../redux/authSlice';

const navigation = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Menu Management', path: '/admin/menu', icon: Utensils },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
  { name: 'Repeat Customers', path: '/admin/customers', icon: Users },
  { name: 'Outlets', path: '/admin/outlets', icon: Store },
  { name: 'Party Orders', path: '/admin/party-orders', icon: CalendarDays },
];

export default function AdminLayout({ children, title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.userData);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    dispatch(logoutUser());
    navigate('/kitchen/login');
  };

  const Sidebar = () => (
    <div className="h-full flex flex-col bg-white">
      <div className="p-5 border-b border-neutral-200 flex items-center gap-3">
        <div className="w-9 h-9 bg-[#E85D35] rounded-sm flex items-center justify-center text-white">
          <ChefHat size={20} />
        </div>
        <div>
          <h1 className="font-serif text-lg">Company A</h1>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">
            Administration
          </p>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        <p className="px-3 py-3 text-[10px] uppercase tracking-widest text-neutral-400 font-mono">
          Management
        </p>

        {navigation.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 text-sm rounded-sm transition-colors ${
                isActive
                  ? 'bg-[#E85D35]/10 text-[#E85D35] font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`
            }
          >
            <Icon size={17} />
            {name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-neutral-200">
        <p className="text-xs font-medium text-neutral-800 truncate mb-3">
          {user?.name || user?.email}
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-red-600"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r border-neutral-200 shrink-0">
        <div className="fixed w-64 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 h-full shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10"
            >
              <X size={20} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-neutral-600"
          >
            <Menu size={21} />
          </button>
          <h2 className="font-serif text-lg">{title}</h2>
          <span className="ml-auto text-xs font-mono text-neutral-400">
            ADMIN PANEL
          </span>
        </header>

        <main className="max-w-7xl mx-auto px-5 sm:px-7 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
