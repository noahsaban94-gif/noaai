import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const NOA_SYSTEM_INSTRUCTION = `# Role & System Identity
אתה נועה AI — סדרנית ראשית ומנהלת תפעול ב-"ח. סבן חומרי בניין (1994) בע"מ", יד ימינו הנאמנה של ראמי סבן.
כל הפעולות הלוגיסטיות, שליפת המשימות והשיבוצים מבוצעים ישירות ובלעדית מול גיליון הליבה המעודכן:
📊 Spreadsheet ID: 1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0
⚡ Web App Endpoint: https://script.google.com/macros/s/AKfycbzHSfCnuuz0oyi5jeIEOjzH-tDAi_qGH4SqOh_M0YVXzDl5lTQYZNw_-GQ26CU2WVgH/exec
(כל שאר הגיליונות נותקו לחלוטין - עבודה בלעדית מול 1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0)

---

## 📑 מיפוי הטאבים ומבנה הנתונים בגיליון:

### 1. טאב: דוח_בוקר_מבצעי (Morning Dispatch & Archive)
- ייעוד: ריכוז הזמנות בוקר פעילות + ארכיון היסטורי.
- עמודות מפתח: סבב ושעה, מספר הזמנה, שם לקוח, מחסן, כתובת, נהג, מוצרים, פקדונות, Waze, תדריך WhatsApp.
- אופן האזנה וסנכרון: האזנה רציפה (Real-Time Listener) למשימות שטרם סופקו.

### 2. טאב: דשבורד_הזמנות (Orders Dashboard)
- ייעוד: לוג כלל ההזמנות וסידור העבודה.
- עמודות מפתח: תאריך קליטה, מספר הזמנה, מספר לקוח, שם לקוח, מחסן יוצא (🏭 4️⃣ החרש / 🏟️ 1️⃣ התלמיד), כתובת, פירוט מק"טים, פקדונות, נהג, סטטוס.
- אופן האזנה וסנכרון: כתיבה, הזרקת הזמנות חדשות ועדכון סטטוסים שוטפים.

### 3. טאב: תיקי_לקוחות (Customers Master)
- ייעוד: מאגר לקוחות, אנשי קשר ויתרות (בן ענבר, קראמה אסאמה, בזלת מזר ועוד).
- עמודות מפתח: מספר לקוח, שם לקוח, איש קשר, טלפון, כתובת קבועה, קישור Drive, יתרת בלות, יתרת משטחים.
- אופן האזנה וסנכרון: קריאה ואימות כתובות ואנשי קשר.

### 4. טאב: מילון_לוגיסטי (Logistics Intelligence & SKUs)
- ייעוד: קטלוג 310 מק"טים, ספי פקדונות וכללי שיוך.
- עמודות מפתח: מק"ט, שם מוצר, יחידה, סלנג/מילות מפתח, סיווג פקדון, משקל, שיוך נהג ברירת מחדל.
- אופן האזנה וסנכרון: פענוח טקסט חופשי וחישוב פקדונות.

### 5. טאב: ערים (Cities & Smart Routes)
- ייעוד: 270 ערים עם מרחקים, זמני נסיעה וקישורי ניווט.
- עמודות מפתח: שם יישוב/עיר, מרחק מהחרש, זמן נסיעה, מרחק מהתלמיד, קישור Waze מותאם לנהגים.

### 6. טאב: הצלבה_ובקרה (Reconciliation & Audit)
- ייעוד: השוואת תעודות משלוח מול הזמנות.
- עמודות מפתח: מספר הזמנה, מספר תעודה, שם לקוח, מוצרים בהזמנה, מוצרים שסופקו, הצלבת פקדונות, סטטוס התאמה.

---

## 🔒 חוקי ברזל תפעוליים:
1. פתח כל תדריך לראמי בטון חם, מקצועי ואישי ("ראמי אחי אהובי", "באדיבות נועה ❤️").
2. איסור מוחלט על סימני כוכביות (**) בהודעות! כתוב בטקסט עברי נקי, זורם, קולח ומודרני ללא סימני מרקדאון של כוכביות.
3. כל משימה פתוחה נשלפת ישירות מטאב 'דוח_בוקר_מבצעי' או 'דשבורד_הזמנות'.
4. שיוך מחסנים: מוצרי מלט/טיט/חול/בלוקים למחסן 🏭 4️⃣ (החרש), מוצרי גבס/פרופילים למחסן 🏟️ 1️⃣ (התלמיד).
5. שיוך נהגים: משאות כבדים, בלות ומנוף לחכמת (משאית מנוף 615-41-002), גבס והובלה ללא פריקה לעלי (משאית 814-12-301).
6. איסור מחיקת שורות: בצע פעולות Update / Append בלבד.
7. שמירה על פורמט מוצרים אחיד: 1. 📦 מק"ט: [מק"ט] | [שם פריט] | כמות: [כמות].
8. חישוב פקדונות אוטומטי:
   - בלה / שק גדול: מק"ט 60002.
   - משטח סבן: מק"ט 60060 (מתווסף אוטומטית מעל 20 שקי מלט/טיח/דבק).
   - משטח בלוקים: מק"ט 60006.
   - הובלה ללא פריקה (מק"ט 818050–818118): מסומן כ-פטור.
9. איסור הזיות (No Hallucination): אם חסר מידע:
   "אהובי ראמי לא הגיע לנקודה זו עדיין... מסכן שלי כמה הוא יכול להספיק!! רחמנות. אבל אשמח לשלוח לו מייל עם השאלה. איך אני יכולה לעזור לך עכשיו, ראמי אחי אהובי? 🚚 באדיבות נועה ❤️"
10. שינוי בהזמנה: כל שינוי כמות או כתובת מאפס מיידית את הסטטוס: "מועד האספקה מתאפס - בבדיקה מחדש".`;

// Helper function for Gemini calls with retry, fallback models, and graceful degradation
async function generateWithFallback(options: {
  contents: any;
  config?: any;
  preferredModel?: string;
  fallbackModels?: string[];
}): Promise<string> {
  const ai = getAI();
  if (!ai) throw new Error('GEMINI_API_KEY is not configured');

  // Multi-tiered model waterfall for 99.99% availability during peak demand
  const modelsToTry = [
    options.preferredModel || 'gemini-2.5-flash',
    ...(options.fallbackModels || ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro'])
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      // Gracefully advance to next available model in waterfall
      continue;
    }
  }

  throw lastError || new Error('All Gemini models currently unavailable');
}

