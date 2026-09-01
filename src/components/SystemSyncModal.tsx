import React from 'react';
import { 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Radio, 
  FileSpreadsheet, 
  Folder, 
  BellRing, 
  Bot, 
  ShieldCheck 
} from 'lucide-react';
import { SystemInfo } from '../types';

interface SystemSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInfo: SystemInfo | null;
}

export const SystemSyncModal: React.FC<SystemSyncModalProps> = ({
  isOpen,
  onClose,
  systemInfo
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">מרכז סטטוס וממשקי ליבה — ח. סבן</h3>
              <p className="text-xs text-slate-400">אבחון חיבורים מול Google Cloud, Google Sheets, Drive ו-OneSignal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Main Spreadsheet */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>גיליון סידור נועה AI המרכזי (Live Master)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-semibold border border-emerald-500/30">
                מחובר ומסונכרן 100%
              </span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] break-all">
              Spreadsheet ID: {systemInfo?.spreadsheetId || '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA'}
            </p>
            <a
              href={systemInfo?.sheetUrl || 'https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              <span>פתח גיליון בחלון חדש</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Google Apps Script Endpoint */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Google Apps Script (GAS) Web App Endpoint</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-semibold border border-cyan-500/30">
                Active Proxy
              </span>
            </div>
            <p className="text-slate-400 font-mono text-[11px] break-all">
              {systemInfo?.gasEndpoint || 'https://script.google.com/macros/s/AKfycbynQG7VMfuI1BOR3pOENcgqOLRcd_N--nw7KlAXUmMEA8T5CBKG4gt8l2AS7jrj47fL/exec'}
            </p>
          </div>

          {/* OneSignal PWA Push SDK */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-200">
                <BellRing className="w-4 h-4 text-blue-400" />
                <span>OneSignal Push Notifications (Driver PWA)</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-semibold border border-blue-500/30">
                v16 Web SDK Initialized
              </span>
            </div>
            <p className="text-slate-400 font-mono text-[11px]">
              App ID: {systemInfo?.oneSignalAppId || '8f9c9417-530c-41e2-8a65-850d10758258'}
            </p>
          </div>

          {/* Google Drive Folders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href="https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-400" />
                <span className="font-semibold">תיקיות לקוחות ב-Drive</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href="https://drive.google.com/drive/folders/1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold">תעודות משלוח ב-Drive</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
