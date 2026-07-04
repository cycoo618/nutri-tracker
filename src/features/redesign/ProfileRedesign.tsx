import React, { useState } from 'react';
import type { UserProfile } from '../../types/user';
import { GOAL_OPTIONS } from './tokens';
import { setFontSize as applyFontSize, getFontSize } from '../../utils/fontSize';
import { setLocale, getLocale } from '../../i18n';
import {
  getNotionSettings,
  saveNotionSettings,
  clearNotionSettings,
  notionTestConnection,
  type NotionSettings,
} from '../../services/notion';

interface ProfileRedesignProps {
  profile: UserProfile;
  onProfileUpdate: (updates: Partial<UserProfile>) => Promise<void>;
  onLogout: () => Promise<void>;
}

type FontSizeLabel = '小' | '标准' | '大';
type Lang = '中文' | 'EN';

const FONT_MAP: Record<FontSizeLabel, 'small' | 'standard' | 'large'> = { '小': 'small', '标准': 'standard', '大': 'large' };
const FONT_REVERSE: Record<string, FontSizeLabel> = { small: '小', standard: '标准', large: '大' };

export function ProfileRedesign({ profile, onProfileUpdate, onLogout }: ProfileRedesignProps) {
  const activeGoals: string[] = profile.goals?.length ? profile.goals : [profile.goal];
  const [goals, setGoals] = useState<string[]>(activeGoals);
  const [weight, setWeight] = useState(String(profile.bodyMetrics?.weight ?? ''));
  const [bodyFat, setBodyFat] = useState(String(profile.bodyMetrics?.bodyFat ?? ''));
  const [calTarget, setCalTarget] = useState(String(profile.targetCalories ?? 2000));
  const [fontSize, setFontSize] = useState<FontSizeLabel>(() => FONT_REVERSE[getFontSize()] ?? '标准');
  const [lang, setLang] = useState<Lang>(() => getLocale() === 'en' ? 'EN' : '中文');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nutri_dark') === '1');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(profile.displayName);
  const [saving, setSaving] = useState(false);

  // Notion settings
  const [notionSettings, setNotionSettings] = useState<NotionSettings>(() => {
    return getNotionSettings() ?? { workerUrl: '', token: '', databaseId: '' };
  });
  const [notionTesting, setNotionTesting] = useState(false);
  const [notionStatus, setNotionStatus] = useState<'idle' | 'ok' | 'error'>(() =>
    getNotionSettings() ? 'ok' : 'idle'
  );
  const [notionError, setNotionError] = useState('');

  const handleGoalClick = (key: string) => {
    let next: string[];
    if (goals[0] === key) {
      next = goals.slice(1);
    } else if (goals[1] === key) {
      next = [key, goals[0]].filter(Boolean);
    } else if (goals.length < 2) {
      next = [...goals, key];
    } else {
      next = [goals[0], key];
    }
    setGoals(next);
    onProfileUpdate({
      goals: next as UserProfile['goals'],
      goal: (next[0] ?? profile.goal) as UserProfile['goal'],
    }).catch(console.warn);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onProfileUpdate({
        goals: goals as UserProfile['goals'],
        goal: (goals[0] ?? profile.goal) as UserProfile['goal'],
        targetCalories: Number(calTarget) || profile.targetCalories,
        bodyMetrics: {
          ...profile.bodyMetrics,
          weight: Number(weight) || profile.bodyMetrics?.weight || 0,
          bodyFat: Number(bodyFat) || undefined,
          height: profile.bodyMetrics?.height || 170,
          age: profile.bodyMetrics?.age || 30,
          gender: profile.bodyMetrics?.gender || 'female',
          activityLevel: profile.bodyMetrics?.activityLevel || 'light',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const daysSince = profile.createdAt
    ? Math.max(1, Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000))
    : 1;

  const joinDate = profile.createdAt
    ? (() => {
        const d = new Date(profile.createdAt);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : null;

  const saveNameEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== profile.displayName) {
      onProfileUpdate({ displayName: trimmed }).catch(console.warn);
    }
    setIsEditingName(false);
  };

  return (
    <div style={{ padding: '8px 0 8px' }}>
      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'var(--paper-2)', border: '2px solid var(--line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0,
        }}>
          🥗
        </div>
        <div style={{ flex: 1 }}>
          {isEditingName ? (
            <input
              autoFocus
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveNameEdit(); if (e.key === 'Escape') { setIsEditingName(false); setEditName(profile.displayName); } }}
              style={{ fontSize: 22, fontFamily: 'ZCOOL QingKe HuangYou, Noto Serif SC, serif', color: 'var(--ink)', background: 'var(--paper-2)', border: '1px solid var(--line)', borderRadius: 8, padding: '2px 8px', width: '100%', outline: 'none' }}
            />
          ) : (
            <div className="nt-display" style={{ fontSize: 22, color: 'var(--ink)' }}>{profile.displayName}</div>
          )}
          <div className="nt-caveat" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
            {joinDate ? `since ${joinDate} · ` : ''}{daysSince} days strong
          </div>
        </div>
        <button
          onClick={isEditingName ? saveNameEdit : () => setIsEditingName(true)}
          style={{ padding: '5px 14px', borderRadius: 999, background: isEditingName ? 'var(--sage)' : 'var(--paper)', border: '1px solid var(--line-soft)', fontSize: 12, color: isEditingName ? '#fff' : 'var(--ink-soft)', cursor: 'pointer' }}
          className="nt-serif"
        >
          {isEditingName ? '保存' : '编辑'}
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 16px', marginBottom: 12 }}>
        {[
          { label: '连续记录', value: '23', unit: '天', color: 'var(--mustard)' },
          { label: '减重进度', value: '-1.2', unit: 'kg', color: 'var(--sage)' },
          { label: '抗炎分', value: '68', unit: '分', color: 'var(--ferm)' },
        ].map(s => (
          <div key={s.label} className="nt-card" style={{ padding: '12px 14px', textAlign: 'center' }}>
            <div className="nt-display" style={{ fontSize: 24, color: s.color }}>{s.value}<span style={{ fontSize: 12 }}>{s.unit}</span></div>
            <div className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Goal picker */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          健康目标
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GOAL_OPTIONS.map(g => {
            const isSelected = goals[0] === g.key || goals[1] === g.key;
            return (
              <div
                key={g.key}
                onClick={() => handleGoalClick(g.key)}
                className="nt-card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer',
                  borderColor: isSelected ? g.color : 'var(--line-soft)',
                  borderWidth: isSelected ? 1.5 : 1,
                  background: isSelected ? g.color + '08' : 'var(--card)',
                }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{g.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{g.name}</div>
                  <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-soft)', lineHeight: 1.5 }}>{g.desc}</div>
                </div>
                {isSelected && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Body data */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>身体数据</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          {[
            { label: '体重 (kg)', value: weight, setter: setWeight, placeholder: '72.0' },
            { label: '体脂率 (%)', value: bodyFat, setter: setBodyFat, placeholder: '22.0' },
          ].map(f => (
            <div key={f.label} className="nt-card" style={{ padding: '12px 14px' }}>
              <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>{f.label}</div>
              <input
                type="text" inputMode="decimal"
                value={f.value}
                onChange={e => f.setter(e.target.value)}
                placeholder={f.placeholder}
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  fontSize: 20, fontFamily: 'ZCOOL QingKe HuangYou, Noto Serif SC, serif',
                  color: 'var(--ink)', background: 'transparent',
                }}
              />
            </div>
          ))}
        </div>
        <div className="nt-card" style={{ padding: '12px 16px' }}>
          <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>热量目标 (kcal)</div>
          <input
            type="text" inputMode="decimal"
            value={calTarget}
            onChange={e => setCalTarget(e.target.value)}
            style={{
              width: '100%', border: 'none', outline: 'none',
              fontSize: 24, fontFamily: 'ZCOOL QingKe HuangYou, Noto Serif SC, serif',
              color: 'var(--tomato)', background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Preferences */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>偏好设置</div>
        <div className="nt-card" style={{ padding: '0' }}>
          {/* Font size */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--line-soft)' }}>
            <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink)' }}>字体大小</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['小', '标准', '大'] as FontSizeLabel[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setFontSize(f); applyFontSize(FONT_MAP[f]); }}
                  className="nt-serif"
                  style={{
                    padding: '4px 10px', borderRadius: 999,
                    background: fontSize === f ? 'var(--ink)' : 'transparent',
                    color: fontSize === f ? '#fff' : 'var(--ink-mute)',
                    border: '1px solid var(--line-soft)', fontSize: 11, cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {/* Language */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line-soft)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink)' }}>语言</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {(['中文', 'EN'] as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLocale(l === 'EN' ? 'en' : 'zh'); }}
                    className="nt-serif"
                    style={{
                      padding: '4px 10px', borderRadius: 999,
                      background: lang === l ? 'var(--ink)' : 'transparent',
                      color: lang === l ? '#fff' : 'var(--ink-mute)',
                      border: '1px solid var(--line-soft)', fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {lang === 'EN' && (
              <p className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)', margin: '6px 0 0' }}>
                Food search & log screens will display in English. Main screens stay in Chinese.
              </p>
            )}
          </div>
          {/* Dark mode */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
            <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink)' }}>深色模式</span>
            <div
              onClick={() => {
                const next = !darkMode;
                setDarkMode(next);
                if (next) { document.documentElement.classList.add('dark'); localStorage.setItem('nutri_dark', '1'); }
                else { document.documentElement.classList.remove('dark'); localStorage.setItem('nutri_dark', '0'); }
              }}
              style={{
                width: 44, height: 24, borderRadius: 999,
                background: darkMode ? 'var(--ink)' : 'var(--line-soft)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: darkMode ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Notion Sync */}
      <div style={{ padding: '0 16px', marginBottom: 12 }}>
        <div className="nt-serif" style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
          Notion 同步
          {notionStatus === 'ok' && (
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--sage)', fontWeight: 400 }}>● 已连接</span>
          )}
        </div>
        <div className="nt-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="nt-serif" style={{ fontSize: 12, color: 'var(--ink-mute)', margin: 0, lineHeight: 1.5 }}>
            每次记录食物自动同步到你的 Notion 数据库，每条食物单独一行，包含全部营养数据。
          </p>

          {/* Worker URL */}
          <div>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>Cloudflare Worker URL</div>
            <input
              type="url"
              value={notionSettings.workerUrl}
              onChange={e => setNotionSettings(s => ({ ...s, workerUrl: e.target.value }))}
              placeholder="https://notion-proxy.xxx.workers.dev"
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '1px solid var(--line-soft)', background: 'var(--paper-2)',
                fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--ink)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Token */}
          <div>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>Integration Token</div>
            <input
              type="password"
              value={notionSettings.token}
              onChange={e => setNotionSettings(s => ({ ...s, token: e.target.value }))}
              placeholder="secret_xxxxxxxxxxxxxxxx"
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '1px solid var(--line-soft)', background: 'var(--paper-2)',
                fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--ink)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Database ID */}
          <div>
            <div className="nt-serif" style={{ fontSize: 11, color: 'var(--ink-mute)', marginBottom: 4 }}>Database ID</div>
            <input
              type="text"
              value={notionSettings.databaseId}
              onChange={e => setNotionSettings(s => ({ ...s, databaseId: e.target.value.replace(/-/g, '') }))}
              placeholder="32位数据库 ID"
              style={{
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: '1px solid var(--line-soft)', background: 'var(--paper-2)',
                fontSize: 12, fontFamily: 'ui-monospace, monospace', color: 'var(--ink)',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {notionError && (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--tomato)' }}>{notionError}</p>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              disabled={notionTesting || !notionSettings.workerUrl || !notionSettings.token || !notionSettings.databaseId}
              onClick={async () => {
                setNotionTesting(true);
                setNotionError('');
                const err = await notionTestConnection(notionSettings);
                if (err) {
                  setNotionStatus('error');
                  setNotionError(err);
                } else {
                  saveNotionSettings(notionSettings);
                  setNotionStatus('ok');
                }
                setNotionTesting(false);
              }}
              className="nt-serif"
              style={{
                flex: 1, padding: '8px', borderRadius: 10,
                background: notionStatus === 'ok' ? 'var(--sage)' : 'var(--ink)',
                color: '#fff', border: 'none', fontSize: 12,
                cursor: notionTesting ? 'default' : 'pointer',
                opacity: (notionTesting || !notionSettings.workerUrl) ? 0.5 : 1,
              }}
            >
              {notionTesting ? '连接中…' : notionStatus === 'ok' ? '✓ 已连接' : '测试并保存'}
            </button>
            {notionStatus === 'ok' && (
              <button
                onClick={() => {
                  clearNotionSettings();
                  setNotionSettings({ workerUrl: '', token: '', databaseId: '' });
                  setNotionStatus('idle');
                }}
                className="nt-serif"
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  background: 'transparent', color: 'var(--tomato)',
                  border: '1px solid var(--line-soft)', fontSize: 12, cursor: 'pointer',
                }}
              >
                断开
              </button>
            )}
          </div>

          <p className="nt-serif" style={{ fontSize: 10, color: 'var(--ink-faint)', margin: 0, lineHeight: 1.6 }}>
            需要先在 Cloudflare 部署 Worker（代码在项目 cloudflare-worker/ 目录），然后在 Notion 创建 Integration 并分享数据库。
          </p>
        </div>
      </div>

      {/* More links */}
      <div style={{ padding: '0 16px', marginBottom: 16 }}>
        <div className="nt-card" style={{ padding: '0' }}>
          {['🔔 通知设置', '🔒 隐私与数据', '❓ 帮助与反馈', '⭐ 给我们评分'].map((link, i, arr) => (
            <div
              key={link}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '13px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
                cursor: 'pointer',
              }}
            >
              <span className="nt-serif" style={{ fontSize: 13, color: 'var(--ink)' }}>{link}</span>
              <span style={{ color: 'var(--ink-mute)', fontSize: 16 }}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save + logout */}
      <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <button
          onClick={handleSave}
          onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); if (!saving) handleSave(); }}
          disabled={saving}
          className="nt-serif"
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            background: 'var(--ink)', color: '#fff',
            fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '保存中…' : '保存设置'}
        </button>
        <button
          onClick={onLogout}
          className="nt-caveat"
          style={{
            background: 'none', border: 'none',
            fontSize: 16, color: 'var(--tomato)', cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          登出
        </button>
      </div>
    </div>
  );
}
