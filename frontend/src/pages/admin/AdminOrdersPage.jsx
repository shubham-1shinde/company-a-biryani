
import { useEffect, useState } from 'react';
import { Eye, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { formatPrice, Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

const STATUSES = [
  'placed', 'confirmed', 'preparing', 'ready',
  'picked_up', 'delivered', 'cancelled',
];

function OrderDetails({ order, onClose }) {
  if (!order) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b flex justify-between items-center">
          <div>
            <h2 className="font-serif text-xl">Order Details</h2>
            <p className="text-xs text-neutral-500 mt-1">{order.orderId}</p>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-neutral-400">Customer</p>
              <p className="text-sm font-medium mt-1">
                {order.customer?.name || 'Unknown'}
              </p>
              <p className="text-xs text-neutral-500">
                {order.customer?.mobile || 'No mobile'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Outlet</p>
              <p className="text-sm font-medium mt-1">
                {order.outlet?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Order Status</p>
              <p className="text-sm capitalize mt-1">
                {order.status.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Order Date</p>
              <p className="text-sm mt-1">
                {new Date(order.placedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">Ordered Items</h3>
            <div className="border rounded-sm divide-y">
              {order.items?.map((item, index) => (
                <div key={index} className="p-3 flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      Qty: {item.quantity}
                      {item.portionOption ? ` · ${item.portionOption}` : ''}
                    </p>
                    {item.addOns?.map((addon, i) => (
                      <p key={i} className="text-xs text-neutral-400">
                        + {addon.name} ({formatPrice(addon.price)})
                      </p>
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-neutral-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>{formatPrice(order.gstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>-{formatPrice(order.discountAmount || 0)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-3">
              <span>Total</span>
              <span className="text-[#E85D35]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-neutral-400">Payment</p>
              <p className="capitalize mt-1">
                {order.payment?.method} · {order.payment?.status}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Delivery Type</p>
              <p className="capitalize mt-1">{order.deliveryType}</p>
            </div>
          </div>

          {order.deliveryType === 'delivery' && (
            <div>
              <p className="text-xs text-neutral-400 mb-1">Delivery Address</p>
              <p className="text-sm">
                {[
                  order.deliveryAddress?.street,
                  order.deliveryAddress?.city,
                  order.deliveryAddress?.pincode,
                ].filter(Boolean).join(', ') || 'Address unavailable'}
              </p>
            </div>
          )}

          {order.kitchenNotes && (
            <div>
              <p className="text-xs text-neutral-400">Kitchen Notes</p>
              <p className="text-sm mt-1">{order.kitchenNotes}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-neutral-400 mb-2">Status History</p>
            <div className="space-y-3">
              {order.statusHistory?.map((entry, i) => (
                <div key={i} className="border-l-2 border-[#E85D35] pl-3">
                  <p className="text-sm capitalize">
                    {entry.status?.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-neutral-500">{entry.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 text-white text-xs rounded-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [status, setStatus] = useState('');
  const [outlet, setOutlet] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);

    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      if (outlet) params.outlet = outlet;
      if (date) params.date = date;

      const [ordersRes, outletsRes] = await Promise.all([
        api.get('/admin/orders', { params }),
        api.get('/outlets'),
      ]);

      setOrders(ordersRes.data.data || []);
      setPagination(ordersRes.data.pagination || {});
      setOutlets(outletsRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, status, outlet, date]);

  const changeFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil((pagination.total || 0) / (pagination.limit || 20))
  );

  return (
    <AdminLayout title="Orders Management">
      <div className="mb-7">
        <h1 className="font-serif text-2xl">All Orders</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Manage and inspect customer orders.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 p-4 rounded-sm mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={status}
            onChange={(e) => changeFilter(setStatus)(e.target.value)}
            className="border border-neutral-300 px-3 py-2 text-xs rounded-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={outlet}
            onChange={(e) => changeFilter(setOutlet)(e.target.value)}
            className="border border-neutral-300 px-3 py-2 text-xs rounded-sm"
          >
            <option value="">All Outlets</option>
            {outlets.map((o) => (
              <option key={o._id} value={o._id}>{o.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => changeFilter(setDate)(e.target.value)}
            className="border border-neutral-300 px-3 py-2 text-xs rounded-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-sm text-neutral-400">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Outlet</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-neutral-50">
                    <td className="p-4 font-semibold">{order.orderId}</td>
                    <td className="p-4">
                      <p>{order.customer?.name || 'Unknown'}</p>
                      <p className="text-neutral-400 mt-1">
                        {order.customer?.mobile}
                      </p>
                    </td>
                    <td className="p-4">{order.outlet?.name || 'Unknown'}</td>
                    <td className="p-4 font-semibold">
                      {formatPrice(order.total)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-neutral-100 rounded-sm capitalize">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap text-neutral-500">
                      {new Date(order.placedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 hover:bg-neutral-100 rounded-sm"
                        title="View order"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Total: {pagination.total || 0} orders
          </p>
          <div className="flex items-center gap-3">
            <button
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border rounded-sm disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border rounded-sm disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </AdminLayout>
  );
}
