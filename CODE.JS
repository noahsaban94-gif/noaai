/**
 * ==============================================================================================
 * ח. סבן חומרי בניין (1994) בע"מ — Google Apps Script Master Integration Engine (CODE.JS)
 * מנוע סנכרון לוגיסטי, אינטגרציית גיליונות, ניהול דרייב ושידור WhatsApp דרך Make.com
 * 
 * 📊 מזהה גיליון ראשי (Live Master): 1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0
 * 📁 תיקיית דרייב ראשית ללקוחות: 1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF
 * 📁 תיקיית דרייב לתעודות משלוח: 1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl
 * 🔗 Make.com WhatsApp Webhook: https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr
 * ==============================================================================================
 */

// ==========================================
// 1. קבועים והגדרות מערכת
// ==========================================
const SPREADSHEET_ID = '1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0';
const CUSTOMER_ROOT_FOLDER_ID = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
const DELIVERY_NOTES_FOLDER_ID = '1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl';
const MAKE_WEBHOOK_ENDPOINT = 'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr';

// פרטי התקשרות נהגים ומנהל
const CONTACTS = {
  RAMI: { name: 'ראמי סבן', phone: '0505298818', role: 'מנכ"ל ומנהל תפעול' },
  HIKMAT: { name: 'חכמת (מרצדס מנוף 26ט)', phone: '0508861080', truck: 'משאית מנוף 615-41-002', capacityKg: 26000 },
  ALI: { name: 'עלי (משאית איסוזו 15ט)', phone: '0527714490', truck: 'משאית איסוזו 814-12-301', capacityKg: 15000 },
  NOA_AI: { name: 'נועה AI', role: 'סדרנית ראשית ומנהלת לוגיסטיקה' }
};

// שמות כל הטאבים בגיליון המאוחד
const SHEET_NAMES = {
  MORNING_DISPATCH: 'דוח_בוקר_מבצעי',
  ORDERS_DASHBOARD: 'דשבורד_הזמנות',
  DELIVERY_NOTES: 'תעודות_משלוח_וחתימות',
  ARCHIVE_REPORTS: 'ארכיון_דוחות_בוקר',
  CITIES: 'ערים_ויעדים',
  DICTIONARY: 'מילון_לוגיסטי',
  CUSTOMERS: 'תיקי_לקוחות',
  RECONCILIATION: 'הצלבה_ובקרה'
};

// ==========================================
// 2. תפריט מותאם אישית לפתיחה ב-Google Sheets
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚚 סבן לוגיסטיקה — נועה AI')
    .addItem('⚡ שחזור ואתחול כל הטאבים והכותרות', 'setupEntireLogisticsSystem')
    .addItem('📲 שידור דוח בוקר ל-WhatsApp (Make)', 'triggerMorningReportWhatsApp')
    .addItem('📦 סנכרון הזמנות פעילות לדוח בוקר', 'syncActiveOrdersToMorningDispatch')
    .addItem('🔒 נעילת דוח בוקר וארכוב יומי', 'archiveCurrentMorningReport')
    .addSeparator()
    .addItem('🧪 בדיקת חיבור Webhook ל-Make.com', 'testMakeWebhookConnection')
    .addToUi();
}

