import { useState, useEffect, useCallback } from 'react';
import { Clock, AlertTriangle, Wifi, WifiOff, LogOut, ChefHat, Sparkles, ArrowRight, CalendarDays, Users } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/authSlice';
import { connectSocket } from '../../lib/socket';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_ORDER = ['placed', 'confirmed', 'preparing', 'ready'];
const NEXT_STATUS = { placed: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'picked_up' };
const NEXT_LABEL  = { placed: 'Confirm Order', confirmed: 'Start Prep', preparing: 'Mark Ready', ready: 'Hand Off Order' };

const STATUS_STYLES = {
  placed: 'border-neutral-800 bg-neutral-900/90 text-neutral-300',
  confirmed: 'border-blue-900/60 bg-blue-950/30 text-blue-300',
  preparing: 'border-amber-900/60 bg-amber-950/30 text-amber-300',
  ready: 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300',
};

const STATUS_HEADER_STYLES = {
  placed: 'bg-neutral-800/80 text-neutral-300 border-b border-neutral-700/50',
  confirmed: 'bg-blue-900/60 text-blue-200 border-b border-blue-800/50',
  preparing: 'bg-amber-800/60 text-amber-100 border-b border-amber-700/50',
  ready: 'bg-emerald-800/60 text-emerald-100 border-b border-emerald-700/50',
};

