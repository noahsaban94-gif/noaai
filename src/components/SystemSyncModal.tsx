import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Radio, 
  FileSpreadsheet, 
  Folder, 
  BellRing, 
  Bot, 
  ShieldCheck,
  Code2,
  Copy,
  Send,
  RefreshCw,
  Sparkles
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
  const [activeTab, setActiveTab] = useState<'status' | 'code'>('status');
  const [gasCode, setGasCode] = useState<string>('');
  const [loadingCode, setLoadingCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && activeTab === 'code' && !gasCode) {
      fetchGasCode();
    }
  }, [isOpen, activeTab]);

  const fetchGasCode = async () => {
    try {
      setLoadingCode(true);
      const res = await fetch('/api/gas/code');
      const data = await res.json();
      if (data.code) {
        setGasCode(data.code);
      }
    } catch (e) {
      console.warn('Failed to load CODE.JS from server:', e);
    } finally {
      setLoadingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (gasCode) {
      navigator.clipboard.writeText(gasCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleTestMakeWebhook = async () => {
    try {
      setTestingWebhook(true);
      setTestWebhookStatus('משדר פקודת בדיקה ל-Make.com Webhook...');
      const res = await fetch('/api/whatsapp/send-make', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test_connection',
          customMessage: '🚀 בדיקת חיבור תקינה ממרכז השליטה של ח. סבן ל-Make.com Webhook! נועה AI מחוברת ומסונכרנת 100%.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTestWebhookStatus('✓ החיבור ל-Make.com Webhook תקין ופעיל!');
      } else {
        setTestWebhookStatus('⚠️ שגיאה בשידור ל-Webhook: ' + (data.error || 'שגיאה לא ידועה'));
      }
    } catch (err: any) {
      setTestWebhookStatus('⚠️ שגיאת תקשורת: ' + err.message);
    } finally {
      setTestingWebhook(false);
      setTimeout(() => setTestWebhookStatus(null), 7000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">מרכז סנכרון ושחזור תקשורת — ח. סבן</h3>
              <p className="text-xs text-slate-400">אינטגרציית Google Sheets, Apps Script (CODE.JS), Drive ו-Make.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>ממשקי ליבה וסטטוס חיבור</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('code');
              if (!gasCode) fetchGasCode();
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-cyan-500 text-cyan-400 bg-slate-900/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>קוד CODE.JS ל-Google Apps Script</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {testWebhookStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              testWebhookStatus.includes('✓') ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700' : 'bg-amber-950/90 text-amber-300 border border-amber-700'
            }`}>
              <CheckCircle2 className="w-4 h-4" />
              <span>{testWebhookStatus}</span>
            </div>
          )}

          {activeTab === 'status' ? (
            <>
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
                  Spreadsheet ID: {systemInfo?.spreadsheetId || '1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0'}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={systemInfo?.sheetUrl || 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>פתח גיליון בחלון חדש</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">כל 8 הטאבים מעודכנים ומוכנים לשידור</span>
                </div>
              </div>

              {/* Make.com WhatsApp Webhook */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Send className="w-4 h-4 text-emerald-400" />
                    <span>ערוץ שידור WhatsApp (Make.com Webhook)</span>
                  </div>
                  <button
                    onClick={handleTestMakeWebhook}
                    disabled={testingWebhook}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow transition active:scale-95 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingWebhook ? 'animate-spin' : ''}`} />
                    <span>בדוק חיבור חי</span>
                  </button>
                </div>
                <p className="text-slate-400 font-mono text-[11px] break-all">
                  https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr
                </p>
                <p className="text-[11px] text-slate-400">
                  משדר הודעות מעוצבות לחכמת (מנוף), עלי (איסוזו), דוח בוקר לראמי ועדכוני יציאה לאתר ללקוחות.
                </p>
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
                  {systemInfo?.gasEndpoint || 'https://script.google.com/macros/s/AKfycbzHSfCnuuz0oyi5jeIEOjzH-tDAi_qGH4SqOh_M0YVXzDl5lTQYZNw_-GQ26CU2WVgH/exec'}
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
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="font-bold text-white block">קוד ה-Apps Script המלא (CODE.JS)</span>
                  <span className="text-[11px] text-slate-400">העתק והדבק ב-Google Sheets Extensions {'>'} Apps Script</span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'הועתק ללוח!' : 'העתק את כל הקוד'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[380px] overflow-y-auto">
                {loadingCode ? (
                  <div className="text-center py-10 text-slate-400">טוען קוד CODE.JS...</div>
                ) : (
                  <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre leading-relaxed direction-ltr text-left">
                    {gasCode || '// לחץ על כפתור ההעתקה או רענן לטעינה מלאה'}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ח. סבן חומרי בניין (1994) בע"מ — מנוע נועה AI
          </span>
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