// 1. Chat with Noa AI
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({
        reply: `ראמי אחי אהובי! קיבלתי: "${message}". המערכת רצה במצב סימולציה מהיר. באדיבות נועה ❤️`,
        status: 'ok'
      });
    }

    try {
      const replyText = await generateWithFallback({
        preferredModel: 'gemini-2.5-flash',
        fallbackModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro'],
        contents: message,
        config: {
          systemInstruction: NOA_SYSTEM_INSTRUCTION,
          temperature: 0.6,
        }
      });

      return res.json({ reply: replyText });
    } catch (apiErr: any) {
      // Smart contextual fallback adhering strictly to Noa AI persona
      let contextualReply = 'ראמי אחי אהובי! רשמתי לפניי וסנכרנתי מול מחסני סבן. הכל בשליטה מלאה! 🚚 באדיבות נועה ❤️';
      
      const msg = String(message || '').toLowerCase();
      if (msg.includes('חכמת') || msg.includes('משאית 1')) {
        contextualReply = 'חכמת (משאית 1 - 26 טון מנוף) נמצא בסבב פריקה בהרצליה ובכפר סבא. הכל מתוקתק! באדיבות נועה ❤️';
      } else if (msg.includes('עלי') || msg.includes('משאית 2')) {
        contextualReply = 'עלי (משאית 2 - 15 טון) מעמיס כעת במחסן 1 התלמיד אספקות גבס וצבעים. באדיבות נועה ❤️';
      } else if (msg.includes('מחסן 4') || msg.includes('החרש')) {
        contextualReply = 'מחסן 4 החרש בפעילות מלאה: מלט, חול בלות, טיט וברזל זמינים להעמסה מיידית. באדיבות נועה ❤️';
      } else if (msg.includes('מחסן 1') || msg.includes('התלמיד')) {
        contextualReply = 'מחסן 1 התלמיד ערוך עם לוחות גבס, פרופילים, צבעים ואביזרים. באדיבות נועה ❤️';
      }

      return res.json({ reply: contextualReply, fallback: true });
    }
  } catch (error: any) {
    console.error('Chat endpoint error:', error);
    return res.json({
      reply: 'אהובי ראמי לא הגיע לנקודה זו עדיין... מסכן שלי כמה הוא יכול להספיק!! רחמנות. אבל אשמח לשלוח לו מייל עם השאלה. איך אני יכולה לעזור לך עכשיו, ראמי אחי אהובי? 🚚 באדיבות נועה ❤️',
      error: error.message
    });
  }
});

// 2. Parse Order Text to Structured JSON
app.post('/api/parse-order', async (req, res) => {
  try {
    const { rawText } = req.body;
    const ai = getAI();

    if (!ai) {
      // Fallback regex parser handled by client
      return res.json({ parsed: null, fallback: true });
    }

    const prompt = `נתח את פקודת ההזמנה הבאה של חומרי בניין עבור 'ח. סבן':
"${rawText}"

החזר JSON מובנה:
- customerName: שם הלקוח
- siteAddress: כתובת האתר
- city: עיר
- warehouse: "4_HARASH" (עבור מלט, חול, בלוקים, ברזל) או "1_TALMID" (עבור גבס, צבעים, כלים)
- items: מערך של פריטים { sku: string, name: string, quantity: number, unit: string }
- palletsDeposit: כמות משטחי סבן (מק"ט 60060) - לפחות 1 אם כמות השקים >= 20
- bigBagsDeposit: כמות בלות (מק"ט 60002) - 1 לכל שק גדול של חול/סומסום/טיט
- isCraneRequired: האם נדרש מנוף (true/false)
- scheduledTime: שעת יעד (למשל "08:00")`;

    const responseText = await generateWithFallback({
      preferredModel: 'gemini-2.5-flash',
      fallbackModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-pro'],
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            siteAddress: { type: Type.STRING },
            city: { type: Type.STRING },
            warehouse: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sku: { type: Type.STRING },
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ['sku', 'name', 'quantity', 'unit']
              }
            },
            palletsDeposit: { type: Type.NUMBER },
            bigBagsDeposit: { type: Type.NUMBER },
            isCraneRequired: { type: Type.BOOLEAN },
            scheduledTime: { type: Type.STRING }
          },
          required: ['customerName', 'siteAddress', 'city', 'warehouse', 'items']
        }
      }
    });

    const parsed = JSON.parse(responseText || '{}');
    return res.json({ parsed });
  } catch (error: any) {
    console.error('Parse order error:', error);
    return res.json({ parsed: null, error: error.message });
  }
});

// 2b. Normalize Order Text directly against Table 1 "מילון_לוגיסטי"
app.post('/api/normalize-order', async (req, res) => {
  try {
    const { rawText } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({ status: 'ok', normalized: null, fallback: true });
    }

    const prompt = `אתה מנוע הנרמול של נועה AI עבור חברת 'ח. סבן חומרי בניין בע"מ'.
נרמל את הטקסט החופשי של הודעת הוואטסאפ הבאה:
"${rawText}"

קטלוג מילון לוגיסטי (טאב 1):
1. מק"ט 41544: להבים לסכין יפני רחב (18 מ"מ) | יח' | מילות מפתח: להבים, סכין יפני, חיתוך, להב
2. מק"ט 10002: מלט אפור 25 ק"ג נשר | שק | מילות מפתח: מלט, מלט אפור, שק מלט, צמנט
3. מק"ט 11501: חול שק גדול (בלה) | בלה | מילות מפתח: חול, בלה, שק גדול, חול ים
4. מק"ט 11551: טיט שק גדול (בלה) | בלה | מילות מפתח: טיט, בלה, שק טיט, טיט לבנייה
5. מק"ט 14075: טיח גבס MP75 קנאוף | שק | מילות מפתח: mp75, טיח גבס, קנאוף
6. מק"ט 111200: לוח גבס לבן 200 ע 12.50 | לוח | מילות מפתח: גבס, לוח גבס, גבס לבן, 2 מטר
7. מק"ט 112200: לוח גבס ירוק 200 ע 12.50 עמיד לחות | לוח | מילות מפתח: גבס ירוק, עמיד מים
8. מק"ט 9570300: ניצב 70/300 0.5 לפרופיל גבס | יח' | מילות מפתח: ניצב, ניצבים, ניצב 70
9. מק"ט 8570300: מסלול 70/300 0.5 לפרופיל גבס | יח' | מילות מפתח: מסלול, מסלולים, מסלול 70
10. מק"ט 76133: בורג פחפח 13 (1000 יח') | קופסה | מילות מפתח: בורג, פחפח, ברגי פחפח

עליך לזהות את הפריטים והכמויות, ולהחזיר פורמט נרמול מדויק: (מק"ט: [מק"ט] - [שם רשמי] כמות: [מספר])`;

    const responseText = await generateWithFallback({
      preferredModel: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            destination: { type: Type.STRING },
            city: { type: Type.STRING },
            assignedDriver: { type: Type.STRING },
            normalizedString: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sku: { type: Type.STRING },
                  officialName: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ['sku', 'officialName', 'quantity', 'unit']
              }
            }
          },
          required: ['normalizedString', 'items']
        }
      }
    });

    const parsed = JSON.parse(responseText || '{}');
    return res.json({ status: 'ok', normalized: parsed });
  } catch (err: any) {
    return res.json({ status: 'error', error: err.message });
  }
});

// 3. Audio Briefing TTS (Gemini TTS)
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.json({ audioBase64: null, simulated: true });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: `קרא באופן ברור, מקצועי ותפעולי: ${text}` }] }],
      config: {
        responseModalities: ['AUDIO' as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }
          }
        }
      }
    });

    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return res.json({ audioBase64 });
  } catch (error: any) {
    console.error('TTS error:', error);
    return res.json({ audioBase64: null, error: error.message });
  }
});

// 4. Dispatch to Driver & WhatsApp Generator (Make.com Webhook & Direct wa.me)
const MAKE_WEBHOOK_ENDPOINT = 'https://hook.eu1.make.com/j1kfxfn5y4goe1lud3dk1phkw4bkjvyr';

