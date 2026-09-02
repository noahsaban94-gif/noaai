import React, { useState } from 'react';
import { 
  Radio, 
  MapPin, 
  Truck, 
  Clock, 
  CheckCircle, 
  Send, 
  Volume2, 
  VolumeX, 
  Lock, 
  Navigation, 
  AlertCircle, 
  Share2,
  BellRing,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  TrendingUp,
  MessageSquare,
  UserCheck,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Order } from '../types';
import { SABAN_DRIVERS } from '../data/mockData';

interface MorningDispatchProps {
  orders: Order[];
  onUpdateStatus: (orderNumber: string, status: Order['status']) => void;
  onSendWhatsApp: (order: Order) => void;
  onNotifyDriver: (order: Order) => void;
  onArchiveReport: () => void;
  isArchiving: boolean;
  onNavigateTab?: (tab: string) => void;
}

export const MorningDispatch: React.FC<MorningDispatchProps> = ({
  orders,
  onUpdateStatus,
  onSendWhatsApp,
  onNotifyDriver,
  onArchiveReport,
  isArchiving,
  onNavigateTab
}) => {
  const [playingOrderId, setPlayingOrderId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [activeDriverFilter, setActiveDriverFilter] = useState<string>('all');
  const [hideDelivered, setHideDelivered] = useState<boolean>(false);
  const [isSendingMakeReport, setIsSendingMakeReport] = useState<boolean>(false);
  const [makeSuccessBanner, setMakeSuccessBanner] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{ title: string; content: string; waUrl?: string } | null>(null);

  const isDeliveredStatus = (status: string) => status === 'Delivered' || status === 'סופק בהצלחה';

  const filteredOrders = orders.filter(order => {
    if (hideDelivered && isDeliveredStatus(order.status)) return false;
    if (activeDriverFilter === 'all') return true;
    if (activeDriverFilter === 'hikmat') return order.assignedDriver.includes('חכמת');
    if (activeDriverFilter === 'ali') return order.assignedDriver.includes('עלי');
    return true;
  });

  const deliveredCount = orders.filter(o => isDeliveredStatus(o.status)).length;

  const totalWeight = orders.reduce((sum, o) => sum + (o.totalWeightKg || 0), 0);
  const totalPallets = orders.reduce((sum, o) => sum + (o.palletsDeposit || 0), 0);
  const totalBigBags = orders.reduce((sum, o) => sum + (o.bigBagsDeposit || 0), 0);

  // Audio briefing handler using server Gemini TTS
  const handlePlayBriefing = async (order: Order) => {
    if (playingOrderId === order.orderNumber) {
      setPlayingOrderId(null);
      return;
    }

    try {
      setAudioLoading(true);
      const briefingText = `בוקר טוב ל${order.assignedDriver}! יעד נסיעה: ${order.customerName}, כתובת: ${order.siteAddress}, עיר: ${order.city}. מחסן יוצא: ${order.warehouseName}. שעת הגעה מתוכננת: ${order.scheduledTime}. יש לפרוק בזהירות. באדיבות נועה סבן!`;
      
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: briefingText })
      });
      const data = await res.json();

      if (data.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        setPlayingOrderId(order.orderNumber);
        audio.play();
        audio.onended = () => setPlayingOrderId(null);
      } else {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(briefingText);
          utterance.lang = 'he-IL';
          setPlayingOrderId(order.orderNumber);
          window.speechSynthesis.speak(utterance);
          utterance.onend = () => setPlayingOrderId(null);
        }
      }
    } catch (e) {
      console.warn('TTS playback error:', e);
    } finally {
      setAudioLoading(false);
    }
  };

  // Trigger full Morning Report to Make.com Webhook
  const handleSendFullMorningReportMake = async () => {
    try {
      setIsSendingMakeReport(true);
      const res = await fetch('/api/whatsapp/send-make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'morning_report',
          orders: orders,
          stats: {
            totalOrders: orders.length,
            harashCount: orders.filter(o => o.warehouse.includes('4') || o.warehouse.includes('HARASH')).length,
            talmidCount: orders.filter(o => o.warehouse.includes('1') || o.warehouse.includes('TALMID')).length
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setMakeSuccessBanner('✓ דוח הבוקר המבצעי שודר בהצלחה לוואטסאפ של ראמי דרך Make.com Webhook!');
        setTimeout(() => setMakeSuccessBanner(null), 7000);
      }
    } catch (err: any) {
      alert('שגיאה בשידור: ' + err.message);
    } finally {
      setIsSendingMakeReport(false);
    }
  };

  // Trigger Driver Dispatch via Make.com
  const handleSendDriverMake = async (order: Order) => {
    const isHikmat = order.assignedDriver.includes('חכמת');
    try {
      const res = await fetch('/api/whatsapp/send-make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: isHikmat ? 'driver_hikmat' : 'driver_ali',
          order: order
        })
      });
      const data = await res.json();
      if (data.success) {
        setMakeSuccessBanner(`✓ תדריך משימה שודר בהצלחה ל${isHikmat ? 'חכמת (מרצדס מנוף)' : 'עלי (איסוזו)'} דרך Make!`);
        setTimeout(() => setMakeSuccessBanner(null), 6000);
      }
    } catch (err) {
      onSendWhatsApp(order);
    }
  };

  // Trigger Customer Alert via Make.com
  const handleSendCustomerAlert = async (order: Order) => {
    try {
      const res = await fetch('/api/whatsapp/send-make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer_alert',
          order: order
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewModal({
          title: `עדכון יציאה לאתר — ${order.customerName}`,
          content: data.formattedMessage,
          waUrl: data.waDirectUrl
        });
      }
    } catch (e: any) {
      alert('שגיאה ביצירת הודעת לקוח: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner if dispatched */}
      {makeSuccessBanner && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-sm flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{makeSuccessBanner}</span>
          </div>
          <button onClick={() => setMakeSuccessBanner(null)} className="text-xs text-emerald-400 underline">סגור</button>
        </div>
      )}

      {/* Top Banner with Operational Overview */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border border-cyan-900/40 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                דוח בוקר מבצעי פעיל
              </span>
              <span className="text-xs text-slate-400 font-mono">
                גיליון 1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              סידור עבודה ושיגור נהגים יומי (נועה AI)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              משימות פתוחות, שיבוצי משאיות, קישורי ניווט Waze, תדריכים קוליים ושידור ישיר ל-WhatsApp דרך Make.com Webhook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {/* Make.com Full Morning Report WhatsApp Dispatch */}
            <button
              onClick={handleSendFullMorningReportMake}
              disabled={isSendingMakeReport}
              id="send-make-morning-report-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition active:scale-95"
            >
              <Send className={`w-4 h-4 ${isSendingMakeReport ? 'animate-spin' : ''}`} />
              <span>{isSendingMakeReport ? 'משדר ל-Make.com...' : '📲 שדר דוח בוקר ל-WhatsApp (Make)'}</span>
            </button>

            {/* View Route Density D3 Map Button */}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('route-density')}
                id="view-route-density-btn"
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition shadow-sm"
              >
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>מפת צפיפות ומסלולים</span>
              </button>
            )}

            {/* Archive Daily Report Button */}
            <button
              onClick={onArchiveReport}
              disabled={isArchiving}
              id="archive-morning-report-btn"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition shadow-sm"
            >
              <Lock className={`w-4 h-4 ${isArchiving ? 'animate-spin' : ''}`} />
              <span>{isArchiving ? 'נועל ושומר...' : 'נעילת דוח וארכוב'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">סך משלוחי בוקר</span>
            <span className="text-xl font-bold font-mono text-cyan-400">{orders.length} משלוחים</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">משקל כולל משוער</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{(totalWeight / 1000).toFixed(1)} טון</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">סה"כ בלות לפקדון</span>
            <span className="text-xl font-bold font-mono text-amber-400">{totalBigBags} בלות (60002)</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-1">סה"כ משטחי סבן</span>
            <span className="text-xl font-bold font-mono text-purple-400">{totalPallets} משטחים (60060)</span>
          </div>
        </div>
      </div>

      {/* Driver Filtering Tabs & Hide Delivered Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveDriverFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              activeDriverFilter === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            כל הנהגים ({orders.length})
          </button>
          <button
            onClick={() => setActiveDriverFilter('hikmat')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeDriverFilter === 'hikmat'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🏗️ חכמת (מרצדס מנוף 26ט)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
              {orders.filter(o => o.assignedDriver.includes('חכמת')).length}
            </span>
          </button>
          <button
            onClick={() => setActiveDriverFilter('ali')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
              activeDriverFilter === 'ali'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>🚚 עלי (משאית איסוזו 15ט)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono">
              {orders.filter(o => o.assignedDriver.includes('עלי')).length}
            </span>
          </button>
        </div>

        {/* Hide Delivered Orders Toggle */}
        <button
          onClick={() => setHideDelivered(!hideDelivered)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm ${
            hideDelivered
              ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 hover:text-white border-slate-800'
          }`}
          title="הסתר או הצג משלוחים שכבר סופקו בהצלחה"
        >
          {hideDelivered ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span>מוסתר סופקו ({deliveredCount})</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>הסתר סופקו ({deliveredCount})</span>
            </>
          )}
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => {
          const isHikmat = order.assignedDriver.includes('חכמת');
          return (
            <div
              key={order.orderNumber}
              className="rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-5 transition shadow-lg relative overflow-hidden"
            >
              {/* Top Row: Round, Order ID, Warehouse Tag, Destination */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {order.round || `סבב ${index + 1}`}
                  </span>
                  <span className="text-base font-bold text-white font-mono">
                    #{order.orderNumber}
                  </span>
                  <span className="text-sm font-semibold text-slate-200 mr-2">
                    {order.customerName}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {order.warehouseName}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{order.siteAddress}, {order.city}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-cyan-400 mr-3">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{order.scheduledTime}</span>
                  </div>
                </div>

                {/* Driver Assignment & Status Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <Truck className={`w-4 h-4 ${isHikmat ? 'text-cyan-400' : 'text-blue-400'}`} />
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block leading-tight">נהג משובץ</span>
                      <span className="text-xs font-semibold text-slate-200">{order.assignedDriver}</span>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.orderNumber, e.target.value as Order['status'])}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border transition cursor-pointer ${
                      order.status === 'סופק בהצלחה'
                        ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                        : order.status === 'בדרך לאתר'
                        ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                        : order.status === 'הועמס במחסן'
                        ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    <option value="בסידור עבודה">בסידור עבודה</option>
                    <option value="הועמס במחסן">הועמס במחסן</option>
                    <option value="בדרך לאתר">בדרך לאתר</option>
                    <option value="סופק בהצלחה">סופק בהצלחה ✓</option>
                    <option value="מועד האספקה מתאפס - בבדיקה מחדש">שינוי - מועד מתאפס</option>
                  </select>
                </div>
              </div>

              {/* Items & Deposits Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
                <div className="md:col-span-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                    פירוט מק"טים ומוצרים להעמסה:
                  </div>
                  <pre className="text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {order.itemsFormatted}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] text-slate-400 block mb-1">פיקדונות ומשטחים:</span>
                    <div className="flex items-center justify-between text-xs font-mono py-0.5">
                      <span className="text-slate-300">שק גדול (בלה 60002):</span>
                      <span className="font-bold text-amber-400">{order.bigBagsDeposit} פקדון</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono py-0.5">
                      <span className="text-slate-300">משטח סבן (60060):</span>
                      <span className="font-bold text-purple-400">{order.palletsDeposit} פקדון</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">משקל מוערך:</span>
                    <span className="font-mono font-bold text-slate-200">{order.totalWeightKg} ק"ג</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Waze, WhatsApp Make, Customer Alert, Audio TTS, OneSignal Push */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/70">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Waze Direct Navigation */}
                  <a
                    href={order.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800 text-xs font-semibold transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>נווט ב-Waze</span>
                  </a>

                  {/* Send WhatsApp via Make to Driver */}
                  <button
                    onClick={() => handleSendDriverMake(order)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-950/40"
                    title="משדר תדריך מלא ל-Make.com Webhook ישירות לוואטסאפ של הנהג"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>📲 שדר לנהג (Make)</span>
                  </button>

                  {/* Customer Alert via WhatsApp */}
                  <button
                    onClick={() => handleSendCustomerAlert(order)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                    title="יוצר הודעת עדכון ללקוח שההזמנה יצאה לאתר"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    <span>הודעה ללקוח</span>
                  </button>

                  {/* Push Notification to Driver PWA */}
                  <button
                    onClick={() => onNotifyDriver(order)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 text-blue-300 border border-blue-800 text-xs font-semibold transition"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span>התראת Push לנהג</span>
                  </button>
                </div>

                {/* Audio Voice Briefing using Gemini TTS */}
                <button
                  onClick={() => handlePlayBriefing(order)}
                  disabled={audioLoading}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                    playingOrderId === order.orderNumber
                      ? 'bg-purple-600 text-white border-purple-500 animate-pulse'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-purple-300 border-purple-900/60'
                  }`}
                >
                  {playingOrderId === order.orderNumber ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>עצור הקראה</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>תדריך קולי (נועה AI)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal for Formatted WhatsApp Text */}
      {previewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                {previewModal.title}
              </h3>
              <button
                onClick={() => setPreviewModal(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-slate-800"
              >
                ✕ סגור
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
              <pre className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                {previewModal.content}
              </pre>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewModal.content);
                  alert('הטקסט הועתק ללוח!');
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                <Copy className="w-4 h-4" />
                <span>העתק טקסט</span>
              </button>

              {previewModal.waUrl && (
                <a
                  href={previewModal.waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>פתח ישירות ב-WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
