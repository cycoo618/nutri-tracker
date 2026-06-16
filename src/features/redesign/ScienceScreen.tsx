import React, { useState } from 'react';
import { THESIS_ARTICLES } from '../../data/scienceArticlesThesis';
import { getTodayString } from '../../utils/calculator';
import type { ScienceArticle } from '../../data/scienceArticles';

// ── 每日文章选取（基于日期轮播） ──────────────────────────────────
function getTodayArticle(): ScienceArticle {
  const today = getTodayString(); // YYYY-MM-DD
  // 用日期算天序号，对 50 取模
  const [y, m, d] = today.split('-').map(Number);
  const epoch = new Date(y, m - 1, d);
  const day = Math.floor(epoch.getTime() / 86400000);
  return THESIS_ARTICLES[day % THESIS_ARTICLES.length];
}

// ── 文章详情全屏阅读组件 ───────────────────────────────────────
function ArticleReader({ article, onClose }: { article: ScienceArticle; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 200,
      overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, background: 'var(--paper)',
        borderBottom: '1px solid var(--line-soft)',
        padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, zIndex: 1,
      }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--ink)', padding: 0 }}
        >
          ←
        </button>
        <span className="nt-chip" style={{
          background: 'rgba(79,166,99,0.12)', borderColor: 'rgba(79,166,99,0.25)', color: 'var(--sage)',
        }}>
          {article.tag}
        </span>
        <span className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)', marginLeft: 'auto' }}>
          {article.readMinutes} 分钟
        </span>
      </div>

      {/* Article body */}
      <div style={{ padding: '20px 22px 48px', maxWidth: 640, margin: '0 auto' }}>
        <h1 className="nt-display" style={{ fontSize: 24, color: 'var(--ink)', lineHeight: 1.35, marginBottom: 16 }}>
          {article.title.zh}
        </h1>
        <p className="nt-serif" style={{ fontSize: 14, color: 'var(--sage)', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>
          {article.summary.zh}
        </p>
        <hr style={{ border: 'none', borderTop: '1px solid var(--line-soft)', marginBottom: 20 }} />

        {article.body.map((para, i) => {
          const text = para.zh;
          // Bold headers: **xxx** at start
          const parts = text.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={i} className="nt-serif" style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.8, marginBottom: 18, whiteSpace: 'pre-wrap' }}>
              {parts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} style={{ color: 'var(--ink)', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
                }
                return <span key={j}>{part}</span>;
              })}
            </div>
          );
        })}

        <div style={{
          marginTop: 24, padding: '12px 16px',
          background: 'var(--paper-2)', borderRadius: 10,
          borderLeft: '3px solid var(--sage)',
        }}>
          <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            📚 来源：{article.source}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 文章列表（近 7 篇） ────────────────────────────────────────
function getRecentArticles(count = 7): ScienceArticle[] {
  const today = getTodayString();
  const [y, m, d] = today.split('-').map(Number);
  const epoch = new Date(y, m - 1, d);
  const day = Math.floor(epoch.getTime() / 86400000);
  const articles = [];
  for (let i = 1; i <= count; i++) {
    articles.push(THESIS_ARTICLES[(day - i + THESIS_ARTICLES.length * 10) % THESIS_ARTICLES.length]);
  }
  return articles;
}