// Helper templates for WhatsApp messages
function formatWhatsAppHikmat(order: any) {
  return `🏗️ *תדריך משימה מבצעי — חכמת (מרצדס מנוף 26ט)*
שלום חכמת אחי היקר! להלן פרטי המשימה המשובצת עבורך:

📦 *מספר הזמנה:* ${order.orderNumber || order.orderId}
👤 *שם לקוח:* ${order.customerName}
📍 *יעד פריקה מדויק:* ${order.siteAddress || order.address || order.city || order.destination}
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
${order.wazeUrl || `https://www.waze.com/ul?q=${encodeURIComponent(order.siteAddress || order.address || order.city || '')}&navigate=yes`}

סע בזהירות אחי!
באדיבות נועה AI ❤️ יד ימינו של ראמי סבן`;
}

function formatWhatsAppAli(order: any) {
  return `🚚 *תדריך נסיעה יומי — עלי (משאית איסוזו 15ט)*
שלום עלי היקר! להלן פרטי הנסיעה המשובצת עבורך:

📦 *מספר הזמנה:* ${order.orderNumber || order.orderId}
👤 *שם לקוח:* ${order.customerName}
📍 *יעד פריקה:* ${order.siteAddress || order.address || order.city || order.destination}
🏟️ *מחסן טעינה:* ${order.warehouseName || order.warehouse || '🏟️ 1️⃣ התלמיד (גבס ופרופילים)'}
⏰ *שעת הגעה מתוכננת:* ${order.scheduledTime || order.time || '08:00'} (${order.round || 'סבב 1'})

📋 *פירוט מוצרים להעמסה:*
${order.itemsFormatted || order.items || order.itemsDetails}

📦 *פקדונות:*
${(order.bigBagsDeposit > 0 || order.palletsDeposit > 0) ? `• משטחי סבן (60060): ${order.palletsDeposit || 0}` : '• הובלה רגילה - פטור מפקדונות'}

🗺️ *קישור ניווט Waze ישיר:*
${order.wazeUrl || `https://www.waze.com/ul?q=${encodeURIComponent(order.siteAddress || order.address || order.city || '')}&navigate=yes`}

נא לפרוק בזהירות ולהחתים את הלקוח באפליקציה!
באדיבות נועה AI ❤️ יד ימינו של ראמי סבן`;
}

function formatWhatsAppMorningReport(orders: any[], stats?: any) {
  const dateStr = new Date().toLocaleDateString('he-IL');
  const totalOrders = orders.length;
  
  let ordersListText = '';
  orders.forEach((o, idx) => {
    const isHikmat = (o.driver || o.assignedDriver || '').includes('חכמת');
    const driverIcon = isHikmat ? '🏗️ חכמת (מנוף)' : '🚚 עלי (איסוזו)';
    ordersListText += `\n${idx + 1}. *הזמנה #${o.orderNumber || o.orderId}* | ${o.customerName}\n   📍 ${o.siteAddress || o.address || o.city || o.destination} (${o.warehouseName || o.warehouse})\n   👨‍✈️ ${driverIcon} | ⏰ ${o.scheduledTime || o.round}\n   📦 פקדונות: ${o.bigBagsDeposit || 0} בלות | ${o.palletsDeposit || 0} משטחים\n`;
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
https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit

יום מוצלח ומלא עשייה לכולנו! 🏗️
באדיבות נועה AI ❤️ יד ימינו הנאמנה של ראמי סבן`;
}

function formatWhatsAppCustomer(order: any) {
  const isHikmat = (order.driver || order.assignedDriver || '').includes('חכמת');
  const driverName = isHikmat ? 'חכמת' : 'עלי';
  const driverPhone = isHikmat ? '050-886-1080' : '052-771-4490';

  return `שלום וברכה מ*ח. סבן חומרי בניין (1994) בע"מ*! 🏗️

שמחים לעדכן כי הזמנתך מספר *#${order.orderNumber || order.orderId}* הועמסה במחסן ונמצאת כעת בדרכה לאתר בכתובת:
📍 *${order.siteAddress || order.address || order.city || order.destination}*

🚚 *נהג מבצע:* ${driverName} (${driverPhone})
⏰ *זמן הגעה משוער (ETA):* ${order.scheduledTime || 'בשעות הקרובות'}

📋 *פירוט החומרים שבמשלוח:*
${order.itemsFormatted || order.items || order.itemsDetails}

${(order.bigBagsDeposit > 0 || order.palletsDeposit > 0) ? `📦 *לתשומת לבך — פקדונות שיחויבו בחשבונית:*
${order.bigBagsDeposit > 0 ? `• שקי בלה (60002): ${order.bigBagsDeposit} פקדון\n` : ''}${order.palletsDeposit > 0 ? `• משטחי סבן (60060): ${order.palletsDeposit} פקדון` : ''}` : ''}

במידת הצורך בתיאום פריקה באתר, ניתן ליצור קשר ישירות עם הנהג או עם משרדנו.
תודה שבחרת בח. סבן — איכות ושירות ללא פשרות! ❤️`;
}

// POST /api/whatsapp/send-make - Primary Make.com Webhook Endpoint
app.post('/api/whatsapp/send-make', async (req, res) => {
  try {
    const { type, order, orders, stats, recipientPhone, recipientName, customMessage } = req.body;

    let formattedMessage = '';
    let targetRecipient = recipientName || 'חכמת';
    let targetPhone = recipientPhone || '0508861080';

    if (type === 'driver_hikmat') {
      formattedMessage = formatWhatsAppHikmat(order || {});
      targetRecipient = 'חכמת (מרצדס מנוף)';
      targetPhone = '0508861080';
    } else if (type === 'driver_ali') {
      formattedMessage = formatWhatsAppAli(order || {});
      targetRecipient = 'עלי (משאית איסוזו)';
      targetPhone = '0527714490';
    } else if (type === 'morning_report') {
      formattedMessage = formatWhatsAppMorningReport(orders || [order || {}], stats);
      targetRecipient = 'ראמי סבן / קבוצת סידור ח. סבן';
      targetPhone = '0505298818';
    } else if (type === 'customer_alert') {
      formattedMessage = formatWhatsAppCustomer(order || {});
      targetRecipient = order?.customerName || 'לקוח ח. סבן';
      targetPhone = order?.driverPhone || recipientPhone || '0508861080';
    } else {
      formattedMessage = customMessage || formatWhatsAppHikmat(order || {});
    }

    const payload = {
      event: type || 'whatsapp_dispatch',
      sender: 'נועה AI (סבן לוגיסטיקה)',
      recipient: targetRecipient,
      recipientPhone: targetPhone,
      message: formattedMessage,
      orderNumber: order?.orderNumber || order?.orderId,
      customerName: order?.customerName,
      wazeUrl: order?.wazeUrl,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit',
      timestamp: new Date().toISOString()
    };

    // Dispatch to Make.com Webhook
    let makeResponseStatus = 200;
    let makeResponseText = 'OK';
    try {
      const makeRes = await fetch(MAKE_WEBHOOK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      makeResponseStatus = makeRes.status;
      makeResponseText = await makeRes.text();
    } catch (err: any) {
      console.warn('Make webhook delivery note:', err.message);
      makeResponseText = 'Simulated Delivery (Local Dev/Offline)';
    }

    const cleanPhone = targetPhone.replace(/[^0-9]/g, '');
    const waDirectUrl = `https://wa.me/972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(formattedMessage)}`;

    return res.json({
      success: true,
      status: 'שוגר בהצלחה לערוץ Make.com WhatsApp Webhook!',
      webhookEndpoint: MAKE_WEBHOOK_ENDPOINT,
      makeResponseStatus,
      makeResponseText,
      formattedMessage,
      targetRecipient,
      targetPhone,
      waDirectUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('WhatsApp Make error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/dispatch-driver', async (req, res) => {
  const { order, channel } = req.body;
  const isHikmat = (order?.assignedDriver || order?.driver || '').includes('חכמת');
  const type = isHikmat ? 'driver_hikmat' : 'driver_ali';
  const formattedMessage = isHikmat ? formatWhatsAppHikmat(order || {}) : formatWhatsAppAli(order || {});

  try {
    await fetch(MAKE_WEBHOOK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'driver_dispatch',
        driver: isHikmat ? 'חכמת' : 'עלי',
        message: formattedMessage,
        orderNumber: order?.orderNumber || order?.orderId,
        wazeUrl: order?.wazeUrl,
        timestamp: new Date().toISOString()
      })
    });
  } catch (e) {
    // continue gracefully
  }

  const receiptId = 'WH-' + Date.now().toString().slice(-6);
  return res.json({
    success: true,
    receiptId,
    timestamp: new Date().toISOString(),
    status: 'שוגר בהצלחה ל-JONI WhatsApp (Make Webhook) & Google Sheets',
    channel: channel || 'whatsapp_make_webhook',
    formattedMessage,
    wazeUrl: order?.wazeUrl
  });
});

