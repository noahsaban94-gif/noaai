import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle, 
  Clock, 
  Package, 
  AlertTriangle, 
  Bell, 
  FileText, 
  ExternalLink,
  ShieldAlert,
  Layers,
  Sparkles,
  Map as MapIcon,
  ListFilter,
  Camera,
  PenTool
} from 'lucide-react';
import { SABAN_DRIVERS } from '../data/mockData';
import { Order } from '../types';
import { LeafletRouteMap } from './LeafletRouteMap';

interface DriverPWAViewProps {
  orders: Order[];
  onUpdateStatus: (orderNumber: string, status: Order['status']) => void;
  onSendWhatsApp: (order: Order) => void;
  onOpenScanner?: (order: Order) => void;
}

export const DriverPWAView: React.FC<DriverPWAViewProps> = ({
  orders,
  onUpdateStatus,
  onSendWhatsApp,
  onOpenScanner
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string>('hikmat');
  const [driverViewMode, setDriverViewMode] = useState<'cards' | 'map' | 'split'>('cards');
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isSendingPush, setIsSendingPush] = useState<boolean>(false);
  const [activeSignOrder, setActiveSignOrder] = useState<string | null>(null);

  const currentDriver = SABAN_DRIVERS.find(d => d.id === selectedDriverId) || SABAN_DRIVERS[0];

  const driverOrders = orders.filter(o => 
    selectedDriverId === 'hikmat' ? o.assignedDriver.includes('חכמת') : o.assignedDriver.includes('עלי')
  );

  // Trigger real OneSignal Web Push to driver
  const handleTriggerDriverPush = async (order: Order) => {
    try {
      setIsSendingPush(true);
      setPushStatus(null);
      const res = await fetch('/api/notify-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          city: order.city,
          siteAddress: order.siteAddress,
          driverName: currentDriver.name,
          driverTag: currentDriver.id,
          wazeUrl: order.wazeUrl,
          scheduledTime: order.scheduledTime
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setPushStatus(`✅ התראת OneSignal נשלחה בהצלחה למכשיר הנהג (${currentDriver.name})!`);
      } else {
        setPushStatus(`⚠️ שגיאה בשליחת התראה: ${data.message}`);
      }
    } catch (e: any) {
      setPushStatus(`⚠️ נכשלה שליחת התראה: ${e.message}`);
    } finally {
      setIsSendingPush(false);
      setTimeout(() => setPushStatus(null), 60000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Driver Switcher Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center">
            <Truck className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                PWA Driver Mode
              </span>
              <span className="text-xs text-slate-400">אפליקציית נהג שטח</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{currentDriver.name}</h2>
            <p className="text-xs text-slate-400 font-mono">
              {currentDriver.truckModel} | לוחית: {currentDriver.truckPlate}
            </p>
          </div>
        </div>

        {/* Driver selector pills & View Mode switcher */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Driver Switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedDriverId('hikmat')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDriverId === 'hikmat'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>חכמת (מנוף 26ט)</span>
            </button>
            <button
              onClick={() => setSelectedDriverId('ali')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                selectedDriverId === 'ali'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>עלי (משאית 15ט)</span>
            </button>
          </div>

          {/* View Mode Switch (Cards vs Leaflet Map) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setDriverViewMode('cards')}
              className={`px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                driverViewMode === 'cards'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגת כרטיסי פריקה"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>תחנות</span>
            </button>
            <button
              onClick={() => setDriverViewMode('map')}
              className={`px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                driverViewMode === 'map'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-cyan-400'
              }`}
              title="מפת Leaflet ניווט חי"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>מפת Leaflet</span>
            </button>
            <button
              onClick={() => setDriverViewMode('split')}
              className={`px-2.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 hidden sm:flex ${
                driverViewMode === 'split'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="תצוגה משולבת (מפה + כרטיסים)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>משולב</span>
            </button>
          </div>
        </div>
      </div>

      {/* Push Notification feedback banner */}
      {pushStatus && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-800 text-xs font-medium text-cyan-300 flex items-center justify-between shadow-lg">
          <span>{pushStatus}</span>
          <button onClick={() => setPushStatus(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* LEAFLET MAP VIEW (Full or Split) */}
      {(driverViewMode === 'map' || driverViewMode === 'split') && (
        <div className="space-y-3">
          <LeafletRouteMap
            orders={orders}
            selectedDriverFilter={selectedDriverId}
            heightClass={driverViewMode === 'map' ? 'h-[680px]' : 'h-[440px]'}
            isPWACompact={true}
          />
        </div>
      )}

      {/* Driver Active Orders Queue (Cards View or Split Bottom) */}
      {(driverViewMode === 'cards' || driverViewMode === 'split') && (
      <div className="space-y-4">
        {driverOrders.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">אין נסיעות פעילות כרגע לנהג זה</h3>
            <p className="text-xs text-slate-500 mt-1">כל המשלוחים סופקו או שטרם שובצו נסיעות חדשות.</p>
          </div>
        ) : (
          driverOrders.map((order, idx) => {
            const isCompleted = order.status === 'סופק בהצלחה';

            return (
              <div
                key={order.orderNumber}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition space-y-4 ${
                  isCompleted ? 'border-slate-800/80 opacity-75' : 'border-cyan-900/80 hover:border-cyan-700'
                }`}
              >
                {/* Header with big numbers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-bold">
                        יעד {idx + 1}
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        הזמנה #{order.orderNumber}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">{order.customerName}</h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {order.siteAddress}, {order.city}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono font-bold text-cyan-300">
                      שעת יעד: {order.scheduledTime}
                    </span>
                  </div>
                </div>

                {/* Big Action Buttons (Touch Friendly 48px+) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Giant Waze Button */}
                  <a
                    href={order.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[50px] px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 transition active:scale-95"
                  >
                    <Navigation className="w-5 h-5 text-slate-950" />
                    <span>🗺️ פתח ניווט Waze מיידי</span>
                  </a>

                  {/* Call Customer / Rami */}
                  <a
                    href={`tel:${order.driverPhone || '050-886-1080'}`}
                    className="min-h-[50px] px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition active:scale-95"
                  >
                    <Phone className="w-5 h-5 text-emerald-400" />
                    <span>📞 חייג לאיש קשר באתר</span>
                  </a>
                </div>

                {/* Items & Pallets Box */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-cyan-400" />
                      חומרי בניין לפריקה באתר:
                    </span>
                    <span className="font-mono text-slate-300">{order.totalWeightKg} ק"ג</span>
                  </div>
                  <pre className="text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {order.itemsFormatted}
                  </pre>
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-3 text-xs font-mono">
                    <span className="text-amber-400">שקי בלה לפקדון: {order.bigBagsDeposit}</span>
                    <span className="text-purple-400">משטחי סבן לפקדון: {order.palletsDeposit}</span>
                  </div>
                </div>

                {/* Status Progression & Signature */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateStatus(order.orderNumber, 'הועמס במחסן')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        order.status === 'הועמס במחסן'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      1. הועמס במחסן
                    </button>
                    <button
                      onClick={() => onUpdateStatus(order.orderNumber, 'בדרך לאתר')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        order.status === 'בדרך לאתר'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      2. בדרך לאתר
                    </button>
                    <button
                      onClick={() => {
                        onUpdateStatus(order.orderNumber, 'סופק בהצלחה');
                        setActiveSignOrder(order.orderNumber);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                        order.status === 'סופק בהצלחה'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>3. סופק בהצלחה ✓</span>
                    </button>
                  </div>

                  {/* Camera Scanner Button for Driver & Send Push */}
                  <div className="flex items-center gap-2">
                    {onOpenScanner && (
                      <button
                        onClick={() => onOpenScanner(order)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                          order.signatureReceived || order.signatureImage
                            ? 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white border-emerald-500 shadow-emerald-900/30 active:scale-95'
                        }`}
                        title="סרוק חתימת נייר פיזית באמצעות מצלמת הנייד"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{order.signatureReceived || order.signatureImage ? 'חתימה נסרקה ✓ (עדכן)' : '📸 סרוק חתימה במצלמה'}</span>
                      </button>
                    )}

                    {/* Send Test Push Notification */}
                    <button
                      onClick={() => handleTriggerDriverPush(order)}
                      disabled={isSendingPush}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-800 text-xs font-medium transition"
                      title="שלח התראת דחיפה לטלפון הנהג"
                    >
                      <Bell className="w-3.5 h-3.5 text-blue-400" />
                      <span>שלח Push לטלפון</span>
                    </button>
                  </div>
                </div>

                {/* Scanned Signature Preview if available */}
                {(order.signatureImage || order.signatureReceived) && (
                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-300 font-bold">חתימת לקוח/אתר נסרקה ומאושרת בתעודת המשלוח</span>
                    </div>
                    {order.signatureImage && (
                      <div className="bg-white rounded-lg px-2 py-0.5 border border-emerald-700 shrink-0">
                        <img src={order.signatureImage} alt="חתימה נסרקת" className="h-5 max-w-[80px] object-contain" />
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Confirmation Feedback */}
                {activeSignOrder === order.orderNumber && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-xs text-emerald-300 flex items-center justify-between">
                    <span>✓ משלוח אושר ונרשם כסופק בגיליון דוח בוקר מבצעי.</span>
                    <button
                      onClick={() => setActiveSignOrder(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      סגור
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
};
