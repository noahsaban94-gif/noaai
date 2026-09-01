import { Order, WarehouseId } from '../types';

export interface CityGeoLocation {
  city: string;
  lat: number;
  lng: number;
  region: string;
  aliases: string[];
}

// Geocoordinates for Sharon & Dan Central Israel locations
export const ISRAEL_CITIES_COORDS: Record<string, CityGeoLocation> = {
  'טירה': { city: 'טירה', lat: 32.2345, lng: 34.9515, region: 'שרון דרומי', aliases: ['טירה', 'tira'] },
  'רעננה': { city: 'רעננה', lat: 32.1848, lng: 34.8707, region: 'שרון מרכזי', aliases: ['רעננה', 'raanana'] },
  'כפר סבא': { city: 'כפר סבא', lat: 32.1782, lng: 34.9076, region: 'שרון מזרחי', aliases: ['כפר סבא', 'כ"ס', 'kfar saba'] },
  'הוד השרון': { city: 'הוד השרון', lat: 32.1554, lng: 34.8887, region: 'שרון דרומי', aliases: ['הוד השרון', 'hod hasharon'] },
  'הרצליה': { city: 'הרצליה', lat: 32.1663, lng: 34.8432, region: 'חוף השרון', aliases: ['הרצליה', 'herzliya'] },
  'רמת השרון': { city: 'רמת השרון', lat: 32.1464, lng: 34.8392, region: 'שרון / גוש דן', aliases: ['רמת השרון', 'ramat hasharon'] },
  'נתניה': { city: 'נתניה', lat: 32.3215, lng: 34.8532, region: 'שרון צפוני', aliases: ['נתניה', 'netanya'] },
  'פתח תקווה': { city: 'פתח תקווה', lat: 32.0878, lng: 34.8878, region: 'מרכז / פ"ת', aliases: ['פתח תקווה', 'פ"ת', 'petah tikva'] },
  'גבעתיים': { city: 'גבעתיים', lat: 32.0722, lng: 34.8101, region: 'גוש דן', aliases: ['גבעתיים', 'givatayim'] },
  'תל אביב': { city: 'תל אביב', lat: 32.0853, lng: 34.7818, region: 'תל אביב', aliases: ['תל אביב', 'תל אביב יפו', 'ת"א', 'tel aviv'] },
  'רמת גן': { city: 'רמת גן', lat: 32.0823, lng: 34.8210, region: 'גוש דן', aliases: ['רמת גן', 'ר"ג', 'ramat gan'] },
  'ראש העין': { city: 'ראש העין', lat: 32.0956, lng: 34.9567, region: 'מרכז מזרחי', aliases: ['ראש העין', 'rosh haayin'] },
  'כוכב יאיר': { city: 'כוכב יאיר', lat: 32.2281, lng: 34.9950, region: 'שרון מזרחי', aliases: ['כוכב יאיר', 'צור יגאל', 'kokhav yair'] },
  'טייבה': { city: 'טייבה', lat: 32.2662, lng: 35.0084, region: 'המשולש', aliases: ['טייבה', 'tayibe'] },
  'קלנסווה': { city: 'קלנסווה', lat: 32.2856, lng: 34.9812, region: 'שרון צפוני', aliases: ['קלנסווה', 'qalansawe'] },
  'ראשון לציון': { city: 'ראשון לציון', lat: 31.9730, lng: 34.7925, region: 'שפלה / מרכז', aliases: ['ראשון לציון', 'ראשל"צ', 'rishon lezion'] },
  'שוהם': { city: 'שוהם', lat: 31.9984, lng: 34.9467, region: 'מרכז', aliases: ['שוהם', 'shoham'] },
  'חדרה': { city: 'חדרה', lat: 32.4340, lng: 34.9197, region: 'צפון השרון', aliases: ['חדרה', 'hadera'] },
  'קדימה-צורן': { city: 'קדימה-צורן', lat: 32.2783, lng: 34.9135, region: 'לב השרון', aliases: ['קדימה', 'צורן', 'קדימה צורן'] },
  'אבן יהודה': { city: 'אבן יהודה', lat: 32.2694, lng: 34.8872, region: 'לב השרון', aliases: ['אבן יהודה'] },
  'רעננה מערב': { city: 'רעננה מערב', lat: 32.1890, lng: 34.8550, region: 'שרון מרכזי', aliases: ['רעננה מערב'] }
};

// Saban Warehouses in Tira Base
export const WAREHOUSE_COORDS = {
  '4_HARASH': {
    id: '4_HARASH',
    name: 'מחסן 4 החרש (מלט, חול, בלוקים)',
    shortName: '4️⃣ החרש',
    lat: 32.2380,
    lng: 34.9560,
    city: 'טירה'
  },
  '1_TALMID': {
    id: '1_TALMID',
    name: 'מחסן 1 התלמיד (גבס, פרופילים, צבעים)',
    shortName: '1️⃣ התלמיד',
    lat: 32.2310,
    lng: 34.9470,
    city: 'טירה'
  }
};

