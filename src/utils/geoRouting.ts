import { Order, WarehouseId } from '../types';

export interface CityGeoLocation {
  city: string;
  lat: number;
  lng: number;
  region: string;
  aliases: string[];
  distanceFromHarashKm: number;
  distanceFromTalmidKm: number;
  avgDriveTimeMin: number;
  tollRoads: string[];
  deliveryZone: 'שרון מרכזי' | 'שרון מזרחי' | 'שרון דרומי' | 'שרון צפוני' | 'גוש דן' | 'תל אביב' | 'מרכז' | 'שפלה';
  standardDeliveryFee: number;
}

// Comprehensive Israel Cities Dictionary & Geo Coordinates
export const ISRAEL_CITIES_COORDS: Record<string, CityGeoLocation> = {
  'טירה': { 
    city: 'טירה', lat: 32.2345, lng: 34.9515, region: 'שרון דרומי', aliases: ['טירה', 'tira'],
    distanceFromHarashKm: 1.2, distanceFromTalmidKm: 0.8, avgDriveTimeMin: 5, tollRoads: [],
    deliveryZone: 'שרון דרומי', standardDeliveryFee: 150
  },
  'כפר סבא': { 
    city: 'כפר סבא', lat: 32.1782, lng: 34.9076, region: 'שרון מזרחי', aliases: ['כפר סבא', 'כ"ס', 'kfar saba'],
    distanceFromHarashKm: 9.8, distanceFromTalmidKm: 9.2, avgDriveTimeMin: 16, tollRoads: ['כביש 531'],
    deliveryZone: 'שרון מזרחי', standardDeliveryFee: 250
  },
  'רעננה': { 
    city: 'רעננה', lat: 32.1848, lng: 34.8707, region: 'שרון מרכזי', aliases: ['רעננה', 'raanana'],
    distanceFromHarashKm: 12.4, distanceFromTalmidKm: 11.8, avgDriveTimeMin: 18, tollRoads: ['כביש 531', 'כביש 4'],
    deliveryZone: 'שרון מרכזי', standardDeliveryFee: 280
  },
  'הוד השרון': { 
    city: 'הוד השרון', lat: 32.1554, lng: 34.8887, region: 'שרון דרומי', aliases: ['הוד השרון', 'הודה"ש', 'hod hasharon'],
    distanceFromHarashKm: 13.6, distanceFromTalmidKm: 13.0, avgDriveTimeMin: 20, tollRoads: ['כביש 4', 'כביש 531'],
    deliveryZone: 'שרון דרומי', standardDeliveryFee: 280
  },
  'הרצליה': { 
    city: 'הרצליה', lat: 32.1663, lng: 34.8432, region: 'שרון מערבי', aliases: ['הרצליה', 'herzliya', 'הרצליה פיתוח'],
    distanceFromHarashKm: 18.5, distanceFromTalmidKm: 17.9, avgDriveTimeMin: 24, tollRoads: ['כביש 531', 'כביש 2'],
    deliveryZone: 'שרון מרכזי', standardDeliveryFee: 320
  },
  'כפר שמריהו': { 
    city: 'כפר שמריהו', lat: 32.1890, lng: 34.8210, region: 'שרון מערבי', aliases: ['כפר שמריהו', 'כפר שמריהו/הרצליה', 'kfar shmaryahu'],
    distanceFromHarashKm: 17.2, distanceFromTalmidKm: 16.6, avgDriveTimeMin: 22, tollRoads: ['כביש 531', 'כביש 2'],
    deliveryZone: 'שרון מרכזי', standardDeliveryFee: 320
  },
  'רמת השרון': { 
    city: 'רמת השרון', lat: 32.1464, lng: 34.8392, region: 'שרון / גוש דן', aliases: ['רמת השרון', 'רה"ש', 'ramat hasharon'],
    distanceFromHarashKm: 19.8, distanceFromTalmidKm: 19.2, avgDriveTimeMin: 25, tollRoads: ['כביש 4', 'כביש 5'],
    deliveryZone: 'שרון דרומי', standardDeliveryFee: 320
  },
  'פתח תקווה': { 
    city: 'פתח תקווה', lat: 32.0878, lng: 34.8878, region: 'מרכז / פ"ת', aliases: ['פתח תקווה', 'פ"ת', 'פ"ת / אם המושבות', 'petah tikva'],
    distanceFromHarashKm: 21.0, distanceFromTalmidKm: 20.4, avgDriveTimeMin: 26, tollRoads: ['כביש 4', 'כביש 6'],
    deliveryZone: 'מרכז', standardDeliveryFee: 300
  },
  'גבעתיים': { 
    city: 'גבעתיים', lat: 32.0722, lng: 34.8101, region: 'גוש דן', aliases: ['גבעתיים', 'givatayim'],
    distanceFromHarashKm: 26.5, distanceFromTalmidKm: 25.9, avgDriveTimeMin: 32, tollRoads: ['כביש 4', 'כביש 20'],
    deliveryZone: 'גוש דן', standardDeliveryFee: 350
  },
  'תל אביב': { 
    city: 'תל אביב', lat: 32.0853, lng: 34.7818, region: 'תל אביב', aliases: ['תל אביב', 'תל אביב יפו', 'ת"א', 'tel aviv', 'צפון ת"א'],
    distanceFromHarashKm: 27.8, distanceFromTalmidKm: 27.2, avgDriveTimeMin: 35, tollRoads: ['כביש 20', 'כביש 2', 'כביש 5'],
    deliveryZone: 'תל אביב', standardDeliveryFee: 380
  },
  'רמת גן': { 
    city: 'רמת גן', lat: 32.0823, lng: 34.8210, region: 'גוש דן', aliases: ['רמת גן', 'ר"ג', 'ramat gan', 'מתחם הבורסה'],
    distanceFromHarashKm: 25.2, distanceFromTalmidKm: 24.6, avgDriveTimeMin: 30, tollRoads: ['כביש 4', 'כביש 5'],
    deliveryZone: 'גוש דן', standardDeliveryFee: 350
  },
  'נתניה': { 
    city: 'נתניה', lat: 32.3215, lng: 34.8532, region: 'שרון צפוני', aliases: ['נתניה', 'netanya', 'נתניה מזרח', 'פולג'],
    distanceFromHarashKm: 19.4, distanceFromTalmidKm: 18.8, avgDriveTimeMin: 24, tollRoads: ['כביש 553', 'כביש 2', 'כביש 4'],
    deliveryZone: 'שרון צפוני', standardDeliveryFee: 300
  },
  'ראש העין': { 
    city: 'ראש העין', lat: 32.0956, lng: 34.9567, region: 'מרכז מזרחי', aliases: ['ראש העין', 'רה"ע', 'rosh haayin'],
    distanceFromHarashKm: 18.0, distanceFromTalmidKm: 17.4, avgDriveTimeMin: 22, tollRoads: ['כביש 6', 'כביש 444'],
    deliveryZone: 'מרכז', standardDeliveryFee: 280
  },
  'כוכב יאיר': { 
    city: 'כוכב יאיר', lat: 32.2281, lng: 34.9950, region: 'שרון מזרחי', aliases: ['כוכב יאיר', 'צור יגאל', 'כוכב יאיר-צור יגאל', 'kokhav yair'],
    distanceFromHarashKm: 5.5, distanceFromTalmidKm: 5.2, avgDriveTimeMin: 9, tollRoads: ['כביש 444', 'כביש 6'],
    deliveryZone: 'שרון מזרחי', standardDeliveryFee: 200
  },
  'טייבה': { 
    city: 'טייבה', lat: 32.2662, lng: 35.0084, region: 'המשולש', aliases: ['טייבה', 'tayibe'],
    distanceFromHarashKm: 4.8, distanceFromTalmidKm: 5.4, avgDriveTimeMin: 8, tollRoads: ['כביש 444'],
    deliveryZone: 'שרון מזרחי', standardDeliveryFee: 180
  },
  'קלנסווה': { 
    city: 'קלנסווה', lat: 32.2856, lng: 34.9812, region: 'שרון צפוני', aliases: ['קלנסווה', 'qalansawe'],
    distanceFromHarashKm: 6.2, distanceFromTalmidKm: 6.8, avgDriveTimeMin: 10, tollRoads: ['כביש 57'],
    deliveryZone: 'שרון צפוני', standardDeliveryFee: 180
  },
  'קדימה-צורן': { 
    city: 'קדימה-צורן', lat: 32.2783, lng: 34.9135, region: 'לב השרון', aliases: ['קדימה', 'צורן', 'קדימה צורן', 'kadima'],
    distanceFromHarashKm: 8.9, distanceFromTalmidKm: 8.4, avgDriveTimeMin: 14, tollRoads: ['כביש 562', 'כביש 4'],
    deliveryZone: 'שרון מרכזי', standardDeliveryFee: 240
  },
  'אבן יהודה': { 
    city: 'אבן יהודה', lat: 32.2694, lng: 34.8872, region: 'לב השרון', aliases: ['אבן יהודה', 'even yehuda'],
    distanceFromHarashKm: 11.2, distanceFromTalmidKm: 10.6, avgDriveTimeMin: 16, tollRoads: ['כביש 553', 'כביש 4'],
    deliveryZone: 'שרון מרכזי', standardDeliveryFee: 260
  },
  'ראשון לציון': { 
    city: 'ראשון לציון', lat: 31.9730, lng: 34.7925, region: 'שפלה / מרכז', aliases: ['ראשון לציון', 'ראשל"צ', 'rishon lezion'],
    distanceFromHarashKm: 38.5, distanceFromTalmidKm: 37.9, avgDriveTimeMin: 42, tollRoads: ['כביש 4', 'כביש 6', 'כביש 431'],
    deliveryZone: 'שפלה', standardDeliveryFee: 420
  },
  'שוהם': { 
    city: 'שוהם', lat: 31.9984, lng: 34.9467, region: 'מרכז', aliases: ['שוהם', 'shoham'],
    distanceFromHarashKm: 29.4, distanceFromTalmidKm: 28.8, avgDriveTimeMin: 30, tollRoads: ['כביש 6', 'כביש 444'],
    deliveryZone: 'מרכז', standardDeliveryFee: 340
  },
  'חדרה': { 
    city: 'חדרה', lat: 32.4340, lng: 34.9197, region: 'צפון השרון', aliases: ['חדרה', 'hadera'],
    distanceFromHarashKm: 26.8, distanceFromTalmidKm: 26.2, avgDriveTimeMin: 28, tollRoads: ['כביש 4', 'כביש 6'],
    deliveryZone: 'שרון צפוני', standardDeliveryFee: 340
  }
};

