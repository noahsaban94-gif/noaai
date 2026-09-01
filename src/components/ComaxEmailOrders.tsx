import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  FileText, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Folder, 
  Download, 
  Clock, 
  MapPin, 
  Truck, 
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';
import { EmailOrder, Order } from '../types';

interface ComaxEmailOrdersProps {
  onAddOrder: (order: Order) => Promise<void>;
}

export const ComaxEmailOrders: React.FC<ComaxEmailOrdersProps> = ({ onAddOrder }) => {
  const [emailOrders, setEmailOrders] = useState<EmailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [driveFolderName, setDriveFolderName] = useState('');
  const [injectedIds, setInjectedIds] = useState<string[]>([]);
  const [isInjecting, setIsInjecting] = useState<string | null>(null);

  useEffect(() => {
    fetchEmailFiles();
  }, []);

  const fetchEmailFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/email/orders-files');
      const data = await res.json();
      if (data.orders) {
        setEmailOrders(data.orders);
        setDriveFolderUrl(data.driveFolderUrl);
        setDriveFolderName(data.driveFolderName);
      }
    } catch (e) {
      console.warn('Error fetching email orders:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleInjectOrder = async (emailOrder: EmailOrder) => {
    try {
      setIsInjecting(emailOrder.orderNumber);
      
      const newOrder: Order = {
        orderNumber: emailOrder.orderNumber,
        customerNumber: emailOrder.customerNumber,
        customerName: emailOrder.customerName,
        siteAddress: emailOrder.siteAddress,
        city: emailOrder.city,
        warehouse: emailOrder.warehouse,
        warehouseName: emailOrder.warehouseName,
        itemsFormatted: emailOrder.itemsFormatted,
        itemsList: emailOrder.items,
        bigBagsDeposit: emailOrder.bigBagsDeposit,
        palletsDeposit: emailOrder.palletsDeposit,
        assignedDriver: emailOrder.assignedDriver,
        driverId: emailOrder.driverId,
        driverPhone: emailOrder.driverPhone,
        status: 'בסידור עבודה',
        deliveryNote: 'טרם הופקה',
        wazeUrl: emailOrder.wazeUrl,
        totalWeightKg: emailOrder.totalWeightKg,
        isCraneRequired: emailOrder.isCraneRequired,
        scheduledTime: emailOrder.scheduledTime,
        round: 'סבב 3 (צהריים)',
        orderDocumentUrl: emailOrder.orderDocumentUrl,
        orderDocumentName: emailOrder.orderDocumentName
      };

      await onAddOrder(newOrder);
      setInjectedIds(prev => [...prev, emailOrder.orderNumber]);
    } finally {
      setIsInjecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              מנוע קליטת הזמנות קומקס ERP במייל
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Email Listener Active
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            הזמנות נקלטות אוטומטית מתיבת הדואל של סבן
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            נועה AI מאזינה להודעות דואל מקומקס ERP, מחלצת טפסי PDF, מגבה בענן Google Drive ומכינה שיבוץ מיידי לנהג.
          </p>
        </div>

        {/* Direct Google Drive Folder Link */}
        {driveFolderUrl && (
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 text-blue-300 border border-blue-800 text-xs font-semibold transition"
          >
            <Folder className="w-4 h-4 text-blue-400" />
            <span>פתח תיקיית Drive של הזמנות קומקס</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">טוען הזמנות מתיבת הדואל...</div>
        ) : emailOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
            אין הזמנות חדשות במייל כרגע
          </div>
        ) : (
          emailOrders.map((emailOrder) => {
            const isInjected = injectedIds.includes(emailOrder.orderNumber);

            return (
              <div
                key={emailOrder.orderNumber}
                className="bg-slate-900 border border-purple-900/50 hover:border-purple-700/80 rounded-2xl p-5 shadow-xl transition space-y-4"
              >
                {/* Email Metadata Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-4 border-b border-slate-800 bg-slate-950/40 -mx-5 -mt-5 p-5 rounded-t-2xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-mono text-xs font-bold border border-purple-800">
                        קומקס ERP #{emailOrder.orderNumber}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">
                        מאת: <span className="text-slate-100">{emailOrder.emailMeta.senderName}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        ({emailOrder.emailMeta.senderEmail})
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      נושא: {emailOrder.emailMeta.subject}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      התקבל: {emailOrder.emailMeta.sentAt} | מערכת מקור: {emailOrder.emailMeta.systemOrigin}
                    </p>
                  </div>

                  {/* 1-Click Inject Button */}
                  <div>
                    <button
                      onClick={() => handleInjectOrder(emailOrder)}
                      disabled={isInjected || isInjecting === emailOrder.orderNumber}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                        isInjected
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 cursor-default'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                      }`}
                    >
                      {isInjected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>הוזרק בהצלחה לגיליון ולסידור!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className={`w-4 h-4 ${isInjecting === emailOrder.orderNumber ? 'animate-spin' : ''}`} />
                          <span>{isInjecting === emailOrder.orderNumber ? 'מזריק...' : 'הזרק הזמנה ישירות לסידור העבודה'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Order Details & PDF Attachment Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left 2 Cols: Customer & Items */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">
                          {emailOrder.customerName} (לקוח {emailOrder.customerNumber})
                        </span>
                        <span className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {emailOrder.siteAddress}, {emailOrder.city}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 mb-2 font-medium">פריטי ההזמנה שפוענחו:</div>
                      <pre className="text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {emailOrder.itemsFormatted}
                      </pre>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300">
                        שקי בלה לפקדון (60002): {emailOrder.bigBagsDeposit}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-purple-300">
                        משטחי סבן לפקדון (60060): {emailOrder.palletsDeposit}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-300">
                        משקל: {(emailOrder.totalWeightKg / 1000).toFixed(1)} טון
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300">
                        שיוך: {emailOrder.assignedDriver}
                      </span>
                    </div>
                  </div>

                  {/* Right Col: PDF Attachment Box */}
                  <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-red-400" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            {emailOrder.emailMeta.pdfFileName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            גודל: {emailOrder.emailMeta.pdfFileSize}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                        קובץ ה-PDF המקורי נשמר ב-Google Drive של ח. סבן לוגיסטיקה לצורך ארכוב וביקורת.
                      </p>
                    </div>

                    <a
                      href={emailOrder.orderDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>צפה במסמך המקורי ב-Drive</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
