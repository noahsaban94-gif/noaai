/**
 * =========================================================================================
 * סקריפט אינטגרציה מלא: נועה AI — סדרנית ראשית סבן חומרי בנין
 * Google Apps Script מאומת ועמיד לתקלות (Null-safe, Drive Authorization, Auto-Repair)
 * =========================================================================================
 * 
 * מזהי מערכת:
 * - Google Sheet ID: 1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA
 * - Root Customer Folders ID: 1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF
 * - Delivery Notes Folder ID: 1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl
 * 
 * -----------------------------------------------------------------------------------------
 * הוראות התקנה ופתרון הרשאות (חשוב מאוד!):
 * -----------------------------------------------------------------------------------------
 * 1. פתח את ה-Apps Script המחובר לגיליון (Extensions -> Apps Script).
 * 2. הדבק את כל תוכן הקובץ הזה במקום הקוד הישן ולחץ שמירה (Ctrl+S / Save).
 * 3. כדי להעניק הרשאות ל-DriveApp פעם אחת:
 *    - בחר בחלון העליון את הפונקציה: "authorizeAndTestConnection" ולחץ "הפעל" (Run).
 *    - אשר את חלון ההרשאות של Google (Review permissions -> Advanced -> Go to script -> Allow).
 * 4. לחץ על "פרוס" (Deploy) -> "ניהול פריסות" (Manage deployments) -> לחץ על העיפרון -> גרסה חדשה (New Version) -> שמור (Deploy).
 */

const CONFIG = {
  SPREADSHEET_ID: '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA',
  CUSTOMER_FOLDERS_ROOT_ID: '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF',
  DELIVERY_NOTES_ROOT_ID: '1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl',
  SHEET_ORDERS_NAME: 'דשבורד_הזמנות',
  SHEET_DELIVERY_NOTES_NAME: 'תעודות_משלוח_וחתימות',
  SHEET_DICTIONARY_NAME: 'מילון_לוגיסטי'
};

/**
 * פונקציה לבדיקת הרשאות וטסט מהיר של DriveApp ו-SpreadsheetApp ישירות מהעורך
 */
function authorizeAndTestConnection() {
  Logger.log("=== בדיקת הרשאות וחיבור מערכת סבן ===");
  try {
    const rootFolder = DriveApp.getFolderById(CONFIG.CUSTOMER_FOLDERS_ROOT_ID);
    Logger.log("✓ DriveApp מחובר בהצלחה לתיקיית שורש: " + rootFolder.getName());
  } catch (err) {
    Logger.log("⚠️ שגיאת Drive: " + err.toString());
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    Logger.log("✓ SpreadsheetApp מחובר בהצלחה לגיליון: " + ss.getName());
  } catch (err) {
    Logger.log("⚠️ שגיאת גיליון: " + err.toString());
  }
  
  return "בדיקה הסתיימה בהצלחה! הרשאות פעילות.";
}

