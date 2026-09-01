import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  FileText, 
  Phone, 
  Video, 
  MoreVertical, 
  Smile, 
  Paperclip, 
  Mic, 
  Truck, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Edit3, 
  ArrowRight,
  PlusCircle,
  Copy,
  Check
} from 'lucide-react';
import { ChatMessage, Order, NormalizedOrderExtraction, OrderItem } from '../types';
import { normalizeOrderText } from '../utils/normalizer';

interface NoaAIChatProps {
  onAddOrderToSchedule: (newOrder: Order) => void;
  onOpenOrderModal?: (order: Order) => void;
}

export const NoaAIChat: React.FC<NoaAIChatProps> = ({ 
  onAddOrderToSchedule,
  onOpenOrderModal
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'noa',
      text: 'ראמי אחי אהובי! שלום וברכה. אני מחוברת ומאזינה לטבלאות סידור העבודה. הדבק כאן כל הודעת וואטסאפ חופשית מקבלן, ואני אנרמל אותה מיד מול המילון הלוגיסטי (טאב 1) ואפיק פקודת סידור עבודה! 🚚 באדיבות נועה ❤️',
      timestamp: '08:00'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [approvedOrders, setApprovedOrders] = useState<Record<string, boolean>>({});
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const quickContractorMessages = [
    'תביא לי 3 להבים לסכין יפני למחר',
    'ראמי אחי, 25 שקי מלט אפור ו-3 בלות חול לבן ענבר ברעננה דרך המשי 12',
    'קראמה אסאמה בכפר סבא: צריך 4 בלות טיט ו-20 שקי mp75 דחוף',
    'בזלת מזר בגבעתיים: 40 לוחות גבס לבן, 6 גבס ירוק ו-20 ניצבים 70',
    'אלפא הנדסה בתל אביב: 10 להבים לסכין יפני ו-5 קופסאות ברגי פחפח 13'
  ];

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputText;
    if (!text.trim() || isLoading) return;

    const userMessageId = Date.now().toString();
    const newTimestamp = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // 1. Append Contractor's Raw Message
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: text.trim(),
      timestamp: newTimestamp
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInputText('');
    setIsLoading(true);

    try {
      // 2. Perform Local Normalization against Logistics Dictionary (Table 1)
      const localExtraction = normalizeOrderText(text);

      // 3. Request Gemini AI Enhancement / Chat from Backend
      let aiReplyText = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text })
        });
        const data = await res.json();
        aiReplyText = data.reply || '';
      } catch (err) {
        console.warn('Backend chat fallback:', err);
      }

      if (!aiReplyText) {
        aiReplyText = `ראמי אחי אהובי! פענחתי ונרמלתי את הודעת הוואטסאפ מול המילון הלוגיסטי. בדוק את כרטיס הסידור למטה ואשר בלחיצה אחת! 🚚 באדיבות נועה ❤️`;
      }

      const noaMessageId = (Date.now() + 1).toString();
      const noaMessage: ChatMessage & { extraction?: NormalizedOrderExtraction } = {
        id: noaMessageId,
        sender: 'noa',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        extraction: localExtraction.items.length > 0 ? localExtraction : undefined
      };

      setMessages((prev) => [...prev, noaMessage]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Extraction into Table 2 Order ("סידור_עבודה_יומי")
  const handleApproveOrder = (msgId: string, extraction: NormalizedOrderExtraction) => {
    const orderNum = Math.floor(6215190 + Math.random() * 800).toString();
    const isHarash = extraction.items.some(i => i.sku === '11501' || i.sku === '11551' || i.sku === '10002' || i.sku === '14075');
    const warehouseId = isHarash ? '4_HARASH' : '1_TALMID';
    const warehouseName = isHarash ? '🏭 4️⃣ החרש (מלט וחול)' : '🏟️ 1️⃣ התלמיד (גבס וכלים)';

    const orderItems: OrderItem[] = extraction.items.map(item => ({
      sku: item.sku,
      name: item.officialName,
      quantity: item.quantity,
      unit: item.unit,
      depositType: (item.sku === '11501' || item.sku === '11551') ? 'bigBag' : (item.sku === '10002' || item.sku === '14075') ? 'pallet' : 'none'
    }));

    const formattedList = extraction.items.map((it, idx) => 
      `${idx + 1}. 📦 מק"ט: ${it.sku} | ${it.officialName} | כמות: ${it.quantity} ${it.unit}`
    ).join('\n');

    const totalWeight = extraction.items.reduce((acc, it) => acc + (it.quantity * 25), 0);

    const newOrder: Order = {
      orderNumber: orderNum,
      orderId: orderNum,
      customerNumber: '6' + Math.floor(10000 + Math.random() * 90000),
      customerName: extraction.customerName || 'לקוח וואטסאפ כללי',
      siteAddress: extraction.destination || 'כתובת אתר — מרכז',
      destination: extraction.destination || 'כתובת אתר — מרכז',
      city: extraction.city || 'רעננה',
      warehouse: warehouseId,
      warehouseName,
      itemsFormatted: formattedList,
      itemsDetails: extraction.normalizedItemsString,
      itemsList: orderItems,
      bigBagsDeposit: extraction.bigBags,
      palletsDeposit: extraction.pallets,
      assignedDriver: extraction.assignedDriver || 'חכמת (משאית מנוף)',
      driver: extraction.assignedDriver || 'חכמת (משאית מנוף)',
      driverId: extraction.assignedDriver?.includes('חכמת') ? 'hikmat' : 'ali',
      driverPhone: extraction.assignedDriver?.includes('חכמת') ? '050-886-1080' : '052-771-4490',
      status: 'Pending',
      deliveryNote: 'טרם הופקה',
      wazeUrl: `https://waze.com/ul?q=${encodeURIComponent(extraction.destination || 'Raanana')}&navigate=yes`,
      totalWeightKg: totalWeight > 0 ? totalWeight : 1500,
      isCraneRequired: extraction.isCraneRequired,
      scheduledTime: '09:00',
      round: 'סבב בוקר',
      signatureReceived: false,
      isSynced: false
    };

    onAddOrderToSchedule(newOrder);
    setApprovedOrders(prev => ({ ...prev, [msgId]: true }));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handlePlayVoice = async (msg: ChatMessage) => {
    if (playingId === msg.id) {
      setPlayingId(null);
      window.speechSynthesis?.cancel();
      return;
    }

    setPlayingId(msg.id);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text })
      });
      const data = await res.json();

      if (data.audioContent) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audio.onended = () => setPlayingId(null);
        audio.play();
        return;
      }
    } catch (e) {
      console.warn('TTS server fallback:', e);
    }

    // Web Speech API Fallback
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(msg.text.replace(/[📦🚚❤️]/g, ''));
      utterance.lang = 'he-IL';
      utterance.rate = 1.0;
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* WhatsApp Window Wrapper */}
      <div className="rounded-3xl border border-[#1f2c34] bg-[#0c1317] shadow-2xl overflow-hidden flex flex-col h-[750px]">
        {/* WhatsApp Top Header Bar */}
        <div className="bg-[#1f2c34] px-4 py-3 border-b border-[#2a3942] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-[#111b21] rounded-full flex items-center justify-center text-emerald-400">
                  <Bot className="w-6 h-6" />
                </div>
              </div>
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#1f2c34] absolute bottom-0 right-0"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">נועה AI — סדרנית ראשית סבן</h3>
                <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono">
                  WhatsApp Bot
                </span>
              </div>
              <p className="text-[11px] text-[#8696a0] flex items-center gap-1.5">
                <span className="text-emerald-400">מחוברת כעת</span>
                <span>•</span>
                <span>מנרמלת ישירות מול 'מילון_לוגיסטי' (טאב 1)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#aebac1]">
            <button title="שיחת וידאו" className="hover:text-white p-1.5 rounded-full hover:bg-[#374248] transition">
              <Video className="w-5 h-5" />
            </button>
            <button title="שיחה קולית" className="hover:text-white p-1.5 rounded-full hover:bg-[#374248] transition">
              <Phone className="w-4 h-4" />
            </button>
            <button title="אפשרויות נוספות" className="hover:text-white p-1.5 rounded-full hover:bg-[#374248] transition">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat Body & Wallpaper */}
        <div 
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#0b141a] relative scrollbar-thin"
          style={{
            backgroundImage: `radial-gradient(#1f2c34 0.75px, transparent 0.75px)`,
            backgroundSize: '24px 24px'
          }}
        >
          {/* Encryption / System Notice */}
          <div className="flex justify-center">
            <div className="bg-[#182229] border border-[#222e35] text-[#ffd279] text-[11px] px-3.5 py-1.5 rounded-xl shadow text-center max-w-md flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#ffd279] shrink-0" />
              <span>הודעות מוגנות ומסונכרנות ישירות מול גיליון הליבה של ח. סבן חומרי בניין (1VA9J6n...)</span>
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg: any) => {
            const isNoa = msg.sender === 'noa';
            const hasExtraction = msg.extraction && msg.extraction.items && msg.extraction.items.length > 0;
            const isApproved = approvedOrders[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex ${isNoa ? 'justify-start' : 'justify-end'} animate-in fade-in duration-200`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-xs leading-relaxed space-y-3 shadow-md ${
                    isNoa
                      ? 'bg-[#202c33] text-[#e9edef] rounded-tr-none border border-[#2a3942]'
                      : 'bg-[#005c4b] text-[#e9edef] rounded-tl-none font-medium'
                  }`}
                >
                  {/* Sender Name if Noa */}
                  {isNoa && (
                    <div className="flex items-center justify-between border-b border-[#2a3942] pb-1.5 text-[11px] font-bold text-emerald-400">
                      <span>נועה AI (סדרנית)</span>
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="text-[#8696a0] hover:text-white flex items-center gap-1 font-normal text-[10px]"
                      >
                        {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === msg.id ? 'הועתק' : 'העתק'}</span>
                      </button>
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="whitespace-pre-wrap text-[13px]">{msg.text}</p>

                  {/* NORMALIZATION CARD (Core requested NLP Engine Output) */}
                  {isNoa && hasExtraction && (
                    <div className="bg-[#111b21] border border-emerald-500/40 rounded-xl p-3.5 space-y-3 mt-2 text-right">
                      <div className="flex items-center justify-between border-b border-[#222e35] pb-2">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                          <span>נרמול פקודת הזמנה (Noa AI Normalizer)</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400/80 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                          טאב 1: מילון לוגיסטי
                        </span>
                      </div>

                      {/* Structured Output Format: (מק"ט: [SKU] - [שם] כמות: [מספר]) */}
                      <div className="space-y-1">
                        <span className="text-[11px] text-[#8696a0] block">מחרוזת נרמול רשמית (Items_Details):</span>
                        <div className="bg-[#1a242a] p-2.5 rounded-lg border border-[#2a3942] font-mono text-emerald-300 text-xs font-semibold leading-relaxed">
                          {msg.extraction.normalizedItemsString}
                        </div>
                      </div>

                      {/* Extracted Item Breakdown Badges */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] text-[#8696a0] block">פירוט מק"טים שזוהו במילון:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.extraction.items.map((item: any, idx: number) => (
                            <div key={idx} className="bg-[#202c33] p-2 rounded-lg border border-[#2a3942] flex items-center justify-between text-[11px]">
                              <div>
                                <span className="font-mono font-bold text-cyan-400">#{item.sku}</span>
                                <p className="text-white font-medium truncate max-w-[140px]">{item.officialName}</p>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold font-mono">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer & Logistics Details */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#182229] p-2.5 rounded-lg border border-[#222e35]">
                        <div>
                          <span className="text-[#8696a0] block text-[10px]">לקוח מזוהה:</span>
                          <span className="font-bold text-white">{msg.extraction.customerName}</span>
                        </div>
                        <div>
                          <span className="text-[#8696a0] block text-[10px]">יעד פריקה:</span>
                          <span className="font-bold text-white">{msg.extraction.destination}</span>
                        </div>
                        <div>
                          <span className="text-[#8696a0] block text-[10px]">נהג משויך:</span>
                          <span className="font-bold text-emerald-400">{msg.extraction.assignedDriver}</span>
                        </div>
                        <div>
                          <span className="text-[#8696a0] block text-[10px]">פקדונות:</span>
                          <span className="text-[#e9edef]">בלות: {msg.extraction.bigBags} | משטחים: {msg.extraction.pallets}</span>
                        </div>
                      </div>

                      {/* Action Buttons inside Chat Bubble */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#222e35]">
                        {isApproved ? (
                          <div className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>ההזמנה הוזנה בהצלחה לטבלה 2 'סידור_עבודה_יומי'!</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleApproveOrder(msg.id, msg.extraction)}
                              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>אשר הזמנה והזן לסידור עבודה</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Voice Button */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2a3942]/60 text-[10px] text-[#8696a0]">
                    <span className="font-mono">{msg.timestamp}</span>
                    {isNoa && (
                      <button
                        onClick={() => handlePlayVoice(msg)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
                      >
                        {playingId === msg.id ? (
                          <>
                            <VolumeX className="w-3 h-3 text-red-400" />
                            <span>עצור שמע</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>הקשב לנועה</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-[#202c33] p-3 rounded-2xl max-w-xs border border-[#2a3942]">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
              <span>נועה AI מנרמלת מול מילון לוגיסטי...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-[#1f2c34] px-4 pt-2.5 pb-1 border-t border-[#2a3942]">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[11px] text-[#8696a0] whitespace-nowrap pl-1">הודעות קבלנים לדוגמה:</span>
            {quickContractorMessages.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-3 py-1 rounded-full bg-[#111b21] hover:bg-[#2a3942] border border-[#2a3942] text-[#d1d7db] text-[11px] whitespace-nowrap transition disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Bottom Input Bar */}
        <div className="bg-[#202c33] p-3 border-t border-[#2a3942] flex items-center gap-2">
          <button title="אימוג'י" className="text-[#8696a0] hover:text-white p-2 rounded-full hover:bg-[#374248] transition">
            <Smile className="w-5 h-5" />
          </button>
          <button title="צרף קובץ" className="text-[#8696a0] hover:text-white p-2 rounded-full hover:bg-[#374248] transition">
            <Paperclip className="w-5 h-5" />
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex-1 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="הדבק הודעת וואטסאפ של קבלן (למשל: תביא לי 3 להבים לסכין יפני למחר)..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#2a3942] text-xs text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition disabled:opacity-50 shadow-md flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <button title="הקלטת הודעה קולית" className="text-[#8696a0] hover:text-white p-2 rounded-full hover:bg-[#374248] transition">
            <Mic className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
