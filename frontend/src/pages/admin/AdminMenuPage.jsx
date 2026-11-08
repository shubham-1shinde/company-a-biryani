
import { useState, useEffect } from 'react';
import {
  PlusCircle,
  Edit2,
  Eye,
  EyeOff,
  Search,
  ChefHat,
  X,
} from 'lucide-react';

import {
  VegBadge,
  Spinner,
  EmptyState,
  formatPrice,
} from '../../components/ui';

import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// ==========================================
// Item Modal
// ==========================================

function ItemModal({ item, outlets, onClose, onSaved }) {
  const isNew = !item?._id;

  const [form, setForm] = useState(
    item || {
      name: '',
      description: '',
      category: 'Biryani',
      price: '',
      isVeg: false,
      spiceLevel: 'medium',
      isAvailable: true,
      outlets: [],
      images: [],
    }
  );

  const [saving, setSaving] = useState(false);

  const set = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
      };

      const { data } = isNew
        ? await api.post('/menu', payload)
        : await api.put(`/menu/${item._id}`, payload);

      if (data.success) {
        toast.success(isNew ? 'Item created!' : 'Item updated!');
        onSaved(data.data, isNew);
        onClose();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Save failed'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 antialiased"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200/90 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 block mb-0.5">
              Menu CMS
            </span>

            <h2 className="font-serif text-xl font-medium text-neutral-900">
              {isNew ? 'Create New Item' : 'Edit Menu Item'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors rounded"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSave}
          className="p-6 space-y-4 text-xs font-mono"
        >
          <div className="grid grid-cols-2 gap-4">

            {/* Dish Name */}
            <div className="col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5">
                Dish Name *
              </label>

              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-sm px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#E85D35] transition-all"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5">
                Category *
              </label>

              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-sm px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#E85D35] transition-all"
              >
                {[
                  'Biryani',
                  'Haleem',
                  'Sides',
                  'Desserts',
                  'Beverages',
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5">
                Price (incl. 5% GST) *
              </label>

              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-sm px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#E85D35] transition-all"
                min="0"
                step="1"
                required
              />
            </div>

            {/* Spice Level */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5">
                Spice Level
              </label>

              <select
                value={form.spiceLevel}
                onChange={(e) => set('spiceLevel', e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-sm px-3 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#E85D35] transition-all"
              >
                {['mild', 'medium', 'hot', 'extra_hot'].map(
                  (level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Veg and Availability */}
            <div className="flex items-center gap-4 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isVeg}
                  onChange={(e) => set('isVeg', e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded-xs"
                />

                <span className="text-xs text-neutral-800">
                  Vegetarian
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => set('isAvailable', e.target.checked)}
                  className="w-4 h-4 accent-[#E85D35] rounded-xs"
                />

                <span className="text-xs text-neutral-800">
                  Live Item
                </span>
              </label>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-sm p-3 text-xs text-neutral-900 font-sans focus:outline-none focus:border-[#E85D35] transition-all resize-none"
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-1.5">
                Image URL
              </label>

              <input
                value={form.images?.[0] || ''}
                onChange={(e) => set('images', [e.target.value])}
                className="w-full bg-white border border-neutral-300 rounded-sm px-3.5 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#E85D35] transition-all"
                placeholder="https://..."
              />
            </div>

            {/* Available Outlets */}
            <div className="col-span-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-neutral-600 block mb-2">
                Available Outlets
              </label>

              <div className="flex flex-wrap gap-3 bg-neutral-50 border border-neutral-200 p-3 rounded-sm">
                {outlets.map((outlet) => {
                  const selected = (form.outlets || []).some(
                    (id) => String(id?._id || id) === outlet._id
                  );

                  return (
                    <label
                      key={outlet._id}
                      className="flex items-center gap-2 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => {
                          const ids = form.outlets || [];

                          set(
                            'outlets',
                            e.target.checked
                              ? [...ids, outlet._id]
                              : ids.filter(
                                  (id) =>
                                    String(id?._id || id) !== outlet._id
                                )
                          );
                        }}
                        className="w-3.5 h-3.5 accent-[#E85D35] rounded-xs"
                      />

                      <span className="text-neutral-700">
                        {outlet.name}
                      </span>
                    </label>
                  );
                })}

                {outlets.length === 0 && (
                  <p className="text-xs text-neutral-500">
                    No outlets available.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs uppercase font-semibold transition-colors rounded-sm"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-6 py-2.5 text-xs uppercase font-semibold transition-colors rounded-sm shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Save Item</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// Admin Menu Page
// ==========================================

export default function AdminMenuPage() {
  const [items, setItems] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch menu and outlets
  useEffect(() => {
    Promise.all([
      api.get('/menu/admin/all'),
      api.get('/outlets'),
    ])
      .then(([menuRes, outletRes]) => {
        setItems(menuRes.data.data || []);
        setOutlets(outletRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load menu data'))
      .finally(() => setLoading(false));
  }, []);

  // Update local menu state after saving
  const handleSaved = (item, isNew) => {
    setItems((prev) =>
      isNew
        ? [item, ...prev]
        : prev.map((i) => (i._id === item._id ? item : i))
    );
  };

  // Toggle menu item availability
  const handleToggleAvailability = async (itemId, current) => {
    try {
      await api.put(`/menu/${itemId}`, {
        isAvailable: !current,
      });

      setItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? { ...item, isAvailable: !current }
            : item
        )
      );

      toast.success(
        !current ? 'Item is now live' : 'Item hidden successfully'
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to update status'
      );
    }
  };

  // Toggle per-outlet availability
  const handleToggleOutletAvailability = async (itemId, outletId, currentlyAvailable) => {
    try {
      await api.patch(`/menu/${itemId}/availability`, {
        outletId,
        isAvailable: !currentlyAvailable,
      });

      setItems((prev) =>
        prev.map((item) => {
          if (item._id !== itemId) return item;
          const existing = item.outletAvailability || [];
          const hasEntry = existing.some((o) => o.outlet?.toString() === outletId);
          const updated = hasEntry
            ? existing.map((o) =>
                o.outlet?.toString() === outletId
                  ? { ...o, isAvailable: !currentlyAvailable }
                  : o
              )
            : [...existing, { outlet: outletId, isAvailable: !currentlyAvailable }];
          return { ...item, outletAvailability: updated };
        })
      );

      toast.success(!currentlyAvailable ? 'Item enabled at outlet' : 'Item paused at outlet');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update outlet availability');
    }
  };

  // Filter menu items
  const filtered = items.filter(
    (item) =>
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Menu Management">
      <main className="max-w-6xl mx-auto px-6 py-8 w-full">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-neutral-200 pb-5">
          <div>
            <h2 className="text-2xl font-serif text-neutral-900">
              Catalogue Management
            </h2>

            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mt-1">
              {filtered.length}{' '}
              {filtered.length === 1 ? 'Dish' : 'Dishes'} in menu
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />

              <input
                type="text"
                placeholder="Search catalogue..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-neutral-300 rounded-sm pl-8 pr-4 py-2 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#E85D35] transition-all w-48 sm:w-56"
              />
            </div>

            {/* Add Dish */}
            <button
              onClick={() => {
                setEditItem(null);
                setShowModal(true);
              }}
              className="bg-[#E85D35] hover:bg-[#d44c25] text-white px-5 py-2 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center gap-2"
            >
              <PlusCircle size={15} />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {/* Menu Data Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No menu items found"
            description="Try clearing your search query or add a new dish."
          />
        ) : (
          <div className="bg-white border border-neutral-200/90 rounded-sm shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                    <th className="px-5 py-3 font-semibold">
                      Dish
                    </th>

                    <th className="px-5 py-3 font-semibold hidden sm:table-cell">
                      Category
                    </th>

                    <th className="px-5 py-3 font-semibold text-right">
                      Price
                    </th>

                    <th className="px-5 py-3 font-semibold text-center hidden md:table-cell">
                      Type
                    </th>

                    <th className="px-5 py-3 font-semibold text-center">
                      Visibility
                    </th>

                    <th className="px-5 py-3 font-semibold text-center hidden lg:table-cell">
                      Outlet Stock
                    </th>

                    <th className="px-5 py-3 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-neutral-100 text-xs font-mono">
                  {filtered.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-neutral-50/80 transition-colors"
                    >
                      {/* Dish */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              className="w-10 h-10 rounded-xs object-cover bg-neutral-900 shrink-0 border border-neutral-200"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-xs shrink-0 flex items-center justify-center text-neutral-400">
                              <ChefHat size={16} />
                            </div>
                          )}

                          <div>
                            <p className="font-serif font-medium text-neutral-900 text-sm">
                              {item.name}
                            </p>

                            <p className="text-[11px] font-sans text-neutral-500 line-clamp-1 max-w-xs">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4 text-neutral-600 hidden sm:table-cell">
                        <span className="px-2 py-0.5 bg-neutral-100 rounded text-[10px] uppercase border border-neutral-200">
                          {item.category}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-4 text-right font-bold text-[#E85D35]">
                        {formatPrice(item.price)}
                      </td>

                      {/* Veg / Non-veg */}
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <VegBadge isVeg={item.isVeg} />
                      </td>

                      {/* Availability */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() =>
                            handleToggleAvailability(
                              item._id,
                              item.isAvailable
                            )
                          }
                          className={`inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-xs transition-all border ${
                            item.isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200'
                          }`}
                        >
                          {item.isAvailable ? (
                            <Eye size={12} />
                          ) : (
                            <EyeOff size={12} />
                          )}

                          <span>
                            {item.isAvailable ? 'Live' : 'Hidden'}
                          </span>
                        </button>
                      </td>

                      {/* Outlet Stock — per-outlet availability pills */}
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {outlets.map((outlet) => {
                            const outletEntry = item.outletAvailability?.find(
                              (o) => o.outlet?.toString() === outlet._id
                            );
                            const isAvailableAtOutlet = outletEntry ? outletEntry.isAvailable : true;
                            return (
                              <button
                                key={outlet._id}
                                onClick={() => handleToggleOutletAvailability(item._id, outlet._id, isAvailableAtOutlet)}
                                title={`${outlet.name}: ${isAvailableAtOutlet ? 'Available – click to pause' : 'Paused – click to enable'}`}
                                className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-xs border transition-all ${
                                  isAvailableAtOutlet
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAvailableAtOutlet ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                {outlet.name.split(' ')[0]}
                              </button>
                            );
                          })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditItem(item);
                            setShowModal(true);
                          }}
                          className="px-2.5 py-1 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors inline-flex items-center gap-1.5"
                        >
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Item Modal */}
      {showModal && (
        <ItemModal
          item={editItem}
          outlets={outlets}
          onClose={() => {
            setShowModal(false);
            setEditItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </AdminLayout>
  );
}