// ── 卡片背景渐变（按 tag 分类） ────────────────────────────────
const TAG_GRADIENTS: Record<string, string> = {
  '地中海饮食': 'linear-gradient(135deg, #4fa64a 0%, #2d9cdb 100%)',
  '植物性饮食': 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
  '运动长寿':   'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  '力量训练':   'linear-gradient(135deg, #e96c5a 0%, #f7971e 100%)',
  '睡眠健康':   'linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)',
  '昼夜节律':   'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)',
  '肠道菌群':   'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  '间歇性禁食': 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
  '限时进食':   'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
  '热量限制':   'linear-gradient(135deg, #f953c6 0%, #b91d73 100%)',
  '蓝区长寿':   'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
  '自噬机制':   'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
  'Omega-3':   'linear-gradient(135deg, #1a6dff 0%, #00cfff 100%)',
  '多酚抗炎':   'linear-gradient(135deg, #7b4397 0%, #dc2430 100%)',
  '生物年龄':   'linear-gradient(135deg, #005c97 0%, #363795 100%)',
  'GLP-1':     'linear-gradient(135deg, #f46b45 0%, #eea849 100%)',
};
const DEFAULT_GRAD = 'linear-gradient(135deg, var(--sage) 0%, var(--sky) 100%)';
const TAG_EMOJI: Record<string, string> = {
  '地中海饮食': '🫒', '植物性饮食': '🥦', '运动长寿': '🏃', '力量训练': '💪',
  '睡眠健康': '😴', '昼夜节律': '🌙', '肠道菌群': '🦠', '间歇性禁食': '⏰',
  '限时进食': '⏰', '热量限制': '🍽️', '蓝区长寿': '🌍', '自噬机制': '♻️',
  'Omega-3': '🐟', '多酚抗炎': '🍇', '多酚与菌群': '🍇', '生物年龄': '🧬',
  'GLP-1': '💉', '抗衰老药物': '💊', '清衰老细胞': '🔬', '清衰老药物': '🔬',
  '压力与衰老': '🧠', '饮食机制': '⚗️', '长寿基因': '🧬', '长寿遗传学': '🧬',
  '社交与健康': '👫', '运动多样性': '🤸', '运动营养': '🥗', '女性健康': '🌸',
  '进食时机': '🕐', '乌石鞣花素': '🫐', '饮食与癌症': '🔬',
};

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

export function ScienceScreen() {
  const [readingArticle, setReadingArticle] = useState<ScienceArticle | null>(null);
  const todayArticle = getTodayArticle();
  const recentArticles = getRecentArticles(6);

  if (readingArticle) {
    return <ArticleReader article={readingArticle} onClose={() => setReadingArticle(null)} />;
  }

  const grad = TAG_GRADIENTS[todayArticle.tag] ?? DEFAULT_GRAD;
  const emoji = TAG_EMOJI[todayArticle.tag] ?? '🔬';

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Header */}
      <div style={{ padding: '8px 22px 16px' }}>
        <div className="nt-display" style={{ fontSize: 32, color: 'var(--ink)' }}>科学室</div>
        <div className="nt-caveat" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>
          eat smarter, live longer
        </div>
      </div>

      {/* Today's article card */}
      <div
        className="nt-card"
        style={{ margin: '0 16px 12px', overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => setReadingArticle(todayArticle)}
      >
        <div style={{
          height: 130, width: '100%', background: grad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 52 }}>{emoji}</span>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <span className="nt-chip" style={{ background: 'rgba(79,166,99,0.12)', borderColor: 'rgba(79,166,99,0.25)', color: 'var(--sage)' }}>
              今日精读
            </span>
            <span className="nt-chip" style={{ background: 'var(--paper-2)', borderColor: 'var(--line-soft)', color: 'var(--ink-mute)' }}>
              {todayArticle.tag}
            </span>
          </div>
          <div className="nt-display" style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.35 }}>
            {todayArticle.title.zh}
          </div>
          <p className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '0 0 12px' }}>
            {todayArticle.summary.zh.slice(0, 120)}…
          </p>
          <button
            onClick={e => { e.stopPropagation(); setReadingArticle(todayArticle); }}
            onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); setReadingArticle(todayArticle); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 999,
              background: 'var(--ink)', color: '#fff',
              fontSize: 13, border: 'none', cursor: 'pointer',
            }}
            className="nt-serif"
          >
            读 {todayArticle.readMinutes} 分钟 →
          </button>
        </div>
      </div>

      {/* Recent articles */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 10 }}>
          往期精读
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {recentArticles.map((a, i) => {
            const g = TAG_GRADIENTS[a.tag] ?? DEFAULT_GRAD;
            const em = TAG_EMOJI[a.tag] ?? '🔬';
            return (
              <div
                key={a.id + i}
                className="nt-card"
                onClick={() => setReadingArticle(a)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: g, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                  {em}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="nt-serif" style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                    {a.title.zh}
                  </div>
                  <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                    {a.tag} · {a.readMinutes} 分钟
                  </div>
                </div>
                <span style={{ color: 'var(--ink-mute)', fontSize: 16, flexShrink: 0 }}>›</span>
              </div>
            );
          })}
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
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderLeft: `4px solid ${b.color}`, cursor: 'pointer' }}
            >
              <div style={{ width: 36, height: 48, borderRadius: 4, background: b.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
    </div>
  );
}
