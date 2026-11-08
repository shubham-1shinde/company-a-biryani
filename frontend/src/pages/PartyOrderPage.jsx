import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Calendar, Users, Utensils, MapPin, ChevronRight, ChevronLeft,
  Plus, Minus, CheckCircle, AlertCircle, PartyPopper, Info,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { Spinner, formatPrice } from '../components/ui';
import api from '../lib/api';
import toast from 'react-hot-toast';

const EVENT_TYPES = ['Birthday', 'Wedding', 'Corporate Event', 'Anniversary', 'Other'];
const FOOD_PREFS = ['Veg', 'Non-Veg', 'Both'];
const STEPS = ['Event Details', 'Select Outlet', 'Food Selection', 'Contact & Delivery', 'Review & Submit'];

// 48 hours in ms
const MIN_ADVANCE_MS = 48 * 60 * 60 * 1000;

function getMinEventDateTime() {
  return new Date(Date.now() + MIN_ADVANCE_MS);
}

function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function PartyOrderPage() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.userData);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // partyOrderId after success

  // Step 1: Event Details
  const [eventType, setEventType] = useState('');
  const [eventDateTime, setEventDateTime] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [foodPreference, setFoodPreference] = useState('');

  // Step 2: Outlet
  const [outlets, setOutlets] = useState([]);
  const [outletLoading, setOutletLoading] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  // Step 3: Food items
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({}); // { itemId: { item, quantity } }

  // Step 4: Contact & Delivery
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [contactNumber, setContactNumber] = useState(user?.mobile || '');
  const [street, setStreet] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('Hyderabad');
  const [pincode, setPincode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');

  // Load outlets on step 2
  useEffect(() => {
    if (step === 1 && outlets.length === 0) {
      setOutletLoading(true);
      api.get('/outlets')
        .then((r) => setOutlets(r.data.data || []))
        .catch(() => toast.error('Failed to load outlets'))
        .finally(() => setOutletLoading(false));
    }
  }, [step, outlets.length]);

  // Load menu on step 3
  useEffect(() => {
    if (step === 2 && selectedOutlet) {
      setMenuLoading(true);
      api.get(`/menu?outletId=${selectedOutlet._id}`)
        .then((r) => setMenu(r.data.data || []))
        .catch(() => toast.error('Failed to load menu'))
        .finally(() => setMenuLoading(false));
    }
  }, [step, selectedOutlet]);

  const minDT = toLocalDatetimeString(getMinEventDateTime());

  const dateTimeValid = eventDateTime && new Date(eventDateTime) - new Date() >= MIN_ADVANCE_MS;

  // Validate each step before advancing
  const canAdvance = () => {
    if (step === 0) {
      return eventType && dateTimeValid && guestCount >= 1 && foodPreference;
    }
    if (step === 1) return !!selectedOutlet;
    if (step === 2) return Object.keys(selectedItems).length > 0;
    if (step === 3) {
      return (
        customerName.trim() &&
        /^[6-9]\d{9}$/.test(contactNumber.trim())
      );
    }
    return true;
  };

  const setItemQty = (item, qty) => {
    if (qty <= 0) {
      setSelectedItems((prev) => {
        const next = { ...prev };
        delete next[item._id];
        return next;
      });
    } else {
      setSelectedItems((prev) => ({ ...prev, [item._id]: { item, quantity: qty } }));
    }
  };

  const estimatedTotal = Object.values(selectedItems).reduce(
    (sum, { item, quantity }) => sum + item.price * quantity, 0
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const items = Object.values(selectedItems).map(({ item, quantity }) => ({
        menuItemId: item._id,
        quantity,
      }));

      const { data } = await api.post('/party-orders', {
        outletId: selectedOutlet._id,
        eventType,
        eventDateTime,
        guestCount: parseInt(guestCount),
        foodPreference,
        items,
        deliveryAddress: { street, area, city, pincode },
        customerName,
        contactNumber,
        specialInstructions,
        additionalRequirements,
      });

      if (data.success) {
        setSubmitted(data.data.partyOrderId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <PartyPopper size={40} className="mx-auto text-[#E85D35] mb-4" />
          <h1 className="text-3xl font-serif mb-3">Book a Party Order</h1>
          <p className="text-sm font-mono text-neutral-500 mb-6">Please sign in to place a party order.</p>
          <Link to="/login" className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-7 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'customer') {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <AlertCircle size={40} className="mx-auto text-amber-500 mb-4" />
          <h1 className="text-2xl font-serif mb-3">Not Available</h1>
          <p className="text-sm font-mono text-neutral-500">Party orders can only be placed by customers.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-20 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200">
            <CheckCircle size={30} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-serif mb-2">Order Submitted!</h1>
          <p className="text-sm font-mono text-neutral-500 mb-1">Your party order ID is:</p>
          <p className="font-mono font-bold text-[#E85D35] text-xl mb-6">{submitted}</p>
          <p className="text-xs font-mono text-neutral-500 mb-8 max-w-sm mx-auto">
            Our catering manager will confirm your order within 24 hours. You will receive a notification once reviewed.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/party-orders" className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-6 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all">
              View My Party Orders
            </Link>
            <Link to="/" className="bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 px-6 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans antialiased">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <PartyPopper size={22} className="text-[#E85D35]" />
            <h1 className="text-3xl font-serif text-neutral-900">Book a Party Order</h1>
          </div>
          <p className="text-xs font-mono text-neutral-500">Catering & bulk orders for events — minimum 48 hours advance notice required</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center shrink-0">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-[#E85D35]' : 'text-neutral-400'}`}>
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                  i < step ? 'bg-[#E85D35] border-[#E85D35] text-white'
                  : i === step ? 'border-[#E85D35] text-[#E85D35]'
                  : 'border-neutral-300 text-neutral-400'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs font-mono hidden sm:block whitespace-nowrap">{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 sm:w-10 h-px mx-1 sm:mx-2 ${i < step ? 'bg-[#E85D35]' : 'bg-neutral-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white border border-neutral-200 rounded-sm p-6 sm:p-8 mb-6">

          {/* STEP 0: Event Details */}
          {step === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-serif text-neutral-900 mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[#E85D35]" /> Event Details
              </h2>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Event Type *</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button key={t} onClick={() => setEventType(t)}
                      className={`px-4 py-2 rounded-sm border text-xs font-mono transition-all ${eventType === t ? 'bg-[#E85D35] border-[#E85D35] text-white font-semibold' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-neutral-50'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Event Date & Time *</label>
                <input type="datetime-local" value={eventDateTime} min={minDT}
                  onChange={(e) => setEventDateTime(e.target.value)}
                  className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
                {eventDateTime && !dateTimeValid && (
                  <p className="mt-1.5 text-xs font-mono text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> Event must be at least 48 hours from now. Earliest: {getMinEventDateTime().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
                  </p>
                )}
                {!eventDateTime && (
                  <p className="mt-1.5 text-xs font-mono text-neutral-400 flex items-center gap-1">
                    <Info size={12} /> Minimum 48 hours advance notice required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Number of Guests *</label>
                <input type="number" min={1} value={guestCount}
                  onChange={(e) => setGuestCount(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Food Preference *</label>
                <div className="flex gap-3">
                  {FOOD_PREFS.map((p) => (
                    <button key={p} onClick={() => setFoodPreference(p)}
                      className={`px-5 py-2 rounded-sm border text-xs font-mono transition-all ${foodPreference === p ? 'bg-[#E85D35] border-[#E85D35] text-white font-semibold' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-neutral-50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Outlet Selection */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-[#E85D35]" /> Select Outlet
              </h2>
              {outletLoading ? (
                <div className="py-10 text-center"><Spinner /></div>
              ) : (
                <div className="space-y-3">
                  {outlets.filter(o => o.isActive).map((o) => (
                    <button key={o._id} onClick={() => setSelectedOutlet(o)}
                      className={`w-full text-left border rounded-sm p-4 transition-all ${selectedOutlet?._id === o._id ? 'border-[#E85D35] bg-[#E85D35]/5' : 'border-neutral-200 hover:border-neutral-400'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-neutral-900 font-medium">{o.name}</p>
                          <p className="text-xs font-mono text-neutral-500 mt-0.5">{o.address}</p>
                          <span className="inline-block mt-1.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-100 border border-neutral-200 text-neutral-500 px-2 py-0.5 rounded-xs">
                            {o.type === 'cloud_kitchen' ? 'Cloud Kitchen' : 'Dine & Takeaway'}
                          </span>
                        </div>
                        {selectedOutlet?._id === o._id && (
                          <CheckCircle size={20} className="text-[#E85D35] shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Food Selection */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-1 flex items-center gap-2">
                <Utensils size={18} className="text-[#E85D35]" /> Select Food Items
              </h2>
              <p className="text-xs font-mono text-neutral-500 mb-4">Menu for {selectedOutlet?.name}</p>

              {menuLoading ? (
                <div className="py-10 text-center"><Spinner /></div>
              ) : menu.length === 0 ? (
                <p className="text-center py-10 text-sm font-mono text-neutral-500">No menu items available.</p>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {menu
                    .filter(item => {
                      if (!item.isAvailable) return false;
                      const ov = item.outletAvailability?.find(o => o.outlet?.toString() === selectedOutlet._id?.toString());
                      if (ov && !ov.isAvailable) return false;
                      if (foodPreference === 'Veg' && !item.isVeg) return false;
                      if (foodPreference === 'Non-Veg' && item.isVeg) return false;
                      return true;
                    })
                    .map((item) => {
                      const qty = selectedItems[item._id]?.quantity || 0;
                      return (
                        <div key={item._id} className="flex items-center justify-between gap-3 border border-neutral-200 rounded-sm px-4 py-3 hover:border-neutral-300 transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-xs border-2 shrink-0 ${item.isVeg ? 'border-emerald-600' : 'border-red-500'}`}>
                                <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-emerald-600' : 'bg-red-500'}`} />
                              </span>
                              <p className="font-sans text-sm text-neutral-900 font-medium truncate">{item.name}</p>
                            </div>
                            <p className="text-xs font-mono text-[#E85D35] mt-0.5 ml-5">{formatPrice(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {qty > 0 ? (
                              <div className="flex items-center gap-2 bg-orange-50 border border-[#E85D35]/30 rounded-sm px-2 py-1">
                                <button onClick={() => setItemQty(item, qty - 1)} className="text-[#E85D35] hover:text-[#d44c25]"><Minus size={14} /></button>
                                <span className="font-mono font-bold text-[#E85D35] text-sm min-w-[20px] text-center">{qty}</span>
                                <button onClick={() => setItemQty(item, qty + 1)} className="text-[#E85D35] hover:text-[#d44c25]"><Plus size={14} /></button>
                              </div>
                            ) : (
                              <button onClick={() => setItemQty(item, 1)}
                                className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-4 py-1.5 rounded-sm text-xs font-mono font-semibold transition-all flex items-center gap-1">
                                <Plus size={13} /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {Object.keys(selectedItems).length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-neutral-500">{Object.keys(selectedItems).length} item{Object.keys(selectedItems).length !== 1 ? 's' : ''} selected</span>
                    <span className="font-mono font-bold text-[#E85D35]">Est. Total: {formatPrice(estimatedTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Contact & Delivery */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-serif text-neutral-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-[#E85D35]" /> Contact & Delivery
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Your Name *</label>
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-sans focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Contact Number *</label>
                  <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
                  {contactNumber && !/^[6-9]\d{9}$/.test(contactNumber) && (
                    <p className="mt-1 text-xs text-red-500 font-mono">Enter a valid 10-digit Indian mobile number</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Delivery Address (optional)</label>
                <div className="space-y-3">
                  <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="Street / House / Building"
                    className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-sans focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / Locality"
                      className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-sans focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Pincode"
                      className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Special Food Instructions</label>
                <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2} placeholder="e.g. Less spicy, no onions in certain dishes..."
                  className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-sans resize-none focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-500 uppercase tracking-wider mb-2">Additional Requirements</label>
                <textarea value={additionalRequirements} onChange={(e) => setAdditionalRequirements(e.target.value)}
                  rows={2} placeholder="e.g. Need serving staff, cutlery, decoration assistance..."
                  className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-sans resize-none focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35]" />
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-serif text-neutral-900 mb-5">Review Your Order</h2>

              <div className="space-y-4">
                <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 space-y-2">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Event</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <span className="text-neutral-500 font-mono text-xs">Type</span><span className="font-sans text-neutral-900">{eventType}</span>
                    <span className="text-neutral-500 font-mono text-xs">Date & Time</span><span className="font-sans text-neutral-900">{new Date(eventDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    <span className="text-neutral-500 font-mono text-xs">Guests</span><span className="font-sans text-neutral-900">{guestCount}</span>
                    <span className="text-neutral-500 font-mono text-xs">Food Pref.</span><span className="font-sans text-neutral-900">{foodPreference}</span>
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Outlet</p>
                  <p className="font-sans text-neutral-900 font-medium">{selectedOutlet?.name}</p>
                  <p className="text-xs font-mono text-neutral-500">{selectedOutlet?.address}</p>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Food Items</p>
                  <div className="space-y-1.5">
                    {Object.values(selectedItems).map(({ item, quantity }) => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-neutral-700">{item.name} × {quantity}</span>
                        <span className="font-mono text-neutral-900">{formatPrice(item.price * quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t border-neutral-200 pt-2 mt-2 flex justify-between font-semibold">
                      <span className="text-xs font-mono text-neutral-500">ESTIMATED TOTAL</span>
                      <span className="font-mono text-[#E85D35]">{formatPrice(estimatedTotal)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 space-y-1.5">
                  <p className="text-xs font-mono uppercase tracking-widest text-neutral-400 mb-2">Contact</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <span className="text-neutral-500 font-mono text-xs">Name</span><span>{customerName}</span>
                    <span className="text-neutral-500 font-mono text-xs">Mobile</span><span className="font-mono">{contactNumber}</span>
                  </div>
                  {(street || area) && (
                    <p className="text-xs font-mono text-neutral-500 mt-2">{[street, area, city, pincode].filter(Boolean).join(', ')}</p>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 text-xs font-mono text-amber-700">
                  <Info size={14} className="inline mr-1.5 mb-0.5" />
                  The estimated total above is based on current menu prices. Final pricing will be confirmed by our catering manager. Orders are subject to availability and confirmed within 24 hours.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-3 border border-neutral-200 hover:border-neutral-400 text-neutral-700 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 bg-[#E85D35] hover:bg-[#d44c25] text-white px-7 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-[#E85D35] hover:bg-[#d44c25] text-white px-8 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Order'}
              {!submitting && <ChevronRight size={15} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
