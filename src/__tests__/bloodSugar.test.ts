import { describe, it, expect } from 'vitest';
import { getGlucoseStatus, toMmol } from '../types/bloodSugar';

describe('toMmol 单位换算', () => {
  it('mmol/L 原样返回', () => {
    expect(toMmol(5.5, 'mmol/L')).toBe(5.5);
  });
  it('mg/dL 换算成 mmol/L（÷18）', () => {
    expect(toMmol(90, 'mg/dL')).toBeCloseTo(5.0, 5);
    expect(toMmol(180, 'mg/dL')).toBeCloseTo(10.0, 5);
  });
});

describe('getGlucoseStatus 达标判定（mmol/L）', () => {
  it('空腹：4.4–7.0 达标，>7.0 偏高，<3.9 偏低', () => {
    expect(getGlucoseStatus(5.5, 'fasting', 'mmol/L')).toBe('normal');
    expect(getGlucoseStatus(7.5, 'fasting', 'mmol/L')).toBe('high');
    expect(getGlucoseStatus(3.5, 'fasting', 'mmol/L')).toBe('low');
    // 边界：7.0 视为偏高（high 起点闭区间）
    expect(getGlucoseStatus(7.0, 'fasting', 'mmol/L')).toBe('high');
    expect(getGlucoseStatus(6.9, 'fasting', 'mmol/L')).toBe('normal');
  });

  it('餐后2h：<10.0 达标', () => {
    expect(getGlucoseStatus(9.0, 'post_meal_2h', 'mmol/L')).toBe('normal');
    expect(getGlucoseStatus(10.5, 'post_meal_2h', 'mmol/L')).toBe('high');
  });

  it('睡前：5.0–8.3 窗口，8.4 偏高', () => {
    expect(getGlucoseStatus(6.5, 'bedtime', 'mmol/L')).toBe('normal');
    expect(getGlucoseStatus(8.5, 'bedtime', 'mmol/L')).toBe('high');
  });

  it('随机：<11.1 达标', () => {
    expect(getGlucoseStatus(9.0, 'random', 'mmol/L')).toBe('normal');
    expect(getGlucoseStatus(12.0, 'random', 'mmol/L')).toBe('high');
  });
});

describe('getGlucoseStatus 支持 mg/dL 输入', () => {
  it('空腹 126 mg/dL (=7.0 mmol/L) 偏高', () => {
    expect(getGlucoseStatus(126, 'fasting', 'mg/dL')).toBe('high');
  });
  it('空腹 99 mg/dL (=5.5 mmol/L) 达标', () => {
    expect(getGlucoseStatus(99, 'fasting', 'mg/dL')).toBe('normal');
  });
});