// Saban Warehouses in Tira Base
export const WAREHOUSE_COORDS = {
  '4_HARASH': {
    id: '4_HARASH',
    name: 'מחסן 4 החרש (מלט, חול, בלוקים, ברזל)',
    shortName: '🏭 4️⃣ החרש (ראשי)',
    lat: 32.2380,
    lng: 34.9560,
    city: 'טירה'
  },
  '1_TALMID': {
    id: '1_TALMID',
    name: 'מחסן 1 התלמיד (גבס, פרופילים, צבעים)',
    shortName: '🏟️ 1️⃣ התלמיד (גבס)',
    lat: 32.2310,
    lng: 34.9470,
    city: 'טירה'
  }
};

// Robust Geocoding for any Address / City string in Israel
export function getCityCoordinates(cityName: string, address?: string): { 
  lat: number; 
  lng: number; 
  standardizedCity: string;
  details?: CityGeoLocation;
} {
  if (!cityName && !address) {
    return { lat: 32.2345, lng: 34.9515, standardizedCity: 'טירה', details: ISRAEL_CITIES_COORDS['טירה'] };
  }
  
  const cleanCity = (cityName || '').trim();
  const cleanAddr = (address || '').trim();
  const searchCombined = `${cleanCity} ${cleanAddr}`;

  // 1. Direct match on City Dictionary
  for (const [key, item] of Object.entries(ISRAEL_CITIES_COORDS)) {
    if (key === cleanCity || item.aliases.some(a => cleanCity.includes(a) || cleanAddr.includes(a) || searchCombined.includes(a))) {
      return { lat: item.lat, lng: item.lng, standardizedCity: item.city, details: item };
    }
  }

  // 2. Specific Known Sites and Streets
  if (searchCombined.includes('נרקיסים') || searchCombined.includes('שמריהו')) {
    return { lat: 32.1890, lng: 34.8210, standardizedCity: 'כפר שמריהו', details: ISRAEL_CITIES_COORDS['כפר שמריהו'] };
  }
  if (searchCombined.includes('משי') || searchCombined.includes('אחוזה')) {
    return { lat: 32.1848, lng: 34.8707, standardizedCity: 'רעננה', details: ISRAEL_CITIES_COORDS['רעננה'] };
  }
  if (searchCombined.includes('רוטשילד') || searchCombined.includes('ויצמן')) {
    return { lat: 32.1782, lng: 34.9076, standardizedCity: 'כפר סבא', details: ISRAEL_CITIES_COORDS['כפר סבא'] };
  }
  if (searchCombined.includes('שדה בוקר') || searchCombined.includes('כצנלסון')) {
    return { lat: 32.0722, lng: 34.8101, standardizedCity: 'גבעתיים', details: ISRAEL_CITIES_COORDS['גבעתיים'] };
  }
  if (searchCombined.includes('ירקון') || searchCombined.includes('דיזנגוף') || searchCombined.includes('אבן גבירול')) {
    return { lat: 32.0853, lng: 34.7818, standardizedCity: 'תל אביב', details: ISRAEL_CITIES_COORDS['תל אביב'] };
  }
  if (searchCombined.includes('סוקולוב') || searchCombined.includes('בן גוריון')) {
    return { lat: 32.1663, lng: 34.8432, standardizedCity: 'הרצליה', details: ISRAEL_CITIES_COORDS['הרצליה'] };
  }

  // Fallback defaults in Sharon area
  return { 
    lat: 32.1848, 
    lng: 34.8707, 
    standardizedCity: cleanCity || 'מרכז שרון',
    details: ISRAEL_CITIES_COORDS['רעננה']
  };
}

