import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { RefreshCw, MapPin, Clock, CheckCircle, Loader2, AlertCircle, Package, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { OrderStatusBadge, Spinner, formatPrice, formatTime } from '../components/ui';
import { connectSocket, getSocket } from '../lib/socket';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['placed', 'confirmed', 'preparing', 'ready', 'picked_up'];

const ICONS = { placed: Package, confirmed: CheckCircle, preparing: Loader2, ready: CheckCircle, picked_up: CheckCircle };

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      if (data.success) setOrder(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrder();

    const socket = connectSocket();
    socket.emit('join-order', orderId);

    socket.on('order-status-update', (update) => {
      if (update.orderId === orderId) {
        setOrder((prev) => prev ? { ...prev, status: update.status, promisedAt: update.promisedAt, actualReadyAt: update.actualReadyAt } : prev);
        const labels = { confirmed: 'Order confirmed!', preparing: 'Kitchen is preparing your order 🍳', ready: 'Your order is ready for pickup! 🎉' };
        if (labels[update.status]) toast.success(labels[update.status]);
      }
    });

    const interval = setInterval(loadOrder, 30000); // Poll every 30s as backup
    return () => {
      socket.off('order-status-update');
      clearInterval(interval);
    };
  }, [orderId, loadOrder]);

  const currentStepIdx = STATUS_STEPS.indexOf(order?.status);

  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col">
      <Navbar />
      <div className="flex-1 flex justify-center items-center py-24">
        <Spinner />
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col justify-between">
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-20 text-center my-auto">
        <div className="w-16 h-16 bg-neutral-100 border border-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-2xl font-serif text-neutral-900 mb-2">Order Not Found</h2>
        <p className="text-xs font-mono text-neutral-500 mb-6">{error || 'Unable to retrieve order details.'}</p>
        <Link 
          to="/" 
          className="inline-flex items-center justify-center gap-2 bg-[#E85D35] hover:bg-[#d44c25] text-white px-7 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md"
        >
          <span>Back to Home</span>
        </Link>
      </div>
      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center">
        <p className="text-[11px] font-mono text-neutral-400">
          © 2026 Company A Biryani · Direct Dum Dispatch
        </p>
      </footer>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col justify-between">
      <Navbar />

      <main className="max-w-xl mx-auto px-6 py-10 w-full flex-1">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-200 pb-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded inline-block mb-1">
              Live Tracker
            </span>
            <h1 className="text-2xl font-serif text-neutral-900">Order Status</h1>
            <p className="text-xs font-mono font-bold text-[#E85D35]">#{order.orderId}</p>
          </div>
          <button 
            onClick={loadOrder} 
            className="p-2.5 rounded-sm border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Live Status Card */}
        <div className="bg-white border border-neutral-200/90 rounded-sm p-6 mb-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <OrderStatusBadge status={order.status} isLate={order.isLate} />
            <div className="text-right">
              <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Promised By</p>
              <p className="font-mono font-bold text-neutral-900 text-sm">{formatTime(order.promisedAt)}</p>
            </div>
          </div>

          {order.isLate && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-3.5 mb-6 flex items-start gap-2 text-xs font-mono text-red-800">
              <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <p>We're running a bit late on your order. We apologize for the delay.</p>
            </div>
          )}

          {/* Progress Stepper */}
          {order.status !== 'cancelled' && (
            <div className="mt-2">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        done ? 'bg-[#E85D35] text-white shadow-xs' : 'bg-neutral-100 text-neutral-400 border border-neutral-200'
                      } ${active ? 'ring-4 ring-[#E85D35]/20 font-bold' : ''}`}>
                        {done ? <CheckCircle size={15} /> : <span className="text-[10px] font-mono">{i + 1}</span>}
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1.5 transition-all ${i < currentStepIdx ? 'bg-[#E85D35]' : 'bg-neutral-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between mt-3 text-[10px] font-mono text-neutral-500 text-center">
                {STATUS_STEPS.map((step) => (
                  <span key={step} className="capitalize truncate px-0.5" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                    {step.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Outlet Pickup Card */}
        <div className="bg-white border border-neutral-200/90 rounded-sm p-5 mb-5 shadow-sm">
          <h2 className="font-serif text-lg text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Pickup Location</h2>
          <div className="flex items-start gap-3 text-xs font-mono text-neutral-600">
            <MapPin size={16} className="text-[#E85D35] mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-serif font-medium text-neutral-900 text-sm">{order.outlet?.name}</p>
              <p className="text-neutral-500 leading-relaxed">{order.outlet?.address}</p>
              {order.outlet?.phone && <p className="text-neutral-500 pt-1">Contact: {order.outlet.phone}</p>}
            </div>
          </div>
        </div>

        {/* Ordered Items Summary */}
        <div className="bg-white border border-neutral-200/90 rounded-sm p-5 mb-5 shadow-sm">
          <h2 className="font-serif text-lg text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Items Ordered</h2>
          <div className="divide-y divide-neutral-100 text-xs font-mono">
            {order.items.map((item, i) => (
              <div key={i} className="py-2.5 flex justify-between items-center">
                <span className="text-neutral-800">
                  {item.name} {item.portionOption ? `(${item.portionOption.split('(')[0].trim()})` : ''} 
                  <strong className="text-[#E85D35] ml-1.5">× {item.quantity}</strong>
                </span>
                <span className="font-semibold text-neutral-900">{formatPrice(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-neutral-200 mt-3 pt-3 flex justify-between font-serif text-neutral-900 text-base">
            <span>Total Paid</span>
            <span className="font-mono font-bold text-[#E85D35]">{formatPrice(order.total)}</span>
          </div>
        </div>

        {/* Payment Detail Card */}
        <div className="bg-white border border-neutral-200/90 rounded-sm p-5 mb-8 shadow-sm">
          <h2 className="font-serif text-lg text-neutral-900 mb-3 border-b border-neutral-100 pb-2">Payment Details</h2>
          <div className="flex justify-between items-center text-xs font-mono mb-1">
            <span className="text-neutral-600 uppercase">{order.payment.method.toUpperCase()}</span>
            <span className="text-emerald-700 font-semibold uppercase bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              {order.payment.status}
            </span>
          </div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1">Txn ID: {order.payment.transactionId}</p>
        </div>

        {/* Actions */}
        <Link 
          to="/" 
          className="w-full bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center justify-center gap-2 group"
        >
          <span>Order Again</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center mt-12">
        <p className="text-[11px] font-mono text-neutral-400">
          © 2026 Company A Biryani · Direct Dum Dispatch
        </p>
      </footer>
    </div>
  );
}