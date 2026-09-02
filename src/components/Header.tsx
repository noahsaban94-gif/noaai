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
  BookOpen,
  Sun,
  Moon,
  Camera
} from 'lucide-react';
import { SABAN_DRIVERS, SABAN_WAREHOUSES } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenSyncModal: () => void;
  onOpenScanner?: () => void;
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
  onOpenScanner,
  totalOrders,
  unreadEmailCount,
  deliveryNotesCount
}) => {
  const { theme, toggleTheme } = useTheme();
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

  const isLight = theme === 'light';

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-200 shadow-md ${
      isLight 
        ? 'bg-white/95 border-sky-100 text-slate-900' 
        : 'bg-[#0B0F17]/95 border-slate-800/80 text-slate-100'
    }`}>
      {/* Top Banner with Saban Branding, Clock, Theme Switch & Direct Live Sync Indicators */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-amber-500 p-0.5 shadow-md flex items-center justify-center">
            <div className={`w-full h-full rounded-[14px] flex items-center justify-center ${isLight ? 'bg-white' : 'bg-slate-950'}`}>
              <Truck className="w-5 h-5 text-sky-600 dark:text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-extrabold tracking-tight flex items-center gap-1.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                סידור נועה <span className="text-xs px-2 py-0.5 rounded-full font-black bg-sky-500/15 text-sky-600 dark:bg-cyan-950/80 dark:text-cyan-400 border border-sky-500/30">AI 🌹</span>
              </h1>
              <span className={`text-xs font-bold hidden sm:inline-block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                ח. סבן חומרי בניין בע"מ
              </span>
            </div>
            <p className={`text-[11px] font-medium flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              סנכרון ליבה חי מול גיליון: <span className="font-mono font-bold text-sky-600 dark:text-cyan-300">1fy79UJ...</span>
            </p>
          </div>
        </div>

        {/* Quick Driver Live Status Badges */}
        <div className="hidden lg:flex items-center gap-2">
          {SABAN_DRIVERS.map((driver) => (
            <div 
              key={driver.id} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isLight 
                  ? 'bg-sky-50/70 border-sky-200/80 text-slate-800' 
                  : 'bg-slate-900/80 border-slate-800 text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold">{driver.name.split(' ')[0]}</span>
              <span className="text-[11px] opacity-70 font-mono font-medium">({driver.truckPlate})</span>
            </div>
          ))}
        </div>

        {/* Quick Actions, Theme Toggle & Live Sheet Link */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button: Dark / Light Mode */}
          <button
            onClick={toggleTheme}
            id="theme-toggle-btn"
            title={isLight ? 'מעבר למצב כהה (Dark Mode)' : 'מעבר למצב בהיר (Light Mode)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
              isLight
                ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200 shadow-sky-100'
                : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-slate-700 shadow-slate-900'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline">מצב כהה</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">מצב בהיר</span>
              </>
            )}
          </button>

          {/* Live Clock */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
            isLight ? 'bg-slate-100/90 border-slate-200 text-slate-700' : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}>
            <Clock className="w-3.5 h-3.5 text-sky-500 dark:text-cyan-400" />
            <span>{currentTime || '08:00:00'}</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onManualSync}
            disabled={isSyncing}
            id="sync-sheet-btn"
            title="רענן סנכרון ישיר מול Google Sheets"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-500 dark:text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isSyncing ? 'מסנכרן...' : 'סנכרן גיליון'}</span>
          </button>

          {/* Direct Link to Live Master Sheet */}
          <a
            href="https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit"
            target="_blank"
            rel="noopener noreferrer"
            id="open-google-sheet-link"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition shadow-sm ${
              isLight
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border-emerald-800/60'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">גיליון חי</span>
          </a>

          {/* Camera Scanner Quick Trigger */}
          {onOpenScanner && (
            <button
              onClick={onOpenScanner}
              id="camera-scanner-quick-btn"
              title="סורק מצלמה: סרוק חתימות נייר והצמד לתעודות משלוח"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition shadow-sm ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-950/70 hover:bg-emerald-900/70 text-emerald-300 border-emerald-800/80 shadow-emerald-950/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">סורק מצלמה</span>
            </button>
          )}

          {/* System Diagnostics Modal Trigger */}
          <button
            onClick={onOpenSyncModal}
            id="system-diagnostics-btn"
            className={`p-2 rounded-xl border transition ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
            }`}
            title="מרכז סטטוס וממשקי מערכת"
          >
            <Radio className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1.5 overflow-x-auto pb-2.5 pt-1 scrollbar-none">
        {/* View A: Noa AI Chat */}
        <button
          onClick={() => setActiveTab('noa-chat')}
          id="tab-noa-chat"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'noa-chat'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>צ'אט נועה AI (קליטת הזמנות)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'noa-chat'
              ? 'bg-emerald-700 text-white'
              : isLight
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            WhatsApp
          </span>
        </button>

        {/* View B: Main Dashboard (סידור עבודה יומי) */}
        <button
          onClick={() => setActiveTab('orders')}
          id="tab-orders"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'orders'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>דשבורד וסידור עבודה יומי</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'orders'
              ? isLight ? 'bg-sky-700 text-white' : 'bg-slate-950 text-cyan-400'
              : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
          }`}>
            {totalOrders}
          </span>
        </button>

        {/* View D: Delivery Notes & Signatures */}
        <button
          onClick={() => setActiveTab('delivery-notes')}
          id="tab-delivery-notes"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'delivery-notes'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>תעודות משלוח וחתימות</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isLight ? 'bg-sky-100 text-sky-800' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
          }`}>
            טאב 3
          </span>
        </button>

        {/* Table 1: Logistics Dictionary */}
        <button
          onClick={() => setActiveTab('dictionary')}
          id="tab-dictionary"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'dictionary'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>מילון לוגיסטי ומק"טים</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
          }`}>
            טאב 1
          </span>
        </button>

        {/* Route Density Map (D3) */}
        <button
          onClick={() => setActiveTab('route-density')}
          id="tab-route-density"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'route-density'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>מפת צפיפות D3</span>
        </button>

        {/* Morning Dispatch */}
        <button
          onClick={() => setActiveTab('morning-dispatch')}
          id="tab-morning-dispatch"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'morning-dispatch'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'driver-pwa'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'email-orders'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>הזמנות קומקס במייל</span>
          {unreadEmailCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              #{unreadEmailCount}
            </span>
          )}
        </button>

        {/* Reconciliation */}
        <button
          onClick={() => setActiveTab('reconciliation')}
          id="tab-reconciliation"
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
            activeTab === 'reconciliation'
              ? isLight
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : isLight
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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