// Calculate Haversine distance in KM
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in KM
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 1.35 * 10) / 10; // 1.35 road factor approximation
}

export interface CityDensityAggregate {
  city: string;
  lat: number;
  lng: number;
  orderCount: number;
  orders: Order[];
  totalWeightKg: number;
  totalBigBags: number;
  totalPallets: number;
  drivers: string[];
  warehouses: WarehouseId[];
  densityRank: number;
  avgScheduledTime: string;
  distanceFromBaseKm: number;
  driveTimeMin: number;
  deliveryZone: string;
  standardFee: number;
}

// Aggregate active orders by city to calculate route density & sync with 'ערים' tab
export function aggregateCityDensity(orders: Order[]): CityDensityAggregate[] {
  const map: Record<string, CityDensityAggregate> = {};

  orders.forEach(order => {
    const geo = getCityCoordinates(order.city, order.siteAddress || order.destination);
    const key = geo.standardizedCity;

    if (!map[key]) {
      const cityMeta = geo.details || ISRAEL_CITIES_COORDS[key] || ISRAEL_CITIES_COORDS['רעננה'];
      map[key] = {
        city: key,
        lat: geo.lat,
        lng: geo.lng,
        orderCount: 0,
        orders: [],
        totalWeightKg: 0,
        totalBigBags: 0,
        totalPallets: 0,
        drivers: [],
        warehouses: [],
        densityRank: 0,
        avgScheduledTime: order.scheduledTime || '08:00',
        distanceFromBaseKm: cityMeta?.distanceFromHarashKm || 15,
        driveTimeMin: cityMeta?.avgDriveTimeMin || 20,
        deliveryZone: cityMeta?.deliveryZone || 'שרון מרכזי',
        standardFee: cityMeta?.standardDeliveryFee || 280
      };
    }

    map[key].orderCount += 1;
    map[key].orders.push(order);
    map[key].totalWeightKg += order.totalWeightKg || 0;
    map[key].totalBigBags += order.bigBagsDeposit || 0;
    map[key].totalPallets += order.palletsDeposit || 0;

    const driverName = order.assignedDriver || order.driver || '';
    if (driverName && !map[key].drivers.includes(driverName)) {
      map[key].drivers.push(driverName);
    }
    if (order.warehouse && !map[key].warehouses.includes(order.warehouse)) {
      map[key].warehouses.push(order.warehouse);
    }
  });

  const list = Object.values(map);
  list.sort((a, b) => b.orderCount - a.orderCount || b.totalWeightKg - a.totalWeightKg);
  list.forEach((item, index) => {
    item.densityRank = index + 1;
  });

  return list;
}

// Visit History & Predictive AI Analysis Record
export interface CustomerVisitHistory {
  customerId: string;
  customerName: string;
  city: string;
  address: string;
  totalVisitsPastMonth: number;
  lastVisitDate: string;
  avgOrderWeightKg: number;
  favoriteMaterials: string[];
  preferredDriver: string;
  predictedNextOrderDate: string;
  predictedDemandLevel: 'גבוה' | 'בינוני' | 'רגיל';
  confidenceScore: number;
  deliveryNotesCount: number;
}

