import { DriverInfo, Order, OrderItem, LogisticsDictionaryItem, DeliveryNoteRecord } from '../types';

// ==========================================
// TABLE 1: "מילון_לוגיסטי" (Logistics Dictionary & Product Catalog)
// Tab 1 from Google Spreadsheet: 1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA
// SKU, Official_Name, Category, Unit, Keywords, Default_Warehouse, Deposit_Type, Weight_Kg
// ==========================================
export const LOGISTICS_DICTIONARY: LogisticsDictionaryItem[] = [
  // 1. כלי עבודה וציוד
  {
    sku: '41544',
    officialName: 'להבים לסכין יפני רחב (18 מ"מ)',
    category: 'כלי עבודה',
    unit: 'יח\'',
    keywords: 'להבים, סכין יפני, חיתוך, להב, להבים לסכין יפני, סכין יפנית, להבים 18 מ"מ',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.2
  },
  {
    sku: '41510',
    officialName: 'סכין יפני מקצועי 18 מ"מ ידית גומי',
    category: 'כלי עבודה',
    unit: 'יח\'',
    keywords: 'סכין יפני, סכין חיתוך, סכין יפנית, קאטר, סכין גומי',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.3
  },
  {
    sku: '42100',
    officialName: 'מטר מדידה מקצועי 5 מטר מגנטי',
    category: 'כלי עבודה',
    unit: 'יח\'',
    keywords: 'מטר, מטר מדידה, מטר מגנטי, סרט מידה, רולקה, 5 מטר',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.4
  },
  {
    sku: '43500',
    officialName: 'פלס אלומיניום מקצועי 80 ס"מ',
    category: 'כלי עבודה',
    unit: 'יח\'',
    keywords: 'פלס, פלס מגנטי, פלס 80, פלס אלומיניום, פלס בניה',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.8
  },
  {
    sku: '44200',
    officialName: 'אקדח סיליקון מקצועי מחוזק',
    category: 'כלי עבודה',
    unit: 'יח\'',
    keywords: 'אקדח סיליקון, אקדח מסטיק, אקדח סיקה, אקדח שפופרות',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.6
  },
  {
    sku: '45100',
    officialName: 'מאלג\' שיניים 10 מ"מ נירוסטה',
    category: 'כלי עבודה',
    unit: 'יח\'',
    keywords: 'מאלג, מאלג שיניים, מאלג ריצוף, מלג, שפכטל שיניים, מאלג נירוסטה',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.5
  },

  // 2. מלט וחומרי מליטה
  {
    sku: '10002',
    officialName: 'מלט אפור 25 ק"ג נשר',
    category: 'מלט וחומרי מליטה',
    unit: 'שק',
    keywords: 'מלט, מלט אפור, שק מלט, צמנט, נשר, מלט בניה, מלט 25, צמנט פורטלנד',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '10005',
    officialName: 'מלט לבן 25 ק"ג נשר',
    category: 'מלט וחומרי מליטה',
    unit: 'שק',
    keywords: 'מלט לבן, שק מלט לבן, צמנט לבן, נשר לבן, מלט לבן 25',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '10020',
    officialName: 'צמנט מהיר התקשרות 25 ק"ג',
    category: 'מלט וחומרי מליטה',
    unit: 'שק',
    keywords: 'מלט מהיר, צמנט מהיר, ספיד צמנט, בטון מהיר, מלט אטום',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },

  // 3. אגרגטים ועפר (שקים גדולים / בלות)
  {
    sku: '11501',
    officialName: 'חול שק גדול (בלה)',
    category: 'אגרגטים ועפר',
    unit: 'בלה',
    keywords: 'חול, בלה, שק גדול, חול ים, חול מחצבה, בלת חול, שק חול, חול בנייה, חול לבן',
    defaultWarehouse: '4_HARASH',
    depositType: 'bigBag',
    weightKg: 1000
  },
  {
    sku: '11551',
    officialName: 'טיט שק גדול (בלה)',
    category: 'אגרגטים ועפר',
    unit: 'בלה',
    keywords: 'טיט, בלה, שק טיט, טיט לבנייה, בלת טיט, טיט מוכן, שק טיט גדול, טיט בלה',
    defaultWarehouse: '4_HARASH',
    depositType: 'bigBag',
    weightKg: 1000
  },
  {
    sku: '11601',
    officialName: 'סומסום לריצוף שק גדול (בלה)',
    category: 'אגרגטים ועפר',
    unit: 'בלה',
    keywords: 'סומסום, בלת סומסום, שק סומסום, סומסום לריצוף, חצץ דק, חצץ סומסום',
    defaultWarehouse: '4_HARASH',
    depositType: 'bigBag',
    weightKg: 1000
  },
  {
    sku: '11651',
    officialName: 'חצץ פוליה שק גדול (בלה)',
    category: 'אגרגטים ועפר',
    unit: 'בלה',
    keywords: 'חצץ, פוליה, בלת חצץ, שק חצץ, חצץ בטון, חצץ 2, אגרגט',
    defaultWarehouse: '4_HARASH',
    depositType: 'bigBag',
    weightKg: 1100
  },
  {
    sku: '11701',
    officialName: 'טוף שחור/אדום שק גדול (בלה)',
    category: 'אגרגטים ועפר',
    unit: 'בלה',
    keywords: 'טוף, בלת טוף, שק טוף, טוף גינון, טוף אדום, טוף שחור',
    defaultWarehouse: '4_HARASH',
    depositType: 'bigBag',
    weightKg: 800
  },

  // 4. טיח, גבס וציפויים
  {
    sku: '14075',
    officialName: 'טיח גבס MP75 קנאוף',
    category: 'טיח וגבס',
    unit: 'שק',
    keywords: 'mp75, טיח גבס, קנאוף, טיח פנים, אמ פי 75, טיח שקים, אמפי 75, mp 75',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '14100',
    officialName: 'טיח חוץ 710 תרמוקיר 25 ק"ג',
    category: 'טיח וגבס',
    unit: 'שק',
    keywords: 'טיח 710, תרמוקיר 710, טיח חוץ, טיח תרמוקיר, שק 710',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '14200',
    officialName: 'טיח הרבצה 720 תרמוקיר 25 ק"ג',
    category: 'טיח וגבס',
    unit: 'שק',
    keywords: 'הרבצה, טיח הרבצה, 720, תרמוקיר 720, טיח אטימה',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '14300',
    officialName: 'גבס לבן בנייה 25 ק"ג נשר',
    category: 'טיח וגבס',
    unit: 'שק',
    keywords: 'שק גבס, גבס לבן, גבס נשר, אבקת גבס, גבס 25',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },

  // 5. לוחות גבס ולוחות מיוחדים
  {
    sku: '111200',
    officialName: 'לוח גבס לבן 200 ע 12.50',
    category: 'לוחות גבס',
    unit: 'לוח',
    keywords: 'גבס, לוח גבס, גבס לבן, 2 מטר, לוחות גבס, גבס רגיל, לוח לבן 200, לוח גבס 12.5',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 18
  },
  {
    sku: '111260',
    officialName: 'לוח גבס לבן 260 ע 12.50',
    category: 'לוחות גבס',
    unit: 'לוח',
    keywords: 'גבס 260, לוח גבס 2.6, לוח לבן 260, גבס ארוך, לוח גבס 260 ס"מ',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 23
  },
  {
    sku: '112200',
    officialName: 'לוח גבס ירוק 200 ע 12.50 עמיד לחות',
    category: 'לוחות גבס',
    unit: 'לוח',
    keywords: 'גבס ירוק, עמיד מים, עמיד לחות, גבס למקלחת, לוח ירוק, גבס ירוק 2 מטר, לוח גבס ירוק',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 20
  },
  {
    sku: '112260',
    officialName: 'לוח גבס ירוק 260 ע 12.50 עמיד לחות',
    category: 'לוחות גבס',
    unit: 'לוח',
    keywords: 'גבס ירוק 260, לוח ירוק 2.6, גבס ירוק ארוך, עמיד לחות 260',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 25
  },
  {
    sku: '113200',
    officialName: 'לוח גבס ורוד 200 ע 12.50 חסין אש',
    category: 'לוחות גבס',
    unit: 'לוח',
    keywords: 'גבס ורוד, חסין אש, גבס אש, לוח ורוד, גבס מעכב בעירה, פיירסטופ',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 21
  },
  {
    sku: '114200',
    officialName: 'לוח צמנט בורד חיצוני 200 ע 12.50',
    category: 'לוחות גבס',
    unit: 'לוח',
    keywords: 'צמנט בורד, אקווה פאנל, לוח צמנט, לוח חוץ, צמנטבורד, לוח עמיד חוץ',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 28
  },

  // 6. פרופילים ושלד מתכת
  {
    sku: '9570300',
    officialName: 'ניצב 70/300 0.5 לפרופיל גבס',
    category: 'פרופילים ומתכת',
    unit: 'יח\'',
    keywords: 'ניצב, ניצבים, ניצב 70, פרופיל גבס, 3 מטר, ניצב לגבס, ניצב 70/300, פרופיל 70',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 2
  },
  {
    sku: '8570300',
    officialName: 'מסלול 70/300 0.5 לפרופיל גבס',
    category: 'פרופילים ומתכת',
    unit: 'יח\'',
    keywords: 'מסלול, מסלולים, מסלול 70, שלד גבס, מסלול לגבס, מסלול 70/300, פרופיל רצפה 70',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 2
  },
  {
    sku: '9550300',
    officialName: 'ניצב 50/300 0.5 לפרופיל גבס',
    category: 'פרופילים ומתכת',
    unit: 'יח\'',
    keywords: 'ניצב 50, ניצבים 50, ניצב 50/300, פרופיל 50, שלד 50',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 1.6
  },
  {
    sku: '8550300',
    officialName: 'מסלול 50/300 0.5 לפרופיל גבס',
    category: 'פרופילים ומתכת',
    unit: 'יח\'',
    keywords: 'מסלול 50, מסלולים 50, מסלול 50/300, מסלול גבס 50',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 1.6
  },
  {
    sku: '9100300',
    officialName: 'פרופיל אומגה לתקרה 3 מטר',
    category: 'פרופילים ומתכת',
    unit: 'יח\'',
    keywords: 'אומגה, פרופיל אומגה, אומגה לתקרה, אומגות, פרופיל תקרה',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 1.2
  },
  {
    sku: '9200300',
    officialName: 'פינה משתנה / זווית פינה לגבס 3 מטר',
    category: 'פרופילים ומתכת',
    unit: 'יח\'',
    keywords: 'פינה, זווית פינה, פינה משתנה, פרופיל פינה, פינות גבס, מגן פינה',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.8
  },

  // 7. ברגים, דיבלים ופרזול
  {
    sku: '76133',
    officialName: 'בורג פחפח 13 (1000 יח\')',
    category: 'ברגים ופרזול',
    unit: 'קופסה',
    keywords: 'בורג, פחפח, ברגי פחפח, ברגים לגבס, 13 מ"מ, ברגים, קופסת פחפח, פח פח',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 1.5
  },
  {
    sku: '76250',
    officialName: 'בורג גבס שחור 25 מ"מ (1000 יח\')',
    category: 'ברגים ופרזול',
    unit: 'קופסה',
    keywords: 'בורג גבס, ברגי גבס, גבס 25, בורג שחור, ברגים שחורים, בורג גבס 25',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 1.8
  },
  {
    sku: '76350',
    officialName: 'בורג גבס שחור 35 מ"מ (1000 יח\')',
    category: 'ברגים ופרזול',
    unit: 'קופסה',
    keywords: 'בורג גבס 35, ברגי גבס 35, בורג שחור 35, ברגים ארוכים לגבס',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 2.2
  },
  {
    sku: '77100',
    officialName: 'דיבל רוזטה פרפר לגבס (100 יח\')',
    category: 'ברגים ופרזול',
    unit: 'שקית',
    keywords: 'דיבל גבס, רוזטה, דיבל פרפר, דיבלים לגבס, רוזטות',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.5
  },
  {
    sku: '77200',
    officialName: 'דיבל ג\'מבו 10 מ"מ לקיר בלוק (50 יח\')',
    category: 'ברגים ופרזול',
    unit: 'קופסה',
    keywords: 'גמבו, דיבל גמבו, ג\'מבו, דיבל כבד, עוגן גמבו, גמבו 10',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 1.2
  },

  // 8. דבקים, איטום וכימיקלים
  {
    sku: '21109',
    officialName: 'דבק קרמיקה 109 שרפון 25 ק"ג',
    category: 'דבקים ואיטום',
    unit: 'שק',
    keywords: 'דבק 109, דבק קרמיקה, שרפון 109, דבק ריצוף, שק דבק, דבק אריחים',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '21116',
    officialName: 'דבק גמיש C2TE שרפון 116 25 ק"ג',
    category: 'דבקים ואיטום',
    unit: 'שק',
    keywords: 'דבק 116, שרפון 116, דבק גמיש, דבק לגרניט פורצלן, דבק שיש',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '22107',
    officialName: 'איטום צמנטי סיקה טופ 107 (סט שק+נוזל)',
    category: 'דבקים ואיטום',
    unit: 'סט',
    keywords: 'סיקה 107, סיקה טופ, איטום צמנטי, סט סיקה, חומר איטום למקלחת, סיקהטופ 107',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 25
  },
  {
    sku: '22011',
    officialName: 'מסטיק פוליאוריטן סיקה פלקס 11FC שחור/אפור/לבן',
    category: 'דבקים ואיטום',
    unit: 'יח\'',
    keywords: 'סיקה פלקס, סיקפלקס, 11fc, סיקה 11, מסטיק פוליאוריטני, נקניק סיקה',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 0.6
  },
  {
    sku: '22300',
    officialName: 'ביטומן קר לאיטום מסטיק 18 ליטר פזקר',
    category: 'דבקים ואיטום',
    unit: 'פח',
    keywords: 'ביטומן, חומר שחור, מסטיקגום, איטום ביטומני, פח שחור, זפת קר',
    defaultWarehouse: '4_HARASH',
    depositType: 'none',
    weightKg: 20
  },

  // 9. צבעים, שפכטלים ופריימרים
  {
    sku: '31018',
    officialName: 'סופרקריל מט לבן טמבור 18 ליטר',
    category: 'צבעים וציפויים',
    unit: 'פח',
    keywords: 'סופרקריל, טמבור לבן, פח צבע, צבע קיר, צבע לבן 18, צבע אקרילי',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 25
  },
  {
    sku: '31100',
    officialName: 'שפכטל אמריקאי מוכן דלי 28 ק"ג',
    category: 'צבעים וציפויים',
    unit: 'דלי',
    keywords: 'שפכטל אמריקאי, דלי שפכטל, שפכטל גבס מוכן, מרק גבס, שפכטל החלקה',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 28
  },
  {
    sku: '31200',
    officialName: 'בונדרול סופר טמבור 5 ליטר יסוד מחזק',
    category: 'צבעים וציפויים',
    unit: 'גלון',
    keywords: 'בונדרול, יסוד מחזק, פריימר בונדרול, בונדרול טמבור, מקשר צבע',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 5
  },

  // 10. בידוד ובידוד אקוסטי
  {
    sku: '51050',
    officialName: 'צמר סלעים דחוס 50 ק"ג/מ"ק עובי 5 ס"מ',
    category: 'בידוד ותרמי',
    unit: 'חבילה',
    keywords: 'צמר סלעים, בידוד גבס, צמר דחוס, בידוד אקוסטי, צמר סלעים 50',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 15
  },
  {
    sku: '51060',
    officialName: 'צמר זכוכית עטוף מזרן 50 מ"מ',
    category: 'בידוד ותרמי',
    unit: 'גליל',
    keywords: 'צמר זכוכית, צמר צהוב, בידוד תרמי, גליל צמר, מזרן צמר',
    defaultWarehouse: '1_TALMID',
    depositType: 'none',
    weightKg: 10
  },

  // 11. בלוקים ומוצרי בטון
  {
    sku: '61020',
    officialName: 'בלוק איטונג 20 תקני לבנייה',
    category: 'בלוקים ובטון',
    unit: 'יח\'',
    keywords: 'איטונג, בלוק איטונג, איטונג 20, בלוק קל, בלוק לבן',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 16
  },
  {
    sku: '61010',
    officialName: 'בלוק בטון 10 מחיצה 4 חורים',
    category: 'בלוקים ובטון',
    unit: 'יח\'',
    keywords: 'בלוק בטון, בלוק 10, בלוק מחיצה, בלוק שחור, בלוקים',
    defaultWarehouse: '4_HARASH',
    depositType: 'pallet',
    weightKg: 12
  }
];

