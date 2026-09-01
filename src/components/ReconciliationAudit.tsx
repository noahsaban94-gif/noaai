import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Folder, 
  ExternalLink, 
  Check, 
  Layers, 
  Package, 
  FileText 
} from 'lucide-react';
import { Order } from '../types';

interface ReconciliationAuditProps {
  orders: Order[];
}

export const ReconciliationAudit: React.FC<ReconciliationAuditProps> = ({ orders }) => {
  const [reconciledOrders, setReconciledOrders] = useState<Record<string, {
    deliveryNoteNumber: string;
    returnedBigBags: number;
    returnedPallets: number;
    isMatched: boolean;
  }>>({
    '6215184': { deliveryNoteNumber: 'DN-99412', returnedBigBags: 3, returnedPallets: 1, isMatched: true },
    '6215180': { deliveryNoteNumber: 'DN-99413', returnedBigBags: 4, returnedPallets: 1, isMatched: true },
    '6215178': { deliveryNoteNumber: 'DN-99414', returnedBigBags: 0, returnedPallets: 0, isMatched: true }
  });

  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveReconciliation = async (orderNumber: string) => {
    const rec = reconciledOrders[orderNumber];
    if (!rec) return;

    try {
      setSavingNoteId(orderNumber);
      const res = await fetch('/api/gas/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          deliveryNoteNumber: rec.deliveryNoteNumber,
          returnedBigBags: rec.returnedBigBags,
          returnedPallets: rec.returnedPallets,
          isMatched: rec.isMatched,
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();
      setSuccessMsg(`✓ הצלבת תעודת משלוח עבור הזמנה #${orderNumber} נרשמה בהצלחה בגיליון הצלבה_ובקרה!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e) {
      console.warn('Reconciliation error:', e);
    } finally {
      setSavingNoteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              מערך הצלבה, בקרת תעודות משלוח ופקדונות
            </span>
            <span className="text-xs text-slate-400 font-mono">
              טאב: 'הצלבה_ובקרה'
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            השוואת הזמנות מול תעודות משלוח וזיכויי פקדון
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            בדיקת התאמה מלאה של שקי בלה (60002), משטחי סבן (60060) ומשטחי בלוקים (60006) בעת פריקה והחזרה.
          </p>
        </div>

        <a
          href="https://drive.google.com/drive/folders/1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
        >
          <Folder className="w-4 h-4 text-amber-400" />
          <span>תיקיית תעודות משלוח ב-Drive</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs font-medium text-emerald-300 flex items-center justify-between shadow-lg">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Reconciliation Table */}
      <div className="space-y-4">
        {orders.map((order) => {
          const rec = reconciledOrders[order.orderNumber] || {
            deliveryNoteNumber: `DN-${order.orderNumber.slice(-4)}`,
            returnedBigBags: order.bigBagsDeposit,
            returnedPallets: order.palletsDeposit,
            isMatched: true
          };

          return (
            <div
              key={order.orderNumber}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      הזמנה #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400">
                      לקוח: <span className="font-bold text-white">{order.customerName}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    יעד: {order.siteAddress}, {order.city} | מחסן: {order.warehouseName}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    התאמה מלאה
                  </span>
                </div>
              </div>

              {/* Grid of details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">מספר תעודת משלוח חתומה</label>
                  <input
                    type="text"
                    value={rec.deliveryNoteNumber}
                    onChange={(e) => {
                      setReconciledOrders(prev => ({
                        ...prev,
                        [order.orderNumber]: { ...rec, deliveryNoteNumber: e.target.value }
                      }));
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">פקדונות שסופקו בהזמנה</div>
                  <div className="flex justify-between font-mono py-0.5">
                    <span className="text-slate-300">בלות (60002):</span>
                    <span className="text-amber-400 font-bold">{order.bigBagsDeposit}</span>
                  </div>
                  <div className="flex justify-between font-mono py-0.5">
                    <span className="text-slate-300">משטחי סבן (60060):</span>
                    <span className="text-purple-400 font-bold">{order.palletsDeposit}</span>
                  </div>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">פקדונות שהוחזרו ע"י נהג</div>
                  <div className="flex items-center justify-between font-mono py-0.5">
                    <span className="text-slate-300">בלות שהוחזרו:</span>
                    <input
                      type="number"
                      min="0"
                      value={rec.returnedBigBags}
                      onChange={(e) => {
                        setReconciledOrders(prev => ({
                          ...prev,
                          [order.orderNumber]: { ...rec, returnedBigBags: parseInt(e.target.value) || 0 }
                        }));
                      }}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-center text-amber-300 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between font-mono py-0.5">
                    <span className="text-slate-300">משטחים שהוחזרו:</span>
                    <input
                      type="number"
                      min="0"
                      value={rec.returnedPallets}
                      onChange={(e) => {
                        setReconciledOrders(prev => ({
                          ...prev,
                          [order.orderNumber]: { ...rec, returnedPallets: parseInt(e.target.value) || 0 }
                        }));
                      }}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-center text-purple-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleSaveReconciliation(order.orderNumber)}
                  disabled={savingNoteId === order.orderNumber}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savingNoteId === order.orderNumber ? 'שומר בגיליון...' : 'אשר ושמור בגיליון הצלבה_ובקרה'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
