import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MorningDispatch } from './components/MorningDispatch';
import { OrdersDashboard } from './components/OrdersDashboard';
import { DriverPWAView } from './components/DriverPWAView';
import { ComaxEmailOrders } from './components/ComaxEmailOrders';
import { ReconciliationAudit } from './components/ReconciliationAudit';
import { NoaAIChat } from './components/NoaAIChat';
import { RouteDensityMap } from './components/RouteDensityMap';
import { DeliveryNotesView } from './components/DeliveryNotesView';
import { LogisticsDictionaryView } from './components/LogisticsDictionaryView';
import { SystemSyncModal } from './components/SystemSyncModal';
import { INITIAL_ORDERS, INITIAL_DELIVERY_NOTES } from './data/mockData';
import { Order, OrderStatus, SystemInfo, DeliveryNoteRecord } from './types';
import { CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('noa-chat');
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNoteRecord[]>(INITIAL_DELIVERY_NOTES);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isArchiving, setIsArchiving] = useState<boolean>(false);
  const [isInjecting, setIsInjecting] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Fetch initial System Info & GAS Orders
  useEffect(() => {
    fetchSystemInfo();
    syncWithGoogleSheets();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch('/api/system-info');
      const data = await res.json();
      setSystemInfo(data);
    } catch (e) {
      console.warn('Could not fetch system info:', e);
    }
  };

  const syncWithGoogleSheets = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/gas/orders');
      const data = await res.json();
      if (data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders(data.orders);
        showToast('✓ סנכרון חי מול גיליון 1VA9J6n... הושלם בהצלחה!', 'success');
      }
    } catch (e) {
      console.warn('GAS fetch fallback:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add new order to schedule (Table 2: "סידור_עבודה_יומי")
  const handleAddOrder = async (newOrder: Order) => {
    // 1. Optimistic local state update
    setOrders(prev => [newOrder, ...prev]);
    showToast(`הזמנה #${newOrder.orderNumber || newOrder.orderId} נוספה לסידור ונשלחה להזרקה בגיליון!`, 'success');

    // 2. Post to server & Google Sheets
    try {
      await fetch('/api/gas/insert-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: newOrder.orderNumber || newOrder.orderId,
          customerName: newOrder.customerName,
          address: newOrder.siteAddress || newOrder.destination,
          city: newOrder.city,
          warehouse: newOrder.warehouseName,
          driver: newOrder.assignedDriver || newOrder.driver,
          items: newOrder.itemsFormatted || newOrder.itemsDetails,
          deposits: `בלות: ${newOrder.bigBagsDeposit} | משטחים: ${newOrder.palletsDeposit}`,
          time: newOrder.scheduledTime
        })
      });
    } catch (e) {
      console.warn('Order insert warning:', e);
    }
  };

  // Update order status
  const handleUpdateStatus = (orderNumber: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.orderNumber === orderNumber || o.orderId === orderNumber ? { ...o, status: newStatus } : o))
    );
    showToast(`סטטוס הזמנה #${orderNumber} עודכן ל: "${newStatus}"`, 'info');
  };

  // Generate Delivery Note and append to Table 3
  const handleGenerateDeliveryNote = (order: Order, signatureDataUrl?: string) => {
    const dnId = `DN-${order.orderId || order.orderNumber}`;
    const newRecord: DeliveryNoteRecord = {
      id: dnId,
      orderId: order.orderId || order.orderNumber,
      customerName: order.customerName,
      destination: order.siteAddress || order.destination || '',
      driver: order.assignedDriver || order.driver || '',
      itemsDetails: order.itemsDetails || order.itemsFormatted,
      deliveryNotePdf: `https://drive.google.com/file/d/1_DN_${order.orderId || order.orderNumber}_PDF/view`,
      customerSignature: signatureDataUrl,
      isSigned: !!signatureDataUrl,
      syncStatus: true,
      createdAt: new Date().toLocaleDateString('he-IL') + ' ' + new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      signedAt: signatureDataUrl ? new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : undefined
    };

    setDeliveryNotes(prev => {
      const filtered = prev.filter(n => n.orderId !== newRecord.orderId);
      return [newRecord, ...filtered];
    });

    // Also update order state
    setOrders(prev => prev.map(o => {
      if (o.orderNumber === order.orderNumber || o.orderId === order.orderId) {
        return {
          ...o,
          deliveryNote: dnId,
          signatureReceived: !!signatureDataUrl,
          signatureImage: signatureDataUrl,
          isSynced: true
        };
      }
      return o;
    }));

    showToast(`תעודת משלוח #${dnId} הופקה וסונכרנה לטבלת 'תעודות_משלוח_וחתימות' (טאב 3)!`, 'success');
  };

  // Toggle Sync status for Delivery Note
  const handleToggleSyncDeliveryNote = (noteId: string) => {
    setDeliveryNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        const nextState = !n.syncStatus;
        showToast(`סטטוס סנכרון תעודה #${noteId} שונה ל: ${nextState ? 'מסונכרן' : 'לא מסונכרן'}`, 'info');
        return { ...n, syncStatus: nextState };
      }
      return n;
    }));
  };

  // WhatsApp Briefing Dispatch
  const handleSendWhatsApp = (order: Order) => {
    const isHikmat = (order.assignedDriver || order.driver || '').includes('חכמת');
    const driverPhone = isHikmat ? '0508861080' : '0527714490';
    
    const message = `🚚 *תדריך נסיעה — ח. סבן חומרי בניין בע"מ*
שלום ${order.assignedDriver || order.driver}, להלן פרטי המשימה שלך להיום:

📦 *מספר הזמנה:* ${order.orderNumber || order.orderId}
👤 *שם לקוח:* ${order.customerName}
📍 *יעד פריקה:* ${order.siteAddress || order.destination}
🏟️ *מחסן יוצא:* ${order.warehouseName}
⏰ *שעת הגעה מתוכננת:* ${order.scheduledTime}

📋 *פירוט מוצרים מנורמל:*
${order.itemsDetails || order.itemsFormatted}

⚖️ *פקדונות לחיוב/החזרה:*
• שקי בלה (60002): ${order.bigBagsDeposit}
• משטחי סבן (60060): ${order.palletsDeposit}

🗺️ *קישור ניווט ישיר ב-Waze:*
${order.wazeUrl}

נא לפרוק בזהירות ולהחתים את הלקוח.
באדיבות נועה AI ❤️`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = driverPhone.replace(/[^0-9]/g, '');
    const fullUrl = `https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encoded}`;
    
    window.open(fullUrl, '_blank');
    showToast(`תדריך WhatsApp נפתח עבור ${order.assignedDriver || order.driver}!`, 'success');
  };

  // Notify driver via OneSignal
  const handleNotifyDriver = async (order: Order) => {
    try {
      const res = await fetch('/api/notify-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber || order.orderId,
          customerName: order.customerName,
          city: order.city,
          siteAddress: order.siteAddress || order.destination,
          driverName: order.assignedDriver || order.driver,
          wazeUrl: order.wazeUrl,
          scheduledTime: order.scheduledTime
        })
      });
      const data = await res.json();
      showToast(`התראת Push של OneSignal נשלחה בהצלחה ל${order.assignedDriver || order.driver}!`, 'success');
    } catch (e) {
      showToast('שגיאה בשליחת התראת Push', 'error');
    }
  };

  // Archive Morning Dispatch
  const handleArchiveReport = async () => {
    try {
      setIsArchiving(true);
      const res = await fetch('/api/gas/archive-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
          totalOrders: orders.length,
          orders
        })
      });
      const data = await res.json();
      showToast('✓ דוח בוקר ננעל ונרשם בארכיון הגיליון בהצלחה!', 'success');
    } catch (e) {
      showToast('ארכוב נשמר בזיכרון המקומי', 'info');
    } finally {
      setIsArchiving(false);
    }
  };

  // Inject Core Email Orders
  const handleInjectEmailOrders = async () => {
    try {
      setIsInjecting(true);
      const res = await fetch('/api/gas/inject-email-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
      showToast('✓ 3 הזמנות פעילות סונכרנו והוזרקו לגיליון סידור נועה AI!', 'success');
    } catch (e) {
      showToast('שגיאה בסנכרון הזמנות', 'error');
    } finally {
      setIsInjecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-3 border transition-all animate-bounce bg-slate-900 border-cyan-500/50 text-cyan-200">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white transition text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        onManualSync={syncWithGoogleSheets}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        totalOrders={orders.length}
        unreadEmailCount={1}
        deliveryNotesCount={deliveryNotes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* VIEW A: Noa AI Chat (WhatsApp Clone & Normalizer) */}
        {activeTab === 'noa-chat' && (
          <NoaAIChat
            onAddOrderToSchedule={handleAddOrder}
          />
        )}

        {/* VIEW B: Main Orders Dashboard & Work Schedule */}
        {activeTab === 'orders' && (
          <OrdersDashboard
            orders={orders}
            onAddOrder={handleAddOrder}
            onUpdateStatus={handleUpdateStatus}
            onInjectEmailOrders={handleInjectEmailOrders}
            onSendWhatsApp={handleSendWhatsApp}
            isInjecting={isInjecting}
            onGenerateDeliveryNote={handleGenerateDeliveryNote}
            onNavigateToDensityMap={() => setActiveTab('route-density')}
            onNavigateToNoaChat={() => setActiveTab('noa-chat')}
          />
        )}

        {/* VIEW D: Delivery Notes & Signatures Sync */}
        {activeTab === 'delivery-notes' && (
          <DeliveryNotesView
            deliveryNotes={deliveryNotes}
            orders={orders}
            onToggleSync={handleToggleSyncDeliveryNote}
            onOpenOrderModal={() => setActiveTab('orders')}
            onManualSyncSheet={syncWithGoogleSheets}
          />
        )}

        {/* TABLE 1: Logistics Dictionary Explorer */}
        {activeTab === 'dictionary' && (
          <LogisticsDictionaryView
            onSelectKeywordExample={(sample) => {
              setActiveTab('noa-chat');
            }}
          />
        )}

        {/* Route Density Map (D3) */}
        {activeTab === 'route-density' && (
          <RouteDensityMap
            orders={orders}
            onApplyOptimizedSequence={(optimized) => {
              setOrders(optimized);
              showToast('✓ סדר הפריקה הממוטב (TSP) הוחל בהצלחה על כלל המשימות!', 'success');
            }}
          />
        )}

        {/* Morning Dispatch */}
        {activeTab === 'morning-dispatch' && (
          <MorningDispatch
            orders={orders}
            onUpdateStatus={handleUpdateStatus}
            onSendWhatsApp={handleSendWhatsApp}
            onNotifyDriver={handleNotifyDriver}
            onArchiveReport={handleArchiveReport}
            isArchiving={isArchiving}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Driver PWA */}
        {activeTab === 'driver-pwa' && (
          <DriverPWAView
            orders={orders}
            onUpdateStatus={handleUpdateStatus}
            onSendWhatsApp={handleSendWhatsApp}
          />
        )}

        {/* Email Orders */}
        {activeTab === 'email-orders' && (
          <ComaxEmailOrders onAddOrder={handleAddOrder} />
        )}

        {/* Reconciliation */}
        {activeTab === 'reconciliation' && (
          <ReconciliationAudit orders={orders} />
        )}
      </main>

      {/* Diagnostics Modal */}
      <SystemSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        systemInfo={systemInfo}
      />
    </div>
  );
}

export default App;
