// screens/macros.jsx — 今日明细 (merged macros + diversity overview)
// Tapped into from the 宏量平衡 / 食物多样性 mini-stats on the home page.

function MacrosScreen({ onNav, onAdd, sheetOpen, closeSheet, onBack }) {
  const macros = [
    { label: '蛋白质', ...TODAY.protein, emoji: '🥚', desc: '肌肉合成 · 修复',     tag: '充足', tagColor: 'var(--sky)' },
    { label: '碳水',   ...TODAY.carbs,   emoji: '🌾', desc: '能量来源 · 大脑燃料', tag: '偏多', tagColor: 'var(--mustard)' },
    { label: '脂肪',   ...TODAY.fat,     emoji: '🥑', desc: '细胞健康 · 激素',     tag: '偏少', tagColor: 'var(--tomato)' },
    { label: '膳食纤维', ...TODAY.fiber, emoji: '🥬', desc: '肠道菌群 · 饱腹感',   tag: '充足', tagColor: 'var(--sage)' },
  ];
  // 留心摄入 — ceiling-type: less is better. ok = v < t.
  const caps = [
    { label: '添加糖',   v: 0,   t: 50,   unit: 'g',  emoji: '🍬', hint: '今日 0g · 优秀',     ok: true,  level: 'good' },
    { label: '钠',       v: 238, t: 2300, unit: 'mg', emoji: '🧂', hint: '远低于 2300mg',       ok: true,  level: 'good' },
    { label: '胆固醇',   v: 142, t: 300,  unit: 'mg', emoji: '🥚', hint: '约一半上限 · 安全',   ok: true,  level: 'mid'  },
    { label: '反式脂肪', v: 0,   t: 2,    unit: 'g',  emoji: '🍟', hint: '今日 0 · 优秀',       ok: true,  level: 'good' },
  ];

  // 微量元素 — floor-type: more is better. ok = v >= t.
  const trace = [
    { label: '钙', v: 620,  t: 1000, unit: 'mg', emoji: '🥛', color: 'var(--sage)' },
    { label: '铁', v: 9,    t: 15,   unit: 'mg', emoji: '🩸', color: 'var(--tomato)' },
    { label: '钾', v: 2400, t: 3500, unit: 'mg', emoji: '🍌', color: 'var(--mustard)' },
    { label: '镁', v: 220,  t: 350,  unit: 'mg', emoji: '🌰', color: 'var(--moss)' },
    { label: '锌', v: 6,    t: 12,   unit: 'mg', emoji: '🦪', color: 'var(--sky)' },
  ];

  // 7 天宏量评分(虚构):用于趋势 sparkline
  const weekScores = [68, 71, 65, 78, 72, 70, 73];
  const days = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />
      <div className="app-scroll" style={{ paddingTop: 54 }}>

        {/* Header */}
        <div style={{ padding: '6px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack || (() => onNav && onNav('总览'))} style={macrosBackBtn}>‹</button>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>今日明细</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>宏量 · 留心摄入 · 多样性 · 微量元素 · 5月16日 周六</div>
          </div>
        </div>

        {/* Hero score card */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card" style={{ padding: '18px 18px 14px', background: 'var(--card)', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 32, height: 32,
              background: 'linear-gradient(225deg, var(--paper-2) 50%, transparent 50%)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Ring value={73} target={100} size={92} stroke={9} color="var(--mustard)">
                <span className="display" style={{ fontSize: 28, color: 'var(--ink)', lineHeight: 1 }}>73</span>
                <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>/ 100 分</span>
              </Ring>
              <div style={{ flex: 1 }}>
                <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>今日得分 73 分</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--mustard)' }}>碳水偏多</strong> · <strong style={{ color: 'var(--tomato)' }}>脂肪偏少</strong> ·
                  晚餐建议:多蛋白 + 少米饭,加点橄榄油。
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 四大宏量 + 留心摄入 — side by side */}
        <div style={{ padding: '14px 18px 6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {/* 四大宏量 */}
          <div className="card" style={{ padding: '10px 8px 10px', background: 'var(--card)' }}>
            <div style={{ padding: '0 4px 8px' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>四大宏量</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {macros.map((m, i) => {
                const pct = Math.min(m.v / m.t, 1);
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1 }}>
                      <span style={{ fontSize: 12 }}>{m.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>{m.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span className="display" style={{ fontSize: 14, color: m.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{m.v}</span>
                      <span style={{ fontSize: 8, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>/{m.t}g</span>
                    </div>
                    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden', marginTop: 1 }}>
                      <div style={{ width: (pct * 100) + '%', height: '100%', background: m.color }} />
                    </div>
                    <span style={{ fontSize: 8.5, color: m.tagColor, fontWeight: 600, lineHeight: 1 }}>{m.tag}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 留心摄入 */}
          <div className="card" style={{ padding: '10px 8px 10px', background: 'var(--card)' }}>
            <div style={{ padding: '0 4px 8px' }}>
              <h3 className="serif" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>留心摄入</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {caps.map((c, i) => {
                const pct = Math.min(c.v / c.t, 1);
                const tone = c.level === 'good' ? 'var(--sage)' : c.level === 'mid' ? 'var(--mustard)' : 'var(--tomato)';
                const tagText = c.level === 'good' ? '充足' : c.level === 'mid' ? '中等' : '偏高';
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '4px 2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, lineHeight: 1 }}>
                      <span style={{ fontSize: 12 }}>{c.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{c.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span className="display" style={{ fontSize: 14, color: tone, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{c.v}</span>
                      <span style={{ fontSize: 8, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>/{c.t}{c.unit}</span>
                    </div>
                    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden', marginTop: 1 }}>
                      <div style={{ width: (pct * 100) + '%', height: '100%', background: tone, opacity: 0.85 }} />
                    </div>
                    <span style={{ fontSize: 8.5, color: tone, fontWeight: 600, lineHeight: 1 }}>{tagText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Diversity compact section */}
        <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>食物多样性</h3>
          <button onClick={() => onNav && onNav('多样性')} style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11, color: 'var(--ink-mute)',
          }}>查看 7 天历史 ›</button>
        </div>
        <div style={{ padding: '6px 18px 0' }}>
          <div className="card" style={{ padding: '14px 14px 12px', background: 'var(--card)' }}>
            {/* Ring + nudge row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
              <Ring value={FOOD_GROUPS.filter(g => g.done).length} target={7} size={56} stroke={6} color="var(--sage)">
                <span className="display" style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1 }}>{FOOD_GROUPS.filter(g => g.done).length}</span>
                <span style={{ fontSize: 8, color: 'var(--ink-mute)' }}>/ 7</span>
              </Ring>
              <div style={{ flex: 1, fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                抗炎建议 <strong style={{ color: 'var(--sage)' }}>每天 5–7 类</strong>。加 <strong style={{ color: 'var(--tomato)' }}>1 份酸奶 + 1 份叶菜</strong>,可上到 4 类。
              </div>
            </div>
            {/* 7 emoji chips row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {FOOD_GROUPS.map(g => (
                <div key={g.key} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '6px 2px 4px',
                  background: g.done ? 'color-mix(in oklab, ' + g.color + ' 14%, var(--card))' : 'var(--card-warm)',
                  border: '1px solid ' + (g.done ? 'color-mix(in oklab, ' + g.color + ' 35%, transparent)' : 'var(--line-soft)'),
                  borderRadius: 8,
                  opacity: g.done ? 1 : 0.7,
                }}>
                  <span style={{ fontSize: 16, filter: g.done ? 'none' : 'grayscale(0.4)' }}>{g.emoji}</span>
                  <span style={{ fontSize: 8.5, color: g.done ? g.color : 'var(--ink-mute)', fontWeight: g.done ? 600 : 400, lineHeight: 1, whiteSpace: 'nowrap' }}>{g.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 微量元素 — floor-type, more is better; placed under diversity as the "intake breadth" follow-up */}
        <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>微量元素</h3>
          <span className="caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>trace minerals</span>
        </div>
        <div style={{ padding: '6px 18px 0' }}>
          <div className="card" style={{ padding: '14px 12px 12px', background: 'var(--card)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
              {trace.map((t, i) => {
                const pct = Math.min(t.v / t.t, 1);
                const isHit = pct >= 1;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 2px' }}>
                    <span style={{ fontSize: 16, opacity: isHit ? 1 : 0.7 }}>{t.emoji}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{t.label}</span>
                    <span className="display" style={{ fontSize: 14, color: isHit ? t.color : 'var(--ink-soft)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {t.v >= 1000 ? (t.v / 1000).toFixed(1) + 'k' : t.v}
                    </span>
                    <span style={{ fontSize: 8.5, color: 'var(--ink-mute)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      / {t.t >= 1000 ? (t.t / 1000).toFixed(1) + 'k' : t.t} {t.unit}
                    </span>
                    <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden', marginTop: 2 }}>
                      <div style={{ width: (pct * 100) + '%', height: '100%', background: t.color, opacity: isHit ? 1 : 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <hr className="hr-dash" style={{ margin: '10px 0 8px' }} />
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>钙、铁</strong>仍偏低 · 加 1 杯酸奶 + 半碗瘦牛肉,各补 30%+
            </div>
          </div>
        </div>

        {/* 7-day score sparkline */}
        <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>7 天评分</h3>
          <span className="caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>this week</span>
        </div>
        <div style={{ padding: '6px 18px 0' }}>
          <div className="card" style={{ padding: '14px 16px', background: 'var(--card)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 72, marginBottom: 6 }}>
              {weekScores.map((s, i) => {
                const isToday = i === weekScores.length - 1;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 9, color: 'var(--ink-mute)', fontVariantNumeric: 'tabular-nums' }}>{s}</div>
                    <div style={{
                      width: '100%', height: (s / 100 * 56) + 'px',
                      background: isToday ? 'var(--mustard)' : 'color-mix(in oklab, var(--mustard) 35%, var(--card-warm))',
                      borderRadius: 4,
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {days.map((d, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: i === days.length - 1 ? 'var(--ink)' : 'var(--ink-mute)', fontWeight: i === days.length - 1 ? 700 : 400 }}>{d}</div>
              ))}
            </div>
            <hr className="hr-dash" style={{ margin: '12px 0 8px' }} />
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
              本周平均 <strong style={{ color: 'var(--ink)' }}>71 分</strong> · 周四最高 78 分(蛋白 + 纤维都到位那天)
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ padding: '14px 18px 4px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>今晚怎么吃</h3>
          <span className="caveat" style={{ fontSize: 15, color: 'var(--ink-mute)' }}>tonight</span>
        </div>
        <div style={{ padding: '6px 18px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { emoji: '🐟', title: '清蒸三文鱼 100g', sub: '+ 22g 蛋白 · + 6g Omega-3 优质脂肪', tone: 'var(--sage)' },
            { emoji: '🥬', title: '炒西兰花 200g',   sub: '+ 8g 纤维 · 抗炎',                     tone: 'var(--moss)' },
            { emoji: '🌾', title: '糙米饭 减半',     sub: '碳水当前已偏多',                       tone: 'var(--mustard)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{
              padding: '10px 14px', background: 'var(--card)',
              display: 'flex', alignItems: 'center', gap: 12,
              borderLeft: '3px solid ' + s.tone,
            }}>
              <span style={{ fontSize: 22 }}>{s.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{s.title}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 1 }}>{s.sub}</div>
              </div>
              <button onClick={onAdd} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: s.tone, color: 'white', border: 'none',
                fontSize: 14, cursor: 'pointer',
              }}>＋</button>
            </div>
          ))}
        </div>
      </div>

      <PaperDock active="总览" onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

const macrosBackBtn = {
  width: 32, height: 32, borderRadius: '50%',
  background: 'transparent', border: '1px solid var(--line)',
  color: 'var(--ink-soft)', fontSize: 16, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', flexShrink: 0,
};

window.MacrosScreen = MacrosScreen;
