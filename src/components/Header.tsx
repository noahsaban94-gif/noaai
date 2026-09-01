import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Layers, 
  FileText, 
  Smartphone, 
  Mail, 
  Bot, 
  RefreshCw, 
  Radio, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  MapPin,
  BookOpen
} from 'lucide-react';
import { SABAN_DRIVERS, SABAN_WAREHOUSES } from '../data/mockData';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenSyncModal: () => void;
  totalOrders: number;
  unreadEmailCount: number;
  deliveryNotesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isSyncing,
  onManualSync,
  onOpenSyncModal,
  totalOrders,
  unreadEmailCount,
  deliveryNotesCount
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      {/* Top Banner with Saban Branding, Clock & Direct Live Sync Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Truck className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                סידור נועה <span className="text-cyan-400 font-mono text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/60">AI</span>
              </h1>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                ח. סבן חומרי בניין בע"מ
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              סנכרון ליבה חי מול גיליון: <span className="font-mono text-cyan-300">1VA9J6n...</span>
            </p>
          </div>
        </div>

        {/* Quick Driver Live Status Badges */}
        <div className="hidden lg:flex items-center gap-2">
          {SABAN_DRIVERS.map((driver) => (
            <div 
              key={driver.id} 
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-medium text-slate-200">{driver.name.split(' ')[0]}</span>
              <span className="text-[10px] text-slate-400 font-mono">({driver.truckPlate})</span>
            </div>
          ))}
        </div>

        {/* Quick Actions & Live Sheet Link */}
        <div className="flex items-center gap-2">
          {/* Live Clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '08:00:00'}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            id="sync-sheet-btn"
            title="רענן סנכרון ישיר מול Google Sheets"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-xs font-medium text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'מסנכרן...' : 'סנכרן גיליון'}</span>
          </button>

          {/* Direct Link to Live Master Sheet */}
          <a
            href="https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit"
            target="_blank"
            rel="noopener noreferrer"
            id="open-google-sheet-link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 text-xs font-medium text-emerald-300 border border-emerald-800/60 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">גיליון מבצעי</span>
          </a>

          {/* System Diagnostics Modal Trigger */}
          <button
            onClick={onOpenSyncModal}
            id="system-diagnostics-btn"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition"
            title="מרכז סטטוס וממשקי מערכת"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar (Direct representation of requested views) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        {/* View A: Noa AI Chat (WhatsApp Clone) */}
        <button
          onClick={() => setActiveTab('noa-chat')}
          id="tab-noa-chat"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'noa-chat'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>צ'אט נועה AI (קליטת הזמנות)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
            WhatsApp Clone
          </span>
        </button>

        {/* View B: Main Dashboard (סידור עבודה יומי) */}
        <button
          onClick={() => setActiveTab('orders')}
          id="tab-orders"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'orders'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>דשבורד וסידור עבודה יומי</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            activeTab === 'orders' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
          }`}>
            {totalOrders}
          </span>
        </button>

        {/* View D: Delivery Notes & Signatures */}
        <button
          onClick={() => setActiveTab('delivery-notes')}
          id="tab-delivery-notes"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'delivery-notes'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>תעודות משלוח וחתימות</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            טאב 3
          </span>
        </button>

        {/* Table 1: Logistics Dictionary */}
        <button
          onClick={() => setActiveTab('dictionary')}
          id="tab-dictionary"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'dictionary'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>מילון לוגיסטי ומק"טים</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
            טאב 1
          </span>
        </button>

        {/* Route Density Map (D3) */}
        <button
          onClick={() => setActiveTab('route-density')}
          id="tab-route-density"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'route-density'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>מפת צפיפות ומסלולים D3</span>
        </button>

        {/* Morning Dispatch */}
        <button
          onClick={() => setActiveTab('morning-dispatch')}
          id="tab-morning-dispatch"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'morning-dispatch'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>דוח בוקר וסבבים</span>
        </button>

        {/* Driver PWA */}
        <button
          onClick={() => setActiveTab('driver-pwa')}
          id="tab-driver-pwa"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'driver-pwa'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>מצב נהג PWA</span>
        </button>

        {/* Email Orders */}
        <button
          onClick={() => setActiveTab('email-orders')}
          id="tab-email-orders"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'email-orders'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>הזמנות קומקס במייל</span>
          {unreadEmailCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
              #{unreadEmailCount}
            </span>
          )}
        </button>

        {/* Reconciliation */}
        <button
          onClick={() => setActiveTab('reconciliation')}
          id="tab-reconciliation"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'reconciliation'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>הצלבה ובקרה</span>
        </button>
      </div>
    </header>
  );
};