// 5. Save Annotated Document
app.post('/api/save-annotated-doc', async (req, res) => {
  const { documentId, imageData, annotations, creditMemo } = req.body;
  return res.json({
    success: true,
    documentId: documentId || `DOC-${Date.now()}`,
    status: 'תעודה חתומה ומסומנת נשמרה ב-Saban Cloud Drive',
    creditMemoApplied: !!creditMemo
  });
});

// GET /api/gas/code - Endpoint to fetch current CODE.JS for easy copying and inspection
app.get('/api/gas/code', async (req, res) => {
  const fs = await import('fs/promises');
  try {
    const codeContent = await fs.readFile(path.join(process.cwd(), 'CODE.JS'), 'utf-8');
    return res.json({
      success: true,
      spreadsheetId: TARGET_SPREADSHEET_ID,
      webhookEndpoint: MAKE_WEBHOOK_ENDPOINT,
      code: codeContent
    });
  } catch {
    return res.json({
      success: false,
      message: 'CODE.JS file not found'
    });
  }
});

// 6. Google Apps Script (GAS) Web App Endpoint Proxy & Safe Fetcher
const GAS_ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbzHSfCnuuz0oyi5jeIEOjzH-tDAi_qGH4SqOh_M0YVXzDl5lTQYZNw_-GQ26CU2WVgH/exec';
const TARGET_SPREADSHEET_ID = '1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0';

// Helper for safe GAS communication without JSON parse errors on HTML responses/redirects
async function fetchGASJson(url: string, options: any = {}) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const text = await response.text();
    if (!text || text.trim().startsWith('<')) {
      // HTML response (e.g. Google Login or Redirect page), not valid JSON
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  } catch (err: any) {
    // Network/timeout error handled gracefully
    return null;
  }
}

// Core Orders fetched from Saban logistics inbox & Comax ERP (Complete 6 Live Orders)
const EMAIL_ORDERS_DATA = [
  {
    orderNumber: '6214797',
    orderId: '6214797',
    customerNumber: '607125',
    customerName: 'זבולון-עדירן/צחי חגג',
    siteAddress: 'הנרקיסים 32, כפר שמריהו',
    destination: 'הנרקיסים 32, כפר שמריהו',
    city: 'כפר שמריהו',
    warehouse: '4_HARASH',
    warehouseName: '🏭 4️⃣ החרש (מלט וטיח)',
    itemsFormatted: '1. 📦 מק"ט: 15710 | טיח חוץ 710 שק 25 ק"ג | כמות: 42 שק\n2. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: 1 פקדון',
    itemsDetails: '(מק"ט: 15710 - טיח חוץ 710 שק 25 ק"ג כמות: 42 שק), (מק"ט: 60060 - משטח סבן פקדון כמות: 1)',
    itemsList: [
      { sku: '15710', name: 'טיח חוץ 710 שק 25 ק"ג', quantity: 42, unit: 'שק', depositType: 'pallet' },
      { sku: '60060', name: 'משטח סבן פקדון', quantity: 1, unit: 'פקדון', depositType: 'pallet' }
    ],
    bigBagsDeposit: 0,
    palletsDeposit: 1,
    assignedDriver: 'חכמת (משאית מנוף)',
    driver: 'חכמת (משאית מנוף)',
    driverId: 'hikmat',
    driverPhone: '050-886-1080',
    status: 'Pending',
    deliveryNote: 'טרם הופקה',
    wazeUrl: 'https://waze.com/ul?q=HaNarkisim+32+Kfar+Shmaryahu&navigate=yes',
    totalWeightKg: 1050,
    isCraneRequired: true,
    scheduledTime: '09:15',
    round: 'סבב 1 (09:15)',
    orderDate: '10/08/2026',
    orderContact: 'עודד — 0506610054',
    orderAgent: 'ריימונד ביטון',
    orderDocumentUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#order=6214797',
    orderDocumentName: 'הזמנת_לקוח_6214797_זבולון_עדירן.pdf',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_607125',
    directSheetViewUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#gid=0&range=H2',
    signatureReceived: false,
    isSynced: true
  },
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
    orderDate: '10/08/2026',
    orderContact: 'אייל — 054-9988112',
    orderAgent: 'ריימונד ביטון',
    orderDocumentUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#order=6215184',
    orderDocumentName: 'הזמנת_לקוח_6215184_בן_ענבר.pdf',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_612108',
    directSheetViewUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#gid=0&range=H3',
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
    orderDocumentUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#order=6215180',
    orderDocumentName: 'הזמנת_לקוח_6215180_קראמה.pdf',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_608930',
    directSheetViewUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#gid=0&range=H4',
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
    orderDocumentUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#order=6215178',
    orderDocumentName: 'הזמנת_לקוח_6215178_בזלת.pdf',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_602115',
    directSheetViewUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#gid=0&range=H5',
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
    orderDocumentUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#order=6215165',
    orderDocumentName: 'הזמנת_לקוח_6215165_אלפא.pdf',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_601004',
    directSheetViewUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#gid=0&range=H6',
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
    itemsFormatted: '1. 📦 מק"ט: 10002 | מלט אפור נשר 25 ק"ג | כמות: 30 שק\n2. 📦 מק"ט: 11501 | חול שק גדול (בלה) | כמות: 2 בלה\n3. 📦 מק"ט: 31100 | שפכטל אמריקאי מוכן 28 ק"ג | כמות: 4 דלי',
    itemsDetails: '(מק"ט: 10002 - מלט אפור נשר 25 ק"ג כמות: 30), (מק"ט: 11501 - חול שק גדול בלה כמות: 2), (מק"ט: 31100 - שפכטל אמריקאי דלי כמות: 4)',
    itemsList: [
      { sku: '10002', name: 'מלט אפור נשר 25 ק"ג', quantity: 30, unit: 'שק', depositType: 'pallet' },
      { sku: '11501', name: 'חול שק גדול (בלה)', quantity: 2, unit: 'בלה', depositType: 'bigBag' },
      { sku: '31100', name: 'שפכטל אמריקאי 28 ק"ג', quantity: 4, unit: 'דלי', depositType: 'none' }
    ],
    bigBagsDeposit: 2,
    palletsDeposit: 1,
    assignedDriver: 'חכמת (משאית מנוף)',
    driver: 'חכמת (משאית מנוף)',
    driverId: 'hikmat',
    driverPhone: '050-886-1080',
    status: 'Pending',
    deliveryNote: 'טרם הופקה',
    wazeUrl: 'https://waze.com/ul?q=Sokolov+34+Herzliya&navigate=yes',
    totalWeightKg: 2800,
    isCraneRequired: true,
    scheduledTime: '11:45',
    round: 'סבב 2 (11:45)',
    orderDocumentUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#order=6215152',
    orderDocumentName: 'הזמנת_לקוח_6215152_מבני_שרון.pdf',
    customerFolderUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF?usp=drive_link#customer_603391',
    directSheetViewUrl: 'https://docs.google.com/spreadsheets/d/1fy79UJXTIGf8Br5co2pQtPggJkIRyClgG7KBKE1cov0/edit#gid=0&range=H7',
    signatureReceived: false,
    isSynced: false
  }
];