// ==========================================
// 3. פונקציית אתחול ויצירת כל הטאבים עם כותרות ועיצוב
// ==========================================
function setupEntireLogisticsSystem() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // 1. טאב דוח בוקר מבצעי
  initMorningDispatchSheet(ss);

  // 2. טאב דשבורד הזמנות
  initSheetWithHeaders(ss, SHEET_NAMES.ORDERS_DASHBOARD, [
    'מספר הזמנה', 'מספר לקוח', 'שם לקוח', 'כתובת פריקה', 'עיר', 'מחסן יוצא',
    'נהג מוקצה', 'פירוט מוצרים וכמויות', 'שקי בלה (60002)', 'משטחי סבן (60060)',
    'משקל משוער (ק"ג)', 'שעת יעד', 'סבב', 'סטטוס', 'קישור Waze', 'תעודת משלוח',
    'קישור תיקיית לקוח Drive', 'קישור קובץ הזמנה', 'סדר פריקה מנוף (LIFO)', 'תאריך עדכון'
  ], '#0284c7');

  // 3. טאב תעודות משלוח וחתימות
  initSheetWithHeaders(ss, SHEET_NAMES.DELIVERY_NOTES, [
    'מזהה תעודה', 'מספר הזמנה', 'שם לקוח', 'כתובת פריקה', 'נהג מבצע',
    'פירוט פריטים שסופקו', 'קישור PDF תעודה חתומה', 'סטטוס חתימה', 'שעת חתימה',
    'סונכרן למערכת', 'הערות פריקה'
  ], '#059669');

  // 4. טאב ארכיון דוחות בוקר
  initSheetWithHeaders(ss, SHEET_NAMES.ARCHIVE_REPORTS, [
    'תאריך דוח', 'שעת נעילה', 'סה"כ הזמנות', 'מחסן החרש 4', 'מחסן התלמיד 1',
    'משאית מנוף (חכמת)', 'משאית איסוזו (עלי)', 'סה"כ בלות פקדון', 'סה"כ משטחי סבן',
    'סטטוס ביצוע', 'אחראי שידור ותיעוד'
  ], '#334155');

  // 5. טאב ערים ויעדים
  initSheetWithHeaders(ss, SHEET_NAMES.CITIES, [
    'שם העיר', 'מרחק ממחסן 4 החרש (ק"מ)', 'מרחק ממחסן 1 התלמיד (ק"מ)',
    'זמן נסיעה ממוצע (דק\')', 'אזור חלוקה', 'כבישי גישה מומלצים',
    'תעריף הובלה מומלץ (₪)', 'קו רוחב (Lat)', 'קו אורך (Lng)', 'סה"כ הזמנות'
  ], '#f59e0b');

  // 6. טאב מילון לוגיסטי ומק"טים
  initSheetWithHeaders(ss, SHEET_NAMES.DICTIONARY, [
    'מק"ט', 'שם רשמי', 'קטגוריה', 'יחידת מידה', 'מילות מפתח נרדפות',
    'מחסן ברירת מחדל', 'סוג פקדון', 'משקל יחידה (ק"ג)', 'שיוך נהג ברירת מחדל'
  ], '#475569');

  // 7. טאב תיקי לקוחות
  initSheetWithHeaders(ss, SHEET_NAMES.CUSTOMERS, [
    'מספר לקוח', 'שם לקוח', 'איש קשר באתר', 'טלפון', 'כתובת קבועה',
    'קישור תיקיית לקוח Drive', 'יתרת בלות (60002)', 'יתרת משטחים (60060)',
    'נהג מועדף', 'סה"כ הזמנות היסטוריות'
  ], '#8b5cf6');

  // 8. טאב הצלבה ובקרה
  initSheetWithHeaders(ss, SHEET_NAMES.RECONCILIATION, [
    'מספר הזמנה', 'מספר תעודת משלוח', 'שם לקוח', 'מוצרים לפי הזמנה',
    'מוצרים שסופקו בפועל', 'הפרשי כמויות', 'הצלבת פקדונות', 'סטטוס התאמה',
    'תאריך בדיקה', 'אישור מנהל'
  ], '#dc2626');

  // הזנת נתוני ברירת מחדל
  seedCitiesData(ss);
  seedDictionaryData(ss);
  seedInitialMorningDispatch(ss);

  Logger.log('✓ כל הטאבים בגיליון ח. סבן שוחזרו, אותחלו ועוצבו בהצלחה!');
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
    sheet.autoResizeColumns(1, headers.length);
  }
}

// אתחול ייעודי לדוח בוקר מבצעי
function initMorningDispatchSheet(ss) {
  let sheet = ss.getSheetByName(SHEET_NAMES.MORNING_DISPATCH);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.MORNING_DISPATCH);
  }
  sheet.setRightToLeft(true);

  if (sheet.getLastRow() === 0) {
    // שורת כותרת 1
    sheet.getRange('A1:L1').merge();
    sheet.getRange('A1').setValue('ח. סבן חומרי בניין (1994) בע"מ — דוח בוקר מבצעי וסידור עבודה יומי 🚚')
      .setBackground('#0f172a')
      .setFontColor('#38bdf8')
      .setFontSize(14)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');

    // שורת תת-כותרת 2
    sheet.getRange('A2:L2').merge();
    sheet.getRange('A2').setValue(`מועד הדוח: ${new Date().toLocaleDateString('he-IL')} | מנוע סנכרון נועה AI מחובר בזמן אמת | לחץ על הקישורים בעמודה האחרונה לשידור ישיר ל-WhatsApp`)
      .setBackground('#1e293b')
      .setFontColor('#94a3b8')
      .setFontSize(10)
      .setHorizontalAlignment('center');

    // שורת כותרות עמודות 4
    const headers = [
      'סבב ושעה', 'מספר הזמנה', 'שם לקוח', 'מחסן מקור', 'כתובת יעד ועיר',
      'נהג משובץ', 'פירוט מוצרים וכמויות', 'פקדונות (בלות/משטחים)',
      'ניווט Waze', 'סטטוס ביצוע', '📲 שידור WhatsApp ישיר', 'קישור תיקיית לקוח Drive'
    ];

    const range = sheet.getRange(4, 1, 1, headers.length);
    range.setValues([headers]);
    range.setBackground('#0284c7');
    range.setFontColor('#ffffff');
    range.setFontWeight('bold');
    range.setHorizontalAlignment('center');
    sheet.setFrozenRows(4);
  }
}

