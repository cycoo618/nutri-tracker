// ============================================
// 手动录入食物营养数据
// 搜索不到时让用户自己填写
// ============================================

import { useState, useMemo } from 'react';
import type { FoodItem, FoodCategory } from '../../types/food';
import { FOOD_CATEGORY_LABELS } from '../../types/food';
import { useSwipeDown } from '../../hooks/useSwipeDown';
import { BottomReturnButton } from '../../components/ui/BottomReturnButton';
import { autoSelect } from '../../utils/inputHelpers';
import { useLocale } from '../../i18n/useLocale';
import { localizeUnit } from '../../utils/servingLabels';
import { saveCustomFood, recordToFoodItem } from '../../utils/customFoods';
import { saveUserFood } from '../../services/firestore';

interface ManualFoodEntryProps {
  initialName?: string;
  onConfirm: (food: FoodItem) => void;
  onBack: () => void;
  onClose: () => void;
  userId?: string;
}

const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export function ManualFoodEntry({ initialName = '', onConfirm, onBack, onClose, userId }: ManualFoodEntryProps) {
  const { t, locale } = useLocale();
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<FoodCategory>('other');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('0');
  const [gi, setGi] = useState('');
  const [servingLabel, setServingLabel] = useState('');
  const [servingGrams, setServingGrams] = useState('');

  const { cardRef, dragHandlers, cardDragHandlers } = useSwipeDown(onClose);

  const isValid = name.trim() && Number(calories) > 0;

  // Localized nutrient field definitions
  const nutrientFields = useMemo(() => [
    { label: t('caloriesRequired'), value: calories, onChange: setCalories, unit: localizeUnit('kcal', locale), placeholder: '如 52' },
    { label: t('protein'),   value: protein,  onChange: setProtein,  unit: localizeUnit('g', locale),   placeholder: '如 3.2' },
    { label: t('carbsFull'), value: carbs,    onChange: setCarbs,    unit: localizeUnit('g', locale),   placeholder: '如 4.8' },
    { label: t('fat'),       value: fat,      onChange: setFat,      unit: localizeUnit('g', locale),   placeholder: '如 3.3' },
    { label: t('fiber'),     value: fiber,    onChange: setFiber,    unit: localizeUnit('g', locale),   placeholder: '如 0' },
    { label: t('giOptional'),value: gi,       onChange: setGi,       unit: '',                          placeholder: '如 27' },
  ], [t, locale, calories, protein, carbs, fat, fiber, gi]);

  const handleSubmit = () => {
    if (!isValid) return;
    const giVal = gi ? Number(gi) : undefined;
    const record = saveCustomFood({
      name: name.trim(),
      pantrySource: 'manual',
      ingredients: [],
      totalGrams: 100,
      per100g: {
        calories: Number(calories) || 0,
        protein:  Number(protein)  || 0,
        carbs:    Number(carbs)    || 0,
        fat:      Number(fat)      || 0,
        fiber:    Number(fiber)    || 0,
      },
      servingSizes: servingLabel && servingGrams
        ? [{ label: servingLabel, grams: Number(servingGrams) }]
        : [],
    });
    if (userId) saveUserFood(userId, record).catch(() => {});
    const food: FoodItem = {
      ...recordToFoodItem(record),
      gi: giVal,
      giLevel: giVal !== undefined
        ? giVal <= 55 ? 'low' : giVal <= 69 ? 'medium' : 'high'
        : undefined,
    };
    onConfirm(food);
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
        style={{ maxHeight: 'var(--vvh, 90vh)' }}
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

        <div className="px-4 pb-2 shrink-0 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-center">{t('manualEntryTitle')}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            💡 {t('per100gNote')}
          </div>

          {/* 食物名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('foodNameRequiredLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={autoSelect}
              placeholder="如：%Arabica Kyoto Latte"
              className={INPUT_CLS}
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('categoryLabel')}</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as FoodCategory)}
              className={INPUT_CLS}
            >
              {(Object.entries(FOOD_CATEGORY_LABELS) as [FoodCategory, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {/* 营养数据（每100g） */}
          <div className="grid grid-cols-2 gap-3">
            {nutrientFields.map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
                    onFocus={autoSelect}
                    placeholder={f.placeholder}
                    className={`${INPUT_CLS} ${f.unit ? 'pr-10' : ''}`}
                  />
                  {f.unit && (
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">{f.unit}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 常用份量（可选） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('servingOptionalLabel')}
              <span className="ml-2 text-xs font-normal text-gray-400">{t('servingOptionalNote')}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={servingLabel}
                onChange={e => setServingLabel(e.target.value)}
                onFocus={autoSelect}
                placeholder="如：1杯、1份"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="relative w-28">
                <input
                  type="number"
                  value={servingGrams}
                  onChange={e => setServingGrams(e.target.value)}
                  onFocus={autoSelect}
                  placeholder="350"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">g</span>
              </div>
            </div>
          </div>

          <button
            onMouseDown={e => e.preventDefault()}
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-green-600 text-white rounded-xl py-3.5 font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t('nextConfirmAmount')}
          </button>
        </div>

        <BottomReturnButton onClick={onBack} />
      </div>
    </div>
  );
}
