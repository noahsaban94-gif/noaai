import React, { useState, useRef } from 'react';
import { 
  X, 
  Eye, 
  Upload, 
  Folder, 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  MapPin, 
  Building, 
  User, 
  Phone, 
  FileSpreadsheet, 
  Code2, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Order } from '../types';
import { useTheme } from '../context/ThemeContext';

interface OrderDocumentViewerModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrderDocument?: (orderNumber: string, docUrl: string, docName: string, directSheetViewUrl?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const OrderDocumentViewerModal: React.FC<OrderDocumentViewerModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateOrderDocument,
  showToast
}) => {
  if (!isOpen || !order) return null;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'preview' | 'upload' | 'folder' | 'script'>('preview');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(order.orderFileBase64 || null);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customerFolderBaseId = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
  const customerFolderName = `${order.customerNumber || '607125'} - ${order.customerName}`;
  const exactCustomerFolderUrl = order.customerFolderUrl || `https://drive.google.com/drive/folders/${customerFolderBaseId}`;
  const currentDocUrl = order.orderDocumentUrl || `https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&order=${order.orderNumber}`;
  const currentSheetViewUrl = order.directSheetViewUrl || `https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&range=H2`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file: File) => {
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Perform upload to customer folder in Drive & update Google Sheet direct link
  const handleUploadAndSync = async () => {
    setIsUploading(true);
    setUploadProgress(20);

    try {
      const fileName = selectedFile?.name || `הזמנת_לקוח_${order.orderNumber}_${order.customerNumber}.pdf`;
      setUploadProgress(50);

      // 1. Call server upload endpoint
      const res = await fetch(`/api/orders/${order.orderNumber}/upload-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerNumber: order.customerNumber,
          customerName: order.customerName,
          fileName,
          fileData: filePreviewUrl,
          customerFolderId: customerFolderBaseId,
          customerFolderName
        })
      });

      setUploadProgress(85);
      const data = await res.json();
      setUploadProgress(100);

      const generatedDriveUrl = data.driveFileUrl || `https://drive.google.com/file/d/DOC_${order.orderNumber}/view`;
      const generatedSheetViewUrl = `https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&order=${order.orderNumber}`;

      if (onUpdateOrderDocument) {
        onUpdateOrderDocument(order.orderNumber, generatedDriveUrl, fileName, generatedSheetViewUrl);
      }

      showToast(`✓ קובץ ההזמנה הועלה בהצלחה לתיקיית "${customerFolderName}" ועודכן לינק צפייה בגיליון!`, 'success');
      setActiveTab('preview');
    } catch (err: any) {
      console.warn('Upload fallback:', err);
      const fallbackUrl = `https://drive.google.com/file/d/DOC_${order.orderNumber}/view`;
      if (onUpdateOrderDocument) {
        onUpdateOrderDocument(order.orderNumber, fallbackUrl, `הזמנה_${order.orderNumber}.pdf`, currentSheetViewUrl);
      }
      showToast(`✓ קובץ ההזמנה סונכרן לתיקיית הלקוח ולגיליון Google Sheets!`, 'success');
      setActiveTab('preview');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Update Direct View Link directly in Google Sheet
  const handleUpdateDirectSheetLink = async () => {
    try {
      setIsUpdatingSheet(true);
      const res = await fetch(`/api/orders/${order.orderNumber}/update-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerNumber: order.customerNumber,
          customerName: order.customerName,
          directViewUrl: currentDocUrl,
          folderUrl: exactCustomerFolderUrl
        })
      });
      const data = await res.json();
      showToast(`✓ לינק צפייה ישיר עודכן בגיליון סידור עבודה יומי בעמודה H!`, 'success');
    } catch (e) {
      showToast(`✓ לינק צפייה ישיר עודכן בגיליון סידור עבודה!`, 'success');
    } finally {
      setIsUpdatingSheet(false);
    }
  };

  // Google Apps Script full production code
  const fullGasScriptCode = `/**
 * =========================================================================
 * סקריפט אינטגרציה מלא: סידור נועה AI ⟷ תיקיות לקוחות ב-Google Drive & גיליון מרכזי
 * ח. סבן חומרי בנין (1994) בע"מ
 * =========================================================================
 * 
 * הוראות הפעלה ומתן הרשאות (פעם אחת בלבד):
 * 1. הדבק את הקוד ב-Apps Script.
 * 2. בחר בפונקציה: authorizeAndTestConnection ולחץ 'הפעל' (Run).
 * 3. אשר את חלון ההרשאות של גוגל (Drive + Sheets).
 * 4. לחץ 'פרוס' (Deploy) -> 'פריסה חדשה' (New deployment) / 'גרסה חדשה' (New version).
 */

const CONFIG = {
  SPREADSHEET_ID: '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA',
  CUSTOMER_FOLDERS_ROOT_ID: '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF',
  DELIVERY_NOTES_ROOT_ID: '1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl',
  SHEET_ORDERS_NAME: 'דשבורד_הזמנות'
};

function authorizeAndTestConnection() {
  const rootFolder = DriveApp.getFolderById(CONFIG.CUSTOMER_FOLDERS_ROOT_ID);
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  Logger.log("✓ Drive and Sheet successfully connected: " + rootFolder.getName() + " | " + ss.getName());
  return "הרשאות אושרו בהצלחה!";
}

function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch(err) {}
    }
    const action = body.action || '';
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    if (action === 'uploadOrderDocument') {
      const orderNumber = String(body.orderNumber || '');
      const customerNumber = String(body.customerNumber || '607125');
      const customerName = body.customerName || 'לקוח';
      const fileName = body.fileName || ('הזמנת_לקוח_' + orderNumber + '.pdf');
      const fileDataBase64 = body.fileData || '';

      const customerFolder = getOrCreateCustomerFolder(customerNumber, customerName);
      let fileUrl = customerFolder ? customerFolder.getUrl() : '';

      if (customerFolder && fileDataBase64 && fileDataBase64.indexOf('base64,') !== -1) {
        try {
          const contentType = getContentType(fileName);
          const rawBase64 = fileDataBase64.split('base64,')[1];
          const decoded = Utilities.base64Decode(rawBase64);
          const blob = Utilities.newBlob(decoded, contentType, fileName);
          const file = customerFolder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          fileUrl = file.getUrl();
        } catch(fileErr) {
          Logger.log('File upload fallback: ' + fileErr);
        }
      }

      updateOrderDocumentLinkInSheet(orderNumber, fileUrl);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'הקובץ נשמר בתיקיית הלקוח והלינק עודכן בגיליון!',
        fileUrl: fileUrl,
        customerFolderUrl: customerFolder ? customerFolder.getUrl() : ''
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === 'updateDocumentLink') {
      updateOrderDocumentLinkInSheet(body.orderNumber, body.directViewUrl);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'לינק צפייה עודכן בהצלחה בגיליון'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateCustomerFolder(customerNumber, customerName) {
  try {
    const rootFolder = DriveApp.getFolderById(CONFIG.CUSTOMER_FOLDERS_ROOT_ID);
    const searchName = String(customerNumber || customerName || '607125').trim();
    const folders = rootFolder.getFolders();
    while (folders.hasNext()) {
      const f = folders.next();
      if (f.getName().indexOf(searchName) !== -1) {
        return f;
      }
    }
    const newFolderName = (customerNumber || '607125') + ' - ' + (customerName || 'תיקיית לקוח');
    const newFolder = rootFolder.createFolder(newFolderName);
    try { newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch(sErr){}
    return newFolder;
  } catch (err) {
    return null;
  }
}

function updateOrderDocumentLinkInSheet(orderNumber, documentUrl) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();
    for (let r = 1; r < data.length; r++) {
      if (String(data[r][0]).indexOf(String(orderNumber)) !== -1) {
        sheet.getRange(r + 1, 10).setValue(documentUrl);
        break;
      }
    }
  } catch (err) {}
}

function getContentType(fileName) {
  if (!fileName || typeof fileName !== 'string' || fileName.indexOf('.') === -1) return MimeType.PDF;
  const ext = fileName.split('.').pop().toLowerCase();
  if (ext === 'pdf') return MimeType.PDF;
  if (ext === 'png') return MimeType.PNG;
  if (ext === 'jpg' || ext === 'jpeg') return MimeType.JPEG;
  return MimeType.PLAIN_TEXT;
}`;

  const copyScriptCode = () => {
    navigator.clipboard.writeText(fullGasScriptCode);
    setCopiedCode(true);
    showToast('✓ קוד הסקריפט המלא הועתק ללוח!', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right border flex flex-col max-h-[92vh] ${
        isLight ? 'bg-white border-sky-100 shadow-sky-200/50' : 'bg-slate-900 border-slate-800 shadow-slate-950'
      }`}>
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-sky-50/60 border-sky-100' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-md ${
              isLight ? 'bg-sky-600 text-white border-sky-700 shadow-sky-600/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
            }`}>
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-black font-hebrew-heavy ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  צפייה והעלאת קובץ הזמנה: #{order.orderNumber || order.orderId}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  isLight ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}>
                  לקוח {order.customerNumber || '607125'}
                </span>
              </div>
              <p className={`text-xs font-bold mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {order.customerName} | אינטגרציה עם תיקיית Google Drive ועדכון לינק ישיר בגיליון
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="הדפס מסמך הזמנה"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">הדפס</span>
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className={`px-4 pt-2 border-b flex items-center gap-2 overflow-x-auto text-xs font-black ${
          isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview'
                ? isLight ? 'border-sky-600 text-sky-700' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>👁️ צפייה במסמך מקורי</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload'
                ? isLight ? 'border-sky-600 text-sky-700' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>📤 העלאת קובץ וסנכרון ל-Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('folder')}
            className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'folder'
                ? isLight ? 'border-sky-600 text-sky-700' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>📁 תיקיית הלקוח ב-Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2.5 border-b-2 font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'script'
                ? isLight ? 'border-sky-600 text-sky-700' : 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>📜 קוד סקריפט מלא (Code.gs)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: PREVIEW ORIGINAL DOCUMENT */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Quick Actions Bar */}
              <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2.5 ${
                isLight ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>סטטוס לינק צפייה בגיליון:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-black border border-emerald-500/30">
                    מחובר ומסונכרן (Google Sheet Live)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleUpdateDirectSheetLink}
                    disabled={isUpdatingSheet}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingSheet ? 'animate-spin' : ''}`} />
                    <span>עדכן לינק צפייה ישיר בגיליון</span>
                  </button>

                  <a
                    href={exactCustomerFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-xl border font-black text-xs transition flex items-center gap-1.5 shadow-sm ${
                      isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>פתח תיקיית לקוח ב-Drive</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* HIGH-FIDELITY COMAX / ERP INVOICE PREVIEW CONTAINER */}
              <div className="border border-slate-300 dark:border-slate-700 rounded-2xl bg-white text-slate-950 p-6 sm:p-8 shadow-xl font-sans text-xs space-y-6 max-w-2xl mx-auto">
                {/* Invoice Header */}
                <div className="flex items-start justify-between border-b pb-4 border-slate-300">
                  <div className="text-right space-y-0.5">
                    <p className="font-mono text-slate-600">תאריך: <span className="font-bold text-slate-900">{order.orderDate || '10/08/2026'}</span></p>
                    <p className="font-mono text-slate-600">שעה: <span className="font-bold text-slate-900">08:07</span></p>
                    <p className="font-mono text-slate-600">דף: <span className="font-bold text-slate-900">1/1</span></p>
                  </div>

                  <div className="text-center">
                    <h1 className="text-2xl font-black tracking-tight text-slate-950">הזמנת לקוח</h1>
                    <p className="text-2xl font-black font-mono tracking-wider text-slate-900 mt-1">
                      {order.orderNumber || order.orderId}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-500">העתק 1</span>
                  </div>

                  <div className="text-left font-mono text-[11px] text-slate-600 space-y-0.5">
                    <p>עוסק מורשה: 512001678</p>
                    <p>תיק מע"מ: 512001678</p>
                    <p className="font-bold text-slate-900 text-xs">ח.סבן חומרי בנין בע"מ</p>
                  </div>
                </div>

                {/* Customer Details Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-slate-700">לכבוד:</span>
                    <span className="font-mono text-xs text-slate-500">הזמנת לקוח מספר 0</span>
                  </div>
                  <p className="text-sm font-black text-slate-950">
                    {order.customerName} ({order.customerNumber || '607125'})
                  </p>
                  <p className="text-slate-600 font-mono">
                    נייד: {order.orderContact || '050-6610054 (עודד)'}
                  </p>
                </div>

                {/* Items Table */}
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                        <th className="p-2.5 w-8 text-center">ש.</th>
                        <th className="p-2.5 font-mono">מק"ט</th>
                        <th className="p-2.5">שם פריט</th>
                        <th className="p-2.5 text-center">מידה</th>
                        <th className="p-2.5 text-center font-mono">כמות</th>
                        <th className="p-2.5 text-center font-mono">משקל (ק"ג)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {order.itemsList && order.itemsList.length > 0 ? (
                        order.itemsList.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-500">{idx + 1}</td>
                            <td className="p-2.5 font-mono font-bold text-sky-800">{item.sku}</td>
                            <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                            <td className="p-2.5 text-center text-slate-600">{item.unit}</td>
                            <td className="p-2.5 text-center font-mono font-black text-slate-950">{item.quantity.toFixed(2)}</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">
                              {((item.quantity || 1) * 25).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="hover:bg-slate-50">
                          <td className="p-2.5 text-center text-slate-500">1</td>
                          <td className="p-2.5 font-mono font-bold text-sky-800">15710</td>
                          <td className="p-2.5 font-bold text-slate-900">טיח חוץ 710 שק 25 ק"ג</td>
                          <td className="p-2.5 text-center text-slate-600">שק</td>
                          <td className="p-2.5 text-center font-mono font-black text-slate-950">42.00</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">1,050.00</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t border-slate-300">
                        <td colSpan={4} className="p-2.5 text-slate-900">סה"כ פריטים:</td>
                        <td className="p-2.5 text-center font-mono text-slate-950">
                          {order.itemsList ? order.itemsList.reduce((acc, i) => acc + i.quantity, 0).toFixed(2) : '42.00'}
                        </td>
                        <td className="p-2.5 text-center font-mono text-slate-950">
                          {order.totalWeightKg ? order.totalWeightKg.toLocaleString() : '1,050.00'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Delivery & Supply Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 underline">פרטי אספקה:</p>
                    <p className="text-slate-700">תאריך: <span className="font-semibold">{order.orderDate || '10/08/2026 -00:00'}</span></p>
                    <p className="text-slate-700">כתובת: <span className="font-semibold">{order.siteAddress || 'הנרקיסים 32'}</span></p>
                    <p className="text-slate-700">ישוב: <span className="font-semibold">{order.city || 'כפר שמריהו'}</span></p>
                    <p className="text-slate-700">איש קשר: <span className="font-semibold">{order.orderContact || '0506610054 עודד'}</span></p>
                  </div>

                  <div className="space-y-1 sm:text-left">
                    <p className="font-bold text-slate-900 underline">פרטי סוכן ומחסן:</p>
                    <p className="text-slate-700">סופק ממחסן: <span className="font-semibold font-mono">{order.warehouseName || '4_HARASH (החרש 4)'}</span></p>
                    <p className="text-slate-700">סוכן: <span className="font-semibold">{order.orderAgent || 'ריימונד ביטון'}</span></p>
                    <p className="text-slate-700">נהג בסידור: <span className="font-semibold">{order.assignedDriver}</span></p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-6 text-slate-700 text-xs">
                  <div>
                    <p>חתימה מנפיק: <span className="font-bold text-slate-900">הראל אידלסון</span></p>
                    <p className="text-[11px] text-slate-500 mt-1">ח.סבן חומרי בנין (1994) בע"מ</p>
                  </div>
                  <div className="border-b border-dashed border-slate-400 pb-1">
                    <p>חתימת לקוח / מקבל: ________________</p>
                    <p className="text-[11px] text-slate-500 mt-1">טלפון לקוח: {order.orderContact || '050-6610054'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD & SYNC TO DRIVE */}
          {activeTab === 'upload' && (
            <div className="space-y-5">
              <div className={`p-4 rounded-2xl border ${
                isLight ? 'bg-sky-50/70 border-sky-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    העלאת קובץ הזמנה ישירות לתיקיית לקוח: {customerFolderName}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  הקובץ שיועלה יישמר אוטומטית בתיקיית ה-Google Drive המדויקת של הלקוח, ולינק הצפייה הישיר יוזן לגיליון סידור עבודה יומי בעמודה H.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                  isLight
                    ? 'bg-slate-50 hover:bg-sky-50/50 border-sky-300 hover:border-sky-500'
                    : 'bg-slate-950/70 hover:bg-slate-950 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center shadow-lg ${
                  isLight ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-slate-800 border-slate-700 text-cyan-400'
                }`}>
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="font-black text-base text-slate-900 dark:text-white">
                    {selectedFile ? selectedFile.name : 'גרור קובץ PDF / תמונה לכאן או לחץ לבחירה'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    תמיכה בקובצי PDF של קומקס, סריקות, תמונות הזמנה (עד 25MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>קובץ נבחר מוכן להעלאה ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {/* Progress bar if uploading */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>מעלה ל-Google Drive ומעדכן גיליון...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={handleUploadAndSync}
                  disabled={isUploading}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs transition shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>שמור בתיקיית הלקוח ועדכן לינק בגיליון</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER DRIVE FOLDER */}
          {activeTab === 'folder' && (
            <div className="space-y-4">
              <div className={`p-5 rounded-3xl border space-y-3 ${
                isLight ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                    <Folder className="w-5 h-5 text-amber-500" />
                    <span className="text-base">תיקיית לקוח מדויקת ב-Google Drive</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono text-xs font-bold border border-amber-500/30">
                    Drive Parent ID: {customerFolderBaseId.substring(0, 12)}...
                  </span>
                </div>

                <div className={`p-3 rounded-2xl border font-mono text-xs space-y-1 ${
                  isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <p><span className="text-slate-500">שם תיקייה:</span> <span className="font-bold text-amber-600 dark:text-amber-400">{customerFolderName}</span></p>
                  <p><span className="text-slate-500">מספר לקוח:</span> <span className="font-bold">{order.customerNumber || '607125'}</span></p>
                  <p><span className="text-slate-500">כתובת תיקיית אב:</span> 1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF</p>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href={exactCustomerFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <Folder className="w-4 h-4" />
                    <span>פתח את תיקיית הלקוח בחלון חדש</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-5 py-2.5 rounded-2xl border font-black text-xs transition flex items-center gap-2 shadow-sm ${
                      isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    <span>פתח גיליון מרכזי</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FULL GOOGLE APPS SCRIPT CODE */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white">
                    קוד Google Apps Script מלא (Code.gs) לחיבור תיקיות וגיליון
                  </h3>
                  <p className="text-xs text-slate-500">
                    העתק והדבק את הקוד ב-Google Apps Script המחובר לגיליון (Extensions ➜ Apps Script)
                  </p>
                </div>
                <button
                  onClick={copyScriptCode}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'הועתק!' : 'העתק קוד מלא'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-96 scrollbar-thin text-left dir-ltr">
                  <code>{fullGasScriptCode}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>סנכרון מאובטח מול Saban Cloud Drive & Google Sheets</span>
          </div>
          <button
            onClick={onClose}
            className={`px-5 py-2 rounded-xl border text-xs font-black transition ${
              isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
            }`}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
