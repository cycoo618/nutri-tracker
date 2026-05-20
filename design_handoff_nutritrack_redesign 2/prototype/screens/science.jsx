// screens/science.jsx — 科学 discovery (warm journal redesign)

function ScienceScreen({ onNav, onAdd, sheetOpen, closeSheet, active = '科学' }) {
  const reads = [
    { tag: '抗炎', tagColor: 'var(--moss)', title: '为什么每天一份发酵食品有用', sub: '7 项研究 · 4 分钟', kind: 'study' },
    { tag: '减脂', tagColor: 'var(--tomato)', title: '热量缺口 vs. 食物质量', sub: '编辑笔记 · 6 分钟', kind: 'note' },
    { tag: 'Omega-3', tagColor: 'var(--sky)', title: '一周两份鱼的真正意义', sub: '科普 · 3 分钟', kind: 'study' },
  ];
  const facts = [
    { v: '7+', l: '类食物', sub: '每周建议种类下限' },
    { v: '300g', l: '蔬菜', sub: '每日下限' },
    { v: '≥30', l: '克纤维', sub: '肠道菌群最爱' },
  ];

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />
      <div className="app-scroll" style={{ paddingTop: 58 }}>
        <div style={{ padding: '4px 22px 0' }}>
          <div className="display" style={{ fontSize: 22, color: 'var(--ink)' }}>科学室</div>
          <div className="caveat" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>the why behind the food</div>
        </div>

        {/* Today's read — featured */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card" style={{ padding: 0, background: 'var(--card)', overflow: 'hidden' }}>
            <div className="placeholder-strip" style={{ height: 130, borderRadius: '18px 18px 0 0', border: 'none' }}>
              ← cover image →
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span className="chip" style={{ background: 'rgba(111,139,77,0.12)', color: 'var(--moss)', borderColor: 'rgba(111,139,77,0.3)' }}>🫒 抗炎</span>
                <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>今日推荐 · 5 月 16 日</span>
              </div>
              <h2 className="display" style={{ margin: 0, fontSize: 22, color: 'var(--ink)', lineHeight: 1.3 }}>
                关于"<span style={{ color: 'var(--tomato)' }}>发酵</span>"这件小事
              </h2>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6, marginTop: 8 }}>
                希腊酸奶、味噌、纳豆、泡菜 — 它们其实是同一个小帮派,
                每天一勺就能让肠道菌群多样性 +30%。
              </div>
              <button style={{
                marginTop: 12, padding: '8px 14px',
                background: 'var(--ink)', color: 'var(--paper)',
                border: 'none', borderRadius: 999, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>读 4 分钟 →</button>
            </div>
          </div>
        </div>

        {/* Fact band */}
        <div style={{ padding: '14px 18px 0' }}>
          <div className="card card-warm" style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
            {facts.map((f,i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, background: 'var(--line)' }} />}
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div className="display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1 }}>{f.v}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink)', marginTop: 2, fontWeight: 600 }}>{f.l}</div>
                  <div style={{ fontSize: 9, color: 'var(--ink-mute)' }}>{f.sub}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Library */}
        <div style={{ padding: '18px 22px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <h3 className="serif" style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>书架</h3>
          <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>three short reads</span>
        </div>
        <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reads.map((r, i) => (
            <div key={i} className="card" style={{
              padding: '12px 14px', background: 'var(--card)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 56,
                background: 'var(--paper-2)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Ma Shan Zheng, serif', fontSize: 14, color: 'var(--ink-soft)',
                flexShrink: 0,
              }}>{r.tag[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="chip" style={{ background: 'rgba(0,0,0,0.04)', color: r.tagColor, borderColor: 'transparent', fontSize: 10 }}>{r.tag}</span>
                <div className="serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginTop: 2, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{r.sub}</div>
              </div>
              <span style={{ color: 'var(--ink-mute)' }}>›</span>
            </div>
          ))}
        </div>

        {/* Ask a question */}
        <div style={{ padding: '16px 18px 4px' }}>
          <div className="card card-warm" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>💬</span>
            <div style={{ flex: 1 }}>
              <div className="serif" style={{ fontSize: 13, fontWeight: 700 }}>问一个营养小问题</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>"晚饭吃面会让我胖吗?"</div>
            </div>
            <button style={{
              padding: '6px 12px', borderRadius: 999,
              background: 'var(--tomato)', color: 'white',
              border: 'none', fontSize: 11, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>问</button>
          </div>
        </div>
      </div>

      <PaperDock active={active} onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

window.ScienceScreen = ScienceScreen;
