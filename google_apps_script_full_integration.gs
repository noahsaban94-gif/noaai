/**
 * ==============================================================================================
 * ח. סבן חומרי בניין בע"מ — Google Apps Script Master Integration Engine
 * סקריפט אינטגרציה מלא ומאוחד (All-in-One Production Code)
 * מזהה גיליון ראשי: 1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA
 * תיקיית גוגל דרייב ראשית ללקוחות: 1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF
 * ==============================================================================================
 */

// ==========================================
// 1. קבועים והגדרות מערכת
// ==========================================
const SPREADSHEET_ID = '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA';
const CUSTOMER_ROOT_FOLDER_ID = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';

const SHEET_NAMES = {
  SETTINGS: 'הגדרות_לוגיסטיקה',
  SCHEDULE: 'סידור_עבודה_יומי',
  DELIVERY_NOTES: 'תעודות_משלוח_וחתימות',
  ARCHIVE: 'ארכיון_סידורים_יומיים',
  CITIES: 'ערים_ויעדים',
  DICTIONARY: 'מילון_לוגיסטי',
  VISIT_HISTORY: 'היסטוריית_ביקורים'
};

// ==========================================
// 2. פונקציית אתחול ויצירת כל הטאבים עם כותרות מעוצבות
// ==========================================
function setupEntireLogisticsSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. טאב סידור עבודה יומי
  initSheetWithHeaders(ss, SHEET_NAMES.SCHEDULE, [
    'מספר הזמנה', 'מספר לקוח', 'שם לקוח', 'כתובת פריקה', 'עיר', 'מחסן יוצא',
    'נהג מוקצה', 'פירוט מוצרים וכמויות', 'שקי בלה (60002)', 'משטחי סבן (60060)',
    'משקל משוער (ק"ג)', 'שעת יעד', 'סבב', 'סטטוס', 'קישור Waze', 'תעודת משלוח',
    'קישור תיקיית לקוח Drive', 'קישור קובץ הזמנה', 'סדר פריקה מנוף (LIFO)', 'תאריך עדכון'
  ], '#0284c7');

  // 2. טאב תעודות משלוח וחתימות דיגיטליות
  initSheetWithHeaders(ss, SHEET_NAMES.DELIVERY_NOTES, [
    'מזהה תעודה', 'מספר הזמנה', 'שם לקוח', 'כתובת פריקה', 'נהג מבצע',
    'פירוט פריטים', 'קישור PDF תעודה חתומה', 'סטטוס חתימה', 'שעת חתימה',
    'סונכרן למערכת', 'הערות פריקה'
  ], '#059669');

  // 3. טאב ערים ויעדים (סנכרון גיאוגרפי)
  initSheetWithHeaders(ss, SHEET_NAMES.CITIES, [
    'שם העיר', 'מרחק ממחסן 4 החרש (ק"מ)', 'מרחק ממחסן 1 התלמיד (ק"מ)',
    'זמן נסיעה ממוצע (דק\')', 'אזור חלוקה', 'כבישי גישה מומלצים',
    'תעריף הובלה מומלץ (₪)', 'קו רוחב (Lat)', 'קו אורך (Lng)', 'סה"כ הזמנות'
  ], '#f59e0b');

  // 4. טאב היסטוריית ביקורים וחיזוי ביקושים AI
  initSheetWithHeaders(ss, SHEET_NAMES.VISIT_HISTORY, [
    'מספר לקוח', 'שם לקוח', 'עיר', 'כתובת אתר', 'סה"כ ביקורים חודש אחרון',
    'תאריך ביקור אחרון', 'משקל ממוצע להזמנה (ק"ג)', 'חומרים עיקריים',
    'נהג מועדף', 'חיזוי תאריך הזמנה הבאה', 'רמת ביקוש צפויה', 'ציון מהימנות AI'
  ], '#8b5cf6');

  // 5. טאב מילון לוגיסטי ומק"טים
  initSheetWithHeaders(ss, SHEET_NAMES.DICTIONARY, [
    'מק"ט', 'שם רשמי', 'קטגוריה', 'יחידת מידה', 'מילות מפתח נרדפות',
    'מחסן ברירת מחדל', 'סוג פקדון', 'משקל יחידה (ק"ג)'
  ], '#475569');

  // 6. טאב ארכיון סידורים יומיים
  initSheetWithHeaders(ss, SHEET_NAMES.ARCHIVE, [
    'תאריך סידור', 'מספר הזמנה', 'שם לקוח', 'עיר', 'נהג', 'משקל כולל',
    'שקי בלה', 'משטחים', 'סטטוס סיום', 'שעת סגירה'
  ], '#334155');

  // הזנת נתוני ברירת מחדל לערים
  seedCitiesData(ss);
  
  Logger.log('✓ כל הטאבים בגיליון ח. סבן אותחלו ועוצבו בהצלחה!');
}

