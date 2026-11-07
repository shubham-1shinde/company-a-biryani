import { Link } from 'react-router-dom';
import { ChefHat, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-neutral-900 font-sans antialiased flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-16 my-auto">
        <div className="max-w-md w-full bg-white border border-neutral-200/90 rounded-sm p-8 sm:p-10 text-center shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#E85D35]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-16 h-16 bg-[#E85D35]/10 text-[#E85D35] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E85D35]/20 shadow-xs">
            <ChefHat size={30} />
          </div>

          {/* Error Details */}
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[#E85D35] bg-orange-50 border border-orange-200 px-3 py-1 rounded-full inline-block mb-3">
            Error 404
          </span>

          <h1 className="text-4xl font-serif text-neutral-900 tracking-tight mb-2">
            Page Not Found
          </h1>

          <p className="text-xs font-mono text-neutral-500 max-w-xs mx-auto mb-8 leading-relaxed">
            This page is out of stock or might have been moved to another location.
          </p>

          {/* Action Link */}
          <Link 
            to="/" 
            className="w-full bg-[#E85D35] hover:bg-[#d44c25] text-white py-3.5 rounded-sm font-mono text-xs uppercase tracking-wider font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group"
          >
            <span>Back to Menu</span>
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white py-4 text-center">
        <p className="text-[11px] font-mono text-neutral-400">
          © 2026 Company A Biryani · Direct Dum Dispatch
        </p>
      </footer>
    </div>
  );
}