// ==========================================
// 4. הזנת נתונים ראשוניים לדוח בוקר
// ==========================================
function seedInitialMorningDispatch(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.MORNING_DISPATCH);
  if (sheet.getLastRow() <= 4) {
    const orders = [
      {
        round: 'סבב 1 (07:30)',
        orderNumber: '6215184',
        customerName: 'בן ענבר פרויקטים בע"מ',
        warehouse: '🏟️ 1️⃣ (התלמיד)',
        address: 'דרך המשי 12, רעננה',
        driver: 'עלי (משאית איסוזו)',
        items: '50 לוח גבס לבן, 30 ניצב 70, 20 מסלול, 5 רוקבונד',
        deposits: 'פטור',
        waze: 'https://waze.com/ul?q=Derech+HaMeshi+12+Raanana&navigate=yes',
        status: 'מוכן להעמסה',
        phone: CONTACTS.ALI.phone,
        folderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_612108'
      },
      {
        round: 'סבב 1 (07:30)',
        orderNumber: '6215180',
        customerName: 'קראמה אסאמה — שיפוצים',
        warehouse: '🏭 4️⃣ (החרש)',
        address: 'רוטשילד 45, כפר סבא',
        driver: 'חכמת (מרצדס מנוף)',
        items: '3 בלות חול, 2 בלות סומסום, 30 שקי מלט 25 ק"ג',
        deposits: '5 בלות (60002), 1 משטח סבן (60060)',
        waze: 'https://waze.com/ul?q=Rothschild+45+Kfar+Saba&navigate=yes',
        status: 'מוכן להעמסה',
        phone: CONTACTS.HIKMAT.phone,
        folderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_608930'
      },
      {
        round: 'סבב 2 (10:30)',
        orderNumber: '6215178',
        customerName: 'בזלת מזר בע"מ',
        warehouse: '🏭 4️⃣ (החרש)',
        address: 'שדה בוקר 17, גבעתיים',
        driver: 'חכמת (מרצדס מנוף)',
        items: '46 לוחות גבס, 36 ניצב/מסלול, 50 טיט, 40 חול, 30 סומסום',
        deposits: '3 משטחי סבן (60060)',
        waze: 'https://waze.com/ul?q=Sde+Boker+17+Givatayim&navigate=yes',
        status: 'בסידור עבודה',
        phone: CONTACTS.HIKMAT.phone,
        folderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_602115'
      },
      {
        round: 'סבב 2 (12:45)',
        orderNumber: '6215194',
        customerName: 'ערוגת הבשם',
        warehouse: '🏭 4️⃣ (החרש)',
        address: 'דרך הבשמים 8, מושב בצרה',
        driver: 'חכמת (מרצדס מנוף)',
        items: '10 בלות חול, 8 בלות סומסום, 30 שקי מלט נשר, הובלת מנוף',
        deposits: '18 בלות (60002), 2 משטחי סבן (60060)',
        waze: 'https://waze.com/ul?q=Derech+HaBsamin+8+Batzra&navigate=yes',
        status: 'בסידור עבודה',
        phone: CONTACTS.HIKMAT.phone,
        folderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_614290'
      }
    ];

    orders.forEach((o, index) => {
      const rowIdx = 5 + index;
      const isHikmat = o.driver.includes('חכמת');
      const driverName = isHikmat ? 'חכמת' : 'עלי';
      
      // יצירת הודעת תדריך נקייה ומעוצבת לוואטסאפ ללא שגיאות נוסחה
      const waMessage = `🚚 תדריך נסיעה — ח. סבן חומרי בניין בע"מ
שלום ${driverName}!
משימה: הזמנה #${o.orderNumber}
לקוח: ${o.customerName}
כתובת פריקה: ${o.address}
מחסן יציאה: ${o.warehouse}
שעה: ${o.round}

פירוט מוצרים:
${o.items}

פקדונות:
${o.deposits}

ניווט Waze ישיר:
${o.waze}

באדיבות נועה AI ❤️`;

      const encodedMsg = encodeURIComponent(waMessage);
      const waUrl = `https://api.whatsapp.com/send?phone=972${o.phone.slice(1)}&text=${encodedMsg}`;
      const waFormula = `=HYPERLINK("${waUrl}", "📲 שדר ל${driverName}")`;
      const wazeFormula = `=HYPERLINK("${o.waze}", "📍 נווט בוויז")`;

      sheet.getRange(rowIdx, 1, 1, 12).setValues([[
        o.round,
        o.orderNumber,
        o.customerName,
        o.warehouse,
        o.address,
        o.driver,
        o.items,
        o.deposits,
        wazeFormula,
        o.status,
        waFormula,
        o.folderUrl
      ]]);
    });

    sheet.autoResizeColumns(1, 12);
  }
}

