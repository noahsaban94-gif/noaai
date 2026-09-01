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
  Printer
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

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

  const [isSigning, setIsSigning] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(order.signatureImage || null);
  const [isGenerated, setIsGenerated] = useState(!!order.deliveryNote && order.deliveryNote !== 'טרם הופקה');
  const [activeTab, setActiveTab] = useState<'details' | 'signature' | 'pdf'>('details');

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
    ctx.strokeStyle = '#0284c7';
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  הזמנה #{order.orderId || order.orderNumber}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  order.status === 'Delivered' || order.status === 'סופק בהצלחה'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : order.status === 'In Progress' || order.status === 'בדרך לאתר' || order.status === 'הועמס במחסן'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {order.status}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">{order.customerName}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Navigation */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-2 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 ${
              activeTab === 'details'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            פרטי הזמנה ושיוך לוגיסטי
          </button>
          <button
            onClick={() => setActiveTab('signature')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'signature'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>חתימה דיגיטלית</span>
            {signatureUrl && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'pdf'
                ? 'border-cyan-400 text-cyan-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>תעודת משלוח (PDF)</span>
            {isGenerated && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>
        </div>

        {/* Tab 1: Order Details */}
        {activeTab === 'details' && (
          <div className="p-5 space-y-5">
            {/* Top Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">יעד ואתר פריקה</span>
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{order.siteAddress || order.destination}</span>
                </p>
                <a
                  href={order.wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Navigation className="w-3 h-3" />
                  <span>נווט ב-Waze</span>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">נהג ומשאית משויכת</span>
                <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{order.assignedDriver || order.driver}</span>
                </p>
                {order.driverPhone && (
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">
                    טלפון: {order.driverPhone}
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">מחסן יוצא וסבב</span>
                <p className="text-xs font-semibold text-white">
                  {order.warehouseName || (order.warehouse === '4_HARASH' ? '🏭 4️⃣ החרש' : '🏟️ 1️⃣ התלמיד')}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>שעה: {order.scheduledTime || '08:00'}</span>
                </div>
              </div>
            </div>

            {/* Normalized Items String (Google Sheets Table 2 Structure) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>פירוט פריטים מנורמל (Items_Details):</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400">מבנה טבלה 2</span>
              </div>
              <p className="font-mono text-xs text-cyan-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800/80">
                {order.itemsDetails || order.itemsFormatted}
              </p>
            </div>

            {/* Structured Items Table */}
            {order.itemsList && order.itemsList.length > 0 && (
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-3 py-2 text-slate-400 text-[11px] font-mono border-b border-slate-800 flex justify-between">
                  <span>רשימת מק"טים בהזמנה</span>
                  <span>{order.itemsList.length} פריטים</span>
                </div>
                <div className="divide-y divide-slate-800/60 max-h-40 overflow-y-auto">
                  {order.itemsList.map((item, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">#{item.sku}</span>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono text-slate-300 font-semibold">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deposits & Logistics Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">בלות פקדון (60002)</span>
                <span className="font-mono font-bold text-white">{order.bigBagsDeposit}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">משטחי סבן (60060)</span>
                <span className="font-mono font-bold text-white">{order.palletsDeposit}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">משקל משוער</span>
                <span className="font-mono font-bold text-white">{order.totalWeightKg} ק"ג</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-[10px] text-slate-500 block">דרישת מנוף</span>
                <span className={`font-semibold ${order.isCraneRequired ? 'text-amber-400' : 'text-slate-400'}`}>
                  {order.isCraneRequired ? 'כן (מנוף הידראולי)' : 'ללא מנוף'}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">עדכן סטטוס:</span>
                <select
                  value={order.status}
                  onChange={(e) => onUpdateStatus && onUpdateStatus(order.orderNumber, e.target.value as OrderStatus)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                >
                  <option value="Pending">בסידור עבודה (Pending)</option>
                  <option value="In Progress">בדרך לאתר (In Progress)</option>
                  <option value="Delivered">סופק בהצלחה (Delivered)</option>
                </select>
              </div>

              <button
                onClick={() => setActiveTab('signature')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
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
                <h3 className="text-sm font-bold text-white">חתימת לקוח / מנהל עבודה באתר</h3>
                <p className="text-xs text-slate-400">חתום באמצעות האצבע, עט מגע או עכבר לאישור קבלת הסחורה.</p>
              </div>
              {signatureUrl && (
                <span className="px-2.5 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>קיימת חתימה</span>
                </span>
              )}
            </div>

            {/* Signature Canvas Box */}
            <div className="border-2 border-dashed border-cyan-800/80 rounded-2xl bg-slate-950 p-3 flex flex-col items-center justify-center relative">
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
                className="bg-slate-900 rounded-xl cursor-crosshair w-full max-w-[500px] touch-none"
              />
              <div className="w-full max-w-[500px] flex items-center justify-between text-[11px] text-slate-500 pt-2 px-1">
                <span>חתימת מקבל: {order.customerName}</span>
                <span>תאריך: {new Date().toLocaleDateString('he-IL')}</span>
              </div>
            </div>

            {/* Signature Controls */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={clearSignature}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>נקה חתימה</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={saveSignature}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>שמור חתימה ועבור לתעודת משלוח</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Delivery Note PDF Preview (Table 3 Representation) */}
        {activeTab === 'pdf' && (
          <div className="p-5 space-y-4">
            {/* Delivery Note Sheet Layout Mock */}
            <div className="bg-white text-slate-950 p-6 rounded-2xl shadow-xl space-y-4 border border-slate-300 text-right print:p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                    ח. סבן חומרי בניין (1994) בע"מ
                  </h1>
                  <p className="text-[11px] text-slate-600">ח.פ 512019482 | אזור תעשייה טירה | טל: 09-7938383</p>
                </div>
                <div className="text-left font-mono">
                  <span className="block text-xs font-bold text-cyan-800">
                    תעודת משלוח #{order.deliveryNote || `DN-${order.orderNumber}`}
                  </span>
                  <span className="block text-[10px] text-slate-500">
                    תאריך: {new Date().toLocaleDateString('he-IL')} {order.scheduledTime}
                  </span>
                </div>
              </div>

              {/* Order Info Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-100 p-2.5 rounded-lg border border-slate-200 font-sans">
                <div>
                  <span className="text-[10px] text-slate-500 block">שם הלקוח:</span>
                  <span className="font-bold text-slate-900">{order.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">אתר אספקה:</span>
                  <span className="font-bold text-slate-900">{order.siteAddress}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">נהג ורכב:</span>
                  <span className="font-bold text-slate-900">{order.assignedDriver}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">מחסן יוצא:</span>
                  <span className="font-bold text-slate-900">{order.warehouseName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold text-[11px] border-b border-slate-300">
                      <th className="p-2">#</th>
                      <th className="p-2">מק"ט</th>
                      <th className="p-2">תיאור המוצר</th>
                      <th className="p-2">כמות</th>
                      <th className="p-2">יחידה</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.itemsList && order.itemsList.length > 0 ? (
                      order.itemsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2 font-mono font-semibold text-slate-800">{item.sku}</td>
                          <td className="p-2 font-medium text-slate-900">{item.name}</td>
                          <td className="p-2 font-mono font-bold text-slate-900">{item.quantity}</td>
                          <td className="p-2 text-slate-600">{item.unit}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-600">
                          {order.itemsFormatted}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Deposits & Signatures Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-300 text-xs">
                <div className="text-[11px] text-slate-700 space-y-0.5">
                  <p><strong>פקדונות:</strong> בלות: {order.bigBagsDeposit} | משטחים: {order.palletsDeposit}</p>
                  <p className="text-[10px] text-slate-500">הסחורה התקבלה במצב תקין ומושלם באתר הלקוח.</p>
                </div>

                <div className="border border-slate-300 p-2 rounded-lg bg-slate-50 text-center min-w-[160px]">
                  <span className="text-[10px] text-slate-500 block mb-1">חתימת מקבל הסחורה</span>
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
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                <span>{signatureUrl ? 'ערוך חתימה' : 'הוסף חתימה דיגיטלית'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateDeliveryNote}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>סנכרן לטבלת 'תעודות_משלוח_וחתימות' (טאב 3)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
