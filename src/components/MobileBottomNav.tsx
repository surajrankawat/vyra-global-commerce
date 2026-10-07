import React, { useState } from 'react';
import {
  LayoutGrid,
  Globe2,
  Store,
  Package,
  ShoppingBag,
  MoreHorizontal,
  Compass,
  Users,
  FileSpreadsheet,
  Activity,
  Layers,
  Cpu,
  Settings,
  Truck,
  X,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onSelectView: (view: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
}) => {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const mainTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'marketplace', label: 'Market', icon: Globe2 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
  ];

  const moreItems = [
    { id: 'sellers', label: 'Sellers', icon: Store },
    { id: 'buyers', label: 'Buyers', icon: Compass },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'quotations', label: 'Quotes', icon: FileSpreadsheet },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'business-health', label: 'Finance', icon: Activity },
    { id: 'website-builder', label: 'Website', icon: Layers },
    { id: 'revenue-agent', label: 'AI Operations', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectMore = (viewId: string) => {
    onSelectView(viewId);
    setShowMoreSheet(false);
  };

  return (
    <>
      {/* Fixed bottom navigation rail on mobile */}
      <nav
        id="vyra-mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/90 flex items-center justify-around h-14 px-1"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectView(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
                isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More button */}
        <button
          type="button"
          onClick={() => setShowMoreSheet(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 transition ${
            showMoreSheet ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoreHorizontal className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>

      {/* More Drawer Sheet */}
      {showMoreSheet && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-xl p-4 shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Command Modules
              </span>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectMore(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded border text-xs font-semibold transition ${
                      isActive
                        ? 'bg-slate-800 text-blue-400 border-blue-500/50'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
