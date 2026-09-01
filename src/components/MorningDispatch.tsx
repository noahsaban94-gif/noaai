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
  TrendingUp
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

  const filteredOrders = orders.filter(order => {
    if (activeDriverFilter === 'all') return true;
    if (activeDriverFilter === 'hikmat') return order.assignedDriver.includes('חכמת');
    if (activeDriverFilter === 'ali') return order.assignedDriver.includes('עלי');
    return true;
  });

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
        // Fallback Web Speech API if offline
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

  return (
    <div className="space-y-6">
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
                טאב: 'דוח_בוקר_מבצעי' (Google Sheets)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              סידור עבודה ושיגור נהגים יומי
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              משימות פתוחות, שיבוצי משאיות, קישורי ניווט Waze, תדריכים קוליים וסנכרון תעודות מול מחסני סבן.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            {/* View Route Density D3 Map Button */}
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('route-density')}
                id="view-route-density-btn"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition shadow-sm"
              >
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>מפת צפיפות ומסלולים D3</span>
              </button>
            )}

            {/* Archive Daily Report Button */}
            <button
              onClick={onArchiveReport}
              disabled={isArchiving}
              id="archive-morning-report-btn"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition shadow-sm"
            >
              <Lock className={`w-4 h-4 ${isArchiving ? 'animate-spin' : ''}`} />
              <span>{isArchiving ? 'נועל ושומר בארכיון...' : 'נעילת דוח בוקר וארכוב'}</span>
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

      {/* Driver Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">סינון לפי נהג:</span>
        <button
          onClick={() => setActiveDriverFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
            activeDriverFilter === 'all'
              ? 'bg-slate-700 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          כל הנהגים ({orders.length})
        </button>
        {SABAN_DRIVERS.map((driver) => (
          <button
            key={driver.id}
            onClick={() => setActiveDriverFilter(driver.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeDriverFilter === driver.id
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {driver.name} — {driver.truckModel} ({driver.truckPlate})
          </button>
        ))}
      </div>

      {/* Morning Orders Task List */}
      <div className="space-y-4">
        {filteredOrders.map((order, index) => {
          const isCompleted = order.status === 'סופק בהצלחה';
          const isHikmat = order.assignedDriver.includes('חכמת');

          return (
            <div
              key={order.orderNumber}
              id={`morning-task-${order.orderNumber}`}
              className={`rounded-2xl border transition-all duration-200 p-5 shadow-md ${
                isCompleted 
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-80' 
                  : 'bg-slate-900/90 border-slate-800 hover:border-cyan-800/80'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
                {/* Order Identification & Round */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-xs font-semibold">
                      {order.round || `סבב ${index + 1}`}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      הזמנה #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      (לקוח: <span className="font-mono text-slate-300">{order.customerNumber}</span>)
                    </span>
                    {order.isCraneRequired && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-800/70 text-amber-300 text-[11px] font-medium flex items-center gap-1">
                        🏗️ דורש מנוף
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {order.customerName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      {order.siteAddress} ({order.city})
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {order.warehouseName}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      שעת יעד: <span className="font-mono font-semibold">{order.scheduledTime}</span>
                    </span>
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

              {/* Action Buttons: Waze, WhatsApp, Audio TTS, OneSignal Push */}
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

                  {/* Send WhatsApp to Driver */}
                  <button
                    onClick={() => onSendWhatsApp(order)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 text-xs font-semibold transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>שיגור תדריך WhatsApp</span>
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
    </div>
  );
};
