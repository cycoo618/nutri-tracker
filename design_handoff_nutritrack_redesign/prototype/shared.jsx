// shared.jsx — data + small components shared across variations

// ─── Demo data ─────────────────────────────────────────────
const TODAY = {
  date: '5月16日',
  weekday: '周六',
  dayOfPlan: 156,
  greeting: '午安',          // 早安 / 午安 / 晚安 based on time
  greetingNote: '主食和鱼都到位了,蔬菜还差一点',
  kcal: 457,
  kcalTarget: 1500,
  protein: { v: 18, t: 131, color: 'var(--sky)' },
  carbs:   { v: 76, t: 150, color: 'var(--mustard)' },
  fat:     { v: 8,  t: 42,  color: 'var(--tomato)' },
  fiber:   { v: 9,  t: 25,  color: 'var(--sage)' },
  sugar:   { v: 0,  t: 50,  unit: 'g' },
  sodium:  { v: 238, t: 2300, unit: 'mg' },
  omega:   { v: 0,  t: 250, unit: 'mg' },
};

const FOOD_GROUPS = [
  { key: 'veg',    emoji: '🥬', name: '蔬菜',   v: 0,   t: 350, range: '300–500 g', daysAgo: 2, color: 'var(--veg)' },
  { key: 'fruit',  emoji: '🍎', name: '水果',   v: 20,  t: 250, range: '200–350 g', daysAgo: 0, color: 'var(--fruit)' },
  { key: 'grain',  emoji: '🌾', name: '全谷物', v: 215, t: 75,  range: '50–150 g',  daysAgo: 0, color: 'var(--grain)', done: true },
  { key: 'bean',   emoji: '🫘', name: '豆类',   v: 25,  t: 150, range: '≈150 g 豆腐', daysAgo: 0, color: 'var(--bean)' },
  { key: 'nut',    emoji: '🥜', name: '坚果',   v: 0,   t: 30,  range: '25–35 g',   daysAgo: 2, color: 'var(--nut)' },
  { key: 'fish',   emoji: '🐟', name: '鱼/海鲜', v: 2,  t: 2,   range: '2 次/周',   daysAgo: 0, color: 'var(--fish)', done: true, isCount: true },
  { key: 'ferm',   emoji: '🫙', name: '发酵食品',v: 0,  t: 150, range: '每天一份',   daysAgo: 7, color: 'var(--ferm)' },
];

const MEALS = [
  { meal: '早餐', time: '08:20', kcal: 287, items: ['燕麦粥 · 100g', '蓝莓 · 20g', '希腊酸奶 · 30g'], note: '安静的一餐' },
  { meal: '午餐', time: '12:45', kcal: 170, items: ['糙米饭 · 115g', '清蒸鳕鱼 · 80g'], note: '蔬菜忘了' },
  { meal: '晚餐', time: null, kcal: 0, items: [], note: '还没开始' },
];

const SUGGESTIONS = [
  { tag: '发酵食品', body: '近 7 天内未吃过,希腊酸奶、泡菜、味噌汤、纳豆均可', icon: '🫙', tint: 'var(--ferm)' },
  { tag: '蔬菜',     body: '已 2 天未吃,午餐或晚餐加一份叶菜', icon: '🥬', tint: 'var(--veg)' },
  { tag: 'Omega-3',  body: '今天 0 mg,加一小把核桃或一片三文鱼', icon: '🐟', tint: 'var(--fish)' },
];

// ─── Status bar (warm-paper version) ─────────────────────
function PaperStatusBar({ time = '13:45' }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      height: 54, display: 'flex', alignItems: 'flex-start',
      padding: '18px 28px 0', justifyContent: 'space-between',
      fontFamily: '-apple-system, system-ui', fontWeight: 600, fontSize: 16,
      color: 'var(--ink)',
      pointerEvents: 'none',
    }}>
      <span>{time}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="18" height="11" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill="currentColor"/><rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill="currentColor"/><rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill="currentColor"/><rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill="currentColor"/></svg>
        <svg width="16" height="11" viewBox="0 0 17 12"><path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill="currentColor"/><path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill="currentColor"/><circle cx="8.5" cy="10.5" r="1.5" fill="currentColor"/></svg>
        <svg width="24" height="11" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="13" height="9" rx="2" fill="currentColor"/><path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill="currentColor" fillOpacity="0.4"/></svg>
      </div>
    </div>
  );
}

