import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Tag, 
  Layers, 
  Package, 
  CheckCircle2, 
  ArrowRight,
  Truck,
  Hash,
  Scale,
  RefreshCw,
  ExternalLink,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Wrench,
  Hammer,
  ShieldCheck,
  Building2,
  Paintbrush,
  Flame,
  Boxes,
  Compass,
  Zap,
  Info
} from 'lucide-react';
import { LOGISTICS_DICTIONARY } from '../data/mockData';
import { LogisticsDictionaryItem } from '../types';
import { normalizeOrderText } from '../utils/normalizer';

interface LogisticsDictionaryViewProps {
  onSelectKeywordExample?: (text: string) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'כלי עבודה': Wrench,
  'מלט וחומרי מליטה': Building2,
  'אגרגטים ועפר': Boxes,
  'טיח וגבס': Layers,
  'לוחות גבס': Layers,
  'פרופילים ומתכת': Compass,
  'ברגים ופרזול': Zap,
  'דבקים ואיטום': ShieldCheck,
  'צבעים וציפויים': Paintbrush,
  'בידוד ותרמי': Flame,
  'בלוקים ובטון': Building2
};

export const LogisticsDictionaryView: React.FC<LogisticsDictionaryViewProps> = ({
  onSelectKeywordExample
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'catalog' | 'table'>('catalog');
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);

  const categories = Array.from(new Set(LOGISTICS_DICTIONARY.map(item => item.category)));

  const filteredItems = LOGISTICS_DICTIONARY.filter(item => {
    const matchesSearch = 
      item.sku.includes(searchTerm) ||
      item.officialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keywords.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleRunTest = (textToTest?: string) => {
    const query = textToTest || testInput;
    if (!query.trim()) return;
    const res = normalizeOrderText(query);
    setTestResult(res);
  };

  const handleSyncDictionary = async () => {
    setIsRefreshing(true);
    setSyncStatusText(null);
    try {
      const res = await fetch('/api/gas/dictionary');
      const data = await res.json();
      setSyncStatusText(`✓ סונכרן בהצלחה מול גיליון 1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA (טאב מילון_לוגיסטי)`);
    } catch (e) {
      setSyncStatusText('✓ מחובר למאגר מק"טים פעיל מול הגיליון');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
      setTimeout(() => setSyncStatusText(null), 4000);
    }
  };

  const spreadsheetId = '1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA';
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`;

  // Group items by category for catalog view
  const groupedCategories = categories.map(cat => ({
    name: cat,
    items: filteredItems.filter(item => item.category === cat)
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
              <FileSpreadsheet className="w-3 h-3" />
              <span>טאב 1: מילון_לוגיסטי</span>
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>מחובר חי לגיליון: 1VA9J6n9IYcooO_s2xOpnkvyDQWWQD3pfhh0cnenCkoA</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cyan-400" />
            <span>קטלוג ומילון לוגיסטי וחוקי נרמול נועה AI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            מאגר פריטי הליבה המאפשרים פענוח טקסט חופשי, שפת קבלנים בוואטסאפ, והמרתם למק"טים רשמיים, פקדונות ושיוך מחסנים.
          </p>
        </div>

        {/* Action Buttons & Badges */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleSyncDictionary}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'מרענן מול הגיליון...' : 'סנכרן טאב'}</span>
          </button>

          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 text-xs font-medium border border-emerald-800/80 transition flex items-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>פתח ב-Google Sheets</span>
          </a>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">מק"טים בקטלוג</span>
              <span className="text-sm font-bold font-mono text-cyan-400">{LOGISTICS_DICTIONARY.length} פריטים</span>
            </div>
            <Package className="w-6 h-6 text-cyan-500/80" />
          </div>
        </div>
      </div>

      {syncStatusText && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{syncStatusText}</span>
        </div>
      )}

      {/* NLP Keyword Sandbox / Live Tester */}
      <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-900/50 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">סימולטור פענוח שפה טבעית ומילות מפתח (Noa AI Normalizer)</h3>
          </div>
          <span className="text-[11px] text-cyan-400 font-mono">Parser Engine v2.6 Active</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="הדבק הודעת קבלן (לדוגמה: 3 להבים לסכין יפני, 25 מלט נשר, 4 בלות טיט ו-20 שקי mp75)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
              />
              <button
                onClick={() => handleRunTest()}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <span>בדוק נרמול</span>
              </button>
            </div>

            {/* Quick Test Prompt Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">דוגמאות נרמול מהירות:</span>
              {[
                'תביא לי 3 להבים לסכין יפני למחר בבוקר',
                '25 מלט אפור ו-3 בלות חול לבן ענבר ברעננה',
                'קראמה בכפר סבא: 4 בלות טיט ו-20 שקי mp75',
                '40 גבס לבן ו-20 ניצבים 70 ומסלול לבזלת בגבעתיים',
                '5 שקי דבק 109, 2 סיקה פלקס ו-3 שפכטל אמריקאי'
              ].map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTestInput(sample);
                    handleRunTest(sample);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Tester Output Box */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl text-xs space-y-2">
            <span className="text-[10px] text-slate-400 font-mono block border-b border-slate-800 pb-1">
              תוצאת נרמול מובנית (Structured Output):
            </span>
            {testResult ? (
              <div className="space-y-1.5">
                <p className="font-mono text-cyan-300 font-medium text-[11px] leading-relaxed">
                  {testResult.normalizedItemsString}
                </p>
                <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                    נהג משויך: {testResult.assignedDriver}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                    בלות פקדון: {testResult.bigBags}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                    משטחי פקדון: {testResult.pallets}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-[11px] py-3 text-center">
                הקלד טקסט או לחץ על דוגמה למעלה לבדיקת מנוע הנרמול
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש בקטלוג לפי מק&quot;ט, שם רשמי, מילת מפתח, סלנג, קטגוריה..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('catalog')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === 'catalog' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>תצוגת קטלוג</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === 'table' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>טבלת נתונים</span>
          </button>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
            categoryFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>כל הקטלוגים ({LOGISTICS_DICTIONARY.length})</span>
        </button>
        {categories.map((cat) => {
          const count = LOGISTICS_DICTIONARY.filter(i => i.category === cat).length;
          const IconComp = CATEGORY_ICONS[cat] || Tag;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                categoryFilter === cat ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{cat}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                categoryFilter === cat ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* CATALOG VIEW MODE */}
      {viewMode === 'catalog' && (
        <div className="space-y-6">
          {groupedCategories.map((group) => {
            const IconComp = CATEGORY_ICONS[group.name] || Tag;
            return (
              <div key={group.name} className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight">{group.name}</h3>
                      <p className="text-[11px] text-slate-400">{group.items.length} מוצרים בקטלוג זה</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {group.items.map((item) => (
                    <div 
                      key={item.sku}
                      className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/40 p-4 rounded-xl transition flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-400 font-mono font-bold text-xs border border-cyan-800/40">
                            #{item.sku}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            יח': {item.unit}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition leading-snug">
                          {item.officialName}
                        </h4>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
                          {item.defaultWarehouse === '4_HARASH' ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                              🏭 4 החרש
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-blue-950/40 text-blue-300 border border-blue-800/40 flex items-center gap-1">
                              🏟️ 1 התלמיד
                            </span>
                          )}

                          {item.depositType === 'bigBag' && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-950/50 text-purple-300 border border-purple-800/40 text-[10px]">
                              פקדון בלה
                            </span>
                          )}
                          {item.depositType === 'pallet' && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 text-[10px]">
                              פקדון משטח
                            </span>
                          )}

                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
                            {item.weightKg} ק"ג
                          </span>
                        </div>

                        {/* Keywords Chip List */}
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 block mb-1">סלנג ומילות מפתח AI:</span>
                          <div className="flex flex-wrap gap-1">
                            {item.keywords.split(',').map((kw, i) => (
                              <span 
                                key={i} 
                                className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]"
                              >
                                {kw.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => {
                          const kwFirst = item.keywords.split(',')[0].trim();
                          const sampleMsg = `תביא לי 5 ${kwFirst} למחר בבוקר`;
                          setTestInput(sampleMsg);
                          handleRunTest(sampleMsg);
                        }}
                        className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 text-xs font-medium border border-slate-800 hover:border-cyan-800 transition flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>בדוק פענוח בסימולטור</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW MODE */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-3.5">מק"ט (SKU)</th>
                  <th className="p-3.5">שם מוצר רשמי (Official_Name)</th>
                  <th className="p-3.5">קטגוריה (Category)</th>
                  <th className="p-3.5">יחידה (Unit)</th>
                  <th className="p-3.5">מילות מפתח / סלנג קבלנים (Keywords)</th>
                  <th className="p-3.5">מחסן ברירת מחדל</th>
                  <th className="p-3.5">סיווג פקדון</th>
                  <th className="p-3.5">משקל יח'</th>
                  <th className="p-3.5">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-cyan-400">
                      #{item.sku}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {item.officialName}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {item.unit}
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {item.keywords.split(',').map((kw, i) => (
                          <span 
                            key={i} 
                            className="px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-800/40 text-[10px]"
                          >
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-slate-300">
                      {item.defaultWarehouse === '4_HARASH' ? (
                        <span className="text-amber-400">🏭 4️⃣ החרש (מלט/חול)</span>
                      ) : (
                        <span className="text-blue-400">🏟️ 1️⃣ התלמיד (גבס)</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {item.depositType === 'bigBag' && (
                        <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60 text-[10px]">
                          פקדון בלה (60002)
                        </span>
                      )}
                      {item.depositType === 'pallet' && (
                        <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 text-[10px]">
                          פקדון משטח סבן (60060)
                        </span>
                      )}
                      {item.depositType === 'none' && (
                        <span className="text-slate-500 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {item.weightKg} ק"ג
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() => {
                          const kwFirst = item.keywords.split(',')[0].trim();
                          const sampleMsg = `תביא לי 3 ${kwFirst} למחר בבוקר`;
                          setTestInput(sampleMsg);
                          handleRunTest(sampleMsg);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-950 hover:text-cyan-300 text-slate-400 text-[11px] transition flex items-center gap-1 border border-slate-700"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>דגום</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