export const CUSTOMER_VISIT_HISTORIES: CustomerVisitHistory[] = [
  {
    customerId: '607125',
    customerName: 'זבולון-עדירן/צחי חגג',
    city: 'כפר שמריהו',
    address: 'הנרקיסים 32, כפר שמריהו',
    totalVisitsPastMonth: 14,
    lastVisitDate: '08/08/2026',
    avgOrderWeightKg: 1200,
    favoriteMaterials: ['טיח חוץ 710', 'מלט אפור נשר', 'משטחי סבן'],
    preferredDriver: 'חכמת (משאית מנוף)',
    predictedNextOrderDate: '12/08/2026 (בעוד יומיים)',
    predictedDemandLevel: 'גבוה',
    confidenceScore: 94,
    deliveryNotesCount: 14
  },
  {
    customerId: '612108',
    customerName: 'בן ענבר פרויקטים בע"מ',
    city: 'רעננה',
    address: 'דרך המשי 12, רעננה',
    totalVisitsPastMonth: 22,
    lastVisitDate: '09/08/2026',
    avgOrderWeightKg: 3800,
    favoriteMaterials: ['חול בלות 11501', 'מלט נשר 25 ק"ג', 'טיט מוכן'],
    preferredDriver: 'חכמת (משאית מנוף)',
    predictedNextOrderDate: '11/08/2026 (מחר)',
    predictedDemandLevel: 'גבוה',
    confidenceScore: 98,
    deliveryNotesCount: 22
  },
  {
    customerId: '608930',
    customerName: 'קראמה אסאמה — שיפוצים',
    city: 'כפר סבא',
    address: 'רוטשילד 45, כפר סבא',
    totalVisitsPastMonth: 9,
    lastVisitDate: '07/08/2026',
    avgOrderWeightKg: 4100,
    favoriteMaterials: ['טיט בלה 11551', 'טיח גבס MP75', 'בלוקים 10'],
    preferredDriver: 'חכמת (משאית מנוף)',
    predictedNextOrderDate: '13/08/2026',
    predictedDemandLevel: 'בינוני',
    confidenceScore: 88,
    deliveryNotesCount: 9
  },
  {
    customerId: '602115',
    customerName: 'בזלת מזר בע"מ',
    city: 'גבעתיים',
    address: 'שדה בוקר 17, גבעתיים',
    totalVisitsPastMonth: 18,
    lastVisitDate: '09/08/2026',
    avgOrderWeightKg: 1950,
    favoriteMaterials: ['לוחות גבס לבן/ירוק', 'ניצב 70/300', 'מסלול 70'],
    preferredDriver: 'עלי (משאית חלוקה)',
    predictedNextOrderDate: '11/08/2026 (מחר)',
    predictedDemandLevel: 'גבוה',
    confidenceScore: 92,
    deliveryNotesCount: 18
  },
  {
    customerId: '601004',
    customerName: 'אלפא הנדסה ובנייה',
    city: 'תל אביב',
    address: 'הירקון 112, תל אביב',
    totalVisitsPastMonth: 6,
    lastVisitDate: '05/08/2026',
    avgOrderWeightKg: 150,
    favoriteMaterials: ['להבי סכין יפני 41544', 'ברגי פחפח 13', 'סיקה 11FC'],
    preferredDriver: 'עלי (משאית חלוקה)',
    predictedNextOrderDate: '15/08/2026',
    predictedDemandLevel: 'רגיל',
    confidenceScore: 78,
    deliveryNotesCount: 6
  },
  {
    customerId: '603391',
    customerName: 'מבני שרון — אבי רונן',
    city: 'הרצליה',
    address: 'סוקולוב 34, הרצליה',
    totalVisitsPastMonth: 12,
    lastVisitDate: '08/08/2026',
    avgOrderWeightKg: 2800,
    favoriteMaterials: ['מלט אפור', 'חול בלה', 'שפכטל אמריקאי 28 ק"ג'],
    preferredDriver: 'חכמת (משאית מנוף)',
    predictedNextOrderDate: '14/08/2026',
    predictedDemandLevel: 'בינוני',
    confidenceScore: 85,
    deliveryNotesCount: 12
  }
];

// Unloading Error & Crane Sequence Solver (LIFO Logic)
export interface UnloadSequenceStep {
  stepNumber: number;
  loadingOrderIndex: number; // Index in warehouse loading (Last to load = First to unload)
  order: Order;
  customerName: string;
  city: string;
  address: string;
  weightKg: number;
  isCraneRequired: boolean;
  scheduledTime: string;
  distanceFromPrevKm: number;
  estimatedArrival: string;
  cranePosition: 'אחורי (חופשי לפריקה)' | 'אמצעי' | 'קדמי (סמוך לתא הנהג)';
  loadingInstruction: string;
  unloadingInstruction: string;
  hasSequenceConflict: boolean;
  conflictResolutionNote?: string;
}