export const SABAN_DRIVERS: DriverInfo[] = [
  {
    id: 'hikmat',
    name: 'חכמת (משאית מנוף)',
    role: 'נהג מנוף ראשי',
    truckModel: 'וולוו FH מנוף הידראולי 26 טון',
    truckPlate: '615-41-002',
    capacityTon: 26,
    hasCrane: true,
    phone: '050-886-1080',
    currentWarehouse: '4_HARASH',
    status: 'delivering',
    currentLocationName: 'רעננה — דרך המשי 12'
  },
  {
    id: 'ali',
    name: 'עלי (משאית חלוקה)',
    role: 'נהג חלוקה מהירה',
    truckModel: 'מרצדס אטגו 15 טון ארגז סגור',
    truckPlate: '814-12-301',
    capacityTon: 15,
    hasCrane: false,
    phone: '052-771-4490',
    currentWarehouse: '1_TALMID',
    status: 'loading',
    currentLocationName: 'מחסן 1 התלמיד — גבעתיים'
  }
];

export const SABAN_WAREHOUSES = [
  {
    id: '4_HARASH' as const,
    name: 'מחסן 4 החרש (ראשי - מלט, חול, בלוקים, ברזל)',
    shortName: '🏭 4️⃣ החרש',
    location: 'רחוב החרש 4, אזור תעשייה טירה',
    specialty: 'מלט אפור/לבן, חול בלות, סומסום, טיט, בלוקים, טיח MP75, מנוף',
    activeOrdersCount: 2,
    inventoryStatus: 'מלאי תקין — מלט 840 שק, חול 120 בלה, טיט 95 בלה'
  },
  {
    id: '1_TALMID' as const,
    name: 'מחסן 1 התלמיד (גבס, פרופילים, צבעים, כלים)',
    shortName: '🏟️ 1️⃣ התלמיד',
    location: 'רחוב התלמיד 1, טירה',
    specialty: 'לוחות גבס לבן/ירוק/ורוד, ניצבים, מסלולים, שפכטל, צבעי טמבור/נירלט',
    activeOrdersCount: 1,
    inventoryStatus: 'מלאי תקין — 450 לוחות גבס, 800 ניצבים/מסלולים'
  }
];

