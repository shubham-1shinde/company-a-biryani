import React from 'react';

export const VegBadge = ({ isVeg }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs text-[10px] font-mono tracking-wider uppercase font-semibold border ${
    isVeg 
      ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200' 
      : 'bg-rose-50/90 text-rose-800 border-rose-200'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-xs ${isVeg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
    {isVeg ? 'Veg' : 'Non-Veg'}
  </span>
);

export const SpiceLevel = ({ level }) => {
  const map = { 
    mild: { dots: 1, color: 'bg-emerald-500', label: 'Mild' }, 
    medium: { dots: 2, color: 'bg-amber-500', label: 'Medium' }, 
    hot: { dots: 3, color: 'bg-[#E85D35]', label: 'Hot' }, 
    extra_hot: { dots: 4, color: 'bg-rose-600', label: 'Extra Hot' } 
  };
  const s = map[level] || map.medium;
  return (
    <span className="inline-flex items-center gap-1">
      {Array.from({ length: s.dots }).map((_, i) => (
        <span key={i} className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
      ))}
      <span className="text-[11px] font-mono text-neutral-500 ml-1">{s.label}</span>
    </span>
  );
};

export const OrderStatusBadge = ({ status, isLate }) => {
  const map = {
    placed:    { label: 'Order Placed', cls: 'bg-neutral-100 text-neutral-700 border-neutral-300' },
    confirmed: { label: 'Confirmed',    cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    preparing: { label: 'Preparing',    cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    ready:     { label: 'Ready for Pickup', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    picked_up: { label: 'Picked Up',    cls: 'bg-purple-50 text-purple-800 border-purple-200' },
    delivered: { label: 'Delivered',    cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    cancelled: { label: 'Cancelled',    cls: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-neutral-100 text-neutral-700 border-neutral-300' };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs text-[10px] font-mono uppercase tracking-wider font-semibold border ${
      isLate ? 'bg-rose-50 text-rose-800 border-rose-300' : s.cls
    }`}>
      {isLate && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />}
      {isLate ? 'Running Late' : s.label}
    </span>
  );
};

export const Spinner = ({ size = 'md', className = '' }) => {
  const sz = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-3' }[size];
  return (
    <div className={`${sz} border-[#E85D35] border-t-transparent rounded-full animate-spin ${className}`} />
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="bg-white border border-neutral-200/90 rounded-sm p-8 sm:p-12 text-center shadow-sm max-w-md mx-auto my-10 flex flex-col items-center">
    {Icon && (
      <div className="w-16 h-16 bg-[#E85D35]/10 text-[#E85D35] rounded-full flex items-center justify-center mb-5 border border-[#E85D35]/20 shadow-xs">
        <Icon size={28} />
      </div>
    )}
    <h3 className="text-2xl font-serif text-neutral-900 mb-2">{title}</h3>
    {description && (
      <p className="text-xs font-mono text-neutral-500 mb-6 leading-relaxed max-w-xs">
        {description}
      </p>
    )}
    {action}
  </div>
);

export const SkeletonCard = () => (
  <div className="bg-white border border-neutral-200/90 rounded-sm p-4 space-y-3 shadow-xs">
    <div className="skeleton rounded-xs h-40 w-full" />
    <div className="skeleton rounded-xs h-4 w-3/4" />
    <div className="skeleton rounded-xs h-3 w-1/2" />
    <div className="skeleton rounded-xs h-8 w-full mt-4" />
  </div>
);

export const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
export const formatTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });