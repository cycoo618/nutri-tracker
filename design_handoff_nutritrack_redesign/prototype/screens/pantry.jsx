// screens/pantry.jsx — 食材库 (warm journal redesign)

function PantryScreen({ onNav, onAdd, sheetOpen, closeSheet, onBack }) {
  const [tab, setTab] = React.useState('all'); // all / scanned / combined
  const items = [
    {
      name: '麻酱二八酱', tag: 'scan', sub: null,
      per100g: { kcal: 2661, p: 25.7, c: 32.2, f: 52.2 },
      scanned: '上周三',
    },
    {
      name: 'WHOLE GUAC', tag: 'scan', sub: 'mini 杯 · 57g',
      per100g: { kcal: 193, p: 1.8, c: 5.3, f: 15.8 },
      scanned: '5月12日',
    },
    {
      name: '香烤海苔薯片', tag: 'scan', sub: '1袋 · 30g',
      per100g: { kcal: 547, p: 10.0, c: 56.7, f: 33.3 },
      scanned: '5月10日',
    },
    {
      name: '燕麦+蓝莓+酸奶 早餐碗', tag: 'combo', sub: '自配 · 250g',
      per100g: { kcal: 115, p: 4.8, c: 16.2, f: 3.1 },
      scanned: null,
    },
    {
      name: '糙米饭 + 鳕鱼 + 西兰花 工作餐', tag: 'combo', sub: '自配 · 380g',
      per100g: { kcal: 102, p: 8.6, c: 12.3, f: 2.5 },
      scanned: null,
    },
  ];

  const filtered = tab === 'all' ? items : items.filter(i => (tab === 'scanned' ? i.tag === 'scan' : i.tag === 'combo'));

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />
      <div className="app-scroll" style={{ paddingTop: 56 }}>

        {/* Header bar */}
        <div style={{ padding: '4px 22px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack || (() => onNav && onNav('总览'))} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'transparent', border: '1px solid var(--line)',
            color: 'var(--ink-soft)', fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>‹</button>
          <div style={{ flex: 1 }}>
            <div className="display" style={{ fontSize: 22, color: 'var(--ink)', lineHeight: 1.1 }}>食材库</div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>23 件食材 · 11 个常吃组合</div>
          </div>
          <span className="caveat" style={{ fontSize: 16, color: 'var(--sage)' }}>synced</span>
        </div>

        {/* Two actions */}
        <div style={{ padding: '14px 18px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ActionCard
            emoji="📷"
            title="扫包装袋"
            desc="拍背面营养表"
            color="var(--ink)"
          />
          <ActionCard
            emoji="⚗"
            title="组合食材"
            desc="把几样配成一餐"
            color="var(--moss)"
          />
        </div>

        {/* Search */}
        <div style={{ padding: '12px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--card)', border: '1px solid var(--line-soft)',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <span style={{ color: 'var(--ink-mute)', fontSize: 13 }}>🔍</span>
            <span style={{ color: 'var(--ink-mute)', fontSize: 13, flex: 1 }}>搜食材名 · 标签 · 品牌</span>
            <span className="caveat" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>23 件</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '12px 22px 4px', display: 'flex', alignItems: 'center', gap: 14 }}>
          {[
            { k: 'all', l: '全部', n: 23 },
            { k: 'scanned', l: '扫码', n: 16 },
            { k: 'combined', l: '组合', n: 7 },
          ].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)} style={{
              background: 'transparent', border: 'none', padding: '4px 0',
              cursor: 'pointer', fontFamily: 'inherit',
              color: tab === t.k ? 'var(--ink)' : 'var(--ink-mute)',
              fontWeight: tab === t.k ? 700 : 400,
              fontSize: 13,
              borderBottom: '1.5px solid ' + (tab === t.k ? 'var(--ink)' : 'transparent'),
            }}>
              {t.l} <span style={{ fontSize: 10, color: 'var(--ink-mute)', fontWeight: 400 }}>{t.n}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'inherit',
          }}>排序: 最近 ▾</button>
        </div>

        {/* Items list */}
        <div style={{ padding: '4px 18px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((it, i) => <PantryItem key={i} item={it} />)}
        </div>

        <div style={{ padding: '8px 18px 4px', textAlign: 'center' }}>
          <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>that's all — for now</span>
        </div>
      </div>

      <PaperDock active="" onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

function ActionCard({ emoji, title, desc, color }) {
  return (
    <button style={{
      padding: '14px 14px',
      background: 'var(--card)',
      border: '1px solid var(--line-soft)',
      borderRadius: 16,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      position: 'relative', overflow: 'hidden',
    }}>
      <span style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</span>
      <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginTop: 6 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{desc}</div>
      <span style={{
        position: 'absolute', top: 10, right: 12,
        color, fontSize: 18, lineHeight: 1,
      }}>→</span>
    </button>
  );
}

function PantryItem({ item }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="card" style={{ padding: '14px 14px', background: 'var(--card)' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* "label" */}
        <div style={{
          width: 38, height: 50,
          background: 'var(--paper-2)',
          border: '1px solid var(--line)',
          borderRadius: 4,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Ma Shan Zheng, serif',
          color: 'var(--ink-soft)',
          fontSize: 10,
          flexShrink: 0,
          position: 'relative',
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{item.tag === 'scan' ? '📷' : '⚗'}</span>
          <span style={{ fontSize: 8, color: 'var(--ink-mute)', marginTop: 2 }}>{item.tag === 'scan' ? '扫码' : '组合'}</span>
        </div>

        {/* content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>{item.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {item.sub && <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{item.sub}</span>}
            {item.scanned && (
              <>
                {item.sub && <span style={{ color: 'var(--ink-faint)' }}>·</span>}
                <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{item.scanned}</span>
              </>
            )}
          </div>

          {/* macro line */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 11, color: 'var(--ink-soft)' }}>
            <Macro label="kcal" v={item.per100g.kcal} color="var(--ink)" big />
            <Macro label="P" v={item.per100g.p + 'g'} color="var(--sky)" />
            <Macro label="C" v={item.per100g.c + 'g'} color="var(--mustard)" />
            <Macro label="F" v={item.per100g.f + 'g'} color="var(--tomato)" />
            <span style={{ marginLeft: 'auto', fontSize: 9, color: 'var(--ink-mute)' }}>per 100g</span>
          </div>

          {/* actions */}
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button style={{
              padding: '5px 12px', borderRadius: 999,
              background: 'var(--ink)', color: 'var(--paper)',
              border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>＋ 加到今日</button>
            <button onClick={() => setOpen(!open)} style={{
              padding: '5px 10px', borderRadius: 999,
              background: 'transparent', color: 'var(--ink-soft)',
              border: '1px solid var(--line)', fontSize: 11, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>{open ? '收起' : '更多'}</button>
            <span style={{ flex: 1 }} />
            <button style={iconBtn}>✎</button>
            <button style={iconBtn}>⌫</button>
          </div>

          {open && (
            <div className="sheet-in" style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
              <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>常用份量</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {['10g', '15g', '30g', '1 勺'].map((p, i) => (
                  <button key={i} style={{
                    padding: '4px 10px', borderRadius: 999,
                    background: 'var(--paper)', border: '1px solid var(--line-soft)',
                    color: 'var(--ink-soft)', fontSize: 11, cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>{p}</button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>抗炎评分</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--line-soft)', overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', background: 'var(--mustard)' }} />
                </div>
                <span style={{ fontSize: 11, color: 'var(--mustard)', fontWeight: 600 }}>中等 · 38</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Macro({ label, v, color, big }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2 }}>
      <span style={{ fontSize: 9, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      <span style={{
        fontFamily: 'ZCOOL QingKe HuangYou, serif',
        fontSize: big ? 16 : 13,
        color, lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}>{v}</span>
    </span>
  );
}

const iconBtn = {
  width: 28, height: 28, borderRadius: 8,
  background: 'transparent', border: '1px solid var(--line-soft)',
  color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
};

window.PantryScreen = PantryScreen;
