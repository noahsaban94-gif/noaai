import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  Layers, 
  Compass, 
  Search, 
  Filter, 
  Sparkles, 
  Package, 
  Building2, 
  Maximize2, 
  Minimize2, 
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';
import { Order } from '../types';
import { 
  WAREHOUSE_COORDS, 
  JONI_WHATSAPP_CUSTOMERS, 
  JoniCustomerSite, 
  getCityCoordinates,
  calculateDistanceKm
} from '../utils/geoRouting';
import { SABAN_DRIVERS } from '../data/mockData';

interface LeafletRouteMapProps {
  orders?: Order[];
  selectedDriverFilter?: string; // 'all' | 'hikmat' | 'ali'
  onSelectOrder?: (order: Order) => void;
  heightClass?: string;
  isPWACompact?: boolean;
}

export const LeafletRouteMap: React.FC<LeafletRouteMapProps> = ({
  orders = [],
  selectedDriverFilter = 'all',
  onSelectOrder,
  heightClass = 'h-[650px]',
  isPWACompact = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeDriver, setActiveDriver] = useState<string>(selectedDriverFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showJoniSites, setShowJoniSites] = useState<boolean>(true);
  const [showLiveOrders, setShowLiveOrders] = useState<boolean>(true);
  const [showRouteLines, setShowRouteLines] = useState<boolean>(true);
  const [showWarehouses, setShowWarehouses] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [selectedJoniSite, setSelectedJoniSite] = useState<JoniCustomerSite | null>(null);
  const [userGpsLocation, setUserGpsLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [activeWarehouseCenter, setActiveWarehouseCenter] = useState<'4_HARASH' | '1_TALMID'>('4_HARASH');

  // Update internal driver filter if prop changes
  useEffect(() => {
    setActiveDriver(selectedDriverFilter);
  }, [selectedDriverFilter]);

  // Filtered JONI customers
  const filteredJoniSites = useMemo(() => {
    return JONI_WHATSAPP_CUSTOMERS.filter(cust => {
      // Driver filter
      if (activeDriver === 'hikmat' && !cust.preferredDriver.includes('חכמת')) return false;
      if (activeDriver === 'ali' && !cust.preferredDriver.includes('עלי')) return false;

      // Category filter
      if (selectedCategory !== 'all' && cust.topProductCategory !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = cust.name.toLowerCase().includes(q);
        const matchCity = cust.city.toLowerCase().includes(q);
        const matchAddr = cust.address.toLowerCase().includes(q);
        const matchContact = cust.contactPerson.toLowerCase().includes(q);
        const matchMat = cust.recentMaterials.some(m => m.toLowerCase().includes(q));
        if (!matchName && !matchCity && !matchAddr && !matchContact && !matchMat) return false;
      }

      return true;
    });
  }, [activeDriver, selectedCategory, searchQuery]);

  // Filtered live orders
  const filteredLiveOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeDriver === 'hikmat' && !order.assignedDriver.includes('חכמת')) return false;
      if (activeDriver === 'ali' && !order.assignedDriver.includes('עלי')) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCust = order.customerName.toLowerCase().includes(q);
        const matchCity = order.city.toLowerCase().includes(q);
        const matchOrderNo = order.orderNumber.includes(q);
        if (!matchCust && !matchCity && !matchOrderNo) return false;
      }
      return true;
    });
  }, [orders, activeDriver, searchQuery]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Base center: Saban 4 Harash, Tira
      const baseCoords = [WAREHOUSE_COORDS['4_HARASH'].lat, WAREHOUSE_COORDS['4_HARASH'].lng] as [number, number];

      const map = L.map(mapContainerRef.current, {
        center: baseCoords,
        zoom: 12,
        zoomControl: false,
        attributionControl: true
      });

      // Add Zoom Control on top-left (RTL convenient)
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // OpenStreetMap standard tile layer with Hebrew labels & PWA Cache compatibility
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | ח. סבן לוגיסטיקה'
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    // Trigger map resize invalidate after layout changes
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Handle ResizeObserver on container
  useEffect(() => {
    if (!mapContainerRef.current || !mapInstanceRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstanceRef.current?.invalidateSize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Re-render markers & route lines when data / filters change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    // 1. Saban Base Warehouses Markers
    if (showWarehouses) {
      Object.values(WAREHOUSE_COORDS).forEach((wh) => {
        const isHarash = wh.id === '4_HARASH';
        const whIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="absolute -inset-2 bg-amber-500/30 rounded-full animate-ping"></div>
            <div class="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 font-black flex items-center justify-center shadow-2xl border-2 border-white text-sm transform transition hover:scale-110">
              ${isHarash ? '4️⃣' : '1️⃣'}
            </div>
            <div class="absolute -bottom-5 bg-slate-900/90 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap border border-amber-500/40 shadow-md">
              ${isHarash ? 'מחסן 4 החרש' : 'מחסן 1 התלמיד'}
            </div>
          </div>
        `;

        const whIcon = L.divIcon({
          className: 'custom-warehouse-marker',
          html: whIconHtml,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -25]
        });

        const whMarker = L.marker([wh.lat, wh.lng], { icon: whIcon });
        bounds.extend([wh.lat, wh.lng]);

        const whPopupContent = `
          <div class="p-3 text-right font-sans min-w-[220px]" dir="rtl">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
              <span class="text-xs font-black text-amber-700 uppercase">${wh.id === '4_HARASH' ? 'בסיס העמסה ראשי' : 'בסיס גבס וצבעים'}</span>
              <span class="text-xs font-mono font-bold text-slate-500">טירה</span>
            </div>
            <h4 class="font-bold text-sm text-slate-900 mt-1">${wh.name}</h4>
            <p class="text-xs text-slate-600 mt-1">
              ${wh.id === '4_HARASH' 
                ? '🏗️ כאן חכמת מעמיס בלות חול, טיט, מלט, בלוקים וברזל.' 
                : '🎨 כאן עלי מעמיס לוחות גבס, פרופילים, צבעים וציוד גמר.'}
            </p>
            <div class="mt-3 pt-2 border-t border-slate-200 flex gap-2">
              <a href="https://waze.com/ul?ll=${wh.lat},${wh.lng}&navigate=yes" target="_blank" rel="noopener noreferrer" 
                 class="flex-1 text-center py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs">
                🧭 ניווט Waze לבסיס
              </a>
            </div>
          </div>
        `;

        whMarker.bindPopup(whPopupContent);
        layerGroup.addLayer(whMarker);
      });
    }

    // 2. Render 28 JONI WhatsApp Group Customer Sites
    if (showJoniSites) {
      filteredJoniSites.forEach((cust) => {
        const isCrane = cust.craneRequired;
        const isHikmat = cust.preferredDriver.includes('חכמת');

        // Pin color by top category
        let badgeColor = 'bg-cyan-600 border-cyan-300';
        if (cust.topProductCategory === 'בלוקים וברזל') badgeColor = 'bg-red-600 border-red-300';
        if (cust.topProductCategory === 'שקי בלה וחול') badgeColor = 'bg-amber-600 border-amber-300';
        if (cust.topProductCategory === 'גבס ופרופילים') badgeColor = 'bg-emerald-600 border-emerald-300';
        if (cust.topProductCategory === 'כלי עבודה ואיטום') badgeColor = 'bg-purple-600 border-purple-300';

        const joniIconHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-8 h-8 rounded-full ${badgeColor} text-white font-bold flex items-center justify-center shadow-lg border-2 text-[11px] transform transition hover:scale-125">
              ${isCrane ? '🏗️' : '🚛'}
            </div>
            <div class="absolute -bottom-4 bg-slate-950/95 text-white font-semibold px-1.5 py-0.5 rounded text-[9px] whitespace-nowrap border border-slate-700 shadow-md">
              ${cust.name.split('/')[0]}
            </div>
          </div>
        `;

        const joniIcon = L.divIcon({
          className: 'custom-joni-marker',
          html: joniIconHtml,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -20]
        });

        const joniMarker = L.marker(cust.coords, { icon: joniIcon });
        bounds.extend(cust.coords);

        const joniPopupContent = `
          <div class="p-3.5 text-right font-sans min-w-[260px] max-w-[290px]" dir="rtl">
            <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
              <span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                📱 קבוצת וואטסאפ JONI (#${cust.id})
              </span>
              <span class="text-[11px] font-mono font-bold text-slate-500">${cust.city}</span>
            </div>
            
            <h4 class="font-extrabold text-sm text-slate-900 mt-2">${cust.name}</h4>
            <p class="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
              📍 ${cust.address}
            </p>
            
            <div class="my-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
              <div class="flex justify-between text-slate-700">
                <span class="font-bold">איש קשר:</span>
                <span>${cust.contactPerson}</span>
              </div>
              <div class="flex justify-between text-slate-700">
                <span class="font-bold">נהג מועדף:</span>
                <span class="text-blue-700 font-semibold">${cust.preferredDriver}</span>
              </div>
              <div class="flex justify-between text-slate-700">
                <span class="font-bold">קטגוריית שיא:</span>
                <span class="font-bold text-amber-800">${cust.topProductCategory}</span>
              </div>
            </div>

            <div class="text-[11px] text-slate-500">
              <span class="font-bold text-slate-700">חומרי בניין נפוצים:</span>
              <div class="mt-1 flex flex-wrap gap-1">
                ${cust.recentMaterials.map(m => `<span class="bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">${m}</span>`).join('')}
              </div>
            </div>

            <div class="mt-3 pt-2 border-t border-slate-200 grid grid-cols-2 gap-2">
              <a href="${cust.wazeUrl}" target="_blank" rel="noopener noreferrer" 
                 class="py-1.5 px-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-lg text-xs text-center flex items-center justify-center gap-1">
                🧭 Waze
              </a>
              <a href="tel:${cust.phone}" 
                 class="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs text-center flex items-center justify-center gap-1">
                📞 חייג לאתר
              </a>
            </div>
          </div>
        `;

        joniMarker.bindPopup(joniPopupContent);
        joniMarker.on('click', () => {
          setSelectedJoniSite(cust);
        });

        layerGroup.addLayer(joniMarker);
      });
    }

    // 3. Render Live Scheduled Orders & Route Polylines
    if (showLiveOrders && filteredLiveOrders.length > 0) {
      // Group orders by driver to draw distinct colored routes
      const hikmatOrders = filteredLiveOrders.filter(o => o.assignedDriver.includes('חכמת'));
      const aliOrders = filteredLiveOrders.filter(o => o.assignedDriver.includes('עלי'));

      // Helper to render driver routes
      const renderDriverRoute = (driverOrders: Order[], color: string, driverLabel: string) => {
        if (driverOrders.length === 0) return;

        const baseWh = WAREHOUSE_COORDS['4_HARASH'];
        const latLngs: [number, number][] = [[baseWh.lat, baseWh.lng]];

        driverOrders.forEach((order, idx) => {
          const geo = getCityCoordinates(order.city, order.siteAddress || order.destination);
          const coords: [number, number] = [geo.lat, geo.lng];
          latLngs.push(coords);
          bounds.extend(coords);

          // Order Destination Marker with Stop Number
          const isDone = order.status === 'סופק בהצלחה' || order.status === 'Delivered';
          const stopIconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="w-8 h-8 rounded-xl ${isDone ? 'bg-emerald-500' : color} text-slate-950 font-black flex items-center justify-center shadow-xl border-2 border-white text-xs transform transition hover:scale-125">
                ${idx + 1}
              </div>
              <div class="absolute -top-3 bg-slate-900 text-cyan-300 font-mono font-bold px-1 rounded text-[9px] border border-cyan-500/50 shadow">
                #${order.orderNumber}
              </div>
            </div>
          `;

          const stopIcon = L.divIcon({
            className: 'custom-stop-marker',
            html: stopIconHtml,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -20]
          });

          const stopMarker = L.marker(coords, { icon: stopIcon });

          const stopPopupContent = `
            <div class="p-3 text-right font-sans min-w-[250px]" dir="rtl">
              <div class="flex items-center justify-between pb-1.5 border-b border-slate-200">
                <span class="text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 font-bold">יעד #${idx + 1} (${driverLabel})</span>
                <span class="text-xs font-mono font-bold text-slate-600">שעה: ${order.scheduledTime}</span>
              </div>
              <h4 class="font-bold text-sm text-slate-900 mt-1">${order.customerName}</h4>
              <p class="text-xs text-slate-600">📍 ${order.siteAddress}, ${order.city}</p>
              
              <div class="my-2 p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                <span class="font-bold text-slate-700">מטען לפריקה (${order.totalWeightKg || 0} ק"ג):</span>
                <p class="text-slate-600 mt-0.5 line-clamp-2">${order.itemsFormatted || order.itemsDetails}</p>
                <div class="mt-1 flex gap-2 text-[11px] font-mono text-slate-500">
                  <span>בלות: ${order.bigBagsDeposit || 0}</span>
                  <span>משטחים: ${order.palletsDeposit || 0}</span>
                </div>
              </div>

              <div class="mt-2 flex gap-2">
                <a href="${order.wazeUrl}" target="_blank" rel="noopener noreferrer" 
                   class="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs text-center">
                  🧭 פתח Waze
                </a>
                <button onclick="window.__selectOrder && window.__selectOrder('${order.orderNumber}')" 
                        class="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-xs">
                  כרטיס הזמנה
                </button>
              </div>
            </div>
          `;

          stopMarker.bindPopup(stopPopupContent);
          stopMarker.on('click', () => {
            if (onSelectOrder) onSelectOrder(order);
          });

          layerGroup.addLayer(stopMarker);
        });

        // Add return to base
        latLngs.push([baseWh.lat, baseWh.lng]);

        // Draw Polyline Route
        if (showRouteLines && latLngs.length > 2) {
          const polyline = L.polyline(latLngs, {
            color: color === 'bg-cyan-500' ? '#06b6d4' : '#3b82f6',
            weight: 4,
            opacity: 0.85,
            dashArray: color === 'bg-cyan-500' ? undefined : '6, 6'
          });
          layerGroup.addLayer(polyline);
        }
      };

      if (activeDriver === 'all' || activeDriver === 'hikmat') {
        renderDriverRoute(hikmatOrders, 'bg-cyan-500', 'חכמת - מנוף 26ט');
      }
      if (activeDriver === 'all' || activeDriver === 'ali') {
        renderDriverRoute(aliOrders, 'bg-blue-500', 'עלי - משאית 15ט');
      }
    }

    // 4. User GPS Location Marker
    if (userGpsLocation) {
      const gpsIconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute -inset-2 bg-blue-500/40 rounded-full animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white">
            <span class="w-2 h-2 rounded-full bg-white"></span>
          </div>
        </div>
      `;
      const gpsIcon = L.divIcon({
        className: 'custom-gps-marker',
        html: gpsIconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const gpsMarker = L.marker(userGpsLocation, { icon: gpsIcon });
      gpsMarker.bindPopup('<b>📍 המיקום הנוכחי שלך (משאית בשטח)</b>');
      layerGroup.addLayer(gpsMarker);
    }

    // Auto-fit bounds if we have points
    if (bounds.isValid() && (!searchQuery || searchQuery.length > 2)) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [
    filteredJoniSites, 
    filteredLiveOrders, 
    showJoniSites, 
    showLiveOrders, 
    showRouteLines, 
    showWarehouses, 
    userGpsLocation, 
    activeDriver, 
    searchQuery
  ]);

  // Handle GPS Geolocation
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('דפדפן זה אינו תומך באיכון מיקום GPS.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserGpsLocation(coords);
        mapInstanceRef.current?.setView(coords, 14, { animate: true });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation notice:', err.message);
        // Fallback to Harash warehouse
        const baseCoords = [WAREHOUSE_COORDS['4_HARASH'].lat, WAREHOUSE_COORDS['4_HARASH'].lng] as [number, number];
        mapInstanceRef.current?.setView(baseCoords, 13, { animate: true });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Center on Saban Warehouse
  const handleCenterWarehouse = (whKey: '4_HARASH' | '1_TALMID') => {
    setActiveWarehouseCenter(whKey);
    const wh = WAREHOUSE_COORDS[whKey];
    mapInstanceRef.current?.setView([wh.lat, wh.lng], 14, { animate: true });
  };

  return (
    <div className={`relative flex flex-col rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : heightClass
    }`}>
      {/* Top Map Header & Interactive Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 z-10">
        {/* Title & Stats */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white">מפת Leaflet נהגים ולוגיסטיקה</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  אופליין פעיל
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                28 לקוחות קבוצת הוואטסאפ (JONI) + מסלולי פריקה של חכמת ועלי
              </p>
            </div>
          </div>

          {/* Fullscreen Button on mobile */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={isFullscreen ? 'צא ממסך מלא' : 'מסך מלא'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Driver Pill Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveDriver('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                activeDriver === 'all'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              הכל ({JONI_WHATSAPP_CUSTOMERS.length})
            </button>
            <button
              onClick={() => setActiveDriver('hikmat')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                activeDriver === 'hikmat'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
            >
              <span>חכמת (26ט)</span>
            </button>
            <button
              onClick={() => setActiveDriver('ali')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                activeDriver === 'ali'
                  ? 'bg-blue-500 text-white shadow'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <span>עלי (15ט)</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש לקוח, עיר או חומר..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 pl-8"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Fullscreen Desktop Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'מזער' : 'מסך מלא'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative flex-1 w-full h-full min-h-[400px]">
        {/* The Leaflet Div Target */}
        <div ref={mapContainerRef} className="w-full h-full z-0" style={{ minHeight: '100%' }} />

        {/* Floating Quick Action Overlay (Right Side) */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
          {/* GPS Current Location Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 shadow-xl backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 text-xs font-bold"
            title="זהה מיקום נוכחי של הנהג בדרכים"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">מיקומי בשטח</span>
          </button>

          {/* Center Warehouse 4 Harash */}
          <button
            onClick={() => handleCenterWarehouse('4_HARASH')}
            className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 text-xs font-bold ${
              activeWarehouseCenter === '4_HARASH'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-900/90 hover:bg-slate-800 text-amber-400 border-slate-700'
            }`}
            title="מרכז על מחסן 4 החרש (מלט ובלוקים)"
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">מחסן 4 החרש</span>
          </button>

          {/* Center Warehouse 1 Talmid */}
          <button
            onClick={() => handleCenterWarehouse('1_TALMID')}
            className={`p-2.5 rounded-2xl border shadow-xl backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 text-xs font-bold ${
              activeWarehouseCenter === '1_TALMID'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border-slate-700'
            }`}
            title="מרכז על מחסן 1 התלמיד (גבס וצבעים)"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">מחסן 1 התלמיד</span>
          </button>
        </div>

        {/* Floating Layer Toggles (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-300 pointer-events-auto max-w-[calc(100%-2rem)]">
          <button
            onClick={() => setShowJoniSites(!showJoniSites)}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              showJoniSites ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-500'
            }`}
          >
            <span>📍 28 לקוחות JONI</span>
          </button>

          <button
            onClick={() => setShowLiveOrders(!showLiveOrders)}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              showLiveOrders ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-500'
            }`}
          >
            <span>🚛 הזמנות וסבבים ({filteredLiveOrders.length})</span>
          </button>

          <button
            onClick={() => setShowRouteLines(!showRouteLines)}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              showRouteLines ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-500'
            }`}
          >
            <span>〰️ קווי מסלול</span>
          </button>
        </div>

        {/* Selected Customer Card Preview (Bottom Right Sheet) */}
        {selectedJoniSite && (
          <div className="absolute bottom-4 right-4 z-20 bg-slate-900/95 backdrop-blur-md border border-cyan-700/80 p-4 rounded-3xl shadow-2xl max-w-sm w-full text-right pointer-events-auto animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 font-bold border border-cyan-800">
                {selectedJoniSite.whatsappGroup}
              </span>
              <button
                onClick={() => setSelectedJoniSite(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <h4 className="font-extrabold text-base text-white mt-2">{selectedJoniSite.name}</h4>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {selectedJoniSite.address}, {selectedJoniSite.city}
            </p>

            <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>איש קשר באתר:</span>
                <span className="font-bold text-white">{selectedJoniSite.contactPerson}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>נהג קבוע:</span>
                <span className="font-semibold text-cyan-400">{selectedJoniSite.preferredDriver}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>חומרי שיא:</span>
                <span className="font-mono text-amber-300">{selectedJoniSite.topProductCategory}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={selectedJoniSite.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/20"
              >
                <Navigation className="w-4 h-4 text-slate-950" />
                <span>פתח Waze</span>
              </a>
              <a
                href={`tel:${selectedJoniSite.phone}`}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
              >
                <Phone className="w-4 h-4" />
                <span>חייג לאתר</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Legend & Top Product Analytics Overlay */}
      <div className="bg-slate-900/95 border-t border-slate-800 p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-slate-400 overflow-x-auto scrollbar-none py-0.5">
          <span className="font-bold text-slate-300 text-[11px] whitespace-nowrap">מקרא מפה:</span>
          <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>4 החרש (מלט/בלות)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <span>1 התלמיד (גבס/צבע)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>בלוקים וברזל</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>גבס ופרופילים</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>איטום וכלי עבודה</span>
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>סנכרון מלא עם Top_100_Product_Analytics</span>
        </div>
      </div>
    </div>
  );
};