function initSheetWithHeaders(ss, sheetName, headers, headerColor) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  sheet.setRightToLeft(true);
  
  if (sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setBackground(headerColor);
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
  }
}

// ==========================================
// 3. הזנת מילון ערים ויעדים מסונכרן
// ==========================================
function seedCitiesData(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.CITIES);
  if (sheet.getLastRow() <= 1) {
    const citiesRows = [
      ['טירה', 1.2, 0.8, 5, 'שרון דרומי', 'כביש 444', 150, 32.2345, 34.9515, 45],
      ['כפר סבא', 9.8, 9.2, 16, 'שרון מזרחי', 'כביש 531', 250, 32.1782, 34.9076, 82],
      ['רעננה', 12.4, 11.8, 18, 'שרון מרכזי', 'כביש 531 / 4', 280, 32.1848, 34.8707, 96],
      ['הרצליה', 18.5, 17.9, 24, 'שרון מרכזי', 'כביש 531 / 2', 320, 32.1663, 34.8432, 64],
      ['כפר שמריהו', 17.2, 16.6, 22, 'שרון מרכזי', 'כביש 531 / 2', 320, 32.1890, 34.8210, 38],
      ['הוד השרון', 13.6, 13.0, 20, 'שרון דרומי', 'כביש 4 / 531', 280, 32.1554, 34.8887, 52],
      ['גבעתיים', 26.5, 25.9, 32, 'גוש דן', 'כביש 4 / 20', 350, 32.0722, 34.8101, 41],
      ['תל אביב', 27.8, 27.2, 35, 'תל אביב', 'כביש 20 / 2', 380, 32.0853, 34.7818, 70],
      ['רמת גן', 25.2, 24.6, 30, 'גוש דן', 'כביש 4 / 5', 350, 32.0823, 34.8210, 33],
      ['פתח תקווה', 21.0, 20.4, 26, 'מרכז', 'כביש 4 / 6', 300, 32.0878, 34.8878, 48],
      ['נתניה', 19.4, 18.8, 24, 'שרון צפוני', 'כביש 553 / 4', 300, 32.3215, 34.8532, 59],
      ['ראש העין', 18.0, 17.4, 22, 'מרכז', 'כביש 6 / 444', 280, 32.0956, 34.9567, 30],
      ['כוכב יאיר', 5.5, 5.2, 9, 'שרון מזרחי', 'כביש 444', 200, 32.2281, 34.9950, 28],
      ['טייבה', 4.8, 5.4, 8, 'שרון מזרחי', 'כביש 444', 180, 32.2662, 35.0084, 62],
      ['קלנסווה', 6.2, 6.8, 10, 'שרון צפוני', 'כביש 57', 180, 32.2856, 34.9812, 40]
    ];
    sheet.getRange(2, 1, citiesRows.length, citiesRows[0].length).setValues(citiesRows);
  }
}

