import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone,
  ArrowRight,
  ChefHat,
  RotateCcw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginWithTokens } from '../redux/authSlice';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userData: user } = useSelector(
    (state) => state.auth
  );

  const [step, setStep] = useState('mobile'); // mobile | otp
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devOtp, setDevOtp] = useState(null);

  // Redirect already authenticated users
  useEffect(() => {
    if (!user) return;

    navigate(
      user.role === 'kitchen'
        ? '/kitchen'
        : user.role === 'admin'
        ? '/admin/menu'
        : user.isProfileComplete === false
        ? '/complete-profile'
        : '/',
      { replace: true }
    );
  }, [user, navigate]);

  // OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const startCooldown = (seconds = 60) => {
    setCooldown(seconds);
  };

  // Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/send-otp', {
        mobile,
      });

      if (data.success) {
        toast.success('OTP sent!');
        setStep('otp');
        startCooldown(60);

        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to send OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP and login
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/verify-otp', {
        mobile,
        otp,
        name: name.trim() || undefined,
      });

      if (!data.success) return;

      // Save authentication data in Redux
      await dispatch(
        loginWithTokens({
          userData: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      ).unwrap();

      toast.success(
        data.isNewUser
          ? 'Welcome to Company A!'
          : 'Welcome back!'
      );

      // Profile onboarding check
      if (
        data.user.role === 'customer' &&
        data.requiresProfileSetup
      ) {
        navigate('/complete-profile', { replace: true });
        return;
      }

      // Role-based navigation
      navigate(
        data.user.role === 'kitchen'
          ? '/kitchen'
          : data.user.role === 'admin'
          ? '/admin/menu'
          : '/',
        { replace: true }
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Invalid OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't render login page for authenticated users
  if (user) return null;


  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      const { data } = await api.post('/auth/send-otp', { mobile });
      if (data.success) {
        toast.success('OTP resent!');
        startCooldown(60);
        if (data.dev_otp) setDevOtp(data.dev_otp);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-5 border-b border-neutral-200/80 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#E85D35] rounded-sm flex items-center justify-center text-white shadow-sm">
              <ChefHat size={18} />
            </div>
            <span className="font-serif text-lg font-medium text-neutral-900">Company A Biryani</span>
          </Link>
          
          <Link 
            to="/kitchen/login" 
            className="text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:inline"
          >
            Staff Portal →
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {step === 'mobile' ? (
            <div className="bg-white border border-neutral-200/90 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 bg-neutral-100 border border-neutral-200 px-2.5 py-1 rounded inline-block mb-3">
                  Direct Kitchen Ordering
                </span>
                <h1 className="text-3xl font-serif text-neutral-900">Sign in</h1>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  We'll send a one-time verification code to your mobile.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block mb-2">
                    Mobile Number
                  </label>
                  <div className="flex rounded-sm shadow-xs">
                    <span className="flex items-center px-3.5 border border-r-0 border-neutral-300 rounded-l-sm bg-neutral-50 text-neutral-600 font-mono text-xs font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white border border-neutral-300 rounded-r-sm px-4 py-3 text-sm font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35] transition-all"
                      maxLength={10}
                      autoFocus
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 group"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-neutral-100 text-center">
                <p className="text-xs font-mono text-neutral-500">
                  Kitchen staff or admin?{' '}
                  <Link to="/kitchen/login" className="text-[#E85D35] font-semibold hover:underline">
                    Staff Login →
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200/90 rounded-sm p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded inline-block mb-3">
                  OTP Sent
                </span>
                <h1 className="text-3xl font-serif text-neutral-900">Enter OTP</h1>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  Sent to <strong className="text-neutral-800">+91 {mobile}</strong>
                </p>
              </div>

              {devOtp && (
                <div className="bg-amber-50 border border-amber-200 rounded-sm p-3.5 mb-5 text-xs font-mono text-amber-900">
                  <span className="font-bold">Demo Account OTP: </span>
                  <span className="font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    {devOtp}
                  </span>
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-neutral-600 block mb-2">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-white border border-neutral-300 rounded-sm px-4 py-3 text-center text-xl tracking-[0.5em] font-mono font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35] transition-all"
                    maxLength={6}
                    autoFocus
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Verify & Continue</span>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs font-mono pt-2">
                  <button 
                    type="button" 
                    onClick={() => setStep('mobile')} 
                    className="text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    ← Change number
                  </button>
                  <button 
                    type="button" 
                    onClick={handleResend} 
                    disabled={cooldown > 0} 
                    className="text-[#E85D35] hover:text-[#d44c25] disabled:text-neutral-400 font-medium flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={13} />
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center">
        <p className="text-[11px] font-mono text-neutral-400">
          © 2026 Company A Biryani · Direct Dum Dispatch
        </p>
      </footer>
    </div>
  );
}