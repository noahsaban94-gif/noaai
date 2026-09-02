import React, { useState, useRef } from 'react';
import { 
  X, 
  MapPin, 
  Truck, 
  Clock, 
  Calendar, 
  FileText, 
  Navigation, 
  ExternalLink, 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  PenTool, 
  Trash2, 
  Sparkles,
  Phone,
  PackageCheck,
  Building,
  Printer,
  Package,
  Boxes,
  Scale,
  Eye
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { useTheme } from '../context/ThemeContext';

interface OrderCardModalProps {
  order: Order | null;
  onClose: () => void;
  onUpdateStatus?: (orderNumber: string, status: OrderStatus) => void;
  onGenerateDeliveryNote?: (order: Order, signatureDataUrl?: string) => void;
}

export const OrderCardModal: React.FC<OrderCardModalProps> = ({
  order,
  onClose,
  onUpdateStatus,
  onGenerateDeliveryNote
}) => {
  if (!order) return null;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [isSigning, setIsSigning] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(order.signatureImage || null);
  const [isGenerated, setIsGenerated] = useState(!!order.deliveryNote && order.deliveryNote !== 'טרם הופקה');
  const [activeTab, setActiveTab] = useState<'details' | 'signature' | 'pdf' | 'document'>('details');

  // Canvas for Digital Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureUrl(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSignatureUrl(dataUrl);
    setIsSigning(false);
    setActiveTab('pdf');
  };

  const handleCreateDeliveryNote = () => {
    setIsGenerated(true);
    if (onGenerateDeliveryNote) {
      onGenerateDeliveryNote(order, signatureUrl || undefined);
    }
    setActiveTab('pdf');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right border ${
        isLight ? 'bg-white border-sky-200 shadow-sky-200/50' : 'bg-slate-900 border-slate-800 shadow-2xl'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between ${
          isLight 
            ? 'bg-gradient-to-r from-sky-50 via-white to-blue-50 border-sky-100' 
            : 'bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${
              isLight ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs px-2.5 py-0.5 rounded-xl font-bold border ${
                  isLight ? 'bg-sky-100 text-sky-900 border-sky-300' : 'bg-cyan-950 text-cyan-400 border-cyan-800'
                }`}>
                  הזמנה #{order.orderId || order.orderNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                  order.status === 'Delivered' || order.status === 'סופק בהצלחה'
                    ? isLight ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : order.status === 'In Progress' || order.status === 'בדרך לאתר' || order.status === 'הועמס במחסן'
                    ? isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {order.status}
                </span>
              </div>
              <h2 className={`text-xl font-black mt-1 font-hebrew-heavy ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {order.customerName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Navigation */}
        <div className={`px-5 pt-3 border-b flex gap-2 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/50 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl transition border-b-2 ${
              activeTab === 'details'
                ? isLight ? 'border-sky-600 text-sky-800 bg-white' : 'border-cyan-400 text-cyan-400 bg-slate-900'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            פרטי הזמנה ושיוך לוגיסטי
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'signature'
                ? isLight ? 'border-sky-600 text-sky-800 bg-white' : 'border-cyan-400 text-cyan-400 bg-slate-900'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>חתימה דיגיטלית</span>
            {signatureUrl && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pdf'
                ? isLight ? 'border-sky-600 text-sky-800 bg-white' : 'border-cyan-400 text-cyan-400 bg-slate-900'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>תעודת משלוח (PDF)</span>
            {isGenerated && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`px-4 py-2 text-xs font-black rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'document'
                ? isLight ? 'border-sky-600 text-sky-800 bg-white' : 'border-cyan-400 text-cyan-400 bg-slate-900'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-sky-500" />
            <span>קובץ הזמנה ותיקייה 👁️</span>
          </button>
        </div>

        {/* Tab 1: Order Details */}
        {activeTab === 'details' && (
          <div className="p-5 space-y-5">
            {/* Top Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-2xl border ${
                isLight ? 'bg-sky-50/50 border-sky-200/80' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className={`text-[10px] block mb-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>יעד ואתר פריקה</span>
                <p className={`text-xs font-black flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                  <span>{order.siteAddress || order.destination}</span>
                </p>
                <a
                  href={order.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex items-center gap-1 text-[11px] font-black ${
                    isLight ? 'text-sky-700 hover:text-sky-900' : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                >
                  <Navigation className="w-3 h-3" />
                  <span>נווט ב-Waze לאתר</span>
                </a>
              </div>

              <div className={`p-3.5 rounded-2xl border ${
                isLight ? 'bg-sky-50/50 border-sky-200/80' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className={`text-[10px] block mb-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>נהג ומשאית משויכת</span>
                <p className={`text-xs font-black flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <Truck className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                  <span>{order.assignedDriver || order.driver}</span>
                </p>
                {order.driverPhone && (
                  <span className={`text-[10px] font-mono font-bold block mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    טלפון: {order.driverPhone}
                  </span>
                )}
              </div>

              <div className={`p-3.5 rounded-2xl border ${
                isLight ? 'bg-sky-50/50 border-sky-200/80' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <span className={`text-[10px] block mb-1 font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>מחסן יוצא וסבב</span>
                <p className={`text-xs font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {order.warehouseName || (order.warehouse === '4_HARASH' ? '🏭 4️⃣ החרש' : '🏟️ 1️⃣ התלמיד')}
                </p>
                <div className={`flex items-center gap-2 mt-1.5 text-[11px] font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  <Clock className={`w-3 h-3 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                  <span>שעה: {order.scheduledTime || '08:00'}</span>
                </div>
              </div>
            </div>

            {/* Normalized Items String (With Background) */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-sky-50/80 border-sky-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-black flex items-center gap-1.5 ${
                  isLight ? 'text-sky-950' : 'text-slate-200'
                }`}>
                  <Package className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-cyan-400'}`} />
                  <span>פירוט פריטים מנורמל (Items_Details):</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                  isLight ? 'bg-white text-sky-800 border border-sky-200' : 'text-cyan-400 bg-slate-900'
                }`}>מבנה טבלה 2</span>
              </div>
              <p className={`font-mono text-xs font-bold leading-relaxed p-3 rounded-xl border whitespace-pre-line ${
                isLight 
                  ? 'bg-white text-slate-900 border-sky-100 shadow-sm' 
                  : 'bg-slate-900/80 text-cyan-300 border-slate-800/80'
              }`}>
                {order.itemsDetails || order.itemsFormatted}
              </p>
            </div>

            {/* Structured Items Table */}
            {order.itemsList && order.itemsList.length > 0 && (
              <div className={`border rounded-2xl overflow-hidden ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className={`px-3 py-2 text-[11px] font-mono font-bold border-b flex justify-between ${
                  isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}>
                  <span>רשימת מק"טים בהזמנה</span>
                  <span>{order.itemsList.length} פריטים</span>
                </div>
                <div className={`divide-y max-h-40 overflow-y-auto ${
                  isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800/60 bg-slate-950'
                }`}>
                  {order.itemsList.map((item, i) => (
                    <div key={i} className={`p-2.5 flex items-center justify-between text-xs transition ${
                      isLight ? 'hover:bg-sky-50/50' : 'hover:bg-slate-800/30'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-black ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>#{item.sku}</span>
                        <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.name}</span>
                      </div>
                      <span className={`font-mono font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deposits & Logistics Indicators */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className={`p-3 rounded-2xl border ${
                isLight ? 'bg-purple-50 border-purple-200' : 'bg-slate-950/60 border-slate-800/80'
              }`}>
                <span className={`text-[10px] block font-bold ${isLight ? 'text-purple-700' : 'text-slate-500'}`}>בלות פקדון (60002)</span>
                <span className={`font-mono font-black text-sm ${isLight ? 'text-purple-950' : 'text-white'}`}>{order.bigBagsDeposit}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-950/60 border-slate-800/80'
              }`}>
                <span className={`text-[10px] block font-bold ${isLight ? 'text-indigo-700' : 'text-slate-500'}`}>משטחי סבן (60060)</span>
                <span className={`font-mono font-black text-sm ${isLight ? 'text-indigo-950' : 'text-white'}`}>{order.palletsDeposit}</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
              }`}>
                <span className={`text-[10px] block font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>משקל משוער</span>
                <span className={`font-mono font-black text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{order.totalWeightKg} ק"ג</span>
              </div>
              <div className={`p-3 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
              }`}>
                <span className={`text-[10px] block font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>דרישת מנוף</span>
                <span className={`font-bold ${order.isCraneRequired ? 'text-amber-600 dark:text-amber-400' : isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {order.isCraneRequired ? 'כן (מנוף הידראולי)' : 'ללא מנוף'}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${
              isLight ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>עדכן סטטוס:</span>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus && onUpdateStatus(order.orderNumber, e.target.value as OrderStatus)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-slate-950 border-slate-700 text-white focus:border-cyan-500'
                  }`}
                >
                  <option value="Pending">בסידור עבודה (Pending)</option>
                  <option value="In Progress">בדרך לאתר (In Progress)</option>
                  <option value="Delivered">סופק בהצלחה (Delivered)</option>
                </select>
              </div>

              <button
                onClick={() => setActiveTab('signature')}
                className={`px-4 py-2.5 rounded-2xl font-black text-xs transition flex items-center gap-1.5 shadow-md ${
                  isLight
                    ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>הפק תעודת משלוח וחתימה</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Signature Pad */}
        {activeTab === 'signature' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-black font-hebrew-heavy ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  חתימת לקוח / מנהל עבודה באתר
                </h3>
                <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  חתום באמצעות האצבע, עט מגע או עכבר לאישור קבלת הסחורה.
                </p>
              </div>
              {signatureUrl && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>קיימת חתימה</span>
                </span>
              )}
            </div>

            {/* Signature Canvas Box */}
            <div className={`border-2 border-dashed rounded-3xl p-4 flex flex-col items-center justify-center relative ${
              isLight ? 'bg-sky-50/50 border-sky-300' : 'bg-slate-950 border-cyan-800/80'
            }`}>
              <canvas
                ref={canvasRef}
                width={500}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className={`rounded-2xl cursor-crosshair w-full max-w-[500px] touch-none shadow-sm ${
                  isLight ? 'bg-white border border-sky-100' : 'bg-slate-900'
                }`}
              />
              <div className={`w-full max-w-[500px] flex items-center justify-between text-[11px] font-bold pt-2 px-1 ${
                isLight ? 'text-slate-500' : 'text-slate-500'
              }`}>
                <span>חתימת מקבל: {order.customerName}</span>
                <span>תאריך: {new Date().toLocaleDateString('he-IL')}</span>
              </div>
            </div>

            {/* Signature Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={clearSignature}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>נקה חתימה</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveSignature}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>שמור חתימה ועבור לתעודת משלוח</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Delivery Note PDF Preview */}
        {activeTab === 'pdf' && (
          <div className="p-5 space-y-4">
            {/* Delivery Note Sheet Layout Mock */}
            <div className="bg-white text-slate-950 p-6 rounded-3xl shadow-xl space-y-4 border border-slate-200 text-right print:p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-lg font-black tracking-tight text-slate-900 font-hebrew-heavy">
                    ח. סבן חומרי בניין (1994) בע"מ
                  </h1>
                  <p className="text-[11px] text-slate-600 font-bold">ח.פ 512019482 | אזור תעשייה טירה | טל: 09-7938383</p>
                </div>
                <div className="text-left font-mono">
                  <span className="block text-xs font-black text-sky-800">
                    תעודת משלוח #{order.deliveryNote || `DN-${order.orderNumber}`}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-bold">
                    תאריך: {new Date().toLocaleDateString('he-IL')} {order.scheduledTime}
                  </span>
                </div>
              </div>

              {/* Order Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">שם הלקוח:</span>
                  <span className="font-black text-slate-900">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">אתר אספקה:</span>
                  <span className="font-bold text-slate-900">{order.siteAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">נהג ורכב:</span>
                  <span className="font-bold text-slate-900">{order.assignedDriver}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-bold">מחסן יוצא:</span>
                  <span className="font-bold text-slate-900">{order.warehouseName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-black text-[11px] border-b border-slate-200">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">מק"ט</th>
                      <th className="p-2.5">תיאור המוצר</th>
                      <th className="p-2.5">כמות</th>
                      <th className="p-2.5">יחידה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {order.itemsList && order.itemsList.length > 0 ? (
                      order.itemsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-black text-sky-700">{item.sku}</td>
                          <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                          <td className="p-2.5 font-mono font-black text-slate-900">{item.quantity}</td>
                          <td className="p-2.5 text-slate-600 font-bold">{item.unit}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-600 font-bold">
                          {order.itemsFormatted}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Deposits & Signatures Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200 text-xs">
                <div className="text-[11px] text-slate-700 space-y-0.5 font-bold">
                  <p><strong>פקדונות:</strong> בלות: {order.bigBagsDeposit} | משטחים: {order.palletsDeposit}</p>
                  <p className="text-[10px] text-slate-500">הסחורה התקבלה במצב תקין ומושלם באתר הלקוח.</p>
                </div>

                <div className="border border-slate-200 p-2.5 rounded-2xl bg-slate-50 text-center min-w-[160px]">
                  <span className="text-[10px] text-slate-500 block mb-1 font-bold">חתימת מקבל הסחורה</span>
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="חתימה" className="h-10 mx-auto object-contain" />
                  ) : (
                    <div className="h-10 flex items-center justify-center text-[10px] text-slate-400 italic">
                      [טרם נחתם]
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setActiveTab('signature')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <PenTool className="w-3.5 h-3.5 text-sky-600 dark:text-cyan-400" />
                <span>{signatureUrl ? 'ערוך חתימה' : 'הוסף חתימה דיגיטלית'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateDeliveryNote}
                  className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>סנכרן לטבלת 'תעודות_משלוח_וחתימות' (טאב 3)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Order Document & Customer Drive Folder */}
        {activeTab === 'document' && (
          <div className="p-5 space-y-4">
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                  <h3 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    קובץ הזמנה מקורי ותיקיית לקוח: {order.customerName} ({order.customerNumber || '607125'})
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  אינטגרציה ישירה עם תיקיית הלקוח ב-Google Drive וקישור צפייה ישיר בגיליון Google Sheets
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={order.customerFolderUrl || `https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>תיקיית לקוח ב-Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={`https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&order=${order.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3.5 py-2 rounded-xl border text-xs font-black transition flex items-center gap-1.5 shadow-sm ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>פתח ב-Sheets</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Real Uploaded Document Display or Upload Notice */}
            {order.orderFileBase64 ? (
              <div className="space-y-3">
                <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {order.orderDocumentName || `הזמנת_לקוח_${order.orderNumber}.pdf`}
                    </span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      (הועלה פיזית וסונכרן לגיליון ולתיקייה)
                    </span>
                  </div>

                  <a
                    href={order.orderFileBase64}
                    download={order.orderDocumentName || `הזמנה_${order.orderNumber}.pdf`}
                    className="px-3 py-1 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>הורד קובץ</span>
                  </a>
                </div>

                <div className="border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-950 p-2 overflow-hidden flex items-center justify-center min-h-[420px]">
                  {order.orderFileBase64.startsWith('data:application/pdf') || (order.orderDocumentName && order.orderDocumentName.toLowerCase().endsWith('.pdf')) ? (
                    <iframe
                      src={order.orderFileBase64}
                      className="w-full h-[520px] rounded-xl border border-slate-800 bg-white"
                      title={`קובץ הזמנה PDF #${order.orderNumber}`}
                    />
                  ) : order.orderFileBase64.startsWith('data:image') ? (
                    <img
                      src={order.orderFileBase64}
                      alt={order.orderDocumentName || 'מסמך הזמנה'}
                      className="max-w-full h-auto max-h-[520px] object-contain rounded-xl shadow-lg mx-auto"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-2">
                      <FileText className="w-12 h-12 text-cyan-400 mx-auto" />
                      <p className="font-bold text-white text-sm">{order.orderDocumentName || 'קובץ הזמנה'}</p>
                      <p className="text-xs">הקובץ נשמר בתיקיית הלקוח ב-Drive.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`p-8 rounded-2xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-3 ${
                isLight ? 'bg-slate-50 border-sky-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <FileText className="w-10 h-10 text-slate-400" />
                <div>
                  <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    טרם הועלה קובץ הזמנה פיזי עבור הזמנה #{order.orderNumber || order.orderId}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    לחץ על כפתור העין (👁️) בטבלת ההזמנות להעלאת קובץ PDF או תמונה ושמירה אוטומטית בתיקיית הלקוח ב-Google Drive.
                  </p>
                </div>
                <a
                  href={order.customerFolderUrl || `https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm mt-1"
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>פתח תיקיית לקוח ב-Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

