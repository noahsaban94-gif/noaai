import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Filter, 
  Truck, 
  MapPin, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Send,
  Building,
  Navigation,
  FileCheck,
  PackageCheck,
  LayoutGrid,
  List,
  Eye,
  AlertCircle,
  TrendingUp,
  FileText,
  Calendar,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Boxes,
  Scale,
  Copy,
  PenTool,
  RotateCcw,
  Zap,
  Activity,
  Check,
  Phone
} from 'lucide-react';
import { Order, OrderStatus, WarehouseId } from '../types';
import { SABAN_DRIVERS } from '../data/mockData';
import { NewOrderModal } from './NewOrderModal';
import { OrderCardModal } from './OrderCardModal';

interface OrdersDashboardProps {
  orders: Order[];
  onAddOrder: (order: Order) => Promise<void>;
  onUpdateStatus: (orderNumber: string, status: OrderStatus) => void;
  onInjectEmailOrders: () => Promise<void>;
  onSendWhatsApp: (order: Order) => void;
  isInjecting: boolean;
  onGenerateDeliveryNote?: (order: Order, signatureDataUrl?: string) => void;
  onNavigateToDensityMap?: () => void;
  onNavigateToNoaChat?: () => void;
}

export const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  orders,
  onAddOrder,
  onUpdateStatus,
  onInjectEmailOrders,
  onSendWhatsApp,
  isInjecting,
  onGenerateDeliveryNote,
  onNavigateToDensityMap,
  onNavigateToNoaChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | WarehouseId>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'cards' | 'grid'>('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Copy Order ID helper
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const customer = order.customerName || '';
    const num = order.orderNumber || order.orderId || '';
    const city = order.city || '';
    const dest = order.siteAddress || order.destination || '';
    const driver = order.assignedDriver || order.driver || '';

    const matchesSearch = 
      customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      num.includes(searchTerm) ||
      city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dest.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesWarehouse = warehouseFilter === 'all' || order.warehouse === warehouseFilter;
    const matchesDriver = 
      driverFilter === 'all' || 
      (driverFilter === 'hikmat' && driver.includes('חכמת')) ||
      (driverFilter === 'ali' && driver.includes('עלי'));
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesWarehouse && matchesDriver && matchesStatus;
  });

  // KPI Calculations
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'בסידור עבודה').length;
  const inProgressOrdersCount = orders.filter(o => o.status === 'In Progress' || o.status === 'בדרך לאתר' || o.status === 'הועמס במחסן').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered' || o.status === 'סופק בהצלחה').length;
  const totalWeightToday = orders.reduce((acc, o) => acc + (o.totalWeightKg || 0), 0);
  const completionPercentage = Math.round((deliveredOrdersCount / (totalOrdersCount || 1)) * 100);

  // Helper for Status Stage Steps (0: Pending, 1: Loading, 2: In Transit, 3: Delivered)
  const getOrderProgressStep = (status: OrderStatus): number => {
    if (status === 'Delivered' || status === 'סופק בהצלחה') return 3;
    if (status === 'בדרך לאתר' || status === 'In Progress') return 2;
    if (status === 'הועמס במחסן') return 1;
    return 0; // 'Pending' or 'בסידור עבודה'
  };

  // Status mapping helper
  const getNormalizedStatusKey = (status: OrderStatus): 'Pending' | 'In Progress' | 'Delivered' => {
    if (status === 'Delivered' || status === 'סופק בהצלחה') return 'Delivered';
    if (status === 'In Progress' || status === 'בדרך לאתר' || status === 'הועמס במחסן') return 'In Progress';
    return 'Pending';
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    if (status === 'Delivered' || status === 'סופק בהצלחה') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (status === 'In Progress' || status === 'בדרך לאתר') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (status === 'הועמס במחסן') {
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus => {
    if (currentStatus === 'Pending' || currentStatus === 'בסידור עבודה') return 'In Progress';
    if (currentStatus === 'In Progress' || currentStatus === 'בדרך לאתר' || currentStatus === 'הועמס במחסן') return 'Delivered';
    return 'Pending';
  };

  const kanbanColumns: Array<{
    id: 'Pending' | 'In Progress' | 'Delivered';
    title: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    accentColor: string;
    count: number;
  }> = [
    {
      id: 'Pending',
      title: 'ממתין בסידור עבודה',
      description: 'נקלטו במערכת וממתינות להעמסה במחסן',
      color: 'text-slate-100',
      bgColor: 'bg-slate-900/80',
      borderColor: 'border-slate-800',
      accentColor: 'bg-slate-500',
      count: pendingOrdersCount
    },
    {
      id: 'In Progress',
      title: 'בהעמסה / בדרך לאתר',
      description: 'משאיות פעילות בסבב אספקה וחלוקה',
      color: 'text-amber-300',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-900/40',
      accentColor: 'bg-amber-400',
      count: inProgressOrdersCount
    },
    {
      id: 'Delivered',
      title: 'סופק בהצלחה ונחתם',
      description: 'נפרק באתר הלקוח ומאושר לתעודת משלוח',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-900/40',
      accentColor: 'bg-emerald-400',
      count: deliveredOrdersCount
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner: High-clarity & Bright Accents */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/40 border border-slate-800/90 p-5 sm:p-6 rounded-3xl shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 shadow-sm">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>דשבורד סידור עבודה חי</span>
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Google Sheets Live: סידור_עבודה_יומי (טאב 2)</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>ריכוז הזמנות פעילות, שיבוץ נהגים ובקרת אספקות</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              ניהול לוגיסטי אוטונומי בזמן אמת עבור מחסני ח. סבן חומרי בניין (מחסן 4 החרש ומחסן 1 התלמיד).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Inject Comax Orders Button */}
            <button
              onClick={onInjectEmailOrders}
              disabled={isInjecting}
              id="inject-core-orders-btn"
              title="סנכרן הזמנות מתיבת דואל לגיליון"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/80 text-xs font-bold transition shadow-lg shadow-purple-950/30"
            >
              <Sparkles className={`w-4 h-4 ${isInjecting ? 'animate-spin' : 'text-purple-400'}`} />
              <span>{isInjecting ? 'מזריק הזמנות...' : 'סנכרן מתיבת דוא"ל Comax'}</span>
            </button>

            {/* New Order Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              id="open-new-order-modal-btn"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>הוסף הזמנה לסידור</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: High-Contrast & Bright Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Orders */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-4 sm:p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">סה"כ הזמנות להיום</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {totalOrdersCount}
            </span>
            <span className="text-xs text-cyan-400 font-mono font-semibold">הזמנות פעילות</span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>משקל מצטבר:</span>
            <span className="text-white font-bold">{totalWeightToday.toLocaleString()} ק"ג</span>
          </div>
        </div>

        {/* KPI 2: Active Trucks */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-4 sm:p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">משאיות פעילות בסבב</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
              2 / 2
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              100% זמינות צי
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>חכמת (מנוף 26ט)</span>
            <span className="text-slate-300">עלי (15ט)</span>
          </div>
        </div>

        {/* KPI 3: In Progress & Pending */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-4 sm:p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">בתהליך חלוקה / ממתין</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
              {pendingOrdersCount + inProgressOrdersCount}
            </span>
            <span className="text-xs text-amber-400 font-mono">
              ({inProgressOrdersCount} בדרך)
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>ממתינות להעמסה:</span>
            <span className="text-amber-400 font-bold">{pendingOrdersCount}</span>
          </div>
        </div>

        {/* KPI 4: Delivered with Live Progress Bar */}
        <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-4 sm:p-5 rounded-2xl shadow-xl transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">סופקו בהצלחה</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
              {deliveredOrdersCount}
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              {completionPercentage}% ביצוע
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Bar: Sleek & Bright */}
      <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש לפי שם לקוח, מספר הזמנה, עיר, כתובת אתר..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              נקה
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warehouse Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setWarehouseFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                warehouseFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              כל המחסנים
            </button>
            <button
              onClick={() => setWarehouseFilter('4_HARASH')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                warehouseFilter === '4_HARASH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏭 4 החרש</span>
            </button>
            <button
              onClick={() => setWarehouseFilter('1_TALMID')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                warehouseFilter === '1_TALMID' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏟️ 1 התלמיד</span>
            </button>
          </div>

          {/* Driver Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs">
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium text-xs focus:outline-none cursor-pointer py-1"
            >
              <option value="all" className="bg-slate-900 text-white">כל הנהגים</option>
              {SABAN_DRIVERS.map((driver) => (
                <option key={driver.id} value={driver.id} className="bg-slate-900 text-white">
                  {driver.name} ({driver.truckPlate})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium text-xs focus:outline-none cursor-pointer py-1"
            >
              <option value="all" className="bg-slate-900 text-white">כל הסטטוסים</option>
              <option value="Pending" className="bg-slate-900 text-white">בסידור עבודה (Pending)</option>
              <option value="In Progress" className="bg-slate-900 text-white">בדרך לאתר (In Progress)</option>
              <option value="Delivered" className="bg-slate-900 text-white">סופק בהצלחה (Delivered)</option>
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Kanban vs Grid */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'cards' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת כרטיסים חיים מפורטת"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>כרטיסים חיים</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'kanban' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת לוח קנבן שלבים"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>לוח קנבן</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת טבלת נתונים מלאה"
            >
              <List className="w-3.5 h-3.5" />
              <span>טבלה</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: LIVE INTERACTIVE ORDER CARDS (Featured View) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredOrders.map((order) => {
            const step = getOrderProgressStep(order.status);
            const orderIdStr = order.orderId || order.orderNumber;
            const isCopied = copiedId === orderIdStr;

            return (
              <div
                key={orderIdStr}
                onClick={() => setSelectedOrder(order)}
                className="group relative bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-5 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                {/* Accent Top Border Glowing Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  order.status === 'Delivered' || order.status === 'סופק בהצלחה'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : order.status === 'In Progress' || order.status === 'בדרך לאתר'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`} />

                <div className="space-y-4">
                  {/* Top Bar: Order ID, Copy, Warehouse, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-black text-white bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1 group-hover:text-cyan-300 transition">
                        <span>#{orderIdStr}</span>
                      </span>
                      <button
                        onClick={(e) => handleCopyId(orderIdStr, e)}
                        className="p-1 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition"
                        title="העתק מספר הזמנה"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {order.warehouse === '4_HARASH' ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[11px] font-medium flex items-center gap-1">
                          🏭 4 החרש
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[11px] font-medium flex items-center gap-1">
                          🏟️ 1 התלמיד
                        </span>
                      )}

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Destination */}
                  <div>
                    <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition leading-snug">
                      {order.customerName}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-slate-300 mt-1.5">
                      <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{order.siteAddress || order.destination || order.city}</span>
                      </div>
                      <a
                        href={order.wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-2.5 py-1 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 text-[11px] font-bold flex items-center gap-1 transition shadow-sm"
                        title="נווט עם Waze לאתר"
                      >
                        <Navigation className="w-3 h-3 text-cyan-400" />
                        <span>Waze</span>
                      </a>
                    </div>
                  </div>

                  {/* Visual Step-by-Step Delivery Progress Bar */}
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                      <span className={step >= 0 ? 'text-cyan-400 font-bold' : ''}>1. נקלט</span>
                      <span className={step >= 1 ? 'text-cyan-400 font-bold' : ''}>2. הועמס</span>
                      <span className={step >= 2 ? 'text-amber-400 font-bold' : ''}>3. בדרך</span>
                      <span className={step >= 3 ? 'text-emerald-400 font-bold' : ''}>4. סופק ✓</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((sIndex) => (
                        <div
                          key={sIndex}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            sIndex <= step
                              ? step === 3
                                ? 'bg-emerald-400'
                                : step === 2
                                ? 'bg-amber-400'
                                : 'bg-cyan-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Driver & Schedule Row */}
                  <div className="flex items-center justify-between bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/50 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                        <Truck className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <span className="font-bold text-white block leading-tight">
                          {order.assignedDriver || order.driver}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {order.isCraneRequired ? 'משאית מנוף 🏗️' : 'משאית חלוקה 🚚'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{order.scheduledTime || '08:30'}</span>
                    </div>
                  </div>

                  {/* Normalized Items Preview Box */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono block">פירוט פריטים מנורמל (Comax):</span>
                    <p className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-xs text-cyan-300 line-clamp-2 leading-relaxed">
                      {order.itemsDetails || order.itemsFormatted}
                    </p>
                  </div>

                  {/* Deposits & Weight Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {order.bigBagsDeposit > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/40 flex items-center gap-1">
                        <Boxes className="w-3 h-3" />
                        <span>בלות: {order.bigBagsDeposit}</span>
                      </span>
                    )}
                    {order.palletsDeposit > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 flex items-center gap-1">
                        <PackageCheck className="w-3 h-3" />
                        <span>משטחי סבן: {order.palletsDeposit}</span>
                      </span>
                    )}
                    {order.totalWeightKg > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400" />
                        <span>{order.totalWeightKg.toLocaleString()} ק"ג</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Quick Action Bar on Card */}
                <div 
                  className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Send WhatsApp */}
                    <button
                      onClick={() => onSendWhatsApp(order)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/70 text-xs font-medium flex items-center gap-1.5 transition"
                      title="שגר תדריך וואטסאפ לנהג"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      <span>וואטסאפ</span>
                    </button>

                    {/* Quick Status Advance */}
                    <button
                      onClick={() => onUpdateStatus(order.orderNumber, getNextStatus(order.status))}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1"
                      title="קדם סטטוס אספקה"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>
                        {order.status === 'Pending' || order.status === 'בסידור עבודה'
                          ? 'העבר לביצוע'
                          : order.status === 'In Progress' || order.status === 'בדרך לאתר'
                          ? 'סמן כסופק'
                          : 'אפס סטטוס'}
                      </span>
                    </button>
                  </div>

                  {/* Open Details */}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>פרטים</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => {
            const colOrders = filteredOrders.filter(
              (o) => getNormalizedStatusKey(o.status) === col.id
            );

            return (
              <div
                key={col.id}
                className={`rounded-3xl border ${col.borderColor} ${col.bgColor} p-4 flex flex-col min-h-[520px] shadow-xl`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${col.accentColor}`} />
                    <div>
                      <h3 className={`text-sm font-black ${col.color}`}>{col.title}</h3>
                      <p className="text-[10px] text-slate-400">{col.description}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-950 text-white font-mono font-bold text-xs border border-slate-800 shadow-inner">
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                  {colOrders.map((order) => (
                    <div
                      key={order.orderNumber || order.orderId}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-slate-950/90 border border-slate-800 hover:border-cyan-500/60 rounded-2xl p-4 space-y-3 cursor-pointer transition shadow-md hover:shadow-cyan-500/10 group"
                    >
                      {/* Top Row: Order ID & Warehouse */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                          #{order.orderId || order.orderNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                          {order.warehouse === '4_HARASH' ? '🏭 4 החרש' : '🏟️ 1 התלמיד'}
                        </span>
                      </div>

                      {/* Customer Name */}
                      <h4 className="text-sm font-bold text-white leading-tight">
                        {order.customerName}
                      </h4>

                      {/* Destination & Waze */}
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="truncate">{order.siteAddress || order.destination}</span>
                        </div>
                        <a
                          href={order.wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:text-cyan-300 shrink-0 p-1"
                          title="פתח Waze"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Driver & Time */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.assignedDriver || order.driver}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{order.scheduledTime}</span>
                        </div>
                      </div>

                      {/* Normalized Items Preview */}
                      <div className="bg-slate-900/80 p-2 rounded-xl text-xs font-mono text-cyan-300 line-clamp-2 border border-slate-800/60">
                        {order.itemsDetails || order.itemsFormatted}
                      </div>

                      {/* Quick Status Advance */}
                      <div className="flex items-center justify-between pt-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {order.bigBagsDeposit > 0 ? `בלות: ${order.bigBagsDeposit}` : ''} {order.palletsDeposit > 0 ? `| משטחים: ${order.palletsDeposit}` : ''}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {col.id === 'Pending' && (
                            <button
                              onClick={() => onUpdateStatus(order.orderNumber, 'In Progress')}
                              className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition flex items-center gap-1"
                            >
                              <span>העבר להעמסה ➜</span>
                            </button>
                          )}
                          {col.id === 'In Progress' && (
                            <button
                              onClick={() => onUpdateStatus(order.orderNumber, 'Delivered')}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                            >
                              <span>סמן כסופק ✓</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="h-40 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      אין הזמנות בסטטוס זה
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: DATA GRID TABLE (Google Sheets Table 2 Representation) */}
      {viewMode === 'grid' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-4">מספר הזמנה (Order_ID)</th>
                  <th className="p-4">שם לקוח (Customer_Name)</th>
                  <th className="p-4">יעד פריקה (Destination)</th>
                  <th className="p-4">נהג משויך (Driver)</th>
                  <th className="p-4">פירוט פריטים מנורמל (Items_Details)</th>
                  <th className="p-4">מחסן יוצא</th>
                  <th className="p-4">משקל / פקדון</th>
                  <th className="p-4">סטטוס (Status)</th>
                  <th className="p-4 text-center">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.orderNumber || order.orderId}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="p-4 font-mono font-bold text-cyan-400">
                      #{order.orderId || order.orderNumber}
                    </td>
                    <td className="p-4 font-bold text-white text-sm">
                      {order.customerName}
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{order.siteAddress || order.destination}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.assignedDriver || order.driver}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs text-cyan-300 max-w-xs">
                      <p className="truncate">{order.itemsDetails || order.itemsFormatted}</p>
                    </td>
                    <td className="p-4 text-slate-300">
                      {order.warehouse === '4_HARASH' ? (
                        <span className="text-amber-400 font-medium">🏭 4 החרש</span>
                      ) : (
                        <span className="text-blue-400 font-medium">🏟️ 1 התלמיד</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-400">
                      {order.totalWeightKg} ק"ג
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition flex items-center gap-1 font-medium"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>צפה בכרטיס</span>
                        </button>
                        <button
                          onClick={() => onSendWhatsApp(order)}
                          className="p-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition"
                          title="שלח תדריך וואטסאפ לנהג"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddOrder={onAddOrder}
      />

      {/* View C: Order Card Modal */}
      <OrderCardModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={onUpdateStatus}
        onGenerateDeliveryNote={onGenerateDeliveryNote}
      />
    </div>
  );
};
