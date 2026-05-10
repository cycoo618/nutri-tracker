// ============================================
// 食物照片识别组件
// 拍照 → AI 识别食物 + 估算克数 → 确认 → 添加
// ============================================

import { useState, useRef, useCallback } from 'react';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { autoSelect } from '../../utils/inputHelpers';
import { compressImage } from '../../utils/imageUtils';
import type { FoodItem } from '../../types/food';
import {
  getGroqKey,
  isKeyFromEnv,
  saveGroqKey,
  recognizeFoodPhoto,
  estimateFoodNutrition,
} from '../../services/nutrition-vision';
import { useLocale } from '../../i18n/useLocale';

type Step = 'capture' | 'analyzing' | 'confirm' | 'error';

interface FoodPhotoScannerProps {
  onClose: () => void;
  onSelect: (food: FoodItem) => void;
  userId?: string;
}

export function FoodPhotoScanner({ onClose, onSelect }: FoodPhotoScannerProps) {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>('capture');
  const [needsKey, setNeedsKey] = useState(() => !getGroqKey());
  const [keyInput, setKeyInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirm-screen editable state
  const [foodName, setFoodName] = useState('');
  const [grams, setGrams] = useState('');
  const [portionDescription, setPortionDescription] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setStep('analyzing');

      let base64: string;
      try {
        const compressed = await compressImage(dataUrl);
        base64 = compressed.split(',')[1];
      } catch {
        base64 = dataUrl.split(',')[1];
      }

      try {
        const result = await recognizeFoodPhoto(base64);
        setFoodName(result.foodName);
        setGrams(String(result.estimatedGrams));
        setPortionDescription(result.portionDescription);
        setStep('confirm');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : t('recognitionFailedNote'));
        setStep('error');
      }
    };
    reader.readAsDataURL(file);
  }, [t]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const reset = () => {
    setStep('capture');
    setImagePreview(null);
    setErrorMsg(null);
    setFoodName('');
    setGrams('');
    setPortionDescription('');
  };

  const handleSaveKey = () => {
    const k = keyInput.trim();
    if (!k) return;
    saveGroqKey(k);
    setKeyInput('');
    setNeedsKey(false);
  };

  const handleConfirm = async () => {
    const gramsNum = Number(grams) || 0;
    if (!foodName.trim() || gramsNum <= 0 || isLookingUp) return;
    setIsLookingUp(true);
    setErrorMsg(null);
    try {
      const nutrition = await estimateFoodNutrition(foodName.trim());
      const food: FoodItem = {
        id: `photo_${Date.now()}`,
        name: nutrition.name || foodName.trim(),
        category: 'other',
        source: 'ai_estimated',
        per100g: {
          calories: nutrition.calories,
          protein: nutrition.protein,
          carbs: nutrition.carbs,
          fat: nutrition.fat,
          fiber: nutrition.fiber,
          sodium: nutrition.sodium,
        },
        // 照片估算的克数作为第一个 servingSize → AddFoodModal 默认选中
        servingSizes: [
          { label: portionDescription || '1份', grams: gramsNum },
          ...(nutrition.servingGrams && nutrition.servingGrams > 0
            ? [{ label: nutrition.servingLabel ?? `1份 (${Math.round(nutrition.servingGrams)}g)`, grams: nutrition.servingGrams }]
            : []),
        ],
        tags: ['AI识别'],
      };
      onSelect(food);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t('aiEstimateFailed'));
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
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
        <div
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab"
          style={{ touchAction: 'none' }}
          {...dragHandlers}
        >
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-center px-4 pb-3 border-b border-gray-100 shrink-0">
          <span className="text-xl mr-2">🍽️</span>
          <span className="font-semibold text-gray-800">{t('identifyFood')}</span>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Key Setup ── */}
          {needsKey && (
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-4xl mb-3">🔑</div>
                <p className="font-medium text-gray-800 mb-1">{t('setupGroqKey')}</p>
                <p className="text-sm text-gray-500">
                  {t('keyLocalOnly')}{' '}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline"
                  >
                    console.groq.com
                  </a>
                </p>
              </div>
              <input
                type="text"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onFocus={autoSelect}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                placeholder="gsk_..."
                className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                autoFocus
              />
              <button
                onClick={handleSaveKey}
                disabled={!keyInput.trim()}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl font-medium transition-colors"
              >
                {t('saveAndContinue')}
              </button>
            </div>
          )}

          {/* ── Capture ── */}
          {!needsKey && step === 'capture' && (
            <div className="p-6">
              <p className="text-sm text-gray-500 text-center mb-5">{t('photoInstruction')}</p>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full mb-3 py-10 border-2 border-dashed border-orange-300 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-colors flex flex-col items-center gap-3"
              >
                <span className="text-5xl">🍽️</span>
                <span className="font-medium text-orange-700">{t('takePhotoOfFood')}</span>
                <span className="text-xs text-orange-500">{t('tapToOpenCamera')}</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                🖼️ {t('selectFromAlbum')}
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onFileChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFileChange}
              />
              {!isKeyFromEnv() && (
                <button
                  onClick={() => setNeedsKey(true)}
                  className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  🔑 {t('changeGroqKey')}
                </button>
              )}
            </div>
          )}

          {/* ── Analyzing ── */}
          {step === 'analyzing' && (
            <div className="p-6 flex flex-col items-center gap-5">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="食物"
                  className="w-full max-h-52 object-contain rounded-xl border border-gray-100"
                />
              )}
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 font-medium">{t('aiIdentifying')}</p>
                <p className="text-xs text-gray-400">{t('aiTimeNote')}</p>
              </div>
            </div>
          )}

          {/* ── Confirm ── */}
          {step === 'confirm' && (
            <div className="p-4 space-y-4">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="食物"
                  className="w-full max-h-36 object-contain rounded-xl border border-gray-100 bg-gray-50"
                />
              )}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  {t('identifiedFoodName')}
                </label>
                <input
                  type="text"
                  value={foodName}
                  onChange={e => setFoodName(e.target.value)}
                  onFocus={autoSelect}
                  placeholder={t('foodNamePlaceholder')}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  {t('estimatedPortion')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={portionDescription}
                    onChange={e => setPortionDescription(e.target.value)}
                    onFocus={autoSelect}
                    placeholder={t('portionDescPlaceholder')}
                    className="flex-1 bg-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                  <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-3 py-2.5">
                    <input
                      type="number"
                      value={grams}
                      onChange={e => setGrams(e.target.value)}
                      onFocus={autoSelect}
                      placeholder="150"
                      className="w-16 bg-transparent text-sm focus:outline-none"
                      min="1"
                    />
                    <span className="text-xs text-gray-400">g</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">{t('nutritionLookupNote')}</p>
            </div>
          )}

          {/* ── Error ── */}
          {step === 'error' && (
            <div className="p-6 flex flex-col items-center gap-4 text-center">
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="食物"
                  className="w-full max-h-40 object-contain rounded-xl border border-gray-100"
                />
              )}
              <div className="text-4xl">😕</div>
              <p className="text-gray-700 font-medium">{t('recognitionFailed')}</p>
              <p className="text-sm text-gray-400">{errorMsg}</p>
              {!isKeyFromEnv() && (
                <button
                  onClick={() => setNeedsKey(true)}
                  className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
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

        {/* Footer — confirm step only */}
        {step === 'confirm' && (
          <div className="px-4 pt-4 pb-2 border-t border-gray-100 space-y-2 shrink-0">
            {errorMsg && (
              <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 text-center">
                {errorMsg}
              </div>
            )}
            <button
              onMouseDown={e => e.preventDefault()}
              onTouchEnd={e => { e.preventDefault(); e.stopPropagation(); handleConfirm(); }}
              onClick={handleConfirm}
              disabled={isLookingUp || !foodName.trim() || Number(grams) <= 0}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isLookingUp ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('lookingUpNutrition')}
                </>
              ) : t('confirmAndAdd')}
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