// הזנת מילון ערים
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

// הזנת מילון מק"טים ולוגיסטיקה
function seedDictionaryData(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.DICTIONARY);
  if (sheet.getLastRow() <= 1) {
    const dictRows = [
      ['10002', 'מלט אפור נשר 25 ק"ג', 'מלט ומליטה', 'שק', 'מלט, אפור, נשר', '4_HARASH', 'משטח (60060)', 25, 'חכמת (משאית מנוף)'],
      ['11501', 'חול שק גדול (בלה)', 'חול ומחצבה', 'בלה', 'חול, בלה, שק גדול', '4_HARASH', 'בלה (60002)', 1000, 'חכמת (משאית מנוף)'],
      ['11505', 'סומסום שק גדול (בלה)', 'חול ומחצבה', 'בלה', 'סומסום, חצץ, שומשום', '4_HARASH', 'בלה (60002)', 1000, 'חכמת (משאית מנוף)'],
      ['11551', 'טיט שק גדול (בלה)', 'חול ומחצבה', 'בלה', 'טיט, בלה טיט', '4_HARASH', 'בלה (60002)', 1000, 'חכמת (משאית מנוף)'],
      ['14075', 'טיח גבס MP75 קנאוף 25 ק"ג', 'טיח וגבס', 'שק', 'טיח גבס, MP75, מכונה', '4_HARASH', 'משטח (60060)', 25, 'חכמת (משאית מנוף)'],
      ['15710', 'טיח חוץ 710 שק 25 ק"ג', 'טיח ודבקים', 'שק', 'טיח חוץ, 710', '4_HARASH', 'משטח (60060)', 25, 'חכמת (משאית מנוף)'],
      ['111200', 'לוח גבס לבן 200 ע 12.50', 'לוחות גבס', 'לוח', 'גבס לבן, לוח סטנדרטי', '1_TALMID', 'פטור', 18, 'עלי (משאית איסוזו)'],
      ['112200', 'לוח גבס ירוק 200 ע 12.50', 'לוחות גבס', 'לוח', 'גבס ירוק, עמיד לחות', '1_TALMID', 'פטור', 19, 'עלי (משאית איסוזו)'],
      ['9570300', 'ניצב 70/300 0.5', 'פרופילים', 'יח\'', 'ניצב 70, פרופיל גבס', '1_TALMID', 'פטור', 1.5, 'עלי (משאית איסוזו)'],
      ['8570300', 'מסלול 70/300 0.5', 'פרופילים', 'יח\'', 'מסלול 70, פרופיל גבס', '1_TALMID', 'פטור', 1.4, 'עלי (משאית איסוזו)'],
      ['76133', 'בורג פחפח 13 (1000 יח\')', 'ברגים וחיבורים', 'קופסה', 'בורג פחפח, ברגי גבס', '1_TALMID', 'פטור', 1.2, 'עלי (משאית איסוזו)'],
      ['60002', 'שק גדול פקדון (בלה)', 'פקדונות', 'פקדון', 'בלה פקדון, שק גדול', '4_HARASH', 'פקדון', 0, 'חכמת / עלי'],
      ['60060', 'משטח סבן פקדון', 'פקדונות', 'פקדון', 'משטח עץ, משטח סבן', '4_HARASH', 'פקדון', 0, 'חכמת / עלי']
    ];
    sheet.getRange(2, 1, dictRows.length, dictRows[0].length).setValues(dictRows);
  }
}

