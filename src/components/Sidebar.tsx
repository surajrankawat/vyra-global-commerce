import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { VyraIcon } from './brand/VyraLogo';
import {
  LayoutGrid,
  Globe2,
  Store,
  Package,
  Compass,
  Users,
  FileSpreadsheet,
  ShoppingBag,
  Truck,
  Warehouse,
  Activity,
  Megaphone,
  Layers,
  MessageSquare,
  BarChart2,
  Cpu,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Exact ordered navigation items required for VYRA Global Business OS
  const navRailItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid },
    { id: 'marketplace', label: 'Market', icon: Globe2 },
    { id: 'sellers', label: 'Sellers', icon: Store },
    { id: 'buyers', label: 'Buyers', icon: Compass },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'quotations', label: 'Quotes', icon: FileSpreadsheet },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'logistics', label: 'Logistics', icon: Truck },
    { id: 'products', label: 'Inventory', icon: Warehouse },
    { id: 'business-health', label: 'Finance', icon: Activity },
    { id: 'advertising', label: 'Marketing', icon: Megaphone },
    { id: 'website-builder', label: 'Website', icon: Layers },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const bottomItems = [
    { id: 'revenue-agent', label: 'AI Operations', icon: Cpu },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      id="app-sidebar-rail"
      className={`bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-800/90 min-h-screen transition-all duration-200 select-none z-30 ${
        isExpanded ? 'w-52' : 'w-18'
      }`}
    >
      {/* Rail Top: VYRA Logo & Brand Mark */}
      <div className="h-16 flex items-center justify-between px-3 border-b border-slate-800/80 bg-slate-950">
        <button
          type="button"
          onClick={() => onSelectView('dashboard')}
          className="flex items-center gap-2.5 group w-full"
          title="VYRA Command Center"
        >
          <VyraIcon size={32} className="shrink-0" />
          {isExpanded && (
            <div className="text-left font-bold text-white tracking-wider text-sm font-sans">
              VYRA
            </div>
          )}
        </button>
      </div>

      {/* Main Navigation Rail Items */}
      <div className="flex-1 py-3 px-1.5 space-y-1 overflow-y-auto scrollbar-none">
        {navRailItems.map((item, idx) => {
          const Icon = item.icon;
          // Special match for Inventory linking to products
          const isActive =
            item.label === 'Inventory'
              ? currentView === 'products' && idx === 7
              : currentView === item.id;

          return (
            <button
              key={`${item.id}-${item.label}`}
              id={`nav-rail-${item.label.toLowerCase()}`}
              type="button"
              onClick={() => onSelectView(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 py-2 px-2.5 rounded text-xs font-semibold transition-all duration-150 relative group ${
                isActive
                  ? 'bg-slate-900 text-white font-bold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-blue-500 before:rounded-r-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              } ${isExpanded ? 'justify-start' : 'flex-col justify-center'}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span
                className={`truncate tracking-tight ${
                  isExpanded
                    ? 'text-xs text-left'
                    : 'text-[9px] uppercase font-mono tracking-tighter mt-0.5'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Rail Bottom: AI Operations & Settings */}
      <div className="py-2.5 px-1.5 border-t border-slate-800/80 space-y-1 bg-slate-950/70">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-rail-${item.id}`}
              type="button"
              onClick={() => onSelectView(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 py-2 px-2.5 rounded text-xs font-semibold transition-all duration-150 relative group ${
                isActive
                  ? 'bg-slate-900 text-white font-bold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-blue-500 before:rounded-r-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              } ${isExpanded ? 'justify-start' : 'flex-col justify-center'}`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span
                className={`truncate tracking-tight ${
                  isExpanded
                    ? 'text-xs text-left'
                    : 'text-[9px] uppercase font-mono tracking-tighter mt-0.5'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Expand / Collapse toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center py-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-900 rounded text-xs transition"
          title={isExpanded ? 'Collapse Rail' : 'Expand Rail'}
        >
          {isExpanded ? (
            <PanelLeftClose className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