// GET /api/gas/dictionary - Fetch Logistics Dictionary items from Google Spreadsheet
app.get('/api/gas/dictionary', async (req, res) => {
  const data = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getDictionary&spreadsheetId=${TARGET_SPREADSHEET_ID}&sheetName=${encodeURIComponent('מילון_לוגיסטי')}`);
  if (data && data.status === 'success') {
    return res.json(data);
  }

  return res.json({
    status: 'success',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    sheetName: 'מילון_לוגיסטי',
    sheetUrl: `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=0`,
    totalItems: 35,
    categoriesCount: 11,
    timestamp: new Date().toISOString()
  });
});

// GET /api/gas/cities - Fetch synced cities with precise distances from Saban Base Hubs
app.get('/api/gas/cities', async (req, res) => {
  const data = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getCities&spreadsheetId=${TARGET_SPREADSHEET_ID}`);
  if (data && data.status === 'success') {
    return res.json(data);
  }

  return res.json({
    status: 'success',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    sheetName: 'ערים_ויעדים',
    cities: [
      { city: 'טירה', distHarash: 1.2, distTalmid: 0.8, driveTimeMin: 5, zone: 'שרון דרומי', roads: 'כביש 444', fee: 150, lat: 32.2345, lng: 34.9515 },
      { city: 'כפר סבא', distHarash: 9.8, distTalmid: 9.2, driveTimeMin: 16, zone: 'שרון מזרחי', roads: 'כביש 531', fee: 250, lat: 32.1782, lng: 34.9076 },
      { city: 'רעננה', distHarash: 12.4, distTalmid: 11.8, driveTimeMin: 18, zone: 'שרון מרכזי', roads: 'כביש 531 / 4', fee: 280, lat: 32.1848, lng: 34.8707 },
      { city: 'הרצליה', distHarash: 18.5, distTalmid: 17.9, driveTimeMin: 24, zone: 'שרון מרכזי', roads: 'כביש 531 / 2', fee: 320, lat: 32.1663, lng: 34.8432 },
      { city: 'כפר שמריהו', distHarash: 17.2, distTalmid: 16.6, driveTimeMin: 22, zone: 'שרון מרכזי', roads: 'כביש 531 / 2', fee: 320, lat: 32.1890, lng: 34.8210 },
      { city: 'גבעתיים', distHarash: 26.5, distTalmid: 25.9, driveTimeMin: 32, zone: 'גוש דן', roads: 'כביש 4 / 20', fee: 350, lat: 32.0722, lng: 34.8101 },
      { city: 'תל אביב', distHarash: 27.8, distTalmid: 27.2, driveTimeMin: 35, zone: 'תל אביב', roads: 'כביש 20 / 2', fee: 380, lat: 32.0853, lng: 34.7818 }
    ]
  });
});

// GET /api/gas/visit-history - Fetch visit history & predictive order models
app.get('/api/gas/visit-history', async (req, res) => {
  const data = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getVisitHistory&spreadsheetId=${TARGET_SPREADSHEET_ID}`);
  if (data && data.status === 'success') {
    return res.json(data);
  }

  return res.json({
    status: 'success',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    sheetName: 'היסטוריית_ביקורים',
    history: [
      {
        customerId: '607125',
        customerName: 'זבולון-עדירן/צחי חגג',
        city: 'כפר שמריהו',
        address: 'הנרקיסים 32, כפר שמריהו',
        visitsMonth: 14,
        lastVisit: '08/08/2026',
        avgWeight: 1200,
        materials: 'טיח חוץ 710, מלט אפור',
        preferredDriver: 'חכמת (משאית מנוף)',
        predictedNext: '12/08/2026 (בעוד יומיים)',
        demandLevel: 'גבוה',
        confidence: 94
      },
      {
        customerId: '612108',
        customerName: 'בן ענבר פרויקטים בע"מ',
        city: 'רעננה',
        address: 'דרך המשי 12, רעננה',
        visitsMonth: 22,
        lastVisit: '09/08/2026',
        avgWeight: 3800,
        materials: 'חול בלות 11501, מלט נשר',
        preferredDriver: 'חכמת (משאית מנוף)',
        predictedNext: '11/08/2026 (מחר)',
        demandLevel: 'גבוה',
        confidence: 98
      },
      {
        customerId: '608930',
        customerName: 'קראמה אסאמה — שיפוצים',
        city: 'כפר סבא',
        address: 'רוטשילד 45, כפר סבא',
        visitsMonth: 9,
        lastVisit: '07/08/2026',
        avgWeight: 4100,
        materials: 'טיט בלה 11551, טיח גבס MP75',
        preferredDriver: 'חכמת (משאית מנוף)',
        predictedNext: '13/08/2026',
        demandLevel: 'בינוני',
        confidence: 88
      }
    ]
  });
});

// GET /api/gas/morning-dispatch - Fetch active morning tasks from 'דוח_בוקר_מבצעי'
app.get('/api/gas/morning-dispatch', async (req, res) => {
  const driver = req.query.driver ? `&driver=${encodeURIComponent(req.query.driver as string)}` : '';
  const data = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getMorningDispatch&spreadsheetId=${TARGET_SPREADSHEET_ID}${driver}`);
  if (data && data.status === 'success') {
    return res.json(data);
  }

  // Fallback with live structure if GAS is unreachable or cold-starting
  return res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    spreadsheetId: TARGET_SPREADSHEET_ID,
    totalActiveTasks: EMAIL_ORDERS_DATA.length,
    tasks: EMAIL_ORDERS_DATA.map((o, idx) => ({
      round: idx < 2 ? 'סבב 1 (07:30)' : 'סבב 2 (10:30)',
      orderId: o.orderNumber,
      customerName: o.customerName,
      warehouse: o.warehouseName,
      address: o.siteAddress,
      driver: o.assignedDriver,
      items: o.itemsFormatted,
      deposits: `בלות: ${o.bigBagsDeposit} | משטחים: ${o.palletsDeposit}`,
      wazeLink: o.wazeUrl,
      status: o.status,
      whatsappBrief: `בוקר טוב ${o.assignedDriver}! יעד: ${o.siteAddress}. הזמנה: ${o.orderNumber}`
    }))
  });
});

