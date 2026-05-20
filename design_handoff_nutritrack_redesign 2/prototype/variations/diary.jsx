// variations/diary.jsx — Variation 1: 营养日记本
// 单一焦点 · 时间感问候 · 折叠式细节 · 餐次时间轴

function DiaryHome({ onNav, onAdd, sheetOpen, closeSheet, active = '总览' }) {
  const [dayOffset, setDayOffset] = React.useState(0); // 0 = today, -1 = yesterday, +1 = tomorrow

  const dates = ['5月14日 周四', '5月15日 周五', '5月16日 周六', '5月17日 周日', '5月18日 周一'];
  const idx = 2 + dayOffset; // index 2 = today
  const dateLabel = dates[Math.max(0, Math.min(dates.length - 1, idx))];
  const [datePart, weekPart] = dateLabel.split(' ');
  const isToday = dayOffset === 0;

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />

      <div className="app-scroll">
        {/* ── Top row: greeting + tags + pantry ─────────── */}
        <div style={{ padding: '6px 22px 0', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="caveat" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>
              午安, <span style={{ color: 'var(--ink-mute)' }}>晚晚</span>
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span className="chip" style={{ background: 'color-mix(in oklab, var(--moss) 14%, transparent)', borderColor: 'color-mix(in oklab, var(--moss) 30%, transparent)', color: 'var(--moss)' }}>🫒 抗炎</span>
              <span className="chip" style={{ background: 'color-mix(in oklab, var(--tomato) 14%, transparent)', borderColor: 'color-mix(in oklab, var(--tomato) 30%, transparent)', color: 'var(--tomato)' }}>🔥 减脂</span>
              <SyncButton />
              <button onClick={() => onNav && onNav('食材库')} title="食材库" style={{
                width: 30, height: 26, borderRadius: 14, padding: 0,
                background: 'var(--card)', border: '1px solid var(--line-soft)',
                cursor: 'pointer', fontSize: 13, lineHeight: 1, fontFamily: 'inherit',
              }}>📦</button>
            </div>
          </div>
        </div>

        {/* ── Slim date strip ────────────────────────────── */}
        <div style={{ padding: '10px 18px 2px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 6px',
            background: 'var(--card)',
            border: '1px solid var(--line-soft)',
            borderRadius: 999,
          }}>
            <button onClick={() => setDayOffset(o => Math.max(o - 1, -2))} style={dateArrow}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>‹</span>
            </button>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 0 }}>
              <span style={{
                fontFamily: 'ZCOOL QingKe HuangYou, serif',
                fontSize: 18, color: 'var(--ink)', lineHeight: 1, letterSpacing: 0.5,
                whiteSpace: 'nowrap',
              }}>{datePart}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 500, whiteSpace: 'nowrap' }}>{weekPart}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>· 第 {TODAY.dayOfPlan + dayOffset} 天</span>

              {isToday ? (
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 999,
                  background: 'color-mix(in oklab, var(--sage) 16%, transparent)',
                  color: 'var(--moss)', fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  flexShrink: 0,
                }}>● 今日</span>
              ) : (
                <button onClick={() => setDayOffset(0)} style={{
                  padding: '2px 9px', borderRadius: 999,
                  background: 'var(--ink)', color: 'var(--paper)',
                  border: 'none', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 3,
                  flexShrink: 0,
                }}>↩ 今</button>
              )}
            </div>

            <button onClick={() => setDayOffset(o => Math.min(o + 1, 2))} style={dateArrow}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
            </button>
          </div>
        </div>

        {/* ── Hero kcal card with rotating banner inside ─── */}
        <div style={{ padding: '12px 18px 6px' }}>
          <div className="card" style={{
            padding: '14px 18px 12px',
            background: 'var(--card)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* corner mark (page corner fold) */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 28, height: 28,
              background: 'linear-gradient(225deg, var(--paper-2) 50%, transparent 50%)',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginBottom: 2 }}>
                  <span className="mark">还能吃</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="display" style={{
                    fontSize: 48, lineHeight: 1, letterSpacing: -1,
                    color: 'var(--tomato)',
                  }}>{(TODAY.kcalTarget - TODAY.kcal).toLocaleString()}</span>
                  <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>千卡</span>
                </div>
              </div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <Bar value={TODAY.kcal} target={TODAY.kcalTarget} color="var(--tomato)" height={5} />
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 4, fontVariantNumeric: 'tabular-nums', display: 'flex', justifyContent: 'space-between' }}>
                  <span>已 {TODAY.kcal} / {TODAY.kcalTarget}</span>
                  <span>{Math.round(TODAY.kcal / TODAY.kcalTarget * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Dashed divider */}
            <hr className="hr-dash" style={{ margin: '10px 0 10px' }} />

            {/* Rotating advice banner — one at a time, auto-rotates */}
            <RotatingBanner />
          </div>
        </div>

        {/* ── Mini at-a-glance row ──────────────── */}
        <div style={{ padding: '6px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <MiniStat
            label="宏量平衡"
            big="73"
            unit="分"
            sub="碳水偏多 · 蛋白偏少"
            tint="var(--mustard)"
            preview={<MacroPreview />}
            onClick={() => onNav && onNav('宏量')}
            arrow
          />
          <MiniStat
            label="食物多样性"
            big="2"
            unit="/ 7"
            sub="加 1 类更稳"
            tint="var(--sage)"
            preview={<DiversityPreview />}
            onClick={() => onNav && onNav('宏量')}
            arrow
          />
        </div>

        {/* ── 今日餐次 timeline ──────────────── */}
        <div style={{ padding: '18px 22px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>今日笔记</h3>
          <span className="caveat" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>today's pages</span>
        </div>

        <div style={{ padding: '0 18px', position: 'relative' }}>
          {/* timeline rail */}
          <div style={{
            position: 'absolute', left: 36, top: 10, bottom: 10,
            width: 1,
            background: 'repeating-linear-gradient(180deg, var(--line) 0 4px, transparent 4px 8px)',
          }} />
          {MEALS.map((m, i) => <MealRow key={i} meal={m} />)}
        </div>
      </div>

      <PaperDock active={active} onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

function MiniStat({ label, big, unit, sub, tint, onClick, open, arrow, preview }) {
  return (
    <button onClick={onClick} className="card" style={{
      padding: '12px 14px',
      textAlign: 'left', border: '1px solid ' + (open ? tint : 'var(--line-soft)'),
      background: open ? 'color-mix(in oklab, ' + tint + ' 4%, var(--card))' : 'var(--card)',
      cursor: 'pointer', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 500 }}>{label}</div>
        <span style={{ color: 'var(--ink-mute)', fontSize: 11 }}>
          {arrow ? '›' : (open ? '−' : '+')}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <span className="serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ink)' }}>{big}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{unit}</span>
      </div>
      {preview && <div style={{ marginTop: 6 }}>{preview}</div>}
      <div style={{ fontSize: 11, color: tint, fontWeight: 500, marginTop: 6 }}>{sub}</div>
    </button>
  );
}

function MacroPreview() {
  const macros = [
    { v: TODAY.protein.v, t: TODAY.protein.t, c: 'var(--sky)' },
    { v: TODAY.carbs.v,   t: TODAY.carbs.t,   c: 'var(--mustard)' },
    { v: TODAY.fat.v,     t: TODAY.fat.t,     c: 'var(--tomato)' },
    { v: TODAY.fiber.v,   t: TODAY.fiber.t,   c: 'var(--sage)' },
  ];
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {macros.map((m, i) => (
        <div key={i} style={{
          flex: 1, height: 5, borderRadius: 2,
          background: 'var(--line-soft)', overflow: 'hidden',
        }}>
          <div style={{
            width: Math.min(m.v / m.t * 100, 100) + '%',
            height: '100%',
            background: m.c,
          }} />
        </div>
      ))}
    </div>
  );
}

function DiversityPreview() {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {FOOD_GROUPS.map(g => (
        <div key={g.key} style={{
          flex: 1, aspectRatio: '1', borderRadius: 4,
          background: g.done ? g.color : 'var(--line-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9,
          filter: g.done ? 'none' : 'grayscale(0.5)',
          opacity: g.done ? 1 : 0.6,
        }}>{g.emoji}</div>
      ))}
    </div>
  );
}

// ─── Rotating advice banner — one at a time, auto-rotates ───
function RotatingBanner() {
  const banners = [
    { tag: '节奏',     tagColor: 'var(--tomato)', icon: '⏱', body: '按目前节奏,可以放一餐 500 kcal 的晚饭,再留 500 kcal 给加餐。' },
    { tag: '多样性',   tagColor: 'var(--sage)',   icon: '🌿', body: '差 5 类食物。今晚加 1 份酸奶 + 1 份叶菜,3 类一下就到位了。' },
    { tag: '发酵食品', tagColor: 'var(--ferm)',   icon: '🫙', body: '近 7 天未吃过,希腊酸奶、泡菜、味噌汤、纳豆均可,每天一份即可。' },
    { tag: '蔬菜',     tagColor: 'var(--veg)',    icon: '🥬', body: '已 2 天未吃,午餐或晚餐加一份叶菜,建议每天 300–500g。' },
    { tag: 'Omega-3',  tagColor: 'var(--fish)',   icon: '🐟', body: '今天还是 0 mg,加一小把核桃或一片三文鱼,身体会感谢你。' },
    { tag: '连续记录', tagColor: 'var(--mustard)', icon: '✨', body: '23 天 · 坚持就是 80% 的胜利 — 这个月还有 8 天,有机会做到全月不断签。' },
  ];

  const ref = React.useRef(null);
  const [idx, setIdx] = React.useState(0);
  const lastInteract = React.useRef(0);
  const hovering = React.useRef(false);

  // Auto-rotate every 5s, paused for 8s after user interaction or while hovering
  React.useEffect(() => {
    const tick = setInterval(() => {
      if (hovering.current) return;
      if (Date.now() - lastInteract.current < 8000) return;
      const el = ref.current;
      if (!el) return;
      const w = el.clientWidth;
      const nextIdx = (Math.round(el.scrollLeft / w) + 1) % banners.length;
      el.scrollTo({ left: w * nextIdx, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(tick);
  }, [banners.length]);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== idx) setIdx(i);
  };
  const noteInteract = () => { lastInteract.current = Date.now(); };
  const goTo = (i) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: el.clientWidth * i, behavior: 'smooth' });
    noteInteract();
  };

  const current = banners[idx];

  return (
    <div>
      <div
        ref={ref}
        onScroll={onScroll}
        onTouchStart={noteInteract}
        onMouseDown={noteInteract}
        onMouseEnter={() => { hovering.current = true; }}
        onMouseLeave={() => { hovering.current = false; }}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          minHeight: 60,
        }}>
        <style>{`.rotating-banner::-webkit-scrollbar{display:none}`}</style>
        {banners.map((b, i) => (
          <div key={i} style={{
            flexShrink: 0, width: '100%', scrollSnapAlign: 'start',
            display: 'flex', gap: 12, alignItems: 'flex-start',
            paddingRight: 4,
          }}>
            <span style={{ fontSize: 24, lineHeight: 1.2, flexShrink: 0, marginTop: 2 }}>{b.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: b.tagColor, textTransform: 'uppercase', letterSpacing: 1.2,
              }}>{b.tag}</span>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6, marginTop: 4 }}>
                {b.body}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* dots indicator + label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 }}>
        {banners.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === idx ? 14 : 5, height: 5, borderRadius: 3,
            background: i === idx ? current.tagColor : 'var(--line)',
            border: 'none', padding: 0, cursor: 'pointer',
            transition: 'width .25s, background .25s',
          }} />
        ))}
      </div>
    </div>
  );
}

