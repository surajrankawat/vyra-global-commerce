import React, { useState } from 'react';
import { Globe2, Navigation, ArrowUpRight, Plus, Compass, ShoppingBag } from 'lucide-react';
import { Lead, Order, RFQ, Business } from '../../types';

interface GlobalMarketMapProps {
  business: Business;
  leads: Lead[];
  orders: Order[];
  rfqs: RFQ[];
  onAddBuyer: () => void;
  onCreateProduct: () => void;
  onFindOpportunities: () => void;
}

interface CountryHub {
  code: string;
  name: string;
  x: number;
  y: number;
  buyers: number;
  orders: number;
  volume: number;
  inquiries: number;
}

// Global landmark hub coordinate registry
const GEO_COORDINATES: Record<string, { x: number; y: number; name: string }> = {
  US: { x: 180, y: 140, name: 'United States' },
  USA: { x: 180, y: 140, name: 'United States' },
  'UNITED STATES': { x: 180, y: 140, name: 'United States' },
  CA: { x: 170, y: 95, name: 'Canada' },
  CAN: { x: 170, y: 95, name: 'Canada' },
  CANADA: { x: 170, y: 95, name: 'Canada' },
  GB: { x: 410, y: 110, name: 'United Kingdom' },
  UK: { x: 410, y: 110, name: 'United Kingdom' },
  'UNITED KINGDOM': { x: 410, y: 110, name: 'United Kingdom' },
  DE: { x: 435, y: 118, name: 'Germany' },
  DEU: { x: 435, y: 118, name: 'Germany' },
  GERMANY: { x: 435, y: 118, name: 'Germany' },
  AE: { x: 535, y: 175, name: 'United Arab Emirates' },
  UAE: { x: 535, y: 175, name: 'United Arab Emirates' },
  DUBAI: { x: 535, y: 175, name: 'United Arab Emirates' },
  IN: { x: 605, y: 185, name: 'India' },
  IND: { x: 605, y: 185, name: 'India' },
  INDIA: { x: 605, y: 185, name: 'India' },
  AU: { x: 740, y: 275, name: 'Australia' },
  AUS: { x: 740, y: 275, name: 'Australia' },
  AUSTRALIA: { x: 740, y: 275, name: 'Australia' },
  SG: { x: 660, y: 220, name: 'Singapore' },
  SINGAPORE: { x: 660, y: 220, name: 'Singapore' },
  JP: { x: 730, y: 145, name: 'Japan' },
  JAPAN: { x: 730, y: 145, name: 'Japan' },
  BR: { x: 290, y: 250, name: 'Brazil' },
  BRAZIL: { x: 290, y: 250, name: 'Brazil' },
  ZA: { x: 460, y: 265, name: 'South Africa' },
  'SOUTH AFRICA': { x: 460, y: 265, name: 'South Africa' },
  CN: { x: 660, y: 155, name: 'China' },
  CHINA: { x: 660, y: 155, name: 'China' },
  MX: { x: 170, y: 175, name: 'Mexico' },
  MEXICO: { x: 170, y: 175, name: 'Mexico' },
  SA: { x: 510, y: 180, name: 'Saudi Arabia' },
  'SAUDI ARABIA': { x: 510, y: 180, name: 'Saudi Arabia' },
  FR: { x: 418, y: 125, name: 'France' },
  FRANCE: { x: 418, y: 125, name: 'France' },
  NL: { x: 425, y: 112, name: 'Netherlands' },
  NETHERLANDS: { x: 425, y: 112, name: 'Netherlands' },
};