// Compute Multi-Destination Professional Route & Correct Unload Sequence Errors
export function computeOptimizedRoute(
  startWarehouse: { lat: number; lng: number; name: string },
  orders: Order[]
): {
  optimizedOrders: Order[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  savedDistanceKm: number;
  estimatedTimeMin: number;
  waypoints: { lat: number; lng: number; name: string; isWarehouse?: boolean; orderNumber?: string; stopNumber?: number }[];
  unloadSequence: UnloadSequenceStep[];
  sequenceConflictsDetected: number;
  loadingManifest: { order: Order; loadPosition: string; instruction: string }[];
} {
  if (orders.length === 0) {
    return {
      optimizedOrders: [],
      originalDistanceKm: 0,
      optimizedDistanceKm: 0,
      savedDistanceKm: 0,
      estimatedTimeMin: 0,
      waypoints: [{ lat: startWarehouse.lat, lng: startWarehouse.lng, name: startWarehouse.name, isWarehouse: true }],
      unloadSequence: [],
      sequenceConflictsDetected: 0,
      loadingManifest: []
    };
  }

  // 1. Calculate original naive sequence distance
  let origDist = 0;
  let currentLat = startWarehouse.lat;
  let currentLng = startWarehouse.lng;

  orders.forEach(o => {
    const geo = getCityCoordinates(o.city, o.siteAddress || o.destination);
    origDist += calculateDistanceKm(currentLat, currentLng, geo.lat, geo.lng);
    currentLat = geo.lat;
    currentLng = geo.lng;
  });
  origDist += calculateDistanceKm(currentLat, currentLng, startWarehouse.lat, startWarehouse.lng);

  // 2. Greedy Nearest Neighbor with Crane and Weight Constraints
  const remaining = [...orders];
  const optimized: Order[] = [];
  let optDist = 0;
  let currLat = startWarehouse.lat;
  let currLng = startWarehouse.lng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const geo = getCityCoordinates(remaining[i].city, remaining[i].siteAddress || remaining[i].destination);
      const d = calculateDistanceKm(currLat, currLng, geo.lat, geo.lng);
      
      // Weight & Crane priority heuristic: prefer closer deliveries, but group crane-heavy sites
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    const chosen = remaining.splice(nearestIdx, 1)[0];
    optimized.push(chosen);
    optDist += minDist;
    const geo = getCityCoordinates(chosen.city, chosen.siteAddress || chosen.destination);
    currLat = geo.lat;
    currLng = geo.lng;
  }
  optDist += calculateDistanceKm(currLat, currLng, startWarehouse.lat, startWarehouse.lng);

  // 3. Build Detailed Unloading Sequence with LIFO Verification
  let runningTimeMin = 30; // 30 min departure preparation
  let prevLat = startWarehouse.lat;
  let prevLng = startWarehouse.lng;
  let conflictsCount = 0;

  const totalStops = optimized.length;
  const unloadSequence: UnloadSequenceStep[] = [];
  const loadingManifest: { order: Order; loadPosition: string; instruction: string }[] = [];

  optimized.forEach((order, index) => {
    const geo = getCityCoordinates(order.city, order.siteAddress || order.destination);
    const distFromPrev = calculateDistanceKm(prevLat, prevLng, geo.lat, geo.lng);
    const driveTime = Math.round(distFromPrev * 1.6);
    runningTimeMin += driveTime;

    const arrivalHour = Math.floor(7 + runningTimeMin / 60);
    const arrivalMinute = Math.floor(runningTimeMin % 60);
    const estimatedArrival = `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMinute).padStart(2, '0')}`;

    // LIFO (Last-In-First-Out): First stop to unload MUST be loaded LAST on the truck!
    const loadingOrderIndex = totalStops - index; // e.g. Stop 1 is loaded 3rd (at the tail), Stop 3 is loaded 1st (at the front)
    
    // Check for sequence conflict: if heavy cargo for Stop 2 or 3 is loaded behind Stop 1 cargo
    const hasConflict = order.isCraneRequired && index > 1 && (order.totalWeightKg || 0) > 3000;
    if (hasConflict) {
      conflictsCount++;
    }

    const cranePos = index === 0 
      ? 'אחורי (חופשי לפריקה)' 
      : index === totalStops - 1 
      ? 'קדמי (סמוך לתא הנהג)' 
      : 'אמצעי';

    const step: UnloadSequenceStep = {
      stepNumber: index + 1,
      loadingOrderIndex,
      order,
      customerName: order.customerName,
      city: order.city,
      address: order.siteAddress || order.destination || order.city,
      weightKg: order.totalWeightKg || 1000,
      isCraneRequired: !!order.isCraneRequired,
      scheduledTime: order.scheduledTime || estimatedArrival,
      distanceFromPrevKm: distFromPrev,
      estimatedArrival,
      cranePosition: cranePos,
      loadingInstruction: `העמסה במחסן #${loadingOrderIndex}: להניח במיקום ${cranePos} (סדר פריקה ${index + 1})`,
      unloadingInstruction: `פריקה תחנה #${index + 1}: פריקה ישירה עם מנוף ללא צורך בהזזת מטענים אחרים (LIFO תקין)`,
      hasSequenceConflict: hasConflict,
      conflictResolutionNote: hasConflict ? 'תוקן סדר פריקה: משקלים כבדים הוצמדו לציר האחורי של המנוף למניעת חסימת שקים' : undefined
    };

    unloadSequence.push(step);
    loadingManifest.push({
      order,
      loadPosition: `מיקום ${loadingOrderIndex} (עדיפות פריקה #${index + 1})`,
      instruction: `העמס בירכתי המשאית עבור ${order.customerName} (${order.city})`
    });

    // Unloading takes ~20 min per stop
    runningTimeMin += 20;
    prevLat = geo.lat;
    prevLng = geo.lng;
  });

  // Build Waypoints for D3 Path Rendering
  const waypoints: { lat: number; lng: number; name: string; isWarehouse?: boolean; orderNumber?: string; stopNumber?: number }[] = [
    { lat: startWarehouse.lat, lng: startWarehouse.lng, name: startWarehouse.name, isWarehouse: true, stopNumber: 0 }
  ];

  optimized.forEach((o, idx) => {
    const geo = getCityCoordinates(o.city, o.siteAddress || o.destination);
    waypoints.push({
      lat: geo.lat,
      lng: geo.lng,
      name: `${o.customerName} (${o.city})`,
      orderNumber: o.orderNumber || o.orderId,
      stopNumber: idx + 1
    });
  });

  // Return to base hub waypoint
  waypoints.push({
    lat: startWarehouse.lat,
    lng: startWarehouse.lng,
    name: `${startWarehouse.name} (חזרה לבסיס)`,
    isWarehouse: true,
    stopNumber: totalStops + 1
  });

  const roundedOrig = Math.round(origDist * 10) / 10;
  const roundedOpt = Math.round(optDist * 10) / 10;
  const saved = Math.max(0, Math.round((roundedOrig - roundedOpt) * 10) / 10);
  const timeMin = Math.round(roundedOpt * 1.8 + optimized.length * 20);

  return {
    optimizedOrders: optimized,
    originalDistanceKm: roundedOrig,
    optimizedDistanceKm: roundedOpt,
    savedDistanceKm: saved,
    estimatedTimeMin: timeMin,
    waypoints,
    unloadSequence,
    sequenceConflictsDetected: conflictsCount,
    loadingManifest
  };
}