function MacroPanel() {
  const macros = [
    { label: '蛋白质', ...TODAY.protein, emoji: '🥚', desc: '肌肉合成', tag: '充足', tagColor: 'var(--sky)' },
    { label: '碳水',   ...TODAY.carbs,   emoji: '🌾', desc: '能量来源', tag: '偏多', tagColor: 'var(--mustard)' },
    { label: '脂肪',   ...TODAY.fat,     emoji: '🥑', desc: '细胞健康', tag: '偏少', tagColor: 'var(--tomato)' },
    { label: '膳食纤维', ...TODAY.fiber,  emoji: '🥬', desc: '肠道菌群', tag: '充足', tagColor: 'var(--sage)' },
  ];
  const micros = [
    { label: '添加糖', v: 0,   t: 50,   unit: 'g',  ok: true,  hint: '今日 0g · 优秀' },
    { label: '钠',    v: 238, t: 2300, unit: 'mg', ok: true,  hint: '远低于 2300mg' },
    { label: 'Omega-3', v: 0, t: 250, unit: 'mg', ok: false, hint: '今日 0 · 待补' },
  ];

  return (
    <div className="sheet-in" style={{ padding: '10px 18px 0' }}>
      {/* Macro 2x2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {macros.map((m, i) => {
          const pct = Math.round(m.v / m.t * 100);
          const left = m.t - m.v;
          return (
            <div key={i} className="card" style={{ padding: '12px 12px', background: 'var(--card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>{m.emoji}</span>
                <span className="serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{m.label}</span>
                <span style={{
                  marginLeft: 'auto',
                  fontSize: 9, color: m.tagColor, fontWeight: 600,
                  padding: '1px 6px', borderRadius: 999,
                  background: 'color-mix(in oklab, ' + m.tagColor + ' 14%, transparent)',
                }}>{m.tag}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
                <span className="display" style={{ fontSize: 22, color: m.color, lineHeight: 1 }}>{m.v}</span>
                <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/ {m.t}g</span>
                <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <Bar value={m.v} target={m.t} color={m.color} height={4} />
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ink-soft)' }}>
                剩 <strong style={{ color: 'var(--ink)' }}>{left}g</strong> · {m.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Micro nutrients row */}
      <div style={{ padding: '10px 0 0' }}>
        <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, paddingLeft: 2 }}>微量 · 也别忘记</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {micros.map((m, i) => (
            <div key={i} className="card" style={{ padding: '10px 10px', background: 'var(--card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{m.label}</span>
                <span style={{ fontSize: 11, color: m.ok ? 'var(--sage)' : 'var(--tomato)', fontWeight: 700 }}>
                  {m.ok ? '✓' : '!'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginTop: 2 }}>
                <span className="display" style={{ fontSize: 18, color: m.ok ? 'var(--sage)' : 'var(--tomato)', lineHeight: 1 }}>{m.v}</span>
                <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--ink-mute)', marginTop: 4, lineHeight: 1.3 }}>{m.hint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Score footer */}
      <div style={{ padding: '10px 0 0' }}>
        <div className="card card-warm" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 700 }}>宏量平衡 73 分</div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>晚餐建议: 多蛋白 + 少碳水,加点橄榄油</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiversityPanel({ onNav }) {
  const missing = FOOD_GROUPS.filter(g => g.v === 0 || (!g.done && !g.isCount));
  return (
    <div className="sheet-in" style={{ padding: '10px 18px 0' }}>
      {/* Header summary */}
      <div style={{
        padding: '8px 14px',
        background: 'var(--card-warm)',
        borderRadius: 12,
        marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'color-mix(in oklab, var(--sage) 18%, transparent)',
          border: '2px solid var(--sage)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ZCOOL QingKe HuangYou, serif',
          fontSize: 16, color: 'var(--moss)',
        }}>2/7</div>
        <div style={{ flex: 1, fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--ink)' }}>全谷物</strong>、<strong style={{ color: 'var(--ink)' }}>鱼/海鲜</strong> ✓ ·
          再加 <span style={{ color: 'var(--tomato)' }}>1 份酸奶 + 1 份叶菜</span>,涨到 4 类
        </div>
      </div>

      {/* 2-col grid of food groups */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {FOOD_GROUPS.map(g => <FoodGroupCell key={g.key} g={g} />)}
      </div>

      {/* Drill-down link */}
      <button onClick={() => onNav && onNav('多样性')} style={{
        marginTop: 10, width: '100%', padding: '10px 14px',
        background: 'var(--card)', border: '1px solid var(--line-soft)',
        borderRadius: 12, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: 'var(--ink-soft)', fontSize: 12,
      }}>
        <span>查看全部 7 类 · 7 天历史 · 推荐食物</span>
        <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>›</span>
      </button>
    </div>
  );
}

function FoodGroupCell({ g }) {
  const pct = Math.min(g.v / g.t, 1);
  return (
    <div className="card" style={{
      padding: '10px 12px',
      background: 'var(--card)',
      borderColor: g.done ? g.color : 'var(--line-soft)',
      position: 'relative', overflow: 'hidden',
    }}>
      {g.done && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: 28, height: 28,
          background: 'linear-gradient(225deg, ' + g.color + ' 50%, transparent 50%)',
        }} />
      )}
      {g.done && (
        <span style={{ position: 'absolute', top: 2, right: 4, color: 'white', fontSize: 9, fontWeight: 700 }}>✓</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 18 }}>{g.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</div>
          <div style={{ fontSize: 9, color: 'var(--ink-mute)', lineHeight: 1.2 }}>
            建议 {g.range}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: g.done ? g.color : 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
          {g.v}{g.isCount ? '' : 'g'} <span style={{ color: 'var(--ink-mute)', fontWeight: 400, fontSize: 9 }}>/ {g.t}{g.isCount ? ' 次/周' : 'g'}</span>
        </span>
        {!g.done && g.daysAgo > 0 && (
          <span style={{ fontSize: 9, color: 'var(--tomato)' }}>{g.daysAgo}天未吃</span>
        )}
      </div>
      <div style={{ marginTop: 4 }}>
        <Bar value={g.v} target={g.t} color={g.color} height={3} />
      </div>
    </div>
  );
}

function MealRow({ meal }) {
  const isEmpty = !meal.time;
  return (
    <div style={{ display: 'flex', gap: 14, padding: '10px 0', position: 'relative' }}>
      <div style={{
        width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: isEmpty ? 'var(--paper)' : 'var(--ink)',
          border: '2px solid ' + (isEmpty ? 'var(--line)' : 'var(--ink)'),
          color: isEmpty ? 'var(--ink-mute)' : 'var(--paper)',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
        }}>{meal.meal[0]}</span>
      </div>
      <div style={{ flex: 1, paddingBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
            {meal.meal}
            {meal.time && <span style={{ color: 'var(--ink-mute)', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>{meal.time}</span>}
          </span>
          {meal.kcal > 0 && (
            <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
              {meal.kcal} <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>kcal</span>
            </span>
          )}
        </div>
        {meal.items.length > 0 ? (
          <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            {meal.items.map((it, i) => (
              <span key={i}>
                {it}{i < meal.items.length - 1 && <span style={{ color: 'var(--ink-mute)' }}> · </span>}
              </span>
            ))}
          </div>
        ) : (
          <button style={{
            marginTop: 4, padding: '4px 10px',
            border: '1px dashed var(--line)', borderRadius: 14,
            background: 'transparent', color: 'var(--ink-mute)',
            fontSize: 11, cursor: 'pointer',
          }}>＋ 记一笔</button>
        )}
        {meal.note && (
          <div className="caveat" style={{ fontSize: 14, color: 'var(--tomato)', marginTop: 4, transform: 'rotate(-1deg)', display: 'inline-block' }}>
            — {meal.note}
          </div>
        )}
      </div>
    </div>
  );
}

window.DiaryHome = DiaryHome;

const dateArrow = {
  width: 26, height: 26, borderRadius: '50%',
  background: 'var(--card-warm)', border: '1px solid var(--line-soft)',
  color: 'var(--ink-soft)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', flexShrink: 0, padding: 0,
};
