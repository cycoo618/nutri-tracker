// screens/diversity.jsx — 食物多样性 detail screen
// Tapped into from the home page; shows all 7 food groups in depth.

function DiversityScreen({ onNav, onAdd, sheetOpen, closeSheet, onBack }) {
  const doneCount = FOOD_GROUPS.filter(g => g.done).length;

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />
      <div className="app-scroll" style={{ paddingTop: 54 }}>

        {/* Header */}
        <div style={{ padding: '6px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack || (() => onNav && onNav('总览'))} style={iconBackBtn}>‹</button>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>食物多样性</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>5月16日 周六 · 7 类食物追踪</div>
          </div>
        </div>

        {/* Hero summary */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card" style={{ padding: '18px 18px 14px', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Ring value={doneCount} target={7} size={92} stroke={9} color="var(--sage)">
                <span className="display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>{doneCount}</span>
                <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/ 7 类</span>
              </Ring>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>今日达成 {doneCount} 类</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                  抗炎饮食建议 <strong style={{ color: 'var(--sage)' }}>每天 5–7 类</strong>。今晚加 <strong style={{ color: 'var(--tomato)' }}>1 份发酵食品</strong> + <strong style={{ color: 'var(--moss)' }}>1 份叶菜</strong>,可上到 4 类。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Per-group list */}
        <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>7 类食物</h3>
          <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>tap to log</span>
        </div>
        <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FOOD_GROUPS.map(g => <GroupCard key={g.key} g={g} onAdd={onAdd} />)}
        </div>

        {/* Anti-inflammatory whitelist */}
        <div style={{ padding: '16px 18px 4px' }}>
          <div className="card card-warm" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🫒</span>
              <span className="serif" style={{ fontSize: 13, fontWeight: 700 }}>抗炎清单</span>
              <span className="caveat" style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--ink-mute)' }}>good picks</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              <span style={{ color: 'var(--moss)' }}>叶菜</span> · 西兰花 · 番茄 · 浆果 ·
              <span style={{ color: 'var(--fish)' }}> 三文鱼</span> · 沙丁鱼 · 核桃 · 亚麻籽 ·
              <span style={{ color: 'var(--ferm)' }}> 希腊酸奶</span> · 纳豆 · 味噌 · 泡菜 ·
              <span style={{ color: 'var(--grain)' }}> 燕麦</span> · 糙米 · 藜麦 · 橄榄油
            </div>
          </div>
        </div>
      </div>

      <PaperDock active="总览" onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

function GroupCard({ g, onAdd }) {
  const pct = Math.min(g.v / g.t, 1);
  const isCount = g.isCount;
  // Mock 7-day history for this group
  const history = {
    veg:   [0, 2, 1, 1, 1, 0, 0],
    fruit: [0, 2, 2, 1, 2, 0, 1],
    grain: [1, 3, 3, 2, 3, 1, 3],
    bean:  [0, 1, 0, 0, 0, 0, 1],
    nut:   [0, 1, 0, 0, 0, 0, 0],
    fish:  [0, 2, 0, 0, 2, 0, 0],
    ferm:  [0, 1, 0, 0, 0, 0, 0],
  }[g.key] || [];
  const weekDays = ['日','一','二','三','四','五','六'];

  return (
    <div className="card" style={{ padding: '14px 14px', background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
      {g.done && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 40, height: 40,
          background: 'linear-gradient(225deg, ' + g.color + ' 50%, transparent 50%)',
        }} />
      )}
      {g.done && (
        <span style={{
          position: 'absolute', top: 5, right: 7,
          color: 'white', fontSize: 11, fontWeight: 700,
        }}>✓</span>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'color-mix(in oklab, ' + g.color + ' 14%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          flexShrink: 0,
        }}>{g.emoji}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span className="serif" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</span>
            <span style={{ fontSize: 12, color: g.done ? g.color : 'var(--ink-soft)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
              {g.v}{isCount ? '' : 'g'} <span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>/ {g.t}{isCount ? ' 次/周' : 'g'}</span>
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
            建议 {g.range}
            {!g.done && g.daysAgo > 0 && <span style={{ color: 'var(--tomato)', marginLeft: 6 }}>· {g.daysAgo} 天未吃</span>}
            {g.done && <span style={{ color: g.color, marginLeft: 6 }}>· 今日达成</span>}
          </div>

          <div style={{ marginTop: 8 }}>
            <Bar value={g.v} target={g.t} color={g.color} height={5} />
          </div>

          {/* 7-day history strip */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>近 7 天</span>
            <div style={{ flex: 1, display: 'flex', gap: 2 }}>
              {history.map((v, di) => (
                <div key={di} style={{
                  flex: 1, height: 14, borderRadius: 2,
                  background: v === 0 ? 'var(--line-soft)' :
                              'color-mix(in oklab, ' + g.color + ' ' + (v*30 + 15) + '%, var(--line-soft))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 8, color: 'var(--ink-mute)',
                }}>{weekDays[di]}</div>
              ))}
            </div>
            <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>
              {history.filter(v => v > 0).length}/7
            </span>
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={onAdd} style={{
              padding: '5px 12px', borderRadius: 999,
              background: g.done ? 'transparent' : g.color,
              color: g.done ? g.color : 'white',
              border: '1px solid ' + g.color,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{g.done ? '＋ 再加一份' : '＋ 今天记一笔'}</button>
            <button style={{
              padding: '5px 10px', borderRadius: 999,
              background: 'transparent', color: 'var(--ink-mute)',
              border: '1px solid var(--line)', fontSize: 11, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>ⓘ 推荐食物</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const iconBackBtn = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'transparent', border: '1px solid var(--line)',
  color: 'var(--ink-soft)', fontSize: 16, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', flexShrink: 0,
};

window.DiversityScreen = DiversityScreen;
