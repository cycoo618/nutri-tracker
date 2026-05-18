// variations/chapters.jsx — Variation 2: 今日章节
// 整页像一本书,默认折叠;每个章节只露出一个关键数字;
// 点击章节展开详情。右侧悬浮章节导航。

function ChaptersHome({ onNav, onAdd, sheetOpen, closeSheet, active = '总览' }) {
  const [opened, setOpened] = React.useState({ energy: true, macro: false, diversity: false, advice: false });
  const toggle = (k) => setOpened({ ...opened, [k]: !opened[k] });

  const chapters = [
    { k: 'energy',    num: '一', name: '能量', verb: '今日所食' },
    { k: 'macro',     num: '二', name: '营养', verb: '宏量与微量' },
    { k: 'diversity', num: '三', name: '七色', verb: '食物多样性' },
    { k: 'advice',    num: '四', name: '提议', verb: '来自今天' },
  ];

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />

      <div className="app-scroll">
        {/* ── Book cover header ──────────────── */}
        <div style={{ padding: '6px 26px 4px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* corner pantry button */}
          <button onClick={() => onNav && onNav('食材库')} title="食材库" style={{
            position: 'absolute', top: 4, right: 18,
            width: 32, height: 32, borderRadius: '50%', padding: 0,
            background: 'var(--card)', border: '1px solid var(--line-soft)',
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
            fontFamily: 'inherit',
          }}>📦</button>

          <div style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 2 }}>
            NUTRITRACK
          </div>
          <div className="display" style={{ fontSize: 26, lineHeight: 1.1, color: 'var(--ink)' }}>
            <span style={{ color: 'var(--tomato)' }}>{TODAY.date}</span> · {TODAY.weekday}
          </div>
          <div className="caveat" style={{ fontSize: 18, color: 'var(--ink-soft)', marginTop: 2 }}>
            第 {TODAY.dayOfPlan} 天 · 抗炎 & 减脂
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <button style={navBtn}>← 昨日</button>
            <button style={{ ...navBtn, background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' }}>今</button>
            <button style={navBtn}>明日 →</button>
          </div>
        </div>

        {/* Ornament divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 30px 4px', color: 'var(--ink-faint)' }}>
          <div style={{ flex: 1, height: 1, background: 'currentColor' }} />
          <span style={{ fontSize: 14 }}>❦</span>
          <div style={{ flex: 1, height: 1, background: 'currentColor' }} />
        </div>

        {/* ── Chapters ──────────────────────── */}
        <div style={{ padding: '4px 18px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {chapters.map(ch => (
            <Chapter key={ch.k} ch={ch} open={opened[ch.k]} onToggle={() => toggle(ch.k)} />
          ))}
        </div>

        {/* ── Quote at bottom ───────────────── */}
        <div style={{ padding: '14px 26px 4px', textAlign: 'center' }}>
          <div className="caveat" style={{ fontSize: 18, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
            “吃得好,是把今天对自己说的最温柔的一句话”
          </div>
        </div>
      </div>

      {/* Floating chapter rail (right edge) */}
      <div style={{
        position: 'absolute', right: 6, top: '38%', zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {chapters.map(ch => (
          <button key={ch.k} onClick={() => toggle(ch.k)} style={{
            width: 22, height: 22, borderRadius: 11, border: 'none',
            background: opened[ch.k] ? 'var(--ink)' : 'rgba(251,246,231,0.6)',
            color: opened[ch.k] ? 'var(--paper)' : 'var(--ink-soft)',
            fontSize: 11, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--line)',
          }}>{ch.num}</button>
        ))}
      </div>

      <PaperDock active={active} onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

const navBtn = {
  padding: '4px 12px', borderRadius: 14,
  background: 'transparent', color: 'var(--ink-soft)',
  border: '1px solid var(--line)',
  fontSize: 11, cursor: 'pointer',
  fontFamily: 'inherit',
};

// ─── Chapter wrapper ─────────────────────
function Chapter({ ch, open, onToggle }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--card)' }}>
      {/* Header — always visible, gives the hero number */}
      <button onClick={onToggle} style={{
        width: '100%', padding: '14px 16px',
        background: 'transparent', border: 'none', cursor: 'pointer',
        textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'inherit',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--paper)', border: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--ink)', fontSize: 14,
          fontFamily: 'Ma Shan Zheng, serif',
          flexShrink: 0,
        }}>{ch.num}</div>

        <ChapterSummary k={ch.k} />

        <span style={{
          marginLeft: 'auto', color: 'var(--ink-mute)', fontSize: 12,
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform .25s',
        }}>▾</span>
      </button>

      {open && <div className="sheet-in" style={{ padding: '0 16px 16px' }}>
        <hr className="hr-dash" style={{ margin: '0 0 14px' }} />
        <ChapterBody k={ch.k} />
      </div>}
    </div>
  );
}

function ChapterSummary({ k }) {
  if (k === 'energy') {
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flex: 1 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>今日所食 · 能量</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span className="display" style={{ fontSize: 34, color: 'var(--ink)', lineHeight: 1 }}>{TODAY.kcal}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>/ {TODAY.kcalTarget} kcal</span>
          </div>
        </div>
        <div style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
          <Bar value={TODAY.kcal} target={TODAY.kcalTarget} color="var(--tomato)" height={4} />
          <div className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 4 }}>
            还可吃 {TODAY.kcalTarget - TODAY.kcal} kcal
          </div>
        </div>
      </div>
    );
  }
  if (k === 'macro') {
    return (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>宏量营养</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>73</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>分 · 碳水偏多</span>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
          {[
            { c: 'var(--sky)',     w: 18/131 },
            { c: 'var(--mustard)', w: 76/150 },
            { c: 'var(--tomato)',  w: 8/42 },
            { c: 'var(--sage)',    w: 9/25 },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, height: 3, background: 'var(--line-soft)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: Math.min(s.w*100, 100)+'%', height: '100%', background: s.c }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (k === 'diversity') {
    return (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>食物多样性</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>2</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>/ 7 类达标</span>
        </div>
        <div style={{ display: 'flex', gap: 3, marginTop: 6 }}>
          {FOOD_GROUPS.map(g => (
            <span key={g.key} style={{
              width: 16, height: 16, borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: g.done ? g.color : 'var(--line-soft)',
              opacity: g.done ? 1 : 0.7,
              fontSize: 9, filter: g.done ? 'none' : 'grayscale(1)',
            }}>{g.emoji}</span>
          ))}
        </div>
      </div>
    );
  }
  if (k === 'advice') {
    return (
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>来自今天</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>3</span>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>条小提议</span>
          <span className="pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--tomato)', marginLeft: 'auto', marginRight: 6 }} />
        </div>
        <div className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)', marginTop: 2 }}>
          tap to read
        </div>
      </div>
    );
  }
}

// ─── Expanded body for each chapter ───────
function ChapterBody({ k }) {
  if (k === 'energy') return <EnergyBody />;
  if (k === 'macro') return <MacroBody />;
  if (k === 'diversity') return <DiversityBody />;
  if (k === 'advice') return <AdviceBody />;
}

function EnergyBody() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Ring value={TODAY.kcal} target={TODAY.kcalTarget} size={110} stroke={8} color="var(--tomato)">
        <span className="display" style={{ fontSize: 26, color: 'var(--ink)', lineHeight: 1 }}>{TODAY.kcal}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/ {TODAY.kcalTarget}</span>
      </Ring>
      <div style={{ flex: 1, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        <div style={{ marginBottom: 6 }}>
          <span className="caveat" style={{ fontSize: 18, color: 'var(--tomato)' }}>还可以吃</span>
          <span className="display" style={{ fontSize: 22, marginLeft: 6, color: 'var(--ink)' }}>1043 kcal</span>
        </div>
        <div style={{ background: 'var(--card-warm)', padding: '8px 10px', borderRadius: 10, fontSize: 11 }}>
          按目前节奏,可以放一餐 <strong>500 kcal</strong> 的晚饭,
          再留 <strong>500 kcal</strong> 给加餐。
        </div>
        <div className="caveat" style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-mute)', textAlign: 'right' }}>
          — paced well so far
        </div>
      </div>
    </div>
  );
}

