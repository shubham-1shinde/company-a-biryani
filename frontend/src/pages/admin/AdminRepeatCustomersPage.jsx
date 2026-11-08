
import { useEffect, useState } from 'react';
import { Users, Repeat2, TrendingUp, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminRepeatCustomersPage() {
  const [data, setData] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [outletId, setOutletId] = useState('');
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    try {
      const params = { days };
      if (outletId) params.outletId = outletId;

      const [customerRes, outletRes] = await Promise.all([
        api.get('/admin/repeat-customers', { params }),
        api.get('/outlets'),
      ]);

      setData(customerRes.data.data);
      setOutlets(outletRes.data.data || []);
    } catch {
      toast.error('Failed to load customer statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days, outletId]);

  const stats = [
    {
      title: 'Total Customers',
      value: data?.totalCustomers ?? 0,
      icon: Users,
      description: `Customers who ordered in ${days} days`,
    },
    {
      title: 'Repeat Customers',
      value: data?.repeatCustomers ?? 0,
      icon: Repeat2,
      description: 'Customers with multiple orders',
    },
    {
      title: 'Repeat Rate',
      value: `${data?.repeatRate ?? 0}%`,
      icon: TrendingUp,
      description: 'Percentage of returning customers',
    },
  ];

  const newCustomers = Math.max(
    0,
    (data?.totalCustomers || 0) - (data?.repeatCustomers || 0)
  );

  return (
    <AdminLayout title="Repeat Customers">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl">Customer Retention</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Understand customer loyalty and repeat purchases.
          </p>
        </div>

        <div className="flex gap-2">
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
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>

          <button
            onClick={fetchData}
            className="border border-neutral-300 bg-white p-2 rounded-sm"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(({ title, value, icon: Icon, description }) => (
              <div key={title} className="bg-white border border-neutral-200 p-5 rounded-sm">
                <div className="flex justify-between">
                  <p className="text-xs text-neutral-500">{title}</p>
                  <Icon size={19} className="text-[#E85D35]" />
                </div>
                <p className="text-3xl font-semibold mt-5">{value}</p>
                <p className="text-xs text-neutral-400 mt-2">{description}</p>
              </div>
            ))}
          </div>

          <section className="mt-7 bg-white border border-neutral-200 p-6 rounded-sm">
            <h2 className="font-serif text-lg mb-6">Customer Breakdown</h2>

            <div className="flex justify-between text-sm mb-2">
              <span>Repeat customers</span>
              <strong>{data?.repeatRate ?? 0}%</strong>
            </div>

            <div className="h-4 rounded-full overflow-hidden bg-neutral-100 flex">
              <div
                className="bg-[#E85D35] h-full"
                style={{ width: `${Math.min(100, data?.repeatRate || 0)}%` }}
              />
              <div className="bg-neutral-200 flex-1" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-neutral-50 p-4 rounded-sm">
                <p className="text-xs text-neutral-500">Repeat Customers</p>
                <p className="text-xl font-semibold mt-2">
                  {data?.repeatCustomers ?? 0}
                </p>
              </div>
              <div className="bg-neutral-50 p-4 rounded-sm">
                <p className="text-xs text-neutral-500">Single-order Customers</p>
                <p className="text-xl font-semibold mt-2">{newCustomers}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
