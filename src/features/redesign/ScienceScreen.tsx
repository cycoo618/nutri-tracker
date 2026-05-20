import React from 'react';

const FACTS = [
  { value: '7+', label: '每天饮食种类' },
  { value: '300g', label: '蔬菜摄入目标' },
  { value: '≥30', label: '每周植物种' },
];

const BOOKS = [
  { color: 'var(--sage)', title: '地中海饮食圣经', desc: '科学实证的抗炎饮食指南', url: 'https://book.douban.com/subject/35460906/' },
  { color: 'var(--sky)', title: '肠道健康革命', desc: '微生物组与免疫力的关系', url: 'https://book.douban.com/subject/26904268/' },
  { color: 'var(--mustard)', title: '断食的力量', desc: '16:8 间歇性断食方法论', url: 'https://book.douban.com/subject/34441556/' },
];

const ARTICLE_URL = 'https://pubmed.ncbi.nlm.nih.gov/?term=omega-3+brain+cognitive+decline';

export function ScienceScreen() {
  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <div style={{ padding: '8px 22px 16px' }}>
        <div className="nt-display" style={{ fontSize: 32, color: 'var(--ink)' }}>科学室</div>
        <div className="nt-caveat" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>
          eat smarter, live longer
        </div>
      </div>

      {/* Featured article */}
      <div className="nt-card" style={{ margin: '0 16px 12px', overflow: 'hidden' }}>
        {/* Cover strip */}
        <div style={{
          height: 130, width: '100%',
          background: 'linear-gradient(135deg, var(--sage) 0%, var(--sky) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 52 }}>🫒</span>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <span className="nt-chip" style={{ marginBottom: 8, display: 'inline-flex', background: 'rgba(79,166,99,0.12)', borderColor: 'rgba(79,166,99,0.25)', color: 'var(--sage)' }}>
            本周精选
          </span>
          <div className="nt-display" style={{ fontSize: 20, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.3 }}>
            Omega-3 与大脑健康的10年追踪研究
          </div>
          <p className="nt-serif" style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 12px' }}>
            每周2次深海鱼类摄入，可将认知衰退风险降低35%。DHA 是构成神经细胞膜的关键成分，对记忆力和专注力有直接影响…
          </p>
          <button onClick={() => window.open(ARTICLE_URL, '_blank')} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 999,
            background: 'var(--ink)', color: '#fff',
            fontSize: 13, border: 'none', cursor: 'pointer',
          }} className="nt-serif">
            读 4 分钟 →
          </button>
        </div>
      </div>

      {/* Facts card */}
      <div className="nt-card nt-card-warm" style={{ margin: '0 16px 12px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 12 }}>
          今日数字
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {FACTS.map(f => (
            <div key={f.label} style={{ textAlign: 'center' }}>
              <div className="nt-display" style={{ fontSize: 28, color: 'var(--ink)' }}>{f.value}</div>
              <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.4 }}>{f.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Library */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          推荐书目
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BOOKS.map((b, i) => (
            <div
              key={i}
              className="nt-card"
              onClick={() => window.open(b.url, '_blank')}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
                borderLeft: `4px solid ${b.color}`, cursor: 'pointer',
              }}
            >
              <div style={{
                width: 36, height: 48, borderRadius: 4, background: b.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 18 }}>📖</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{b.title}</div>
                <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{b.desc}</div>
              </div>
              <span style={{ color: 'var(--ink-mute)', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className="nt-card nt-card-warm" style={{ margin: '0 16px 8px', padding: '16px 18px' }}>
        <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>
          有营养问题？
        </div>
        <p className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6, margin: '0 0 12px' }}>
          向 AI 营养师提问，基于你的饮食记录给出个性化建议。
        </p>
        <button style={{
          padding: '8px 20px', borderRadius: 999,
          background: 'var(--ink)', color: '#fff',
          fontSize: 13, border: 'none', cursor: 'pointer', width: '100%',
        }} className="nt-serif">
          💬 开始提问
        </button>
      </div>
    </div>
  );
}
