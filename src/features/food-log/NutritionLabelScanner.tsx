// ============================================
// 营养标签扫描组件
// 拍照 / 上传 → Claude Vision 识别 → 确认保存
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { autoSelect } from '../../utils/inputHelpers';
import type { FoodItem } from '../../types/food';
import { saveCustomFood, recordToFoodItem } from '../../utils/customFoods';
import { saveUserFood, getFamilyGroqKey, saveFamilyGroqKey } from '../../services/firestore';
import { getGroqKey, saveGroqKey, isKeyFromEnv } from '../../services/nutrition-vision';
import { useLocale } from '../../i18n/useLocale';
import { localizeUnit } from '../../utils/servingLabels';
import { compressImage } from '../../utils/imageUtils';

// ── 外部分析函数的接口定义 ──────────────────

export interface ExtractedNutrition {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminB1?: number;
  vitaminB2?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  magnesium?: number;
  zinc?: number;
  omega3?: number;
  servingLabel?: string;
  servingGrams?: number;
}

// 由 src/services/nutrition-vision.ts 实现
declare function analyzeNutritionLabel(imageBase64: string): Promise<ExtractedNutrition>;

// ── 类型 ────────────────────────────────────

type Step = 'setup' | 'capture' | 'analyzing' | 'confirm' | 'error';

interface Field {
  key: keyof ExtractedNutrition;
  label: string;
  unit: string;
  type: 'text' | 'number';
}

// NUTRIENT_FIELDS labels are computed inside the component using t() for i18n
const NUTRIENT_FIELD_DEFS: Omit<Field, 'label'>[] = [
  { key: 'calories',     unit: 'kcal', type: 'number' },
  { key: 'protein',      unit: 'g',    type: 'number' },
  { key: 'carbs',        unit: 'g',    type: 'number' },
  { key: 'fat',          unit: 'g',    type: 'number' },
  { key: 'fiber',        unit: 'g',    type: 'number' },
  { key: 'sugar',        unit: 'g',    type: 'number' },
  { key: 'saturatedFat', unit: 'g',    type: 'number' },
  { key: 'sodium',       unit: 'mg',   type: 'number' },
  { key: 'calcium',      unit: 'mg',   type: 'number' },
  { key: 'iron',         unit: 'mg',   type: 'number' },
  { key: 'potassium',    unit: 'mg',   type: 'number' },
  { key: 'vitaminC',     unit: 'mg',   type: 'number' },
];

// ── Props ───────────────────────────────────

interface NutritionLabelScannerProps {
  onSaved: (food: FoodItem) => void;
  onClose: () => void;
  userId?: string;
  familyId?: string;
}

// ── Component ───────────────────────────────

