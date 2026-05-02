// ============================================
// 家庭共享页面 — 创建/加入/管理家庭
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { createFamily, joinFamilyByCode, getFamily, leaveFamily } from '../../services/firestore';
import { updateUserProfile } from '../../services/firestore';
import type { Family } from '../../types/family';
import { useLocale } from '../../i18n/useLocale';
import { autoSelect } from '../../utils/inputHelpers';

interface FamilyPageProps {
  userId: string;
  userName: string;
  familyId?: string;
  onFamilyChange: (familyId: string | undefined) => void;
  onClose: () => void;
}

type Mode = 'home' | 'create' | 'join';

export function FamilyPage({ userId, userName, familyId, onFamilyChange, onClose }: FamilyPageProps) {
  const { t } = useLocale();
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('home');

  // 创建表单
  const [familyName, setFamilyName] = useState('');
  const [newCode, setNewCode] = useState<string | null>(null);

  // 加入表单
  const [inviteInput, setInviteInput] = useState('');

  // 退出确认
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // 加载已有家庭数据
  const loadFamily = useCallback(async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getFamily(familyId);
      setFamily(data);
    } catch {
      setError(t('loadFamilyError'));
    } finally {
      setLoading(false);
    }
  }, [familyId]);

  useEffect(() => {
    loadFamily();
  }, [loadFamily]);

  // ── 创建家庭 ──────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!familyName.trim()) {
      setError(t('familyNameRequired'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fid = await createFamily(userId, userName, familyName.trim());
      const data = await getFamily(fid);
      setFamily(data);
      setNewCode(data?.inviteCode ?? null);
      onFamilyChange(fid);
      setMode('home');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('createFamilyError'));
    } finally {
      setLoading(false);
    }
  };

  // ── 加入家庭 ──────────────────────────────────────────────────────
  const handleJoin = async () => {
    if (inviteInput.trim().length < 6) {
      setError(t('inviteCodeMinLength'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fid = await joinFamilyByCode(userId, userName, inviteInput.trim());
      await updateUserProfile(userId, { familyId: fid });
      const data = await getFamily(fid);
      setFamily(data);
      onFamilyChange(fid);
      setMode('home');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('joinFamilyError'));
    } finally {
      setLoading(false);
    }
  };

  // ── 退出家庭 ──────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!familyId) return;
    setLoading(true);
    setError(null);
    try {
      await leaveFamily(userId, familyId);
      setFamily(null);
      setNewCode(null);
      setShowLeaveConfirm(false);
      onFamilyChange(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('leaveFamilyError'));
    } finally {
      setLoading(false);
    }
  };

  // ── 复制邀请码 ───────────────────────────────────────────────────
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }).catch((e) => { console.warn('[FamilyPage] clipboard copy failed:', e); });
  };

  // ── 获取头像首字 ───────────────────────────────────────────────────
  const getInitial = (name: string) => name.trim().charAt(0).toUpperCase() || '?';

  return (
    <div
      className="fixed inset-x-0 bg-gray-50 z-40 flex flex-col"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
    >
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-12 shrink-0" />
          <h1 className="flex-1 text-center font-semibold text-gray-900">
            {mode === 'create' ? t('familyCreateTitle') : mode === 'join' ? t('familyJoinTitle') : t('familyPageTitle')}
          </h1>
          <div className="w-12 shrink-0" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-6 space-y-4">

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 加载中 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <span className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && (
          <>
            {/* ── 无家庭 · 首页 ── */}
            {!family && mode === 'home' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
                  <div className="text-5xl mb-3">👨‍👩‍👧</div>
                  <h2 className="font-semibold text-gray-900 mb-1">{t('familyPageTitle')}</h2>
                  <p className="text-sm text-gray-400">
                    {t('familySharingDesc')}
                  </p>
                </div>
                <button
                  onClick={() => { setMode('create'); setError(null); }}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-sm transition-colors shadow-sm"
                >
                  {t('familyCreateTitle')}
                </button>
                <button
                  onClick={() => { setMode('join'); setError(null); }}
                  className="w-full py-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-2xl font-semibold text-sm transition-colors"
                >
                  {t('joinFamilyWithCode')}
                </button>
              </div>
            )}

            {/* ── 创建家庭表单 ── */}
            {mode === 'create' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('familyNameLabel')}</label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={e => setFamilyName(e.target.value)}
                      onFocus={autoSelect}
                      placeholder={t('familyNamePlaceholder')}
                      maxLength={20}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-100"
                    />
                  </div>
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={handleCreate}
                    disabled={!familyName.trim()}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    {t('createBtn')}
                  </button>
                </div>
              </div>
            )}

            {/* ── 加入家庭表单 ── */}
            {mode === 'join' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('inviteCodeLabel')}</label>
                    <input
                      type="text"
                      value={inviteInput}
                      onChange={e => setInviteInput(e.target.value.toUpperCase())}
                      onFocus={autoSelect}
                      placeholder={t('inviteCodePlaceholder')}
                      maxLength={6}
                      className="w-full bg-gray-50 rounded-xl px-4 py-3 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-100"
                    />
                  </div>
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={handleJoin}
                    disabled={inviteInput.trim().length < 6}
                    className="w-full py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
                  >
                    {t('joinBtn')}
                  </button>
                </div>
              </div>
            )}

            {/* ── 已有家庭 ── */}
            {family && mode === 'home' && (
              <div className="space-y-4">
                {/* 刚创建时突出显示邀请码 */}
                {newCode && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                    <div className="text-green-600 font-semibold mb-1 text-sm">{t('familyCreatedMsg')}</div>
                    <div className="text-3xl font-bold font-mono tracking-widest text-green-700 my-3">{newCode}</div>
                    <button
                      onClick={() => handleCopyCode(newCode)}
                      className="text-xs text-green-600 underline"
                    >
                      {codeCopied ? t('copied') : t('tapToCopy')}
                    </button>
                  </div>
                )}

                {/* 家庭信息卡 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 mb-0.5">{t('familyNameLabel')}</div>
                      <div className="font-semibold text-gray-900 text-lg">{family.name}</div>
                    </div>
                    <span className="text-3xl">👨‍👩‍👧</span>
                  </div>

                  {/* 邀请码 */}
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">{t('inviteCodeLabel')}</div>
                      <div className="font-mono font-bold text-xl tracking-widest text-gray-800">{family.inviteCode}</div>
                    </div>
                    <button
                      onClick={() => handleCopyCode(family.inviteCode)}
                      className="ml-3 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded-xl transition-colors"
                    >
                      {codeCopied ? t('copied') : t('copy')}
                    </button>
                  </div>
                </div>

                {/* 成员列表 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    {t('tagFamily')}（{family.members.length}）
                  </div>
                  <div className="space-y-3">
                    {family.members.map(member => (
                      <div key={member.uid} className="flex items-center gap-3">
                        {member.photoURL ? (
                          <img
                            src={member.photoURL}
                            alt={member.displayName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {getInitial(member.displayName)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{member.displayName}</div>
                          {member.uid === family.createdBy && (
                            <div className="text-xs text-gray-400">{t('familyCreator')}</div>
                          )}
                        </div>
                        {member.uid === userId && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{t('you')}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 退出按钮 */}
                {!showLeaveConfirm ? (
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="w-full py-3.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-2xl text-sm font-medium transition-colors"
                  >
                    {t('leaveFamily')}
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center space-y-3">
                    <p className="text-sm text-red-600 font-medium">{t('confirmLeaveTitle')}</p>
                    <p className="text-xs text-gray-500">
                      {t('leaveFamilyNote')}{family.members.length === 1 ? t('leaveFamilyLastMember') : ''}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowLeaveConfirm(false)}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                      >
                        {t('cancel')}
                      </button>
                      <button
                        onClick={handleLeave}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        {t('confirmLeaveBtn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 底部返回按钮 */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-100 max-w-lg mx-auto w-full">
        <button
          onClick={mode === 'home' ? onClose : () => { setMode('home'); setError(null); }}
          className="w-full py-3.5 rounded-2xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-300 text-gray-600 font-medium transition-colors"
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}