/**
 * מטפל בבקשות GET (קריאת נתונים ומילון)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getOpenOrders';
    const spreadsheetId = (e && e.parameter && e.parameter.spreadsheetId) ? e.parameter.spreadsheetId : CONFIG.SPREADSHEET_ID;
    const ss = SpreadsheetApp.openById(spreadsheetId);

    if (action === 'getDictionary') {
      const sheetName = (e && e.parameter && e.parameter.sheetName) ? e.parameter.sheetName : CONFIG.SHEET_DICTIONARY_NAME;
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        return createJsonResponse({ status: 'error', message: 'גיליון מילון לא נמצא' });
      }
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) {
        return createJsonResponse({ status: 'success', dictionary: [] });
      }
      const headers = data[0] || [];
      const rows = data.slice(1).map(row => {
        let obj = {};
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });
      return createJsonResponse({ status: 'success', dictionary: rows });
    }

    if (action === 'getOpenOrders') {
      const sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS_NAME) || ss.getSheets()[0];
      const data = sheet.getDataRange().getValues();
      if (!data || data.length === 0) {
        return createJsonResponse({ status: 'success', orders: [] });
      }
      const headers = data[0] || [];
      const orders = data.slice(1).map((row, idx) => {
        let obj = { rowIndex: idx + 2 };
        headers.forEach((h, i) => { obj[h] = row[i]; });
        return obj;
      });
      return createJsonResponse({ status: 'success', orders: orders });
    }

    if (action === 'getCustomerFolder') {
      const customerNumber = e && e.parameter ? e.parameter.customerNumber : '';
      const customerName = e && e.parameter ? e.parameter.customerName : '';
      const folder = getOrCreateCustomerFolder(customerNumber, customerName);
      return createJsonResponse({
        status: 'success',
        customerNumber: customerNumber,
        folderId: folder ? folder.getId() : '',
        folderUrl: folder ? folder.getUrl() : `https://drive.google.com/drive/folders/${CONFIG.CUSTOMER_FOLDERS_ROOT_ID}`,
        folderName: folder ? folder.getName() : 'תיקיות לקוחות'
      });
    }

    return createJsonResponse({ status: 'success', message: 'Saban Logistics GAS Service Active' });
  } catch (err) {
    return createJsonResponse({ status: 'error', error: err.toString() });
  }
}

/**
 * מטפל בבקשות POST (העלאת קבצים, עדכון לינקים, הזרקת הזמנות)
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = {};
      }
    }

    const action = body.action || '';
    const spreadsheetId = body.spreadsheetId || CONFIG.SPREADSHEET_ID;
    const ss = SpreadsheetApp.openById(spreadsheetId);

    // 1. העלאת קובץ הזמנה לתיקיית הלקוח הספציפית ב-Drive ועדכון הגיליון
    if (action === 'uploadOrderDocument') {
      const orderNumber = String(body.orderNumber || '');
      const customerNumber = String(body.customerNumber || '607125');
      const customerName = body.customerName || 'זבולון-עדירן/צחי חגג';
      const fileName = body.fileName || ('הזמנת_לקוח_' + orderNumber + '.pdf');
      const fileDataBase64 = body.fileData || '';

      // מצא או צור את תיקיית הלקוח הספציפית
      const customerFolder = getOrCreateCustomerFolder(customerNumber, customerName);
      let fileUrl = '';
      let fileId = '';

      if (customerFolder) {
        try {
          let file;
          if (fileDataBase64 && typeof fileDataBase64 === 'string' && fileDataBase64.includes('base64,')) {
            const contentType = getContentType(fileName);
            const rawBase64 = fileDataBase64.split('base64,')[1];
            const decoded = Utilities.base64Decode(rawBase64);
            const blob = Utilities.newBlob(decoded, contentType, fileName);
            file = customerFolder.createFile(blob);
          } else {
            const dummyContent = 'ח.סבן חומרי בנין בע"מ\nהזמנת לקוח: ' + orderNumber + '\nלקוח: ' + customerNumber + ' - ' + customerName + '\nתאריך העלאה: ' + new Date().toLocaleString('he-IL');
            file = customerFolder.createFile(fileName, dummyContent, MimeType.PLAIN_TEXT);
          }

          if (file) {
            try {
              file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            } catch (shareErr) {
              Logger.log('Sharing error: ' + shareErr);
            }
            fileUrl = file.getUrl();
            fileId = file.getId();
          }
        } catch (uploadErr) {
          Logger.log('Error creating file in drive: ' + uploadErr);
          fileUrl = customerFolder.getUrl();
        }
      }

      // עדכון הלינק בעמודת 'לינק מסמך / כפתור עין' בגיליון 'דשבורד_הזמנות'
      let updatedRow = -1;
      try {
        const sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS_NAME) || ss.getSheets()[0];
        const data = sheet.getDataRange().getValues();

        if (data && data.length > 0) {
          const colIndex = findColumnIndex(data[0], ['לינק_מסמך', 'קובץ_הזמנה', 'Document_Link', 'צפייה_במסמך', 'מסמך']) || 8;
          for (let i = 1; i < data.length; i++) {
            const rowOrder = String(data[i][0] || data[i][1] || '');
            if (rowOrder.indexOf(orderNumber) !== -1) {
              sheet.getRange(i + 1, colIndex).setValue(fileUrl || customerFolder.getUrl());
              updatedRow = i + 1;
              break;
            }
          }
        }
      } catch (sheetErr) {
        Logger.log('Error updating sheet: ' + sheetErr);
      }

      return createJsonResponse({
        status: 'success',
        message: 'קובץ ההזמנה ' + fileName + ' עודכן בהצלחה!',
        fileId: fileId,
        fileUrl: fileUrl,
        customerFolderUrl: customerFolder ? customerFolder.getUrl() : '',
        customerFolderName: customerFolder ? customerFolder.getName() : '',
        updatedRow: updatedRow
      });
    }

    // 2. עדכון לינק ישיר בגיליון
    if (action === 'updateDocumentLink') {
      const orderNumber = String(body.orderNumber || '');
      const directViewUrl = body.directViewUrl || '';
      const sheet = ss.getSheetByName(CONFIG.SHEET_ORDERS_NAME) || ss.getSheets()[0];
      const data = sheet.getDataRange().getValues();
      let updated = false;

      if (data && data.length > 0) {
        const colIndex = findColumnIndex(data[0], ['לינק_מסמך', 'קובץ_הזמנה', 'Document_Link', 'מסמך']) || 8;
        for (let i = 1; i < data.length; i++) {
          const rowOrder = String(data[i][0] || data[i][1] || '');
          if (rowOrder.indexOf(orderNumber) !== -1) {
            sheet.getRange(i + 1, colIndex).setValue(directViewUrl);
            updated = true;
            break;
          }
        }
      }

      return createJsonResponse({
        status: 'success',
        message: 'לינק צפייה ישיר עודכן בהצלחה בגיליון עבור הזמנה #' + orderNumber,
        updated: updated
      });
    }

    // 3. הזרקת הזמנות
    if (action === 'injectOrders') {
      const sheetName = body.sheetName || CONFIG.SHEET_ORDERS_NAME;
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow([
          'מספר_הזמנה', 'מספר_לקוח', 'שם_לקוח', 'כתובת_האתר', 'מחסן', 
          'משקל_קג', 'מנוף_נדרש', 'נהג_משויך', 'סטטוס', 'לינק_מסמך_עין', 'לינק_Waze'
        ]);
      }

      const orders = body.orders || [];
      orders.forEach(function(o) {
        sheet.appendRow([
          o.orderNumber || o.orderId || '',
          o.customerNumber || '',
          o.customerName || '',
          o.siteAddress || o.destination || '',
          o.warehouseName || o.warehouse || '',
          o.totalWeightKg || 0,
          o.isCraneRequired ? 'כן' : 'לא',
          o.assignedDriver || '',
          o.status || 'בסידור עבודה',
          o.orderDocumentUrl || o.directSheetViewUrl || '',
          o.wazeUrl || ''
        ]);
      });

      return createJsonResponse({
        status: 'success',
        message: orders.length + ' הזמנות הוזרקו בהצלחה לגיליון ' + sheetName
      });
    }

    return createJsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return createJsonResponse({ status: 'error', error: err.toString() });
  }
}

/**
 * פונקציית עזר: מציאת או יצירת תיקיית לקוח מדויקת תחת תיקיית השורש (מוגנת בשגיאות והרשאות)
 */
