
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChefHat,
  ArrowRight,
  Lock,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithTokens } from '../../redux/authSlice';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function KitchenLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData: user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'kitchen') {
      navigate('/kitchen', { replace: true });
    } else if (user?.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    } else if (user?.role === 'catering_manager') {
      navigate('/catering/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.post('/auth/admin/login', {
        email,
        password,
      });

      console.log('Login API response:', data);
      console.log('Logged-in user:', data.user);
      console.log('Outlet:', data.user?.outlet);

      if (data.success) {
        await dispatch(
          loginWithTokens({
            userData: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          })
        ).unwrap();

        toast.success('Login successful!');

        if (data.user?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else if (data.user?.role === 'kitchen') {
          navigate('/kitchen', { replace: true });
        } else if (data.user?.role === 'catering_manager') {
          navigate('/catering/dashboard', { replace: true });
        }
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-neutral-100 font-sans antialiased flex flex-col justify-between px-4 py-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E85D35]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Customer Site</span>
        </Link>

        <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded">
          KDS Portal
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto z-10 my-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-[#E85D35] rounded-sm flex items-center justify-center text-white shadow-lg shadow-orange-950/40 mb-4">
            <ChefHat size={24} />
          </div>

          <h1 className="text-3xl font-serif text-white tracking-tight">
            Kitchen Display
          </h1>

          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mt-1.5">
            Outlet Staff & Operations Access
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-md p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kitchen.outlet@company-a-biryani.in"
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-sm pl-10 pr-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35] transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 block mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900/90 border border-neutral-800 rounded-sm pl-10 pr-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35] transition-all font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all duration-200 shadow-md shadow-orange-950/50 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In To KDS</span>
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center z-10">
        <p className="text-[11px] font-mono text-neutral-400">
          © 2026 Company A Biryani · Internal Operations
        </p>
      </div>
    </div>
  );
}
