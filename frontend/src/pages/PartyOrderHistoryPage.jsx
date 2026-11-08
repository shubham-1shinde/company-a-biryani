import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ChevronDown, ChevronUp, XCircle, Clock, CheckCircle, AlertCircle, PartyPopper } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Spinner, formatDate, formatPrice } from '../components/ui';
import api from '../lib/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  preparing: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
};

const STATUS_ICON = {
  pending:   <Clock size={13} />,
  confirmed: <CheckCircle size={13} />,
  rejected:  <XCircle size={13} />,
  preparing: <ChevronUp size={13} />,
  completed: <CheckCircle size={13} />,
  cancelled: <XCircle size={13} />,
};

function PartyOrderCard({ order, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this party order?')) return;
    setCancelling(true);
    try {
      await api.patch(`/party-orders/${order._id}/cancel`);
      toast.success('Party order cancelled.');
      onCancel(order._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-bold text-neutral-900 text-sm">{order.partyOrderId}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border text-[11px] font-mono font-semibold uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                {STATUS_ICON[order.status]} {order.status}
              </span>
            </div>
            <p className="text-xs font-mono text-neutral-500">
              {order.eventType} · {new Date(order.eventDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono font-bold text-[#E85D35] text-base">{formatPrice(order.estimatedTotal)}</p>
            <p className="text-[11px] font-mono text-neutral-400">est. total</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs font-mono text-neutral-500">
          <span className="flex items-center gap-1"><MapPin size={12} />{order.outlet?.name}</span>
          <span className="flex items-center gap-1"><Users size={12} />{order.guestCount} guests</span>
          <span className="flex items-center gap-1"><Calendar size={12} />Placed {formatDate(order.placedAt)}</span>
        </div>

        {order.status === 'rejected' && order.rejectionReason && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-sm p-3 text-xs font-mono text-red-700">
            <strong>Reason:</strong> {order.rejectionReason}
          </div>
        )}
      </div>

      <div className="border-t border-neutral-100 px-5 py-3 flex items-center justify-between gap-3 bg-neutral-50/50">
        <button onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors">
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide Details' : 'View Details'}
        </button>

        <div className="flex items-center gap-2">
          {order.status === 'pending' && (
            <button onClick={handleCancel} disabled={cancelling}
              className="text-xs font-mono text-red-600 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-sm transition-all disabled:opacity-50">
              {cancelling ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-neutral-100 px-5 py-4 space-y-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">Food Items</p>
            <div className="space-y-1.5">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-neutral-700">{item.name} × {item.quantity}</span>
                  <span className="font-mono text-neutral-500">{formatPrice(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {order.specialInstructions && (
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Special Instructions</p>
              <p className="text-xs font-sans text-neutral-700">{order.specialInstructions}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">Status Timeline</p>
            <div className="space-y-1.5">
              {order.statusHistory?.map((h, i) => (
                <div key={i} className="flex items-start gap-2 text-xs font-mono">
                  <span className={`mt-0.5 px-1.5 py-0.5 rounded-xs border uppercase text-[10px] tracking-wide ${STATUS_STYLES[h.status] || 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>{h.status}</span>
                  <span className="text-neutral-500">{new Date(h.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                  {h.note && <span className="text-neutral-400">· {h.note}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PartyOrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/party-orders/my${params}`);
      setOrders(data.data || []);
    } catch {
      toast.error('Failed to load party orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [statusFilter]);

  const handleCancel = (cancelledId) => {
    setOrders((prev) => prev.map((o) => o._id === cancelledId ? { ...o, status: 'cancelled' } : o));
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans antialiased">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PartyPopper size={20} className="text-[#E85D35]" />
              <h1 className="text-3xl font-serif text-neutral-900">My Party Orders</h1>
            </div>
            <p className="text-xs font-mono text-neutral-500">Track your catering & event orders</p>
          </div>
          <Link to="/party-order"
            className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm">
            + New Party Order
          </Link>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {['', 'pending', 'confirmed', 'rejected', 'preparing', 'completed', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-sm border text-xs font-mono transition-all capitalize ${statusFilter === s ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center"><Spinner /></div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center bg-white border border-neutral-200 rounded-sm p-10">
            <PartyPopper size={36} className="mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-serif text-neutral-700 mb-2">No party orders yet</h3>
            <p className="text-xs font-mono text-neutral-500 mb-6">Planning an event? Book a catering order and we'll make it special.</p>
            <Link to="/party-order" className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-6 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all">
              Book Now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <PartyOrderCard key={o._id} order={o} onCancel={handleCancel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
