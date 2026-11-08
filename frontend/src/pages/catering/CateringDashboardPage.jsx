import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, Clock, CheckCircle, XCircle, ChefHat, TrendingUp } from 'lucide-react';
import CateringLayout from '../../components/catering/CateringLayout';
import { Spinner, formatPrice } from '../../components/ui';
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

function StatCard({ label, value, icon: Icon, color = 'text-neutral-900' }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">{label}</span>
        {Icon && <Icon size={16} className="text-neutral-300" />}
      </div>
      <p className={`text-3xl font-serif font-medium ${color}`}>{value}</p>
    </div>
  );
}

export default function CateringDashboardPage() {
  const [data, setData] = useState({ orders: [], stats: {}, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 10 });
      if (statusFilter) params.set('status', statusFilter);
      const { data: res } = await api.get(`/party-orders/catering?${params}`);
      setData(res);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [statusFilter]);

  const { orders = [], stats = {} } = data;

  const totalOrders = Object.values(stats).reduce((s, v) => s + v, 0);

  return (
    <CateringLayout title="Dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total" value={totalOrders} icon={CalendarDays} />
        <StatCard label="Pending" value={stats.pending || 0} icon={Clock} color="text-amber-600" />
        <StatCard label="Confirmed" value={stats.confirmed || 0} icon={CheckCircle} color="text-blue-600" />
        <StatCard label="Rejected" value={stats.rejected || 0} icon={XCircle} color="text-red-600" />
        <StatCard label="Completed" value={stats.completed || 0} icon={TrendingUp} color="text-emerald-600" />
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-serif text-xl text-neutral-900">Recent Party Orders</h2>
        <Link to="/catering/orders" className="text-xs font-mono text-[#E85D35] hover:text-[#d44c25] uppercase tracking-wider">
          View All →
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {['', 'pending', 'confirmed', 'rejected', 'preparing', 'completed'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
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
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Order ID</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Event</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Guests</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Total</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-neutral-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-900 font-semibold">{order.partyOrderId}</td>
                    <td className="px-4 py-3 text-xs text-neutral-700">{order.customer?.name || '—'}<br /><span className="text-neutral-400 font-mono">{order.customer?.mobile}</span></td>
                    <td className="px-4 py-3 text-xs text-neutral-700">
                      <span>{order.eventType}</span><br />
                      <span className="text-neutral-400 font-mono text-[11px]">{new Date(order.eventDateTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-neutral-700">{order.guestCount}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#E85D35] font-bold">{formatPrice(order.estimatedTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-sm border text-[11px] font-mono uppercase tracking-wide ${STATUS_STYLES[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/catering/orders`} state={{ orderId: order._id }}
                        className="text-xs font-mono text-[#E85D35] hover:text-[#d44c25] underline underline-offset-2">
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </CateringLayout>
  );
}
