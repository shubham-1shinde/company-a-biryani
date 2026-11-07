import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import { EmptyState, formatPrice } from '../components/ui';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateQty,
  removeItem,
  clearCart,
  selectCart,
  selectTotalPrice,
} from '../redux/cartSlice';

export default function CartPage() {
  const dispatch = useDispatch();

  const cart = useSelector(selectCart);
  const totalPrice = useSelector(selectTotalPrice);
  const navigate = useNavigate();

  const gstAmount = Math.round((totalPrice * 5) / 105 * 100) / 100;

  if (!cart.items || cart.items.length === 0) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-20 my-auto text-center">
        <div className="w-16 h-16 bg-[#E85D35]/10 text-[#E85D35] rounded-full flex items-center justify-center mx-auto mb-5 border border-[#E85D35]/20">
          <ShoppingBag size={28} />
        </div>
        <h1 className="text-3xl font-serif text-neutral-900 mb-2">
          Your cart is empty
        </h1>
        <p className="text-sm font-mono text-neutral-500 mb-8 max-w-sm mx-auto">
          Explore our menu to add authentic dum biryanis and starters.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#E85D35] hover:bg-[#d44c25] text-white px-7 py-3 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md group"
        >
          <span>Browse Outlets & Menu</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-neutral-900 transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Menu</span>
        </button>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-neutral-200 pb-5 mb-8 gap-2">
          <div>
            <h1 className="text-3xl font-serif text-neutral-900">Your Cart</h1>
            <p className="text-xs font-mono text-neutral-500 uppercase tracking-widest mt-1">
              {cart.outletName || 'Direct Kitchen Dispatch'}
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            {cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'} selected
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              {cart.items.map((item, idx) => (
                <div
                  key={`${item._id}-${item.portionOption}-${idx}`}
                  className="bg-white border border-neutral-200/90 rounded-sm p-4 sm:p-5 flex items-center justify-between gap-4 shadow-sm hover:border-neutral-300 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-medium text-neutral-900 text-base sm:text-lg truncate">
                      {item.name}
                    </h3>

                    {item.portionOption && (
                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-neutral-100 text-neutral-600 rounded border border-neutral-200 mt-1">
                        {item.portionOption}
                      </span>
                    )}

                    <p className="text-sm font-mono font-semibold text-[#E85D35] mt-2">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>

                  {/* Quantity Controls & Remove */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center border border-neutral-200 rounded-sm bg-neutral-50">
                      <button
                        onClick={() =>
                          dispatch(
                            updateQty({
                              itemId: item._id,
                              portionOption: item.portionOption,
                              qty: item.quantity - 1,
                            })
                          )
                        }
                        className="px-2.5 py-1.5 hover:bg-neutral-200/60 text-neutral-700 transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>

                      <span className="px-3 font-mono font-bold text-neutral-900 text-xs min-w-[32px] text-center">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          dispatch(
                            updateQty({
                              itemId: item._id,
                              portionOption: item.portionOption,
                              qty: item.quantity + 1,
                            })
                          )
                        }
                        className="px-2.5 py-1.5 hover:bg-neutral-200/60 text-neutral-700 transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        dispatch(
                          removeItem({
                            itemId: item._id,
                            portionOption: item.portionOption,
                          })
                        )
                      }
                      className="text-neutral-400 hover:text-red-600 transition-colors p-1.5 rounded hover:bg-red-50"
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => dispatch(clearCart())}
                className="text-xs font-mono text-neutral-400 hover:text-red-600 transition-colors"
              >
                Clear entire cart
              </button>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-neutral-200/90 rounded-sm p-6 sticky top-24 shadow-sm">
              <h2 className="font-serif text-xl text-neutral-900 mb-4 border-b border-neutral-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal (incl. GST)</span>
                  <span className="text-neutral-900 font-medium">
                    {formatPrice(totalPrice)}
                  </span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>GST included (5%)</span>
                  <span>{formatPrice(gstAmount)}</span>
                </div>

                <div className="flex justify-between text-neutral-600">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-700 font-semibold uppercase">
                    Free
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-200 my-4" />

              <div className="flex justify-between font-serif text-neutral-900 text-lg mb-6">
                <span>Total Amount</span>
                <span className="font-mono font-bold text-[#E85D35]">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-center gap-2 text-[11px] font-mono text-neutral-400">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>All prices include 5% GST</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}