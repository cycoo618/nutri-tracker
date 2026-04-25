// ============================================
// Onboarding 页面 — 首次登录设置
// ============================================

import { useState, useCallback } from 'react';
import type {
  GoalType, ActivityLevel, Gender, BodyMetrics,
  UserProfile, CalorieTargetMode,
} from '../../types';
import { GOAL_LABELS, GOAL_DESCRIPTIONS, ACTIVITY_LEVELS } from '../../types';
import { calculateTargetCalories, calculateTDEE, FAT_LOSS_INTENSITY, type FatLossIntensity } from '../../config/nutrition';
import { GOAL_CONFIGS } from '../../config/goals';

/** 聚焦数字输入框时：选中内容 + 等键盘弹起后滚动到视口中央 */
function focusAndReveal(e: React.FocusEvent<HTMLInputElement>) {
  const el = e.target;
  setTimeout(() => {
    el.select();
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 350); // 350ms 足够 iOS 键盘完全弹出
}

interface OnboardingPageProps {
  displayName: string;
  onComplete: (data: Partial<UserProfile>) => Promise<void>;
}

type Step = 'goal' | 'body' | 'calories' | 'health_sync';

export function OnboardingPage({ displayName, onComplete }: OnboardingPageProps) {
  // --- 步骤 ---
  const [step, setStep] = useState<Step>('goal');

  // --- 目标 ---
  const [goal, setGoal] = useState<GoalType>('healthy_eating');
  const [fatLossIntensity, setFatLossIntensity] = useState<FatLossIntensity>('moderate');

  // --- 身体数据 ---
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('65');
  const [age, setAge] = useState('25');
  const [bodyFat, setBodyFat] = useState('');           // 可选
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');

  // --- 卡路里 ---
  const [calorieMode, setCalorieMode] = useState<CalorieTargetMode>('auto');
  const [manualCalories, setManualCalories] = useState('');

  // --- 健康数据同步（未来手机 App 开放） ---
  const [syncRead, setSyncRead] = useState(false);
  const [syncWrite, setSyncWrite] = useState(false);

  // --- UI 状态 ---
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);

  // 身体数据校验：性别已有默认值，身高体重必须合理
  const handleBodyNext = useCallback(() => {
    const h = Number(height);
    const w = Number(weight);
    if (!height || h < 50 || h > 250) {
      setBodyError('请输入有效的身高（50 – 250 cm）');
      return;
    }
    if (!weight || w < 20 || w > 300) {
      setBodyError('请输入有效的体重（20 – 300 kg）');
      return;
    }
    setBodyError(null);
    setStep('calories');
  }, [height, weight]);

  // --- 计算 ---
  const bodyMetrics: BodyMetrics = {
    height: Number(height) || 170,
    weight: Number(weight) || 65,
    age: Number(age) || 25,
    gender,
    activityLevel,
    bodyFat: bodyFat ? Number(bodyFat) : undefined,
  };

  const tdee = calculateTDEE(bodyMetrics);

  const effectiveAdjustment = goal === 'fat_loss'
    ? FAT_LOSS_INTENSITY[fatLossIntensity].adjustment
    : GOAL_CONFIGS[goal].calorieAdjustment;

  const autoCalories = calculateTargetCalories(bodyMetrics, effectiveAdjustment);

  const finalCalories = calorieMode === 'auto'
    ? autoCalories
    : Number(manualCalories) || autoCalories;

  const handleFinish = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onComplete({
        goal,
        bodyMetrics,
        targetCalories: finalCalories,
        targetCaloriesMode: calorieMode,
        healthSync: { readFromHealth: syncRead, writeToHealth: syncWrite },
        premiumEnabled: true,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存失败，请重试';
      setSaveError(msg);
      setSaving(false);
    }
  };

  const steps: Step[] = ['goal', 'body', 'calories', 'health_sync'];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-y-auto">
      <div className="w-full max-w-md mx-auto px-4 pt-10 pb-40">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'goal' && `你好，${displayName}！`}
            {step === 'body' && '身体数据'}
            {step === 'calories' && '每日卡路里目标'}
            {step === 'health_sync' && '健康数据同步'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 'goal' && '选择你的饮食目标'}
            {step === 'body' && '用于精准计算你的每日消耗'}
            {step === 'calories' && '根据你的数据智能推荐'}
            {step === 'health_sync' && '（可选）与手机健康数据打通'}
          </p>
        </div>

        {/* ===== Step: Goal ===== */}
        {step === 'goal' && (
          <div className="space-y-3">
            {(Object.keys(GOAL_LABELS) as GoalType[]).map(g => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  goal === g ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="font-semibold text-gray-900">{GOAL_LABELS[g]}</div>
                <div className="text-sm text-gray-500 mt-0.5">{GOAL_DESCRIPTIONS[g]}</div>
              </button>
            ))}

            {/* 减脂烈度 */}
            {goal === 'fat_loss' && (
              <div className="mt-2 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <div className="text-sm font-medium text-amber-800 mb-3">选择减脂节奏</div>
                <div className="space-y-2">
                  {(Object.entries(FAT_LOSS_INTENSITY) as [FatLossIntensity, typeof FAT_LOSS_INTENSITY[FatLossIntensity]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setFatLossIntensity(key)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        fatLossIntensity === key
                          ? 'border-amber-400 bg-white'
                          : 'border-transparent bg-white/60 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800">{val.label}</span>
                        <span className="text-xs text-gray-500">{val.adjustment} kcal/天</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{val.description}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-3 text-xs text-amber-700 bg-amber-100 rounded-lg p-2">
                  💡 研究表明温和缺口（200-400 kcal）更容易长期坚持，不易引发暴饮暴食反弹
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('body')}
              className="w-full mt-4 bg-green-600 text-white rounded-xl py-3.5 font-medium hover:bg-green-700 transition-colors"
            >
              下一步
            </button>
          </div>
        )}

        {/* ===== Step: Body Metrics ===== */}
        {step === 'body' && (
          <div className="space-y-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">性别</label>
              <div className="flex gap-3">
                {(['male', 'female'] as Gender[]).map(g => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-lg border-2 font-medium transition-all ${
                      gender === g ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    {g === 'male' ? '男' : '女'}
                  </button>
                ))}
              </div>
            </div>

            {/* Height / Weight / Age */}
            {[
              { label: '身高', value: height, onChange: setHeight, unit: 'cm', placeholder: '170', required: true },
              { label: '体重', value: weight, onChange: setWeight, unit: 'kg', placeholder: '65',  required: true },
              { label: '年龄', value: age,    onChange: setAge,    unit: '岁', placeholder: '25',  required: false },
            ].map(field => (
              <div key={field.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required
                    ? <span className="ml-1 text-red-500 text-xs">*</span>
                    : <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">可选</span>
                  }
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={field.value}
                    onChange={e => { field.onChange(e.target.value); setBodyError(null); }}
                    onFocus={focusAndReveal}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">{field.unit}</span>
                </div>
              </div>
            ))}

            {/* Body Fat — Optional */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                体脂率
                <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">可选</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={bodyFat}
                  onChange={e => setBodyFat(e.target.value)}
                  onFocus={focusAndReveal}
                  placeholder="如 20（填写后使用更精准的公式）"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
              </div>
              {bodyFat && (
                <p className="text-xs text-green-600 mt-1">✓ 将使用 Katch-McArdle 公式，基于瘦体重计算，更精准</p>
              )}
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">活动水平</label>
              <div className="space-y-2">
                {(Object.entries(ACTIVITY_LEVELS) as [ActivityLevel, typeof ACTIVITY_LEVELS[ActivityLevel]][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setActivityLevel(key)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      activityLevel === key ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className="font-medium text-gray-900 text-sm">{val.label}</span>
                    <span className="text-xs text-gray-500 ml-2">{val.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {bodyError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                ⚠ {bodyError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('goal')} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50">上一步</button>
              <button onClick={handleBodyNext} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700">下一步</button>
            </div>
          </div>
        )}

        {/* ===== Step: Calories ===== */}
        {step === 'calories' && (
          <div className="space-y-4">
            {/* TDEE + Target 说明卡片 */}
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between text-sm text-gray-500 mb-3">
                <span>你的每日消耗（TDEE）</span>
                <span className="font-medium text-gray-700">{tdee} kcal</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>
                  {goal === 'fat_loss' && `减脂缺口（${FAT_LOSS_INTENSITY[fatLossIntensity].label}）`}
                  {goal === 'muscle_gain' && '增肌盈余'}
                  {goal === 'healthy_eating' && '维持摄入'}
                </span>
                <span className={`font-medium ${effectiveAdjustment < 0 ? 'text-blue-600' : effectiveAdjustment > 0 ? 'text-orange-500' : 'text-gray-700'}`}>
                  {effectiveAdjustment > 0 ? '+' : ''}{effectiveAdjustment} kcal
                </span>
              </div>
              <div className="border-t border-gray-100 mt-3 pt-3 text-center">
                <div className="text-3xl font-bold text-green-600">{autoCalories}</div>
                <div className="text-sm text-gray-400">建议每日摄入（kcal）</div>
              </div>
            </div>

            {goal === 'fat_loss' && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                💡 此方案每周预计减重约 <strong>{(Math.abs(effectiveAdjustment) * 7 / 7700).toFixed(2)} kg</strong>，
                属于{FAT_LOSS_INTENSITY[fatLossIntensity].label}缺口，不易引发饥饿感和暴食反弹。
                如需调整节奏，可返回上一步修改。
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={() => setCalorieMode('auto')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${calorieMode === 'auto' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="font-medium text-gray-900">使用推荐值 · {autoCalories} kcal</div>
                <div className="text-sm text-gray-500">App 根据你的数据自动计算</div>
              </button>
              <button
                onClick={() => setCalorieMode('manual')}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${calorieMode === 'manual' ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}
              >
                <div className="font-medium text-gray-900">自己设定</div>
                <div className="text-sm text-gray-500">手动输入目标卡路里</div>
              </button>
            </div>

            {calorieMode === 'manual' && (
              <div className="relative">
                <input
                  type="number"
                  value={manualCalories}
                  onChange={e => setManualCalories(e.target.value)}
                  onFocus={focusAndReveal}
                  placeholder={String(autoCalories)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 pr-20 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">kcal/天</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('body')} className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50">上一步</button>
              <button onClick={() => setStep('health_sync')} className="flex-1 bg-green-600 text-white rounded-xl py-3 font-medium hover:bg-green-700">下一步</button>
            </div>
          </div>
        )}

        {/* ===== Step: Health Sync ===== */}
        {step === 'health_sync' && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📱</span>
                <span className="text-sm font-medium text-blue-800">手机 App 功能（即将推出）</span>
              </div>
              <p className="text-xs text-blue-700">以下功能需要手机 App 才能使用，网页版暂不支持。你可以提前设置偏好，手机 App 上线后自动生效。</p>
            </div>

            <div className="space-y-3">
              <SyncOption
                icon="🏃"
                title="从健康 App 读取运动数据"
                description="自动读取步数、运动消耗等，让卡路里计算更准确"
                enabled={syncRead}
                onChange={setSyncRead}
                comingSoon
              />
              <SyncOption
                icon="🥗"
                title="将饮食记录写入健康 App"
                description="把每日饮食的营养数据同步到 Apple 健康 / 微信运动"
                enabled={syncWrite}
                onChange={setSyncWrite}
                comingSoon
              />
            </div>

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 whitespace-pre-line">
                ❌ {saveError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('calories')}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                上一步
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 bg-green-600 text-white rounded-xl py-3.5 font-medium hover:bg-green-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : '开始使用 🎉'}
              </button>
            </div>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`rounded-full transition-all ${
                i === stepIndex ? 'w-6 h-2 bg-green-500' : 'w-2 h-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

      </div>
    </div>
  );
}

// 健康同步选项组件
function SyncOption({
  icon, title, description, enabled, onChange, comingSoon,
}: {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
  comingSoon?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border-2 transition-all ${
      comingSoon ? 'border-gray-100 bg-gray-50 opacity-75' : enabled ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <span className="text-xl">{icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{title}</span>
              {comingSoon && (
                <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">即将推出</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <button
          onClick={() => !comingSoon && onChange(!enabled)}
          disabled={comingSoon}
          className={`shrink-0 w-11 h-6 rounded-full transition-colors ${
            enabled && !comingSoon ? 'bg-green-500' : 'bg-gray-200'
          } disabled:cursor-not-allowed`}
        >
          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${
            enabled && !comingSoon ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </button>
      </div>
    </div>
  );
}