function OrderTimer({ placedAt, promisedAt, isLate }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(placedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [placedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const remaining = Math.floor((new Date(promisedAt).getTime() - Date.now()) / 60000);

  return (
    <div className={`text-center py-1 rounded bg-neutral-950/60 border ${isLate ? 'border-red-900/80 text-red-400' : 'border-neutral-800/60 text-neutral-300'}`}>
      <div className={`font-mono text-2xl font-bold tracking-tight ${isLate ? 'animate-pulse text-red-400' : 'text-neutral-100'}`}>
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="text-[11px] font-mono mt-0.5 text-neutral-400">
        {isLate ? `OVERDUE BY ${Math.abs(remaining)} MIN` : remaining > 0 ? `${remaining} min remaining` : 'Due now'}
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusUpdate }) {
  const [updating, setUpdating] = useState(false);

  const handleAdvance = async () => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await api.patch(`/orders/${order.orderId}/status`, { status: nextStatus });
      onStatusUpdate(order.orderId, nextStatus);
    } catch {
      toast.error('Failed to update status');
    } finally { 
      setUpdating(false); 
    }
  };

  const isLate = order.isLate || (order.status !== 'ready' && new Date(order.promisedAt) < new Date());

  return (
    <div className={`rounded-md border ${isLate ? 'border-red-600/90 bg-red-950/40 shadow-lg shadow-red-950/50' : STATUS_STYLES[order.status]} flex flex-col justify-between overflow-hidden transition-all duration-200`}>
      <div>
        {/* Card Header */}
        <div className={`px-3.5 py-2 flex items-center justify-between ${isLate ? 'bg-red-900/80 text-white' : STATUS_HEADER_STYLES[order.status]}`}>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm tracking-wide">#{order.orderId}</span>
            {isLate && <AlertTriangle size={15} className="text-red-200 animate-pulse shrink-0" />}
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-90">
            {order.status.replace('_', ' ')}
          </span>
        </div>

        {/* Timer Block */}
        <div className="p-3">
          <OrderTimer placedAt={order.placedAt} promisedAt={order.promisedAt} isLate={isLate} />
        </div>

        {/* Customer Detail */}
        <div className="px-3.5 py-1.5 border-t border-b border-white/5 bg-white/[0.02] flex justify-between items-center text-xs">
          <span className="text-neutral-400 font-medium truncate max-w-[150px]">{order.customer?.name || 'Customer'}</span>
          <span className="text-[10px] font-mono text-neutral-500">{order.items?.length || 0} Items</span>
        </div>

        {/* Items List */}
        <div className="p-3.5 space-y-2.5 max-h-[220px] overflow-y-auto">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs">
              <span className="text-[#E85D35] font-mono font-bold text-sm leading-none bg-[#E85D35]/10 px-1.5 py-0.5 rounded border border-[#E85D35]/20">
                {item.quantity}×
              </span>
              <div className="space-y-0.5">
                <p className="text-neutral-100 font-medium leading-snug">{item.name}</p>
                {item.portionOption && (
                  <p className="text-neutral-400 text-[11px] font-mono">{item.portionOption.split('(')[0].trim()}</p>
                )}
                {item.addOns?.length > 0 && (
                  <p className="text-neutral-500 text-[11px]">+ {item.addOns.map((a) => a.name).join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {/* AI Prep Estimate */}
        {order.aiEstimatedPrepTime && (
          <div className="px-3.5 py-1.5 border-t border-white/5 text-[10px] font-mono text-neutral-400 flex items-center justify-between bg-black/20">
            <span className="flex items-center gap-1 text-amber-400/90"><Sparkles size={11} /> AI Est: {order.aiEstimatedPrepTime}m</span>
            <span>Target: {order.prepTimeEstimate}m</span>
          </div>
        )}

        {/* Action Button */}
        {NEXT_STATUS[order.status] && (
          <div className="p-3 pt-2 border-t border-white/5">
            <button
              onClick={handleAdvance}
              disabled={updating}
              className={`w-full py-2.5 rounded-sm text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2 ${
                order.status === 'preparing' 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/50'
                  : 'bg-[#E85D35] hover:bg-[#d44c25] text-white shadow-md shadow-orange-950/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updating ? 'Updating...' : (
                <>
                  <span>{NEXT_LABEL[order.status]}</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KitchenDisplayPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userData);

  const logout = () => {
    dispatch(logoutUser());
  };

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [activeTab, setActiveTab] = useState('regular');
  const [partyOrders, setPartyOrders] = useState([]);
  const [partyLoading, setPartyLoading] = useState(false);

  const outletId = user?.outlet?._id || user?.outlet;

  const loadOrders = useCallback(async () => {
    if (!outletId) return;

    try {
      const { data } = await api.get(
        `/orders/outlet/${outletId}?status=placed,confirmed,preparing,ready`
      );

      const active = (data.data || []).filter((o) =>
        ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );

      setOrders(active);
      setLastSync(new Date());
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    loadOrders();

    const interval = setInterval(loadOrders, 30000);

    const socket = connectSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    if (outletId) {
      socket.emit('join-outlet', outletId);
    }

    socket.on('new-order', (order) => {
      setOrders((prev) => {
        if (prev.find((o) => o.orderId === order.orderId)) {
          return prev;
        }

        toast('New Order #' + order.orderId, {
          icon: '🍛',
          duration: 6000,
        });

        return [order, ...prev];
      });
    });

    socket.on('order-late-alert', (data) => {
      toast.error(
        `⚠️ Ticket #${data.orderId} is late by ${data.minutesLate} min`,
        { duration: 10000 }
      );
    });

    return () => {
      clearInterval(interval);
      socket.off('new-order');
      socket.off('order-late-alert');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [outletId, loadOrders]);

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders((prev) => {
      if (['picked_up', 'delivered', 'cancelled'].includes(newStatus)) {
        return prev.filter((o) => o.orderId !== orderId);
      }

      return prev.map((o) =>
        o.orderId === orderId ? { ...o, status: newStatus } : o
      );
    });
  };

  const loadPartyOrders = useCallback(async () => {
    if (!outletId) return;
    setPartyLoading(true);
    try {
      // Kitchen staff uses the outlet-specific party orders endpoint (admin view filtered by outlet)
      const { data } = await api.get(`/party-orders/admin?outletId=${outletId}&status=confirmed,preparing&limit=50`);
      setPartyOrders(data.data || []);
    } catch {
      // silent fail — kitchen role may not have access in some configurations
    } finally {
      setPartyLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    if (activeTab === 'party') loadPartyOrders();
  }, [activeTab, loadPartyOrders]);

  const byStatus = STATUS_ORDER.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s);
    return acc;
  }, {});

  const COLUMN_LABELS = {
    placed: 'New',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-neutral-100 font-sans antialiased flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/90 px-6 py-3 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#E85D35] rounded-sm flex items-center justify-center text-white shadow-sm">
            <ChefHat size={18} />
          </div>
          <div>
            <h1 className="font-serif text-lg font-medium tracking-tight text-white leading-tight">
              KDS · {user?.outlet?.name || user?.name || 'Kitchen Display'}
            </h1>
            {lastSync && (
              <p className="text-[11px] font-mono text-neutral-400">
                Synced at {lastSync.toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 flex items-center gap-2">
            {connected ? (
              <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                <Wifi size={13} /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-mono text-red-400">
                <WifiOff size={13} /> Offline
              </span>
            )}
          </div>

          <span className="text-xs font-mono text-neutral-400 border-l border-neutral-800 pl-4 hidden sm:inline">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>

          <button 
            onClick={logout} 
            title="Sign out"
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Tab switcher */}
      <div className="bg-neutral-950 border-b border-neutral-800/80 px-4 flex gap-1">
        <button
          onClick={() => setActiveTab('regular')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${
            activeTab === 'regular'
              ? 'text-white border-b-2 border-[#E85D35]'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Regular Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('party')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono uppercase tracking-widest transition-colors ${
            activeTab === 'party'
              ? 'text-white border-b-2 border-[#E85D35]'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <CalendarDays size={12} /> Party Orders
        </button>
      </div>

      {/* Regular Orders Grid */}
      {activeTab === 'regular' && (
        loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#E85D35] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto">
            {STATUS_ORDER.map((status) => (
              <div key={status} className="flex flex-col gap-3 min-w-0 bg-neutral-950/40 border border-neutral-800/40 p-3 rounded-md">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800/80">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-neutral-400 font-medium">
                    {COLUMN_LABELS[status]}
                  </h2>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    byStatus[status].length > 0
                      ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                      : 'text-neutral-600'
                  }`}>
                    {byStatus[status].length}
                  </span>
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {byStatus[status].length === 0 ? (
                    <div className="flex-1 min-h-[140px] flex items-center justify-center border border-dashed border-neutral-800/60 rounded-sm">
                      <p className="text-xs font-mono text-neutral-600 uppercase tracking-wider">No tickets</p>
                    </div>
                  ) : (
                    byStatus[status].map((order) => (
                      <OrderCard key={order.orderId} order={order} onStatusUpdate={handleStatusUpdate} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </main>
        )
      )}

      {/* Party Orders Panel (read-only) */}
      {activeTab === 'party' && (
        <div className="flex-1 overflow-y-auto p-4">
          {partyLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#E85D35] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : partyOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-neutral-800/60 rounded-md">
              <CalendarDays size={28} className="text-neutral-600 mb-3" />
              <p className="text-xs font-mono text-neutral-500 uppercase tracking-wider">No confirmed party orders</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {partyOrders.map((po) => (
                <div key={po._id} className={`border rounded-md overflow-hidden flex flex-col ${
                  po.status === 'preparing'
                    ? 'border-purple-900/60 bg-purple-950/30'
                    : 'border-blue-900/60 bg-blue-950/20'
                }`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                    po.status === 'preparing'
                      ? 'bg-purple-900/60 text-purple-100 border-purple-800/50'
                      : 'bg-blue-900/50 text-blue-100 border-blue-800/50'
                  }`}>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} />
                      <span className="font-mono font-bold text-sm">{po.partyOrderId}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">{po.status}</span>
                  </div>

                  <div className="p-4 space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs font-mono">
                      <span className="text-neutral-400">Event</span><span className="text-neutral-100">{po.eventType}</span>
                      <span className="text-neutral-400">Date</span>
                      <span className="text-neutral-100">{new Date(po.eventDateTime).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="text-neutral-400">Time</span>
                      <span className="text-neutral-100">{new Date(po.eventDateTime).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-neutral-400 flex items-center gap-1"><Users size={11} /> Guests</span>
                      <span className="text-neutral-100 font-bold">{po.guestCount}</span>
                    </div>

                    <div className="border-t border-white/5 pt-3">
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">Items to Prepare</p>
                      <div className="space-y-1.5">
                        {po.items?.map((item, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <span className="text-[#E85D35] font-mono font-bold bg-[#E85D35]/10 px-1.5 py-0.5 rounded border border-[#E85D35]/20 shrink-0">
                              {item.quantity}×
                            </span>
                            <span className="text-neutral-200 font-medium">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {po.specialInstructions && (
                      <div className="bg-amber-950/40 border border-amber-900/30 rounded-sm px-3 py-2 text-xs font-mono text-amber-200/80">
                        <span className="text-amber-400 font-bold">Note: </span>{po.specialInstructions}
                      </div>
                    )}

                    {po.contactNumber && (
                      <p className="text-[11px] font-mono text-neutral-500">Contact: {po.contactNumber}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}