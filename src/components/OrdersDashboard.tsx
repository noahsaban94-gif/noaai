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
  Phone,
  Package,
  Loader2
} from 'lucide-react';
import { Order, OrderStatus, WarehouseId } from '../types';
import { SABAN_DRIVERS } from '../data/mockData';
import { NewOrderModal } from './NewOrderModal';
import { OrderCardModal } from './OrderCardModal';
import { OrderDocumentViewerModal } from './OrderDocumentViewerModal';
import { useTheme } from '../context/ThemeContext';

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
  onUpdateOrderDocument?: (orderNumber: string, docUrl: string, docName: string, directSheetViewUrl?: string, orderFileBase64?: string) => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
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
  onNavigateToNoaChat,
  onUpdateOrderDocument,
  showToast = () => {}
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | WarehouseId>('all');
  const [driverFilter, setDriverFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'kanban' | 'grid'>('cards');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewerModalOrder, setViewerModalOrder] = useState<Order | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingDriveOrder, setLoadingDriveOrder] = useState<string | null>(null);

  // Copy Order ID helper
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Dedicated API call to Google Drive to fetch direct order file link and customer folder by Customer ID
  const handleFetchDriveFile = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    const orderNum = order.orderNumber || order.orderId || '';
    const customerId = order.customerNumber || '607125';

    setLoadingDriveOrder(orderNum);
    showToast(`שולף קישור ישיר לקובץ הזמנה מ-Google Drive עבור לקוח #${customerId}...`, 'info');

    try {
      const res = await fetch(`/api/drive/customer-file/${encodeURIComponent(customerId)}?orderNumber=${encodeURIComponent(orderNum)}&customerName=${encodeURIComponent(order.customerName)}`);
      const data = await res.json();

      if (data && data.status === 'success') {
        const updatedOrder: Order = {
          ...order,
          orderDocumentUrl: data.directDriveFileUrl || order.orderDocumentUrl,
          customerFolderUrl: data.customerFolderUrl || order.customerFolderUrl,
          directSheetViewUrl: data.directSheetViewUrl || order.directSheetViewUrl,
          orderDocumentName: data.fileName || order.orderDocumentName
        };

        if (onUpdateOrderDocument) {
          onUpdateOrderDocument(
            orderNum,
            data.directDriveFileUrl,
            data.fileName || order.orderDocumentName || `הזמנת_לקוח_${orderNum}.pdf`,
            data.directSheetViewUrl,
            order.orderFileBase64
          );
        }

        setViewerModalOrder(updatedOrder);
        setIsViewerModalOpen(true);
        showToast(`✓ נשלף בהצלחה קישור ישיר ל-Google Drive עבור ${order.customerName} (לקוח #${customerId})`, 'success');
      } else {
        setViewerModalOrder(order);
        setIsViewerModalOpen(true);
        showToast(`נפתחה תצוגת מסמך הזמנה ותיקיית Drive של ${order.customerName}`, 'info');
      }
    } catch (error) {
      console.error('Error querying Google Drive API:', error);
      setViewerModalOrder(order);
      setIsViewerModalOpen(true);
      showToast(`נפתחה תצוגת מסמך הזמנה ותיקיית הלקוח ב-Drive`, 'info');
    } finally {
      setLoadingDriveOrder(null);
    }
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
    return 0;
  };

  // Status mapping helper
  const getNormalizedStatusKey = (status: OrderStatus): 'Pending' | 'In Progress' | 'Delivered' => {
    if (status === 'Delivered' || status === 'סופק בהצלחה') return 'Delivered';
    if (status === 'In Progress' || status === 'בדרך לאתר' || status === 'הועמס במחסן') return 'In Progress';
    return 'Pending';
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    if (status === 'Delivered' || status === 'סופק בהצלחה') {
      return isLight 
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
        : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (status === 'In Progress' || status === 'בדרך לאתר') {
      return isLight 
        ? 'bg-amber-100 text-amber-900 border-amber-300' 
        : 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (status === 'הועמס במחסן') {
      return isLight 
        ? 'bg-sky-100 text-sky-900 border-sky-300' 
        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
    return isLight 
      ? 'bg-slate-100 text-slate-700 border-slate-300' 
      : 'bg-slate-800 text-slate-300 border-slate-700';
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
      color: isLight ? 'text-slate-900' : 'text-slate-100',
      bgColor: isLight ? 'bg-white' : 'bg-slate-900/80',
      borderColor: isLight ? 'border-slate-200' : 'border-slate-800',
      accentColor: 'bg-sky-500',
      count: pendingOrdersCount
    },
    {
      id: 'In Progress',
      title: 'בהעמסה / בדרך לאתר',
      description: 'משאיות פעילות בסבב אספקה וחלוקה',
      color: isLight ? 'text-amber-900' : 'text-amber-300',
      bgColor: isLight ? 'bg-amber-50/50' : 'bg-amber-950/20',
      borderColor: isLight ? 'border-amber-200' : 'border-amber-900/40',
      accentColor: 'bg-amber-500',
      count: inProgressOrdersCount
    },
    {
      id: 'Delivered',
      title: 'סופק בהצלחה ונחתם',
      description: 'נפרק באתר הלקוח ומאושר לתעודת משלוח',
      color: isLight ? 'text-emerald-900' : 'text-emerald-300',
      bgColor: isLight ? 'bg-emerald-50/50' : 'bg-emerald-950/20',
      borderColor: isLight ? 'border-emerald-200' : 'border-emerald-900/40',
      accentColor: 'bg-emerald-500',
      count: deliveredOrdersCount
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner: High-clarity White & Sky Blue / Deep Navy */}
      <div className={`relative overflow-hidden p-5 sm:p-6 rounded-3xl transition-all shadow-xl border ${
        isLight 
          ? 'bg-gradient-to-r from-white via-sky-50/60 to-blue-50/40 border-sky-200/90 shadow-sky-100/70' 
          : 'bg-gradient-to-r from-slate-900 via-slate-900/95 to-cyan-950/40 border-slate-800/90 shadow-2xl'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-sm border ${
                isLight 
                  ? 'bg-sky-100 text-sky-800 border-sky-300' 
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                <Activity className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'} animate-pulse`} />
                <span>דשבורד סידור עבודה חי</span>
              </span>
              <span className={`text-xs font-mono font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                isLight 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
              }`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Google Sheets Live: סידור_עבודה_יומי (טאב 2)</span>
              </span>
              <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2 font-hebrew-heavy ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>ריכוז הזמנות פעילות, שיבוץ נהגים ובקרת אספקות</span>
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed font-semibold ${
              isLight ? 'text-slate-600' : 'text-slate-300'
            }`}>
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
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-md border ${
                isLight
                  ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200 shadow-indigo-100'
                  : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border-purple-800/80 shadow-purple-950/30'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isInjecting ? 'animate-spin' : isLight ? 'text-indigo-600' : 'text-purple-400'}`} />
              <span>{isInjecting ? 'מזריק הזמנות...' : 'סנכרן מתיבת דוא"ל Comax'}</span>
            </button>

            {/* New Order Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              id="open-new-order-modal-btn"
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
                isLight
                  ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>הוסף הזמנה לסידור</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: High-Contrast White & Sky Blue / Dark Command Center */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Total Orders */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all group shadow-md ${
          isLight 
            ? 'bg-white hover:bg-sky-50/40 border-sky-200/80 shadow-sky-100/50' 
            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/40 shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>סה"כ הזמנות להיום</span>
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition ${
              isLight ? 'bg-sky-100 text-sky-600 border-sky-200' : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {totalOrdersCount}
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>הזמנות פעילות</span>
          </div>
          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
            isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800/80 text-slate-400'
          }`}>
            <span>משקל מצטבר:</span>
            <span className={`font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalWeightToday.toLocaleString()} ק"ג</span>
          </div>
        </div>

        {/* KPI 2: Active Trucks */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all group shadow-md ${
          isLight 
            ? 'bg-white hover:bg-sky-50/40 border-sky-200/80 shadow-sky-100/50' 
            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-blue-500/40 shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>משאיות פעילות בסבב</span>
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition ${
              isLight ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-blue-700' : 'text-cyan-300'}`}>
              2 / 2
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              100% זמינות צי
            </span>
          </div>
          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-semibold ${
            isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800/80 text-slate-400'
          }`}>
            <span>חכמת (מנוף 26ט)</span>
            <span className={isLight ? 'text-slate-800' : 'text-slate-300'}>עלי (15ט)</span>
          </div>
        </div>

        {/* KPI 3: In Progress & Pending */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all group shadow-md ${
          isLight 
            ? 'bg-white hover:bg-amber-50/40 border-amber-200/80 shadow-amber-100/50' 
            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-amber-500/40 shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>בתהליך חלוקה / ממתין</span>
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition ${
              isLight ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              {pendingOrdersCount + inProgressOrdersCount}
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
              ({inProgressOrdersCount} בדרך)
            </span>
          </div>
          <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-semibold ${
            isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800/80 text-slate-400'
          }`}>
            <span>ממתינות להעמסה:</span>
            <span className={`font-black ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>{pendingOrdersCount}</span>
          </div>
        </div>

        {/* KPI 4: Delivered with Live Progress Bar */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all group shadow-md ${
          isLight 
            ? 'bg-white hover:bg-emerald-50/40 border-emerald-200/80 shadow-emerald-100/50' 
            : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-emerald-500/40 shadow-xl'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>סופקו בהצלחה</span>
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center group-hover:scale-110 transition ${
              isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
              {deliveredOrdersCount}
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              {completionPercentage}% ביצוע
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className={`mt-3 pt-2.5 border-t ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-800'}`}>
              <div 
                className="bg-gradient-to-r from-emerald-500 to-sky-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className={`p-3 sm:p-4 rounded-3xl shadow-md border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
        isLight ? 'bg-white border-sky-100 shadow-sky-100/60' : 'bg-slate-900/90 border-slate-800 shadow-lg'
      }`}>
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`w-4 h-4 absolute right-3.5 top-3.5 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש לפי שם לקוח, מספר הזמנה, עיר, כתובת אתר..."
            className={`w-full pl-3 pr-10 py-2.5 rounded-2xl text-xs font-semibold focus:outline-none transition border ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white'
                : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-cyan-500'
            }`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className={`absolute left-3 top-2.5 text-xs font-bold ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              נקה
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Warehouse Filter */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setWarehouseFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                warehouseFilter === 'all'
                  ? isLight ? 'bg-sky-600 text-white shadow-sm' : 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              כל המחסנים
            </button>
            <button
              onClick={() => setWarehouseFilter('4_HARASH')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                warehouseFilter === '4_HARASH'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏭 4 החרש</span>
            </button>
            <button
              onClick={() => setWarehouseFilter('1_TALMID')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                warehouseFilter === '1_TALMID'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏟️ 1 התלמיד</span>
            </button>
          </div>

          {/* Driver Filter */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-2xl border text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={driverFilter}
              onChange={(e) => setDriverFilter(e.target.value)}
              className={`bg-transparent font-bold text-xs focus:outline-none cursor-pointer py-1.5 ${
                isLight ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>כל הנהגים</option>
              {SABAN_DRIVERS.map((driver) => (
                <option key={driver.id} value={driver.id} className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>
                  {driver.name} ({driver.truckPlate})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-2xl border text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`bg-transparent font-bold text-xs focus:outline-none cursor-pointer py-1.5 ${
                isLight ? 'text-slate-800' : 'text-slate-300'
              }`}
            >
              <option value="all" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>כל הסטטוסים</option>
              <option value="Pending" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>בסידור עבודה (Pending)</option>
              <option value="In Progress" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>בדרך לאתר (In Progress)</option>
              <option value="Delivered" className={isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'}>סופק בהצלחה (Delivered)</option>
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Kanban vs Grid */}
          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                viewMode === 'cards'
                  ? isLight ? 'bg-sky-600 text-white shadow-sm' : 'bg-cyan-500 text-slate-950 shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת כרטיסים חיים מפורטת"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>כרטיסים חיים</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                viewMode === 'kanban'
                  ? isLight ? 'bg-sky-600 text-white shadow-sm' : 'bg-cyan-500 text-slate-950 shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת לוח קנבן שלבים"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>לוח קנבן</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition ${
                viewMode === 'grid'
                  ? isLight ? 'bg-sky-600 text-white shadow-sm' : 'bg-cyan-500 text-slate-950 shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
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
            const isHikmat = (order.assignedDriver || order.driver || '').includes('חכמת');
            const driverPhone = isHikmat ? '0508861080' : '0527714490';

            return (
              <div
                key={orderIdStr}
                onClick={() => setSelectedOrder(order)}
                className={`group relative rounded-3xl p-5 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden border ${
                  isLight
                    ? 'bg-white hover:bg-sky-50/30 border-sky-100 hover:border-sky-300 shadow-sky-100/70'
                    : 'bg-slate-900/90 hover:bg-slate-900 border-slate-800 hover:border-cyan-500/50 shadow-slate-950/60'
                }`}
              >
                {/* Accent Top Border Glowing Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  order.status === 'Delivered' || order.status === 'סופק בהצלחה'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : order.status === 'In Progress' || order.status === 'בדרך לאתר'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                    : isLight 
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`} />

                <div className="space-y-4">
                  {/* Top Bar: Order ID, Copy, Warehouse, Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono text-sm font-black px-3 py-1 rounded-2xl border flex items-center gap-1 transition ${
                        isLight 
                          ? 'bg-sky-50 text-sky-900 border-sky-200 group-hover:bg-sky-100' 
                          : 'bg-slate-950 text-white border-slate-800 group-hover:text-cyan-300'
                      }`}>
                        <span>#{orderIdStr}</span>
                      </span>
                      <button
                        onClick={(e) => handleCopyId(orderIdStr, e)}
                        className={`p-1.5 rounded-xl border transition ${
                          isLight 
                            ? 'bg-slate-50 hover:bg-sky-100 text-slate-500 hover:text-sky-700 border-slate-200' 
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border-slate-800'
                        }`}
                        title="העתק מספר הזמנה"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* EYE BUTTON IN CARD TOP BAR - GOOGLE DRIVE API LOOKUP */}
                      <button
                        onClick={(e) => handleFetchDriveFile(order, e)}
                        disabled={loadingDriveOrder === orderIdStr}
                        id={`view-doc-top-${orderIdStr}`}
                        className={`p-1.5 rounded-xl border transition flex items-center gap-1 shadow-sm active:scale-95 ${
                          loadingDriveOrder === orderIdStr
                            ? 'bg-amber-500 text-white border-amber-600 animate-pulse cursor-wait'
                            : isLight 
                            ? 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-300 hover:border-sky-500' 
                            : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border-cyan-800 hover:border-cyan-500'
                        }`}
                        title="👁️ שליפת קישור ישיר לקובץ הזמנה מ-Google Drive לפי מזהה לקוח"
                      >
                        {loadingDriveOrder === orderIdStr ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {order.warehouse === '4_HARASH' ? (
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border ${
                          isLight
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-amber-950/40 text-amber-300 border-amber-800/40'
                        }`}>
                          🏭 4 החרש
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1 border ${
                          isLight
                            ? 'bg-blue-50 text-blue-900 border-blue-200'
                            : 'bg-blue-950/40 text-blue-300 border-blue-800/40'
                        }`}>
                          🏟️ 1 התלמיד
                        </span>
                      )}

                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Destination */}
                  <div>
                    <h3 className={`text-lg font-black transition leading-snug font-hebrew-heavy ${
                      isLight 
                        ? 'text-slate-950 group-hover:text-sky-700' 
                        : 'text-white group-hover:text-cyan-300'
                    }`}>
                      {order.customerName}
                    </h3>
                    <div className={`flex items-center justify-between text-xs mt-1.5 font-bold ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}>
                      <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                        <span className="truncate">{order.siteAddress || order.destination || order.city}</span>
                      </div>
                      <a
                        href={order.wazeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`px-3 py-1 rounded-xl border text-[11px] font-black flex items-center gap-1 transition shadow-sm ${
                          isLight
                            ? 'bg-sky-100 hover:bg-sky-200 text-sky-900 border-sky-300'
                            : 'bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border-cyan-800/60'
                        }`}
                        title="נווט עם Waze לאתר"
                      >
                        <Navigation className={`w-3.5 h-3.5 ${isLight ? 'text-sky-700' : 'text-cyan-400'}`} />
                        <span>Waze</span>
                      </a>
                    </div>
                  </div>

                  {/* Visual Step-by-Step Delivery Progress Bar */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 ${
                    isLight ? 'bg-sky-50/50 border-sky-100' : 'bg-slate-950/80 border-slate-800/80'
                  }`}>
                    <div className={`flex items-center justify-between text-[11px] font-black ${
                      isLight ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      <span className={step >= 0 ? isLight ? 'text-sky-700' : 'text-cyan-400' : ''}>1. נקלט</span>
                      <span className={step >= 1 ? isLight ? 'text-sky-700' : 'text-cyan-400' : ''}>2. הועמס</span>
                      <span className={step >= 2 ? isLight ? 'text-amber-700' : 'text-amber-400' : ''}>3. בדרך</span>
                      <span className={step >= 3 ? isLight ? 'text-emerald-700' : 'text-emerald-400' : ''}>4. סופק ✓</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 1, 2, 3].map((sIndex) => (
                        <div
                          key={sIndex}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            sIndex <= step
                              ? step === 3
                                ? 'bg-emerald-500'
                                : step === 2
                                ? 'bg-amber-500'
                                : isLight ? 'bg-sky-500' : 'bg-cyan-400'
                              : isLight ? 'bg-slate-200' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Driver & Schedule Row */}
                  <div className={`flex items-center justify-between p-3 rounded-2xl border text-xs ${
                    isLight 
                      ? 'bg-white border-slate-200 shadow-sm' 
                      : 'bg-slate-950/50 border-slate-800/50'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                        isLight ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}>
                        <Truck className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                      </div>
                      <div>
                        <span className={`font-black block leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {order.assignedDriver || order.driver}
                        </span>
                        <span className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {order.isCraneRequired ? 'משאית מנוף 🏗️' : 'משאית חלוקה 🚚'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a 
                        href={`tel:${driverPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`p-1.5 rounded-xl border transition ${
                          isLight 
                            ? 'bg-slate-100 hover:bg-sky-100 text-slate-700 border-slate-200' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title={`התקשר לנהג: ${driverPhone}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <div className={`flex items-center gap-1.5 font-mono text-xs font-bold ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}>
                        <Clock className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                        <span>{order.scheduledTime || '08:30'}</span>
                      </div>
                    </div>
                  </div>

                  {/* PRODUCTS TEXT BOX WITH DEDICATED STYLED BACKGROUND (הצג טקסט מוצרים עם רקע) */}
                  <div className={`p-3.5 rounded-2xl border space-y-2 transition-all ${
                    isLight 
                      ? 'bg-sky-50/90 border-sky-200/90 shadow-inner' 
                      : 'bg-slate-950 p-3 rounded-2xl border border-slate-800/90'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-black flex items-center gap-1.5 ${
                        isLight ? 'text-sky-950' : 'text-cyan-300'
                      }`}>
                        <Package className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                        <span>פירוט מוצרים ומק"טים (קומקס):</span>
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border font-bold ${
                        isLight ? 'bg-white text-sky-800 border-sky-200' : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}>
                        מנורמל AI
                      </span>
                    </div>

                    <div className={`p-2.5 rounded-xl border font-mono text-xs font-bold leading-relaxed whitespace-pre-line line-clamp-3 ${
                      isLight 
                        ? 'bg-white text-slate-900 border-sky-100 shadow-sm' 
                        : 'bg-slate-900/90 text-cyan-200 border-slate-800'
                    }`}>
                      {order.itemsDetails || order.itemsFormatted}
                    </div>

                    {/* Deposit & Weights Summary row inside the products box */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      {order.bigBagsDeposit > 0 && (
                        <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1 shadow-sm ${
                          isLight 
                            ? 'bg-purple-100 text-purple-900 border-purple-300' 
                            : 'bg-purple-950/60 text-purple-300 border-purple-800/40'
                        }`}>
                          <Boxes className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>בלות: {order.bigBagsDeposit}</span>
                        </span>
                      )}
                      {order.palletsDeposit > 0 && (
                        <span className={`px-2.5 py-1 rounded-xl font-bold border flex items-center gap-1 shadow-sm ${
                          isLight 
                            ? 'bg-indigo-100 text-indigo-900 border-indigo-300' 
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/40'
                        }`}>
                          <PackageCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>משטחי סבן: {order.palletsDeposit}</span>
                        </span>
                      )}
                      {order.totalWeightKg > 0 && (
                        <span className={`px-2.5 py-1 rounded-xl font-mono font-bold border flex items-center gap-1 shadow-sm ${
                          isLight 
                            ? 'bg-slate-100 text-slate-800 border-slate-300' 
                            : 'bg-slate-800 text-slate-200 border-slate-700'
                        }`}>
                          <Scale className="w-3.5 h-3.5 text-slate-500" />
                          <span>{order.totalWeightKg.toLocaleString()} ק"ג</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTTOM DESIGNED ACTION BUTTONS ON ORDER CARD (כפתורי פעולה מעוצבים לכל כרטיס) */}
                <div 
                  className={`mt-4 pt-3.5 border-t flex items-center justify-between gap-2 ${
                    isLight ? 'border-slate-100' : 'border-slate-800'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Action 1: Eye - Google Drive API direct link lookup & viewer */}
                    <button
                      onClick={(e) => handleFetchDriveFile(order, e)}
                      disabled={loadingDriveOrder === orderIdStr}
                      id={`view-doc-btn-${orderIdStr}`}
                      className={`px-3 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all border shadow-sm active:scale-95 ${
                        loadingDriveOrder === orderIdStr
                          ? 'bg-amber-500 text-white border-amber-600 animate-pulse cursor-wait'
                          : isLight
                          ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-700 shadow-sky-600/20'
                          : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-700 shadow-cyan-600/20'
                      }`}
                      title="👁️ שליפת קישור ישיר לקובץ הזמנה מ-Google Drive לפי מזהה לקוח"
                    >
                      {loadingDriveOrder === orderIdStr ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      <span>{loadingDriveOrder === orderIdStr ? 'שולף מ-Drive...' : 'קובץ Drive 👁️'}</span>
                    </button>

                    {/* Action 2: Send WhatsApp to Driver */}
                    <button
                      onClick={() => onSendWhatsApp(order)}
                      id={`whatsapp-order-${orderIdStr}`}
                      className="px-3 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                      title="שגר תדריך וואטסאפ לנהג"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>וואטסאפ</span>
                    </button>

                    {/* Action 3: Quick Status Advance Button */}
                    <button
                      onClick={() => onUpdateStatus(order.orderNumber, getNextStatus(order.status))}
                      id={`advance-status-${orderIdStr}`}
                      className={`px-3 py-2 rounded-2xl text-xs font-black transition-all border shadow-sm flex items-center gap-1.5 active:scale-95 ${
                        order.status === 'Pending' || order.status === 'בסידור עבודה'
                          ? isLight
                            ? 'bg-sky-50 hover:bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-sky-950/80 hover:bg-sky-900 text-sky-200 border-sky-700'
                          : order.status === 'In Progress' || order.status === 'בדרך לאתר'
                          ? isLight
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-700'
                          : isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                      title="קדם שלב בסידור אספקה"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isLight ? 'text-sky-700' : 'text-cyan-400'}`} />
                      <span>
                        {order.status === 'Pending' || order.status === 'בסידור עבודה'
                          ? 'העבר להעמסה'
                          : order.status === 'In Progress' || order.status === 'בדרך לאתר'
                          ? 'סמן כסופק ✓'
                          : 'אפס סטטוס'}
                      </span>
                    </button>
                  </div>

                  {/* Action 4: Open Details Modal */}
                  <button
                    onClick={() => setSelectedOrder(order)}
                    id={`details-order-${orderIdStr}`}
                    className={`px-3 py-2 rounded-2xl text-xs font-black transition-all border shadow-sm flex items-center gap-1 active:scale-95 ${
                      isLight
                        ? 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'
                        : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30'
                    }`}
                  >
                    <span>כרטיס</span>
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
                className={`rounded-3xl border ${col.borderColor} ${col.bgColor} p-4 flex flex-col min-h-[520px] shadow-lg transition-all`}
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${col.accentColor}`} />
                    <div>
                      <h3 className={`text-sm font-black ${col.color} font-hebrew-heavy`}>{col.title}</h3>
                      <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{col.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-mono font-black text-xs border shadow-inner ${
                    isLight ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-slate-950 text-white border-slate-800'
                  }`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                  {colOrders.map((order) => (
                    <div
                      key={order.orderNumber || order.orderId}
                      onClick={() => setSelectedOrder(order)}
                      className={`border rounded-2xl p-4 space-y-3 cursor-pointer transition-all shadow-md group ${
                        isLight
                          ? 'bg-white hover:bg-sky-50/50 border-slate-200 hover:border-sky-300'
                          : 'bg-slate-950/90 border-slate-800 hover:border-cyan-500/60'
                      }`}
                    >
                      {/* Top Row: Order ID, Eye Document Button, Warehouse */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs font-black ${
                            isLight ? 'text-sky-700 group-hover:text-sky-900' : 'text-cyan-400 group-hover:text-cyan-300'
                          }`}>
                            #{order.orderId || order.orderNumber}
                          </span>
                          <button
                            onClick={(e) => handleFetchDriveFile(order, e)}
                            disabled={loadingDriveOrder === (order.orderNumber || order.orderId)}
                            className={`p-1 rounded-lg border transition ${
                              loadingDriveOrder === (order.orderNumber || order.orderId)
                                ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                                : isLight ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' : 'bg-slate-900 text-cyan-300 border-slate-700 hover:bg-slate-800'
                            }`}
                            title="👁️ שליפת קישור ישיר לקובץ הזמנה מ-Google Drive לפי מזהה לקוח"
                          >
                            {loadingDriveOrder === (order.orderNumber || order.orderId) ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-800 text-slate-300'
                        }`}>
                          {order.warehouse === '4_HARASH' ? '🏭 4 החרש' : '🏟️ 1 התלמיד'}
                        </span>
                      </div>

                      {/* Customer Name */}
                      <h4 className={`text-sm font-black leading-tight font-hebrew-heavy ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        {order.customerName}
                      </h4>

                      {/* Destination & Waze */}
                      <div className={`flex items-center justify-between text-xs font-semibold ${
                        isLight ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                          <span className="truncate">{order.siteAddress || order.destination}</span>
                        </div>
                        <a
                          href={order.wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={`shrink-0 p-1 font-bold ${
                            isLight ? 'text-sky-600 hover:text-sky-800' : 'text-cyan-400 hover:text-cyan-300'
                          }`}
                          title="פתח Waze"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Driver & Time */}
                      <div className={`flex items-center justify-between pt-1 border-t text-xs ${
                        isLight ? 'border-slate-100 text-slate-700' : 'border-slate-900 text-slate-300'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.assignedDriver || order.driver}</span>
                        </div>
                        <div className={`flex items-center gap-1 font-mono text-xs font-bold ${
                          isLight ? 'text-slate-600' : 'text-slate-400'
                        }`}>
                          <Clock className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                          <span>{order.scheduledTime}</span>
                        </div>
                      </div>

                      {/* Normalized Items Preview with Background */}
                      <div className={`p-2.5 rounded-xl text-xs font-mono font-bold line-clamp-2 border ${
                        isLight ? 'bg-sky-50 text-slate-800 border-sky-100' : 'bg-slate-900/80 text-cyan-300 border-slate-800/60'
                      }`}>
                        {order.itemsDetails || order.itemsFormatted}
                      </div>

                      {/* Action buttons on kanban card */}
                      <div className="flex items-center justify-between pt-1 text-[11px]" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-500 font-mono text-[10px] font-bold">
                          {order.bigBagsDeposit > 0 ? `בלות: ${order.bigBagsDeposit}` : ''} {order.palletsDeposit > 0 ? `| משטחים: ${order.palletsDeposit}` : ''}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {col.id === 'Pending' && (
                            <button
                              onClick={() => onUpdateStatus(order.orderNumber, 'In Progress')}
                              className="px-3 py-1 rounded-xl bg-amber-500 text-white font-black hover:bg-amber-400 text-xs transition shadow-sm flex items-center gap-1"
                            >
                              <span>העבר להעמסה ➜</span>
                            </button>
                          )}
                          {col.id === 'In Progress' && (
                            <button
                              onClick={() => onUpdateStatus(order.orderNumber, 'Delivered')}
                              className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 text-xs transition shadow-sm flex items-center gap-1"
                            >
                              <span>סמן כסופק ✓</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className={`h-40 flex items-center justify-center text-xs font-bold border border-dashed rounded-2xl ${
                      isLight ? 'text-slate-400 border-slate-300' : 'text-slate-500 border-slate-800'
                    }`}>
                      אין הזמנות בסטטוס זה
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 3: DATA GRID TABLE */}
      {viewMode === 'grid' && (
        <div className={`border rounded-3xl shadow-xl overflow-hidden ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className={`border-b font-mono text-[11px] font-bold ${
                  isLight ? 'bg-slate-100/90 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
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
              <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.orderNumber || order.orderId}
                    onClick={() => setSelectedOrder(order)}
                    className={`cursor-pointer transition ${
                      isLight ? 'hover:bg-sky-50/50' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className={`p-4 font-mono font-black ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>
                      #{order.orderId || order.orderNumber}
                    </td>
                    <td className={`p-4 font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {order.customerName}
                    </td>
                    <td className={`p-4 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <div className="flex items-center gap-1.5">
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                        <span>{order.siteAddress || order.destination}</span>
                      </div>
                    </td>
                    <td className={`p-4 font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.assignedDriver || order.driver}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <div className={`p-1.5 rounded-lg border font-mono text-xs font-bold truncate ${
                        isLight ? 'bg-sky-50 text-slate-900 border-sky-100' : 'bg-slate-950 text-cyan-300 border-slate-800'
                      }`}>
                        {order.itemsDetails || order.itemsFormatted}
                      </div>
                    </td>
                    <td className="p-4 font-bold">
                      {order.warehouse === '4_HARASH' ? (
                        <span className="text-amber-600 font-black">🏭 4 החרש</span>
                      ) : (
                        <span className="text-blue-600 font-black">🏟️ 1 התלמיד</span>
                      )}
                    </td>
                    <td className={`p-4 font-mono text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {order.totalWeightKg} ק"ג
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${getStatusBadgeStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Eye Document Button with Google Drive API lookup */}
                        <button
                          onClick={(e) => handleFetchDriveFile(order, e)}
                          disabled={loadingDriveOrder === (order.orderNumber || order.orderId)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
                            loadingDriveOrder === (order.orderNumber || order.orderId)
                              ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                              : isLight
                              ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300'
                              : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border-cyan-800'
                          }`}
                          title="👁️ שליפת קישור ישיר לקובץ הזמנה מ-Google Drive לפי מזהה לקוח"
                        >
                          {loadingDriveOrder === (order.orderNumber || order.orderId) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <Eye className={`w-3.5 h-3.5 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                          )}
                          <span>{loadingDriveOrder === (order.orderNumber || order.orderId) ? 'שולף...' : 'Drive 👁️'}</span>
                        </button>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                        >
                          <span>כרטיס</span>
                        </button>
                        <button
                          onClick={() => onSendWhatsApp(order)}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
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

      {/* View E: Order Document Viewer & Customer Folder Modal (Eye Button) */}
      <OrderDocumentViewerModal
        order={viewerModalOrder}
        isOpen={isViewerModalOpen}
        onClose={() => {
          setIsViewerModalOpen(false);
          setViewerModalOrder(null);
        }}
        onUpdateOrderDocument={onUpdateOrderDocument}
        showToast={showToast}
      />
    </div>
  );
};

