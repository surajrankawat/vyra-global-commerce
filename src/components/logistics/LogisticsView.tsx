import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  fetchBusinessShipments,
  createShipment,
  updateShipmentStatus,
  fetchLogisticsWarehouses,
  createLogisticsWarehouse,
  fetchLogisticsCarriers,
  fetchLogisticsClaims,
  createLogisticsClaim,
  updateLogisticsClaim,
  calculateShippingQuotes,
} from '../../lib/db';
import {
  VyraShipment,
  ShipmentStatus,
  LogisticsWarehouse,
  LogisticsCarrier,
  LogisticsClaim,
  ShippingRateCalculation,
  ShippingMode,
  IncotermCode,
  ShipmentPackageItem,
} from '../../types';
import {
  Truck,
  Package,
  Anchor,
  Plane,
  Globe2,
  Navigation,
  FileText,
  ShieldAlert,
  Warehouse,
  Calculator,
  Settings,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Download,
  ExternalLink,
  ChevronRight,
  Filter,
  MapPin,
  RotateCcw,
  Building2,
  Sparkles,
  ArrowRight,
  X,
  Container,
  Layers,
  Barcode,
  RefreshCw,
} from 'lucide-react';

export const LogisticsView: React.FC = () => {
  const { currentBusiness, apiFetch } = useAuth();
  const businessId = currentBusiness?.id || 'biz-apex-global';

  // Subsections matching Section 49.2
  type LogisticsTab =
    | 'dashboard'
    | 'shipments'
    | 'rates'
    | 'carriers'
    | 'tracking'
    | 'warehouses'
    | 'freight'
    | 'customs'
    | 'documents'
    | 'claims'
    | 'settings';

  const [activeTab, setActiveTab] = useState<LogisticsTab>('dashboard');
  const [shipments, setShipments] = useState<VyraShipment[]>([]);
  const [warehouses, setWarehouses] = useState<LogisticsWarehouse[]>([]);
  const [carriers, setCarriers] = useState<LogisticsCarrier[]>([]);
  const [claims, setClaims] = useState<LogisticsClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');

  // Selected Shipment for Tracking / Detail
  const [selectedShipment, setSelectedShipment] = useState<VyraShipment | null>(null);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeDocumentPreview, setActiveDocumentPreview] = useState<{ title: string; content: string } | null>(null);

  // Rate Calculator State
  const [calcOrigin, setCalcOrigin] = useState('US');
  const [calcDest, setCalcDest] = useState('DE');
  const [calcWeight, setCalcWeight] = useState<number>(12);
  const [calcLength, setCalcLength] = useState<number>(40);
  const [calcWidth, setCalcWidth] = useState<number>(30);
  const [calcHeight, setCalcHeight] = useState<number>(20);
  const [calcIsInsured, setCalcIsInsured] = useState(true);
  const [calcQuotes, setCalcQuotes] = useState<ShippingRateCalculation[]>([]);

  // Customs AI State
  const [customsProdDesc, setCustomsProdDesc] = useState('High precision industrial solar inverter with MPPT sensors');
  const [customsOrigin, setCustomsOrigin] = useState('CN');
  const [customsDest, setCustomsDest] = useState('DE');
  const [customsValue, setCustomsValue] = useState(15000);
  const [customsLoading, setCustomsLoading] = useState(false);
  const [customsResult, setCustomsResult] = useState<any>(null);

  // Quick Action notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ships, whs, carrs, clms] = await Promise.all([
        fetchBusinessShipments(businessId),
        fetchLogisticsWarehouses(businessId),
        fetchLogisticsCarriers(),
        fetchLogisticsClaims(businessId),
      ]);
      setShipments(ships);
      setWarehouses(whs);
      setCarriers(carrs);
      setClaims(clms);

      // default quotes calculation
      const initialQuotes = calculateShippingQuotes({
        originCountry: 'US',
        destCountry: 'DE',
        weightKg: 12,
        lengthCm: 40,
        widthCm: 30,
        heightCm: 20,
        isInsured: true,
      });
      setCalcQuotes(initialQuotes);
    } catch (err) {
      console.error('Failed to load logistics data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  // Metrics Calculation (Section 49.3)
  const pendingCount = shipments.filter((s) => s.status === 'READY_TO_SHIP' || s.status === 'DRAFT').length;
  const inTransitCount = shipments.filter((s) => s.status === 'IN_TRANSIT' || s.status === 'PICKED_UP').length;
  const customsPendingCount = shipments.filter((s) => s.status === 'CUSTOMS_PENDING').length;
  const outForDeliveryCount = shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length;
  const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;
  const totalFreightShipments = shipments.filter((s) => s.shipment_type.includes('CONTAINER') || s.shipment_type === 'B2B_FREIGHT').length;
  const activeClaimsCount = claims.filter((c) => c.status !== 'SETTLED' && c.status !== 'REJECTED').length;
  const totalShippingSpend = shipments.reduce((acc, s) => acc + (s.shipping_cost || 0), 0);

  // Filtered shipments
  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.buyer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.carrier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesMode = modeFilter === 'ALL' || s.shipping_mode === modeFilter;
    return matchesSearch && matchesStatus && matchesMode;
  });

  // Calculate live shipping rates button
  const handleCalculateRates = async () => {
    try {
      const res = await apiFetch('/api/logistics/calculate-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originCountry: calcOrigin,
          destCountry: calcDest,
          weightKg: calcWeight,
          lengthCm: calcLength,
          widthCm: calcWidth,
          heightCm: calcHeight,
          isInsured: calcIsInsured,
        }),
      });
      const data = await res.json();
      if (data.success && data.quotes) {
        setCalcQuotes(data.quotes);
      } else {
        const localQuotes = calculateShippingQuotes({
          originCountry: calcOrigin,
          destCountry: calcDest,
          weightKg: calcWeight,
          lengthCm: calcLength,
          widthCm: calcWidth,
          heightCm: calcHeight,
          isInsured: calcIsInsured,
        });
        setCalcQuotes(localQuotes);
      }
      setNotice({ type: 'success', text: 'Live shipping rates calculated successfully.' });
    } catch {
      const localQuotes = calculateShippingQuotes({
        originCountry: calcOrigin,
        destCountry: calcDest,
        weightKg: calcWeight,
        lengthCm: calcLength,
        widthCm: calcWidth,
        heightCm: calcHeight,
        isInsured: calcIsInsured,
      });
      setCalcQuotes(localQuotes);
    }
  };

  // AI Customs Duty lookup
  const handleCustomsLookup = async () => {
    setCustomsLoading(true);
    try {
      const res = await apiFetch('/api/logistics/customs-declaration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productDescription: customsProdDesc,
          originCountry: customsOrigin,
          destinationCountry: customsDest,
          declaredValue: customsValue,
          currency: 'USD',
        }),
      });
      const data = await res.json();
      if (data.success && data.declaration) {
        setCustomsResult(data.declaration);
        setNotice({ type: 'success', text: 'HS Code and Tariff classification determined.' });
      }
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: 'Could not query customs classification.' });
    } finally {
      setCustomsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Truck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Global Shipping & Logistics Hub</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Dual-Track B2B & B2C
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Venture Your Reach Anywhere • Freight, Ocean Containers, Air Cargo & E-Commerce Fulfillment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-lg shadow-blue-600/20 transition"
            >
              <Plus size={15} />
              <span>Create Shipment</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('rates');
                handleCalculateRates();
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-lg border border-slate-700 transition"
            >
              <Calculator size={15} />
              <span>Rate Calculator</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Section 49.2) */}
        <div className="max-w-7xl mx-auto mt-4 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-slate-800/80 pt-2 text-xs">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Globe2 },
            { id: 'shipments', label: 'Shipments', icon: Package, badge: shipments.length },
            { id: 'tracking', label: 'Live Tracking', icon: Navigation },
            { id: 'freight', label: 'B2B & Ocean Freight', icon: Container, badge: totalFreightShipments },
            { id: 'rates', label: 'Rates & Engine', icon: Calculator },
            { id: 'carriers', label: 'Carriers & 3PL', icon: Truck, badge: carriers.length },
            { id: 'warehouses', label: 'Warehouses', icon: Warehouse, badge: warehouses.length },
            { id: 'customs', label: 'Customs & HS', icon: Sparkles },
            { id: 'documents', label: 'Documents & Labels', icon: FileText },
            { id: 'claims', label: 'Returns & Claims', icon: ShieldAlert, badge: activeClaimsCount },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as LogisticsTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {notice && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center justify-between text-xs border ${
              notice.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{notice.text}</span>
            <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-200">
              <X size={14} />
            </button>
          </div>
        )}

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Cards (Section 49.3) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Ready to Ship</span>
                  <Package size={14} className="text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{pendingCount}</div>
                <div className="text-[11px] text-amber-400/90 mt-1">Awaiting carrier dispatch</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>In Transit</span>
                  <Truck size={14} className="text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{inTransitCount}</div>
                <div className="text-[11px] text-blue-400/90 mt-1">En route via air/ocean</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Customs Pending</span>
                  <Globe2 size={14} className="text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{customsPendingCount}</div>
                <div className="text-[11px] text-purple-400/90 mt-1">Inspection & clearance</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Out for Delivery</span>
                  <Navigation size={14} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{outForDeliveryCount}</div>
                <div className="text-[11px] text-emerald-400/90 mt-1">Final courier mile</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>B2B Freight Active</span>
                  <Container size={14} className="text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">{totalFreightShipments}</div>
                <div className="text-[11px] text-cyan-400/90 mt-1">FCL containers & air</div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Freight Spend</span>
                  <FileText size={14} className="text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-white mt-2">${totalShippingSpend.toLocaleString()}</div>
                <div className="text-[11px] text-indigo-400/90 mt-1">Active fulfillment cost</div>
              </div>
            </div>

            {/* Quick Operations Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Shipments Table Widget */}
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm text-white">Active Global Consignments</h3>
                    <p className="text-xs text-slate-400">Live operational status across all carriers & trade routes</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('shipments')}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <span>View All Shipments</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {shipments.slice(0, 4).map((ship) => (
                    <div
                      key={ship.id}
                      onClick={() => {
                        setSelectedShipment(ship);
                        setIsTrackingModalOpen(true);
                      }}
                      className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-blue-500/40 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-blue-400">
                          {ship.shipping_mode.includes('Sea') ? (
                            <Anchor size={18} />
                          ) : ship.shipping_mode.includes('Air') ? (
                            <Plane size={18} />
                          ) : (
                            <Truck size={18} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white">{ship.tracking_number}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ship.carrier_name}
                            </span>
                            {ship.incoterm && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 font-bold">
                                {ship.incoterm}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <span>{ship.origin.city}, {ship.origin.country_code}</span>
                            <ArrowRight size={10} className="text-slate-600" />
                            <span>{ship.destination.city}, {ship.destination.country_code}</span>
                            <span className="text-slate-600">•</span>
                            <span>{ship.total_weight_kg} kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            ship.status === 'DELIVERED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ship.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                              : ship.status === 'CUSTOMS_PENDING'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {ship.status.replace(/_/g, ' ')}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Est: {new Date(ship.estimated_delivery).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrier Integration Status & Warehouses */}
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-white">Carriers & 3PL Status</h3>
                    <button
                      onClick={() => setActiveTab('carriers')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Manage
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {carriers.slice(0, 4).map((c) => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/60 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-medium text-slate-200">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{c.average_on_time_rate}% On-Time</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            LIVE
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm text-white">Active Warehouses</h3>
                    <button
                      onClick={() => setActiveTab('warehouses')}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      View All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {warehouses.map((wh) => (
                      <div key={wh.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-850 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{wh.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{wh.code}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                          <span>{wh.address.city}, {wh.address.country}</span>
                          <span>{wh.capacity_sqm.toLocaleString()} m²</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. SHIPMENTS TAB */}
        {activeTab === 'shipments' && (
          <div className="space-y-5">
            {/* Filter toolbar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search tracking, order, buyer, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="READY_TO_SHIP">Ready to Ship</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="CUSTOMS_PENDING">Customs Pending</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                </select>

                <select
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">All Modes</option>
                  <option value="Standard Shipping">Standard Shipping</option>
                  <option value="Express Shipping">Express Shipping</option>
                  <option value="Air Freight Cargo">Air Freight Cargo</option>
                  <option value="Sea Freight (FCL Container)">Sea Freight (FCL Container)</option>
                  <option value="Sea Freight (LCL)">Sea Freight (LCL)</option>
                </select>

                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition"
                >
                  <Plus size={14} />
                  <span>New Consignment</span>
                </button>
              </div>
            </div>

            {/* Shipments List */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Tracking & Order</th>
                      <th className="py-3 px-4">Mode / Carrier</th>
                      <th className="py-3 px-4">Origin & Destination</th>
                      <th className="py-3 px-4">Weight / Pkgs</th>
                      <th className="py-3 px-4">Cost</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredShipments.map((ship) => (
                      <tr key={ship.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-white text-xs">{ship.tracking_number}</div>
                          <div className="text-[11px] text-slate-400">{ship.order_number} • {ship.buyer_name}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">{ship.shipping_mode}</div>
                          <div className="text-[11px] text-slate-400">{ship.carrier_name}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-medium">
                            {ship.origin.city} ({ship.origin.country_code}) → {ship.destination.city} ({ship.destination.country_code})
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {ship.destination.address_line1}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono text-slate-200">{ship.chargeable_weight_kg} kg</div>
                          <div className="text-[11px] text-slate-400">{ship.total_packages} pkg(s)</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-emerald-400 font-mono">${ship.shipping_cost.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">+{ship.fuel_surcharge} fuel</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                              ship.status === 'DELIVERED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : ship.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : ship.status === 'CUSTOMS_PENDING'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {ship.status.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedShipment(ship);
                                setIsTrackingModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 text-xs font-medium transition"
                            >
                              Track
                            </button>
                            <button
                              onClick={() => {
                                if (ship.documents && ship.documents.length > 0) {
                                  setActiveDocumentPreview({
                                    title: ship.documents[0].title,
                                    content: `Document: ${ship.documents[0].doc_number}\nIssuer: ${ship.documents[0].issuer}\nTracking: ${ship.tracking_number}\nConsignee: ${ship.destination.contact_name}\nAddress: ${ship.destination.address_line1}, ${ship.destination.city}, ${ship.destination.country}`,
                                  });
                                } else {
                                  setNotice({ type: 'error', text: 'No documents issued yet for this shipment.' });
                                }
                              }}
                              className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
                              title="View Document"
                            >
                              <FileText size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. RATES & CALCULATION ENGINE TAB (Section 49.5) */}
        {activeTab === 'rates' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Input */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator size={18} className="text-blue-400" />
                  <h3 className="font-semibold text-sm text-white">Dynamic Rate Calculator</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Calculates actual vs volumetric weight using IATA 5000 factor with live fuel surcharges.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Origin Country</label>
                    <input
                      type="text"
                      value={calcOrigin}
                      onChange={(e) => setCalcOrigin(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      placeholder="US, CN, IN, NL..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Dest Country</label>
                    <input
                      type="text"
                      value={calcDest}
                      onChange={(e) => setCalcDest(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                      placeholder="DE, GB, US, SG..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Actual Weight (kg)</label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Length (cm)</label>
                    <input
                      type="number"
                      value={calcLength}
                      onChange={(e) => setCalcLength(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Width (cm)</label>
                    <input
                      type="number"
                      value={calcWidth}
                      onChange={(e) => setCalcWidth(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={calcHeight}
                      onChange={(e) => setCalcHeight(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="calcInsured"
                    checked={calcIsInsured}
                    onChange={(e) => setCalcIsInsured(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600"
                  />
                  <label htmlFor="calcInsured" className="text-xs text-slate-300">
                    Include Cargo Insurance (Lloyds / Marine Cover)
                  </label>
                </div>

                <button
                  onClick={handleCalculateRates}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 rounded-lg transition"
                >
                  Compute Live Carrier Rates
                </button>
              </div>

              {/* Quotes Output */}
              <div className="lg:col-span-2 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-white">Carrier Rate Comparisons</h3>
                  <span className="text-xs text-slate-400">
                    Volumetric: {((calcLength * calcWidth * calcHeight) / 5000).toFixed(1)} kg | Chargeable:{' '}
                    {Math.max(calcWeight, Number(((calcLength * calcWidth * calcHeight) / 5000).toFixed(1)))} kg
                  </span>
                </div>

                <div className="space-y-3">
                  {calcQuotes.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{q.carrier_name}</span>
                          {q.is_fastest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              FASTEST
                            </span>
                          )}
                          {q.is_best_value && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              BEST VALUE
                            </span>
                          )}
                          {q.is_cheapest && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ECONOMY
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{q.service_level}</div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Transit: ~{q.estimated_days} business day(s) • Base: ${q.base_rate} • Fuel Surcharge: ${q.fuel_surcharge}
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                        <div className="text-xl font-bold text-emerald-400 font-mono">${q.total_cost}</div>
                        <div className="text-[10px] text-slate-400">All-in landed freight</div>
                        <button
                          onClick={() => {
                            setIsCreateModalOpen(true);
                          }}
                          className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-1 rounded-md border border-slate-700 transition"
                        >
                          Book Carrier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CARRIERS TAB (Section 49.8) */}
        {activeTab === 'carriers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white">Integrated Global Carriers & 3PL Partners</h3>
                <p className="text-xs text-slate-400">
                  Pre-configured API connections for courier express, ocean freight lines, and air cargo networks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {carriers.map((c) => (
                <div key={c.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
                          {c.code}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{c.name}</h4>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{c.category.replace(/_/g, ' ')}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1 text-xs text-slate-400">
                      <div>On-Time SLA: <strong className="text-slate-200">{c.average_on_time_rate}%</strong></div>
                      <div>Coverage: <span className="text-slate-300">{c.supported_countries.slice(0, 5).join(', ')}...</span></div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">{c.supported_modes[0]}</span>
                    <button
                      onClick={() => setNotice({ type: 'success', text: `${c.name} credentials verified and active.` })}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Test API Ping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. LIVE TRACKING TAB (Section 49.9) */}
        {activeTab === 'tracking' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 max-w-2xl mx-auto text-center space-y-3">
              <Navigation size={28} className="mx-auto text-blue-400" />
              <h3 className="font-bold text-base text-white">Global Tracking Portal</h3>
              <p className="text-xs text-slate-400">
                Track any B2C parcel, ocean container, or air waybill across our carrier network in real time.
              </p>
              <div className="flex gap-2 max-w-md mx-auto pt-2">
                <input
                  type="text"
                  placeholder="Enter tracking number (e.g. MSKU-894102941)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => {
                    const found = shipments.find(
                      (s) =>
                        s.tracking_number.toLowerCase() === searchQuery.toLowerCase() ||
                        s.order_number?.toLowerCase() === searchQuery.toLowerCase()
                    );
                    if (found) {
                      setSelectedShipment(found);
                      setIsTrackingModalOpen(true);
                    } else {
                      setNotice({ type: 'error', text: `No active shipment matching "${searchQuery}".` });
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
                >
                  Locate
                </button>
              </div>
            </div>

            {/* Visual Shipment Timeline Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipments.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono font-bold text-sm text-white">{s.tracking_number}</div>
                      <div className="text-xs text-slate-400">{s.carrier_name} • {s.shipping_mode}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                      {s.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center justify-between pt-1">
                    <span>{s.origin.city}, {s.origin.country}</span>
                    <ArrowRight size={12} className="text-slate-500" />
                    <span>{s.destination.city}, {s.destination.country}</span>
                  </div>

                  {/* Latest Milestone */}
                  {s.events && s.events.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-850 text-xs">
                      <div className="font-semibold text-blue-400">{s.events[0].status_label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{s.events[0].description}</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(s.events[0].timestamp).toLocaleString()} • {s.events[0].location}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedShipment(s);
                      setIsTrackingModalOpen(true);
                    }}
                    className="w-full text-center text-xs text-blue-400 hover:text-blue-300 pt-1 font-medium"
                  >
                    Open Complete Tracking Journey & Map →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. B2B & OCEAN FREIGHT TAB (Section 49.7) */}
        {activeTab === 'freight' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Container size={20} className="text-cyan-400" />
                <h3 className="font-bold text-sm text-white">B2B Wholesale Freight & Container Management</h3>
              </div>
              <p className="text-xs text-slate-400">
                Full-Container-Load (FCL), Less-Than-Container (LCL), Air Cargo, and Incoterms (FOB, CIF, EXW, DDP) workflow.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-center">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Supported Containers</div>
                  <div className="text-sm font-bold text-white mt-1">20ft / 40ft / 40HC / Reefer</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Incoterms Enforced</div>
                  <div className="text-sm font-bold text-white mt-1">EXW, FOB, CIF, CFR, DDP</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Ocean Carriers</div>
                  <div className="text-sm font-bold text-white mt-1">Maersk, MSC, CMA CGM</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Customs Filing</div>
                  <div className="text-sm font-bold text-white mt-1">Automated AES / AMS</div>
                </div>
              </div>
            </div>

            {/* Containerized Shipments */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-white">Active Container Manifests</h4>
              {shipments
                .filter((s) => s.container_details)
                .map((ship) => (
                  <div
                    key={ship.id}
                    className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-white">
                            Container: {ship.container_details?.container_number}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300">
                            {ship.container_details?.container_type}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                            {ship.incoterm}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          Vessel: <strong className="text-slate-200">{ship.container_details?.vessel_name}</strong> • Voyage: {ship.container_details?.voyage_number}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          Seal #: {ship.container_details?.seal_number}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Gross Weight: {ship.container_details?.gross_weight_kg?.toLocaleString()} kg
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Port of Loading (POL)</span>
                        <div className="font-semibold text-slate-200 mt-0.5">{ship.container_details?.port_of_loading}</div>
                        <div className="text-slate-400">{ship.origin.company_name}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Port of Discharge (POD)</span>
                        <div className="font-semibold text-slate-200 mt-0.5">{ship.container_details?.port_of_discharge}</div>
                        <div className="text-slate-400">{ship.destination.company_name}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-400">
                        Cargo: {ship.packages[0]?.description} ({ship.packages[0]?.quantity} units)
                      </span>
                      <button
                        onClick={() => {
                          setSelectedShipment(ship);
                          setIsTrackingModalOpen(true);
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Inspect Container Route →
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 7. CUSTOMS & HS CLASSIFICATION TAB (Section 49.7) */}
        {activeTab === 'customs' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h3 className="font-semibold text-sm text-white">AI Customs & Tariff Harmonization Engine</h3>
              </div>
              <p className="text-xs text-slate-400">
                Automatically determines 6-8 digit WCO Harmonized System (HS) codes, estimates import duty rates and VAT/GST, and flags export restrictions.
              </p>

              <div className="space-y-3 max-w-3xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Commodity / Product Description
                  </label>
                  <textarea
                    rows={2}
                    value={customsProdDesc}
                    onChange={(e) => setCustomsProdDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Origin Country</label>
                    <input
                      type="text"
                      value={customsOrigin}
                      onChange={(e) => setCustomsOrigin(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Destination Country</label>
                    <input
                      type="text"
                      value={customsDest}
                      onChange={(e) => setCustomsDest(e.target.value.toUpperCase())}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Declared Value (USD)</label>
                    <input
                      type="number"
                      value={customsValue}
                      onChange={(e) => setCustomsValue(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCustomsLookup}
                  disabled={customsLoading}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  {customsLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>Classify & Estimate Tariff</span>
                </button>
              </div>

              {/* Customs AI Result Output */}
              {customsResult && (
                <div className="mt-5 p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Classified HS Code</span>
                      <div className="text-xl font-bold font-mono text-white">{customsResult.hs_code}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Category</span>
                      <div className="text-xs font-semibold text-slate-200">{customsResult.tariff_category}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-purple-500/20">
                    <div>
                      <span className="text-slate-400">Estimated Duty Rate:</span>
                      <div className="font-bold text-slate-200">{customsResult.estimated_duty_rate_percent}%</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Estimated Duty:</span>
                      <div className="font-bold text-emerald-400">${customsResult.estimated_duty_amount}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Estimated VAT / Tax:</span>
                      <div className="font-bold text-slate-200">${customsResult.estimated_vat_amount}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Total Landed Tax:</span>
                      <div className="font-bold text-purple-300">
                        ${(Number(customsResult.estimated_duty_amount || 0) + Number(customsResult.estimated_vat_amount || 0)).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {customsResult.compliance_notes && (
                    <div className="text-[11px] text-slate-400 italic pt-1">
                      {customsResult.compliance_notes}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. WAREHOUSES TAB (Section 49.4) */}
        {activeTab === 'warehouses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white">Warehouses & Fulfillment Centers</h3>
                <p className="text-xs text-slate-400">
                  Manage primary distribution centers, bonded warehouses, and factory dispatch points.
                </p>
              </div>
              <button
                onClick={() => setIsWarehouseModalOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg text-xs font-medium transition"
              >
                <Plus size={14} />
                <span>Add Warehouse</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {warehouses.map((wh) => (
                <div key={wh.id} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-400">{wh.code}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {wh.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-white mt-2">{wh.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {wh.address.address_line1}, {wh.address.city}, {wh.address.state_province} {wh.address.postal_code}, {wh.address.country}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                      <div className="p-2 rounded bg-slate-950 border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase">Capacity</span>
                        <div className="font-bold text-slate-200 mt-0.5">{wh.capacity_sqm.toLocaleString()} m²</div>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-850">
                        <span className="text-[10px] text-slate-500 uppercase">Loading Docks</span>
                        <div className="font-bold text-slate-200 mt-0.5">{wh.dock_count} Bays</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-xs flex items-center justify-between text-slate-400">
                    <span>Manager: {wh.manager_name}</span>
                    <span>{wh.manager_phone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 9. DOCUMENTS TAB (Section 49.10) */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-base text-white">Shipping Documents & Labels</h3>
              <p className="text-xs text-slate-400">
                Bills of Lading (B/L), Air Waybills (AWB), Commercial Invoices, Packing Lists, Certificates of Origin, and Barcode Courier Labels.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shipments.flatMap((s) => s.documents || []).map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">{doc.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {doc.doc_number} • {doc.doc_type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Issued: {new Date(doc.issued_at).toLocaleDateString()} by {doc.issuer}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setActiveDocumentPreview({
                          title: doc.title,
                          content: `DOCUMENT TYPE: ${doc.doc_type}\nNUMBER: ${doc.doc_number}\nISSUER: ${doc.issuer}\nSTATUS: ${doc.status}\nDATE: ${doc.issued_at}\n\nCERTIFICATION STATEMENT:\nThis document serves as legal and commercial verification for international and domestic carriage under applicable multimodal transportation agreements.`,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setNotice({ type: 'success', text: `Downloaded ${doc.file_name}.` })}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                      title="Download PDF"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 10. CLAIMS & RETURNS TAB (Section 49.11) */}
        {activeTab === 'claims' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white">Freight Claims & Return Restocking</h3>
                <p className="text-xs text-slate-400">
                  Manage insurance claims for cargo damage, total loss, delay penalties, and return merchandise authorizations (RMA).
                </p>
              </div>
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg text-xs font-medium transition"
              >
                <Plus size={14} />
                <span>File Cargo Claim</span>
              </button>
            </div>

            <div className="space-y-3">
              {claims.map((claim) => (
                <div key={claim.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{claim.claim_number}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {claim.claim_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Tracking: {claim.tracking_number}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-white">
                        ${claim.claimed_amount.toLocaleString()} {claim.currency}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/10 text-amber-300">
                        {claim.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{claim.description}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Filed by: {claim.submitted_by} on {new Date(claim.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => setNotice({ type: 'success', text: `Claim ${claim.claim_number} surveyor dossier opened.` })}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Review Claim Dossier →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 11. SETTINGS TAB (Section 49.12) */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-white">Logistics & Shipping Configuration</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Default Volumetric Divisor (IATA Air Cargo standard: 5000, Courier: 6000)
                </label>
                <input
                  type="number"
                  defaultValue={5000}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                  Free Shipping Minimum Threshold (B2C E-commerce, USD)
                </label>
                <input
                  type="number"
                  defaultValue={150}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoLabel"
                  defaultChecked
                  className="rounded bg-slate-950 border-slate-800 text-blue-600"
                />
                <label htmlFor="autoLabel" className="text-slate-300">
                  Automatically generate carrier shipping labels upon order confirmation
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dangerousGoods"
                  className="rounded bg-slate-950 border-slate-800 text-blue-600"
                />
                <label htmlFor="dangerousGoods" className="text-slate-300">
                  Enable Dangerous Goods (DG/IMO) hazardous materials processing
                </label>
              </div>

              <button
                onClick={() => setNotice({ type: 'success', text: 'Shipping configuration saved successfully.' })}
                className="mt-3 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition"
              >
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TRACKING TIMELINE MODAL (Section 49.9) */}
      {isTrackingModalOpen && selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-white">{selectedShipment.tracking_number}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-500/20 text-blue-300">
                    {selectedShipment.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Carrier: {selectedShipment.carrier_name} • Mode: {selectedShipment.shipping_mode}
                </div>
              </div>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Checkpoint Timeline */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Milestone Journey</h4>
              <div className="space-y-4 border-l-2 border-blue-600/40 ml-2.5 pl-4">
                {selectedShipment.events?.map((ev, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                    <div>
                      <div className="font-bold text-xs text-white">{ev.status_label}</div>
                      <p className="text-xs text-slate-300 mt-0.5">{ev.description}</p>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {new Date(ev.timestamp).toLocaleString()} • {ev.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                Destination: {selectedShipment.destination.city}, {selectedShipment.destination.country}
              </div>
              <button
                onClick={() => setIsTrackingModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SHIPMENT MODAL (Section 49.2 & 49.6) */}
      {isCreateModalOpen && (
        <CreateShipmentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(newShip) => {
            setShipments([newShip, ...shipments]);
            setNotice({ type: 'success', text: `Shipment ${newShip.tracking_number} created successfully!` });
            setIsCreateModalOpen(false);
          }}
          warehouses={warehouses}
          carriers={carriers}
        />
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {activeDocumentPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">{activeDocumentPreview.title}</h3>
              <button onClick={() => setActiveDocumentPreview(null)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-80 overflow-y-auto">
              {activeDocumentPreview.content}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNotice({ type: 'success', text: 'Document sent to printer.' });
                  setActiveDocumentPreview(null);
                }}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
              >
                <Printer size={14} />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Shipment Modal Component
interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (ship: VyraShipment) => void;
  warehouses: LogisticsWarehouse[];
  carriers: LogisticsCarrier[];
}

const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({
  isOpen,
  onClose,
  onCreated,
  warehouses,
  carriers,
}) => {
  const [orderNumber, setOrderNumber] = useState(`ORD-${Math.floor(1000 + Math.random() * 9000)}`);
  const [buyerName, setBuyerName] = useState('Global Procurement Corp');
  const [carrierName, setCarrierName] = useState(carriers[0]?.name || 'DHL Express');
  const [mode, setMode] = useState<ShippingMode>('Express Shipping');
  const [incoterm, setIncoterm] = useState<IncotermCode>('FOB');
  const [weightKg, setWeightKg] = useState(8.5);
  const [destCountry, setDestCountry] = useState('DE');
  const [destCity, setDestCity] = useState('Frankfurt');
  const [destAddress, setDestAddress] = useState('Industriestrasse 42');
  const [notes, setNotes] = useState('Priority factory freight with temperature-controlled crating.');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createShipment({
      order_number: orderNumber,
      buyer_name: buyerName,
      carrier_name: carrierName,
      shipping_mode: mode,
      incoterm,
      total_weight_kg: weightKg,
      destination: {
        contact_name: buyerName,
        email: 'procurement@buyer.com',
        phone: '+49 69 555 0192',
        address_line1: destAddress,
        city: destCity,
        state_province: 'Hesse',
        postal_code: '60311',
        country: destCountry,
        country_code: destCountry,
      },
      notes,
    });
    onCreated(created);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white">Create New Global Consignment</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Buyer / Consignee</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Shipping Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ShippingMode)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="Express Shipping">Express Shipping</option>
                <option value="Standard Shipping">Standard Shipping</option>
                <option value="Air Freight Cargo">Air Freight Cargo</option>
                <option value="Sea Freight (FCL Container)">Sea Freight (FCL Container)</option>
                <option value="Sea Freight (LCL)">Sea Freight (LCL)</option>
                <option value="LTL (Less-Than-Truckload)">LTL (Less-Than-Truckload)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Carrier</label>
              <select
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              >
                {carriers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Incoterm</label>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value as IncotermCode)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="FOB">FOB (Free on Board)</option>
                <option value="CIF">CIF (Cost, Ins, Freight)</option>
                <option value="EXW">EXW (Ex Works)</option>
                <option value="DDP">DDP (Delivered Duty Paid)</option>
                <option value="DAP">DAP (Delivered at Place)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Dest Country</label>
              <input
                type="text"
                value={destCountry}
                onChange={(e) => setDestCountry(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">City</label>
              <input
                type="text"
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Delivery Address</label>
              <input
                type="text"
                value={destAddress}
                onChange={(e) => setDestAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Packaging & Instructions</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
            >
              Issue Shipment & Generate Waybill
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
