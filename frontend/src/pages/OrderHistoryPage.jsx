import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ArrowRight, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import { OrderStatusBadge, EmptyState, Spinner, formatPrice, formatDate, formatTime } from '../components/ui';
import api from '../lib/api';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my')
      .then(({ data }) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col justify-between">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-10 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200 pb-5 mb-8 gap-2">
          <div>
            <h1 className="text-3xl font-serif text-neutral-900">My Orders</h1>
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mt-1">
              Direct Kitchen Order History
            </p>
          </div>
          {!loading && (
            <span className="text-xs font-mono text-neutral-500">
              {orders.length} {orders.length === 1 ? 'Order' : 'Orders'} placed
            </span>
          )}
        </div>

        {/* Orders Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-neutral-200/90 rounded-sm p-8 sm:p-12 text-center shadow-sm max-w-md mx-auto my-10">
            <div className="w-16 h-16 bg-[#E85D35]/10 text-[#E85D35] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#E85D35]/20">
              <Package size={28} />
            </div>
            <h2 className="text-2xl font-serif text-neutral-900 mb-2">No orders yet</h2>
            <p className="text-xs font-mono text-neutral-500 mb-8 leading-relaxed">
              Your direct kitchen dispatch history will appear here once you place your first order.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center justify-center gap-2 bg-[#E85D35] hover:bg-[#d44c25] text-white px-7 py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md group"
            >
              <span>Browse Outlets & Menu</span>
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link 
                key={order._id} 
                to={`/order/${order.orderId}`} 
                className="bg-white border border-neutral-200/90 rounded-sm p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-neutral-400 hover:shadow-lg transition-all duration-300 group"
              >
                {/* Left Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono font-bold text-sm text-neutral-900">
                      #{order.orderId}
                    </span>
                    <OrderStatusBadge status={order.status} isLate={order.isLate} />
                  </div>

                  <p className="text-base font-serif font-medium text-neutral-900 group-hover:text-[#E85D35] transition-colors truncate">
                    {order.outlet?.name || 'Company A Biryani'}
                  </p>

                  <p className="text-xs font-sans text-neutral-600 truncate">
                    {order.items.slice(0, 2).map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                    {order.items.length > 2 ? ` +${order.items.length - 2} more` : ''}
                  </p>

                  <p className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                    <Clock size={12} className="shrink-0 text-neutral-400" />
                    <span>{formatDate(order.placedAt)} · {formatTime(order.placedAt)}</span>
                  </p>
                </div>

                {/* Right Details & Price */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-100 shrink-0">
                  <div className="text-left sm:text-right">
                    <p className="font-mono font-bold text-base text-[#E85D35]">
                      {formatPrice(order.total)}
                    </p>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                      {order.payment?.method?.toUpperCase() || 'PAYMENT'}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-neutral-50 group-hover:bg-[#E85D35] group-hover:text-white flex items-center justify-center transition-colors sm:mt-2 text-neutral-400">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
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