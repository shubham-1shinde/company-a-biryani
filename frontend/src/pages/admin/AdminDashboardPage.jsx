
import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  IndianRupee,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { formatPrice, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed: 'bg-blue-500',
  confirmed: 'bg-indigo-500',
  preparing: 'bg-amber-500',
  ready: 'bg-emerald-500',
  picked_up: 'bg-purple-500',
  delivered: 'bg-green-600',
  cancelled: 'bg-red-500',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const params = { days };
      if (outletId) params.outletId = outletId;

      const [dashboardRes, outletRes] = await Promise.all([
        api.get('/admin/dashboard', { params }),
        api.get('/outlets'),
      ]);

      setData(dashboardRes.data.data);
      setOutlets(outletRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [days, outletId]);

  const stats = [
    {
      label: 'Total Orders',
      value: data?.totalOrders ?? 0,
      icon: ShoppingBag,
    },
    {
      label: 'Total Revenue',
      value: formatPrice(data?.totalRevenue ?? 0),
      icon: IndianRupee,
    },
    {
      label: 'Cancelled Orders',
      value: data?.cancelledOrders ?? 0,
      icon: XCircle,
    },
    {
      label: 'Avg. Preparation',
      value: `${data?.avgPrepTime ?? 0} min`,
      icon: Clock,
    },
  ];

  const breakdown = Object.entries(data?.statusBreakdown || {});
  const maxCount = Math.max(1, ...breakdown.map(([, count]) => count));

  return (
    <AdminLayout title="Dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl">Overview</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor your restaurant operations.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={outletId}
            onChange={(e) => setOutletId(e.target.value)}
            className="border border-neutral-300 bg-white px-3 py-2 text-xs rounded-sm"
          >
            <option value="">All Outlets</option>
            {outlets.map((o) => (
              <option key={o._id} value={o._id}>{o.name}</option>
            ))}
          </select>

          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-neutral-300 bg-white px-3 py-2 text-xs rounded-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>

          <button
            onClick={fetchDashboard}
            className="p-2 border border-neutral-300 bg-white rounded-sm hover:bg-neutral-50"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white border border-neutral-200 p-5 rounded-sm">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-neutral-500">{label}</p>
                  <Icon size={19} className="text-[#E85D35]" />
                </div>
                <p className="text-2xl font-semibold mt-4">{value}</p>
                <p className="text-[10px] text-neutral-400 mt-2">
                  Last {days} days
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-7">
            <section className="bg-white border border-neutral-200 p-5 rounded-sm">
              <h3 className="font-serif text-lg mb-6">Order Status</h3>

              {breakdown.length === 0 ? (
                <p className="text-sm text-neutral-400">No order data available.</p>
              ) : (
                <div className="space-y-5">
                  {breakdown.map(([status, count]) => (
                    <div key={status}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="capitalize">
                          {status.replace('_', ' ')}
                        </span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${STATUS_COLORS[status] || 'bg-neutral-500'}`}
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-neutral-200 p-5 rounded-sm">
              <h3 className="font-serif text-lg mb-5">Order Summary</h3>

              <div className="divide-y divide-neutral-100">
                <div className="py-4 flex justify-between text-sm">
                  <span className="text-neutral-500">Successful orders</span>
                  <strong>{data.totalOrders - data.cancelledOrders}</strong>
                </div>
                <div className="py-4 flex justify-between text-sm">
                  <span className="text-neutral-500">Cancelled orders</span>
                  <strong>{data.cancelledOrders}</strong>
                </div>
                <div className="py-4 flex justify-between text-sm">
                  <span className="text-neutral-500">Cancellation rate</span>
                  <strong>
                    {data.totalOrders
                      ? ((data.cancelledOrders / data.totalOrders) * 100).toFixed(1)
                      : 0}%
                  </strong>
                </div>
                <div className="py-4 flex justify-between text-sm">
                  <span className="text-neutral-500">Average order value</span>
                  <strong>
                    {formatPrice(
                      data.totalOrders - data.cancelledOrders
                        ? data.totalRevenue /
                          (data.totalOrders - data.cancelledOrders)
                        : 0
                    )}
                  </strong>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