// ==========================================
// TABLE 2: "סידור_עבודה_יומי" (Daily Work Schedule - 5 Mock Orders)
// Order_ID, Customer_Name, Destination, Driver, Items_Details, Status
// ==========================================
export const INITIAL_ORDERS: Order[] = [
  {
    orderNumber: '6215184',
    orderId: '6215184',
    customerNumber: '612108',
    customerName: 'בן ענבר פרויקטים בע"מ',
    siteAddress: 'דרך המשי 12, רעננה',
    destination: 'דרך המשי 12, רעננה',
    city: 'רעננה',
    warehouse: '4_HARASH',
    warehouseName: '🏭 4️⃣ החרש (מלט וחול)',
    itemsFormatted: '1. 📦 מק"ט: 11501 | חול שק גדול (בלה) | כמות: 3 בלה\n2. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג נשר | כמות: 25 שק\n3. 📦 מק"ט: 18055 | הובלת מנוף רעננה | כמות: 1 הובלה\n4. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: 3 פקדון\n5. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: 1 פקדון',
    itemsDetails: '(מק"ט: 11501 - חול שק גדול (בלה) כמות: 3), (מק"ט: 10002 - מלט אפור 25 ק"ג נשר כמות: 25), (מק"ט: 18055 - הובלת מנוף רעננה כמות: 1)',
    itemsList: [
      { sku: '11501', name: 'חול שק גדול (בלה)', quantity: 3, unit: 'בלה', depositType: 'bigBag' },
      { sku: '10002', name: 'מלט אפור 25 ק"ג נשר', quantity: 25, unit: 'שק', depositType: 'pallet' },
      { sku: '18055', name: 'הובלת מנוף רעננה', quantity: 1, unit: 'הובלה', depositType: 'none' },
      { sku: '60002', name: 'שק גדול פקדון', quantity: 3, unit: 'פקדון', depositType: 'bigBag' },
      { sku: '60060', name: 'משטח סבן פקדון', quantity: 1, unit: 'פקדון', depositType: 'pallet' }
    ],
    bigBagsDeposit: 3,
    palletsDeposit: 1,
    assignedDriver: 'חכמת (משאית מנוף)',
    driver: 'חכמת (משאית מנוף)',
    driverId: 'hikmat',
    driverPhone: '050-886-1080',
    status: 'In Progress',
    deliveryNote: 'DN-6215184',
    wazeUrl: 'https://waze.com/ul?q=Derech+HaMeshi+12+Raanana&navigate=yes',
    totalWeightKg: 3500,
    isCraneRequired: true,
    scheduledTime: '07:30',
    round: 'סבב 1 (07:30)',
    signatureReceived: false,
    isSynced: true
  },
  {
    orderNumber: '6215180',
    orderId: '6215180',
    customerNumber: '608930',
    customerName: 'קראמה אסאמה — שיפוצים',
    siteAddress: 'רוטשילד 45, כפר סבא',
    destination: 'רוטשילד 45, כפר סבא',
    city: 'כפר סבא',
    warehouse: '4_HARASH',
    warehouseName: '🏭 4️⃣ החרש (מלט וחול)',
    itemsFormatted: '1. 📦 מק"ט: 11551 | טיט שק גדול (בלה) | כמות: 4 בלה\n2. 📦 מק"ט: 14075 | טיח גבס MP75 | כמות: 20 שק\n3. 📦 מק"ט: 18055 | הובלת מנוף כ"ס | כמות: 1 הובלה\n4. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: 4 פקדון\n5. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: 1 פקדון',
    itemsDetails: '(מק"ט: 11551 - טיט שק גדול (בלה) כמות: 4), (מק"ט: 14075 - טיח גבס MP75 קנאוף כמות: 20)',
    itemsList: [
      { sku: '11551', name: 'טיט שק גדול (בלה)', quantity: 4, unit: 'בלה', depositType: 'bigBag' },
      { sku: '14075', name: 'טיח גבס MP75', quantity: 20, unit: 'שק', depositType: 'pallet' },
      { sku: '18055', name: 'הובלת מנוף כ"ס', quantity: 1, unit: 'הובלה', depositType: 'none' },
      { sku: '60002', name: 'שק גדול פקדון', quantity: 4, unit: 'פקדון', depositType: 'bigBag' },
      { sku: '60060', name: 'משטח סבן פקדון', quantity: 1, unit: 'פקדון', depositType: 'pallet' }
    ],
    bigBagsDeposit: 4,
    palletsDeposit: 1,
    assignedDriver: 'חכמת (משאית מנוף)',
    driver: 'חכמת (משאית מנוף)',
    driverId: 'hikmat',
    driverPhone: '050-886-1080',
    status: 'Pending',
    deliveryNote: 'טרם הופקה',
    wazeUrl: 'https://waze.com/ul?q=Rothschild+45+Kfar+Saba&navigate=yes',
    totalWeightKg: 4200,
    isCraneRequired: true,
    scheduledTime: '10:30',
    round: 'סבב 2 (10:30)',
    signatureReceived: false,
    isSynced: false
  },
  {
    orderNumber: '6215178',
    orderId: '6215178',
    customerNumber: '602115',
    customerName: 'בזלת מזר בע"מ',
    siteAddress: 'שדה בוקר 17, גבעתיים',
    destination: 'שדה בוקר 17, גבעתיים',
    city: 'גבעתיים',
    warehouse: '1_TALMID',
    warehouseName: '🏟️ 1️⃣ התלמיד (גבס)',
    itemsFormatted: '1. 📦 מק"ט: 112200 | לוח גבס ירוק 200 ע 12.50 | כמות: 6 לוח\n2. 📦 מק"ט: 111200 | לוח גבס לבן 200 ע 12.50 | כמות: 40 לוח\n3. 📦 מק"ט: 9570300 | ניצב 70/300 0.5 | כמות: 20 יח\'\n4. 📦 מק"ט: 8570300 | מסלול 70/300 0.5 | כמות: 16 יח\'\n5. 📦 מק"ט: 76133 | בורג פחפח 13 1000 יח\' | כמות: 1 קופסה',
    itemsDetails: '(מק"ט: 111200 - לוח גבס לבן 200 ע 12.50 כמות: 40), (מק"ט: 112200 - לוח גבס ירוק 200 ע 12.50 עמיד לחות כמות: 6), (מק"ט: 9570300 - ניצב 70/300 0.5 כמות: 20), (מק"ט: 8570300 - מסלול 70/300 0.5 כמות: 16)',
    itemsList: [
      { sku: '112200', name: 'לוח גבס ירוק 200 ע 12.50', quantity: 6, unit: 'לוח', depositType: 'none' },
      { sku: '111200', name: 'לוח גבס לבן 200 ע 12.50', quantity: 40, unit: 'לוח', depositType: 'none' },
      { sku: '9570300', name: 'ניצב 70/300 0.5', quantity: 20, unit: 'יח\'', depositType: 'none' },
      { sku: '8570300', name: 'מסלול 70/300 0.5', quantity: 16, unit: 'יח\'', depositType: 'none' },
      { sku: '76133', name: 'בורג פחפח 13 1000 יח\'', quantity: 1, unit: 'קופסה', depositType: 'none' }
    ],
    bigBagsDeposit: 0,
    palletsDeposit: 0,
    assignedDriver: 'עלי (משאית חלוקה)',
    driver: 'עלי (משאית חלוקה)',
    driverId: 'ali',
    driverPhone: '052-771-4490',
    status: 'In Progress',
    deliveryNote: 'DN-6215178',
    wazeUrl: 'https://waze.com/ul?q=Sde+Boker+17+Givatayim&navigate=yes',
    totalWeightKg: 1800,
    isCraneRequired: false,
    scheduledTime: '08:00',
    round: 'סבב 1 (08:00)',
    signatureReceived: false,
    isSynced: true
  },
  {
    orderNumber: '6215165',
    orderId: '6215165',
    customerNumber: '601004',
    customerName: 'אלפא הנדסה ובנייה',
    siteAddress: 'הירקון 112, תל אביב',
    destination: 'הירקון 112, תל אביב',
    city: 'תל אביב',
    warehouse: '1_TALMID',
    warehouseName: '🏟️ 1️⃣ התלמיד (כלי עבודה)',
    itemsFormatted: '1. 📦 מק"ט: 41544 | להבים לסכין יפני רחב | כמות: 10 יח\'\n2. 📦 מק"ט: 76133 | בורג פחפח 13 (1000 יח\') | כמות: 5 קופסה',
    itemsDetails: '(מק"ט: 41544 - להבים לסכין יפני רחב (18 מ"מ) כמות: 10), (מק"ט: 76133 - בורג פחפח 13 (1000 יח\') כמות: 5)',
    itemsList: [
      { sku: '41544', name: 'להבים לסכין יפני רחב (18 מ"מ)', quantity: 10, unit: 'יח\'', depositType: 'none' },
      { sku: '76133', name: 'בורג פחפח 13 (1000 יח\')', quantity: 5, unit: 'קופסה', depositType: 'none' }
    ],
    bigBagsDeposit: 0,
    palletsDeposit: 0,
    assignedDriver: 'עלי (משאית חלוקה)',
    driver: 'עלי (משאית חלוקה)',
    driverId: 'ali',
    driverPhone: '052-771-4490',
    status: 'Delivered',
    deliveryNote: 'DN-6215165',
    wazeUrl: 'https://waze.com/ul?q=HaYarkon+112+Tel+Aviv&navigate=yes',
    totalWeightKg: 10,
    isCraneRequired: false,
    scheduledTime: '09:15',
    round: 'סבב 1 (09:15)',
    deliveredAt: '09:42',
    signatureReceived: true,
    isSynced: true
  },
  {
    orderNumber: '6215152',
    orderId: '6215152',
    customerNumber: '603391',
    customerName: 'מבני שרון — אבי רונן',
    siteAddress: 'סוקולוב 34, הרצליה',
    destination: 'סוקולוב 34, הרצליה',
    city: 'הרצליה',
    warehouse: '4_HARASH',
    warehouseName: '🏭 4️⃣ החרש (מלט וחול)',
    itemsFormatted: '1. 📦 מק"ט: 11501 | חול שק גדול (בלה) | כמות: 2 בלה\n2. 📦 מק"ט: 10002 | מלט אפור 25 ק"ג נשר | כמות: 15 שק\n3. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: 2 פקדון',
    itemsDetails: '(מק"ט: 11501 - חול שק גדול (בלה) כמות: 2), (מק"ט: 10002 - מלט אפור 25 ק"ג נשר כמות: 15)',
    itemsList: [
      { sku: '11501', name: 'חול שק גדול (בלה)', quantity: 2, unit: 'בלה', depositType: 'bigBag' },
      { sku: '10002', name: 'מלט אפור 25 ק"ג נשר', quantity: 15, unit: 'שק', depositType: 'pallet' },
      { sku: '60002', name: 'שק גדול פקדון', quantity: 2, unit: 'פקדון', depositType: 'bigBag' }
    ],
    bigBagsDeposit: 2,
    palletsDeposit: 0,
    assignedDriver: 'חכמת (משאית מנוף)',
    driver: 'חכמת (משאית מנוף)',
    driverId: 'hikmat',
    driverPhone: '050-886-1080',
    status: 'Delivered',
    deliveryNote: 'DN-6215152',
    wazeUrl: 'https://waze.com/ul?q=Sokolov+34+Herzliya&navigate=yes',
    totalWeightKg: 2400,
    isCraneRequired: true,
    scheduledTime: '06:45',
    round: 'סבב בוקר מוקדם',
    deliveredAt: '07:18',
    signatureReceived: true,
    isSynced: true
  }
];