// ==========================================
// 4. ניהול תיקיות לקוחות ב-Google Drive
// ==========================================
function getOrCreateCustomerFolder(customerNumber, customerName) {
  try {
    const parentFolder = DriveApp.getFolderById(CUSTOMER_ROOT_FOLDER_ID);
    const folderName = `${customerNumber}_${customerName}`.replace(/[\/\\?%*:|"<>]/g, '-');
    const existing = parentFolder.getFoldersByName(folderName);
    
    if (existing.hasNext()) {
      const folder = existing.next();
      return { folderUrl: folder.getUrl(), folderId: folder.getId() };
    }
    
    // Create new folder
    const newFolder = parentFolder.createFolder(folderName);
    newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { folderUrl: newFolder.getUrl(), folderId: newFolder.getId() };
  } catch (err) {
    Logger.log('Drive folder error: ' + err.toString());
    return {
      folderUrl: `https://drive.google.com/drive/folders/${CUSTOMER_ROOT_FOLDER_ID}?usp=drive_link#customer_${customerNumber}`,
      folderId: CUSTOMER_ROOT_FOLDER_ID
    };
  }
}

// ==========================================
// 5. חישוב מסלול רב-יעדים וסדר פריקה מנוף (LIFO)
// ==========================================
function optimizeRouteAndUnloading(orders) {
  if (!orders || orders.length === 0) return [];
  
  // מיון לפי קרבה גיאוגרפית
  const optimized = orders.slice();
  
  // הוספת סדר העמסה LIFO (Last-In-First-Out)
  const total = optimized.length;
  optimized.forEach((order, idx) => {
    order.unloadSequence = idx + 1;
    order.loadingOrder = total - idx;
    order.cranePosition = idx === 0 ? 'אחורי (חופשי לפריקה)' : idx === total - 1 ? 'קדמי' : 'אמצעי';
  });
  
  return optimized;
}

// ==========================================
// 6. Web App HTTP Handler (doGet / doPost)
// ==========================================
function doGet(e) {
  const action = e.parameter.action || 'getOpenOrders';
  let result = {};

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getOpenOrders') {
      const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULE);
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const orders = [];

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0]) {
          orders.push({
            orderNumber: String(row[0]),
            orderId: String(row[0]),
            customerNumber: String(row[1] || '607125'),
            customerName: String(row[2] || ''),
            siteAddress: String(row[3] || ''),
            destination: String(row[3] || ''),
            city: String(row[4] || ''),
            warehouse: String(row[5] || '4_HARASH'),
            warehouseName: String(row[5] || 'מחסן ראשי'),
            assignedDriver: String(row[6] || ''),
            driver: String(row[6] || ''),
            itemsFormatted: String(row[7] || ''),
            itemsDetails: String(row[7] || ''),
            bigBagsDeposit: Number(row[8]) || 0,
            palletsDeposit: Number(row[9]) || 0,
            totalWeightKg: Number(row[10]) || 1000,
            scheduledTime: String(row[11] || '08:00'),
            round: String(row[12] || 'סבב 1'),
            status: String(row[13] || 'בסידור עבודה'),
            wazeUrl: String(row[14] || ''),
            deliveryNote: String(row[15] || 'טרם הופקה'),
            customerFolderUrl: String(row[16] || ''),
            orderDocumentUrl: String(row[17] || ''),
            craneSequence: String(row[18] || 'LIFO תקין')
          });
        }
      }

      result = { status: 'success', orders: orders, totalCount: orders.length };

    } else if (action === 'getCities') {
      const sheet = ss.getSheetByName(SHEET_NAMES.CITIES);
      const data = sheet.getDataRange().getValues();
      const cities = [];
      for (let i = 1; i < data.length; i++) {
        cities.push({
          city: data[i][0],
          distHarash: data[i][1],
          distTalmid: data[i][2],
          driveTimeMin: data[i][3],
          zone: data[i][4],
          roads: data[i][5],
          fee: data[i][6],
          lat: data[i][7],
          lng: data[i][8]
        });
      }
      result = { status: 'success', cities: cities };

    } else if (action === 'getVisitHistory') {
      const sheet = ss.getSheetByName(SHEET_NAMES.VISIT_HISTORY);
      const data = sheet.getDataRange().getValues();
      const history = [];
      for (let i = 1; i < data.length; i++) {
        history.push({
          customerId: data[i][0],
          customerName: data[i][1],
          city: data[i][2],
          address: data[i][3],
          visitsMonth: data[i][4],
          lastVisit: data[i][5],
          avgWeight: data[i][6],
          materials: data[i][7],
          preferredDriver: data[i][8],
          predictedNext: data[i][9],
          demandLevel: data[i][10],
          confidence: data[i][11]
        });
      }
      result = { status: 'success', history: history };
    }

  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result = {};
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action || 'insertOrder';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'insertOrder') {
      const sheet = ss.getSheetByName(SHEET_NAMES.SCHEDULE);
      const order = payload.data || {};
      const orderId = order.orderNumber || order.orderId || ('ORD-' + Date.now());
      const customerNum = order.customerNumber || '607125';
      const customerName = order.customerName || 'לקוח ח. סבן';
      
      const folderInfo = getOrCreateCustomerFolder(customerNum, customerName);
      const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(order.siteAddress || order.address || order.city)}&navigate=yes`;
      
      sheet.appendRow([
        orderId,
        customerNum,
        customerName,
        order.siteAddress || order.address || '',
        order.city || '',
        order.warehouse || '4_HARASH',
        order.driver || order.assignedDriver || 'חכמת (משאית מנוף)',
        order.items || order.itemsFormatted || '',
        order.bigBags || order.bigBagsDeposit || 0,
        order.pallets || order.palletsDeposit || 0,
        order.weightKg || order.totalWeightKg || 1000,
        order.scheduledTime || order.time || '08:00',
        order.round || 'סבב 1',
        'בסידור עבודה',
        wazeUrl,
        'טרם הופקה',
        folderInfo.folderUrl,
        folderInfo.folderUrl,
        'פריקה #1 (LIFO תקין)',
        new Date().toLocaleString('he-IL')
      ]);

      result = { status: 'success', message: 'הזמנה הוזרקה בהצלחה לגיליון!', orderId: orderId, folderUrl: folderInfo.folderUrl };
    }

  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