export function NutritionLabelScanner({ onSaved, onClose, userId, familyId }: NutritionLabelScannerProps) {
  const { t, locale } = useLocale();
  // Build localized nutrient fields
  const NUTRIENT_FIELDS: Field[] = NUTRIENT_FIELD_DEFS.map(f => ({ ...f, label: t(f.key) }));

  const [step, setStep]               = useState<Step>(() => getGroqKey() ? 'capture' : 'setup');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [extracted, setExtracted]     = useState<ExtractedNutrition | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [keyInput, setKeyInput]       = useState('');
  const keyInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  // 如果本地没有 key，尝试从家庭文档获取
  useEffect(() => {
    if (getGroqKey() || !familyId) return;
    getFamilyGroqKey(familyId).then(key => {
      if (key) {
        saveGroqKey(key);
        setStep('capture');
      }
    }).catch(() => {});
  }, [familyId]);


  // ── 图片选择处理 ──────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);

      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setStep('analyzing');

      // 压缩缩略图和 AI 识别并行进行
      compressImage(dataUrl).then(setCompressedImage);

      try {
        const { analyzeNutritionLabel: analyze } = await import('../../services/nutrition-vision');
        const result = await analyze(base64);
        setExtracted(result);
        setStep('confirm');
      } catch (err) {
        console.warn('Label analysis failed:', err);
        setErrorMsg(err instanceof Error ? err.message : t('recognitionFailedNote'));
        setStep('error');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  // ── 保存 API Key ─────────────────────────

  const handleSaveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    saveGroqKey(k);
    if (familyId) saveFamilyGroqKey(familyId, k).catch(() => {});
    setKeyInput('');
    setStep('capture');
  };

  // ── 重新拍摄 ─────────────────────────────

  const reset = () => {
    setStep('capture');
    setImageBase64(null);
    setImagePreview(null);
    setCompressedImage(null);
    setExtracted(null);
    setErrorMsg(null);
  };

  // ── 字段编辑 ─────────────────────────────

  const updateField = (key: keyof ExtractedNutrition, value: string) => {
    if (!extracted) return;
    const isText = key === 'name' || key === 'servingLabel';
    const isRequired = ['calories','protein','carbs','fat','fiber','sodium'].includes(key as string);
    let parsed: string | number | undefined;
    if (isText) {
      parsed = value;
    } else if (value === '') {
      parsed = isRequired ? 0 : undefined;
    } else {
      parsed = parseFloat(value) || 0;
    }
    setExtracted({ ...extracted, [key]: parsed });
  };

  // ── 保存到食物库 ─────────────────────────

  const handleSave = async () => {
    if (!extracted) return;
    setSaving(true);
    try {
      const record = saveCustomFood({
        name: extracted.name || '扫描食物',
        pantrySource: 'scanned',
        ingredients: [],
        totalGrams: 100,
        per100g: {
          calories:     extracted.calories,
          protein:      extracted.protein,
          carbs:        extracted.carbs,
          fat:          extracted.fat,
          fiber:        extracted.fiber,
          sodium:       extracted.sodium     || undefined,
          sugar:        extracted.sugar      ?? undefined,
          saturatedFat: extracted.saturatedFat ?? undefined,
          calcium:      extracted.calcium    ?? undefined,
          iron:         extracted.iron       ?? undefined,
          potassium:    extracted.potassium  ?? undefined,
          vitaminC:     extracted.vitaminC   ?? undefined,
          omega3:       extracted.omega3     ?? undefined,
        },
        servingSizes:
          extracted.servingLabel && extracted.servingGrams
            ? [{ label: extracted.servingLabel, grams: extracted.servingGrams }]
            : [],
        imageDataUrl: compressedImage ?? undefined,
      });
      // 同步到 Firestore，跨设备可用
      if (userId) {
        const { imageDataUrl: _img, ...recordForCloud } = record;
        saveUserFood(userId, recordForCloud, familyId).catch(() => {});
      }
      const foodItem = recordToFoodItem(record);
      onSaved(foodItem);
    } catch (err) {
      console.warn('Save failed:', err);
      setErrorMsg(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────

  return (
    <div className="fixed inset-x-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }} onClick={onClose}>
      <div ref={cardRef} className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ maxHeight: 'var(--vvh, 92vh)' }} onClick={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()} onTouchEnd={e => e.stopPropagation()}>

        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-center px-4 pb-3 border-b border-gray-100 shrink-0">
          <span className="text-xl mr-2">📷</span>
          <span className="font-semibold text-gray-800">{t('scanNutritionLabel')}</span>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">

          {/* ── Step 0: Setup API Key ── */}
          {step === 'setup' && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-3">🔑</div>
                <p className="font-medium text-gray-800 mb-1">{t('setupGroqKey')}</p>
                <p className="text-sm text-gray-500">
                  {locale === 'zh' ? '免费获取：前往' : 'Get for free: visit'}{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    console.groq.com
                  </a>
                  {locale === 'zh' ? ' 注册后创建 API Key（完全免费）' : ' to sign up and create a free API Key'}
                </p>
              </div>

              <input
                ref={keyInputRef}
                type="text"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onFocus={e => {
                  autoSelect(e);
                  setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                }}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                placeholder="gsk_..."
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                onMouseDown={e => e.preventDefault()}
                onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); if (keyInput.trim()) handleSaveKey(); }}
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl font-medium transition-colors"
              >
                {t('saveAndContinue')}
              </button>
              <p className="text-xs text-gray-400 text-center">{t('keyLocalOnly')}</p>
            </div>
          )}

          {/* ── Step 1: Capture ── */}
          {step === 'capture' && (
            <div className="p-6">
              <p className="text-sm text-gray-500 text-center mb-5">
                {t('scanInstruction')}
              </p>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full mb-3 py-10 border-2 border-dashed border-green-300 rounded-2xl bg-green-50 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <span className="text-5xl">📷</span>
                <span className="font-medium text-green-700">{t('takePhotoBtn')}</span>
                <span className="text-xs text-green-500">{t('tapToOpenCamera')}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>🖼️</span> {t('selectFromAlbum')}
              </button>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
              <input ref={fileInputRef}   type="file" accept="image/*" className="hidden" onChange={onFileChange} />

              {!isKeyFromEnv() && (
                <button
                  onClick={() => setStep('setup')}
                  className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  🔑 {t('changeGroqKey')}
                </button>
              )}
            </div>
          )}

          {/* ── Step 2: Analyzing ── */}
          {step === 'analyzing' && (
            <div className="p-6 flex flex-col items-center gap-5">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="营养标签"
                  className="w-full max-h-52 object-contain rounded-xl border border-gray-100"
                />
              )}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 font-medium">{t('aiRecognizing')}</p>
                <p className="text-xs text-gray-400">{t('aiTimeNote')}</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm ── */}
          {step === 'confirm' && extracted && (
            <div className="p-4 space-y-4">
              {/* 图片缩略图 */}
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="营养标签"
                  className="w-full max-h-36 object-contain rounded-xl border border-gray-100 bg-gray-50"
                />
              )}

              {/* 食物名称 */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">{t('foodNameLabel')}</label>
                <input
                  type="text"
                  value={extracted.name}
                  onChange={e => updateField('name', e.target.value)}
                  onFocus={autoSelect}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder={t('foodNamePlaceholder')}
                />
              </div>

              {/* 每100g营养数据 */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">{t('per100gNutrition')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {NUTRIENT_FIELDS.map(f => {
                    const val = extracted[f.key];
                    const isOptional = !['calories','protein','carbs','fat','fiber','sodium'].includes(f.key);
                    return (
                      <div key={f.key} className="bg-gray-50 rounded-xl p-3">
                        <label className="text-xs text-gray-400 block mb-1">
                          {f.label} <span className="text-gray-300">({localizeUnit(f.unit, locale)})</span>
                          {isOptional && val == null && <span className="text-gray-300 ml-1">—</span>}
                        </label>
                        <input
                          type="text" inputMode="decimal"
                          value={val ?? ''}
                          onChange={e => updateField(f.key, e.target.value)}
                          onFocus={autoSelect}
                          placeholder={isOptional ? t('notDetected') : '0'}
                          className="w-full bg-transparent text-gray-800 font-semibold focus:outline-none text-sm placeholder-gray-300"
                          min="0"
                          step="0.1"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 份量 */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">{t('servingSizeOptional')}</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extracted.servingLabel ?? ''}
                    onChange={e => updateField('servingLabel', e.target.value)}
                    onFocus={autoSelect}
                    placeholder={t('servingNamePlaceholder')}
                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-3 py-2.5">
                    <input
                      type="text" inputMode="decimal"
                      value={extracted.servingGrams ?? ''}
                      onChange={e => updateField('servingGrams', e.target.value)}
                      onFocus={autoSelect}
                      placeholder={t('gramsPlaceholderShort')}
                      className="w-16 bg-transparent text-sm focus:outline-none"
                      min="0"
                    />
                    <span className="text-xs text-gray-400">{localizeUnit('g', locale)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="营养标签"
                  className="w-full max-h-40 object-contain rounded-xl border border-gray-100"
                />
              )}
              <div className="text-4xl">😕</div>
              <p className="text-gray-700 font-medium">{t('recognitionFailed')}</p>
              <p className="text-sm text-gray-400">{errorMsg}</p>
              {!isKeyFromEnv() && (
                <button
                  onClick={() => { setKeyInput(''); setStep('setup'); }}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-colors"
                >
                  🔑 {t('changeGroqKey')}
                </button>
              )}
              <button
                onClick={reset}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 font-medium transition-colors"
              >
                {t('retakePhoto')}
              </button>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        {step === 'confirm' && (
          <div className="px-4 pt-4 border-t border-gray-100 space-y-2 shrink-0">
            {errorMsg && (
              <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">{errorMsg}</div>
            )}
            <button
              onMouseDown={e => e.preventDefault()}
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); if (!saving) handleSave(); }}
              onClick={() => { if (!saving) handleSave(); }}
              disabled={saving}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('savingEllipsis')}
                </>
              ) : t('saveToLibrary')}
            </button>
            <button
              onClick={reset}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              {t('retakePhoto')}
            </button>
          </div>
        )}

        <BottomReturnButton onClick={onClose} />
      </div>
    </div>
  );
}
