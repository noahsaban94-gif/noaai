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
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  Share2, 
  Sliders, 
  Weight, 
  Package, 
  Boxes,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Order, DriverInfo } from '../types';
import { SABAN_DRIVERS, SABAN_WAREHOUSES } from '../data/mockData';
import { 
  aggregateCityDensity, 
  CityDensityAggregate, 
  computeOptimizedRoute, 
  getCityCoordinates, 
  WAREHOUSE_COORDS,
  ISRAEL_CITIES_COORDS
} from '../utils/geoRouting';

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
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter & Mode states
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [densityMetric, setDensityMetric] = useState<'orders' | 'weight' | 'deposits'>('orders');
  const [isOptimizedView, setIsOptimizedView] = useState<boolean>(true);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);
  const [hoveredCity, setHoveredCity] = useState<CityDensityAggregate | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityDensityAggregate | null>(null);
  const [hoveredWarehouse, setHoveredWarehouse] = useState<string | null>(null);
  const [activeSimulationStep, setActiveSimulationStep] = useState<number>(0);

  // Zoom transform store
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Filter orders based on active controls
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (selectedDriver !== 'all') {
        const isHikmat = o.assignedDriver.includes('חכמת');
        const isAli = o.assignedDriver.includes('עלי');
        if (selectedDriver === 'hikmat' && !isHikmat) return false;
        if (selectedDriver === 'ali' && !isAli) return false;
      }
      if (selectedRound !== 'all' && o.round && !o.round.includes(selectedRound)) {
        return false;
      }
      return true;
    });
  }, [orders, selectedDriver, selectedRound]);

  // Aggregate City Density
  const cityDensities = useMemo(() => {
    return aggregateCityDensity(filteredOrders);
  }, [filteredOrders]);

  // Compute TSP Route Optimization
  const optimizationResults = useMemo(() => {
    const startHub = WAREHOUSE_COORDS['4_HARASH'];
    return computeOptimizedRoute(startHub, filteredOrders);
  }, [filteredOrders]);

  // Set up D3 Interactive Map & Density Network
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = 580;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height)
      .style('cursor', 'grab');

    // Defs: Gradients, Drop Shadows & Glow filters
    const defs = svg.append('defs');

    // Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Warehouse Marker Glow
    const whFilter = defs.append('filter')
      .attr('id', 'wh-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    whFilter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    const whMerge = whFilter.append('feMerge');
    whMerge.append('feMergeNode').attr('in', 'blur');
    whMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Linear Gradients for Flow Links
    const hikmatGradient = defs.append('linearGradient')
      .attr('id', 'route-hikmat')
      .attr('gradientUnits', 'userSpaceOnUse');
    hikmatGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.85);
    hikmatGradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6').attr('stop-opacity', 0.85);

    const aliGradient = defs.append('linearGradient')
      .attr('id', 'route-ali')
      .attr('gradientUnits', 'userSpaceOnUse');
    aliGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.85);
    aliGradient.append('stop').attr('offset', '100%').attr('stop-color', '#059669').attr('stop-opacity', 0.85);

    // Dynamic Density Color Scale (Turbo / Viridis inspired)
    const maxDensityVal = d3.max(cityDensities, d => {
      if (densityMetric === 'weight') return d.totalWeightKg;
      if (densityMetric === 'deposits') return d.totalBigBags + d.totalPallets;
      return d.orderCount;
    }) || 1;

    const densityColorScale = d3.scaleSequential(d3.interpolateTurbo)
      .domain([0, maxDensityVal * 1.2]);

    // Geo Projection for Sharon & Dan region (Boundaries: Lat 31.9 - 32.5, Lng 34.7 - 35.1)
    // Custom projection mapped to SVG coordinates
    const minLng = 34.72;
    const maxLng = 35.08;
    const minLat = 31.95;
    const maxLat = 32.42;

    const projectLng = d3.scaleLinear()
      .domain([minLng, maxLng])
      .range([width * 0.12, width * 0.88]);

    // Invert Lat so North (higher lat) is at the top (lower y)
    const projectLat = d3.scaleLinear()
      .domain([minLat, maxLat])
      .range([height * 0.88, height * 0.12]);

    const projectCoord = (lat: number, lng: number): [number, number] => {
      return [projectLng(lng), projectLat(lat)];
    };

    // Main Zoom Container Group
    const g = svg.append('g').attr('class', 'map-content-layer');

    // Set up D3 Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.6, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial centering transform
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    // 1. Draw Background Map Grid & Arterial Road Guides (Route 6, Route 4, Route 531)
    const roadLayer = g.append('g').attr('class', 'road-artery-layer');

    // Background Grid lines
    for (let x = 0; x < width * 1.5; x += 40) {
      roadLayer.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', height * 1.5)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,6')
        .attr('opacity', 0.3);
    }
    for (let y = 0; y < height * 1.5; y += 40) {
      roadLayer.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width * 1.5)
        .attr('y2', y)
        .attr('stroke', '#1e293b')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,6')
        .attr('opacity', 0.3);
    }

    // Major Highway representations (Route 6, Route 4, Route 531)
    const highways = [
      { name: 'כביש 6 (חוצה ישראל)', coords: [[32.42, 35.02], [32.32, 34.99], [32.23, 34.98], [32.14, 34.96], [32.05, 34.95]], color: '#334155' },
      { name: 'כביש 4 (גהה / שרון)', coords: [[32.38, 34.89], [32.28, 34.88], [32.18, 34.87], [32.08, 34.85], [31.98, 34.82]], color: '#334155' },
      { name: 'כביש 531 (עוקף שרון)', coords: [[32.17, 34.96], [32.18, 34.91], [32.19, 34.86], [32.18, 34.83]], color: '#475569' }
    ];

    const lineGenerator = d3.line<[number, number]>()
      .x(d => projectLng(d[1]))
      .y(d => projectLat(d[0]))
      .curve(d3.curveCatmullRom.alpha(0.5));

    highways.forEach(hw => {
      roadLayer.append('path')
        .datum(hw.coords as [number, number][])
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', hw.color)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.4)
        .attr('stroke-dasharray', '4,4');

      // Highway label
      const mid = hw.coords[Math.floor(hw.coords.length / 2)];
      const [midX, midY] = projectCoord(mid[0], mid[1]);
      roadLayer.append('text')
        .attr('x', midX + 6)
        .attr('y', midY)
        .attr('fill', '#64748b')
        .attr('font-size', '9px')
        .attr('font-family', 'system-ui')
        .attr('opacity', 0.6)
        .text(hw.name);
    });

    // 2. Heatmap Density Halos & Iso-Contour Glows
    const densityLayer = g.append('g').attr('class', 'density-contours');

    cityDensities.forEach(cd => {
      const [cx, cy] = projectCoord(cd.lat, cd.lng);
      const intensity = densityMetric === 'weight'
        ? (cd.totalWeightKg / maxDensityVal)
        : densityMetric === 'deposits'
          ? ((cd.totalBigBags + cd.totalPallets) / maxDensityVal)
          : (cd.orderCount / maxDensityVal);

      const baseRadius = 26 + intensity * 45;

      // Radial Heat Gradient
      const radialGradId = `heat-${cd.city.replace(/\s+/g, '')}`;
      const rGrad = defs.append('radialGradient')
        .attr('id', radialGradId)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      const col = densityColorScale(intensity * maxDensityVal);
      rGrad.append('stop').attr('offset', '0%').attr('stop-color', col).attr('stop-opacity', 0.45);
      rGrad.append('stop').attr('offset', '60%').attr('stop-color', col).attr('stop-opacity', 0.15);
      rGrad.append('stop').attr('offset', '100%').attr('stop-color', col).attr('stop-opacity', 0);

      densityLayer.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', baseRadius)
        .attr('fill', `url(#${radialGradId})`)
        .attr('class', 'animate-pulse')
        .style('animation-duration', `${3 + intensity * 2}s`);
    });

    // 3. Draw Optimized / Naive Route Trajectories
    const routeLayer = g.append('g').attr('class', 'route-paths-layer');

    const waypoints = optimizationResults.waypoints;
    if (waypoints.length > 1) {
      const pathCoords: [number, number][] = waypoints.map(w => [w.lat, w.lng]);
      const routePathData = lineGenerator(pathCoords);

      // Route Shadow Layer
      routeLayer.append('path')
        .datum(pathCoords)
        .attr('d', routePathData)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 6)
        .attr('stroke-opacity', 0.25)
        .attr('filter', 'url(#glow)');

      // Primary Route Line
      const mainPath = routeLayer.append('path')
        .datum(pathCoords)
        .attr('d', routePathData)
        .attr('fill', 'none')
        .attr('stroke', selectedDriver === 'ali' ? 'url(#route-ali)' : 'url(#route-hikmat)')
        .attr('stroke-width', 3)
        .attr('stroke-dasharray', isOptimizedView ? 'none' : '6,6')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round');

      // Animated Flowing Particles along Route
      const flowPath = routeLayer.append('path')
        .datum(pathCoords)
        .attr('d', routePathData)
        .attr('fill', 'none')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '8,24')
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.85);

      // CSS Flow Animation
      flowPath.append('animate')
        .attr('attributeName', 'stroke-dashoffset')
        .attr('from', '64')
        .attr('to', '0')
        .attr('dur', '1.8s')
        .attr('repeatCount', 'indefinite');

      // Waypoint Step Direction Arrows
      for (let i = 0; i < waypoints.length - 1; i++) {
        const p1 = projectCoord(waypoints[i].lat, waypoints[i].lng);
        const p2 = projectCoord(waypoints[i + 1].lat, waypoints[i + 1].lng);
        const midPoint: [number, number] = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
        const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);

        const arrowGroup = routeLayer.append('g')
          .attr('transform', `translate(${midPoint[0]}, ${midPoint[1]}) rotate(${angle})`);

        arrowGroup.append('polygon')
          .attr('points', '-4,-4 4,0 -4,4')
          .attr('fill', '#38bdf8')
          .attr('opacity', 0.9);
      }
    }

    // 4. Draw Saban Base Warehouse Anchors (Tira Hubs)
    const warehouseLayer = g.append('g').attr('class', 'warehouses-layer');

    Object.values(WAREHOUSE_COORDS).forEach(wh => {
      const [wx, wy] = projectCoord(wh.lat, wh.lng);
      const isHarash = wh.id === '4_HARASH';

      const whGroup = warehouseLayer.append('g')
        .attr('transform', `translate(${wx}, ${wy})`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredWarehouse(wh.id))
        .on('mouseleave', () => setHoveredWarehouse(null));

      // Outer Warehouse Radar Rings
      whGroup.append('circle')
        .attr('r', 16)
        .attr('fill', isHarash ? '#f59e0b' : '#38bdf8')
        .attr('fill-opacity', 0.15)
        .attr('stroke', isHarash ? '#f59e0b' : '#38bdf8')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');

      whGroup.append('circle')
        .attr('r', 9)
        .attr('fill', isHarash ? '#f59e0b' : '#0284c7')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#wh-glow)');

      // Warehouse Pin Label
      whGroup.append('rect')
        .attr('x', -35)
        .attr('y', -28)
        .attr('width', 70)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#0f172a')
        .attr('stroke', isHarash ? '#f59e0b' : '#38bdf8')
        .attr('stroke-width', 1);

      whGroup.append('text')
        .attr('x', 0)
        .attr('y', -17)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '9px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'system-ui')
        .text(wh.shortName);
    });

    // 5. Draw City Delivery Density Hubs (Interactive Nodes)
    const hubsLayer = g.append('g').attr('class', 'city-hubs-layer');

    cityDensities.forEach((cd, idx) => {
      const [hx, hy] = projectCoord(cd.lat, cd.lng);
      const isSelected = selectedCity?.city === cd.city;

      const hubSize = d3.scaleSqrt()
        .domain([1, maxDensityVal || 5])
        .range([12, 28])(
          densityMetric === 'weight'
            ? cd.totalWeightKg
            : densityMetric === 'deposits'
              ? cd.totalBigBags + cd.totalPallets
              : cd.orderCount
        );

      const hubGroup = hubsLayer.append('g')
        .attr('transform', `translate(${hx}, ${hy})`)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredCity(cd))
        .on('mouseleave', () => setHoveredCity(null))
        .on('click', () => {
          setSelectedCity(prev => (prev?.city === cd.city ? null : cd));
        });

      // Highlight Ring if selected
      if (isSelected) {
        hubGroup.append('circle')
          .attr('r', hubSize + 8)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2.5)
          .attr('stroke-dasharray', '4,4');
      }

      // Base Circle
      hubGroup.append('circle')
        .attr('r', hubSize)
        .attr('fill', densityColorScale(
          densityMetric === 'weight'
            ? cd.totalWeightKg
            : densityMetric === 'deposits'
              ? cd.totalBigBags + cd.totalPallets
              : cd.orderCount
        ))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow)');

      // City Order Count Badge inside Hub
      hubGroup.append('text')
        .attr('x', 0)
        .attr('y', 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#090d16')
        .attr('font-size', hubSize > 16 ? '12px' : '10px')
        .attr('font-weight', '900')
        .attr('font-family', 'system-ui')
        .text(cd.orderCount);

      // City Name Banner below Hub
      const textLen = cd.city.length * 7 + 16;
      hubGroup.append('rect')
        .attr('x', -textLen / 2)
        .attr('y', hubSize + 3)
        .attr('width', textLen)
        .attr('height', 16)
        .attr('rx', 4)
        .attr('fill', '#020617')
        .attr('stroke', '#334155')
        .attr('stroke-width', 1);

      hubGroup.append('text')
        .attr('x', 0)
        .attr('y', hubSize + 14)
        .attr('text-anchor', 'middle')
        .attr('fill', '#f1f5f9')
        .attr('font-size', '10px')
        .attr('font-weight', '600')
        .attr('font-family', 'system-ui')
        .text(cd.city);
    });

  }, [cityDensities, optimizationResults, selectedDriver, selectedRound, densityMetric, isOptimizedView, selectedCity]);

  // Handle Zoom In / Out / Reset
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomBehaviorRef.current.scaleBy, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(450)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Live Multi-Stop Navigation URL Generator
  const generateMultiStopUrl = () => {
    const waypoints = optimizationResults.waypoints.filter(w => !w.isWarehouse);
    if (waypoints.length === 0) return '#';
    const query = waypoints.map(w => encodeURIComponent(w.name)).join('/');
    return `https://www.google.com/maps/dir/Tira,+Israel/${query}/Tira,+Israel`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              מפת צפיפות ומיטוב מסלולים D3.js
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Sharon & Dan Logistics Grid
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ניתוח צפיפות יעדים ומיטוב מסלולי נסיעה יומיים
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            ויזואליזציה מרחבית מבוססת D3 לחישוב צפיפות הזמנות לפי ערים, קיצור נסועה (TSP), וחיסכון בזמני פריקה באתרים.
          </p>
        </div>

        {/* Quick Route Summary Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px]">מרחק מסלול ממוטב:</span>
            <span className="text-cyan-400 font-mono font-bold text-sm">
              {optimizationResults.optimizedDistanceKm} ק"מ
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs">
            <span className="text-emerald-400 block text-[10px]">חיסכון בנסועה:</span>
            <span className="text-emerald-300 font-mono font-bold text-sm">
              -{optimizationResults.savedDistanceKm} ק"מ ({Math.round((optimizationResults.savedDistanceKm / (optimizationResults.originalDistanceKm || 1)) * 100)}%)
            </span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[10px]">זמן סבב משוער:</span>
            <span className="text-amber-400 font-mono font-bold text-sm">
              {Math.floor(optimizationResults.estimatedTimeMin / 60)} ש' {optimizationResults.estimatedTimeMin % 60} דק'
            </span>
          </div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-3">
        {/* Left: Driver & Round filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Driver Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedDriver('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedDriver === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              כל הצי (2 משאיות)
            </button>
            <button
              onClick={() => setSelectedDriver('hikmat')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedDriver === 'hikmat' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              חכמת (מנוף 26ט)
            </button>
            <button
              onClick={() => setSelectedDriver('ali')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedDriver === 'ali' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              עלי (15ט)
            </button>
          </div>

          {/* Density Metric Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setDensityMetric('orders')}
              className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition ${
                densityMetric === 'orders' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>צפיפות הזמנות</span>
            </button>
            <button
              onClick={() => setDensityMetric('weight')}
              className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition ${
                densityMetric === 'weight' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Weight className="w-3 h-3" />
              <span>משקל בטונות</span>
            </button>
            <button
              onClick={() => setDensityMetric('deposits')}
              className={`px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition ${
                densityMetric === 'deposits' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Boxes className="w-3 h-3" />
              <span>פקדונות בלות/משטחים</span>
            </button>
          </div>
        </div>

        {/* Right: Map View & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* TSP Optimization Toggle */}
          <button
            onClick={() => setIsOptimizedView(!isOptimizedView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isOptimizedView
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isOptimizedView ? 'מסלול ממוטב AI פעיל' : 'מסלול מקורי רגיל'}</span>
          </button>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleZoom(1.3)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="התקרב"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="התרחק"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="איפוס מבט"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Multi-stop Google Maps / Waze Link */}
          <a
            href={generateMultiStopUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>פתח מסלול רב-יעדים</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Interactive D3 Visualizer Canvas & Detail Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* D3 Map Canvas (3 Cols) */}
        <div 
          ref={containerRef}
          className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative min-h-[580px] flex items-center justify-center"
        >
          {/* SVG Map Render Target */}
          <svg ref={svgRef} className="w-full h-full block" />

          {/* Map Legend Overlay (Top Left) */}
          <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] space-y-2 shadow-lg max-w-[200px]">
            <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
              <span>מקרא מפת מסלולים</span>
              <Info className="w-3 h-3 text-cyan-400" />
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shrink-0"></span>
                <span>מחסן 4 החרש (בסיס)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white shrink-0"></span>
                <span>מחסן 1 התלמיד</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shrink-0"></span>
                <span>צפיפות יעדי אספקה</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-cyan-400 border-dashed shrink-0"></span>
                <span>נתיב זרימת הובלה</span>
              </div>
            </div>

            <div className="pt-1 text-[10px] text-slate-500">
              * ניתן לגרור עם העכבר ולבצע Zoom
            </div>
          </div>

          {/* Dynamic Hover Tooltip Overlay */}
          {hoveredCity && (
            <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-cyan-800/80 p-4 rounded-2xl shadow-2xl text-xs max-w-sm space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-white text-sm">{hoveredCity.city}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold text-[10px]">
                  דירוג צפיפות #{hoveredCity.densityRank}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">הזמנות פעילות:</span>
                  <span className="text-white font-bold">{hoveredCity.orderCount} הזמנות</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">משקל מטען כולל:</span>
                  <span className="text-cyan-300 font-bold">{(hoveredCity.totalWeightKg / 1000).toFixed(1)} טון</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">שקי בלה לפקדון:</span>
                  <span className="text-amber-400 font-bold">{hoveredCity.totalBigBags} בלות</span>
                </div>
                <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">משטחי סבן:</span>
                  <span className="text-purple-400 font-bold">{hoveredCity.totalPallets} משטחים</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1 pt-1">
                <span className="text-slate-400 block text-[10px]">לקוחות באתר:</span>
                {hoveredCity.orders.map(o => (
                  <div key={o.orderNumber} className="flex justify-between items-center bg-slate-950/40 px-2 py-1 rounded">
                    <span>{o.customerName}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{o.scheduledTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hover Warehouse Tooltip */}
          {hoveredWarehouse && (
            <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md border border-amber-800/80 p-3.5 rounded-2xl shadow-2xl text-xs max-w-xs space-y-1.5">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>{WAREHOUSE_COORDS[hoveredWarehouse as keyof typeof WAREHOUSE_COORDS]?.name}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                מרכז לוגיסטי ראשי של ח. סבן — נקודת יציאה לסבבי בוקר וצהריים.
              </p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Optimized Waypoints Sequence & Density Leaderboard (1 Col) */}
        <div className="space-y-4">
          {/* Waypoints Sequence Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">סדר פריקה ממוטב</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {optimizationResults.waypoints.length - 2} תחנות
              </span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
              {optimizationResults.waypoints.map((wp, i) => {
                const isStartOrEnd = wp.isWarehouse;

                return (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                      isStartOrEnd
                        ? 'bg-slate-950/90 border-slate-800 text-slate-300'
                        : 'bg-slate-900 border-cyan-900/60 hover:border-cyan-700 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                        isStartOrEnd ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-cyan-500 text-slate-950'
                      }`}>
                        {i === 0 ? '🏁' : i === optimizationResults.waypoints.length - 1 ? '🔄' : i}
                      </span>
                      <span className="font-medium truncate max-w-[150px]">{wp.name}</span>
                    </div>

                    {wp.orderNumber && (
                      <span className="font-mono text-[10px] text-cyan-400">
                        #{wp.orderNumber}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {onApplyOptimizedSequence && optimizationResults.optimizedOrders.length > 0 && (
              <button
                onClick={() => onApplyOptimizedSequence(optimizationResults.optimizedOrders)}
                className="w-full mt-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>החל שיבוץ ממוטב על הגיליון</span>
              </button>
            )}
          </div>

          {/* City Density Ranking Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">ריכוז צפיפות לפי ערים</h3>
              </div>
              <span className="text-[10px] text-slate-400">
                {cityDensities.length} ערים פעילות
              </span>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {cityDensities.map(cd => (
                <div
                  key={cd.city}
                  onClick={() => setSelectedCity(prev => (prev?.city === cd.city ? null : cd))}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    selectedCity?.city === cd.city
                      ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {cd.densityRank}
                    </span>
                    <span className="font-semibold text-white">{cd.city}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-cyan-400 font-bold">{cd.orderCount} הזמנות</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">{(cd.totalWeightKg / 1000).toFixed(1)}ט</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
