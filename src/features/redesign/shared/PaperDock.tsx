import React from 'react';

type TabKey = '总览' | '趋势' | '科学' | '我';

interface PaperDockProps {
  active: TabKey;
  onAdd: () => void;
  onNav: (tab: TabKey) => void;
}

const TABS: { key: TabKey; emoji: string }[] = [
  { key: '总览', emoji: '📖' },
  { key: '趋势', emoji: '📈' },
  { key: '科学', emoji: '🔬' },
  { key: '我',   emoji: '🪴' },
];

export function PaperDock({ active, onAdd, onNav }: PaperDockProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 14,
        left: 14,
        right: 14,
        zIndex: 50,
        background: 'rgba(251,246,231,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--line-soft)',
        borderRadius: 22,
        height: 64,
        boxShadow: '0 10px 30px rgba(76,55,30,0.10)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      {TABS.slice(0, 2).map(tab => (
        <TabBtn key={tab.key} tab={tab} active={active} onNav={onNav} />
      ))}

      {/* Center + button */}
      <div style={{ position: 'relative', width: 56, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button
          onClick={onAdd}
          style={{
            position: 'absolute',
            bottom: 22,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--tomato)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(255,107,87,0.35)',
            transition: 'transform 0.15s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); onAdd(); }}
        >
          <span style={{ color: '#fff', fontSize: 26, lineHeight: 1, marginTop: -2 }}>＋</span>
        </button>
      </div>

      {TABS.slice(2).map(tab => (
        <TabBtn key={tab.key} tab={tab} active={active} onNav={onNav} />
      ))}
    </div>
  );
}

function TabBtn({ tab, active, onNav }: { tab: { key: TabKey; emoji: string }; active: TabKey; onNav: (t: TabKey) => void }) {
  const isActive = active === tab.key;
  return (
    <button
      onClick={() => onNav(tab.key)}
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        position: 'relative',
      }}
    >
      <span style={{ fontSize: 20 }}>{tab.emoji}</span>
      <span
        className="nt-serif"
        style={{
          fontSize: 11,
          color: isActive ? 'var(--ink)' : 'var(--ink-mute)',
          fontWeight: isActive ? 700 : 400,
        }}
      >
        {tab.key}
      </span>
      {isActive && (
        <span style={{
          position: 'absolute',
          bottom: 6,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'var(--tomato)',
        }} />
      )}
    </button>
  );
}
