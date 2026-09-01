import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Check, 
  Layers, 
  Truck, 
  MapPin, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { COMMON_SKUS, SABAN_WAREHOUSES, SABAN_DRIVERS } from '../data/mockData';
import { Order, OrderItem, WarehouseId } from '../types';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Order) => Promise<void>;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onAddOrder
}) => {
  const [naturalText, setNaturalText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [orderNumber, setOrderNumber] = useState(`6215${Math.floor(100 + Math.random() * 900)}`);
  const [customerNumber, setCustomerNumber] = useState('612000');
  const [customerName, setCustomerName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [city, setCity] = useState('');
  const [warehouse, setWarehouse] = useState<WarehouseId>('4_HARASH');
  const [isCraneRequired, setIsCraneRequired] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState(SABAN_DRIVERS[0].name);
  const [scheduledTime, setScheduledTime] = useState('08:30');
  const [items, setItems] = useState<OrderItem[]>([
    { sku: '11501', name: 'חול שק גדול (בלה)', quantity: 2, unit: 'בלה', depositType: 'bigBag' }
  ]);

  if (!isOpen) return null;

  // AI Order Parsing with Gemini
  const handleParseNaturalText = async () => {
    if (!naturalText.trim()) return;
    try {
      setIsParsing(true);
      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: naturalText })
      });
      const data = await res.json();
      if (data.parsed) {
        const p = data.parsed;
        if (p.customerName) setCustomerName(p.customerName);
        if (p.siteAddress) setSiteAddress(p.siteAddress);
        if (p.city) setCity(p.city);
        if (p.warehouse === '1_TALMID' || p.warehouse === '4_HARASH') setWarehouse(p.warehouse);
        if (typeof p.isCraneRequired === 'boolean') {
          setIsCraneRequired(p.isCraneRequired);
          setAssignedDriver(p.isCraneRequired ? SABAN_DRIVERS[0].name : SABAN_DRIVERS[1].name);
        }
        if (p.scheduledTime) setScheduledTime(p.scheduledTime);
        if (Array.isArray(p.items) && p.items.length > 0) {
          setItems(p.items);
        }
      }
    } catch (err) {
      console.warn('AI Parsing fallback:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddItem = (skuItem: typeof COMMON_SKUS[0]) => {
    setItems(prev => [
      ...prev,
      {
        sku: skuItem.sku,
        name: skuItem.name,
        quantity: 1,
        unit: skuItem.unit,
        depositType: skuItem.depositType as any
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, quantity: Math.max(1, qty) } : item));
  };

  // Auto calculate deposits
  const calculateDeposits = () => {
    let bigBags = 0;
    let cementBags = 0;
    items.forEach(item => {
      if (item.depositType === 'bigBag' || item.name.includes('בלה') || item.sku === '11501' || item.sku === '11551') {
        bigBags += item.quantity;
      }
      if (item.depositType === 'pallet' || item.sku === '10002' || item.sku === '14075') {
        cementBags += item.quantity;
      }
    });
    const pallets = cementBags >= 20 ? Math.ceil(cementBags / 40) : (cementBags > 0 ? 1 : 0);
    return { bigBags, pallets };
  };

  const { bigBags, pallets } = calculateDeposits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !siteAddress || !city) {
      alert('נא למלא שם לקוח, כתובת ועיר');
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedItems = items.map((it, idx) => 
        `${idx + 1}. 📦 מק"ט: ${it.sku} | ${it.name} | כמות: ${it.quantity} ${it.unit}`
      ).join('\n');

      const fullFormatted = `${formattedItems}\n${items.length + 1}. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: ${bigBags} פקדון\n${items.length + 2}. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: ${pallets} פקדון`;

      const newOrder: Order = {
        orderNumber,
        customerNumber,
        customerName,
        siteAddress,
        city,
        warehouse,
        warehouseName: warehouse === '4_HARASH' ? '🏭 4️⃣ החרש (מלט וחול)' : '🏟️ 1️⃣ התלמיד (גבס)',
        itemsFormatted: fullFormatted,
        itemsList: items,
        bigBagsDeposit: bigBags,
        palletsDeposit: pallets,
        assignedDriver,
        driverId: assignedDriver.includes('חכמת') ? 'hikmat' : 'ali',
        driverPhone: assignedDriver.includes('חכמת') ? '050-886-1080' : '052-771-4490',
        status: 'בסידור עבודה',
        deliveryNote: 'טרם הופקה',
        wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(siteAddress + ' ' + city)}&navigate=yes`,
        totalWeightKg: items.reduce((sum, it) => sum + (it.quantity * (it.unit === 'בלה' ? 1000 : 25)), 0),
        isCraneRequired,
        scheduledTime,
        round: 'סבב 1 (בוקר)'
      };

      await onAddOrder(newOrder);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center">
              <Plus className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">קליטת הזמנה חדשה לסידור העבודה</h3>
              <p className="text-xs text-slate-400">הזרקה ישירה לגיליון דשבורד_הזמנות ומחשבון פקדונות אוטומטי</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Quick Parser Bar */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/30">
          <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            פענוח טקסט חופשי / הודעת וואטסאפ עם נועה AI:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={naturalText}
              onChange={(e) => setNaturalText(e.target.value)}
              placeholder="לדוגמה: 3 בלות חול ו-20 שקי מלט לבן ענבר ברעננה דרך המשי 12 למנוף שעה 08:00"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={handleParseNaturalText}
              disabled={isParsing || !naturalText.trim()}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 whitespace-nowrap shadow-sm disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isParsing ? 'animate-spin' : ''}`} />
              <span>{isParsing ? 'מפענח...' : 'פענח בהזמנה'}</span>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">מספר הזמנה (ERP)</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">מספר לקוח</label>
              <input
                type="text"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">שם לקוח / חברה *</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="למשל: בן ענבר פרויקטים"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">כתובת אתר הבנייה *</label>
              <input
                type="text"
                required
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="למשל: דרך המשי 12"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">עיר / יישוב *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="למשל: רעננה"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">שעת אספקה מבוקשת</label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">מחסן יוצא</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value as WarehouseId)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="4_HARASH">🏭 4️⃣ החרש (מלט, חול, בלוקים)</option>
                <option value="1_TALMID">🏟️ 1️⃣ התלמיד (גבס וצבעים)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">שיבוץ נהג ומשאית</label>
              <select
                value={assignedDriver}
                onChange={(e) => setAssignedDriver(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {SABAN_DRIVERS.map((driver) => (
                  <option key={driver.id} value={driver.name}>
                    {driver.name} — {driver.truckModel} ({driver.truckPlate})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-300">
                <input
                  type="checkbox"
                  checked={isCraneRequired}
                  onChange={(e) => {
                    setIsCraneRequired(e.target.checked);
                    if (e.target.checked) setAssignedDriver(SABAN_DRIVERS[0].name);
                  }}
                  className="rounded border-slate-700 text-cyan-600 focus:ring-0 w-4 h-4 bg-slate-950"
                />
                <span>הובלת מנוף נדרשת (חכמת)</span>
              </label>
            </div>
          </div>

          {/* Quick SKU Catalog Chips */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-2 font-medium">הוספה מהירה מקטלוג סבן:</span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKUS.slice(0, 6).map((s) => (
                <button
                  key={s.sku}
                  type="button"
                  onClick={() => handleAddItem(s)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-cyan-400" />
                  <span>{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>פריטי ההזמנה ({items.length})</span>
              <span className="text-[11px] text-slate-400">מק"ט / כמות / יחידה</span>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
              {items.map((item, idx) => (
                <div key={idx} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {item.sku}
                    </span>
                    <span className="text-slate-200">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-center font-mono text-xs text-white"
                      />
                      <span className="text-slate-400 text-[11px]">{item.unit}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-500 hover:text-red-400 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Auto Deposits Summary */}
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-slate-400">חישוב פקדונות אוטומטי:</span>
              <span className="text-amber-400 font-mono font-semibold">
                שק גדול (60002): {bigBags}
              </span>
              <span className="text-purple-400 font-mono font-semibold">
                משטח סבן (60060): {pallets}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">תואם חוקי סבן</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              id="confirm-add-order-btn"
              className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'מזריק לגיליון...' : 'שמור והזרק ל-Google Sheets'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
