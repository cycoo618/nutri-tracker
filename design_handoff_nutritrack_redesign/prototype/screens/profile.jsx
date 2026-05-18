// screens/profile.jsx — 我的 (profile + settings, warm journal redesign)

function ProfileScreen({ onNav, onAdd, sheetOpen, closeSheet, active = '我' }) {
  // Ordered list — first = primary, second = secondary (max 2)
  const [goals, setGoals] = React.useState(['fat', 'antiInflam']);
  const [fontSize, setFontSize] = React.useState('标准');
  const [lang, setLang] = React.useState('中文');
  const [weight, setWeight] = React.useState('56');
  const [bodyFat, setBodyFat] = React.useState('29.6');
  const [kcalTarget, setKcalTarget] = React.useState('1500');

  const goalOptions = [
    { k: 'fat',         emoji: '🔥', name: '减脂',   desc: '温和热量缺口,可持续减脂',           color: 'var(--tomato)',  view: '营养日记 · 单一焦点' },
    { k: 'muscle',      emoji: '💪', name: '增肌',   desc: '适当增加蛋白质和优质碳水',         color: 'var(--mustard)', view: '蛋白仪表盘 · 待开发' },
    { k: 'antiInflam',  emoji: '🫒', name: '抗炎',   desc: '地中海饮食为基础,Omega-3 多样蔬果', color: 'var(--moss)',    view: '七色花园 · 多样性优先' },
    { k: 'glucose',     emoji: '🩸', name: '控血糖', desc: '关注 GI 值,优先低 GI 食物',         color: 'var(--plum)',    view: '时间节奏 · 待开发' },
  ];

  const toggleGoal = (k) => {
    const idx = goals.indexOf(k);
    if (idx === 0) {
      // primary clicked: demote (remove)
      setGoals(goals.slice(1));
    } else if (idx === 1) {
      // secondary clicked: promote to primary, demote primary to secondary
      setGoals([k, goals[0]]);
    } else {
      // not selected
      if (goals.length === 0) setGoals([k]);
      else if (goals.length === 1) setGoals([...goals, k]);
      else setGoals([goals[0], k]); // replace secondary
    }
  };

  const primaryGoal = goals[0] ? goalOptions.find(g => g.k === goals[0]) : null;

  return (
    <div className="app-paper paper-grain">
      <PaperStatusBar time="13:45" />
      <div className="app-scroll" style={{ paddingTop: 58 }}>
        {/* Identity header */}
        <div style={{ padding: '4px 22px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--card-warm), var(--card))',
              border: '1px solid var(--line)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>🥗</div>
            <div style={{ flex: 1 }}>
              <div className="display" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1.2 }}>晚晚的食谱本</div>
              <div className="caveat" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>since Jan 2024 · 156 days strong</div>
            </div>
            <button style={{
              background: 'transparent', border: '1px solid var(--line)',
              borderRadius: 999, padding: '4px 10px',
              fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>编辑</button>
          </div>
          {/* tiny stats */}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            {[
              { v: '23', l: '连续天数' },
              { v: '−3.0', l: '减重 kg' },
              { v: '78', l: '抗炎评分' },
            ].map((s,i) => (
              <div key={i} className="card" style={{ flex: 1, padding: '8px 10px', background: 'var(--card)' }}>
                <div className="display" style={{ fontSize: 20, color: 'var(--ink)', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Goals — with priority */}
        <SectionTitle title="我的目标" hint="按优先级选 1–2 个 · 点击切换" />
        <div style={{ padding: '0 18px 4px', fontSize: 11, color: 'var(--ink-mute)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={priorityBadge('var(--tomato)')}>①</span> 主目标 · 决定首页和提议
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span style={priorityBadge('var(--ink-mute)')}>②</span> 次目标 · 微调建议
          </span>
        </div>
        <div style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {goalOptions.map(g => {
            const pri = goals.indexOf(g.k);
            const isPrimary = pri === 0;
            const isSecondary = pri === 1;
            const selected = pri >= 0;
            return (
              <button key={g.k} onClick={() => toggleGoal(g.k)} style={{
                background: selected ? 'color-mix(in oklab, ' + g.color + ' 6%, var(--card))' : 'var(--card)',
                border: '1.5px solid ' + (isPrimary ? g.color : (isSecondary ? 'color-mix(in oklab, ' + g.color + ' 60%, var(--line))' : 'var(--line-soft)')),
                borderRadius: 14, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                position: 'relative',
                boxShadow: isPrimary ? '0 4px 14px color-mix(in oklab, ' + g.color + ' 16%, transparent)' : 'none',
              }}>
                <span style={{ fontSize: 26, opacity: selected ? 1 : 0.45 }}>{g.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</span>
                    {isPrimary && <span style={{
                      ...priorityBadge(g.color),
                      background: g.color, color: 'white',
                    }}>① 主</span>}
                    {isSecondary && <span style={{
                      ...priorityBadge(g.color),
                      borderColor: g.color, color: g.color,
                    }}>② 次</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{g.desc}</div>
                </div>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: selected ? g.color : 'transparent',
                  border: '1.5px solid ' + (selected ? g.color : 'var(--line)'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, flexShrink: 0,
                }}>{selected ? (isPrimary ? '1' : '2') : ''}</span>
              </button>
            );
          })}
        </div>

        {/* Home view adaptation preview */}
        {primaryGoal && (
          <div style={{ padding: '12px 18px 0' }}>
            <div className="card card-warm" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'color-mix(in oklab, ' + primaryGoal.color + ' 14%, transparent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>{primaryGoal.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: 1.5, textTransform: 'uppercase' }}>首页适配预览</div>
                <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 700, marginTop: 2 }}>
                  {primaryGoal.view}
                </div>
                <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2 }}>
                  你的主目标是 <strong style={{ color: primaryGoal.color }}>{primaryGoal.name}</strong>,
                  首页会自动用这套布局突出重点
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Body data */}
        <SectionTitle title="身体数据" hint="每周一更新" topPad />
        <div style={{ padding: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <FieldCard label="体重" unit="kg" value={weight} onChange={setWeight} delta="−0.4 / 7天" deltaColor="var(--sage)" />
          <FieldCard label="体脂率" unit="%" value={bodyFat} onChange={setBodyFat} delta="−0.8 / 7天" deltaColor="var(--sage)" />
        </div>
        <div style={{ padding: '8px 18px 0' }}>
          <FieldCard label="每日热量目标" unit="kcal" value={kcalTarget} onChange={setKcalTarget} hint="按当前减脂节奏计算" full />
        </div>

        {/* Settings */}
        <SectionTitle title="偏好" topPad />
        <div style={{ padding: '0 18px' }}>
          <div className="card" style={{ padding: '14px 16px', background: 'var(--card)' }}>
            <PrefRow label="字体大小">
              <Segmented options={['小','标准','大']} value={fontSize} onChange={setFontSize} />
            </PrefRow>
            <hr className="hr-dash" style={{ margin: '12px 0' }} />
            <PrefRow label="语言">
              <Segmented options={['中文','EN']} value={lang} onChange={setLang} />
            </PrefRow>
            <hr className="hr-dash" style={{ margin: '12px 0' }} />
            <PrefRow label="深色模式">
              <Toggle on={false} />
            </PrefRow>
          </div>
        </div>

        {/* Links */}
        <SectionTitle title="更多" topPad />
        <div style={{ padding: '0 18px' }}>
          <div className="card" style={{ padding: '4px 4px', background: 'var(--card)' }}>
            {[
              { i: '📖', l: '饮食分析' },
              { i: '👨‍👩‍👧', l: '家庭共享', sub: '与 2 人共享' },
              { i: '📥', l: '导出本月日记', sub: 'PDF' },
              { i: '❓', l: '帮助 & 反馈' },
            ].map((row, i) => (
              <button key={i} style={linkRow}>
                <span style={{ fontSize: 18, width: 30 }}>{row.i}</span>
                <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{row.l}</span>
                {row.sub && <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginRight: 6 }}>{row.sub}</span>}
                <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>›</span>
              </button>
            ))}
          </div>
        </div>

        {/* Save + sign out */}
        <div style={{ padding: '20px 18px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button style={{
            padding: '14px', borderRadius: 14,
            background: 'var(--ink)', color: 'var(--paper)',
            border: 'none', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 14px rgba(42,30,16,0.18)',
          }}>保存改动</button>
          <button style={{
            padding: '10px', background: 'transparent',
            border: 'none', color: 'var(--tomato)', fontSize: 12,
            cursor: 'pointer', fontFamily: 'Caveat, cursive',
          }}>登出 ⤴</button>
        </div>
      </div>

      <PaperDock active={active} onAdd={onAdd} onNav={onNav} />
      <AddSheet open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}

const priorityBadge = (color) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 22, height: 18, padding: '0 5px',
  borderRadius: 999,
  background: 'transparent', color, border: '1px solid ' + color,
  fontSize: 9, fontWeight: 700, letterSpacing: 0.2,
  fontFamily: 'inherit',
});

function SectionTitle({ title, hint, topPad }) {
  return (
    <div style={{ padding: (topPad ? '20px' : '8px') + ' 22px 10px', display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <h3 className="serif" style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: 1 }}>{title}</h3>
      {hint && <span className="caveat" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{hint}</span>}
      <div style={{ flex: 1, height: 1, background: 'var(--line-soft)' }} />
    </div>
  );
}

function FieldCard({ label, unit, value, onChange, delta, deltaColor, hint, full }) {
  return (
    <div className="card" style={{ padding: '10px 14px', background: 'var(--card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{label}</span>
        {delta && <span style={{ fontSize: 10, color: deltaColor }}>{delta}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
        <input
          value={value}
          onChange={e => onChange && onChange(e.target.value)}
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'ZCOOL QingKe HuangYou, serif',
            fontSize: 22, color: 'var(--ink)', width: full ? '80%' : '60%', padding: 0,
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{unit}</span>
      </div>
      {hint && <div style={{ fontSize: 10, color: 'var(--ink-mute)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

function PrefRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--ink)' }}>{label}</span>
      {children}
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--paper)',
      border: '1px solid var(--line-soft)',
      borderRadius: 999, padding: 2,
    }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange && onChange(o)} style={{
          padding: '5px 12px', borderRadius: 999,
          background: o === value ? 'var(--ink)' : 'transparent',
          color: o === value ? 'var(--paper)' : 'var(--ink-soft)',
          border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
        }}>{o}</button>
      ))}
    </div>
  );
}

function Toggle({ on }) {
  const [v, setV] = React.useState(on);
  return (
    <button onClick={() => setV(!v)} style={{
      width: 40, height: 22, borderRadius: 999,
      border: 'none', cursor: 'pointer',
      background: v ? 'var(--ink)' : 'var(--line)',
      position: 'relative', padding: 2,
    }}>
      <span style={{
        position: 'absolute',
        top: 2, left: v ? 20 : 2,
        width: 18, height: 18, borderRadius: '50%',
        background: 'var(--paper)',
        transition: 'left .2s',
      }} />
    </button>
  );
}

const linkRow = {
  width: '100%', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
  background: 'transparent', border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', textAlign: 'left',
};

window.ProfileScreen = ProfileScreen;