// ─── Ring progress (SVG, warm tones) ─────────────────────
function Ring({ value, target, size = 144, stroke = 10, color = 'var(--tomato)', trackColor = 'var(--line-soft)', children }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.min(value / target, 1);
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', textAlign: 'center' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Linear segmented progress ──────────────────────────
function Bar({ value, target, color, height = 6, track = 'var(--line-soft)' }) {
  const pct = Math.min(value / target, 1) * 100;
  return (
    <div style={{ height, background: track, borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width .3s' }} />
    </div>
  );
}

// ─── Bottom dock (shared) ─────────────────────────────────
function PaperDock({ active = '总览', onAdd, onNav }) {
  const tabs = [
    { k: '总览', icon: '◐' },
    { k: '趋势', icon: '☰' },
    { k: 'add', icon: '＋' },
    { k: '科学', icon: '✦' },
    { k: '我',  icon: '◯' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 14,
      height: 64, zIndex: 20,
      background: 'rgba(251,246,231,0.92)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--line-soft)',
      borderRadius: 22,
      boxShadow: '0 10px 30px rgba(76,55,30,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
    }}>
      {tabs.map(t => t.k === 'add' ? (
        <button key="add" onClick={onAdd} style={{
          width: 52, height: 52, borderRadius: '50%', border: 'none',
          background: 'var(--tomato)', color: '#FBF6E7',
          fontSize: 26, fontWeight: 300, lineHeight: 1,
          boxShadow: '0 6px 16px rgba(194,90,59,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
          cursor: 'pointer',
          marginTop: -22,
        }}>＋</button>
      ) : (
        <button key={t.k} onClick={() => onNav && onNav(t.k)} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          color: active === t.k ? 'var(--ink)' : 'var(--ink-mute)',
          fontFamily: 'Noto Serif SC, serif',
          fontWeight: active === t.k ? 700 : 400,
          fontSize: 11,
          padding: '6px 10px',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>{t.icon}</span>
          <span>{t.k}</span>
          {active === t.k && <span className="dot" />}
        </button>
      ))}
    </div>
  );
}

// ─── Add food bottom sheet (shared interactive demo) ─────
function AddSheet({ open, onClose }) {
  const [meal, setMeal] = React.useState('午餐');
  const meals = ['早餐', '午餐', '晚餐', '加餐'];
  const recent = [
    { name: '糙米饭', sub: '115g · 132 kcal', emoji: '🍚' },
    { name: '清蒸鳕鱼', sub: '80g · 84 kcal', emoji: '🐟' },
    { name: '希腊酸奶', sub: '一杯 · 80 kcal', emoji: '🥛' },
    { name: '蓝莓', sub: '20g · 11 kcal',   emoji: '🫐' },
  ];
  if (!open) return null;
  return (
    <>
      <div className="backdrop-in" onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 40,
        background: 'rgba(42,30,16,0.35)', backdropFilter: 'blur(4px)',
      }} />
      <div className="sheet-in" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41,
        background: 'var(--paper)',
        borderRadius: '24px 24px 0 0',
        padding: '14px 18px 28px',
        boxShadow: '0 -10px 40px rgba(42,30,16,0.15)',
        maxHeight: '78%', overflowY: 'auto',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>记一笔</h3>
          <span className="caveat" style={{ fontSize: 18, color: 'var(--tomato)' }}>add to today</span>
        </div>

        {/* Meal selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {meals.map(m => (
            <button key={m} onClick={() => setMeal(m)} style={{
              flex: 1, padding: '8px 0',
              background: meal === m ? 'var(--ink)' : 'var(--card)',
              color: meal === m ? 'var(--paper)' : 'var(--ink-soft)',
              border: '1px solid ' + (meal === m ? 'var(--ink)' : 'var(--line-soft)'),
              borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{m}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--card)', border: '1px solid var(--line-soft)',
          borderRadius: 12, padding: '10px 14px', marginBottom: 14,
        }}>
          <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>🔍</span>
          <span style={{ color: 'var(--ink-mute)', fontSize: 14, flex: 1 }}>搜食物 · 扫码 · 拍照识别</span>
        </div>

        {/* Quick add */}
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>常吃</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recent.map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--card)', border: '1px solid var(--line-soft)',
              borderRadius: 14, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 22 }}>{r.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{r.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{r.sub}</div>
              </div>
              <button style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'var(--sage)', color: 'white', border: 'none',
                fontSize: 16, cursor: 'pointer',
              }}>＋</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  TODAY, FOOD_GROUPS, MEALS, SUGGESTIONS,
  PaperStatusBar, Ring, Bar, PaperDock, AddSheet,
});

// ─── Top-level router — swaps between home variant + shared screens ──
function NavRouter({ HomeComponent }) {
  const [tab, setTab] = React.useState('总览');
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const onAdd = () => setSheetOpen(true);
  const props = { onNav: setTab, onAdd, sheetOpen, closeSheet: () => setSheetOpen(false) };
  if (tab === '趋势')   return <window.SevenDayScreen {...props} active="趋势"/>;
  if (tab === '科学')   return <window.ScienceScreen   {...props} active="科学"/>;
  if (tab === '我')     return <window.ProfileScreen   {...props} active="我"/>;
  if (tab === '食材库') return <window.PantryScreen    {...props} onBack={() => setTab('总览')}/>;
  if (tab === '多样性') return <window.DiversityScreen {...props} onBack={() => setTab('总览')}/>;
  return <HomeComponent {...props} active="总览"/>;
}
window.NavRouter = NavRouter;
