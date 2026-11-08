
import { useEffect, useState } from 'react';
import { Store, MapPin, Phone, Clock, ChefHat } from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function AdminOutletsPage() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOutlet, setSelectedOutlet] = useState(null);

  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        const { data } = await api.get('/outlets');
        setOutlets(data.data || []);
      } catch {
        toast.error('Failed to load outlets');
      } finally {
        setLoading(false);
      }
    };

    fetchOutlets();
  }, []);

  const formatHours = (hours) => {
    if (hours.isClosed) return 'Closed';

    return `${hours.open || '--:--'} - ${hours.close || '--:--'}`;
  };

  return (
    <AdminLayout title="Outlet Management">
      <div className="mb-8">
        <h1 className="font-serif text-2xl">Outlet Overview</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Monitor your restaurant outlets and cloud kitchens.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : outlets.length === 0 ? (
        <div className="text-center py-20 text-sm text-neutral-400">
          No outlets found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
            <div className="bg-white border p-5 rounded-sm">
              <Store className="text-[#E85D35]" size={20} />
              <p className="text-2xl font-semibold mt-3">{outlets.length}</p>
              <p className="text-xs text-neutral-500">Active Outlets</p>
            </div>
            <div className="bg-white border p-5 rounded-sm">
              <ChefHat className="text-[#E85D35]" size={20} />
              <p className="text-2xl font-semibold mt-3">
                {outlets.filter((o) => o.type === 'cloud_kitchen').length}
              </p>
              <p className="text-xs text-neutral-500">Cloud Kitchens</p>
            </div>
            <div className="bg-white border p-5 rounded-sm">
              <Store className="text-[#E85D35]" size={20} />
              <p className="text-2xl font-semibold mt-3">
                {outlets.filter((o) => o.type === 'outlet').length}
              </p>
              <p className="text-xs text-neutral-500">Restaurant Outlets</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {outlets.map((outlet) => (
              <div
                key={outlet._id}
                className="bg-white border border-neutral-200 rounded-sm p-5"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-serif text-lg">{outlet.name}</h3>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider mt-1">
                      {outlet.type?.replace('_', ' ')}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 bg-emerald-50 text-emerald-700 rounded-sm">
                    Active
                  </span>
                </div>

                <div className="space-y-3 mt-5 text-xs text-neutral-600">
                  <div className="flex gap-2">
                    <MapPin size={15} className="shrink-0 text-[#E85D35]" />
                    <span>{outlet.address}, {outlet.city}</span>
                  </div>

                  <div className="flex gap-2">
                    <Phone size={15} className="shrink-0 text-[#E85D35]" />
                    <span>{outlet.phone || 'Not provided'}</span>
                  </div>

                  <div className="flex gap-2">
                    <Clock size={15} className="shrink-0 text-[#E85D35]" />
                    <span>{outlet.minimumPrepTime} min preparation</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-neutral-100">
                  <div>
                    <p className="text-[10px] text-neutral-400">Delivery Radius</p>
                    <p className="font-semibold text-sm mt-1">
                      {outlet.deliveryRadius} km
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-neutral-400">Current Load</p>
                    <p className="font-semibold text-sm mt-1">
                      {outlet.currentLoad} orders
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedOutlet(outlet)}
                  className="mt-5 w-full border border-neutral-200 py-2 text-xs hover:bg-neutral-50"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedOutlet && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedOutlet(null)}
        >
          <div
            className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-xl">{selectedOutlet.name}</h2>
              <button onClick={() => setSelectedOutlet(null)}>✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <p><strong>Slug:</strong> {selectedOutlet.slug}</p>
              <p><strong>Type:</strong> {selectedOutlet.type}</p>
              <p><strong>Address:</strong> {selectedOutlet.address}</p>
              <p><strong>City:</strong> {selectedOutlet.city}</p>
              <p><strong>Phone:</strong> {selectedOutlet.phone || 'N/A'}</p>
              <p><strong>FSSAI:</strong> {selectedOutlet.fssaiNumber}</p>
              <p><strong>Delivery Radius:</strong> {selectedOutlet.deliveryRadius} km</p>
              <p><strong>Minimum Prep Time:</strong> {selectedOutlet.minimumPrepTime} min</p>
              <p><strong>Current Load:</strong> {selectedOutlet.currentLoad}</p>
            </div>

            <h3 className="font-semibold mt-6 mb-3">Operating Hours</h3>

            <div className="space-y-2">
              {(selectedOutlet.operatingHours || []).map((hours) => (
                <div key={hours.day} className="flex justify-between text-xs border-b pb-2">
                  <span>
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][hours.day]}
                  </span>
                  <span>{formatHours(hours)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedOutlet(null)}
              className="mt-6 w-full bg-neutral-900 text-white py-2.5 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
