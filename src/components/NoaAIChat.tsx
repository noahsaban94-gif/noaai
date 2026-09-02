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
  Check,
  CheckCheck,
  Search,
  ChevronRight,
  User,
  Users,
  Building2,
  Boxes,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Navigation,
  Scale,
  Calendar,
  X,
  Share2,
  Maximize2,
  AlertCircle,
  Info,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';
import { ChatMessage, Order, NormalizedOrderExtraction, OrderItem, DriverInfo } from '../types';
import { normalizeOrderText } from '../utils/normalizer';
import { useTheme } from '../context/ThemeContext';
import { SABAN_DRIVERS, SABAN_WAREHOUSES, INITIAL_ORDERS } from '../data/mockData';

interface NoaAIChatProps {
  onAddOrderToSchedule: (newOrder: Order) => void;
  onOpenOrderModal?: (order: Order) => void;
}

interface ChatConversation {
  id: string;
  name: string;
  role: string;
  avatarIcon: 'bot' | 'truck' | 'warehouse' | 'group';
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline: boolean;
  statusText: string;
  pinned?: boolean;
}

export const NoaAIChat: React.FC<NoaAIChatProps> = ({ 
  onAddOrderToSchedule,
  onOpenOrderModal
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  // Active Selected Conversation
  const [activeChatId, setActiveChatId] = useState<string>('noa');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'drivers' | 'warehouses'>('all');

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'noa',
      text: 'ראמי אחי אהובי! שלום וברכה. אני מחוברת ומאזינה לטבלאות סידור העבודה.\nהדבק כאן כל הודעת וואטסאפ חופשית מקבלן, ואני אנרמל אותה מיד מול המילון הלוגיסטי (טאב 1) ואפיק פקודת סידור עבודה עם תרשים עומס וכפתורי פעולה מהירים! 🚚\nבאדיבות נועה ❤️',
      timestamp: '08:00'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [approvedOrders, setApprovedOrders] = useState<Record<string, boolean>>({});
  
  // Voice Recording Simulator State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Attachment Drawer Popover State
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Dynamic POPUP Modal State
  const [activePopup, setActivePopup] = useState<{
    type: 'diagram' | 'delivery-note' | 'driver-card' | 'quick-preview';
    extraction?: NormalizedOrderExtraction;
    order?: Partial<Order>;
    msgId?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const conversations: ChatConversation[] = [
    {
      id: 'noa',
      name: 'נועה AI — סדרנית ראשית סבן',
      role: 'סדרנית חכמה ואימות מילון לוגיסטי',
      avatarIcon: 'bot',
      lastMessage: messages[messages.length - 1]?.text?.slice(0, 45) + '...',
      time: messages[messages.length - 1]?.timestamp || '08:00',
      unreadCount: 0,
      isOnline: true,
      statusText: 'מחוברת כעת • סדרנית ראשית ח. סבן חומרי בניין (1994) בע״מ',
      pinned: true
    },
    {
      id: 'driver-hikmat',
      name: 'חכמת (משאית 1 - 26T מנוף)',
      role: 'נהג מנוף כבד • מ"ר 615-41-002',
      avatarIcon: 'truck',
      lastMessage: 'סיימתי פריקת 4 בלות חול ברעננה. יוצא לכיוון כפר סבא.',
      time: '08:24',
      unreadCount: 1,
      isOnline: true,
      statusText: 'בדרך לפריקה • אתר כפר סבא (סבב בוקר)'
    },
    {
      id: 'driver-ali',
      name: 'עלי (משאית 2 - 15T חלוקה)',
      role: 'נהג חלוקה • מ"ר 814-12-301',
      avatarIcon: 'truck',
      lastMessage: 'העמסתי 40 לוחות גבס בהתלמיד, ממתין לחתימת תעודה.',
      time: '08:15',
      unreadCount: 0,
      isOnline: true,
      statusText: 'מעמיס במחסן 1 התלמיד'
    },
    {
      id: 'warehouse-harash',
      name: 'מחסן 4️⃣ החרש — מלט וחול',
      role: 'מחסן חומרי מליטה ובלות',
      avatarIcon: 'warehouse',
      lastMessage: 'מלאי זמין: 450 שקי מלט נשר, 40 בלות חול ים.',
      time: '07:45',
      isOnline: true,
      statusText: 'פתוח להעמסות • רמפת בלות פעילה'
    },
    {
      id: 'warehouse-talmid',
      name: 'מחסן 1️⃣ התלמיד — גבס וכלים',
      role: 'מחסן גבס, צבעים ופרזול',
      avatarIcon: 'warehouse',
      lastMessage: 'הוזמנו 100 לוחות גבס עמידי מים לסבב צהריים.',
      time: '07:30',
      isOnline: true,
      statusText: 'פתוח להעמסות • רמפת לוחות גבס'
    },
    {
      id: 'group-contractors',
      name: 'קבוצת תיאום אתרי קבלנים',
      role: 'עדכוני קבלנים בשטח',
      avatarIcon: 'group',
      lastMessage: 'קראמה אסאמה: צריך עוד 2 בלות טיט עד 11:00 דחוף',
      time: '08:10',
      unreadCount: 2,
      isOnline: true,
      statusText: '6 מנויים פעילים'
    }
  ];

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
                          c.lastMessage.toLowerCase().includes(chatSearchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'unread') return (c.unreadCount || 0) > 0;
    if (filterType === 'drivers') return c.id.startsWith('driver');
    if (filterType === 'warehouses') return c.id.startsWith('warehouse');
    return true;
  });

  const quickContractorMessages = [
    'ראמי אחי, 25 שקי מלט אפור ו-3 בלות חול לבן ענבר ברעננה דרך המשי 12',
    'קראמה אסאמה בכפר סבא: צריך 4 בלות טיט ו-20 שקי mp75 דחוף',
    'בזלת מזר בגבעתיים: 40 לוחות גבס לבן, 6 גבס ירוק ו-20 ניצבים 70',
    'אלפא הנדסה בתל אביב: 10 להבים לסכין יפני ו-5 קופסאות ברגי פחפח 13',
    'תביא לי 3 להבים לסכין יפני למחר למחסן'
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
    setShowAttachmentMenu(false);
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
        aiReplyText = `ראמי אחי אהובי! פענחתי ונרמלתי את פקודת ההזמנה מול המילון הלוגיסטי. בדוק את כרטיס הסידור, תרשים העומס וכפתורי הפעולה למטה ואשר בלחיצה אחת! 🚚 באדיבות נועה ❤️`;
      }

      // Clean raw asterisks if any exist in the response
      const cleanAiReply = aiReplyText.replace(/\*\*/g, '').replace(/\*/g, '');

      const noaMessageId = (Date.now() + 1).toString();
      const noaMessage: ChatMessage & { extraction?: NormalizedOrderExtraction } = {
        id: noaMessageId,
        sender: 'noa',
        text: cleanAiReply,
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
      const cleanSpeech = msg.text.replace(/[📦🚚❤️📍⚡📋📊]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.lang = 'he-IL';
      utterance.rate = 1.0;
      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setPlayingId(null);
    }
  };

  const handleSendVoiceNote = () => {
    setIsRecording(false);
    handleSendMessage('🎙️ [הודעה קולית מקבלן פענחתי אוטומטית]: ראמי אחי, תביא לי למחר בבוקר 25 שקי מלט נשר ו-4 בלות חול ים לרעננה דרך המשי');
  };

  // Helper to format clean Hebrew text without markdown
  const renderFormattedHebrewText = (text: string) => {
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    const lines = cleanText.split('\n');

    return (
      <div className="space-y-1.5 leading-relaxed text-[13px]">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1.5" />;

          const isGreeting = line.includes('ראמי אחי אהובי') || line.includes('שלום וברכה');
          const isSignature = line.includes('באדיבות נועה');
          const isItemLine = line.match(/^\d+\.\s*📦/);

          if (isGreeting) {
            return (
              <p key={idx} className="font-extrabold text-emerald-700 dark:text-emerald-400 font-hebrew-heavy">
                {line}
              </p>
            );
          }

          if (isSignature) {
            return (
              <p key={idx} className="font-bold text-rose-600 dark:text-rose-400 pt-1 text-[12px] flex items-center gap-1">
                <span>{line}</span>
              </p>
            );
          }

          if (isItemLine) {
            return (
              <div key={idx} className="bg-emerald-50/80 dark:bg-[#182229] p-2 rounded-xl border border-emerald-200/80 dark:border-[#2a3942] font-mono text-[12px] font-bold text-slate-900 dark:text-emerald-300">
                {line}
              </div>
            );
          }

          return (
            <p key={idx} className="font-medium">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  const activeConversation = conversations.find(c => c.id === activeChatId) || conversations[0];

  return (
    <div className="w-full flex-1 flex flex-col h-[calc(100vh-125px)] sm:h-[calc(100vh-115px)] max-w-[1700px] mx-auto p-0 sm:p-2 animate-in fade-in duration-200">
      {/* 100% WhatsApp Authentic Web/Mobile Container */}
      <div className={`w-full flex-1 flex overflow-hidden rounded-none sm:rounded-3xl border shadow-2xl transition-colors duration-200 ${
        isLight 
          ? 'bg-[#efeae2] border-slate-300 shadow-slate-300/60' 
          : 'bg-[#0b141a] border-[#222e35] shadow-black/80'
      }`}>
        
        {/* SIDEBAR: WhatsApp Conversations List (Visible on Desktop / hidden on mobile when chat open) */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-l transition-colors duration-200 shrink-0 ${
          activeChatId !== 'noa' ? 'hidden md:flex' : 'flex'
        } ${
          isLight ? 'bg-[#ffffff] border-[#e9edef]' : 'bg-[#111b21] border-[#222e35]'
        }`}>
          
          {/* Sidebar Header */}
          <div className={`p-3.5 border-b flex items-center justify-between ${
            isLight ? 'bg-[#f0f2f5] border-[#e9edef]' : 'bg-[#202c33] border-[#222e35]'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`font-black text-sm font-hebrew-heavy ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  ח. סבן לוגיסטיקה
                </h2>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  סנכרון פעיל • WhatsApp AI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[#54656f] dark:text-[#aebac1]">
              <button 
                onClick={toggleTheme}
                title={isLight ? 'מצב כהה' : 'מצב בהיר'}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                {isLight ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-300" />}
              </button>
              <button title="הודעה חדשה" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                <Edit3 className="w-4 h-4" />
              </button>
              <button title="אפשרויות" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Box */}
          <div className={`p-2.5 border-b ${
            isLight ? 'bg-white border-[#f0f2f5]' : 'bg-[#111b21] border-[#222e35]'
          }`}>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs ${
              isLight ? 'bg-[#f0f2f5] text-slate-900' : 'bg-[#202c33] text-white'
            }`}>
              <Search className="w-4 h-4 text-[#8696a0] shrink-0" />
              <input
                type="text"
                placeholder="חפש שיחה, נהג או מחסן..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none placeholder-[#8696a0] text-xs font-sans"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                  filterType === 'all'
                    ? isLight ? 'bg-[#008069] text-white' : 'bg-[#00a884] text-[#111b21]'
                    : isLight ? 'bg-[#f0f2f5] text-slate-700 hover:bg-slate-200' : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                }`}
              >
                הכל
              </button>
              <button
                onClick={() => setFilterType('unread')}
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                  filterType === 'unread'
                    ? isLight ? 'bg-[#008069] text-white' : 'bg-[#00a884] text-[#111b21]'
                    : isLight ? 'bg-[#f0f2f5] text-slate-700 hover:bg-slate-200' : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                }`}
              >
                לא נקראו (3)
              </button>
              <button
                onClick={() => setFilterType('drivers')}
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                  filterType === 'drivers'
                    ? isLight ? 'bg-[#008069] text-white' : 'bg-[#00a884] text-[#111b21]'
                    : isLight ? 'bg-[#f0f2f5] text-slate-700 hover:bg-slate-200' : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                }`}
              >
                נהגים (חכמת/עלי)
              </button>
              <button
                onClick={() => setFilterType('warehouses')}
                className={`px-3 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                  filterType === 'warehouses'
                    ? isLight ? 'bg-[#008069] text-white' : 'bg-[#00a884] text-[#111b21]'
                    : isLight ? 'bg-[#f0f2f5] text-slate-700 hover:bg-slate-200' : 'bg-[#202c33] text-[#8696a0] hover:bg-[#2a3942]'
                }`}
              >
                מחסנים (4/1)
              </button>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-transparent">
            {filteredConversations.map((conv) => {
              const isActive = activeChatId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveChatId(conv.id)}
                  className={`p-3 flex items-center gap-3 cursor-pointer transition relative ${
                    isActive 
                      ? isLight ? 'bg-[#f0f2f5]' : 'bg-[#2a3942]'
                      : isLight ? 'hover:bg-[#f5f6f6]' : 'hover:bg-[#202c33]'
                  }`}
                >
                  {/* Avatar with Status indicator */}
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                      conv.avatarIcon === 'bot' 
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 ring-2 ring-emerald-500' 
                        : conv.avatarIcon === 'truck'
                        ? 'bg-sky-600'
                        : conv.avatarIcon === 'warehouse'
                        ? 'bg-amber-600'
                        : 'bg-purple-600'
                    }`}>
                      {conv.avatarIcon === 'bot' && <Bot className="w-6 h-6 text-white" />}
                      {conv.avatarIcon === 'truck' && <Truck className="w-6 h-6 text-white" />}
                      {conv.avatarIcon === 'warehouse' && <Building2 className="w-6 h-6 text-white" />}
                      {conv.avatarIcon === 'group' && <Users className="w-6 h-6 text-white" />}
                    </div>
                    {conv.isOnline && (
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111b21] absolute bottom-0 right-0"></span>
                    )}
                  </div>

                  {/* Conversation Meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs font-black truncate font-hebrew-heavy ${
                        isLight ? 'text-slate-900' : 'text-[#e9edef]'
                      }`}>
                        {conv.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#8696a0]">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-[#8696a0] truncate max-w-[190px]">
                        {conv.lastMessage}
                      </p>
                      {conv.unreadCount && conv.unreadCount > 0 ? (
                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CHAT AREA (WhatsApp Active Conversation Pane) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          
          {/* WhatsApp Chat Top Header Bar */}
          <div className={`px-4 py-3 border-b flex items-center justify-between z-10 transition-colors shadow-sm ${
            isLight ? 'bg-[#f0f2f5] border-[#e9edef]' : 'bg-[#202c33] border-[#222e35]'
          }`}>
            <div className="flex items-center gap-3">
              {/* Back button on mobile if needed */}
              <button 
                onClick={() => setActiveChatId('noa')}
                className="md:hidden text-[#8696a0] hover:text-white p-1 rounded-full"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Header Avatar */}
              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                  activeConversation.avatarIcon === 'bot' 
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-400' 
                    : 'bg-sky-600'
                }`}>
                  <Bot className="w-5 h-5" />
                </div>
                <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#202c33] absolute bottom-0 right-0 animate-pulse"></span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className={`font-black text-sm font-hebrew-heavy ${
                    isLight ? 'text-slate-900' : 'text-[#e9edef]'
                  }`}>
                    {activeConversation.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono border border-emerald-500/30">
                    WhatsApp AI 🌹
                  </span>
                </div>
                <p className="text-[11px] text-[#54656f] dark:text-[#8696a0] flex items-center gap-1.5 font-medium truncate max-w-xs sm:max-w-md">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">מחוברת כעת</span>
                  <span>•</span>
                  <span>{activeConversation.statusText}</span>
                </p>
              </div>
            </div>

            {/* Header Action Tools */}
            <div className="flex items-center gap-1 sm:gap-2 text-[#54656f] dark:text-[#aebac1]">
              <button 
                onClick={() => handleSendMessage('נועה תציגי לי את דוח סידור הבוקר המבצעי וחלוקת המשאיות')}
                title="הצג דוח סבב בוקר"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>דוח בוקר</span>
              </button>

              <button 
                title="שיחת וידאו לאתר" 
                className="hover:text-emerald-600 dark:hover:text-white p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <Video className="w-4 h-4" />
              </button>
              <button 
                title="שיחה קולית" 
                className="hover:text-emerald-600 dark:hover:text-white p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                title="חיפוש בהודעות" 
                className="hover:text-emerald-600 dark:hover:text-white p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <Search className="w-4 h-4" />
              </button>
              <button 
                title="אפשרויות נוספות" 
                className="hover:text-emerald-600 dark:hover:text-white p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* WhatsApp Chat Body & Wallpaper Canvas */}
          <div 
            className={`flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 relative scrollbar-thin transition-colors ${
              isLight ? 'bg-[#efeae2]' : 'bg-[#0b141a]'
            }`}
            style={{
              backgroundImage: isLight 
                ? `radial-gradient(#d1d7db 0.8px, transparent 0.8px)`
                : `radial-gradient(#1f2c34 0.8px, transparent 0.8px)`,
              backgroundSize: '24px 24px'
            }}
          >
            {/* System Security Notice */}
            <div className="flex justify-center">
              <div className={`text-[11px] px-4 py-2 rounded-2xl shadow text-center max-w-lg flex items-center gap-2 border font-medium ${
                isLight 
                  ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-amber-100/50' 
                  : 'bg-[#182229] border-[#222e35] text-[#ffd279] shadow-black/40'
              }`}>
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-[#ffd279] shrink-0" />
                <span>הודעות מוגנות ומסונכרנות ישירות מול גיליון הליבה 1VA9J6n... של ח. סבן חומרי בניין בע״מ</span>
              </div>
            </div>

            {/* Chat Messages */}
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
                    className={`max-w-[94%] sm:max-w-[85%] md:max-w-[78%] rounded-3xl p-4 text-xs leading-relaxed space-y-3 shadow-lg border ${
                      isNoa
                        ? isLight
                          ? 'bg-white text-slate-900 rounded-tr-none border-slate-200/90 shadow-slate-200/50'
                          : 'bg-[#202c33] text-[#e9edef] rounded-tr-none border-[#2a3942] shadow-black/40'
                        : isLight
                          ? 'bg-[#d9fdd3] text-slate-900 rounded-tl-none border-emerald-200 shadow-emerald-100/50 font-bold'
                          : 'bg-[#005c4b] text-[#e9edef] rounded-tl-none border-[#005c4b] shadow-black/40 font-bold'
                    }`}
                  >
                    {/* Header if Noa */}
                    {isNoa && (
                      <div className="flex items-center justify-between border-b border-black/5 dark:border-[#2a3942] pb-1.5 text-[11px] font-black font-hebrew-heavy text-emerald-700 dark:text-emerald-400">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-4 h-4" />
                          <span>נועה AI — סדרנית ראשית סבן</span>
                        </span>
                        <div className="flex items-center gap-2 font-normal text-[10px]">
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="text-[#54656f] dark:text-[#8696a0] hover:text-emerald-600 dark:hover:text-white flex items-center gap-1"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'הועתק' : 'העתק'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Formatted Hebrew Message Body (No raw asterisks!) */}
                    {renderFormattedHebrewText(msg.text)}

                    {/* INTERACTIVE NORMALIZATION & ACTION CARD */}
                    {isNoa && hasExtraction && (
                      <div className={`rounded-2xl p-4 space-y-3 mt-3 text-right border shadow-inner ${
                        isLight 
                          ? 'bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/70 border-emerald-300' 
                          : 'bg-[#111b21] border-emerald-500/50'
                      }`}>
                        {/* Normalizer Top Badge */}
                        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-black text-xs font-hebrew-heavy">
                            <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span>נרמול פקודת הזמנה מול מילון לוגיסטי (טאב 1)</span>
                          </div>
                          <span className="text-[10px] font-mono font-black text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800">
                            Items_Details
                          </span>
                        </div>

                        {/* Structured Output String (Google Sheets Table 2 Structure) */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-500 dark:text-[#8696a0] font-bold block">
                            מחרוזת פריטים מנורמלת לטבלה 2:
                          </span>
                          <div className={`p-3 rounded-xl border font-mono text-xs font-black leading-relaxed ${
                            isLight 
                              ? 'bg-white text-emerald-900 border-emerald-200 shadow-sm' 
                              : 'bg-[#1a242a] text-emerald-300 border-[#2a3942]'
                          }`}>
                            {msg.extraction.normalizedItemsString}
                          </div>
                        </div>

                        {/* SKUs Identified Grid */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 dark:text-[#8696a0] font-bold block">
                            פירוט מק"טים שזוהו אוטומטית:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.extraction.items.map((item: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                  isLight 
                                    ? 'bg-white border-slate-200 text-slate-900 shadow-sm' 
                                    : 'bg-[#202c33] border-[#2a3942] text-white'
                                }`}
                              >
                                <div>
                                  <span className="font-mono font-black text-sky-600 dark:text-cyan-400">#{item.sku}</span>
                                  <p className="font-bold truncate max-w-[150px]">{item.officialName}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                                  isLight ? 'bg-emerald-100 text-emerald-900' : 'bg-emerald-950 text-emerald-300'
                                }`}>
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dispatch Metadata Box */}
                        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-xl border ${
                          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#182229] border-[#222e35] text-white'
                        }`}>
                          <div>
                            <span className="text-[10px] text-[#8696a0] font-bold block">לקוח:</span>
                            <span className="font-black text-slate-900 dark:text-white">{msg.extraction.customerName}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8696a0] font-bold block">יעד פריקה:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{msg.extraction.destination}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8696a0] font-bold block">נהג משויך:</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400">{msg.extraction.assignedDriver}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#8696a0] font-bold block">פקדונות:</span>
                            <span className="font-mono font-bold">בלות: {msg.extraction.bigBags} | משטחים: {msg.extraction.pallets}</span>
                          </div>
                        </div>

                        {/* MINI LOAD DIAGRAM PREVIEW INSIDE BUBBLE */}
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-[#162127] border-[#24333b]'
                        }`}>
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                              <Truck className="w-3.5 h-3.5" />
                              <span>תרשים עומס משאית משוער:</span>
                            </span>
                            <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">
                              {msg.extraction.items.reduce((acc: number, it: any) => acc + (it.quantity * 25), 0)} ק"ג / 26,000 ק"ג
                            </span>
                          </div>
                          
                          {/* Visual Progress Bar */}
                          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-500 rounded-full"
                              style={{ 
                                width: `${Math.min(100, Math.max(20, (msg.extraction.items.reduce((acc: number, it: any) => acc + (it.quantity * 25), 0) / 26000) * 100))}%` 
                              }}
                            />
                          </div>
                        </div>

                        {/* RICH ACTION BUTTONS ROW (Core Requested Feature) */}
                        <div className="pt-2 border-t border-emerald-500/20 flex flex-wrap items-center gap-2">
                          {isApproved ? (
                            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-black shadow-md">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                              <span>ההזמנה אושרה והוזרקה בהצלחה לטבלה 2 'סידור_עבודה_יומי'!</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApproveOrder(msg.id, msg.extraction)}
                              className="flex-1 min-w-[200px] px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>⚡ שריין בסידור עבודה (טאב 2)</span>
                            </button>
                          )}

                          {/* Action Button: Dynamic Diagram Modal */}
                          <button
                            onClick={() => setActivePopup({
                              type: 'diagram',
                              extraction: msg.extraction,
                              msgId: msg.id
                            })}
                            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border shadow-sm ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-sky-800 border-sky-300'
                                : 'bg-[#202c33] hover:bg-[#2a3942] text-cyan-300 border-[#2a3942]'
                            }`}
                          >
                            <Sliders className="w-4 h-4 text-sky-600 dark:text-cyan-400" />
                            <span>📊 הצג תרשים חלוקה</span>
                          </button>

                          {/* Action Button: Delivery Note */}
                          <button
                            onClick={() => setActivePopup({
                              type: 'delivery-note',
                              extraction: msg.extraction,
                              msgId: msg.id
                            })}
                            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border shadow-sm ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300'
                                : 'bg-[#202c33] hover:bg-[#2a3942] text-slate-200 border-[#2a3942]'
                            }`}
                          >
                            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>📋 תעודת משלוח</span>
                          </button>

                          {/* Action Button: Waze Navigate */}
                          <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(msg.extraction.destination || 'Raanana')}&navigate=yes`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border shadow-sm ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-blue-800 border-blue-200'
                                : 'bg-[#202c33] hover:bg-[#2a3942] text-blue-300 border-[#2a3942]'
                            }`}
                          >
                            <Navigation className="w-4 h-4 text-blue-500" />
                            <span>📍 Waze</span>
                          </a>

                          {/* Action Button: Driver Call */}
                          <a
                            href="tel:0508861080"
                            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs transition flex items-center gap-1.5 border shadow-sm ${
                              isLight
                                ? 'bg-white hover:bg-slate-50 text-emerald-800 border-emerald-300'
                                : 'bg-[#202c33] hover:bg-[#2a3942] text-emerald-300 border-[#2a3942]'
                            }`}
                          >
                            <Phone className="w-4 h-4 text-emerald-500" />
                            <span>📞 חייג לנהג</span>
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Bottom Metadata: Voice audio player + Timestamp + Blue Ticks */}
                    <div className="flex items-center justify-between gap-3 pt-1 border-t border-black/5 dark:border-[#2a3942]/60 text-[10px] text-[#54656f] dark:text-[#8696a0]">
                      {isNoa ? (
                        <button
                          onClick={() => handlePlayVoice(msg)}
                          className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition"
                        >
                          {playingId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-rose-500" />
                              <span>עצור הקראה</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>הקשב לתדריך נועה 🎙️</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span></span>
                      )}

                      <div className="flex items-center gap-1.5 font-mono">
                        <span>{msg.timestamp}</span>
                        <CheckCheck className={`w-4 h-4 ${
                          isLight ? 'text-sky-600' : 'text-[#53bdeb]'
                        }`} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className={`flex items-center gap-2 text-xs font-bold p-3 rounded-2xl max-w-xs border shadow-md animate-pulse ${
                isLight 
                  ? 'bg-white border-emerald-300 text-emerald-900' 
                  : 'bg-[#202c33] border-[#2a3942] text-emerald-400'
              }`}>
                <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
                <span>נועה AI מנרמלת מול המילון הלוגיסטי...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Order Suggestions Chips */}
          <div className={`px-4 pt-2.5 pb-1.5 border-t transition-colors ${
            isLight ? 'bg-[#f0f2f5] border-[#e9edef]' : 'bg-[#1f2c34] border-[#2a3942]'
          }`}>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              <span className="text-[11px] text-[#54656f] dark:text-[#8696a0] font-black whitespace-nowrap pl-1 font-hebrew-heavy">
                הודעות קבלנים מהירות:
              </span>
              {quickContractorMessages.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isLoading}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition disabled:opacity-50 border ${
                    isLight
                      ? 'bg-white hover:bg-emerald-50 border-slate-300 text-slate-800 shadow-sm'
                      : 'bg-[#111b21] hover:bg-[#2a3942] border-[#2a3942] text-[#d1d7db]'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* ATTACHMENT DRAWER POPOVER */}
          {showAttachmentMenu && (
            <div className={`p-3 border-t grid grid-cols-2 sm:grid-cols-4 gap-2 animate-in fade-in zoom-in-95 duration-150 ${
              isLight ? 'bg-white border-slate-200 shadow-xl' : 'bg-[#202c33] border-[#2a3942] shadow-2xl'
            }`}>
              <button
                onClick={() => handleSendMessage('נועה תבדקי מלאי זמין של מלט, חול ובלוקים במחסן 4 החרש')}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition text-right ${
                  isLight ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-900' : 'bg-[#182229] hover:bg-[#222e35] border-[#2a3942] text-amber-300'
                }`}
              >
                <Boxes className="w-4 h-4 text-amber-500" />
                <span>בדיקת מלאי מחסן 4</span>
              </button>

              <button
                onClick={() => handleSendMessage('נועה איפה נמצא חכמת כרגע ואיזה משימות נשארו לו')}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition text-right ${
                  isLight ? 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-900' : 'bg-[#182229] hover:bg-[#222e35] border-[#2a3942] text-sky-300'
                }`}
              >
                <Truck className="w-4 h-4 text-sky-500" />
                <span>מיקום חכמת מנוף</span>
              </button>

              <button
                onClick={() => handleSendMessage('נועה תוציאי פקודת סידור דחופה לקראמה אסאמה בכפר סבא 4 בלות טיט')}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition text-right ${
                  isLight ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900' : 'bg-[#182229] hover:bg-[#222e35] border-[#2a3942] text-emerald-300'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span>הזמנה מהירה קראמה</span>
              </button>

              <button
                onClick={() => handleSendMessage('נועה תפיקי תעודת משלוח מרוכזת לכל סבב הבוקר')}
                className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold transition text-right ${
                  isLight ? 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900' : 'bg-[#182229] hover:bg-[#222e35] border-[#2a3942] text-purple-300'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-500" />
                <span>תעודות סבב בוקר</span>
              </button>
            </div>
          )}

          {/* WhatsApp Bottom Input Bar */}
          <div className={`p-3 border-t flex items-center gap-2 transition-colors ${
            isLight ? 'bg-[#f0f2f5] border-[#e9edef]' : 'bg-[#202c33] border-[#2a3942]'
          }`}>
            <button 
              onClick={() => setShowAttachmentMenu(prev => !prev)}
              title="תפריט פעולות והזמנות מהירות" 
              className={`p-2.5 rounded-full transition ${
                showAttachmentMenu 
                  ? 'bg-emerald-500 text-slate-950 font-bold' 
                  : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-[#8696a0] hover:bg-[#374248] hover:text-white'
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* If live recording mode */}
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                  <span>מקליט הודעה קולית מקבלן... 00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRecording(false)}
                    className="p-1.5 rounded-full hover:bg-rose-500/20 text-rose-500 transition"
                    title="בטל הקלטה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSendVoiceNote}
                    className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow flex items-center gap-1"
                  >
                    <span>שלח ופענח</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
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
                  placeholder="הדבק הודעת וואטסאפ של קבלן (למשל: תביא 25 שקי מלט ו-3 בלות חול לבן לרעננה)..."
                  disabled={isLoading}
                  className={`flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans border ${
                    isLight 
                      ? 'bg-white border-slate-300 text-slate-900 placeholder-slate-400' 
                      : 'bg-[#2a3942] border-[#374248] text-[#e9edef] placeholder-[#8696a0]'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-40 shadow-md flex items-center justify-center shrink-0"
                  title="שלח הודעה"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

            <button 
              onClick={() => {
                if (!isRecording) {
                  setIsRecording(true);
                } else {
                  handleSendVoiceNote();
                }
              }}
              title={isRecording ? 'סיים הקלטה' : 'הקלט הודעה קולית'} 
              className={`p-2.5 rounded-full transition ${
                isRecording 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : isLight ? 'text-slate-600 hover:bg-slate-200' : 'text-[#8696a0] hover:bg-[#374248] hover:text-white'
              }`}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC POPUP MODAL (Diagram, Delivery Note, Driver Card) */}
      {activePopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className={`rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border text-right animate-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-sky-200 shadow-sky-200/50' : 'bg-slate-900 border-slate-800'
          }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'bg-gradient-to-r from-sky-50 to-emerald-50 border-sky-100' : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold">
                  {activePopup.type === 'diagram' && <Sliders className="w-5 h-5" />}
                  {activePopup.type === 'delivery-note' && <FileText className="w-5 h-5" />}
                  {activePopup.type === 'driver-card' && <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className={`font-black text-sm font-hebrew-heavy ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activePopup.type === 'diagram' && 'תרשים חלוקה ועומס משאית (Load Distribution)'}
                    {activePopup.type === 'delivery-note' && 'תעודת משלוח מהירה וחתימה דיגיטלית'}
                    {activePopup.type === 'driver-card' && 'כרטיס נהג ומסלול פריקה'}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    לקוח: {activePopup.extraction?.customerName || 'כללי'} • יעד: {activePopup.extraction?.destination || 'מרכז'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActivePopup(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* 1. DIAGRAM POPUP VIEW */}
              {activePopup.type === 'diagram' && activePopup.extraction && (
                <div className="space-y-4">
                  {/* SVG Route Flow Diagram */}
                  <div className={`p-4 rounded-2xl border text-center space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 block font-hebrew-heavy">
                      תרשים זרימת סבב אספקה ופריקה (Route Flow)
                    </span>
                    
                    <div className="flex items-center justify-between gap-2 max-w-md mx-auto pt-2">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black mt-1">מחסן 4 החרש</span>
                        <span className="text-[9px] text-slate-400">08:00 העמסה</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-2">
                        <div className="w-full h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500 rounded-full relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute -top-1 left-1/2 -translate-x-1/2 animate-ping" />
                        </div>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold mt-1">18 דק' נסיעה</span>
                      </div>

                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-600 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-black mt-1">{activePopup.extraction.destination || 'אתר רעננה'}</span>
                        <span className="text-[9px] text-slate-400">08:45 פריקת מנוף</span>
                      </div>
                    </div>
                  </div>

                  {/* Truck Payload Diagram */}
                  <div className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-black">
                      <span>חלוקת משקל על סרני המשאית (חכמת מנוף 26T):</span>
                      <span className="font-mono text-emerald-600">משקל כולל: 4,800 ק"ג</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                        <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">בלות חול וטיט</span>
                        <span className="font-mono font-black text-sm text-purple-900 dark:text-white">{activePopup.extraction.bigBags} יח'</span>
                      </div>
                      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold block">משטחי סבן</span>
                        <span className="font-mono font-black text-sm text-indigo-900 dark:text-white">{activePopup.extraction.pallets} יח'</span>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block">מנוף הידראולי</span>
                        <span className="font-black text-xs text-emerald-900 dark:text-white">
                          {activePopup.extraction.isCraneRequired ? 'דרוש לפריקה' : 'ללא מנוף'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Approve button inside popup */}
                  <button
                    onClick={() => {
                      if (activePopup.msgId && activePopup.extraction) {
                        handleApproveOrder(activePopup.msgId, activePopup.extraction);
                        setActivePopup(null);
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>אשר סידור עבודה והזרק לגיליון (טאב 2)</span>
                  </button>
                </div>
              )}

              {/* 2. DELIVERY NOTE VIEW */}
              {activePopup.type === 'delivery-note' && activePopup.extraction && (
                <div className="space-y-4">
                  <div className="bg-white text-slate-950 p-5 rounded-2xl border border-slate-200 shadow space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h4 className="font-black text-sm font-hebrew-heavy">ח. סבן חומרי בניין (1994) בע"מ</h4>
                        <span className="text-[10px] text-slate-500">תעודת משלוח דיגיטלית מהירה</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-sky-800">DN-PREVIEW</span>
                    </div>

                    <div className="text-xs space-y-1 font-mono">
                      <p><strong>לקוח:</strong> {activePopup.extraction.customerName}</p>
                      <p><strong>יעד פריקה:</strong> {activePopup.extraction.destination}</p>
                      <p><strong>פריטים:</strong> {activePopup.extraction.normalizedItemsString}</p>
                    </div>

                    <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50">
                      <span className="text-[10px] text-slate-400 block mb-1">חתימת לקוח דיגיטלית באתר:</span>
                      <span className="font-mono text-xs text-slate-700 italic">אושר באמצעות WhatsApp AI</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (activePopup.msgId && activePopup.extraction) {
                        handleApproveOrder(activePopup.msgId, activePopup.extraction);
                        setActivePopup(null);
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>שמור תעודה וסנכרן לטאב 3</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
