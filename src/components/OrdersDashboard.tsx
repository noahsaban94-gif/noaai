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
  Calendar
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
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
  const activeTrucksCount = 2; // Saban Fleet: Hikmat & Ali

  // Status mapping helper
  const getNormalizedStatusKey = (status: OrderStatus): 'Pending' | 'In Progress' | 'Delivered' => {
    if (status === 'Delivered' || status === 'סופק בהצלחה') return 'Delivered';
    if (status === 'In Progress' || status === 'בדרך לאתר' || status === 'הועמס במחסן') return 'In Progress';
    return 'Pending';
  };

  const kanbanColumns: Array<{
    id: 'Pending' | 'In Progress' | 'Delivered';
    title: string;
    description: string;
    color: string;
    bgColor: string;
    borderColor: string;
    count: number;
  }> = [
    {
      id: 'Pending',
      title: 'ממתין בסידור עבודה (Pending)',
      description: 'הזמנות שנקלטו וממתינות להעמסה במחסן',
      color: 'text-slate-200',
      bgColor: 'bg-slate-900/60',
      borderColor: 'border-slate-800',
      count: pendingOrdersCount
    },
    {
      id: 'In Progress',
      title: 'בהעמסה / בדרך לאתר (In Progress)',
      description: 'משאיות פעילות בסבבי חלוקה ופריקה',
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-900/40',
      count: inProgressOrdersCount
    },
    {
      id: 'Delivered',
      title: 'סופק בהצלחה (Delivered)',
      description: 'נפרק באתר וחתום ע"י מנהל עבודה',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-900/40',
      count: deliveredOrdersCount
    }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              דשבורד וסידור עבודה יומי
            </span>
            <span className="text-xs text-slate-400 font-mono">
              טאב: 'סידור_עבודה_יומי' (Google Sheets Tab 2)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            ריכוז הזמנות פעילות, שיוך נהגים ומעקב סטטוסים
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            תצוגת לוח קנבן וטבלת הזמנות מסונכרנת מול מילון לוגיסטי ותעודות משלוח.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Inject Core Orders */}
          <button
            onClick={onInjectEmailOrders}
            disabled={isInjecting}
            id="inject-core-orders-btn"
            title="סנכרן הזמנות מתיבת דואל לגיליון"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-800 text-xs font-semibold transition"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isInjecting ? 'animate-spin' : 'text-purple-400'}`} />
            <span>{isInjecting ? 'מזריק...' : 'סנכרן מתיבת דואל'}</span>
          </button>

          {/* New Order Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            id="open-new-order-modal-btn"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-md shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>הוסף הזמנה ידנית</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Requested View B) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Total Orders */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">סה"כ הזמנות היום</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-white mt-1 block">
              {totalOrdersCount}
            </span>
            <span className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1">
              <Sparkles className="w-3 h-3" />
              <span>טבלה 2 בגיליון</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Active Trucks */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">משאיות פעילות בסבב</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-1 block">
              {activeTrucksCount} / 2
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>חכמת (מנוף) + עלי</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Pending Deliveries */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">ממתינות לאספקה</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1 block">
              {pendingOrdersCount}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              דורש שיבוץ מחסן/נהג
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Delivered */}
        <div 
          className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg flex items-center justify-between"
          style={{
            fontWeight: 'bold',
            textAlign: 'center',
            fontFamily: 'Times New Roman, serif',
            fontSize: '11px'
          }}
        >
          <div>
            <span className="text-xs text-slate-400 block">סופקו בהצלחה</span>
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1 block">
              {deliveredOrdersCount}
            </span>
            <span className="text-[11px] text-emerald-400 mt-1 block">
              {Math.round((deliveredOrdersCount / (totalOrdersCount || 1)) * 100)}% ביצוע
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and View Toggle Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש מהיר לפי לקוח, מספר הזמנה, עיר, כתובת..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Warehouse Filter */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setWarehouseFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              warehouseFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            כל המחסנים
          </button>
          <button
            onClick={() => setWarehouseFilter('4_HARASH')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              warehouseFilter === '4_HARASH' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-400'
            }`}
          >
            🏭 4️⃣ החרש
          </button>
          <button
            onClick={() => setWarehouseFilter('1_TALMID')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              warehouseFilter === '1_TALMID' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'text-slate-400'
            }`}
          >
            🏟️ 1️⃣ התלמיד
          </button>
        </div>

        {/* Driver Filter */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-xl border border-slate-800 text-xs">
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

        {/* View Mode Toggle: Kanban vs Grid */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'kanban' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>לוח קנבן</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'grid' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>טבלת נתונים</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {kanbanColumns.map((col) => {
            const colOrders = filteredOrders.filter(
              (o) => getNormalizedStatusKey(o.status) === col.id
            );

            return (
              <div
                key={col.id}
                className={`rounded-2xl border ${col.borderColor} ${col.bgColor} p-4 flex flex-col min-h-[500px] shadow-lg`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div>
                    <h3 className={`text-sm font-bold ${col.color}`}>{col.title}</h3>
                    <p className="text-[10px] text-slate-400">{col.description}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-950 text-white font-mono font-bold text-xs border border-slate-800">
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                  {colOrders.map((order) => (
                    <div
                      key={order.orderNumber || order.orderId}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-slate-950/90 border border-slate-800 hover:border-cyan-500/60 rounded-xl p-3.5 space-y-2.5 cursor-pointer transition shadow hover:shadow-cyan-500/10 group"
                    >
                      {/* Top Row: Order ID & Warehouse */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                          #{order.orderId || order.orderNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                          {order.warehouse === '4_HARASH' ? '🏭 4️⃣ החרש' : '🏟️ 1️⃣ התלמיד'}
                        </span>
                      </div>

                      {/* Customer Name */}
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {order.customerName}
                      </h4>

                      {/* Destination & Waze */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{order.siteAddress || order.destination}</span>
                        </div>
                        <a
                          href={order.wazeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-cyan-400 hover:text-cyan-300 shrink-0"
                          title="פתח Waze"
                        >
                          <Navigation className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Driver & Time */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[11px]">
                        <div className="flex items-center gap-1 text-slate-300 font-medium">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>{order.assignedDriver || order.driver}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 font-mono text-[10px]">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span>{order.scheduledTime}</span>
                        </div>
                      </div>

                      {/* Normalized Items Preview */}
                      <div className="bg-slate-900/80 p-2 rounded text-[10px] font-mono text-cyan-300 line-clamp-2 border border-slate-800/60">
                        {order.itemsDetails || order.itemsFormatted}
                      </div>

                      {/* Quick Status advance inside card */}
                      <div className="flex items-center justify-between pt-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
                        <span className="text-slate-500">
                          {order.bigBagsDeposit > 0 ? `בלות: ${order.bigBagsDeposit}` : ''} {order.palletsDeposit > 0 ? `| משטחים: ${order.palletsDeposit}` : ''}
                        </span>

                        <div className="flex items-center gap-1">
                          {col.id === 'Pending' && (
                            <button
                              onClick={() => onUpdateStatus(order.orderNumber, 'In Progress')}
                              className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900 transition"
                            >
                              העבר לביצוע ➜
                            </button>
                          )}
                          {col.id === 'In Progress' && (
                            <button
                              onClick={() => onUpdateStatus(order.orderNumber, 'Delivered')}
                              className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition"
                            >
                              סמן כסופק ✓
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {colOrders.length === 0 && (
                    <div className="h-40 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      אין הזמנות בסטטוס זה
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: DATA GRID TABLE (Google Sheets Table 2 Representation) */}
      {viewMode === 'grid' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-3.5">מספר הזמנה (Order_ID)</th>
                  <th className="p-3.5">שם לקוח (Customer_Name)</th>
                  <th className="p-3.5">יעד פריקה (Destination)</th>
                  <th className="p-3.5">נהג משויך (Driver)</th>
                  <th className="p-3.5">פירוט פריטים מנורמל (Items_Details)</th>
                  <th className="p-3.5">מחסן יוצא</th>
                  <th className="p-3.5">סטטוס (Status)</th>
                  <th className="p-3.5">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.orderNumber || order.orderId}
                    onClick={() => setSelectedOrder(order)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="p-3.5 font-mono font-bold text-cyan-400">
                      #{order.orderId || order.orderNumber}
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      {order.customerName}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{order.siteAddress || order.destination}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{order.assignedDriver || order.driver}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-cyan-300 max-w-xs">
                      <p className="truncate">{order.itemsDetails || order.itemsFormatted}</p>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {order.warehouse === '4_HARASH' ? '🏭 4️⃣ החרש' : '🏟️ 1️⃣ התלמיד'}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        order.status === 'Delivered' || order.status === 'סופק בהצלחה'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : order.status === 'In Progress' || order.status === 'בדרך לאתר' || order.status === 'הועמס במחסן'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>צפה בכרטיס</span>
                        </button>
                        <button
                          onClick={() => onSendWhatsApp(order)}
                          className="p-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 transition"
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
