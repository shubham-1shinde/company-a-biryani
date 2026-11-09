import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, ChevronRight, Flame } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Spinner } from '../components/ui';
import api from '../lib/api';
import { useSelector, useDispatch } from 'react-redux';
import { addItem } from '../redux/cartSlice';
import toast from 'react-hot-toast';


//const HERO_IMAGE = 'https://images.unsplash.com/photo-1563379091339-03246963d96d?w=1400&q=80';

export default function HomePage() {
  const user = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();
  const cart = useSelector(state => state.cart);

  const isAuthenticated = useSelector((state) => state.auth.status);

  const isCustomer = isAuthenticated && user?.role === 'customer';
  const SUGGESTIONS_CACHE_KEY = 'reorder_suggestions';

  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsFetched, setSuggestionsFetched] = useState(false);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const SUGGESTIONS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  const [hasCustomerLocation, setHasCustomerLocation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchOutlets = async () => {
      setLoading(true);

      try {
        const coordinates = user?.address?.coordinates;
        const lat = coordinates?.lat;
        const lng = coordinates?.lng;

        const hasValidLocation =
          lat !== undefined &&
          lat !== null &&
          lat !== '' &&
          lng !== undefined &&
          lng !== null &&
          lng !== '' &&
          Number.isFinite(Number(lat)) &&
          Number.isFinite(Number(lng)) &&
          Number(lat) >= -90 &&
          Number(lat) <= 90 &&
          Number(lng) >= -180 &&
          Number(lng) <= 180;

        if (isCustomer && hasValidLocation) {
          const { data } = await api.get('/outlets/nearby', {
            params: { lat, lng },
          });

          if (cancelled) return;

          const result = data.data;

          const sortedOutlets = [
            ...(result.deliverableOutlets || []),
            ...(result.nonDeliverableOutlets || []),
            ...(result.unknownOutlets || []),
          ];

          setOutlets(sortedOutlets);
          setHasCustomerLocation(true);
        } else {
          const { data } = await api.get('/outlets');

          if (cancelled) return;

          setOutlets(data.data || []);
          setHasCustomerLocation(false);
        }
      } catch (error) {
        console.error('Failed to fetch outlets:', error);

        try {
          const { data } = await api.get('/outlets');

          if (cancelled) return;

          setOutlets(data.data || []);
          setHasCustomerLocation(false);
        } catch (fallbackError) {
          console.error('Failed to fetch all outlets:', fallbackError);
          if (!cancelled) setOutlets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOutlets();

    return () => {
      cancelled = true;
    };
  }, [
    isCustomer,
    user?.address?.coordinates?.lat,
    user?.address?.coordinates?.lng,
  ]);


  useEffect(() => {
    if (!isCustomer) {
      setSuggestions([]);
      setSuggestionsFetched(false);
      return; 
    }

    const fetchSuggestions = async () => {
      const userId = user?._id || user?.id;
      const cacheKey = userId
        ? `reorder_suggestions_${userId}`
        : null;

      // 1. Check sessionStorage first
      if (cacheKey) {
        try {
          const cachedData = JSON.parse(
            sessionStorage.getItem(cacheKey) || 'null'
          );

          if (
            cachedData &&
            Array.isArray(cachedData.suggestions) &&
            Date.now() - cachedData.cachedAt < SUGGESTIONS_CACHE_TTL
          ) {
            console.log('Using cached reorder suggestions');

            setSuggestions(cachedData.suggestions);
            setSuggestionsFetched(true);
            setSuggestionsLoading(false);
            return; // Don't call backend
          }

          // Remove expired or invalid cache
          sessionStorage.removeItem(cacheKey);
        } catch (error) {
          sessionStorage.removeItem(cacheKey);
        }
      }

      // 2. Fetch from backend only if cache is unavailable
      try {
        setSuggestionsLoading(true);

        console.log('Fetching reorder suggestions from backend');

        const { data } = await api.get('/ai/reorder-suggestions');

        if (data.success && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setSuggestionsFetched(true);

          // 3. Save response in sessionStorage
          if (cacheKey) {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({
                suggestions: data.suggestions,
                cachedAt: Date.now()
              })
            );
          }
        }
      } catch (error) {
        console.error('Failed to fetch reorder suggestions:', error);
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [isCustomer, user?._id, user?.id]);

  
  const handleAddRecommendedItem = (item) => {
      const { outletId, outletName } = item;

      // Check whether the cart belongs to another outlet
      if (
          cart.outletId &&
          cart.outletId.toString() !== outletId.toString()
      ) {
          const confirmed = window.confirm(
              `Your cart contains items from ${cart.outletName}.\n\n` +
              `Adding this item will clear your existing cart and switch to ${outletName}.\n\n` +
              `Do you want to continue?`
          );

          if (!confirmed) return;
      }

      // Select the first portion option by default
      const selectedPortion = item.portionOptions?.[0];

      // Prepare item in the existing cart format
      const cartItem = {
          _id: item._id,
          name: item.name,
          category: item.category,
          isVeg: item.isVeg,
          portionOption: selectedPortion?.name || '',
          unitPrice: selectedPortion?.price ?? item.price,
          addOns: [],
          image: item.images?.[0] || ''
      };

      // Add to Redux cart
      dispatch(addItem({
          outletId,
          outletName,
          item: cartItem
      }));

      toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero */}
      <section className="relative h-[52vh] min-h-[320px] overflow-hidden">
        <img src='/company-a-biryani_hero.png' alt="Hyderabadi Biryani" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/85 via-neutral-900/30 to-transparent" />
        <div className="relative h-full flex flex-col justify-end pb-10 px-4 sm:px-8 max-w-5xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-400 uppercase tracking-widest mb-3">
            <Flame size={12} /> Hyderabad's finest
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3">
            Biryani, straight<br className="hidden sm:block" /> from the dum pot.
          </h1>
          <p className="text-neutral-300 text-base max-w-md mb-6">
            Order directly from Company A Biryani. Faster. Fresher. No commission markups.
          </p>
          <a href="#outlets" className="btn-primary w-fit text-base px-6 py-3">
            Order Now
          </a>
        </div>
      </section>

      {/* Trust bar */}
      <div className="bg-white border-y border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-6 justify-center sm:justify-between text-sm text-neutral-600">
          <span className="flex items-center gap-2"><span className="text-brand-600 font-bold">14</span> outlets across Hyderabad</span>
          <span className="flex items-center gap-2"><span className="text-brand-600 font-bold">60s</span> median checkout</span>
          <span className="flex items-center gap-2"><span className="text-brand-600 font-bold">5%</span> GST included in prices</span>
          <span className="flex items-center gap-2"><span className="text-brand-600 font-bold">Earn</span> points on every direct order</span>
        </div>
      </div>

      {/* Suggested Orders */}
      {isCustomer && suggestionsFetched && suggestions.length > 0 && (
          <section className="page-container">
              <div className="flex items-center justify-between mb-5">
                  <div>
                      <p className="section-heading mb-1">
                          Recommended for you
                      </p>
                      <p className="text-sm text-neutral-500">
                          Your favourites, suggested based on previous orders.
                      </p>
                  </div>

                  <Flame size={22} className="text-brand-600" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
              {suggestions.map((item) => (
                  <button
                      key={item._id}
                      type="button"
                      onClick={() => handleAddRecommendedItem(item)}
                      className="card p-4 flex items-center justify-between gap-3 w-full text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                      <div>
                          <h3 className="font-semibold text-neutral-900">
                              {item.name}
                          </h3>

                          {item.description && (
                              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                  {item.description}
                              </p>
                          )}

                          {item.price != null && (
                              <p className="text-sm font-semibold text-brand-600 mt-2">
                                  ₹{item.price}
                              </p>
                          )}

                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 mt-3">
                              + Add to cart
                          </span>
                      </div>

                      <Flame
                          size={20}
                          className="text-brand-600 shrink-0"
                      />
                  </button>
              ))}

              </div>
          </section>
      )}

      
      
      {/* Outlets */}
      <section id="outlets" className="page-container">
        <div className="mb-5">
          <p className="section-heading">Choose your outlet</p>

          <p className="text-sm text-neutral-500 mt-1">
            {hasCustomerLocation
              ? 'Outlets are sorted by distance from your delivery location.'
              : 'Explore our available outlets and choose where you want to order.'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : outlets.length === 0 ? (
          <p className="text-neutral-500 text-center py-16">
            No outlets available right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outlets.map((outlet) => {
              const isNearest =
                hasCustomerLocation &&
                outlet.isDeliverable === true &&
                outlet._id === outlets.find(
                  (o) => o.isDeliverable === true
                )?._id;

              const isNotDeliverable =
                hasCustomerLocation &&
                outlet.isDeliverable === false;

              const outletContent = (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className={`font-semibold text-neutral-900 ${
                        !isNotDeliverable ? 'group-hover:text-brand-600 transition-colors' : ''
                      }`}>
                        {outlet.name}
                      </h3>

                      <span className="text-xs text-neutral-500 uppercase tracking-wide">
                        {outlet.type === 'cloud_kitchen'
                          ? 'Cloud Kitchen'
                          : 'Dine & Takeaway'}
                      </span>
                    </div>

                    {!isNotDeliverable && (
                      <ChevronRight
                        size={18}
                        className="text-neutral-400 group-hover:text-brand-600 transition-colors mt-0.5"
                      />
                    )}
                  </div>

                  {/* Delivery status */}
                  {hasCustomerLocation && (
                    <div className="mb-3">
                      {isNearest ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          <MapPin size={12} />
                          Nearest · Deliverable
                        </span>
                      ) : isNotDeliverable ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-700 px-2.5 py-1 rounded-full">
                          Not Deliverable
                        </span>
                      ) : outlet.isDeliverable === true ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          Deliverable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">
                          Location unavailable
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <p className="text-xs text-neutral-500 flex items-start gap-1.5">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{outlet.address}</span>
                    </p>

                    {hasCustomerLocation &&
                      outlet.distanceKm != null && (
                        <p className="text-xs text-neutral-500">
                          {outlet.distanceKm} km away
                        </p>
                      )}

                    <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>Min prep: {outlet.minimumPrepTime} min</span>
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      FSSAI: {outlet.fssaiNumber}
                    </span>

                    <span className={`text-xs font-medium ${
                      isNotDeliverable ? 'text-red-600' : 'text-brand-600'
                    }`}>
                      {isNotDeliverable
                        ? 'Delivery Unavailable'
                        : 'View Menu →'}
                    </span>
                  </div>
                </>
              );

              return isNotDeliverable ? (
                <div
                  key={outlet._id}
                  className="card p-5 opacity-60 cursor-not-allowed"
                  aria-disabled="true"
                  title="This outlet does not deliver to your location"
                >
                  {outletContent}
                </div>
              ) : (
                <Link
                  key={outlet._id}
                  to={`/menu/${outlet.slug}`}
                  className={`card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${
                    isNearest ? 'ring-2 ring-brand-500' : ''
                  }`}
                >
                  {outletContent}
                </Link>
              );
            })}
          </div>
        )}
      </section>



      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center text-xs text-neutral-400 space-y-1">
          <p>© 2026 Company A Biryani. All prices include 5% GST as per Indian GST regulations.</p>
          <p>Customer data handled under the DPDP Act 2023. Marketing messages require opt-in.</p>
        </div>
      </footer>
    </div>
  );
}