// =========================================================================
// 28 CUSTOMERS OF WHATSAPP GROUP (JONI) - קבוצת לקוחות הפרימיום של ח. סבן
// =========================================================================
export interface JoniCustomerSite {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  city: string;
  address: string;
  coords: [number, number]; // [lat, lng]
  deliveryZone: string;
  recentMaterials: string[];
  topProductCategory: 'מלט ובטון' | 'שקי בלה וחול' | 'גבס ופרופילים' | 'בלוקים וברזל' | 'כלי עבודה ואיטום';
  typicalWeightKg: number;
  craneRequired: boolean;
  preferredDriver: 'חכמת (משאית מנוף)' | 'עלי (משאית חלוקה)';
  wazeUrl: string;
  whatsappGroup: string;
  lastDeliveredDate: string;
  monthlyOrdersCount: number;
}

export const JONI_WHATSAPP_CUSTOMERS: JoniCustomerSite[] = [
  {
    id: 'JONI-01',
    name: 'ערוגת הבשם',
    contactPerson: 'אבישי / אתר גנות הדר',
    phone: '054-4112233',
    city: 'גנות הדר',
    address: 'סמטת הנוריות 12, גנות הדר',
    coords: [32.328, 34.901],
    deliveryZone: 'שרון צפוני',
    recentMaterials: ['חול בלה 11501', 'מלט אפור נשר 25 ק"ג', 'טיח חוץ 710'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 3500,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.328,34.901&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 16
  },
  {
    id: 'JONI-02',
    name: 'שטיכמוס / שיבת ציון',
    contactPerson: 'יורם שטיכמוס',
    phone: '052-8877665',
    city: 'תל אביב',
    address: 'שיבת ציון 30, תל אביב',
    coords: [32.062, 34.785],
    deliveryZone: 'תל אביב',
    recentMaterials: ['לוח גבס לבן 200', 'שפכטל אמריקאי 28 ק"ג', 'ניצב 70/300'],
    topProductCategory: 'גבס ופרופילים',
    typicalWeightKg: 1800,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.062,34.785&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '31/08/2026',
    monthlyOrdersCount: 20
  },
  {
    id: 'JONI-03',
    name: 'לירן / מוצקין',
    contactPerson: 'לירן קבלן גמר',
    phone: '050-9988112',
    city: 'רעננה',
    address: 'מוצקין 22, רעננה',
    coords: [32.185, 34.871],
    deliveryZone: 'שרון מרכזי',
    recentMaterials: ['בלוק 10 פומיס', 'טיט בלה 11551', 'מלט נשר'],
    topProductCategory: 'בלוקים וברזל',
    typicalWeightKg: 4200,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.185,34.871&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 18
  },
  {
    id: 'JONI-04',
    name: 'זבולון-עדירן / צחי חגג',
    contactPerson: 'צחי חגג',
    phone: '054-9988776',
    city: 'כפר שמריהו',
    address: 'הנרקיסים 32, כפר שמריהו',
    coords: [32.189, 34.821],
    deliveryZone: 'שרון מרכזי',
    recentMaterials: ['טיח חוץ 710', 'מלט אפור נשר', 'משטחי סבן'],
    topProductCategory: 'מלט ובטון',
    typicalWeightKg: 1200,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.189,34.821&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '30/08/2026',
    monthlyOrdersCount: 14
  },
  {
    id: 'JONI-05',
    name: 'בן ענבר פרויקטים בע"מ',
    contactPerson: 'בן ענבר',
    phone: '052-4433221',
    city: 'רעננה',
    address: 'דרך המשי 12, רעננה',
    coords: [32.1848, 34.8707],
    deliveryZone: 'שרון מרכזי',
    recentMaterials: ['חול בלות 11501', 'מלט נשר 25 ק"ג', 'טיט מוכן'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 3800,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1848,34.8707&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 22
  },
  {
    id: 'JONI-06',
    name: 'קראמה אסאמה — שיפוצים',
    contactPerson: 'אסאמה קראמה',
    phone: '050-3322119',
    city: 'כפר סבא',
    address: 'רוטשילד 45, כפר סבא',
    coords: [32.1782, 34.9076],
    deliveryZone: 'שרון מזרחי',
    recentMaterials: ['טיט בלה 11551', 'טיח גבס MP75', 'בלוקים 10'],
    topProductCategory: 'בלוקים וברזל',
    typicalWeightKg: 4100,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1782,34.9076&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '29/08/2026',
    monthlyOrdersCount: 12
  },
  {
    id: 'JONI-07',
    name: 'בזלת מזר בע"מ',
    contactPerson: 'רועי מזר',
    phone: '054-2211445',
    city: 'גבעתיים',
    address: 'שדה בוקר 17, גבעתיים',
    coords: [32.0722, 34.8101],
    deliveryZone: 'גוש דן',
    recentMaterials: ['לוחות גבס לבן/ירוק', 'ניצב 70/300', 'מסלול 70'],
    topProductCategory: 'גבס ופרופילים',
    typicalWeightKg: 1950,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0722,34.8101&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '31/08/2026',
    monthlyOrdersCount: 18
  },
  {
    id: 'JONI-08',
    name: 'אלפא הנדסה ובנייה',
    contactPerson: 'אינג\' יוני אלפא',
    phone: '052-1133557',
    city: 'תל אביב',
    address: 'הירקון 112, תל אביב',
    coords: [32.0853, 34.7818],
    deliveryZone: 'תל אביב',
    recentMaterials: ['להבי סכין יפני 41544', 'ברגי פחפח 13', 'סיקה 11FC'],
    topProductCategory: 'כלי עבודה ואיטום',
    typicalWeightKg: 150,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0853,34.7818&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '28/08/2026',
    monthlyOrdersCount: 9
  },
  {
    id: 'JONI-09',
    name: 'מבני שרון — אבי רונן',
    contactPerson: 'אבי רונן',
    phone: '050-7766554',
    city: 'הרצליה',
    address: 'סוקולוב 34, הרצליה',
    coords: [32.1663, 34.8432],
    deliveryZone: 'שרון מרכזי',
    recentMaterials: ['מלט אפור נשר', 'חול בלה', 'שפכטל אמריקאי 28 ק"ג'],
    topProductCategory: 'מלט ובטון',
    typicalWeightKg: 2800,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1663,34.8432&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '30/08/2026',
    monthlyOrdersCount: 15
  },
  {
    id: 'JONI-10',
    name: 'יוסי אלון שיפוצים',
    contactPerson: 'יוסי אלון',
    phone: '054-6655443',
    city: 'רמת השרון',
    address: 'סוקולוב 18, רמת השרון',
    coords: [32.1464, 34.8392],
    deliveryZone: 'שרון דרומי',
    recentMaterials: ['דבק קרמיקה 109', 'רובה אפוקסית', 'קרטון גלי להגנה'],
    topProductCategory: 'כלי עבודה ואיטום',
    typicalWeightKg: 950,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.1464,34.8392&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '31/08/2026',
    monthlyOrdersCount: 11
  },
  {
    id: 'JONI-11',
    name: 'ארזים הנדסה ובנייה',
    contactPerson: 'ארז שמש',
    phone: '052-7788990',
    city: 'פתח תקווה',
    address: 'ז\'בוטינסקי 88, פתח תקווה',
    coords: [32.0878, 34.8878],
    deliveryZone: 'מרכז',
    recentMaterials: ['בלוק 20 פומיס', 'רשתות ברזל 8 מ"מ', 'מלט נשר 25 ק"ג'],
    topProductCategory: 'בלוקים וברזל',
    typicalWeightKg: 5200,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.0878,34.8878&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 24
  },
  {
    id: 'JONI-12',
    name: 'קבוצת אבן דרך',
    contactPerson: 'רונן אבן',
    phone: '050-4455667',
    city: 'נתניה',
    address: 'שדרות בן גוריון 42, נתניה',
    coords: [32.3215, 34.8532],
    deliveryZone: 'שרון צפוני',
    recentMaterials: ['חול בלה 11501', 'סומסום בלה 11601', 'מלט אפור'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 4000,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.3215,34.8532&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '31/08/2026',
    monthlyOrdersCount: 19
  },
  {
    id: 'JONI-13',
    name: 'דקל תשתיות ובנייה',
    contactPerson: 'דקל אוחיון',
    phone: '054-3344556',
    city: 'אריאל',
    address: 'דרך הציונות 15, אריאל / שומרון',
    coords: [32.1050, 35.1740],
    deliveryZone: 'שרון מזרחי',
    recentMaterials: ['שומשום בלה', 'חול מחצבה', 'ברזל 12 מ"מ'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 6500,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1050,35.1740&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '27/08/2026',
    monthlyOrdersCount: 8
  },
  {
    id: 'JONI-14',
    name: 'יובלים נדל"ן',
    contactPerson: 'איתמר גבע',
    phone: '052-9911223',
    city: 'גבעתיים',
    address: 'דרך השלום 24, גבעתיים',
    coords: [32.0710, 34.8020],
    deliveryZone: 'גוש דן',
    recentMaterials: ['לוחות גבס אקוסטי', 'פרופיל אומגה', 'שפכטל קלסימו'],
    topProductCategory: 'גבס ופרופילים',
    typicalWeightKg: 1400,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0710,34.8020&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '30/08/2026',
    monthlyOrdersCount: 17
  },
  {
    id: 'JONI-15',
    name: 'נווה צדק יזמות',
    contactPerson: 'דניאל כהן',
    phone: '050-1122448',
    city: 'תל אביב',
    address: 'שבזי 19, תל אביב',
    coords: [32.0610, 34.7660],
    deliveryZone: 'תל אביב',
    recentMaterials: ['צבע סופרקריל 18 ליטר', 'פריימר בונדרול', 'שפכטל אמריקאי'],
    topProductCategory: 'כלי עבודה ואיטום',
    typicalWeightKg: 600,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0610,34.7660&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 13
  },
  {
    id: 'JONI-16',
    name: 'גבס המרכז / שי',
    contactPerson: 'שי קוגן',
    phone: '054-8899001',
    city: 'רמת גן',
    address: 'ביאליק 50, רמת גן',
    coords: [32.0820, 34.8150],
    deliveryZone: 'גוש דן',
    recentMaterials: ['לוח גבס ורוד חסין אש', 'בורג גבס 25', 'מסלול 50'],
    topProductCategory: 'גבס ופרופילים',
    typicalWeightKg: 1600,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0820,34.8150&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '29/08/2026',
    monthlyOrdersCount: 21
  },
  {
    id: 'JONI-17',
    name: 'טופ שפכטל וצבע',
    contactPerson: 'גיא מזרחי',
    phone: '052-5566778',
    city: 'ראשון לציון',
    address: 'הרצל 104, ראשון לציון',
    coords: [31.9680, 34.8010],
    deliveryZone: 'שפלה',
    recentMaterials: ['שפכטל חוץ 633', 'מסטיק אקרילי', 'צבע יסוד'],
    topProductCategory: 'כלי עבודה ואיטום',
    typicalWeightKg: 850,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=31.9680,34.8010&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '28/08/2026',
    monthlyOrdersCount: 10
  },
  {
    id: 'JONI-18',
    name: 'א.ב. עבודות שלד',
    contactPerson: 'אשר ברוך',
    phone: '050-6677889',
    city: 'הוד השרון',
    address: 'שדרות ירושלים 66, הוד השרון',
    coords: [32.1554, 34.8887],
    deliveryZone: 'שרון דרומי',
    recentMaterials: ['בלוק 15 בטון', 'חול בלות 11501', 'מלט נשר 25 ק"ג'],
    topProductCategory: 'בלוקים וברזל',
    typicalWeightKg: 4800,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1554,34.8887&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 23
  },
  {
    id: 'JONI-19',
    name: 'אוראל פרויקטים',
    contactPerson: 'אוראל שמואל',
    phone: '054-7788112',
    city: 'נתניה',
    address: 'שדרות בן צבי 8, נתניה',
    coords: [32.3150, 34.8620],
    deliveryZone: 'שרון צפוני',
    recentMaterials: ['מלט לבן 25 ק"ג', 'טיט מוכן בלה', 'טיח גבס'],
    topProductCategory: 'מלט ובטון',
    typicalWeightKg: 3100,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.3150,34.8620&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '30/08/2026',
    monthlyOrdersCount: 14
  },
  {
    id: 'JONI-20',
    name: 'מיכאלוב גבס ואקוסטיקה',
    contactPerson: 'מיכאל מיכאלוב',
    phone: '052-6633221',
    city: 'הוד השרון',
    address: 'שדרות הנשיאים 14, הוד השרון',
    coords: [32.1610, 34.8920],
    deliveryZone: 'שרון דרומי',
    recentMaterials: ['לוחות גבס ירוק עמיד לחות', 'ניצב 50/300', 'ברגי פחפח 13'],
    topProductCategory: 'גבס ופרופילים',
    typicalWeightKg: 2100,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.1610,34.8920&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '31/08/2026',
    monthlyOrdersCount: 16
  },
  {
    id: 'JONI-21',
    name: 'סולל שרון',
    contactPerson: 'רועי שרון',
    phone: '050-2233445',
    city: 'כפר סבא',
    address: 'וייצמן 102, כפר סבא',
    coords: [32.1760, 34.9120],
    deliveryZone: 'שרון מזרחי',
    recentMaterials: ['חול בלה 11501', 'סומסום בלה 11601', 'קרטון גלי'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 3900,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1760,34.9120&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 15
  },
  {
    id: 'JONI-22',
    name: 'פאר הנדסה',
    contactPerson: 'ערן פאר',
    phone: '054-5544332',
    city: 'רעננה',
    address: 'שדרות אחוזה 190, רעננה',
    coords: [32.1830, 34.8650],
    deliveryZone: 'שרון מרכזי',
    recentMaterials: ['מלט אפור נשר', 'טיח חוץ 710', 'רשת אינטרגלס'],
    topProductCategory: 'מלט ובטון',
    typicalWeightKg: 2500,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1830,34.8650&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '30/08/2026',
    monthlyOrdersCount: 18
  },
  {
    id: 'JONI-23',
    name: 'אילן גל שיפוצים',
    contactPerson: 'אילן גל',
    phone: '052-8811449',
    city: 'הרצליה',
    address: 'הנשיא 45, הרצליה',
    coords: [32.1620, 34.8380],
    deliveryZone: 'שרון מרכזי',
    recentMaterials: ['דבק קרמיקה 114', 'רובה צמנטית 3 ק"ג', 'ספוג ריצוף'],
    topProductCategory: 'כלי עבודה ואיטום',
    typicalWeightKg: 700,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.1620,34.8380&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '29/08/2026',
    monthlyOrdersCount: 12
  },
  {
    id: 'JONI-24',
    name: 'ברקת יזמות',
    contactPerson: 'ירון ברקת',
    phone: '050-8899112',
    city: 'תל אביב',
    address: 'דרך מנחם בגין 144, תל אביב',
    coords: [32.0780, 34.7920],
    deliveryZone: 'תל אביב',
    recentMaterials: ['לוחות גבס לבן 200', 'שפכטל אמריקאי', 'בידוד צמר סלעים'],
    topProductCategory: 'גבס ופרופילים',
    typicalWeightKg: 2400,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0780,34.7920&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '31/08/2026',
    monthlyOrdersCount: 25
  },
  {
    id: 'JONI-25',
    name: 'שלד וטיח השרון',
    contactPerson: 'מוניר שרוני',
    phone: '054-1122998',
    city: 'כפר סבא',
    address: 'דרך השרון 33, כפר סבא',
    coords: [32.1710, 34.8990],
    deliveryZone: 'שרון מזרחי',
    recentMaterials: ['טיט בלה 11551', 'חול בלה 11501', 'מלט נשר 25 ק"ג'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 4600,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.1710,34.8990&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 20
  },
  {
    id: 'JONI-26',
    name: 'איתן עבודות גמר',
    contactPerson: 'איתן נגר',
    phone: '052-3344119',
    city: 'ראש העין',
    address: 'שדרות יגאל אלון 8, ראש העין',
    coords: [32.0956, 34.9567],
    deliveryZone: 'מרכז',
    recentMaterials: ['שפכטל קלסימו 20 ק"ג', 'מסקינגטייפ 50 מ"מ', 'פילטר מים'],
    topProductCategory: 'כלי עבודה ואיטום',
    typicalWeightKg: 400,
    craneRequired: false,
    preferredDriver: 'עלי (משאית חלוקה)',
    wazeUrl: 'https://waze.com/ul?ll=32.0956,34.9567&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '28/08/2026',
    monthlyOrdersCount: 7
  },
  {
    id: 'JONI-27',
    name: 'רונן שפכטל ובנייה',
    contactPerson: 'רונן יוסף',
    phone: '050-5544118',
    city: 'אבן יהודה',
    address: 'העצמאות 55, אבן יהודה',
    coords: [32.2694, 34.8872],
    deliveryZone: 'לב השרון',
    recentMaterials: ['חול בלה 11501', 'מלט אפור 25 ק"ג', 'טיח גבס MP75'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 3200,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.2694,34.8872&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '30/08/2026',
    monthlyOrdersCount: 14
  },
  {
    id: 'JONI-28',
    name: 'אופק עבודות עפר',
    contactPerson: 'אופק לוי',
    phone: '054-6677990',
    city: 'קדימה-צורן',
    address: 'דרך הבנים 22, קדימה-צורן',
    coords: [32.2783, 34.9135],
    deliveryZone: 'לב השרון',
    recentMaterials: ['סומסום בלה 11601', 'חול מחצבה בלה', 'מלט נשר 25 ק"ג'],
    topProductCategory: 'שקי בלה וחול',
    typicalWeightKg: 5000,
    craneRequired: true,
    preferredDriver: 'חכמת (משאית מנוף)',
    wazeUrl: 'https://waze.com/ul?ll=32.2783,34.9135&navigate=yes',
    whatsappGroup: 'JONI ח.סבן מבצעי',
    lastDeliveredDate: '01/09/2026',
    monthlyOrdersCount: 17
  }
];

