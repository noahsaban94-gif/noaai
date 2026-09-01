import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  Filter, 
  PenTool, 
  ShieldCheck,
  Eye,
  Send,
  Sparkles,
  Truck,
  MapPin
} from 'lucide-react';
import { DeliveryNoteRecord, Order } from '../types';

interface DeliveryNotesViewProps {
  deliveryNotes: DeliveryNoteRecord[];
  orders: Order[];
  onToggleSync: (noteId: string) => void;
  onOpenOrderModal: (order: Order) => void;
  onManualSyncSheet: () => void;
}

export const DeliveryNotesView: React.FC<DeliveryNotesViewProps> = ({
  deliveryNotes,
  orders,
  onToggleSync,
  onOpenOrderModal,
  onManualSyncSheet
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [signatureFilter, setSignatureFilter] = useState<'all' | 'signed' | 'unsigned'>('all');
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'unsynced'>('all');
  const [previewNote, setPreviewNote] = useState<DeliveryNoteRecord | null>(null);

  const filteredNotes = deliveryNotes.filter((note) => {
    const matchesSearch = 
      note.orderId.includes(searchTerm) ||
      note.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.driver.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSignature = 
      signatureFilter === 'all' || 
      (signatureFilter === 'signed' && note.isSigned) ||
      (signatureFilter === 'unsigned' && !note.isSigned);

    const matchesSync = 
      syncFilter === 'all' || 
      (syncFilter === 'synced' && note.syncStatus) ||
      (syncFilter === 'unsynced' && !note.syncStatus);

    return matchesSearch && matchesSignature && matchesSync;
  });

  const totalSigned = deliveryNotes.filter(n => n.isSigned).length;
  const totalSynced = deliveryNotes.filter(n => n.syncStatus).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              ארכיון ובקרת תעודות משלוח
            </span>
            <span className="text-xs text-slate-400 font-mono">
              טאב: 'תעודות_משלוח_וחתימות' (Google Sheets Tab 3)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-cyan-400" />
            <span>ניהול תעודות משלוח, חתימות דיגיטליות וסנכרון</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            מעקב אחר תעודות משלוח שהופקו, חתימות לקוח באתר בזמן אמת וסטטוס סנכרון לגיליון הראשי.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onManualSyncSheet}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>סנכרן תעודות לגיליון הראשי</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">סה"כ תעודות משלוח</span>
            <span className="text-2xl font-black font-mono text-white mt-1 block">{deliveryNotes.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">תעודות חתומות ע"י הלקוח</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {totalSigned} / {deliveryNotes.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">מסונכרן ל-Google Sheets</span>
            <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
              {totalSynced} / {deliveryNotes.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש לפי מספר הזמנה, שם לקוח, יעד פריקה, נהג..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {/* Signature Filter */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSignatureFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                signatureFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              הכל
            </button>
            <button
              onClick={() => setSignatureFilter('signed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                signatureFilter === 'signed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-400'
              }`}
            >
              חתום בלבד
            </button>
            <button
              onClick={() => setSignatureFilter('unsigned')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                signatureFilter === 'unsigned' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-400'
              }`}
            >
              ממתין לחתימה
            </button>
          </div>
        </div>
      </div>

      {/* Table 3: Delivery Notes Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="p-3.5">מספר הזמנה (Order_ID)</th>
                <th className="p-3.5">שם לקוח (Customer_Name)</th>
                <th className="p-3.5">יעד פריקה (Destination)</th>
                <th className="p-3.5">נהג משויך</th>
                <th className="p-3.5">פירוט פריטים (Items_Details)</th>
                <th className="p-3.5">קובץ תעודה (PDF)</th>
                <th className="p-3.5">חתימת לקוח</th>
                <th className="p-3.5">סנכרון גיליון (Sync_Status)</th>
                <th className="p-3.5">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredNotes.map((note) => {
                const matchedOrder = orders.find(o => o.orderNumber === note.orderId || o.orderId === note.orderId);

                return (
                  <tr key={note.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-400">
                      #{note.orderId}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {note.customerName}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{note.destination}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{note.driver}</span>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-cyan-300 max-w-xs">
                      <p className="truncate">{note.itemsDetails}</p>
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => setPreviewNote(note)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 font-mono text-[11px] transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>צפה ב-PDF</span>
                      </button>
                    </td>
                    <td className="p-3.5">
                      {note.isSigned ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          {note.customerSignature ? (
                            <img src={note.customerSignature} alt="חתימה" className="h-6 w-14 object-contain bg-white/10 rounded px-1" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span className="font-medium text-[11px]">חתומה</span>
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ממתין לחתימה
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => onToggleSync(note.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 ${
                          note.syncStatus
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{note.syncStatus ? 'מסונכרן לגיליון' : 'לא מסונכרן'}</span>
                      </button>
                    </td>
                    <td className="p-3.5">
                      {matchedOrder && (
                        <button
                          onClick={() => onOpenOrderModal(matchedOrder)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>כרטיס הזמנה</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Modal Preview if selected */}
      {previewNote && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>תעודת משלוח #{previewNote.id} (הזמנה #{previewNote.orderId})</span>
              </h3>
              <button
                onClick={() => setPreviewNote(null)}
                className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded-lg bg-slate-800"
              >
                סגור
              </button>
            </div>

            {/* Document Preview */}
            <div className="bg-white text-slate-950 p-6 rounded-xl space-y-4 border border-slate-300">
              <div className="flex justify-between border-b-2 border-slate-900 pb-2">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">ח. סבן חומרי בניין בע"מ</h4>
                  <p className="text-[10px] text-slate-600">טירה | טל: 09-7938383</p>
                </div>
                <div className="text-left font-mono text-xs">
                  <span className="font-bold text-cyan-900">{previewNote.id}</span>
                  <p className="text-[10px] text-slate-500">{previewNote.createdAt}</p>
                </div>
              </div>

              <div className="text-xs space-y-1 bg-slate-100 p-2.5 rounded">
                <p><strong>לקוח:</strong> {previewNote.customerName}</p>
                <p><strong>יעד פריקה:</strong> {previewNote.destination}</p>
                <p><strong>נהג מוביל:</strong> {previewNote.driver}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs font-mono">
                <span className="text-[10px] text-slate-500 font-sans block mb-1">פירוט פריטים שסופקו:</span>
                <p className="text-slate-800 font-semibold">{previewNote.itemsDetails}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-300">
                <span className="text-[11px] text-slate-600">סטטוס חתימה: {previewNote.isSigned ? 'אושר ונחתם במלואו' : 'ממתין לחתימת אתר'}</span>
                {previewNote.customerSignature && (
                  <div className="border border-slate-300 p-1.5 rounded bg-slate-50">
                    <img src={previewNote.customerSignature} alt="חתימה" className="h-8" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewNote(null)}
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                סגור תצוגה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