// ==========================================
// TABLE 3: "תעודות_משלוח_וחתימות" (Delivery Notes & Signatures)
// Order_ID, Delivery_Note_PDF, Customer_Signature, Sync_Status
// ==========================================
export const INITIAL_DELIVERY_NOTES: DeliveryNoteRecord[] = [
  {
    id: 'DN-6215184',
    orderId: '6215184',
    customerName: 'בן ענבר פרויקטים בע"מ',
    destination: 'דרך המשי 12, רעננה',
    driver: 'חכמת (משאית מנוף)',
    itemsDetails: '(מק"ט: 11501 - חול שק גדול (בלה) כמות: 3), (מק"ט: 10002 - מלט אפור 25 ק"ג נשר כמות: 25), (מק"ט: 18055 - הובלת מנוף רעננה כמות: 1)',
    deliveryNotePdf: 'https://drive.google.com/file/d/1_DN_6215184_BenInbar_PDF/view',
    customerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 25 Q 30 5, 60 20 T 90 25" stroke="%232563eb" stroke-width="3" fill="none"/></svg>',
    isSigned: false,
    syncStatus: true,
    createdAt: '2026-08-30 07:15'
  },
  {
    id: 'DN-6215178',
    orderId: '6215178',
    customerName: 'בזלת מזר בע"מ',
    destination: 'שדה בוקר 17, גבעתיים',
    driver: 'עלי (משאית חלוקה)',
    itemsDetails: '(מק"ט: 111200 - לוח גבס לבן 200 ע 12.50 כמות: 40), (מק"ט: 112200 - לוח גבס ירוק 200 ע 12.50 עמיד לחות כמות: 6), (מק"ט: 9570300 - ניצב 70/300 0.5 כמות: 20), (מק"ט: 8570300 - מסלול 70/300 0.5 כמות: 16)',
    deliveryNotePdf: 'https://drive.google.com/file/d/1_DN_6215178_Bazelet_PDF/view',
    isSigned: false,
    syncStatus: true,
    createdAt: '2026-08-30 07:45'
  },
  {
    id: 'DN-6215165',
    orderId: '6215165',
    customerName: 'אלפא הנדסה ובנייה',
    destination: 'הירקון 112, תל אביב',
    driver: 'עלי (משאית חלוקה)',
    itemsDetails: '(מק"ט: 41544 - להבים לסכין יפני רחב (18 מ"מ) כמות: 10), (מק"ט: 76133 - בורג פחפח 13 (1000 יח\') כמות: 5)',
    deliveryNotePdf: 'https://drive.google.com/file/d/1_DN_6215165_Alfa_PDF/view',
    customerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M15 30 Q 40 10, 70 25 T 95 15" stroke="%23059669" stroke-width="3" fill="none"/></svg>',
    isSigned: true,
    syncStatus: true,
    createdAt: '2026-08-30 08:30',
    signedAt: '2026-08-30 09:42'
  },
  {
    id: 'DN-6215152',
    orderId: '6215152',
    customerName: 'מבני שרון — אבי רונן',
    destination: 'סוקולוב 34, הרצליה',
    driver: 'חכמת (משאית מנוף)',
    itemsDetails: '(מק"ט: 11501 - חול שק גדול (בלה) כמות: 2), (מק"ט: 10002 - מלט אפור 25 ק"ג נשר כמות: 15)',
    deliveryNotePdf: 'https://drive.google.com/file/d/1_DN_6215152_MivneSharon_PDF/view',
    customerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><path d="M10 20 Q 35 35, 65 15 T 88 28" stroke="%23059669" stroke-width="3" fill="none"/></svg>',
    isSigned: true,
    syncStatus: true,
    createdAt: '2026-08-30 06:30',
    signedAt: '2026-08-30 07:18'
  }
];

export const COMMON_SKUS = LOGISTICS_DICTIONARY.map(item => ({
  sku: item.sku,
  name: item.officialName,
  defaultWarehouse: item.defaultWarehouse || '4_HARASH',
  depositType: item.depositType || 'none',
  unit: item.unit,
  weightKg: item.weightKg || 1
}));