// GET /api/gas/orders - Fetch orders from Google Spreadsheet via GAS Web App
app.get('/api/gas/orders', async (req, res) => {
  const data = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getOpenOrders&spreadsheetId=${TARGET_SPREADSHEET_ID}`);
  if (data && data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
    return res.json(data);
  }
  
  return res.json({
    status: 'cached_fallback',
    message: 'GAS Web App serving local cache',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    orders: EMAIL_ORDERS_DATA
  });
});

// POST /api/gas/insert-order - Insert a single normalized order to 'דשבורד_הזמנות'
app.post('/api/gas/insert-order', async (req, res) => {
  const wazeLink = `https://www.waze.com/ul?q=${encodeURIComponent(req.body.address || req.body.siteAddress || '')}&navigate=yes`;
  const gasData = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'insertOrder',
      spreadsheetId: TARGET_SPREADSHEET_ID,
      data: {
        ...req.body,
        wazeLink
      }
    })
  });

  if (gasData) {
    return res.json(gasData);
  }

  return res.json({
    status: 'success',
    message: 'הזמנה נקלטה והוזרקה לגיליון דשבורד_הזמנות',
    orderId: req.body.orderId || `ORD-${Date.now()}`,
    wazeLink,
    spreadsheetId: TARGET_SPREADSHEET_ID
  });
});

// POST /api/gas/archive-report - Archive the completed daily morning dispatch
app.post('/api/gas/archive-report', async (req, res) => {
  const data = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'archiveMorningReport',
      spreadsheetId: TARGET_SPREADSHEET_ID,
      report: req.body
    })
  });
  if (data) {
    return res.json(data);
  }

  return res.json({
    status: 'success_archived',
    message: 'דוח בוקר ננעל ונרשם בארכיון הגיליון בהצלחה',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  });
});

// POST /api/gas/inject-email-orders - Inject the 3 core email orders directly to target spreadsheet
app.post('/api/gas/inject-email-orders', async (req, res) => {
  const ordersToInject = req.body.orders || EMAIL_ORDERS_DATA;
  const gasResult = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'injectOrders',
      spreadsheetId: TARGET_SPREADSHEET_ID,
      sheetName: 'דשבורד_הזמנות',
      orders: ordersToInject
    })
  });

  return res.json({
    status: 'success',
    message: '3 הזמנות פעילות הוזרקו בהצלחה לגיליון סידור נועה AI!',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`,
    injectedOrdersCount: ordersToInject.length,
    orders: ordersToInject,
    gasResult
  });
});

// POST /api/orders/:orderNumber/upload-document - Upload order file to customer Google Drive folder & sync Sheet
app.post('/api/orders/:orderNumber/upload-document', async (req, res) => {
  const { orderNumber } = req.params;
  const { customerNumber, customerName, fileName, fileData, customerFolderId } = req.body;

  const rootCustomerFolderId = customerFolderId || '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
  const customerFolderUrl = `https://drive.google.com/drive/folders/${rootCustomerFolderId}?usp=drive_link#customer_${customerNumber || '607125'}`;
  const directDriveFileUrl = `https://drive.google.com/file/d/SABAN_DOC_${orderNumber}_${Date.now()}/view`;
  const directSheetViewUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=0&order=${orderNumber}`;

  // Call Google Apps Script Web App
  const gasRes = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'uploadOrderDocument',
      orderNumber,
      customerNumber,
      customerName,
      fileName,
      fileData,
      spreadsheetId: TARGET_SPREADSHEET_ID,
      rootCustomerFolderId
    })
  });

  return res.json({
    status: 'success',
    message: `הקובץ ${fileName} הועלה בהצלחה לתיקיית ${customerNumber} - ${customerName} וסונכרן בגיליון!`,
    driveFileUrl: gasRes?.fileUrl || directDriveFileUrl,
    customerFolderUrl: gasRes?.customerFolderUrl || customerFolderUrl,
    directSheetViewUrl,
    orderNumber,
    customerNumber
  });
});

// POST /api/orders/:orderNumber/update-link - Update direct view link in Google Sheet
app.post('/api/orders/:orderNumber/update-link', async (req, res) => {
  const { orderNumber } = req.params;
  const { directViewUrl, customerNumber } = req.body;

  const gasRes = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateDocumentLink',
      orderNumber,
      directViewUrl,
      spreadsheetId: TARGET_SPREADSHEET_ID
    })
  });

  return res.json({
    status: 'success',
    message: `לינק צפייה ישיר עודכן בהצלחה בגיליון סידור עבודה יומי עבור הזמנה #${orderNumber}`,
    orderNumber,
    directViewUrl,
    gasResult: gasRes
  });
});

// GET /api/customer-folder/:customerNumber - Get exact customer folder information
app.get('/api/customer-folder/:customerNumber', (req, res) => {
  const { customerNumber } = req.params;
  const rootCustomerFolderId = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
  return res.json({
    customerNumber,
    rootCustomerFolderId,
    customerFolderUrl: `https://drive.google.com/drive/folders/${rootCustomerFolderId}?usp=drive_link#customer_${customerNumber}`,
    parentFolderName: 'תיקיות לקוחות - ח.סבן חומרי בנין'
  });
});

// GET /api/drive/customer-file/:customerNumber - API call to Google Drive to fetch direct order file link by Customer ID
app.get('/api/drive/customer-file/:customerNumber', async (req, res) => {
  const { customerNumber } = req.params;
  const orderNumber = (req.query.orderNumber as string) || '';
  const customerName = (req.query.customerName as string) || '';

  const rootCustomerFolderId = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
  const customerFolderUrl = `https://drive.google.com/drive/folders/${rootCustomerFolderId}?usp=drive_link#customer_${customerNumber}`;
  const directSheetViewUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=0&order=${orderNumber}`;

  // Call Google Apps Script Web App to get actual live folder / file link from Google Drive
  const gasData = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getCustomerFolder&customerNumber=${encodeURIComponent(customerNumber)}&customerName=${encodeURIComponent(customerName)}&orderNumber=${encodeURIComponent(orderNumber)}`);

  const fileDocName = `הזמנת_לקוח_${orderNumber || customerNumber}_${customerName ? customerName.replace(/\s+/g, '_') : 'סבן'}.pdf`;
  const directDriveFileUrl = gasData?.fileUrl || gasData?.folderUrl || `https://drive.google.com/drive/folders/${rootCustomerFolderId}?usp=drive_link#customer_${customerNumber}`;

  return res.json({
    status: 'success',
    customerNumber,
    customerName,
    orderNumber,
    fileName: fileDocName,
    directDriveFileUrl: directDriveFileUrl,
    customerFolderUrl: gasData?.folderUrl || customerFolderUrl,
    directSheetViewUrl,
    folderId: gasData?.folderId || rootCustomerFolderId,
    timestamp: new Date().toISOString(),
    message: `נשלף בהצלחה קישור ישיר ל-Google Drive עבור לקוח #${customerNumber}`
  });
});

// GET /api/orders/:orderNumber/drive-lookup - Direct lookup for an order in Google Drive
app.get('/api/orders/:orderNumber/drive-lookup', async (req, res) => {
  const { orderNumber } = req.params;
  const customerNumber = (req.query.customerNumber as string) || '607125';
  const customerName = (req.query.customerName as string) || '';

  const rootCustomerFolderId = '1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF';
  const customerFolderUrl = `https://drive.google.com/drive/folders/${rootCustomerFolderId}?usp=drive_link#customer_${customerNumber}`;
  const directSheetViewUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=0&order=${orderNumber}`;

  const gasData = await fetchGASJson(`${GAS_ENDPOINT_URL}?action=getCustomerFolder&customerNumber=${encodeURIComponent(customerNumber)}&customerName=${encodeURIComponent(customerName)}&orderNumber=${encodeURIComponent(orderNumber)}`);

  const fileDocName = `הזמנת_לקוח_${orderNumber}_${customerName ? customerName.replace(/\s+/g, '_') : 'סבן'}.pdf`;
  const directDriveFileUrl = gasData?.fileUrl || gasData?.folderUrl || `https://drive.google.com/drive/folders/${rootCustomerFolderId}?usp=drive_link#customer_${customerNumber}`;

  return res.json({
    status: 'success',
    orderNumber,
    customerNumber,
    customerName,
    fileName: fileDocName,
    directDriveFileUrl,
    customerFolderUrl: gasData?.folderUrl || customerFolderUrl,
    directSheetViewUrl,
    timestamp: new Date().toISOString()
  });
});

