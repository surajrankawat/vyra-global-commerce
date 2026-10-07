import React from 'react';
import {
  Package,
  Layers,
  Cpu,
  Shirt,
  Cog,
  Utensils,
  Briefcase,
  Gem,
  Truck,
  Sparkles,
  Building2,
} from 'lucide-react';

interface MediaFallbackProps {
  category?: string;
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

/**
 * High-fidelity category-aware visual placeholder.
 * Never shows broken image icons or unexplained blank boxes.
 */
export const MediaFallback: React.FC<MediaFallbackProps> = ({
  category = 'General',
  title,
  className = '',
  size = 'md',
}) => {
  const catLower = (category || '').toLowerCase();

  const getCategoryDetails = () => {
    if (catLower.includes('stone') || catLower.includes('marble') || catLower.includes('granite')) {
      return {
        icon: Gem,
        gradient: 'from-amber-900/30 via-slate-800 to-stone-900',
        badge: 'Natural Stone & Mineral',
        border: 'border-amber-700/30',
        accentText: 'text-amber-400',
      };
    }
    if (
      catLower.includes('electronic') ||
      catLower.includes('tech') ||
      catLower.includes('device') ||
      catLower.includes('gadget')
    ) {
      return {
        icon: Cpu,
        gradient: 'from-blue-900/40 via-slate-900 to-indigo-950',
        badge: 'Precision Electronics',
        border: 'border-blue-500/30',
        accentText: 'text-blue-400',
      };
    }
    if (
      catLower.includes('apparel') ||
      catLower.includes('cloth') ||
      catLower.includes('garment') ||
      catLower.includes('textile')
    ) {
      return {
        icon: Shirt,
        gradient: 'from-purple-900/40 via-slate-900 to-rose-950',
        badge: 'Textiles & Fashion',
        border: 'border-purple-500/30',
        accentText: 'text-purple-400',
      };
    }
    if (
      catLower.includes('machine') ||
      catLower.includes('equipment') ||
      catLower.includes('industrial') ||
      catLower.includes('hardware')
    ) {
      return {
        icon: Cog,
        gradient: 'from-emerald-950 via-slate-900 to-teal-950',
        badge: 'Heavy Machinery & Tools',
        border: 'border-emerald-600/30',
        accentText: 'text-emerald-400',
      };
    }
    if (
      catLower.includes('food') ||
      catLower.includes('agri') ||
      catLower.includes('beverage') ||
      catLower.includes('spice')
    ) {
      return {
        icon: Utensils,
        gradient: 'from-orange-950 via-slate-900 to-amber-950',
        badge: 'Agro & Food Commodities',
        border: 'border-orange-500/30',
        accentText: 'text-orange-400',
      };
    }
    if (
      catLower.includes('service') ||
      catLower.includes('consulting') ||
      catLower.includes('logistics') ||
      catLower.includes('freight')
    ) {
      return {
        icon: Truck,
        gradient: 'from-cyan-950 via-slate-900 to-blue-950',
        badge: 'Global Supply & Services',
        border: 'border-cyan-500/30',
        accentText: 'text-cyan-400',
      };
    }

    // Default Commerce
    return {
      icon: Package,
      gradient: 'from-slate-900 via-indigo-950 to-slate-950',
      badge: category || 'Verified Trade Asset',
      border: 'border-slate-700/50',
      accentText: 'text-slate-300',
    };
  };

  const details = getCategoryDetails();
  const Icon = details.icon;

  const sizeClasses = {
    sm: 'h-24 text-[10px]',
    md: 'h-44 text-xs',
    lg: 'h-64 text-sm',
    hero: 'h-80 md:h-96 text-base',
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    hero: 'w-20 h-20',
  };

  return (
    <div
      className={`relative w-full ${sizeClasses[size]} bg-gradient-to-br ${details.gradient} border ${details.border} rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden select-none ${className}`}
      role="img"
      aria-label={title || details.badge}
    >
      {/* Subtle Geometric Background Grid */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Decorative Glow Orb */}
      <div className="absolute w-24 h-24 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />

      {/* Center Icon & Identity */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-2 max-w-[85%]">
        <div
          className={`p-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 ${details.accentText} shadow-inner shadow-white/5`}
        >
          <Icon className={iconSizes[size]} />
        </div>

        {title && (
          <p className="font-bold text-white tracking-tight line-clamp-1 drop-shadow-xs">
            {title}
          </p>
        )}

        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300 border border-white/10">
          <Sparkles className="w-2.5 h-2.5 text-blue-400" />
          <span>{details.badge}</span>
        </span>
      </div>

      {/* Watermark in bottom corner */}
      <div className="absolute bottom-2.5 right-3 text-[9px] font-mono uppercase tracking-widest text-white/30 font-bold">
        VYRA MEDIA
      </div>
    </div>
  );
};
