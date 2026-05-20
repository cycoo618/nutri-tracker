// variations/garden.jsx — Variation 3: 七色花园
// 把"食物多样性"放在主视觉位置(原 app 它被埋在第二屏)。
// 卡路里收到顶部细条;餐次时间轴;花园隐喻给情感反馈。

function GardenHome({ onNav, onAdd, sheetOpen, closeSheet, active = '总览' }) {
  const [tapped, setTapped] = React.useState(null);
  const targetDone = FOOD_GROUPS.filter(g => g.done).length;

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />

      <div className="app-scroll">
        {/* ── Slim kcal strip (calories moved to non-hero) ── */}
        <div style={{ padding: '6px 18px 0' }}>
          <div className="card" style={{
            padding: '10px 14px', background: 'var(--card)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: 1, textTransform: 'uppercase' }}>能量</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontFamily: 'ZCOOL QingKe HuangYou, serif', fontSize: 24, color: 'var(--ink)', lineHeight: 1 }}>{TODAY.kcal}</span>
                <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/ {TODAY.kcalTarget}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Bar value={TODAY.kcal} target={TODAY.kcalTarget} color="var(--tomato)" height={5} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-mute)', marginTop: 4 }}>
                <span>已 {TODAY.kcal}</span>
                <span>余 {TODAY.kcalTarget - TODAY.kcal}</span>
              </div>
            </div>
            <SyncButton shape="chip" />
            <button onClick={() => onNav && onNav('食材库')} title="食材库" style={{
              background: 'var(--card)', border: '1px solid var(--line-soft)',
              borderRadius: 999, padding: '4px 10px',
              fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>📦 <span>食材</span></button>
          </div>
        </div>

        {/* ── Garden hero ─────────────────────── */}
        <div style={{ padding: '14px 18px 8px' }}>
          <div className="card" style={{ padding: '16px 16px 12px', background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
            {/* sun + soil ornament */}
            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at center, rgba(201,155,61,0.25), transparent 70%)' }} />

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6, position: 'relative' }}>
              <div>
                <div className="display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>
                  今日的<span style={{ color: 'var(--sage)' }}>菜园</span>
                </div>
                <div className="caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>
                  {targetDone} of 7 grown today
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="display" style={{ fontSize: 30, color: 'var(--sage)', lineHeight: 1 }}>{targetDone}/7</div>
                <div style={{ fontSize: 10, color: 'var(--ink-mute)' }}>类达标</div>
              </div>
            </div>

            <hr className="hr-dash" style={{ margin: '12px 0' }} />

            {/* 7 plant plots, 2 rows */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {FOOD_GROUPS.map((g, i) => (
                <Plot key={g.key} g={g} onTap={() => setTapped(tapped === g.key ? null : g.key)} active={tapped === g.key} />
              ))}
            </div>

            {tapped && (() => {
              const g = FOOD_GROUPS.find(x => x.key === tapped);
              return (
                <div className="sheet-in" style={{
                  marginTop: 10, padding: '10px 12px', borderRadius: 10,
                  background: 'var(--paper)', border: '1px solid var(--line-soft)',
                  borderLeft: '3px solid ' + g.color,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 18 }}>{g.emoji}</span>
                    <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{g.name}</strong>
                    {g.done && <span style={{ fontSize: 10, color: g.color }}>· 今日达成 ✓</span>}
                    {!g.done && g.daysAgo > 0 && <span style={{ fontSize: 10, color: 'var(--tomato)' }}>· {g.daysAgo} 天未吃</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>今日 <strong style={{ color: g.color }}>{g.v}{g.isCount ? '次' : 'g'}</strong></span>
                    <span style={{ color: 'var(--ink-mute)' }}>建议 {g.range}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Bar value={g.v} target={g.t} color={g.color} height={4} />
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── Today's meal cards ───────────────── */}
        <div style={{ padding: '12px 22px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>今日餐桌</h3>
          <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>3 meals</span>
        </div>

        <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {MEALS.map((m, i) => <MealCard key={i} meal={m} />)}
        </div>

        {/* ── Streak banner ─────────────────── */}
        <div style={{ padding: '14px 18px 6px' }}>
          <div className="card" style={{
            padding: '12px 14px',
            background: 'linear-gradient(95deg, var(--card-warm), var(--card))',
            border: '1px solid var(--line)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'var(--ink)', color: 'var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Ma Shan Zheng, serif', fontSize: 18,
            }}>23</div>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>连续记录 23 天</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>本周已达成抗炎食物 4 / 7 日</div>
            </div>
            <span className="caveat" style={{ fontSize: 22, color: 'var(--tomato)', transform: 'rotate(-8deg)' }}>nice!</span>
          </div>
        </div>
      </div>

      <PaperDock active={active} onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

function Plot({ g, onTap, active }) {
  const isEmpty = g.v === 0;
  const isPartial = !g.done && g.v > 0;
  // grown plant height proportional to progress
  const pct = Math.min(g.v / g.t, 1);
  return (
    <button onClick={onTap} style={{
      background: 'transparent', border: 'none', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: 6, borderRadius: 10,
      outline: active ? '2px solid var(--ink)' : 'none',
      outlineOffset: -1,
    }}>
      <div style={{
        width: '100%', aspectRatio: '1',
        background: isEmpty ? 'repeating-linear-gradient(45deg, var(--paper-2) 0 4px, var(--paper) 4px 8px)' : g.color,
        borderRadius: 10,
        border: '1px solid ' + (isEmpty ? 'var(--line)' : g.color),
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* "earth" base */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '38%',
          background: isEmpty ? 'rgba(168, 114, 56, 0.25)' : 'rgba(0,0,0,0.18)',
        }} />
        <span style={{
          fontSize: 24,
          position: 'relative', zIndex: 1,
          filter: isEmpty ? 'grayscale(0.7) opacity(0.55)' : 'none',
          transform: isEmpty ? 'scale(0.7)' : `scale(${0.85 + 0.25 * pct})`,
          transition: 'transform .3s',
        }}>{g.emoji}</span>
        {g.done && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            width: 14, height: 14, borderRadius: '50%',
            background: 'var(--paper)', color: g.color, fontSize: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✓</span>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink)', fontWeight: 500 }}>{g.name}</div>
      <div style={{ fontSize: 9, color: isEmpty ? 'var(--tomato)' : 'var(--ink-mute)', lineHeight: 1 }}>
        {isEmpty ? (g.daysAgo > 0 ? `${g.daysAgo}天未吃` : '未吃') : isPartial ? `${Math.round(pct*100)}%` : '达标'}
      </div>
    </button>
  );
}

function MealCard({ meal }) {
  const isEmpty = !meal.time;
  if (isEmpty) {
    return (
      <button style={{
        background: 'transparent',
        border: '1.5px dashed var(--line)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
      }}>
        <div>
          <div className="serif" style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 700 }}>{meal.meal}</div>
          <div className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>还没记录</div>
        </div>
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'var(--ink)', color: 'var(--paper)',
          fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>＋</span>
      </button>
    );
  }
  return (
    <div className="card" style={{ padding: '12px 14px', background: 'var(--card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{meal.meal}</span>
          <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{meal.time}</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontVariantNumeric: 'tabular-nums' }}>
          {meal.kcal} <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>kcal</span>
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
        {meal.items.join(' · ')}
      </div>
    </div>
  );
}

window.GardenHome = GardenHome;
