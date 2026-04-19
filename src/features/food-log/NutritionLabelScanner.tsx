// ============================================
// 营养标签扫描组件
// 拍照 / 上传 → Claude Vision 识别 → 确认保存
// ============================================

import { useState, useRef, useCallback } from 'react';
import type { FoodItem } from '../../types/food';
import { saveCustomFood, recordToFoodItem } from '../../utils/customFoods';
import { getGeminiKey, saveGeminiKey, isKeyFromEnv } from '../../services/nutrition-vision';

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
  calcium?: number;
  iron?: number;
  potassium?: number;
  vitaminC?: number;
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

const NUTRIENT_FIELDS: Field[] = [
  { key: 'calories',     label: '热量',     unit: 'kcal', type: 'number' },
  { key: 'protein',      label: '蛋白质',   unit: 'g',    type: 'number' },
  { key: 'carbs',        label: '碳水化合物', unit: 'g', type: 'number' },
  { key: 'fat',          label: '脂肪',     unit: 'g',    type: 'number' },
  { key: 'fiber',        label: '膳食纤维', unit: 'g',    type: 'number' },
  { key: 'sugar',        label: '糖',       unit: 'g',    type: 'number' },
  { key: 'saturatedFat', label: '饱和脂肪', unit: 'g',    type: 'number' },
  { key: 'sodium',       label: '钠',       unit: 'mg',   type: 'number' },
  { key: 'calcium',      label: '钙',       unit: 'mg',   type: 'number' },
  { key: 'iron',         label: '铁',       unit: 'mg',   type: 'number' },
  { key: 'potassium',    label: '钾',       unit: 'mg',   type: 'number' },
  { key: 'vitaminC',     label: '维生素C',  unit: 'mg',   type: 'number' },
];

// 压缩图片到最大 400px 宽，JPEG 0.72，约 20-50KB
function compressImage(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(1, MAX / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.src = dataUrl;
  });
}

// ── Props ───────────────────────────────────

interface NutritionLabelScannerProps {
  onSaved: (food: FoodItem) => void;
  onClose: () => void;
}

// ── Component ───────────────────────────────

export function NutritionLabelScanner({ onSaved, onClose }: NutritionLabelScannerProps) {
  const [step, setStep]               = useState<Step>(() => getGeminiKey() ? 'capture' : 'setup');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [extracted, setExtracted]     = useState<ExtractedNutrition | null>(null);
  const [errorMsg, setErrorMsg]       = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [keyInput, setKeyInput]       = useState('');

  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);


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
        setErrorMsg(err instanceof Error ? err.message : '识别失败，请重试');
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
    saveGeminiKey(k);
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
      const foodItem = recordToFoodItem(record);
      onSaved(foodItem);
    } catch (err) {
      console.warn('Save failed:', err);
      setErrorMsg('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────

  return (
    <div className="fixed inset-x-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ maxHeight: 'var(--vvh, 92vh)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <span className="font-semibold text-gray-800">扫描营养标签</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 0: Setup API Key ── */}
          {step === 'setup' && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-3">🔑</div>
                <p className="font-medium text-gray-800 mb-1">填入 Groq API Key</p>
                <p className="text-sm text-gray-500">
                  免费获取：前往{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    console.groq.com
                  </a>
                  {' '}注册后创建 API Key（完全免费）
                </p>
              </div>

              <input
                type="text"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                placeholder="AIza..."
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl font-medium transition-colors"
              >
                保存并继续
              </button>
              <p className="text-xs text-gray-400 text-center">Key 仅存储在你的设备上，不经过任何服务器</p>
            </div>
          )}

          {/* ── Step 1: Capture ── */}
          {step === 'capture' && (
            <div className="p-6">
              <p className="text-sm text-gray-500 text-center mb-5">
                拍摄或上传食品包装上的营养成分表，AI 会自动识别数据
              </p>

              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full mb-3 py-10 border-2 border-dashed border-green-300 rounded-2xl bg-green-50 hover:bg-green-100 transition-colors flex flex-col items-center justify-center gap-3"
              >
                <span className="text-5xl">📷</span>
                <span className="font-medium text-green-700">拍摄营养成分表</span>
                <span className="text-xs text-green-500">点击开启相机</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span>🖼️</span> 从相册选择图片
              </button>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
              <input ref={fileInputRef}   type="file" accept="image/*" className="hidden" onChange={onFileChange} />

              {!isKeyFromEnv() && (
                <button
                  onClick={() => setStep('setup')}
                  className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  🔑 更换 Groq API Key
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
                <p className="text-gray-600 font-medium">AI 正在识别营养数据…</p>
                <p className="text-xs text-gray-400">通常需要 5-10 秒</p>
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
                <label className="text-xs font-medium text-gray-500 block mb-1">食物名称</label>
                <input
                  type="text"
                  value={extracted.name}
                  onChange={e => updateField('name', e.target.value)}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="输入食物名称"
                />
              </div>

              {/* 每100g营养数据 */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">每 100g 营养数据</p>
                <div className="grid grid-cols-2 gap-2">
                  {NUTRIENT_FIELDS.map(f => {
                    const val = extracted[f.key];
                    const isOptional = !['calories','protein','carbs','fat','fiber','sodium'].includes(f.key);
                    return (
                      <div key={f.key} className="bg-gray-50 rounded-xl p-3">
                        <label className="text-xs text-gray-400 block mb-1">
                          {f.label} <span className="text-gray-300">({f.unit})</span>
                          {isOptional && val == null && <span className="text-gray-300 ml-1">—</span>}
                        </label>
                        <input
                          type="number"
                          value={val ?? ''}
                          onChange={e => updateField(f.key, e.target.value)}
                          placeholder={isOptional ? '未检测到' : '0'}
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
                <p className="text-xs font-medium text-gray-500 mb-2">参考份量（可选）</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={extracted.servingLabel ?? ''}
                    onChange={e => updateField('servingLabel', e.target.value)}
                    placeholder="份量名称，如「1袋」"
                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-3 py-2.5">
                    <input
                      type="number"
                      value={extracted.servingGrams ?? ''}
                      onChange={e => updateField('servingGrams', e.target.value)}
                      placeholder="克数"
                      className="w-16 bg-transparent text-sm focus:outline-none"
                      min="0"
                    />
                    <span className="text-xs text-gray-400">g</span>
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
              <p className="text-gray-700 font-medium">识别失败</p>
              <p className="text-sm text-gray-400">{errorMsg}</p>
              {!isKeyFromEnv() && (
                <button
                  onClick={() => { setKeyInput(''); setStep('setup'); }}
                  className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl text-sm font-medium transition-colors"
                >
                  🔑 更换 Groq API Key
                </button>
              )}
              <button
                onClick={reset}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm text-gray-600 font-medium transition-colors"
              >
                重新拍摄
              </button>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        {step === 'confirm' && (
          <div className="p-4 border-t border-gray-100 space-y-2 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  保存中…
                </>
              ) : '保存到食物库'}
            </button>
            <button
              onClick={reset}
              className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              重新拍摄
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
