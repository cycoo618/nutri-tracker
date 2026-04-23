// ============================================
// 我的数据 — 编辑目标、体重、体脂
// ============================================

import { useState } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import type { UserProfile, GoalType } from '../../types/user';
import { GOAL_LABELS, GOAL_DESCRIPTIONS } from '../../types/user';
import { autoSelect } from '../../utils/inputHelpers';

interface Props {
  profile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  onClose: () => void;
}

const GOALS: GoalType[] = ['fat_loss', 'muscle_gain', 'healthy_eating', 'blood_sugar'];

export function ProfileEditorModal({ profile, onSave, onClose }: Props) {
  const [goal, setGoal] = useState<GoalType>(profile.goal);
  const [weight, setWeight] = useState(String(profile.bodyMetrics?.weight ?? ''));
  const [bodyFat, setBodyFat] = useState(String(profile.bodyMetrics?.bodyFat ?? ''));
  const [targetCal, setTargetCal] = useState(String(profile.targetCalories));
  const [saving, setSaving] = useState(false);
  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  const handleSave = async () => {
    setSaving(true);
    const updates: Partial<UserProfile> = {
      goal,
      targetCalories: Number(targetCal) || profile.targetCalories,
      targetCaloriesMode: 'manual',
      bodyMetrics: {
        ...(profile.bodyMetrics ?? { height: 170, age: 30, gender: 'female', activityLevel: 'moderate' }),
        weight: Number(weight) || (profile.bodyMetrics?.weight ?? 60),
        bodyFat: bodyFat ? Number(bodyFat) : undefined,
      },
    };
    await onSave(updates);
    setSaving(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
      style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}
      onClick={onClose}
    >
      <div
        ref={cardRef}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col"
        style={{ maxHeight: 'var(--vvh, 92vh)' }}
        onClick={e => e.stopPropagation()}
        {...cardDragHandlers}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab" style={{ touchAction: 'none' }} {...dragHandlers}>
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="w-10" />
          <h3 className="font-semibold text-gray-900">我的数据</h3>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm font-semibold text-green-600 hover:text-green-700 disabled:text-gray-300"
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">

          {/* 目标 */}
          <section>
            <div className="text-sm font-medium text-gray-700 mb-3">我的目标</div>
            <div className="space-y-2">
              {GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    goal === g
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{GOAL_LABELS[g]}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{GOAL_DESCRIPTIONS[g]}</div>
                </button>
              ))}
            </div>
          </section>

          {/* 身体数据 */}
          <section>
            <div className="text-sm font-medium text-gray-700 mb-3">身体数据</div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">体重 (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  onFocus={autoSelect}
                  placeholder="例：65"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">体脂率 (%) <span className="text-gray-300">可选</span></label>
                <input
                  type="number"
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  onFocus={autoSelect}
                  placeholder="例：22"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </section>

          {/* 热量目标 */}
          <section>
            <div className="text-sm font-medium text-gray-700 mb-3">每日热量目标</div>
            <div className="relative">
              <input
                type="number"
                value={targetCal}
                onChange={e => setTargetCal(e.target.value)}
                onFocus={autoSelect}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kcal</span>
            </div>
          </section>
        </div>

        <BottomReturnButton onClick={onClose} />
      </div>
    </div>
  );
}
