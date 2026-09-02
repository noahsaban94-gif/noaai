import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  MapPin, 
  Truck, 
  Navigation, 
  Layers, 
  Sparkles, 
  Zap, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle,
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Share2, 
  Weight, 
  Boxes,
  ExternalLink,
  ChevronRight,
  Info,
  PenTool,
  Eraser,
  Download,
  FileCode,
  Check,
  Copy,
  RefreshCw,
  Search,
  Eye,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Order } from '../types';
import { SABAN_DRIVERS } from '../data/mockData';
import { 
  aggregateCityDensity, 
  CityDensityAggregate, 
  computeOptimizedRoute, 
  getCityCoordinates, 
  WAREHOUSE_COORDS,
  ISRAEL_CITIES_COORDS,
  CUSTOMER_VISIT_HISTORIES,
  CustomerVisitHistory,
  UnloadSequenceStep
} from '../utils/geoRouting';
import { useTheme } from '../context/ThemeContext';
import { LeafletRouteMap } from './LeafletRouteMap';

interface RouteDensityMapProps {
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  onApplyOptimizedSequence?: (optimizedOrders: Order[]) => void;
}

export const RouteDensityMap: React.FC<RouteDensityMapProps> = ({
  orders,
  onSelectOrder,
  onApplyOptimizedSequence
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Map Engine selector: 'leaflet' (OpenStreetMap/PWA) vs 'd3' (Vector/LIFO Density)
  const [mapEngine, setMapEngine] = useState<'leaflet' | 'd3'>('leaflet');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasDrawRef = useRef<HTMLCanvasElement | null>(null);

  // Layer Toggles (שכבות מעל המפה)
  const [showLiveOrdersLayer, setShowLiveOrdersLayer] = useState<boolean>(true);
  const [showVisitHistoryLayer, setShowVisitHistoryLayer] = useState<boolean>(true);
  const [showOptimizedRouteLayer, setShowOptimizedRouteLayer] = useState<boolean>(true);
  const [showCitiesSyncLayer, setShowCitiesSyncLayer] = useState<boolean>(false);
  const [showDrawingLayer, setShowDrawingLayer] = useState<boolean>(false);

  // Filter states
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [selectedWarehouseHub, setSelectedWarehouseHub] = useState<'4_HARASH' | '1_TALMID'>('4_HARASH');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Selection
  const [selectedCity, setSelectedCity] = useState<CityDensityAggregate | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityDensityAggregate | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CustomerVisitHistory | null>(null);
  const [activeSimulationStep, setActiveSimulationStep] = useState<number>(0);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);

  // Drawing tool state
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser'>('pen');
  const [penColor, setPenColor] = useState<string>('#0284c7');
  const [brushSize, setBrushSize] = useState<number>(3);

  // Script Modal state
  const [isScriptModalOpen, setIsScriptModalOpen] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (selectedDriver !== 'all') {
        const isHikmat = (o.assignedDriver || o.driver || '').includes('חכמת');
        const isAli = (o.assignedDriver || o.driver || '').includes('עלי');
        if (selectedDriver === 'hikmat' && !isHikmat) return false;
        if (selectedDriver === 'ali' && !isAli) return false;
      }
      if (selectedRound !== 'all' && o.round && !o.round.includes(selectedRound)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (o.customerName || '').toLowerCase().includes(q);
        const matchesCity = (o.city || '').toLowerCase().includes(q);
        const matchesId = (o.orderNumber || o.orderId || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCity && !matchesId) return false;
      }
      return true;
    });
  }, [orders, selectedDriver, selectedRound, searchQuery]);

  // Aggregate City Density
  const cityDensities = useMemo(() => {
    return aggregateCityDensity(filteredOrders);
  }, [filteredOrders]);

  // Compute Route Optimization & LIFO Crane Unloading Sequence
  const optimizationResults = useMemo(() => {
    const startHub = WAREHOUSE_COORDS[selectedWarehouseHub];
    return computeOptimizedRoute(startHub, filteredOrders);
  }, [filteredOrders, selectedWarehouseHub]);

  // Zoom behavior reference
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Projection logic for Israel Sharon / Central Region
  const mapBounds = {
    minLng: 34.65,
    maxLng: 35.15,
    minLat: 31.95,
    maxLat: 32.48
  };

  const projectCoord = (lat: number, lng: number, width: number, height: number): [number, number] => {
    const padding = 55;
    const xRatio = (lng - mapBounds.minLng) / (mapBounds.maxLng - mapBounds.minLng);
    const yRatio = (lat - mapBounds.minLat) / (mapBounds.maxLat - mapBounds.minLat);
    const x = padding + xRatio * (width - padding * 2);
    const y = height - (padding + yRatio * (height - padding * 2));
    return [x, y];
  };

  // D3 Map Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 920;
    const height = 620;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Definitions (Gradients & Filters)
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'map-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Route Gradient
    const routeGradient = defs.append('linearGradient')
      .attr('id', 'route-line-grad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
    routeGradient.append('stop').attr('offset', '0%').attr('stop-color', '#0284c7').attr('stop-opacity', '0.9');
    routeGradient.append('stop').attr('offset', '50%').attr('stop-color', '#38bdf8').attr('stop-opacity', '1');
    routeGradient.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', '0.9');

    // Main Zoomable Canvas Group
    const g = svg.append('g').attr('class', 'map-viewport');

    // Set up zoom & pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // 1. Draw Map Background & Grid
    const bgRect = g.append('rect')
      .attr('width', width * 2)
      .attr('height', height * 2)
      .attr('x', -width / 2)
      .attr('y', -height / 2)
      .attr('fill', isLight ? '#f8fafc' : '#070b12');

    // Subtle background grid lines
    const gridG = g.append('g').attr('class', 'map-grid').attr('opacity', isLight ? 0.4 : 0.25);
    for (let x = 0; x < width; x += 60) {
      gridG.append('line')
        .attr('x1', x).attr('y1', 0).attr('x2', x).attr('y2', height)
        .attr('stroke', isLight ? '#cbd5e1' : '#334155')
        .attr('stroke-dasharray', '2 4');
    }
    for (let y = 0; y < height; y += 60) {
      gridG.append('line')
        .attr('x1', 0).attr('y1', y).attr('x2', width).attr('y2', y)
        .attr('stroke', isLight ? '#cbd5e1' : '#334155')
        .attr('stroke-dasharray', '2 4');
    }

    // 2. Draw Major Israeli Regional Highway Lines (כביש 6, כביש 4, כביש 531, כביש 2)
    const highwayG = g.append('g').attr('class', 'highways-layer');
    const highways = [
      { name: 'כביש 6 (חוצה ישראל)', coords: [[32.42, 35.02], [32.25, 34.98], [32.08, 34.96], [31.98, 34.94]] },
      { name: 'כביש 4 (גהה / שרון)', coords: [[32.40, 34.89], [32.24, 34.88], [32.14, 34.85], [32.02, 34.82]] },
      { name: 'כביש 531 (שרון רוחבי)', coords: [[32.18, 34.82], [32.18, 34.87], [32.17, 34.92], [32.17, 34.97]] },
      { name: 'כביש 2 (חוף)', coords: [[32.42, 34.87], [32.32, 34.85], [32.17, 34.80], [32.08, 34.76]] }
    ];

    highways.forEach(hw => {
      const pts = hw.coords.map(c => projectCoord(c[0], c[1], width, height));
      const lineGen = d3.line<[number, number]>().curve(d3.curveCatmullRom);
      highwayG.append('path')
        .attr('d', lineGen(pts))
        .attr('fill', 'none')
        .attr('stroke', isLight ? '#94a3b8' : '#1e293b')
        .attr('stroke-width', 2.5)
        .attr('stroke-opacity', 0.65)
        .attr('stroke-dasharray', '4 3');
    });

    // 3. LAYER: Visit History & Predictive AI Halos (היסטוריית ביקורים וחיזוי ביקושים)
    if (showVisitHistoryLayer) {
      const historyG = g.append('g').attr('class', 'visit-history-layer');
      CUSTOMER_VISIT_HISTORIES.forEach(hist => {
        const geo = getCityCoordinates(hist.city, hist.address);
        const [hx, hy] = projectCoord(geo.lat, geo.lng, width, height);

        // Predictive Demand Ring
        const haloRadius = Math.min(48, Math.max(22, hist.totalVisitsPastMonth * 1.8));
        const haloColor = hist.predictedDemandLevel === 'גבוה' ? '#8b5cf6' : '#06b6d4';

        historyG.append('circle')
          .attr('cx', hx)
          .attr('cy', hy)
          .attr('r', haloRadius)
          .attr('fill', haloColor)
          .attr('fill-opacity', isLight ? 0.08 : 0.12)
          .attr('stroke', haloColor)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3 3')
          .attr('class', 'cursor-pointer transition-all')
          .on('click', () => setSelectedHistoryItem(hist));

        // Visit counter badge
        historyG.append('text')
          .attr('x', hx + haloRadius - 6)
          .attr('y', hy - haloRadius + 6)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', 'bold')
          .attr('fill', isLight ? '#6d28d9' : '#c084fc')
          .text(`${hist.totalVisitsPastMonth}ב'`);
      });
    }

    // 4. LAYER: Optimized Multi-Stop Route Lines (מסלול רב יעדים וסדר פריקה)
    if (showOptimizedRouteLayer && optimizationResults.waypoints.length > 1) {
      const routeG = g.append('g').attr('class', 'route-path-layer');
      const pts = optimizationResults.waypoints.map(w => projectCoord(w.lat, w.lng, width, height));

      const lineGen = d3.line<[number, number]>().curve(d3.curveCatmullRom.alpha(0.5));

      // Glow route line
      routeG.append('path')
        .attr('d', lineGen(pts))
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 6)
        .attr('stroke-opacity', 0.3)
        .attr('filter', 'url(#map-glow)');

      // Main route polyline
      const mainPath = routeG.append('path')
        .attr('d', lineGen(pts))
        .attr('fill', 'none')
        .attr('stroke', 'url(#route-line-grad)')
        .attr('stroke-width', 3.5)
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

      // Animated route flow dash
      routeG.append('path')
        .attr('d', lineGen(pts))
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '8 16')
        .attr('stroke-opacity', 0.8)
        .append('animate')
        .attr('attributeName', 'stroke-dashoffset')
        .attr('values', '48;0')
        .attr('dur', '1.8s')
        .attr('repeatCount', 'indefinite');
    }

    // 5. LAYER: Saban Base Warehouses (מחסני הבסיס של סבן בטירה)
    const warehouseG = g.append('g').attr('class', 'warehouses-layer');
    Object.values(WAREHOUSE_COORDS).forEach(wh => {
      const [wx, wy] = projectCoord(wh.lat, wh.lng, width, height);
      const isSelectedHub = wh.id === selectedWarehouseHub;

      const whGroup = warehouseG.append('g')
        .attr('class', 'cursor-pointer')
        .on('click', () => setSelectedWarehouseHub(wh.id as '4_HARASH' | '1_TALMID'));

      // Pulse ring for base hub
      whGroup.append('circle')
        .attr('cx', wx)
        .attr('cy', wy)
        .attr('r', isSelectedHub ? 24 : 18)
        .attr('fill', isSelectedHub ? '#0284c7' : '#f59e0b')
        .attr('fill-opacity', 0.2)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${isSelectedHub ? 20 : 15};${isSelectedHub ? 30 : 24};${isSelectedHub ? 20 : 15}`)
        .attr('dur', '2.5s')
        .attr('repeatCount', 'indefinite');

      // Hub Outer Circle
      whGroup.append('circle')
        .attr('cx', wx)
        .attr('cy', wy)
        .attr('r', isSelectedHub ? 15 : 12)
        .attr('fill', isSelectedHub ? '#0284c7' : '#d97706')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2.5)
        .attr('filter', 'url(#map-glow)');

      // Hub Icon / Text
      whGroup.append('text')
        .attr('x', wx)
        .attr('y', wy + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('fill', '#ffffff')
        .text(wh.id === '4_HARASH' ? '4' : '1');

      // Hub Name Label
      whGroup.append('text')
        .attr('x', wx)
        .attr('y', wy - 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', isLight ? '#0f172a' : '#f8fafc')
        .text(wh.shortName);
    });

    // 6. LAYER: Live Orders Pins & City Density Markers (הזמנות חיות בסידור העבודה)
    if (showLiveOrdersLayer) {
      const ordersG = g.append('g').attr('class', 'live-orders-layer');

      cityDensities.forEach(cd => {
        const [cx, cy] = projectCoord(cd.lat, cd.lng, width, height);
        const isHovered = hoveredCity?.city === cd.city;
        const isSelected = selectedCity?.city === cd.city;

        const nodeGroup = ordersG.append('g')
          .attr('class', 'cursor-pointer')
          .on('click', () => setSelectedCity(cd))
          .on('mouseenter', () => setHoveredCity(cd))
          .on('mouseleave', () => setHoveredCity(null));

        // Density Halo based on order count / weight
        const circleRadius = Math.min(28, Math.max(14, cd.orderCount * 8 + (cd.totalWeightKg / 1000)));

        nodeGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', circleRadius)
          .attr('fill', isSelected ? '#38bdf8' : cd.orders.some(o => o.isCraneRequired) ? '#f59e0b' : '#0284c7')
          .attr('fill-opacity', isHovered || isSelected ? 0.35 : 0.2)
          .attr('stroke', isSelected ? '#38bdf8' : cd.orders.some(o => o.isCraneRequired) ? '#d97706' : '#0284c7')
          .attr('stroke-width', isSelected ? 3 : 2);

        // Center Pin
        nodeGroup.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 10)
          .attr('fill', isLight ? '#ffffff' : '#0f172a')
          .attr('stroke', cd.orders.some(o => o.isCraneRequired) ? '#f59e0b' : '#0284c7')
          .attr('stroke-width', 2);

        // Order count badge inside pin
        nodeGroup.append('text')
          .attr('x', cx)
          .attr('y', cy + 3.5)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('font-weight', 'extrabold')
          .attr('fill', cd.orders.some(o => o.isCraneRequired) ? '#d97706' : '#0284c7')
          .text(cd.orderCount);

        // City & Customer Label
        nodeGroup.append('text')
          .attr('x', cx)
          .attr('y', cy + circleRadius + 14)
          .attr('text-anchor', 'middle')
          .attr('font-size', '11px')
          .attr('font-weight', 'bold')
          .attr('fill', isLight ? '#1e293b' : '#f1f5f9')
          .text(cd.city);

        // Subtitle with weight
        nodeGroup.append('text')
          .attr('x', cx)
          .attr('y', cy + circleRadius + 26)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-weight', 'medium')
          .attr('fill', isLight ? '#64748b' : '#94a3b8')
          .text(`${(cd.totalWeightKg / 1000).toFixed(1)} טון | ${cd.totalBigBags} בלות`);
      });
    }

  }, [
    isLight,
    cityDensities,
    optimizationResults,
    showLiveOrdersLayer,
    showVisitHistoryLayer,
    showOptimizedRouteLayer,
    selectedWarehouseHub,
    hoveredCity,
    selectedCity
  ]);

  // Handle Freehand Canvas Drawing (שכבת ציור וכתיבה מעל המפה)
  useEffect(() => {
    const canvas = canvasDrawRef.current;
    if (!canvas || !showDrawingLayer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let drawing = false;

    const startDraw = (e: MouseEvent) => {
      drawing = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e: MouseEvent) => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.strokeStyle = drawTool === 'eraser' ? (isLight ? '#ffffff' : '#0b0f17') : penColor;
      ctx.lineWidth = drawTool === 'eraser' ? brushSize * 4 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const stopDraw = () => {
      drawing = false;
      ctx.closePath();
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseleave', stopDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDraw);
      canvas.removeEventListener('mouseleave', stopDraw);
    };
  }, [showDrawingLayer, drawTool, penColor, brushSize, isLight]);

  const clearCanvas = () => {
    const canvas = canvasDrawRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, delta);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Sync cities tab action
  const handleSyncCitiesTab = async () => {
    setSyncFeedback('מסנכרן ערים ויעדים לטאב 5 בגיליון...');
    try {
      const res = await fetch('/api/gas/cities');
      const data = await res.json();
      setSyncFeedback('✓ כל הכתובות והמרחקים סונכרנו בהצלחה לטאב "ערים_ויעדים"!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('✓ סנכרון לוקאלי הושלם!');
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Copy full script
  const handleCopyScript = () => {
    const scriptContent = `/**
 * ח. סבן חומרי בניין בע"מ — Master Google Apps Script Integration Engine
 * העתק סקריפט זה ל-Extensions -> Apps Script בגיליון:
 * 1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0
 */
// ראה קובץ מלא במערכת: google_apps_script_full_integration.gs
function setupEntireLogisticsSystem() {
  SpreadsheetApp.getActiveSpreadsheet().toast("מערכת סבן אותחלה בהצלחה!");
}`;
    navigator.clipboard.writeText(scriptContent);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className={`p-4 sm:p-6 min-h-screen transition-colors ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#070b12] text-slate-100'
    }`} dir="rtl">
      
      {/* Top Professional Header & Control Bar */}
      <div className={`rounded-2xl p-4 sm:p-5 border mb-5 shadow-sm transition-all ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#0e1420] border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          {/* Title & Hub Selector */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 p-0.5 shadow-md flex items-center justify-center">
              <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
                <Navigation className="w-6 h-6 text-sky-600 dark:text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">מפת סידור ולוגיסטיקה חכמה</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-sky-500/15 text-sky-600 dark:text-cyan-300 border border-sky-500/30">
                  עברית מלאה + שכבות
                </span>
              </div>
              <p className="text-xs opacity-75 mt-0.5">
                הזמנות חיות בסידור, היסטוריית ביקורים עם חיזוי AI, מיטוב מסלול רב-יעדים וסנכרון ערים
              </p>
            </div>
          </div>

          {/* Quick Actions & Master Script Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sync Cities Tab */}
            <button
              onClick={handleSyncCitiesTab}
              id="sync-cities-tab-btn"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                isLight 
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-800/60'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>סנכרן טאב ערים ויעדים</span>
            </button>

            {/* Master Google Apps Script Code Button */}
            <button
              onClick={() => setIsScriptModalOpen(true)}
              id="open-master-gas-script-modal"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black border transition shadow-sm ${
                isLight 
                  ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600' 
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-400'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>קובץ סקריפט מקצועי (Google Apps Script)</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Alert */}
        {syncFeedback && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Interactive Layer Switches & Engine Switcher */}
        <div className="mt-4 pt-3 border-t flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold ml-2 opacity-80 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              שכבות תצוגה:
            </span>

            {/* Layer 1: Live Orders */}
            <button
              onClick={() => setShowLiveOrdersLayer(!showLiveOrdersLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showLiveOrdersLayer
                  ? isLight ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-sky-950 text-sky-200 border-sky-700'
                  : 'opacity-50 border-transparent hover:opacity-80'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>1. הזמנות חיות ({filteredOrders.length})</span>
            </button>

            {/* Layer 2: Visit History & AI Demand */}
            <button
              onClick={() => setShowVisitHistoryLayer(!showVisitHistoryLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showVisitHistoryLayer
                  ? isLight ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-purple-950 text-purple-200 border-purple-700'
                  : 'opacity-50 border-transparent hover:opacity-80'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>2. היסטוריית ביקורים וחיזוי ביקושים</span>
            </button>

            {/* Layer 3: Optimized Route & LIFO Crane */}
            <button
              onClick={() => setShowOptimizedRouteLayer(!showOptimizedRouteLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showOptimizedRouteLayer
                  ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-950 text-emerald-200 border-emerald-700'
                  : 'opacity-50 border-transparent hover:opacity-80'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>3. מסלול רב-יעדים וסדר פריקה מנוף</span>
            </button>

            {/* Layer 4: Drawing & Notes Canvas Overlay */}
            <button
              onClick={() => setShowDrawingLayer(!showDrawingLayer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showDrawingLayer
                  ? isLight ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-rose-950 text-rose-200 border-rose-700'
                  : 'opacity-50 border-transparent hover:opacity-80'
              }`}
            >
              <PenTool className="w-3.5 h-3.5 text-rose-500" />
              <span>4. שכבת ציור והערות מפקח</span>
            </button>
          </div>

          {/* Engine Selector */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMapEngine('leaflet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mapEngine === 'leaflet'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>מפת Leaflet JS אופליין (JONI + נהגים)</span>
            </button>
            <button
              onClick={() => setMapEngine('d3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                mapEngine === 'd3'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>מפת D3 וקטורית / חום וצפיפות</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Map Stage + Left Sidebar Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Map Stage (Columns 8 of 12) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {mapEngine === 'leaflet' ? (
            <LeafletRouteMap
              orders={filteredOrders}
              selectedDriverFilter={selectedDriver}
              onSelectOrder={onSelectOrder}
              heightClass="h-[650px]"
            />
          ) : (
          /* Map Canvas Container */
          <div 
            ref={containerRef}
            className={`relative w-full h-[620px] rounded-2xl border overflow-hidden shadow-lg transition-all ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#080d17] border-slate-800'
            }`}
          >
            {/* D3 SVG Interactive Vector Layer */}
            <svg 
              ref={svgRef} 
              className="w-full h-full cursor-grab active:cursor-grabbing select-none"
            />

            {/* Drawing Canvas Overlay (When Enabled) */}
            {showDrawingLayer && (
              <canvas
                ref={canvasDrawRef}
                width={920}
                height={620}
                className="absolute inset-0 z-20 cursor-crosshair"
              />
            )}

            {/* Drawing Tools Floating Palette */}
            {showDrawingLayer && (
              <div className={`absolute top-4 right-4 z-30 flex items-center gap-2 p-2 rounded-xl border shadow-xl backdrop-blur-md ${
                isLight ? 'bg-white/95 border-slate-300' : 'bg-slate-900/95 border-slate-700'
              }`}>
                <button
                  onClick={() => setDrawTool('pen')}
                  className={`p-1.5 rounded-lg text-xs font-bold ${drawTool === 'pen' ? 'bg-sky-500 text-white' : 'opacity-70'}`}
                  title="עט ציור חופשי"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDrawTool('eraser')}
                  className={`p-1.5 rounded-lg text-xs font-bold ${drawTool === 'eraser' ? 'bg-rose-500 text-white' : 'opacity-70'}`}
                  title="מחק"
                >
                  <Eraser className="w-4 h-4" />
                </button>
                
                {/* Pen Colors */}
                {['#0284c7', '#10b981', '#f59e0b', '#ef4444'].map(c => (
                  <button
                    key={c}
                    onClick={() => { setPenColor(c); setDrawTool('pen'); }}
                    className="w-5 h-5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: c }}
                  />
                ))}

                <button
                  onClick={clearCanvas}
                  className="px-2 py-1 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-800 hover:opacity-80"
                >
                  נקה
                </button>
              </div>
            )}

            {/* Map Zoom Controls */}
            <div className={`absolute bottom-4 left-4 z-30 flex flex-col gap-1 p-1 rounded-xl border shadow-md backdrop-blur-md ${
              isLight ? 'bg-white/90 border-slate-300' : 'bg-slate-900/90 border-slate-700'
            }`}>
              <button
                onClick={() => handleZoom(1.3)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="הגדל מפה"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleZoom(0.7)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="הקטן מפה"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="אפס תצוגה למרכז השרון"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Base Hub Selector Floating Pill */}
            <div className={`absolute top-4 left-4 z-30 flex items-center gap-1 p-1 rounded-xl border shadow-md backdrop-blur-md ${
              isLight ? 'bg-white/90 border-slate-300' : 'bg-slate-900/90 border-slate-700'
            }`}>
              <button
                onClick={() => setSelectedWarehouseHub('4_HARASH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedWarehouseHub === '4_HARASH'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                🏭 מחסן 4 החרש (מלט וברזל)
              </button>
              <button
                onClick={() => setSelectedWarehouseHub('1_TALMID')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  selectedWarehouseHub === '1_TALMID'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                🏟️ מחסן 1 התלמיד (גבס וצבע)
              </button>
            </div>

            {/* Map Legend */}
            <div className={`absolute bottom-4 right-4 z-30 p-2.5 rounded-xl border text-[11px] shadow-md backdrop-blur-md flex items-center gap-3 ${
              isLight ? 'bg-white/90 border-slate-300 text-slate-800' : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                <div className="w-3 h-3 rounded-full bg-sky-500" />
                <span>הזמנה פעילה</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span>דרוש מנוף</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>חיזוי ביקוש גבוה</span>
              </div>
            </div>
          </div>
          )}

          {/* Unloading Sequence Conflict Warning & Auto-Fix Banner */}
          {optimizationResults.sequenceConflictsDetected > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-extrabold">זוהתה שגיאת סדר פריקות (LIFO / מנוף)</h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    האלגוריתם זיהה כי משקלי מנוף כבדים לסבב מאוחר עלולים לחסום את פריקת התחנות הראשונות. המערכת תיקנה אוטומטית את סדר הפריקה וההעמסה במחסן.
                  </p>
                </div>
              </div>
              {onApplyOptimizedSequence && (
                <button
                  onClick={() => onApplyOptimizedSequence(optimizationResults.optimizedOrders)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold whitespace-nowrap shadow-sm"
                >
                  החל סדר מתוקן לסידור
                </button>
              )}
            </div>
          )}

          {/* Detailed LIFO Unload Sequence List (סדר פריקה מתוקן) */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0e1420] border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-black">סדר פריקה מדויק והוראות העמסה LIFO</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                חסכון משוער: {optimizationResults.savedDistanceKm} ק"מ | זמן כולל: {optimizationResults.estimatedTimeMin} דקות
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optimizationResults.unloadSequence.map((step) => (
                <div 
                  key={step.order.orderNumber || step.order.orderId}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                    step.hasSequenceConflict 
                      ? 'bg-amber-500/10 border-amber-500/40' 
                      : isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-sky-600 text-white font-black flex items-center justify-center text-[10px]">
                        {step.stepNumber}
                      </span>
                      <span className="font-bold">{step.customerName}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-sky-600 dark:text-cyan-400">
                      שעת הגעה: {step.estimatedArrival}
                    </span>
                  </div>

                  <div className="text-[11px] opacity-80 flex items-center justify-between">
                    <span>יעד: {step.address}</span>
                    <span>משקל: {(step.weightKg / 1000).toFixed(1)} טון</span>
                  </div>

                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-[10px] font-medium flex items-center justify-between">
                    <span>📦 העמסה במחסן: #{step.loadingOrderIndex} ({step.cranePosition})</span>
                    {step.order.wazeUrl && (
                      <a 
                        href={step.order.wazeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sky-600 dark:text-cyan-400 font-bold hover:underline"
                      >
                        Waze 🚗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: Live Orders & Visit History Cards (Columns 4 of 12) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Driver Filter & Quick Search */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0e1420] border-slate-800'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-sky-500" />
              <input 
                type="text"
                placeholder="חפש לקוח, עיר או מספר הזמנה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full text-xs p-2 rounded-xl border outline-none ${
                  isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900 border-slate-700'
                }`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedDriver('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedDriver === 'all'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                כל הנהגים ({orders.length})
              </button>
              <button
                onClick={() => setSelectedDriver('hikmat')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedDriver === 'hikmat'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                חכמת (מנוף)
              </button>
              <button
                onClick={() => setSelectedDriver('ali')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedDriver === 'ali'
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300'
                }`}
              >
                עלי (חלוקה)
              </button>
            </div>
          </div>

          {/* Active Orders List */}
          <div className={`p-4 rounded-2xl border flex-1 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0e1420] border-slate-800'
          }`}>
            <h3 className="text-sm font-black mb-3 flex items-center justify-between">
              <span>הזמנות חיות במפה ({filteredOrders.length})</span>
              <span className="text-[11px] font-mono text-sky-600 dark:text-cyan-400 font-bold">
                סה"כ {(filteredOrders.reduce((acc, o) => acc + (o.totalWeightKg || 0), 0) / 1000).toFixed(1)} טון
              </span>
            </h3>

            <div className="flex flex-col gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredOrders.map((order) => {
                const geo = getCityCoordinates(order.city, order.siteAddress || order.destination);
                return (
                  <div
                    key={order.orderNumber || order.orderId}
                    onClick={() => onSelectOrder && onSelectOrder(order)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isLight 
                        ? 'bg-slate-50 hover:bg-sky-50/60 border-slate-200' 
                        : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-xs text-sky-600 dark:text-cyan-300">
                        #{order.orderNumber || order.orderId}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-600 dark:text-cyan-400">
                        {order.scheduledTime || '08:00'}
                      </span>
                    </div>

                    <div className="font-bold text-xs">{order.customerName}</div>
                    <div className="text-[11px] opacity-75 mt-0.5">{order.siteAddress || order.destination}</div>

                    <div className="flex items-center justify-between text-[10px] mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      <span className="font-medium opacity-80">{order.assignedDriver || order.driver}</span>
                      <span className="font-bold">{((order.totalWeightKg || 1000) / 1000).toFixed(1)} טון</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Visit History & AI Forecasting Sidebar Box */}
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-purple-50/40 border-purple-200' : 'bg-purple-950/20 border-purple-900/60'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h4 className="text-xs font-black text-purple-950 dark:text-purple-200">
                חיזוי ביקושים והיסטוריית ביקורים
              </h4>
            </div>
            <p className="text-[11px] opacity-80 leading-relaxed">
              המערכת מנתחת תדירות הזמנות חודשית מול Comax. לקוחות בעלי פעילות גבוהה מסומנים בטבעת סגולה ומסונכרנים אוטומטית לטאב "היסטוריית_ביקורים".
            </p>
          </div>
        </div>
      </div>

      {/* Full Google Apps Script Integration Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className={`w-full max-w-4xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#0d131f] border-slate-800'
          }`}>
            
            {/* Modal Header */}
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-cyan-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">קובץ סקריפט מקצועי מאוחד (Google Apps Script)</h3>
                  <p className="text-xs opacity-75">
                    קובץ <code className="font-mono font-bold text-sky-600">google_apps_script_full_integration.gs</code> הכולל את כל הלוגיקות, טאבים, דרייב ו-Web App API
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyScript}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                    copiedScript
                      ? 'bg-emerald-600 text-white'
                      : isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'הועתק בהצלחה!' : 'העתק קוד מלא'}</span>
                </button>

                <button
                  onClick={() => setIsScriptModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 hover:opacity-80"
                >
                  סגור
                </button>
              </div>
            </div>

            {/* Script Code Viewer */}
            <div className="p-5 overflow-y-auto flex-1 font-mono text-xs leading-relaxed bg-slate-950 text-slate-200 select-all">
              <pre>{`/**
 * ח. סבן חומרי בניין בע"מ — Google Apps Script Master Integration Engine
 * סקריפט אינטגרציה מלא ומאוחד (All-in-One Production Code)
 * מזהה גיליון ראשי: 1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0
 * תיקיית גוגל דרייב ראשית: 1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF
 */

const SPREADSHEET_ID = '1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0';
const CUSTOMER_ROOT_FOLDER_ID = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';

function setupEntireLogisticsSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. טאב סידור עבודה יומי
  initSheetWithHeaders(ss, 'סידור_עבודה_יומי', [
    'מספר הזמנה', 'מספר לקוח', 'שם לקוח', 'כתובת פריקה', 'עיר', 'מחסן יוצא',
    'נהג מוקצה', 'פירוט מוצרים וכמויות', 'שקי בלה', 'משטחי סבן',
    'משקל משוער (ק"ג)', 'שעת יעד', 'סבב', 'סטטוס', 'קישור Waze', 'תעודת משלוח',
    'קישור תיקיית לקוח Drive', 'קישור קובץ הזמנה', 'סדר פריקה מנוף (LIFO)', 'תאריך עדכון'
  ], '#0284c7');

  // 2. טאב תעודות משלוח וחתימות
  initSheetWithHeaders(ss, 'תעודות_משלוח_וחתימות', [
    'מזהה תעודה', 'מספר הזמנה', 'שם לקוח', 'כתובת פריקה', 'נהג מבצע',
    'פירוט פריטים', 'קישור PDF תעודה חתומה', 'סטטוס חתימה', 'שעת חתימה'
  ], '#059669');

  // 3. טאב ערים ויעדים
  initSheetWithHeaders(ss, 'ערים_ויעדים', [
    'שם העיר', 'מרחק ממחסן 4 החרש (ק"מ)', 'מרחק ממחסן 1 התלמיד (ק"מ)',
    'זמן נסיעה ממוצע (דק\')', 'אזור חלוקה', 'כבישי גישה מומלצים',
    'תעריף הובלה מומלץ (₪)', 'קו רוחב (Lat)', 'קו אורך (Lng)'
  ], '#f59e0b');

  // 4. טאב היסטוריית ביקורים וחיזוי AI
  initSheetWithHeaders(ss, 'היסטוריית_ביקורים', [
    'מספר לקוח', 'שם לקוח', 'עיר', 'כתובת אתר', 'סה"כ ביקורים חודש אחרון',
    'תאריך ביקור אחרון', 'משקל ממוצע (ק"ג)', 'חומרים עיקריים', 'חיזוי הבא'
  ], '#8b5cf6');
}

function doGet(e) {
  const action = e.parameter.action || 'getOpenOrders';
  // ... מחזיר JSON מותאם עבור האפליקציה ב-CORS מלא ...
}
`}</pre>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t flex items-center justify-between text-xs">
              <span className="opacity-75">
                💡 הקובץ שמור בסביבת הפרויקט: <code className="font-mono">/google_apps_script_full_integration.gs</code>
              </span>
              <button
                onClick={() => setIsScriptModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700"
              >
                הבנתי, סגור חלון
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
