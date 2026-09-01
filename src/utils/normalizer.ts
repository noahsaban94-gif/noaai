import { LOGISTICS_DICTIONARY } from '../data/mockData';
import { LogisticsDictionaryItem, NormalizedOrderExtraction, OrderItem, WarehouseId } from '../types';

/**
 * Normalizes Hebrew text quantity words (שלוש -> 3, שני/שניים -> 2, etc.)
 */
function normalizeHebrewNumbers(text: string): string {
  const numberWords: Record<string, string> = {
    'אחד': '1', 'אחת': '1',
    'שתיים': '2', 'שניים': '2', 'שני': '2', 'שתי': '2',
    'שלוש': '3', 'שלושה': '3',
    'ארבע': '4', 'ארבעה': '4',
    'חמש': '5', 'חמישה': '5',
    'שש': '6', 'שישה': '6',
    'שבע': '7', 'שבעה': '7',
    'שמונה': '8',
    'תשע': '9', 'תשעה': '9',
    'עשר': '10', 'עשרה': '10',
    'עשרים': '20',
    'שלושים': '30',
    'ארבעים': '40',
    'חמישים': '50',
    'מאה': '100',
    'מאתיים': '200'
  };

  let normalized = text;
  for (const [word, num] of Object.entries(numberWords)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, num);
  }
  return normalized;
}

/**
 * Extract matched items from free text against Table 1 "מילון_לוגיסטי"
 */
export function normalizeOrderText(rawText: string): NormalizedOrderExtraction {
  const clean = normalizeHebrewNumbers(rawText || '');
  const lines = clean.split(/[\n,;+]/).map(l => l.trim()).filter(Boolean);

  const matchedItems: Array<{
    sku: string;
    officialName: string;
    quantity: number;
    unit: string;
    matchedKeyword: string;
  }> = [];

  // Also test against full text if single line
  const searchSegments = lines.length > 0 ? lines : [clean];

  for (const segment of searchSegments) {
    let matchedInSegment = false;

    // Check each dictionary entry
    for (const dictItem of LOGISTICS_DICTIONARY) {
      const keywords = dictItem.keywords.split(',').map(k => k.trim().toLowerCase());
      
      for (const kw of keywords) {
        if (!kw) continue;
        const kwRegex = new RegExp(`(^|\\s|\\D)(${kw})(\\s|\\D|$)`, 'i');

        if (kwRegex.test(segment.toLowerCase()) || segment.toLowerCase().includes(kw)) {
          // Extract quantity preceding or following keyword
          // E.g. "3 להבים", "להבים 3", "25 שקים מלט", "4 בלות"
          let qty = 1;
          const qtyMatch = segment.match(/(\d+(\.\d+)?)/);
          if (qtyMatch) {
            qty = parseFloat(qtyMatch[1]);
          }

          // Avoid duplicate SKU in same match
          const existing = matchedItems.find(i => i.sku === dictItem.sku);
          if (existing) {
            existing.quantity = Math.max(existing.quantity, qty);
          } else {
            matchedItems.push({
              sku: dictItem.sku,
              officialName: dictItem.officialName,
              quantity: qty,
              unit: dictItem.unit,
              matchedKeyword: kw
            });
          }
          matchedInSegment = true;
          break;
        }
      }
      if (matchedInSegment) break;
    }
  }

  // If no segment match, do a greedy token search across the entire raw text
  if (matchedItems.length === 0) {
    for (const dictItem of LOGISTICS_DICTIONARY) {
      const keywords = dictItem.keywords.split(',').map(k => k.trim().toLowerCase());
      for (const kw of keywords) {
        if (clean.toLowerCase().includes(kw)) {
          // Look for number near the keyword
          const idx = clean.toLowerCase().indexOf(kw);
          const nearbyText = clean.substring(Math.max(0, idx - 20), Math.min(clean.length, idx + kw.length + 20));
          const numMatch = nearbyText.match(/(\d+)/);
          const qty = numMatch ? parseInt(numMatch[1], 10) : 1;

          if (!matchedItems.find(i => i.sku === dictItem.sku)) {
            matchedItems.push({
              sku: dictItem.sku,
              officialName: dictItem.officialName,
              quantity: qty,
              unit: dictItem.unit,
              matchedKeyword: kw
            });
          }
          break;
        }
      }
    }
  }

  // Format normalized string as requested: "(מק"ט: [SKU] - [שם] כמות: [מספר])"
  const formattedParts = matchedItems.map(item => 
    `(מק"ט: ${item.sku} - ${item.officialName} כמות: ${item.quantity})`
  );

  const normalizedItemsString = formattedParts.join(', ');

  // Customer Name & Destination Heuristics
  let customerName = 'לקוח כללי / הזמנת וואטסאפ';
  let destination = 'אתר בנייה — מרכז / שרון';
  let city = 'רעננה';

  if (/בן ענבר/i.test(rawText)) {
    customerName = 'בן ענבר פרויקטים בע"מ';
    destination = 'דרך המשי 12, רעננה';
    city = 'רעננה';
  } else if (/קראמה|אסאמה/i.test(rawText)) {
    customerName = 'קראמה אסאמה — שיפוצים';
    destination = 'רוטשילד 45, כפר סבא';
    city = 'כפר סבא';
  } else if (/בזלת|מזר/i.test(rawText)) {
    customerName = 'בזלת מזר בע"מ';
    destination = 'שדה בוקר 17, גבעתיים';
    city = 'גבעתיים';
  } else if (/אלפא|הנדסה/i.test(rawText)) {
    customerName = 'אלפא הנדסה ובנייה';
    destination = 'הירקון 112, תל אביב';
    city = 'תל אביב';
  } else if (/מבני שרון|רונן/i.test(rawText)) {
    customerName = 'מבני שרון — אבי רונן';
    destination = 'סוקולוב 34, הרצליה';
    city = 'הרצליה';
  }

  // Calculate deposits
  let bigBags = 0;
  let pallets = 0;
  let hasHeavyCementOrBag = false;

  matchedItems.forEach(item => {
    if (item.sku === '11501' || item.sku === '11551') {
      bigBags += item.quantity;
      hasHeavyCementOrBag = true;
    }
    if (item.sku === '10002' || item.sku === '14075') {
      if (item.quantity >= 20) {
        pallets += Math.ceil(item.quantity / 40);
      }
      hasHeavyCementOrBag = true;
    }
  });

  const isCraneRequired = hasHeavyCementOrBag || bigBags > 0;
  const assignedDriver = isCraneRequired ? 'חכמת (משאית מנוף)' : 'עלי (משאית חלוקה)';

  return {
    customerName,
    destination,
    city,
    assignedDriver,
    normalizedItemsString: normalizedItemsString || '(לא זוהו פריטים במילון הלוגיסטי)',
    rawText,
    items: matchedItems,
    bigBags,
    pallets,
    isCraneRequired
  };
}