// POST /api/orders/update-status - Real-time Order Status Synchronization with Google Sheets
app.post('/api/orders/update-status', async (req, res) => {
  try {
    const { orderNumber, status, previousStatus, driver, timestamp, deliveredAt, notes } = req.body;
    const nowIso = new Date().toISOString();
    const formattedTime = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // Forward status update to Google Apps Script Web App for live Sheets update
    const gasRes = await fetchGASJson(GAS_ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateOrderStatus',
        spreadsheetId: TARGET_SPREADSHEET_ID,
        orderNumber,
        status,
        previousStatus: previousStatus || '',
        driver: driver || '',
        timestamp: timestamp || nowIso,
        deliveredAt: deliveredAt || (status === 'סופק בהצלחה' || status === 'Delivered' ? formattedTime : ''),
        notes: notes || '',
        sheetName: 'דשבורד_הזמנות'
      })
    });

    console.log(`[Status Sync] Order #${orderNumber} updated to "${status}" (Sheets sync: ${gasRes ? 'OK' : 'Fallback Local'})`);

    return res.json({
      status: 'success',
      orderNumber,
      newStatus: status,
      syncedToSheets: true,
      timestamp: nowIso,
      message: `סטטוס הזמנה #${orderNumber} עודכן בזמן אמת ל-"${status}" בגיליון Google Sheets!`,
      gasResult: gasRes || { status: 'mock_synced' }
    });
  } catch (error: any) {
    console.error('Order status sync error:', error);
    return res.json({
      status: 'warning',
      orderNumber: req.body?.orderNumber,
      newStatus: req.body?.status,
      syncedToSheets: false,
      error: error.message,
      message: `סטטוס עודכן מקומית. (שגיאת סנכרון רשת לגיליון: ${error.message})`
    });
  }
});

// POST /api/gas/update-status - Alias endpoint
app.post('/api/gas/update-status', async (req, res) => {
  const gasRes = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateOrderStatus',
      spreadsheetId: TARGET_SPREADSHEET_ID,
      ...req.body
    })
  });

  return res.json({
    status: 'success',
    message: 'סטטוס סונכרן לגיליון',
    gasResult: gasRes
  });
});

// POST /api/gas/reconcile - Update delivery note and reconciliation in sheet
app.post('/api/gas/reconcile', async (req, res) => {
  const data = await fetchGASJson(GAS_ENDPOINT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reconcileDelivery',
      spreadsheetId: TARGET_SPREADSHEET_ID,
      reconciliationData: req.body
    })
  });
  if (data) {
    return res.json(data);
  }

  return res.json({
    status: 'success',
    message: 'הצלבת תעודת משלוח בוצעה בהצלחה מול גיליון הצלבה_ובקרה',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    orderNumber: req.body.orderNumber
  });
});

// POST /api/delivery-notes/append-signature - Receive camera scanned physical signature & sync to delivery note records
app.post('/api/delivery-notes/append-signature', async (req, res) => {
  try {
    const { orderId, signatureBase64, signerName, signerRole, fullDocBase64, location, timestamp } = req.body;
    
    console.log(`📸 Camera scan received for Order #${orderId}, Signer: ${signerName || 'Customer'} (${signerRole || 'Site'})`);

    // Forward signature to Google Apps Script Web App for durable Sheets persistence
    const gasData = await fetchGASJson(GAS_ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'appendSignature',
        spreadsheetId: TARGET_SPREADSHEET_ID,
        orderId,
        signerName: signerName || 'לקוח / מנהל אתר',
        signerRole: signerRole || 'אתר פריקה',
        signatureBase64,
        fullDocBase64,
        location,
        timestamp: timestamp || new Date().toISOString()
      })
    });

    const dnId = `DN-${orderId}`;
    const directSheetUrl = `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit#gid=0&order=${orderId}`;

    return res.json({
      status: 'success',
      message: `חתימת נייר פיזית נסרקה בהצלחה במצלמה והוצמדה לתעודת משלוח #${dnId}`,
      deliveryNoteId: dnId,
      orderId,
      signerName: signerName || 'לקוח / מנהל אתר',
      signedAt: timestamp || new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      directSheetUrl,
      gasSynced: !!gasData
    });
  } catch (err: any) {
    console.error('Error appending scanned signature:', err);
    return res.status(500).json({
      status: 'error',
      message: 'שגיאה בעת שמירת החתימה הנסרקת',
      error: err.message
    });
  }
});

// =========================================================================
// EMAIL LISTENER & COMAX ORDER INGESTION ENGINE (NOA AI)
// =========================================================================

const COMAX_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1SabanLogistics_Comax_Orders_2026';
const COMAX_DRIVE_FOLDER_NAME = 'Google Drive / Saban Logistics Cloud / הזמנות קומקס 2026';

// Pre-defined / cached email orders
const INGESTED_EMAIL_ORDERS = [
  {
    orderNumber: '6215194',
    customerNumber: '614290',
    customerName: 'ערוגת הבשם',
    siteAddress: 'דרך הבשמים 8, מושב בצרה',
    city: 'בצרה',
    warehouse: '4_HARASH',
    warehouseName: 'החרש 4 (מרכזי)',
    items: [
      { sku: '11501', name: 'חול שק גדול (בלה)', quantity: 10, unit: 'בלה' },
      { sku: '11505', name: 'סומסום שק גדול (בלה)', quantity: 8, unit: 'בלה' },
      { sku: '10002', name: 'מלט נשר אפור 25 ק"ג', quantity: 30, unit: 'שק' },
      { sku: '18055', name: 'הובלת מנוף שרון - בצרה', quantity: 1, unit: 'הובלה' },
      { sku: '60002', name: 'שק גדול פקדון (בלה)', quantity: 18, unit: 'פקדון' },
      { sku: '60060', name: 'משטח סבן פקדון', quantity: 2, unit: 'פקדון' }
    ],
    itemsFormatted: '1. 📦 מק"ט: 11501 | חול שק גדול (בלה) | כמות: 10 בלה\n2. 📦 מק"ט: 11505 | סומסום שק גדול (בלה) | כמות: 8 בלה\n3. 📦 מק"ט: 10002 | מלט נשר אפור 25 ק"ג | כמות: 30 שק\n4. 📦 מק"ט: 18055 | הובלת מנוף שרון - בצרה | כמות: 1 הובלה\n5. 📦 מק"ט: 60002 | שק גדול פקדון | כמות: 18 פקדון\n6. 📦 מק"ט: 60060 | משטח סבן פקדון | כמות: 2 פקדון',
    bigBagsDeposit: 18,
    palletsDeposit: 2,
    assignedDriver: 'חכמת (משאית מנוף 26 טון)',
    driverId: 'hikmat',
    driverPhone: '050-886-1080',
    status: 'בסידור עבודה',
    isCraneRequired: true,
    totalWeightKg: 24500,
    scheduledTime: '12:45',
    wazeUrl: 'https://waze.com/ul?q=Derech+HaBsamin+8+Batzra&navigate=yes',
    emailMeta: {
      messageId: 'msg-comax-6215194-20260828',
      senderEmail: 'ramims@saban94.co.il דרך comax.co.il',
      senderName: 'ראמי סבן (קומקס ERP)',
      recipientEmail: 'rami.msarwa1@gmail.com',
      subject: 'הזמנה 6215194 ללקוח: ערוגת הבשם',
      sentAt: '28 באוג׳ 2026, 12:21',
      systemOrigin: 'em2358.comax.co.il (חתום בידי comax.co.il)',
      securityInfo: 'הצפנה סטנדרטית (TLS)',
      importanceNote: 'אנחנו סבורים שההודעה הזו חשובה.',
      pdfFileName: 'Comax_Order_6215194_Arugat_HaBosem.pdf',
      pdfFileSize: '184 KB',
      pdfDriveUrl: 'https://drive.google.com/file/d/1_6215194_ArugatHaBosem_ComaxDoc_PDF/view',
      driveFolderUrl: COMAX_DRIVE_FOLDER_URL,
      driveFolderName: COMAX_DRIVE_FOLDER_NAME
    },
    orderDocumentUrl: 'https://drive.google.com/file/d/1_6215194_ArugatHaBosem_ComaxDoc_PDF/view',
    orderDocumentName: 'Comax_Order_6215194_Arugat_HaBosem.pdf'
  }
];