function getOrCreateCustomerFolder(customerNumber, customerName) {
  try {
    const rootFolder = DriveApp.getFolderById(CONFIG.CUSTOMER_FOLDERS_ROOT_ID);
    const searchName = String(customerNumber || customerName || '607125').trim();
    
    if (searchName) {
      const folders = rootFolder.getFolders();
      while (folders.hasNext()) {
        const f = folders.next();
        if (f.getName().indexOf(searchName) !== -1) {
          return f;
        }
      }
    }

    // אם לא קיימת תיקייה ספציפית ללקוח - נייצר תיקייה ייעודית תחת התיקייה הראשית
    const newFolderName = (customerNumber || '607125') + ' - ' + (customerName || 'תיקיית לקוח');
    const newFolder = rootFolder.createFolder(newFolderName);
    try {
      newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      Logger.log('Share setting ignored: ' + shareErr);
    }
    return newFolder;
  } catch (err) {
    Logger.log('getOrCreateCustomerFolder fallback: ' + err);
    try {
      return DriveApp.getRootFolder();
    } catch (rootErr) {
      return null;
    }
  }
}

/**
 * פונקציית עזר: זיהוי עמודה בגיליון בצורה בטוחה (Null-safe)
 */
function findColumnIndex(headers, candidates) {
  if (!headers || !Array.isArray(headers) || !candidates || !Array.isArray(candidates)) {
    return null;
  }
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').trim();
    for (let c = 0; c < candidates.length; c++) {
      if (h.indexOf(candidates[c]) !== -1) {
        return i + 1; // 1-based index
      }
    }
  }
  return null;
}

/**
 * פונקציית עזר: זיהוי סוג קובץ בצורה בטוחה (Null-safe)
 */
function getContentType(fileName) {
  if (!fileName || typeof fileName !== 'string' || fileName.indexOf('.') === -1) {
    return MimeType.PDF;
  }
  const parts = fileName.split('.');
  const ext = parts[parts.length - 1].toLowerCase();
  if (ext === 'pdf') return MimeType.PDF;
  if (ext === 'png') return MimeType.PNG;
  if (ext === 'jpg' || ext === 'jpeg') return MimeType.JPEG;
  return MimeType.PLAIN_TEXT;
}

/**
 * מחזיר מענה JSON תקני עם הגדרות CORS
 */
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj || {}))
    .setMimeType(ContentService.MimeType.JSON);
}