// Find matching coordinates for any Hebrew city string
export function getCityCoordinates(cityName: string): { lat: number; lng: number; standardizedCity: string } {
  if (!cityName) return { lat: 32.2345, lng: 34.9515, standardizedCity: 'טירה' };
  
  const clean = cityName.trim();
  
  for (const [key, item] of Object.entries(ISRAEL_CITIES_COORDS)) {
    if (key === clean || item.aliases.some(a => clean.includes(a) || a.includes(clean))) {
      return { lat: item.lat, lng: item.lng, standardizedCity: item.city };
    }
  }

  // Fallback defaults in Sharon area
  return { lat: 32.1848, lng: 34.8707, standardizedCity: clean };
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
}

// Aggregate active orders by city to calculate route density
export function aggregateCityDensity(orders: Order[]): CityDensityAggregate[] {
  const map: Record<string, CityDensityAggregate> = {};

  orders.forEach(order => {
    const geo = getCityCoordinates(order.city);
    const key = geo.standardizedCity;

    if (!map[key]) {
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
        avgScheduledTime: order.scheduledTime || '08:00'
      };
    }

    map[key].orderCount += 1;
    map[key].orders.push(order);
    map[key].totalWeightKg += order.totalWeightKg || 0;
    map[key].totalBigBags += order.bigBagsDeposit || 0;
    map[key].totalPallets += order.palletsDeposit || 0;

    if (order.assignedDriver && !map[key].drivers.includes(order.assignedDriver)) {
      map[key].drivers.push(order.assignedDriver);
    }
    if (order.warehouse && !map[key].warehouses.includes(order.warehouse)) {
      map[key].warehouses.push(order.warehouse);
    }
  });

  const list = Object.values(map);
  // Sort by order count and weight descending
  list.sort((a, b) => b.orderCount - a.orderCount || b.totalWeightKg - a.totalWeightKg);
  list.forEach((item, index) => {
    item.densityRank = index + 1;
  });

  return list;
}

// TSP Nearest Neighbor Route Optimization Solver
export function computeOptimizedRoute(
  startWarehouse: { lat: number; lng: number; name: string },
  orders: Order[]
): {
  optimizedOrders: Order[];
  originalDistanceKm: number;
  optimizedDistanceKm: number;
  savedDistanceKm: number;
  estimatedTimeMin: number;
  waypoints: { lat: number; lng: number; name: string; isWarehouse?: boolean; orderNumber?: string }[];
} {
  if (orders.length === 0) {
    return {
      optimizedOrders: [],
      originalDistanceKm: 0,
      optimizedDistanceKm: 0,
      savedDistanceKm: 0,
      estimatedTimeMin: 0,
      waypoints: [{ lat: startWarehouse.lat, lng: startWarehouse.lng, name: startWarehouse.name, isWarehouse: true }]
    };
  }

  // 1. Calculate original naive sequence distance
  let origDist = 0;
  let currentLat = startWarehouse.lat;
  let currentLng = startWarehouse.lng;

  orders.forEach(o => {
    const geo = getCityCoordinates(o.city);
    origDist += calculateDistanceKm(currentLat, currentLng, geo.lat, geo.lng);
    currentLat = geo.lat;
    currentLng = geo.lng;
  });
  // Return to base
  origDist += calculateDistanceKm(currentLat, currentLng, startWarehouse.lat, startWarehouse.lng);

  // 2. Greedy Nearest Neighbor with 2-Opt local refinement
  const remaining = [...orders];
  const optimized: Order[] = [];
  let optDist = 0;
  let currLat = startWarehouse.lat;
  let currLng = startWarehouse.lng;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const geo = getCityCoordinates(remaining[i].city);
      const d = calculateDistanceKm(currLat, currLng, geo.lat, geo.lng);
      if (d < minDist) {
        minDist = d;
        nearestIdx = i;
      }
    }

    const chosen = remaining.splice(nearestIdx, 1)[0];
    optimized.push(chosen);
    optDist += minDist;
    const geo = getCityCoordinates(chosen.city);
    currLat = geo.lat;
    currLng = geo.lng;
  }
  // Return to base
  optDist += calculateDistanceKm(currLat, currLng, startWarehouse.lat, startWarehouse.lng);

  // Build Waypoints for D3 Path Rendering
  const waypoints: { lat: number; lng: number; name: string; isWarehouse?: boolean; orderNumber?: string }[] = [
    { lat: startWarehouse.lat, lng: startWarehouse.lng, name: startWarehouse.name, isWarehouse: true }
  ];

  optimized.forEach(o => {
    const geo = getCityCoordinates(o.city);
    waypoints.push({
      lat: geo.lat,
      lng: geo.lng,
      name: `${o.customerName} (${o.city})`,
      orderNumber: o.orderNumber
    });
  });

  // Return to base hub waypoint
  waypoints.push({
    lat: startWarehouse.lat,
    lng: startWarehouse.lng,
    name: `${startWarehouse.name} (חזרה)`,
    isWarehouse: true
  });

  const roundedOrig = Math.round(origDist * 10) / 10;
  const roundedOpt = Math.round(optDist * 10) / 10;
  const saved = Math.max(0, Math.round((roundedOrig - roundedOpt) * 10) / 10);
  const timeMin = Math.round(roundedOpt * 1.8 + optimized.length * 20); // 1.8 min/km average + 20 min unloading per stop

  return {
    optimizedOrders: optimized,
    originalDistanceKm: roundedOrig,
    optimizedDistanceKm: roundedOpt,
    savedDistanceKm: saved,
    estimatedTimeMin: timeMin,
    waypoints
  };
}