function MacroBody() {
  const items = [
    { label: '蛋白质', ...TODAY.protein },
    { label: '碳水',   ...TODAY.carbs },
    { label: '脂肪',   ...TODAY.fat },
    { label: '膳食纤维', ...TODAY.fiber },
  ];
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} style={{ padding: '6px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: 'var(--ink)' }}>{it.label}</span>
            <span style={{ color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>
              {it.v} / {it.t} g
            </span>
          </div>
          <Bar value={it.v} target={it.t} color={it.color} height={5} />
        </div>
      ))}
      <hr className="hr-dash" style={{ margin: '12px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)' }}>
        <div>
          <div style={{ color: 'var(--ink-mute)' }}>添加糖</div>
          <div><strong style={{ color: 'var(--sage)' }}>0g</strong> / 50g</div>
        </div>
        <div>
          <div style={{ color: 'var(--ink-mute)' }}>钠</div>
          <div><strong style={{ color: 'var(--sage)' }}>238mg</strong></div>
        </div>
        <div>
          <div style={{ color: 'var(--ink-mute)' }}>Omega-3</div>
          <div><strong style={{ color: 'var(--tomato)' }}>0mg</strong> ≥ 250</div>
        </div>
      </div>
    </div>
  );
}

function DiversityBody() {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {FOOD_GROUPS.slice(0, 6).map(g => (
          <div key={g.key} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px',
            background: g.done ? 'rgba(111,139,77,0.10)' : 'var(--paper)',
            borderRadius: 10,
            border: '1px solid ' + (g.done ? g.color : 'var(--line-soft)'),
          }}>
            <span style={{ fontSize: 20, filter: g.done ? 'none' : 'grayscale(0.5)' }}>{g.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)' }}>
                {g.name}
                {g.done && <span style={{ color: g.color, marginLeft: 4 }}>✓</span>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{g.v}{g.isCount ? '次' : 'g'} / {g.t}{g.isCount ? '次' : 'g'}</div>
              <Bar value={g.v} target={g.t} color={g.color} height={3} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdviceBody() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {SUGGESTIONS.map((s, i) => (
        <div key={i} style={{
          padding: '10px 12px', borderRadius: 12,
          background: 'var(--paper)', border: '1px solid var(--line-soft)',
          borderLeftWidth: 3, borderLeftColor: s.tint,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 22 }}>{s.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.tint, marginBottom: 2 }}>{s.tag}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{s.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

window.ChaptersHome = ChaptersHome;
