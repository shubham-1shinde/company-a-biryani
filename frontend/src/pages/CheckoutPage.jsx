import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Gift, ArrowLeft, CheckCircle, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';
import { formatPrice } from '../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearCart,
  selectCart,
  selectTotalPrice,
} from '../redux/cartSlice';
import { updateUser } from '../redux/authSlice';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI Instant Pay', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm (Test Mode)' },
  { id: 'card', label: 'Credit or Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay (Test Mode)' },
];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cart = useSelector(selectCart);
  const totalPrice = useSelector(selectTotalPrice);
  const { userData: user } = useSelector((state) => state.auth);

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loyaltyToUse, setLoyaltyToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('checkout'); // 'checkout' | 'processing' | 'success'
  const [placedOrder, setPlacedOrder] = useState(null);

  const loyaltyBalance = user?.loyaltyPoints || 0;
  const maxLoyalty = Math.floor(Math.min(loyaltyBalance, totalPrice * 0.2 / 0.25) / 40) * 40;
  const loyaltyDiscount = loyaltyToUse * 0.25;
  const gstAmount = Math.round((totalPrice * 5) / 105 * 100) / 100;
  const finalTotal = Math.max(0, totalPrice - loyaltyDiscount);

  const handlePlaceOrder = async () => {
    if (!cart.outletId || cart.items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    setStep('processing');

    try {
      // Simulate brief payment processing
      await new Promise((r) => setTimeout(r, 1800));

      const { data } = await api.post('/orders', {
        outletId: cart.outletId,
        items: cart.items.map((i) => ({
          menuItemId: i._id,
          quantity: i.quantity,
          portionOption: i.portionOption || undefined,
        })),
        payment: { method: paymentMethod },
        deliveryType: 'pickup',
        loyaltyPointsToUse: loyaltyToUse,
      });

      if (data.success) {
        setPlacedOrder(data.data);
        setStep('success');

        dispatch(clearCart());

        if (user && data.data.loyaltyPointsEarned) {
          dispatch(
            updateUser({
              ...user,
              loyaltyPoints:
                (user.loyaltyPoints || 0) +
                data.data.loyaltyPointsEarned -
                loyaltyToUse,
            })
          );
        }
      }
    } catch (err) {
      setStep('checkout');
      toast.error(
        err.response?.data?.message || 'Order failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* Processing State */
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-[#0C0C0D] text-white flex flex-col items-center justify-center p-6 text-center antialiased">
        <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-2xl">
          <Loader2 size={32} className="animate-spin text-[#E85D35]" />
        </div>
        <h2 className="text-2xl font-serif text-white mb-2">Processing Payment</h2>
        <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">
          Dispatching ticket to kitchen...
        </p>
        <span className="text-[11px] font-mono text-neutral-600 mt-6 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded">
          Test Mode · No Real Funds Charged
        </span>
      </div>
    );
  }

  /* Success State */
  if (step === 'success' && placedOrder) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-neutral-200/90 rounded-sm max-w-md w-full p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-600">
            <CheckCircle size={32} />
          </div>

          <span className="text-xs font-mono uppercase tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block mb-3">
            Order Confirmed
          </span>

          <h1 className="text-3xl font-serif text-neutral-900 mb-1">Order Placed!</h1>
          <p className="text-[#E85D35] font-mono font-bold text-xl mb-4">#{placedOrder.orderId}</p>

          <div className="bg-neutral-50 border border-neutral-200/80 rounded-sm p-4 mb-6 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>Estimated Prep Time:</span>
              <span className="font-bold text-neutral-900">{placedOrder.prepTimeEstimate} min</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Target Hand-off:</span>
              <span className="font-bold text-neutral-900">
                {new Date(placedOrder.promisedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {placedOrder.loyaltyPointsEarned > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-sm p-3.5 mb-6 flex items-center justify-center gap-2 text-xs font-mono text-amber-900">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>+{placedOrder.loyaltyPointsEarned} loyalty points earned on this order!</span>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={() => navigate(`/order/${placedOrder.orderId}`)} 
              className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md flex items-center justify-center gap-2 group"
            >
              <span>Track Live Order</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="w-full bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 py-3 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Checkout Form View */
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back button */}
        <button 
          onClick={() => navigate('/cart')} 
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Cart</span>
        </button>

        <h1 className="text-3xl font-serif text-neutral-900 mb-8 border-b border-neutral-200 pb-4">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Left Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Payment Method Selector */}
            <div className="bg-white border border-neutral-200/90 rounded-sm p-6 shadow-sm">
              <h2 className="font-serif text-xl text-neutral-900 mb-1">Select Payment Method</h2>
              <p className="text-xs font-mono text-neutral-500 mb-5">Secure test environment</p>

              <div className="space-y-3">
                {PAYMENT_METHODS.map((m) => (
                  <label 
                    key={m.id} 
                    className={`flex items-center gap-4 p-4 rounded-sm border cursor-pointer transition-all ${
                      paymentMethod === m.id 
                        ? 'border-[#E85D35] bg-orange-50/20 shadow-sm' 
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment" 
                      value={m.id} 
                      checked={paymentMethod === m.id} 
                      onChange={() => setPaymentMethod(m.id)} 
                      className="hidden" 
                    />
                    
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      paymentMethod === m.id ? 'border-[#E85D35]' : 'border-neutral-300'
                    }`}>
                      {paymentMethod === m.id && <div className="w-2 h-2 rounded-full bg-[#E85D35]" />}
                    </div>

                    <m.icon size={20} className={paymentMethod === m.id ? 'text-[#E85D35]' : 'text-neutral-400'} />
                    
                    <div className="flex-1">
                      <p className={`font-serif text-sm font-medium ${paymentMethod === m.id ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {m.label}
                      </p>
                      <p className="text-xs font-mono text-neutral-500">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Loyalty Points Section */}
            {loyaltyBalance >= 40 && (
              <div className="bg-white border border-neutral-200/90 rounded-sm p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={18} className="text-[#E85D35]" />
                  <h2 className="font-serif text-xl text-neutral-900">Apply Loyalty Points</h2>
                </div>
                
                <p className="text-xs font-mono text-neutral-600 mb-4">
                  Available: <strong className="text-[#E85D35] font-semibold">{loyaltyBalance} pts</strong> ({formatPrice(loyaltyBalance * 0.25)} discount)
                </p>

                <div className="flex flex-wrap gap-2">
                  {[0, 40, 80, maxLoyalty].filter((v, i, a) => a.indexOf(v) === i && v <= loyaltyBalance).map((pts) => (
                    <button 
                      key={pts} 
                      type="button"
                      onClick={() => setLoyaltyToUse(pts)} 
                      className={`px-3.5 py-2 rounded-sm text-xs font-mono transition-all border ${
                        loyaltyToUse === pts 
                          ? 'border-[#E85D35] bg-[#E85D35]/10 text-[#E85D35] font-semibold' 
                          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-white'
                      }`}
                    >
                      {pts === 0 ? 'Don\'t use points' : `${pts} pts (-${formatPrice(pts * 0.25)})`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items Preview */}
            <div className="bg-white border border-neutral-200/90 rounded-sm p-6 shadow-sm">
              <h2 className="font-serif text-xl text-neutral-900 mb-1">Order Items</h2>
              <p className="text-xs font-mono text-neutral-500 mb-4">
                Dispatching from {cart.outletName || 'Nearest Kitchen'}
              </p>

              <div className="divide-y divide-neutral-100">
                {cart.items.map((item, i) => (
                  <div key={i} className="py-3 flex justify-between items-center text-xs font-mono">
                    <span className="text-neutral-800">
                      {item.name} {item.portionOption ? `(${item.portionOption.split('(')[0].trim()})` : ''} 
                      <strong className="text-[#E85D35] ml-1.5">× {item.quantity}</strong>
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200/90 rounded-sm p-6 sticky top-24 shadow-sm">
              <h2 className="font-serif text-xl text-neutral-900 mb-4 border-b border-neutral-100 pb-3">
                Bill Breakdown
              </h2>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal (incl. GST)</span>
                  <span className="text-neutral-900 font-medium">{formatPrice(totalPrice)}</span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>GST included (5%)</span>
                  <span>{formatPrice(gstAmount)}</span>
                </div>

                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Loyalty Discount</span>
                    <span>-{formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 my-4" />

              <div className="flex justify-between font-serif text-neutral-900 text-lg mb-6">
                <span>Final Payable</span>
                <span className="font-mono font-bold text-[#E85D35]">{formatPrice(finalTotal)}</span>
              </div>

              <button 
                onClick={handlePlaceOrder} 
                disabled={loading} 
                className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 group"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Pay {formatPrice(finalTotal)}</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-4 pt-4 border-t border-neutral-100 text-center space-y-1">
                <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" /> Test Mode · Direct Kitchen Order
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}