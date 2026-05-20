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

  // 常用食物 — name, portion, usage count (sorted by count desc, like the original)
  const frequent = [
    { name: '鸡蛋(全蛋)',         portion: '87 克',        n: 29 },
    { name: '手打黑豆浆',         portion: '0.5 × 1份 (49g)', n: 23 },
    { name: 'Sourdough 全麦面包', portion: '2 片 (65g)',    n: 22 },
    { name: '蓝莓',               portion: '46 克',         n: 21 },
    { name: '藜麦(煮熟)',         portion: '1 碗 (~150g)',  n: 20 },
    { name: '意式浓缩咖啡',       portion: '1份 (30ml)',    n: 19 },
    { name: '红椒',               portion: '93 克',         n: 16 },
    { name: '草莓',               portion: '46 克',         n: 14 },
    { name: '鸡胸肉',             portion: '130 克',        n: 12 },
    { name: '洋葱',               portion: '25 克',         n: 12 },
    { name: '三文鱼',             portion: '57 克',         n: 10 },
    { name: '枣仁派零食',         portion: '25 克',         n: 7  },
  ];

  // 3 capture methods — small pill buttons (like meal selector), so 常用食物 stays visible above keyboard
  const methods = [
    { k: 'photo',  label: '识别食物',     glyph: '◐', color: 'var(--persimmon)' },
    { k: 'scan',   label: '扫营养价值表', glyph: '▦', color: 'var(--sage)' },
    { k: 'custom', label: '自定义食物',   glyph: '✎', color: 'var(--plum)' },
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
        boxShadow: '0 -10px 40px rgba(42,30,16,0.15)',
        maxHeight: '88%', display: 'flex', flexDirection: 'column',
      }}>
        {/* drag handle */}
        <div style={{ flexShrink: 0, padding: '10px 0 6px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto' }} />
        </div>

        {/* scrollable body */}
        <div style={{ overflowY: 'auto', padding: '6px 18px 8px' }}>
          {/* Header — title + meal segmented control + close all on one row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flexShrink: 0 }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)', lineHeight: 1, letterSpacing: 0.5 }}>记一笔</h3>
              <span className="caveat" style={{ fontSize: 13, color: 'var(--tomato)', display: 'block', marginTop: 2, lineHeight: 1 }}>jot it down</span>
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 4, padding: 3,
              background: 'var(--card-warm)', border: '1px solid var(--line-soft)',
              borderRadius: 12,
            }}>
              {meals.map(m => (
                <button key={m} onClick={() => setMeal(m)} style={{
                  flex: 1, padding: '6px 0',
                  background: meal === m ? 'var(--ink)' : 'transparent',
                  color: meal === m ? 'var(--paper)' : 'var(--ink-soft)',
                  border: 'none',
                  borderRadius: 9, fontSize: 12, fontWeight: meal === m ? 600 : 500,
                  cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.2,
                }}>{m}</button>
              ))}
            </div>
            <button onClick={onClose} aria-label="close" style={{
              flexShrink: 0,
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--card)', border: '1px solid var(--line-soft)',
              color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1, cursor: 'pointer',
            }}>×</button>
          </div>

          {/* Search + AI estimate row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--card)', border: '1px solid var(--line-soft)',
              borderRadius: 12, padding: '10px 14px',
            }}>
              <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>🔍</span>
              <span style={{ color: 'var(--ink-mute)', fontSize: 13, flex: 1 }}>输入食物名称…</span>
            </div>
            <button style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: 40,
              background: 'var(--ink)', color: 'var(--paper)',
              border: 'none', borderRadius: 12,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span style={{ fontSize: 14 }}>✨</span>
              <span>AI 估算</span>
            </button>
          </div>

          {/* 3 capture methods — compact pills; columns sized to label length to keep each on one line */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.2fr', gap: 6, marginBottom: 18 }}>
            {methods.map(m => (
              <button key={m.k} style={{
                background: 'var(--card)',
                border: '1px solid var(--line-soft)',
                borderRadius: 12, padding: '8px 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 12, color: 'var(--ink)', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, borderRadius: 6,
                  background: 'color-mix(in oklab, ' + m.color + ' 18%, var(--card))',
                  color: m.color, fontSize: 11, fontWeight: 700,
                  flexShrink: 0,
                }}>{m.glyph}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* 常用食物 — label */}
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>常用食物</span>
              <span className="caveat" style={{ fontSize: 14, color: 'var(--tomato)' }}>your usuals</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>按使用频次排序</span>
          </div>

          {/* Frequent food chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {frequent.map((f, i) => (
              <button key={i} style={{
                display: 'inline-flex', alignItems: 'baseline', gap: 6,
                padding: '7px 11px 7px 12px',
                background: 'var(--card-warm)',
                border: '1px solid var(--line-soft)',
                borderRadius: 999,
                fontSize: 13, color: 'var(--ink)', fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.2,
              }}>
                <span>{f.name}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 400 }}>{f.portion}</span>
                <span className="caveat" style={{
                  fontSize: 14, color: 'var(--tomato)', lineHeight: 1,
                  paddingLeft: 4, borderLeft: '1px dashed var(--line)',
                  marginLeft: 2,
                }}>×{f.n}</span>
              </button>
            ))}
          </div>

          <div style={{ height: 14 }} />
        </div>
      </div>
    </>
  );
}

// ─── Sync button — fits next to pantry button in all home variants ─────
function SyncButton({ shape = 'pill', label }) {
  const [state, setState] = React.useState('idle'); // idle | syncing | done
  const [lastSync, setLastSync] = React.useState('刚刚');
  const click = (e) => {
    e && e.stopPropagation && e.stopPropagation();
    if (state === 'syncing') return;
    setState('syncing');
    setTimeout(() => {
      setState('done');
      setLastSync('刚刚');
      setTimeout(() => setState('idle'), 1400);
    }, 1100);
  };
  const icon = state === 'done' ? '✓' : '↻';
  const spinning = state === 'syncing';
  const tone = state === 'done' ? 'var(--sage)' : 'var(--ink-soft)';
  const title = state === 'syncing' ? '同步中…' : `同步 · 上次 ${lastSync}`;
  const spin = (
    <span style={{
      display: 'inline-block',
      animation: spinning ? 'syncspin 0.9s linear infinite' : 'none',
    }}>{icon}</span>
  );

  if (shape === 'circle') {
    return (
      <button onClick={click} title={title} style={{
        position: 'absolute', top: 4, right: 58,
        width: 32, height: 32, borderRadius: '50%', padding: 0,
        background: 'var(--card)', border: '1px solid var(--line-soft)',
        cursor: 'pointer', fontSize: 14, lineHeight: 1, fontFamily: 'inherit',
        color: tone,
      }}>{spin}</button>
    );
  }
  if (shape === 'chip') {
    return (
      <button onClick={click} title={title} style={{
        background: 'var(--card)', border: '1px solid var(--line-soft)',
        borderRadius: 999, padding: '4px 10px',
        fontSize: 11, color: tone, cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        {spin}<span>{label || '同步'}</span>
      </button>
    );
  }
  // pill (default) — matches diary header buttons
  return (
    <button onClick={click} title={title} style={{
      width: 30, height: 26, borderRadius: 14, padding: 0,
      background: 'var(--card)', border: '1px solid var(--line-soft)',
      cursor: 'pointer', fontSize: 13, lineHeight: 1, fontFamily: 'inherit',
      color: tone,
    }}>{spin}</button>
  );
}

Object.assign(window, {
  TODAY, FOOD_GROUPS, MEALS, SUGGESTIONS,
  PaperStatusBar, Ring, Bar, PaperDock, AddSheet, SyncButton,
});

// ─── Top-level router — swaps between home variant + shared screens ──
function NavRouter({ HomeComponent, initialSheetOpen = false }) {
  const [tab, setTab] = React.useState('总览');
  const [sheetOpen, setSheetOpen] = React.useState(initialSheetOpen);
  const onAdd = () => setSheetOpen(true);
  const props = { onNav: setTab, onAdd, sheetOpen, closeSheet: () => setSheetOpen(false) };
  if (tab === '趋势')   return <window.SevenDayScreen {...props} active="趋势"/>;
  if (tab === '科学')   return <window.ScienceScreen   {...props} active="科学"/>;
  if (tab === '我')     return <window.ProfileScreen   {...props} active="我"/>;
  if (tab === '食材库') return <window.PantryScreen    {...props} onBack={() => setTab('总览')}/>;
  if (tab === '多样性') return <window.DiversityScreen {...props} onBack={() => setTab('总览')}/>;
  if (tab === '宏量')   return <window.MacrosScreen    {...props} onBack={() => setTab('总览')}/>;
  if (tab === '明细')   return <window.MacrosScreen    {...props} onBack={() => setTab('总览')}/>;
  return <HomeComponent {...props} active="总览"/>;
}
window.NavRouter = NavRouter;