export const GlobalMarketMap: React.FC<GlobalMarketMapProps> = ({
  business,
  leads,
  orders,
  rfqs,
  onAddBuyer,
  onCreateProduct,
  onFindOpportunities,
}) => {
  const [selectedHub, setSelectedHub] = useState<CountryHub | null>(null);

  // Normalize origin
  const originNorm = (business.country || 'US').trim().toUpperCase();
  const originGeo = GEO_COORDINATES[originNorm] || { x: 450, y: 150, name: business.country || 'HQ' };

  // Aggregate REAL market activity strictly from database records
  const hubMap = new Map<string, CountryHub>();

  // 1. Process Leads
  leads.forEach((l) => {
    if (!l.country) return;
    const key = l.country.trim().toUpperCase();
    const geo = GEO_COORDINATES[key] || { x: 480, y: 160, name: l.country };
    const cur = hubMap.get(geo.name) || {
      code: key,
      name: geo.name,
      x: geo.x,
      y: geo.y,
      buyers: 0,
      orders: 0,
      volume: 0,
      inquiries: 0,
    };
    cur.buyers += 1;
    cur.inquiries += 1;
    cur.volume += Number(l.estimated_deal_value) || 0;
    hubMap.set(geo.name, cur);
  });

  // 2. Process Orders
  orders.forEach((o) => {
    const rawCountry = o.shipping_address?.country || o.buyer_id || '';
    if (!rawCountry) return;
    const key = rawCountry.trim().toUpperCase();
    const geo = GEO_COORDINATES[key];
    if (geo) {
      const cur = hubMap.get(geo.name) || {
        code: key,
        name: geo.name,
        x: geo.x,
        y: geo.y,
        buyers: 1,
        orders: 0,
        volume: 0,
        inquiries: 0,
      };
      cur.orders += 1;
      cur.volume += Number(o.total_amount) || 0;
      hubMap.set(geo.name, cur);
    }
  });

  // 3. Process RFQs (real tenders in buyer directory)
  rfqs.forEach((r) => {
    if (!r.buyer_country) return;
    const key = r.buyer_country.trim().toUpperCase();
    const geo = GEO_COORDINATES[key];
    if (geo) {
      const cur = hubMap.get(geo.name) || {
        code: key,
        name: geo.name,
        x: geo.x,
        y: geo.y,
        buyers: 0,
        orders: 0,
        volume: 0,
        inquiries: 0,
      };
      cur.inquiries += 1;
      cur.volume += Number(r.target_price) ? Number(r.target_price) * (Number(r.quantity) || 1) : 0;
      hubMap.set(geo.name, cur);
    }
  });

  const activeHubs = Array.from(hubMap.values());
  const hasRealActivity = activeHubs.length > 0;

  return (
    <div
      id="vyra-global-market-section"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-xs"
    >
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
              International Trade Corridor
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {hasRealActivity ? `${activeHubs.length} Active Target Markets` : '0 Target Markets'}
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            GLOBAL MARKET
          </h2>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 inline-block" />
            <span>Origin HQ ({business.country || 'Global'})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Active Buyer Hub</span>
          </div>
        </div>
      </div>

      {/* World Map Container */}
      <div className="relative mt-4 bg-slate-950 rounded-lg border border-slate-800/80 overflow-hidden min-h-[340px] flex items-center justify-center">
        {/* World Vector Visualization */}
        <svg
          viewBox="0 0 880 400"
          className="w-full h-auto max-h-[420px] select-none pointer-events-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            {/* Pulsing beacon glow */}
            <filter id="hub-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.8" />
            </filter>
            <filter id="origin-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Background subtle grid */}
          <rect width="880" height="400" fill="#090d16" />
          <rect width="880" height="400" fill="url(#grid)" />

          {/* Equator & Meridians */}
          <line x1="0" y1="200" x2="880" y2="200" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="4 4" strokeOpacity="0.5" />
          <line x1="440" y1="0" x2="440" y2="400" stroke="#1e293b" strokeWidth="0.8" strokeDasharray="4 4" strokeOpacity="0.5" />

          {/* Continental Outlines (Clean Architectural Landmasses) */}
          <g fill="#161e2e" stroke="#2a374d" strokeWidth="0.8" opacity="0.85">
            {/* North America */}
            <path d="M 120 70 L 220 60 L 250 85 L 235 125 L 210 145 L 180 180 L 155 185 L 140 150 L 105 130 L 95 90 Z" />
            {/* Central America */}
            <path d="M 180 180 L 210 195 L 235 220 L 220 225 L 195 205 Z" />
            {/* South America */}
            <path d="M 235 220 L 290 230 L 330 270 L 310 330 L 275 350 L 250 310 L 230 250 Z" />
            {/* Europe */}
            <path d="M 390 85 L 470 80 L 490 120 L 450 145 L 415 155 L 390 135 L 375 105 Z" />
            {/* Africa */}
            <path d="M 400 160 L 470 160 L 515 210 L 495 295 L 450 330 L 415 280 L 395 210 Z" />
            {/* Middle East & Central Asia */}
            <path d="M 480 145 L 560 140 L 590 175 L 560 210 L 505 185 Z" />
            {/* South Asia & India */}
            <path d="M 580 165 L 635 170 L 630 225 L 595 220 Z" />
            {/* East Asia & China */}
            <path d="M 610 110 L 720 100 L 735 160 L 685 185 L 630 165 Z" />
            {/* Southeast Asia */}
            <path d="M 650 195 L 690 205 L 705 240 L 665 245 Z" />
            {/* Japan */}
            <path d="M 735 125 L 750 135 L 740 165 L 725 150 Z" />
            {/* Australia */}
            <path d="M 700 260 L 780 255 L 800 310 L 755 335 L 710 305 Z" />
            {/* United Kingdom */}
            <path d="M 395 95 L 415 95 L 410 120 L 395 115 Z" />
          </g>

          {/* Trade Vector Arcs from HQ to Active Hubs */}
          {hasRealActivity &&
            activeHubs.map((hub) => {
              const dx = hub.x - originGeo.x;
              const dy = hub.y - originGeo.y;
              const cx = (originGeo.x + hub.x) / 2;
              const cy = Math.min(originGeo.y, hub.y) - Math.abs(dx) * 0.15 - 20;

              return (
                <g key={`arc-${hub.name}`}>
                  {/* Background curve track */}
                  <path
                    d={`M ${originGeo.x} ${originGeo.y} Q ${cx} ${cy} ${hub.x} ${hub.y}`}
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    strokeOpacity="0.6"
                  />
                  {/* Active trade pulse vector */}
                  <path
                    d={`M ${originGeo.x} ${originGeo.y} Q ${cx} ${cy} ${hub.x} ${hub.y}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                    className="animate-pulse"
                  />
                </g>
              );
            })}

          {/* Origin HQ Beacon */}
          <g filter="url(#origin-glow)">
            <circle cx={originGeo.x} cy={originGeo.y} r="6" fill="#2563eb" />
            <circle cx={originGeo.x} cy={originGeo.y} r="2.5" fill="#ffffff" />
            <text
              x={originGeo.x}
              y={originGeo.y - 10}
              fill="#93c5fd"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              HQ ({business.country || 'Origin'})
            </text>
          </g>

          {/* Real Hub Markers */}
          {hasRealActivity &&
            activeHubs.map((hub) => {
              const isSelected = selectedHub?.name === hub.name;
              return (
                <g
                  key={`hub-${hub.name}`}
                  onClick={() => setSelectedHub(hub)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={hub.x}
                    cy={hub.y}
                    r={isSelected ? 8 : 5}
                    fill="#10b981"
                    filter="url(#hub-glow)"
                    className="transition-all duration-200"
                  />
                  <circle cx={hub.x} cy={hub.y} r="2" fill="#ffffff" />
                  <text
                    x={hub.x}
                    y={hub.y + 14}
                    fill="#d1fae5"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="group-hover:fill-emerald-300 font-semibold"
                  >
                    {hub.name}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Empty State Overlay when no market activity exists */}
        {!hasRealActivity && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <Globe2 className="w-6 h-6 text-slate-500" />
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              No market activity yet
            </h3>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-5 leading-relaxed">
              Your global trade network will visualize here as you onboard buyers, log orders, and explore purchasing tenders.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                id="map-btn-add-buyer"
                onClick={onAddBuyer}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Buyer
              </button>
              <button
                type="button"
                id="map-btn-create-product"
                onClick={onCreateProduct}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 rounded text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Product
              </button>
              <button
                type="button"
                id="map-btn-find-opps"
                onClick={onFindOpportunities}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded text-xs font-semibold shadow-xs transition"
              >
                <Compass className="w-3.5 h-3.5" />
                Find Opportunities
              </button>
            </div>
          </div>
        )}

        {/* Selected Hub Floating Dossier */}
        {hasRealActivity && selectedHub && (
          <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700/80 rounded p-3 text-xs text-white max-w-xs shadow-xl z-20 backdrop-blur-sm animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" />
                {selectedHub.name}
              </span>
              <button
                type="button"
                onClick={() => setSelectedHub(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ×
              </button>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Buyers / Leads:</span>
                <span className="text-white font-bold">{selectedHub.buyers}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sales Orders:</span>
                <span className="text-white font-bold">{selectedHub.orders}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Inquiries / RFQs:</span>
                <span className="text-white font-bold">{selectedHub.inquiries}</span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Total Value:</span>
                <span className="text-emerald-400 font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: business.currency || 'USD',
                    maximumFractionDigits: 0,
                  }).format(selectedHub.volume)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
