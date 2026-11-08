import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Users, XCircle, CheckCircle, X } from 'lucide-react';
import CateringLayout from '../../components/catering/CateringLayout';
import { Spinner, formatPrice, formatDate } from '../../components/ui';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  preparing: 'bg-purple-50 text-purple-700 border-purple-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-neutral-100 text-neutral-500 border-neutral-200',
};

function RejectModal({ order, onClose, onRejected }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/party-orders/${order._id}/review`, { status: 'rejected', rejectionReason: reason });
      toast.success('Party order rejected.');
      onRejected(order._id, 'rejected', reason);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-sm border border-neutral-200 shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-neutral-900">Reject Party Order</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700"><X size={18} /></button>
        </div>
        <p className="text-xs font-mono text-neutral-500 mb-4">Order: <strong className="text-neutral-900">{order.partyOrderId}</strong></p>
        <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-2">Rejection Reason *</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
          placeholder="Explain why this order cannot be fulfilled…"
          className="w-full border border-neutral-300 rounded-sm px-3.5 py-2.5 text-sm font-sans resize-none focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 mb-4" />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-neutral-200 hover:border-neutral-400 text-neutral-700 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all">
            Cancel
          </button>
          <button onClick={handleReject} disabled={loading || !reason.trim()}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50">
            {loading ? 'Rejecting…' : 'Reject Order'}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderDetailPanel({ order, onClose, onUpdate }) {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      await api.patch(`/party-orders/${order._id}/review`, { status: 'confirmed', managerRemarks: 'Confirmed by catering manager' });
      toast.success('Party order confirmed!');
      onUpdate(order._id, 'confirmed');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    setStatusLoading(true);
    try {
      await api.patch(`/party-orders/${order._id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      onUpdate(order._id, status);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRejected = (id, status, reason) => {
    onUpdate(id, status, reason);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-start justify-end p-4 sm:p-8">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative bg-white border border-neutral-200 rounded-sm shadow-2xl w-full max-w-lg h-full max-h-[90vh] overflow-y-auto flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h3 className="font-mono font-bold text-neutral-900">{order.partyOrderId}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-sm border text-[11px] font-mono uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                {order.status}
              </span>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1"><X size={20} /></button>
          </div>

          <div className="flex-1 p-6 space-y-5">
            {/* Event */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Event Details</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-neutral-500 font-mono text-xs">Type</span><span className="text-neutral-900">{order.eventType}</span>
                <span className="text-neutral-500 font-mono text-xs">Date & Time</span><span className="text-neutral-900">{new Date(order.eventDateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                <span className="text-neutral-500 font-mono text-xs">Guests</span><span className="text-neutral-900">{order.guestCount}</span>
                <span className="text-neutral-500 font-mono text-xs">Food Pref.</span><span className="text-neutral-900">{order.foodPreference}</span>
              </div>
            </div>

            {/* Customer */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-sm p-4 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Customer</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-neutral-500 font-mono text-xs">Name</span><span>{order.customerName}</span>
                <span className="text-neutral-500 font-mono text-xs">Contact</span><span className="font-mono">{order.contactNumber}</span>
                <span className="text-neutral-500 font-mono text-xs">Email</span><span className="text-neutral-500">{order.customer?.email || '—'}</span>
              </div>
              {(order.deliveryAddress?.street || order.deliveryAddress?.area) && (
                <div>
                  <p className="text-[10px] font-mono text-neutral-400 mt-2 mb-1">Delivery Address</p>
                  <p className="text-xs font-sans text-neutral-700">
                    {[order.deliveryAddress.street, order.deliveryAddress.area, order.deliveryAddress.city, order.deliveryAddress.pincode].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Food Items */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-2">Food Items</p>
              <div className="space-y-1.5">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-neutral-100 pb-1.5">
                    <span className="text-neutral-700">{item.name} × {item.quantity}</span>
                    <span className="font-mono text-neutral-900">{formatPrice(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold text-sm pt-1">
                  <span className="font-mono text-xs text-neutral-500 uppercase">Estimated Total</span>
                  <span className="font-mono text-[#E85D35]">{formatPrice(order.estimatedTotal)}</span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Special Instructions</p>
                <p className="text-sm font-sans text-neutral-700 bg-amber-50 border border-amber-100 rounded-sm px-3 py-2">{order.specialInstructions}</p>
              </div>
            )}
            {order.additionalRequirements && (
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">Additional Requirements</p>
                <p className="text-sm font-sans text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-sm px-3 py-2">{order.additionalRequirements}</p>
              </div>
            )}

            {/* Rejection reason if rejected */}
            {order.status === 'rejected' && order.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-sm p-3">
                <p className="text-xs font-mono text-red-700"><strong>Rejection Reason:</strong> {order.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4">
            {order.status === 'pending' && (
              <div className="flex gap-3">
                <button onClick={() => setShowRejectModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 border border-red-200 hover:border-red-400 text-red-600 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all">
                  <XCircle size={14} /> Reject
                </button>
                <button onClick={handleConfirm} disabled={confirmLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E85D35] hover:bg-[#d44c25] text-white py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50">
                  <CheckCircle size={14} /> {confirmLoading ? 'Confirming…' : 'Confirm Order'}
                </button>
              </div>
            )}
            {order.status === 'confirmed' && (
              <button onClick={() => handleStatusUpdate('preparing')} disabled={statusLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50">
                {statusLoading ? 'Updating…' : 'Mark as Preparing'}
              </button>
            )}
            {order.status === 'preparing' && (
              <button onClick={() => handleStatusUpdate('completed')} disabled={statusLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all disabled:opacity-50">
                {statusLoading ? 'Updating…' : 'Mark as Completed'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showRejectModal && (
        <RejectModal order={order} onClose={() => setShowRejectModal(false)} onRejected={handleRejected} />
      )}
    </>
  );
}

export default function CateringOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/party-orders/catering?${params}`);
      setOrders(data.data || []);
      setPagination(data.pagination || {});
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const handleUpdate = (id, status, rejectionReason) => {
    setOrders((prev) =>
      prev.map((o) => o._id === id
        ? { ...o, status, ...(rejectionReason ? { rejectionReason } : {}) }
        : o
      )
    );
  };

  return (
    <CateringLayout title="Party Orders">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="font-serif text-xl text-neutral-900">All Party Orders</h2>
        <span className="text-xs font-mono text-neutral-400">{pagination.total || 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'pending', 'confirmed', 'rejected', 'preparing', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-sm border text-xs font-mono capitalize transition-all ${statusFilter === s ? 'bg-neutral-900 text-white border-neutral-900' : 'border-neutral-200 text-neutral-600 hover:border-neutral-400 bg-white'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center"><Spinner /></div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white border border-neutral-200 rounded-sm">
          <CalendarDays size={32} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-sm font-mono text-neutral-500">No party orders found</p>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50">
                  {['Order ID', 'Customer', 'Event', 'Date', 'Guests', 'Total', 'Status', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-neutral-50/50 transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-neutral-900">{order.partyOrderId}</td>
                    <td className="px-4 py-3 text-xs text-neutral-700">
                      <p>{order.customerName}</p>
                      <p className="text-neutral-400 font-mono">{order.contactNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-700">{order.eventType}</td>
                    <td className="px-4 py-3 text-xs font-mono text-neutral-500 whitespace-nowrap">
                      {new Date(order.eventDateTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-neutral-700">{order.guestCount}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E85D35] font-bold">{formatPrice(order.estimatedTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm border text-[11px] font-mono uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="text-xs font-mono text-[#E85D35] hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="border-t border-neutral-200 px-4 py-3 flex items-center justify-between">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="text-xs font-mono text-neutral-500 hover:text-neutral-900 disabled:opacity-30">← Previous</button>
              <span className="text-xs font-mono text-neutral-500">Page {page} of {pagination.pages}</span>
              <button disabled={page === pagination.pages} onClick={() => setPage((p) => p + 1)}
                className="text-xs font-mono text-neutral-500 hover:text-neutral-900 disabled:opacity-30">Next →</button>
            </div>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {selectedOrder && (
        <OrderDetailPanel
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={handleUpdate}
        />
      )}
    </CateringLayout>
  );
}
