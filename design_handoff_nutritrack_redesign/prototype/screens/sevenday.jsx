// screens/sevenday.jsx — 7天 trends (v2 redesign)
// 更克制: 1 个核心节奏分 → 1 张能量曲线 → 1 张食物热力图 → 3 张趋势小卡 → 1 句小结
// 节奏感: 像翻一页周记

function SevenDayScreen({ onNav, onAdd, sheetOpen, closeSheet, active = '趋势' }) {
  // 7 days: 日一二三四五六  (Sun → Sat)
  const days = [
    { d: '日', kcal: 0,    weekend: true, today: false },
    { d: '一', kcal: 1872, weekend: false, today: false },
    { d: '二', kcal: 1209, weekend: false, today: false },
    { d: '三', kcal: 918,  weekend: false, today: false },
    { d: '四', kcal: 914,  weekend: false, today: false },
    { d: '五', kcal: 0,    weekend: false, today: false },
    { d: '六', kcal: 457,  weekend: true, today: true },
  ];
  const target = 1500;
  const tracked = days.filter(d => d.kcal > 0);
  const avg = Math.round(tracked.reduce((s,d) => s + d.kcal, 0) / tracked.length);
  const score = 78;

  // ── Food heatmap data: 7 categories × 7 days
  // Intensity 0–3 (none/light/good/great)
  const heatRows = [
    { ...FOOD_GROUPS[0], intensities: [0, 2, 1, 1, 1, 0, 0] },  // veg
    { ...FOOD_GROUPS[1], intensities: [0, 2, 2, 1, 2, 0, 1] },  // fruit
    { ...FOOD_GROUPS[2], intensities: [1, 3, 3, 2, 3, 1, 3] },  // grain
    { ...FOOD_GROUPS[3], intensities: [0, 1, 0, 0, 0, 0, 1] },  // bean
    { ...FOOD_GROUPS[4], intensities: [0, 1, 0, 0, 0, 0, 0] },  // nut
    { ...FOOD_GROUPS[5], intensities: [0, 2, 0, 0, 2, 0, 0] },  // fish (count-based)
    { ...FOOD_GROUPS[6], intensities: [0, 1, 0, 0, 0, 0, 0] },  // ferm
  ];

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />
      <div className="app-scroll" style={{ paddingTop: 56 }}>

        {/* ── Header ─────────────────────────── */}
        <div style={{ padding: '6px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: 3, textTransform: 'uppercase' }}>WEEK · 20</div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1.1, color: 'var(--ink)' }}>这一周</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                5月10日 – 5月16日 · <span className="caveat" style={{ fontSize: 16 }}>day 156–162</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['7天','30天','年'].map((t,i) => (
                <button key={i} style={{
                  padding: '4px 10px', borderRadius: 999,
                  background: i === 0 ? 'var(--ink)' : 'transparent',
                  color: i === 0 ? 'var(--paper)' : 'var(--ink-soft)',
                  border: '1px solid ' + (i === 0 ? 'var(--ink)' : 'var(--line)'),
                  fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 22px 4px', color: 'var(--ink-faint)' }}>
          <div style={{ flex: 1, height: 1, background: 'currentColor' }} />
          <span style={{ fontSize: 12 }}>❦</span>
          <div style={{ flex: 1, height: 1, background: 'currentColor' }} />
        </div>

        {/* ── Hero rhythm score ────────────────── */}
        <div style={{ padding: '8px 18px 0' }}>
          <div className="card" style={{ padding: '18px 20px 16px', background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, fontFamily: 'Ma Shan Zheng, serif', fontSize: 140, color: 'color-mix(in oklab, var(--tomato) 8%, transparent)', lineHeight: 1 }}>周</div>

            <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
              <span className="mark">本周节奏分</span>
              <span style={{ marginLeft: 8, color: 'var(--ink-mute)' }}>· composite of pace · nutrition · diversity</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
              <span className="display" style={{ fontSize: 64, color: 'var(--ink)', lineHeight: 1, letterSpacing: -2 }}>{score}</span>
              <span style={{ fontSize: 14, color: 'var(--ink-mute)' }}>/ 100</span>
              <span style={{
                marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                background: 'color-mix(in oklab, var(--sage) 18%, transparent)',
                color: 'var(--moss)', fontSize: 11, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>↑ 比上周 +6</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.5 }}>
              热量平稳、全谷物达成 7 天,但 <span style={{ color: 'var(--tomato)' }}>蔬菜</span> 和 <span style={{ color: 'var(--tomato)' }}>发酵食品</span> 还差几次。
            </div>

            {/* 7 daily pace dots */}
            <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
              {days.map((d, i) => {
                const ratio = d.kcal === 0 ? 0 : d.kcal / target;
                const dotColor = d.kcal === 0
                  ? 'var(--line)'
                  : ratio > 1.1 ? 'var(--tomato)'
                  : ratio < 0.4 ? 'var(--mustard)'
                  : 'var(--sage)';
                return (
                  <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', margin: '0 auto',
                      background: d.kcal === 0 ? 'transparent' : dotColor,
                      border: '1.5px solid ' + (d.kcal === 0 ? 'var(--line)' : dotColor),
                      position: 'relative',
                    }}>
                      {d.today && (
                        <span style={{
                          position: 'absolute', inset: -3, borderRadius: '50%',
                          border: '1px solid var(--ink)',
                        }} />
                      )}
                    </div>
                    <div style={{ fontSize: 9, color: d.today ? 'var(--ink)' : 'var(--ink-mute)', marginTop: 4, fontWeight: d.today ? 700 : 400 }}>{d.d}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Sub-scores trio ─────────────────── */}
        <div style={{ padding: '12px 18px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          <SubScore name="能量" value="1074" unit="kcal/天" pct={86} hint="略低目标" color="var(--mustard)" />
          <SubScore name="营养" value="73" unit="分" pct={73} hint="碳水偏多" color="var(--sky)" />
          <SubScore name="多样" value="3.4" unit="/7 类" pct={49} hint="差蔬菜" color="var(--tomato)" />
        </div>

        {/* ── Calorie rhythm chart ────────────── */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card" style={{ padding: '14px 16px 8px', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>能量曲线</h3>
              <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>kcal · daily</span>
            </div>

            <RhythmChart days={days} target={target} max={2200} avg={avg} />

            <hr className="hr-dash" style={{ margin: '10px 0 8px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)' }}>
              <span>日均 <strong style={{ color: 'var(--ink)' }}>{avg}</strong> kcal</span>
              <span style={{ color: 'var(--ink-mute)' }}>缺口 −{target - avg} / day</span>
              <span style={{ color: 'var(--sage)' }}>↘ 减脂区间内</span>
            </div>
          </div>
        </div>

        {/* ── Food heatmap ────────────────────── */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card" style={{ padding: '14px 16px 12px', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>七色 × 七日</h3>
              <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>where you ate it</span>
            </div>

            {/* day header */}
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              <div />
              {days.map((d, i) => (
                <div key={i} style={{
                  fontSize: 10, textAlign: 'center',
                  color: d.today ? 'var(--ink)' : 'var(--ink-mute)',
                  fontWeight: d.today ? 700 : 400,
                }}>{d.d}</div>
              ))}
            </div>
            {/* rows */}
            {heatRows.map((g, ri) => (
              <div key={g.key} style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: 4, marginBottom: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-soft)' }}>
                  <span style={{ fontSize: 12 }}>{g.emoji}</span>
                  <span>{g.name}</span>
                </div>
                {g.intensities.map((v, ci) => (
                  <HeatCell key={ci} v={v} color={g.color} today={days[ci].today} />
                ))}
              </div>
            ))}

            {/* legend */}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--ink-mute)' }}>
              <span>少</span>
              {[0,1,2,3].map(v => (
                <span key={v} style={{
                  width: 14, height: 8, borderRadius: 2,
                  background: v === 0 ? 'var(--line-soft)' : 'color-mix(in oklab, var(--sage) ' + (v*30) + '%, var(--line-soft))',
                }} />
              ))}
              <span>多</span>
              <span style={{ marginLeft: 'auto' }}>共 18 类不同食物 · 距 30 目标 12</span>
            </div>
          </div>
        </div>

        {/* ── Trend strip: 3 mini sparkline cards ─ */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card" style={{ padding: '12px 14px', background: 'var(--card)' }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Sparkline name="体重" value="55.6" unit="kg" data={[58.2, 57.4, 56.8, 56.4, 56.1, 55.8, 55.6]} delta="−2.6" color="var(--sage)" />
              <div style={{ width: 1, background: 'var(--line-soft)' }} />
              <Sparkline name="腰围" value="71" unit="cm" data={[74, 73.5, 73, 72.5, 72, 71.5, 71]} delta="−3.0" color="var(--mustard)" />
              <div style={{ width: 1, background: 'var(--line-soft)' }} />
              <Sparkline name="抗炎" value="78" unit="分" data={[65, 68, 71, 72, 74, 76, 78]} delta="+13" color="var(--moss)" />
            </div>
          </div>
        </div>

        {/* ── Insight footer ─────────────────── */}
        <div style={{ padding: '14px 18px 4px' }}>
          <div className="card card-warm" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>📖</span>
              <span className="serif" style={{ fontSize: 13, fontWeight: 700 }}>这一周想对你说</span>
              <span className="caveat" style={{ marginLeft: 'auto', fontSize: 14, color: 'var(--ink-mute)' }}>weekly note</span>
            </div>
            <hr className="hr-dash" style={{ margin: '0 0 10px' }} />
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              你已经把 <span className="mark">全谷物</span> 稳稳吃满 7 天 — 这是个很扎实的基线。<br/>
              下周可以试试每天加一份 <strong style={{ color: 'var(--sage)' }}>叶菜</strong> 和 一勺 <strong style={{ color: 'var(--ferm)' }}>酸奶/纳豆</strong>,
              抗炎分有机会跳到 <strong>85+</strong>。
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
              <button style={pillBtn}>加入下周计划</button>
              <button style={pillBtnGhost}>导出周记 PDF</button>
            </div>
          </div>
        </div>

      </div>

      <PaperDock active={active} onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

// ─── Sub-score chip card ─────────────────
function SubScore({ name, value, unit, pct, hint, color }) {
  return (
    <div className="card" style={{ padding: '10px 12px', background: 'var(--card)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{name}</span>
        <span style={{ fontSize: 9, color }}>{pct}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
        <span className="display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{unit}</span>
      </div>
      <div style={{ marginTop: 4 }}>
        <Bar value={pct} target={100} color={color} height={3} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>{hint}</div>
    </div>
  );
}

// ─── Heatmap cell ──────────────────────
function HeatCell({ v, color, today }) {
  const bg = v === 0
    ? 'var(--line-soft)'
    : `color-mix(in oklab, ${color} ${v*30 + 10}%, var(--line-soft))`;
  return (
    <div style={{
      height: 22, borderRadius: 3,
      background: bg,
      border: today ? '1px solid var(--ink)' : 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, color: v >= 2 ? 'rgba(255,255,255,0.85)' : 'transparent',
    }}>{v >= 2 ? '·' : ''}</div>
  );
}

// ─── Tiny sparkline ─────────────────────
function Sparkline({ name, value, unit, data, delta, color }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 70;
    const y = 22 - ((v - min) / range) * 22;
    return `${x},${y}`;
  }).join(' ');
  const lastX = 70, lastY = 22 - ((data[data.length-1] - min) / range) * 22;
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{name}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span className="display" style={{ fontSize: 18, color: 'var(--ink)', lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{unit}</span>
      </div>
      <svg width="74" height="24" style={{ marginTop: 3, display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r="2" fill={color} />
      </svg>
      <div style={{ fontSize: 10, color, fontWeight: 600 }}>{delta}</div>
    </div>
  );
}

// ─── The kcal "rhythm" chart ─────────────
function RhythmChart({ days, target, max, avg }) {
  const H = 110;
  const W = 320;
  const padL = 0, padR = 0;
  const step = (W - padL - padR) / (days.length - 1);
  const ty = H - (target / max) * H;
  const ay = H - (avg / max) * H;
  const pts = days.map((d, i) => ({
    x: padL + i * step,
    y: d.kcal === 0 ? null : H - (d.kcal / max) * H,
    d,
  }));
  const linePts = pts.filter(p => p.y !== null);

  // build path with gap when tracked = 0
  let path = '';
  let started = false;
  pts.forEach(p => {
    if (p.y === null) { started = false; return; }
    path += (started ? ' L ' : 'M ') + p.x + ' ' + p.y;
    started = true;
  });

  return (
    <div style={{ position: 'relative', height: H + 22 }}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} style={{ display: 'block' }}>
        {/* target line */}
        <line x1="0" y1={ty} x2={W} y2={ty} stroke="var(--tomato)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
        {/* avg line */}
        <line x1="0" y1={ay} x2={W} y2={ay} stroke="var(--sage)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
        {/* fill under line */}
        <path d={path + ` L ${linePts[linePts.length-1].x} ${H} L ${linePts[0].x} ${H} Z`}
              fill="color-mix(in oklab, var(--tomato) 12%, transparent)" />
        {/* line */}
        <path d={path} fill="none" stroke="var(--tomato)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* points */}
        {pts.map((p, i) => p.y === null ? (
          <g key={i}>
            <line x1={p.x} y1={H-4} x2={p.x} y2={H} stroke="var(--ink-faint)" strokeWidth="1" />
          </g>
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r={p.d.today ? 4 : 2.5}
            fill={p.d.today ? 'var(--ink)' : 'var(--paper)'}
            stroke={p.d.today ? 'var(--ink)' : 'var(--tomato)'} strokeWidth="1.5" />
        ))}
      </svg>

      {/* labels */}
      <div style={{ display: 'flex', marginTop: 4 }}>
        {pts.map((p, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center', fontSize: 10,
            color: p.d.today ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: p.d.today ? 700 : 400,
          }}>
            <div>{p.d.d}</div>
            {p.d.kcal > 0 && <div style={{ fontSize: 9, fontVariantNumeric: 'tabular-nums' }}>{p.d.kcal}</div>}
          </div>
        ))}
      </div>

      {/* axis labels */}
      <div style={{ position: 'absolute', right: 0, top: ty - 18, fontSize: 9, color: 'var(--tomato)' }}>目标 {target}</div>
    </div>
  );
}

const pillBtn = {
  padding: '6px 14px', borderRadius: 999,
  background: 'var(--ink)', color: 'var(--paper)',
  border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
  fontFamily: 'inherit',
};
const pillBtnGhost = {
  padding: '6px 14px', borderRadius: 999,
  background: 'transparent', color: 'var(--ink-soft)',
  border: '1px solid var(--line)', fontSize: 11, cursor: 'pointer',
  fontFamily: 'inherit',
};

window.SevenDayScreen = SevenDayScreen;
