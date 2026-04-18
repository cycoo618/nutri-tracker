// ============================================
// 手动录入食物营养数据
// 搜索不到时让用户自己填写
// ============================================

import { useState } from 'react';
import type { FoodItem, FoodCategory } from '../../types/food';
import { FOOD_CATEGORY_LABELS } from '../../types/food';
import { generateId } from '../../utils/calculator';

interface ManualFoodEntryProps {
  initialName?: string;
  onConfirm: (food: FoodItem) => void;
  onBack: () => void;
  onClose: () => void;
}

const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export function ManualFoodEntry({ initialName = '', onConfirm, onBack, onClose }: ManualFoodEntryProps) {
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

  const isValid = name.trim() && Number(calories) > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    const giVal = gi ? Number(gi) : undefined;
    const food: FoodItem = {
      id: `user_${generateId()}`,
      name: name.trim(),
      category,
      per100g: {
        calories: Number(calories) || 0,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 0,
      },
      gi: giVal,
      giLevel: giVal !== undefined
        ? giVal <= 55 ? 'low' : giVal <= 69 ? 'medium' : 'high'
        : undefined,
      servingSizes: servingLabel && servingGrams
        ? [{ label: servingLabel, grams: Number(servingGrams) }]
        : undefined,
      source: 'user_added',
    };
    onConfirm(food);
  };

  return (
    <div className="fixed inset-x-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" style={{ top: 'var(--vvt, 0px)', height: 'var(--vvh, 100vh)' }}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl flex flex-col" style={{ maxHeight: 'var(--vvh, 90vh)' }}>

        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">← 返回</button>
          <h3 className="font-semibold text-gray-900">手动录入食物</h3>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-600">关闭</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            💡 以下营养数据均为每 <strong>100g</strong> 的含量，可在包装背面食品标签找到
          </div>

          {/* 食物名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">食物名称 *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="如：%Arabica Kyoto Latte"
              className={INPUT_CLS}
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
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
            {[
              { label: '热量 *', value: calories, onChange: setCalories, unit: 'kcal', placeholder: '如 52' },
              { label: '蛋白质', value: protein, onChange: setProtein, unit: 'g', placeholder: '如 3.2' },
              { label: '碳水化合物', value: carbs, onChange: setCarbs, unit: 'g', placeholder: '如 4.8' },
              { label: '脂肪', value: fat, onChange: setFat, unit: 'g', placeholder: '如 3.3' },
              { label: '膳食纤维', value: fiber, onChange: setFiber, unit: 'g', placeholder: '如 0' },
              { label: 'GI值（可选）', value: gi, onChange: setGi, unit: '', placeholder: '如 27' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={f.value}
                    onChange={e => f.onChange(e.target.value)}
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
              常用份量
              <span className="ml-2 text-xs font-normal text-gray-400">可选，方便下次快速选择</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={servingLabel}
                onChange={e => setServingLabel(e.target.value)}
                placeholder="如：1杯、1份"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="relative w-28">
                <input
                  type="number"
                  value={servingGrams}
                  onChange={e => setServingGrams(e.target.value)}
                  placeholder="350"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">g</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full bg-green-600 text-white rounded-xl py-3.5 font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            下一步：确认用量
          </button>
        </div>
      </div>
    </div>
  );
}