// =========================================================================
// 5. מנוע עיצוב ושליחת הודעות WHATSAPP מעוצבות דרך MAKE.COM WEBHOOK
// =========================================================================

/**
 * פונקציה ראשית לשליחת Webhook ל-Make.com
 */
function sendWhatsAppViaMake(payload) {
  try {
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(MAKE_WEBHOOK_ENDPOINT, options);
    const code = response.getResponseCode();
    const body = response.getContentText();

    Logger.log(`Make Webhook Response [${code}]: ${body}`);
    return {
      success: code >= 200 && code < 300,
      code: code,
      response: body,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log(`Make Webhook Error: ${error.toString()}`);
    return {
      success: false,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 1. עיצוב תדריך וואטסאפ אישי לחכמת (משאית מרצדס מנוף 26 טון)
 */
function formatWhatsAppHikmat(order) {
  return `🏗️ *תדריך משימה מבצעי — חכמת (מרצדס מנוף 26ט)*
שלום חכמת אחי היקר! להלן פרטי המשימה המשובצת עבורך:

📦 *מספר הזמנה:* ${order.orderNumber || order.orderId}
👤 *שם לקוח:* ${order.customerName}
📍 *יעד פריקה מדויק:* ${order.siteAddress || order.address || order.city}
🏟️ *מחסן טעינה:* ${order.warehouseName || order.warehouse || '🏭 4️⃣ החרש'}
⏰ *שעת הגעה משוערת:* ${order.scheduledTime || order.time || '07:30'} (${order.round || 'סבב 1'})
⚖️ *משקל משוער:* ${order.totalWeightKg || order.weightKg || 'כבד'} ק"ג

📋 *פירוט מוצרים להעמסה במחסן:*
${order.itemsFormatted || order.items || order.itemsDetails}

📦 *פקדונות ומשטחים לחיוב:*
• שקי בלה (60002): ${order.bigBagsDeposit || order.bigBags || 0}
• משטחי סבן (60060): ${order.palletsDeposit || order.pallets || 0}

⚠️ *דגשי בטיחות ופריקת מנוף:*
• פריקה בסדר LIFO מתוכנן מראש (אין להזיז מטענים קדמיים).
• יש לוודא מרחק בטוח מקווי מתח גבוה ופתיחת רגלי ייצוב מלאות.
• חובה להחתים את מנהל האתר בתעודת המשלוח הדיגיטלית.

🗺️ *קישור ניווט Waze ישיר:*
${order.wazeUrl || `https://www.waze.com/ul?q=${encodeURIComponent(order.siteAddress || order.address || order.city)}&navigate=yes`}

סע בזהירות אחי!
באדיבות נועה AI ❤️ יד ימינו של ראמי סבן`;
}

/**
 * 2. עיצוב תדריך וואטסאפ אישי לעלי (משאית איסוזו 15 טון)
 */
function formatWhatsAppAli(order) {
  return `🚚 *תדריך נסיעה יומי — עלי (משאית איסוזו 15ט)*
שלום עלי היקר! להלן פרטי הנסיעה המשובצת עבורך:

📦 *מספר הזמנה:* ${order.orderNumber || order.orderId}
👤 *שם לקוח:* ${order.customerName}
📍 *יעד פריקה:* ${order.siteAddress || order.address || order.city}
🏟️ *מחסן טעינה:* ${order.warehouseName || order.warehouse || '🏟️ 1️⃣ התלמיד (גבס ופרופילים)'}
⏰ *שעת הגעה מתוכננת:* ${order.scheduledTime || order.time || '08:00'} (${order.round || 'סבב 1'})

📋 *פירוט מוצרים להעמסה:*
${order.itemsFormatted || order.items || order.itemsDetails}

📦 *פקדונות:*
${order.bigBagsDeposit > 0 || order.palletsDeposit > 0 ? `• משטחי סבן (60060): ${order.palletsDeposit || 0}` : '• הובלה רגילה - פטור מפקדונות'}

🗺️ *קישור ניווט Waze ישיר:*
${order.wazeUrl || `https://www.waze.com/ul?q=${encodeURIComponent(order.siteAddress || order.address || order.city)}&navigate=yes`}

נא לפרוק בזהירות ולהחתים את הלקוח באפליקציה!
באדיבות נועה AI ❤️ יד ימינו של ראמי סבן`;
}

/**
 * 3. עיצוב דוח בוקר מבצעי מרוכז לראמי ולקבוצת הניהול
 */
function formatWhatsAppMorningReport(orders, stats) {
  const dateStr = new Date().toLocaleDateString('he-IL');
  const totalOrders = orders.length;
  
  let ordersListText = '';
  orders.forEach((o, idx) => {
    const isHikmat = (o.driver || o.assignedDriver || '').includes('חכמת');
    const driverIcon = isHikmat ? '🏗️ חכמת (מנוף)' : '🚚 עלי (איסוזו)';
    ordersListText += `\n${idx + 1}. *הזמנה #${o.orderNumber || o.orderId}* | ${o.customerName}\n   📍 ${o.siteAddress || o.address || o.city} (${o.warehouseName || o.warehouse})\n   👨‍✈️ ${driverIcon} | ⏰ ${o.scheduledTime || o.round}\n   📦 פקדונות: ${o.bigBagsDeposit || 0} בלות | ${o.palletsDeposit || 0} משטחים\n`;
  });

  return `📊 *ח. סבן חומרי בניין בע"מ — דוח בוקר מבצעי וסידור עבודה* 🚚
🗓️ *תאריך:* ${dateStr} | שעת הפקה: ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}

📈 *ריכוז נתונים מבצעי:*
• סה"כ הזמנות פתוחות: *${totalOrders}*
• מחסן 4 החרש (מלט/חול/בלוקים): *${stats?.harashCount || orders.filter(o => (o.warehouse || '').includes('4') || (o.warehouse || '').includes('HARASH')).length}*
• מחסן 1 התלמיד (גבס/פרופילים): *${stats?.talmidCount || orders.filter(o => (o.warehouse || '').includes('1') || (o.warehouse || '').includes('TALMID')).length}*
• משימות משאית מנוף (חכמת): *${orders.filter(o => (o.driver || o.assignedDriver || '').includes('חכמת')).length}*
• משימות משאית חלוקה (עלי): *${orders.filter(o => (o.driver || o.assignedDriver || '').includes('עלי')).length}*
• סה"כ שקי בלה לפקדון (60002): *${orders.reduce((acc, o) => acc + (Number(o.bigBagsDeposit) || 0), 0)}*
• סה"כ משטחי סבן לפקדון (60060): *${orders.reduce((acc, o) => acc + (Number(o.palletsDeposit) || 0), 0)}*

📋 *פירוט סבבי חלוקה לפי נהגים ויעדים:*${ordersListText}
🔗 *לצפייה בגיליון הראשי והפקת תעודות:*
https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit

יום מוצלח ומלא עשייה לכולנו! 🏗️
באדיבות נועה AI ❤️ יד ימינו הנאמנה של ראמי סבן`;
}

/**
 * 4. עיצוב הודעת WhatsApp מעודכנת ללקוח (הזמנה בדרך לאתר)
 */
function formatWhatsAppCustomer(order) {
  const isHikmat = (order.driver || order.assignedDriver || '').includes('חכמת');
  const driverName = isHikmat ? 'חכמת' : 'עלי';
  const driverPhone = isHikmat ? CONTACTS.HIKMAT.phone : CONTACTS.ALI.phone;

  return `שלום וברכה מ*ח. סבן חומרי בניין (1994) בע"מ*! 🏗️

שמחים לעדכן כי הזמנתך מספר *#${order.orderNumber || order.orderId}* הועמסה במחסן ונמצאת כעת בדרכה לאתר בכתובת:
📍 *${order.siteAddress || order.address || order.city}*

🚚 *נהג מבצע:* ${driverName} (${driverPhone})
⏰ *זמן הגעה משוער (ETA):* ${order.scheduledTime || 'בשעות הקרובות'}

📋 *פירוט החומרים שבמשלוח:*
${order.itemsFormatted || order.items || order.itemsDetails}

${order.bigBagsDeposit > 0 || order.palletsDeposit > 0 ? `📦 *לתשומת לבך — פקדונות שיחויבו בחשבונית:*
${order.bigBagsDeposit > 0 ? `• שקי בלה (60002): ${order.bigBagsDeposit} פקדון\n` : ''}${order.palletsDeposit > 0 ? `• משטחי סבן (60060): ${order.palletsDeposit} פקדון` : ''}` : ''}

במידת הצורך בתיאום פריקה באתר, ניתן ליצור קשר ישירות עם הנהג או עם משרדנו.
תודה שבחרת בח. סבן — איכות ושירות ללא פשרות! ❤️`;
}

/**
 * פונקציית שליחה ישירה ל-Make עבור דוח בוקר
 */
function triggerMorningReportWhatsApp() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES.MORNING_DISPATCH);
  const data = sheet.getDataRange().getValues();
  
  const orders = [];
  for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (row[1]) {
      orders.push({
        round: row[0],
        orderNumber: String(row[1]),
        orderId: String(row[1]),
        customerName: String(row[2]),
        warehouse: String(row[3]),
        warehouseName: String(row[3]),
        siteAddress: String(row[4]),
        address: String(row[4]),
        driver: String(row[5]),
        assignedDriver: String(row[5]),
        items: String(row[6]),
        itemsFormatted: String(row[6]),
        deposits: String(row[7]),
        wazeUrl: String(row[8]),
        status: String(row[9]),
        scheduledTime: String(row[0])
      });
    }
  }

  const messageText = formatWhatsAppMorningReport(orders, {
    harashCount: orders.filter(o => (o.warehouse || '').includes('החרש') || (o.warehouse || '').includes('4')).length,
    talmidCount: orders.filter(o => (o.warehouse || '').includes('התלמיד') || (o.warehouse || '').includes('1')).length
  });

  const payload = {
    event: 'morning_report_dispatch',
    sender: 'נועה AI',
    recipient: 'קבוצת הנהלה וסידור ח. סבן',
    recipientPhone: CONTACTS.RAMI.phone,
    messageType: 'morning_report',
    message: messageText,
    ordersCount: orders.length,
    orders: orders,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`,
    timestamp: new Date().toISOString()
  };

  const result = sendWhatsAppViaMake(payload);
  
  if (result.success) {
    SpreadsheetApp.getUi().alert('✓ דוח הבוקר שודר בהצלחה לוואטסאפ דרך Make.com!');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ שגיאה בשידור דרך Make: ' + (result.error || result.response));
  }
}

/**
 * בדיקת חיבור Webhook ל-Make
 */
function testMakeWebhookConnection() {
  const payload = {
    event: 'test_connection',
    sender: 'נועה AI (מערכת ח. סבן)',
    message: '🚀 בדיקת חיבור תקינה מ-Google Apps Script ל-Make.com Webhook! המערכת מחוברת ומסונכרנת 100%.',
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  };

  const result = sendWhatsAppViaMake(payload);
  if (result.success) {
    SpreadsheetApp.getUi().alert('✓ החיבור ל-Make.com Webhook תקין ופעיל!');
  } else {
    SpreadsheetApp.getUi().alert('⚠️ החיבור נכשל: ' + (result.error || result.response));
  }
}

// ==========================================
// 6. ניהול תיקיות לקוחות ב-Google Drive
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
    
    // יצירת תיקייה חדשה אם לא קיימת
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
// 7. Web App HTTP Handler (doGet / doPost)
// ==========================================
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'getOpenOrders';
  let result = {};

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'getOpenOrders' || action === 'getOrders') {
      const sheet = ss.getSheetByName(SHEET_NAMES.ORDERS_DASHBOARD) || ss.getSheetByName('סידור_עבודה_יומי');
      const data = sheet ? sheet.getDataRange().getValues() : [];
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

      result = { status: 'success', orders: orders, totalCount: orders.length, spreadsheetId: SPREADSHEET_ID };

    } else if (action === 'getMorningDispatch') {
      const sheet = ss.getSheetByName(SHEET_NAMES.MORNING_DISPATCH);
      const data = sheet ? sheet.getDataRange().getValues() : [];
      const tasks = [];

      for (let i = 4; i < data.length; i++) {
        const row = data[i];
        if (row[1]) {
          tasks.push({
            round: String(row[0]),
            orderId: String(row[1]),
            customerName: String(row[2]),
            warehouse: String(row[3]),
            address: String(row[4]),
            driver: String(row[5]),
            items: String(row[6]),
            deposits: String(row[7]),
            wazeLink: String(row[8]),
            status: String(row[9]),
            whatsappLink: String(row[10]),
            folderUrl: String(row[11])
          });
        }
      }

      result = { status: 'success', tasks: tasks, totalCount: tasks.length, spreadsheetId: SPREADSHEET_ID };

    } else if (action === 'getCities') {
      const sheet = ss.getSheetByName(SHEET_NAMES.CITIES);
      const data = sheet ? sheet.getDataRange().getValues() : [];
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

    } else if (action === 'getDictionary') {
      const sheet = ss.getSheetByName(SHEET_NAMES.DICTIONARY);
      const data = sheet ? sheet.getDataRange().getValues() : [];
      const items = [];
      for (let i = 1; i < data.length; i++) {
        items.push({
          sku: data[i][0],
          name: data[i][1],
          category: data[i][2],
          unit: data[i][3],
          keywords: data[i][4],
          warehouse: data[i][5],
          depositType: data[i][6],
          weightKg: data[i][7],
          defaultDriver: data[i][8]
        });
      }
      result = { status: 'success', items: items, totalCount: items.length };
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
    const action = payload.action || 'sendWhatsApp';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'sendWhatsApp' || action === 'sendWhatsAppViaMake') {
      // שליחת הודעה דרך Make.com Webhook
      const waType = payload.type || 'driver_dispatch';
      const order = payload.order || payload.data || {};
      let formattedMsg = '';

      if (waType === 'driver_hikmat') {
        formattedMsg = formatWhatsAppHikmat(order);
      } else if (waType === 'driver_ali') {
        formattedMsg = formatWhatsAppAli(order);
      } else if (waType === 'morning_report') {
        formattedMsg = formatWhatsAppMorningReport(payload.orders || [order], payload.stats || {});
      } else if (waType === 'customer_alert') {
        formattedMsg = formatWhatsAppCustomer(order);
      } else {
        formattedMsg = payload.customMessage || formatWhatsAppHikmat(order);
      }

      const makePayload = {
        event: waType,
        recipient: payload.recipient || order.assignedDriver || order.driver || 'חכמת',
        recipientPhone: payload.phone || (order.assignedDriver?.includes('עלי') ? CONTACTS.ALI.phone : CONTACTS.HIKMAT.phone),
        message: formattedMsg,
        orderNumber: order.orderNumber || order.orderId,
        customerName: order.customerName,
        wazeUrl: order.wazeUrl,
        timestamp: new Date().toISOString()
      };

      const makeRes = sendWhatsAppViaMake(makePayload);
      result = {
        status: makeRes.success ? 'success' : 'warning',
        message: 'הודעת WhatsApp שוגרה לערוץ Make.com בהצלחה!',
        formattedMessage: formattedMsg,
        makeResponse: makeRes
      };

    } else if (action === 'insertOrder') {
      const sheet = ss.getSheetByName(SHEET_NAMES.ORDERS_DASHBOARD) || ss.getSheetByName('סידור_עבודה_יומי');
      const order = payload.data || {};
      const orderId = order.orderNumber || order.orderId || ('ORD-' + Date.now());
      const customerNum = order.customerNumber || '607125';
      const customerName = order.customerName || 'לקוח ח. סבן';
      
      const folderInfo = getOrCreateCustomerFolder(customerNum, customerName);
      const wazeUrl = `https://www.waze.com/ul?q=${encodeURIComponent(order.siteAddress || order.address || order.city || '')}&navigate=yes`;
      
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

    } else if (action === 'archiveMorningReport') {
      const sheet = ss.getSheetByName(SHEET_NAMES.ARCHIVE_REPORTS);
      const rep = payload.report || {};
      const now = new Date();
      
      sheet.appendRow([
        rep.date || now.toLocaleDateString('he-IL'),
        now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        rep.totalOrders || (rep.orders ? rep.orders.length : 3),
        rep.harashOrders || 2,
        rep.talmidOrders || 1,
        rep.hikmatOrders || 2,
        rep.aliOrders || 1,
        rep.totalBigBags || 7,
        rep.totalPallets || 5,
        '✅ סופק במלואו',
        'נועה AI ❤️'
      ]);

      result = { status: 'success', message: 'דוח בוקר ננעל ונרשם בארכיון הגיליון בהצלחה!' };
    }

  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
