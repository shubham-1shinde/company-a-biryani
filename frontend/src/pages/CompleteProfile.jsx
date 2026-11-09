import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  User,
  MapPinned,
  Building2,
  Hash,
  ArrowRight,
  ShieldCheck,
  ChefHat,
  Loader2,
  LocateFixed,
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../redux/authSlice';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../lib/api';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    area: user?.address?.area || '',
    city: user?.address?.city || '',
    pincode: user?.address?.pincode || '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'pincode'
        ? value.replace(/\D/g, '').slice(0, 6)
        : value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              });
            },
            (error) => {
              reject(new Error('Please allow location access to continue'));
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            }
          );
        });
      };

      const coordinates = await getCurrentLocation();

      const payload = {
        name: formData.name.trim(),
        address: {
          area: formData.area.trim(),
          city: formData.city.trim(),
          pincode: formData.pincode.trim(),
          coordinates,
        },
      };
      console.log('Payload:', payload);

      const updatedUser = await dispatch(
        updateUserProfile(payload)
      ).unwrap();

      toast.success('Profile completed successfully!');

      navigate('/');
    } catch (error) {
      console.error('Profile update error:', error);

      toast.error(
        typeof error === 'string'
          ? error
          : error?.message || 'Failed to complete profile'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="px-4 py-10 sm:py-16">
        <div className="max-w-xl mx-auto">

          {/* Header */}
          <div className="text-center mb-8">

            <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-5">
              <MapPin size={30} className="text-brand-600" />
            </div>

            <span className="text-xs font-bold uppercase tracking-widest text-brand-600">
              One last step
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-2">
              Let's get to know you
            </h1>

            <p className="text-sm sm:text-base text-neutral-500 mt-3 max-w-md mx-auto leading-relaxed">
              Add your details and delivery location so we can
              find the nearest outlets that deliver to you.
            </p>
          </div>

          {/* Profile Form */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 sm:p-8">

            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                <User size={19} className="text-brand-600" />
              </div>

              <div>
                <h2 className="font-semibold text-neutral-900">
                  Your details
                </h2>
                <p className="text-xs text-neutral-500">
                  Tell us a little about yourself
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-700 mb-2"
                >
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                  />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={100}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                  />
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-3 border-t border-neutral-100">

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                    <MapPinned size={19} className="text-brand-600" />
                  </div>

                  <div>
                    <h2 className="font-semibold text-neutral-900">
                      Delivery location
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Where should we deliver your order?
                    </p>
                  </div>
                </div>

                {/* Area */}
                <div className="mb-5">
                  <label
                    htmlFor="area"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    Area / Locality
                  </label>

                  <div className="relative">
                    <MapPin
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                      id="area"
                      name="area"
                      type="text"
                      placeholder="e.g. Kondapur, Gachibowli"
                      value={formData.area}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="mb-5">
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    City
                  </label>

                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                      id="city"
                      name="city"
                      type="text"
                      placeholder="e.g. Hyderabad"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label
                    htmlFor="pincode"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    Pincode
                  </label>

                  <div className="relative">
                    <Hash
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
                    />

                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="Enter 6-digit pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      maxLength={6}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
                    />
                  </div>
                </div>

              </div>

              {/* Location Information */}
              <div className="rounded-xl bg-brand-50/70 border border-brand-100 p-4 flex gap-3">
                <LocateFixed
                  size={19}
                  className="text-brand-600 shrink-0 mt-0.5"
                />

                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    Find outlets near you
                  </p>

                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    We'll use your location to calculate delivery
                    availability and show nearby outlets first.
                  </p>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving your details...
                  </>
                ) : (
                  <>
                    Complete Profile
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

            </form>
          </div>

          {/* Privacy note */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-neutral-400">
            <ShieldCheck size={15} />
            <span>Your location details are kept secure.</span>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-5">
            © 2026 Company A Biryani
          </p>

        </div>
      </main>
    </div>
  );
}
