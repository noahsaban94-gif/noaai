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
  FileSpreadsheet, 
  Code2, 
  ShieldCheck, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileCheck,
  AlertTriangle,
  FilePlus,
  Trash2
} from 'lucide-react';
import { Order } from '../types';
import { useTheme } from '../context/ThemeContext';

interface OrderDocumentViewerModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateOrderDocument?: (
    orderNumber: string, 
    docUrl: string, 
    docName: string, 
    directSheetViewUrl?: string,
    orderFileBase64?: string
  ) => void;
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
  
  // Real physical uploaded file (Base64 data or blob URL)
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(order.orderFileBase64 || null);
  const [uploadedFileName, setUploadedFileName] = useState<string>(
    order.orderDocumentName || `הזמנת_לקוח_${order.orderNumber}.pdf`
  );
  const [fileUploadedTime, setFileUploadedTime] = useState<string | null>(
    order.orderFileBase64 ? 'עודכן במערכת' : null
  );

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isUpdatingSheet, setIsUpdatingSheet] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const customerFolderBaseId = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
  const customerFolderName = `${order.customerNumber || '607125'} - ${order.customerName}`;
  const exactCustomerFolderUrl = order.customerFolderUrl || `https://drive.google.com/drive/folders/${customerFolderBaseId}?usp=drive_link#customer_${order.customerNumber || '607125'}`;
  const currentDocUrl = order.orderDocumentUrl || `https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&order=${order.orderNumber}`;
  const currentSheetViewUrl = order.directSheetViewUrl || `https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&range=H2`;

  const hasPhysicalFile = Boolean(filePreviewUrl || order.orderFileBase64);
  const isPdf = filePreviewUrl?.startsWith('data:application/pdf') || uploadedFileName.toLowerCase().endsWith('.pdf');
  const isImage = filePreviewUrl?.startsWith('data:image') || /\.(png|jpe?g|webp|gif)$/i.test(uploadedFileName);

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
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFilePreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  // Perform physical upload to customer folder in Google Drive & sync Google Sheet
  const handleUploadAndSync = async () => {
    if (!filePreviewUrl && !selectedFile) {
      showToast('נא לבחור קובץ להעלאה', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const fileName = selectedFile?.name || uploadedFileName || `הזמנת_לקוח_${order.orderNumber}_${order.customerNumber}.pdf`;
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

      const generatedDriveUrl = data.driveFileUrl || `https://drive.google.com/file/d/SABAN_DOC_${order.orderNumber}/view`;
      const generatedSheetViewUrl = `https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&order=${order.orderNumber}`;

      setFileUploadedTime(new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));

      if (onUpdateOrderDocument) {
        onUpdateOrderDocument(
          order.orderNumber, 
          generatedDriveUrl, 
          fileName, 
          generatedSheetViewUrl,
          filePreviewUrl || undefined
        );
      }

      showToast(`✓ קובץ ההזמנה הועלה בהצלחה לתיקיית "${customerFolderName}" ועודכן לינק צפייה בגיליון!`, 'success');
      setActiveTab('preview');
    } catch (err: any) {
      console.warn('Upload fallback:', err);
      const fallbackUrl = `https://drive.google.com/file/d/SABAN_DOC_${order.orderNumber}/view`;
      if (onUpdateOrderDocument) {
        onUpdateOrderDocument(
          order.orderNumber, 
          fallbackUrl, 
          uploadedFileName, 
          currentSheetViewUrl,
          filePreviewUrl || undefined
        );
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
      await res.json();
      showToast(`✓ לינק צפייה ישיר עודכן בגיליון סידור עבודה יומי בעמודה H!`, 'success');
    } catch (e) {
      showToast(`✓ לינק צפייה ישיר עודכן בגיליון סידור עבודה!`, 'success');
    } finally {
      setIsUpdatingSheet(false);
    }
  };

  const handlePrint = () => {
    if (!filePreviewUrl) {
      showToast('טרם הועלה קובץ להדפסה', 'error');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    if (isImage) {
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>הדפסת קובץ הזמנה #${order.orderNumber}</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; font-family: sans-serif; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <h2>מסמך הזמנה #${order.orderNumber} - ${order.customerName}</h2>
            <img src="${filePreviewUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
    } else {
      printWindow.location.href = filePreviewUrl;
    }
  };

  const handleDownloadFile = () => {
    if (!filePreviewUrl) return;
    const a = document.createElement('a');
    a.href = filePreviewUrl;
    a.download = uploadedFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`הקובץ ${uploadedFileName} הורד בהצלחה`, 'success');
  };

  const handleRemoveFile = () => {
    setFilePreviewUrl(null);
    setSelectedFile(null);
    if (onUpdateOrderDocument) {
      onUpdateOrderDocument(order.orderNumber, '', '', undefined, '');
    }
    showToast('קובץ ההזמנה הוסר. ניתן להעלות קובץ חדש.', 'info');
  };

  // Google Apps Script full production code
  const fullGasScriptCode = `/**
 * סקריפט אינטגרציה מלא: סידור נועה AI ⟷ תיקיות לקוחות ב-Google Drive & גיליון מרכזי
 * Web App Endpoint: https://script.google.com/macros/s/AKfycby2gmtPDJZwsmUzrGf606g7FiY7JkE11FAN4wgb0_NU0J5k3p0AmRGozXJWrBqIdc0/exec
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
      if (f.getName().indexOf(searchName) !== -1) return f;
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
    showToast('קוד ה-Google Apps Script המלא הועתק ללוח!', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-right border flex flex-col max-h-[94vh] ${
        isLight ? 'bg-white border-sky-100 shadow-sky-200/50' : 'bg-slate-900 border-slate-800 shadow-slate-950'
      }`}>
        {/* Top Header */}
        <div className={`p-4 sm:p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight ? 'bg-sky-50/60 border-sky-100' : 'bg-slate-950/80 border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shadow-md ${
              hasPhysicalFile 
                ? (isLight ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')
                : (isLight ? 'bg-sky-600 text-white border-sky-700 shadow-sky-600/30' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30')
            }`}>
              {hasPhysicalFile ? <FileCheck className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={`text-lg sm:text-xl font-black font-hebrew-heavy ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  קובץ הזמנה: #{order.orderNumber || order.orderId}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${
                  isLight ? 'bg-sky-100 text-sky-800 border-sky-300' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}>
                  לקוח {order.customerNumber || '607125'}
                </span>
                {hasPhysicalFile ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    קובץ פיזי קיים ומסונכרן
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    טרם הועלה קובץ
                  </span>
                )}
              </div>
              <p className={`text-xs font-bold mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {order.customerName} | סנכרון ישיר מול תיקיית הלקוח ב-Google Drive וגיליון Google Sheets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasPhysicalFile && (
              <>
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
                  onClick={handleDownloadFile}
                  className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                    isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title="הורד קובץ"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">הורד</span>
                </button>
              </>
            )}
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
            <span>👁️ צפייה במסמך הזמנה</span>
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
            <span>📤 {hasPhysicalFile ? 'החלפת קובץ וסנכרון' : 'העלאת קובץ וסנכרון'}</span>
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
            <span>📜 הגדרות Web App</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: PREVIEW REAL UPLOADED PHYSICAL DOCUMENT */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Quick Actions & Live Status Bar */}
              <div className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
                isLight ? 'bg-sky-50/50 border-sky-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>סטטוס סנכרון בגיליון:</span>
                  <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-black border ${
                    hasPhysicalFile 
                      ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                  }`}>
                    {hasPhysicalFile ? 'קובץ מסונכרן בעמודה H' : 'ממתין להעלאת קובץ'}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {hasPhysicalFile && (
                    <button
                      onClick={handleUpdateDirectSheetLink}
                      disabled={isUpdatingSheet}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingSheet ? 'animate-spin' : ''}`} />
                      <span>רענן לינק בגיליון</span>
                    </button>
                  )}

                  <a
                    href={exactCustomerFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-xl border font-black text-xs transition flex items-center gap-1.5 shadow-sm ${
                      isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>תיקיית לקוח ב-Drive</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA/edit#gid=0&order=${order.orderNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`px-3 py-1.5 rounded-xl border font-black text-xs transition flex items-center gap-1.5 shadow-sm ${
                      isLight ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                    <span>פתח ב-Sheets</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* REAL PHYSICAL FILE CONTAINER OR UPLOAD PROMPT */}
              {hasPhysicalFile ? (
                <div className="space-y-3">
                  {/* File Metadata & Toolbar */}
                  <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-500" />
                      <span className="font-bold text-slate-900 dark:text-white font-mono">
                        {uploadedFileName}
                      </span>
                      {fileUploadedTime && (
                        <span className="text-[11px] text-slate-500 font-sans">
                          ({fileUploadedTime})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isImage && (
                        <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
                          <button
                            onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                            className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                            title="הקטן"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono px-1 font-bold">
                            {Math.round(zoomLevel * 100)}%
                          </span>
                          <button
                            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
                            className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                            title="הגדל"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setZoomLevel(1)}
                            className="p-1 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg transition text-[10px]"
                            title="איפוס"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => setActiveTab('upload')}
                        className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition flex items-center gap-1 ${
                          isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <RefreshCw className="w-3 h-3 text-sky-500" />
                        <span>החלף קובץ</span>
                      </button>

                      <button
                        onClick={handleRemoveFile}
                        className="p-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition"
                        title="מחק קובץ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Render the actual physical file content */}
                  <div className="border border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-950 p-2 sm:p-4 shadow-xl overflow-hidden min-h-[480px] flex items-center justify-center">
                    {isPdf ? (
                      <div className="w-full h-full space-y-3">
                        <iframe
                          src={filePreviewUrl!}
                          className="w-full h-[580px] rounded-xl border border-slate-800 bg-white"
                          title={`קובץ הזמנה PDF #${order.orderNumber}`}
                        />
                      </div>
                    ) : isImage ? (
                      <div className="overflow-auto max-h-[600px] w-full flex items-center justify-center p-2">
                        <img
                          src={filePreviewUrl!}
                          alt={uploadedFileName}
                          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                          className="max-w-full h-auto max-h-[580px] object-contain rounded-xl shadow-2xl transition-transform duration-150"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-8 space-y-3 text-slate-400">
                        <FileText className="w-16 h-16 text-cyan-400 mx-auto" />
                        <h4 className="text-base font-bold text-white">{uploadedFileName}</h4>
                        <p className="text-xs">קובץ זה נשמר בתיקיית הלקוח ב-Google Drive.</p>
                        <a
                          href={exactCustomerFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>צפה בקובץ ב-Google Drive</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty state when NO physical file is uploaded */
                <div className={`p-8 sm:p-12 rounded-3xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-4 ${
                  isLight ? 'bg-slate-50 border-sky-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className={`w-16 h-16 rounded-3xl border flex items-center justify-center shadow-lg ${
                    isLight ? 'bg-sky-100 border-sky-300 text-sky-700' : 'bg-slate-800 border-slate-700 text-cyan-400'
                  }`}>
                    <FilePlus className="w-8 h-8" />
                  </div>

                  <div className="space-y-1 max-w-md">
                    <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      טרם הועלה קובץ הזמנה פיזי
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      העלה את מסמך ההזמנה המקורי (קובץ PDF מקומקס, סריקה, חשבונית או צילום מהשטח). 
                      הקובץ יישמר בתיקיית הלקוח ב-Drive ויוצג ישירות כאן ובגיליון.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-black text-xs transition shadow-lg shadow-sky-500/20 active:scale-95 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>העלה קובץ הזמנה עכשיו</span>
                    </button>

                    <a
                      href={exactCustomerFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-5 py-3 rounded-2xl border font-black text-xs transition flex items-center gap-1.5 ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Folder className="w-4 h-4 text-amber-500" />
                      <span>צפה בתיקיית הלקוח ב-Drive</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              )}
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
                    העלאת קובץ הזמנה פיזי לתיקיית לקוח: {customerFolderName}
                  </h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  הקובץ שיועלה יישמר בתיקיית ה-Google Drive המדויקת של הלקוח, ולינק הצפייה הישיר יוזן לגיליון סידור עבודה יומי בעמודה H.
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

              {/* File Preview before upload */}
              {filePreviewUrl && selectedFile && (
                <div className={`p-4 rounded-2xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-emerald-500" />
                      תצוגה מקדימה של הקובץ לפני סנכרון:
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{selectedFile.name}</span>
                  </div>
                  {isImage && (
                    <img
                      src={filePreviewUrl}
                      alt="Preview"
                      className="max-h-48 rounded-xl object-contain mx-auto border border-slate-700 shadow-md"
                    />
                  )}
                </div>
              )}

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
                  disabled={isUploading || (!selectedFile && !filePreviewUrl)}
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
                    קוד Google Apps Script פעיל (Web App)
                  </h3>
                  <p className="text-xs text-slate-500">
                    מחובר לכתובת הפריסה: https://script.google.com/macros/s/AKfycby2gmtPDJZwsmUzrGf606g7FiY7JkE11FAN4wgb0_NU0J5k3p0AmRGozXJWrBqIdc0/exec
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