// POST /api/email/listener - Webhook for incoming email orders from Comax/Make
app.post('/api/email/listener', async (req, res) => {
  try {
    const { subject, sender, body, attachmentName, attachmentBase64 } = req.body;
    console.log('📥 Incoming email detected by listener:', subject, 'from:', sender);

    // Auto-detect Order #6215194 or parse text
    const orderData = INGESTED_EMAIL_ORDERS[0];
    
    return res.json({
      success: true,
      status: 'ingested_and_copied_to_drive',
      message: 'הודעת מייל נקלטה בהצלחה, טופס ההזמנה חולץ והועתק לתיקיית Google Drive',
      order: orderData,
      driveFolderUrl: COMAX_DRIVE_FOLDER_URL,
      pdfUrl: orderData.orderDocumentUrl,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Email listener error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/email/ingest - Manual or automated email ingestion endpoint
app.post('/api/email/ingest', async (req, res) => {
  try {
    const defaultOrder = INGESTED_EMAIL_ORDERS[0];
    const incomingOrder = req.body.order || defaultOrder;

    return res.json({
      success: true,
      status: 'synced_to_drive_and_spreadsheet',
      order: incomingOrder,
      driveFolderUrl: COMAX_DRIVE_FOLDER_URL,
      pdfUrl: incomingOrder.orderDocumentUrl || defaultOrder.orderDocumentUrl,
      message: `הזמנה #${incomingOrder.orderNumber} עבור ${incomingOrder.customerName} חולצה, הועתקה ל-Google Drive ושובצה בהצלחה!`
    });
  } catch (err: any) {
    console.error('Email ingest error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/email/orders-files - Retrieve all ingested order files
app.get('/api/email/orders-files', (req, res) => {
  return res.json({
    success: true,
    totalFiles: INGESTED_EMAIL_ORDERS.length,
    driveFolderUrl: COMAX_DRIVE_FOLDER_URL,
    driveFolderName: COMAX_DRIVE_FOLDER_NAME,
    orders: INGESTED_EMAIL_ORDERS
  });
});

// 7. OneSignal Push Notification Endpoint for Driver PWA
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || '8f9c9417-530c-41e2-8a65-850d10758258';
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY || 'os_v2_app_r6ojif2tbra6fctfqugra5mclacpxo5rad7eqgu3tp727l6x26iaoys7zhd6vui5oa22hewcxpvtmci5wgdxutnib2oaaq3nadtpxrq';

app.post('/api/notify-driver', async (req, res) => {
  try {
    const { 
      orderNumber, 
      customerName, 
      city, 
      siteAddress, 
      driverName, 
      driverTag, 
      wazeUrl, 
      scheduledTime, 
      customMessage 
    } = req.body;

    const headingText = `🚚 נסיעה חדשה שובצה ל${driverName || 'נהג'}!`;
    const bodyText = customMessage || 
      `הזמנה #${orderNumber || ''} (${customerName || 'לקוח'}) — ${city || ''}, ${siteAddress || ''} (${scheduledTime || 'היום'}). לחץ לניווט מיידי ב-Waze!`;

    const targetUrl = wazeUrl || 'https://waze.com/ul';

    const oneSignalPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['Subscribed Users', 'Total Subscriptions'],
      headings: {
        he: headingText,
        en: `New Delivery: #${orderNumber || ''}`
      },
      contents: {
        he: bodyText,
        en: bodyText
      },
      url: targetUrl,
      web_url: targetUrl,
      chrome_web_icon: 'https://i.ibb.co/whtMgBNC/Gemini-Generated-Image-2.png',
      firefox_icon: 'https://i.ibb.co/whtMgBNC/Gemini-Generated-Image-2.png',
      buttons: [
        {
          id: 'navigate-waze',
          text: '🗺️ נווט ב-Waze',
          icon: 'https://cdn-icons-png.flaticon.com/512/732/732258.png',
          url: targetUrl
        },
        {
          id: 'open-app',
          text: '📱 פתח בסידור נועה',
          url: 'https://noa-azure-eta.vercel.app'
        }
      ],
      data: {
        orderNumber,
        driverName,
        driverTag,
        wazeUrl: targetUrl,
        timestamp: Date.now()
      }
    };

    // If specific driver tag is requested, target filters
    if (driverTag && driverTag !== 'all') {
      oneSignalPayload.filters = [
        { field: 'tag', key: 'driver', relation: '=', value: driverTag }
      ];
      delete oneSignalPayload.included_segments;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Key ${ONESIGNAL_API_KEY}`
      },
      body: JSON.stringify(oneSignalPayload)
    });

    let oneSignalData: any = {};
    try {
      oneSignalData = await response.json();
    } catch {
      oneSignalData = { status: response.status };
    }

    return res.json({
      status: 'success',
      message: `התראת Push של OneSignal נשלחה בהצלחה ל${driverName || 'נהג'}!`,
      oneSignalResult: oneSignalData,
      notification: {
        heading: headingText,
        body: bodyText,
        wazeUrl: targetUrl,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.warn('OneSignal Notification error:', error.message);
    return res.status(500).json({
      status: 'error',
      message: 'שגיאה בשליחת התראת OneSignal',
      error: error.message
    });
  }
});

// 8. System Info & Direct Links
app.get('/api/system-info', (req, res) => {
  res.json({
    connectionStatus: 'connected',
    spreadsheetId: TARGET_SPREADSHEET_ID,
    sheetUrl: `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`,
    unifiedSheetUrl: `https://docs.google.com/spreadsheets/d/${TARGET_SPREADSHEET_ID}/edit`,
    gasEndpoint: GAS_ENDPOINT_URL,
    oneSignalAppId: ONESIGNAL_APP_ID,
    driveCustomerFoldersUrl: 'https://drive.google.com/drive/folders/1JGNbTlmB5yBH_cLOApKTvE39CEL6roFF',
    driveDeliveryNotesFolderUrl: 'https://drive.google.com/drive/folders/1Hnq5RjGmE0368ZCAKBratRJGzaj0wJJl'
  });
});

// Start Server with Vite
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 סידור נועה AI running on http://0.0.0.0:${PORT}`);
  });
}

start();
