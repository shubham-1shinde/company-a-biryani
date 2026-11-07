import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, ArrowLeft, Filter, Search, X, Sparkles, Clock, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import { VegBadge, SpiceLevel, Spinner, SkeletonCard, EmptyState, formatPrice } from '../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  addItem,
  updateQty,
  selectCart,
  selectTotalItems,
} from '../redux/cartSlice';
import api from '../lib/api';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1563379091339-03246963d96d?w=400';

function MenuItemCard({ item, outletId, outletName }) {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const [selectedPortion, setSelectedPortion] = useState(item.portionOptions?.[0]?.name || null);

  // Determine outlet-specific availability
  const outletAvailOverride = item.outletAvailability?.find(
    (o) => o.outlet?.toString() === outletId?.toString()
  );
  const isOutOfStock = outletAvailOverride
    ? !outletAvailOverride.isAvailable
    : !item.isAvailable;

  const cartItem = cart.items.find(
    (i) => i._id === item._id && i.portionOption === selectedPortion
  );
  const qty = cartItem?.quantity || 0;

  const effectivePrice = selectedPortion
    ? item.portionOptions?.find((p) => p.name === selectedPortion)?.price ?? item.price
    : item.price;

const handleAdd = () => {
  if (isOutOfStock) return;
  if (cart.outletId && cart.outletId !== outletId) {
    if (!window.confirm('Your cart has items from another outlet. Start a new cart?')) {
      return;
    }
  }

  dispatch(
    addItem({
      outletId,
      outletName,
      item: {
        _id: item._id,
        name: item.name,
        portionOption: selectedPortion,
        unitPrice: effectivePrice,
        category: item.category,
      },
    })
  );

  toast.success(`${item.name} added to cart`, { duration: 2000 });
};

  return (
    <div className={`bg-white border rounded-sm overflow-hidden group transition-all duration-300 flex flex-col justify-between ${isOutOfStock ? 'border-neutral-200 opacity-70' : 'border-neutral-200/90 hover:border-neutral-400 hover:shadow-lg'}`}>
      <div>
        {/* Item Image & Badges */}
        <div className="relative h-44 sm:h-48 overflow-hidden bg-neutral-900">
          <img
            src={item.images?.[0] || PLACEHOLDER}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-500 opacity-95 ${!isOutOfStock ? 'group-hover:scale-105' : 'grayscale'}`}
            onError={(e) => { e.target.src = PLACEHOLDER; }}
          />
          <div className="absolute top-3 left-3 z-10">
            <VegBadge isVeg={item.isVeg} />
          </div>
          {item.tags?.includes('bestseller') && !isOutOfStock && (
            <div className="absolute top-3 right-3 bg-[#E85D35] text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-xs uppercase tracking-wider shadow-sm">
              Bestseller
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40">
              <span className="bg-neutral-900/80 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest border border-white/20">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-serif font-medium text-neutral-900 text-base leading-snug group-hover:text-[#E85D35] transition-colors">
              {item.name}
            </h3>
            <span className="font-mono font-bold text-[#E85D35] text-sm shrink-0">
              {formatPrice(effectivePrice)}
            </span>
          </div>

          <div className="mb-2">
            <SpiceLevel level={item.spiceLevel} />
          </div>

          <p className="text-xs font-sans text-neutral-600 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>

          {/* Portion Selector Pills */}
          {item.portionOptions?.length > 1 && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap gap-1.5">
              {item.portionOptions.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSelectedPortion(p.name)}
                  className={`px-2.5 py-1 rounded-sm text-[11px] font-mono transition-all border ${
                    selectedPortion === p.name
                      ? 'border-[#E85D35] bg-[#E85D35]/10 text-[#E85D35] font-semibold'
                      : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 bg-neutral-50'
                  }`}
                >
                  {p.name.split('(')[0].trim()} · {formatPrice(p.price)}
                </button>
              ))}
            </div>
          )}

          {/* Allergens Warning */}
          {item.allergens?.length > 0 && (
            <p className="text-[10px] font-mono text-neutral-400 mt-2">
              Contains: {item.allergens.join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Add / Quantity Control */}
      <div className="p-4 pt-0">
        {isOutOfStock ? (
          <div className="w-full bg-neutral-100 border border-neutral-200 text-neutral-400 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold text-center cursor-not-allowed">
            Currently Unavailable
          </div>
        ) : qty === 0 ? (
          <button 
            onClick={handleAdd} 
            className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add to Order</span>
          </button>
        ) : (
          <div className="flex items-center justify-between bg-orange-50/60 border border-[#E85D35]/30 rounded-sm px-3 py-1.5">
            <button 
              onClick={() =>
                dispatch(
                  updateQty({
                    itemId: item._id,
                    portionOption: selectedPortion,
                    qty: qty - 1,
                  })
                )
              }
              className="text-[#E85D35] hover:text-[#d44c25] p-1 transition-colors"
            >
              <Minus size={15} />
            </button>
            <span className="font-mono font-bold text-[#E85D35] text-sm min-w-[24px] text-center">
              {qty}
            </span>
            <button 
              onClick={() =>
                dispatch(
                  updateQty({
                    itemId: item._id,
                    portionOption: selectedPortion,
                    qty: qty + 1,
                  })
                )
              }
              className="text-[#E85D35] hover:text-[#d44c25] p-1 transition-colors"
            >
              <Plus size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MenuPage() {
  const { outletSlug } = useParams();
  const navigate = useNavigate();
  const totalItems = useSelector(selectTotalItems);
  const [outlet, setOutlet] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const categoryRefs = useRef({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const outletRes = await api.get('/outlets');
        const found = outletRes.data.data?.find((o) => o.slug === outletSlug);
        if (!found) { navigate('/'); return; }
        setOutlet(found);

        const [menuRes] = await Promise.all([
          api.get(`/menu?outletId=${found._id}`),
        ]);

        const menuData = menuRes.data.data || [];
        setItems(menuData);

        const cats = [...new Set(menuData.map((m) => m.category))];
        setCategories(cats);
        setActiveCategory(cats[0] || '');
      } catch {
        toast.error('Failed to load menu');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [outletSlug, navigate]);

  const filtered = items.filter((item) => {
    if (vegOnly && !item.isVeg) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const byCat = categories.reduce((acc, cat) => {
    acc[cat] = filtered.filter((i) => i.category === cat);
    return acc;
  }, {});

  const scrollToCategory = (cat) => {
    setActiveCategory(cat);
    categoryRefs.current[cat]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased">
      <Navbar />

      {/* Outlet Details Banner */}
      <div className="bg-white border-b border-neutral-200/80">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors mb-4 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span>All Outlets</span>
          </button>

          {loading ? (
            <div className="h-8 w-56 bg-neutral-200 rounded animate-pulse" />
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-500 bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded inline-block mb-2">
                  {outlet?.type === 'cloud_kitchen' ? 'Cloud Kitchen' : 'Dine & Takeaway'}
                </span>
                <h1 className="text-3xl font-serif text-neutral-900 tracking-tight">{outlet?.name}</h1>
                <p className="text-xs font-sans text-neutral-500 mt-1 max-w-lg leading-relaxed flex items-center gap-1.5">
                  <MapPin size={13} className="shrink-0 text-neutral-400" />
                  <span>{outlet?.address}</span>
                </p>
              </div>

              <div className="text-left sm:text-right text-xs font-mono text-neutral-500 space-y-1 bg-neutral-50 sm:bg-transparent p-3 sm:p-0 border sm:border-0 border-neutral-200 rounded-sm">
                <p className="flex sm:justify-end items-center gap-1.5">
                  <Clock size={13} className="text-[#E85D35]" />
                  <span>Min Prep: <strong className="text-neutral-900">{outlet?.minimumPrepTime} mins</strong></span>
                </p>
                <p className="text-[11px] text-neutral-400">FSSAI: {outlet?.fssaiNumber}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Sticky Search + Category Controls */}
      <div className="sticky top-16 z-30 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-neutral-200/80 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 space-y-3">
          
          {/* Search bar & Veg Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search dishes or ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-sm pl-10 pr-9 py-2 text-xs font-mono text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#E85D35] focus:ring-1 focus:ring-[#E85D35] transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              onClick={() => setVegOnly(!vegOnly)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-sm border text-xs font-mono transition-all ${
                vegOnly 
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-semibold' 
                  : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-xs border-2 ${
                vegOnly ? 'border-emerald-600 bg-emerald-600' : 'border-emerald-600'
              }`} />
              <span>Veg Only</span>
            </button>
          </div>

          {/* Category Tabs Scrollbar */}
          {!loading && categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-sm text-xs font-mono transition-all border ${
                    activeCategory === cat
                      ? 'bg-neutral-900 border-neutral-900 text-white font-medium'
                      : 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Main Menu Items Feed */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center bg-white border border-neutral-200/90 rounded-sm p-8">
            <h3 className="text-xl font-serif text-neutral-900 mb-2">No menu items found</h3>
            <p className="text-xs font-mono text-neutral-500 mb-6">
              {search ? `No items matching "${search}"` : 'No dishes fit the selected filter options.'}
            </p>
            <button 
              className="bg-neutral-900 hover:bg-black text-white px-5 py-2.5 rounded-sm font-mono text-xs uppercase tracking-wider" 
              onClick={() => { setSearch(''); setVegOnly(false); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          categories.map((cat) =>
            byCat[cat]?.length > 0 ? (
              <div key={cat} ref={(el) => (categoryRefs.current[cat] = el)} className="mb-12 scroll-mt-36">
                <div className="flex items-baseline gap-3 mb-6 border-b border-neutral-200 pb-3">
                  <h2 className="text-2xl font-serif text-neutral-900">{cat}</h2>
                  <span className="text-xs font-mono text-neutral-400">
                    {byCat[cat].length} {byCat[cat].length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {byCat[cat].map((item) => (
                    <MenuItemCard 
                      key={item._id} 
                      item={item} 
                      outletId={outlet?._id} 
                      outletName={outlet?.name} 
                    />
                  ))}
                </div>
              </div>
            ) : null
          )
        )}
      </main>

      {/* Floating View Cart Sticky Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xs px-4">
          <Link 
            to="/cart" 
            className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-xl shadow-orange-950/30 flex items-center justify-center gap-3 border border-orange-400/30 group"
          >
            <ShoppingBag size={16} />
            <span>View Cart ({totalItems})</span>
          </Link>
        </div>
      )}
    </div>
  );
}