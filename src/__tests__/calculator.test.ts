import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  getTodayString,
  formatDateCN,
  getDateRange,
  getCurrentWeekRange,
  getCurrentMonthRange,
  formatNumber,
  formatPercent,
  generateId,
} from '../utils/calculator';

// 固定时间：2026-04-11 周六
const FIXED_DATE = new Date('2026-04-11T10:00:00');

beforeAll(() => {
  vi.setSystemTime(FIXED_DATE);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('getTodayString', () => {
  it('返回 YYYY-MM-DD 格式', () => {
    expect(getTodayString()).toBe('2026-04-11');
  });
});

describe('formatDateCN', () => {
  it('正确格式化为中文日期', () => {
    expect(formatDateCN('2026-04-11')).toBe('4月11日 周六');
  });

  it('正确识别星期日', () => {
    expect(formatDateCN('2026-04-12')).toBe('4月12日 周日');
  });

  it('正确识别周一', () => {
    expect(formatDateCN('2026-04-06')).toBe('4月6日 周一');
  });
});

describe('getDateRange', () => {
  it('返回正确数量的日期', () => {
    const range = getDateRange(7);
    expect(range).toHaveLength(7);
  });

  it('第一个元素是今天', () => {
    const range = getDateRange(7);
    expect(range[0]).toBe('2026-04-11');
  });

  it('日期倒序排列', () => {
    const range = getDateRange(3);
    expect(range[0] > range[1]).toBe(true);
    expect(range[1] > range[2]).toBe(true);
  });

  it('自定义结束日期', () => {
    const range = getDateRange(3, '2026-04-05');
    expect(range[0]).toBe('2026-04-05');
    expect(range[1]).toBe('2026-04-04');
    expect(range[2]).toBe('2026-04-03');
  });
});

describe('getCurrentWeekRange', () => {
  it('start 是本周一', () => {
    // 2026-04-11 是周六，本周一是 04-06
    const { start } = getCurrentWeekRange();
    expect(start).toBe('2026-04-06');
  });

  it('end 是本周日', () => {
    const { end } = getCurrentWeekRange();
    expect(end).toBe('2026-04-12');
  });

  it('start ≤ end', () => {
    const { start, end } = getCurrentWeekRange();
    expect(start <= end).toBe(true);
  });
});

describe('getCurrentMonthRange', () => {
  it('start 是月初', () => {
    const { start } = getCurrentMonthRange();
    expect(start).toBe('2026-04-01');
  });

  it('end 是月末', () => {
    const { end } = getCurrentMonthRange();
    expect(end).toBe('2026-04-30');
  });
});

describe('formatNumber', () => {
  it('默认保留一位小数', () => {
    expect(formatNumber(3.16)).toBe('3.2');
    expect(formatNumber(3.14)).toBe('3.1');
  });

  it('去掉尾部零', () => {
    expect(formatNumber(3.0)).toBe('3');
    expect(formatNumber(10.10)).toBe('10.1');
  });

  it('自定义小数位数', () => {
    expect(formatNumber(3.14159, 2)).toBe('3.14');
  });
});

describe('formatPercent', () => {
  it('正常百分比', () => {
    expect(formatPercent(50, 100)).toBe(50);
    expect(formatPercent(75, 200)).toBe(38);
  });

  it('超过100%时限制为100', () => {
    expect(formatPercent(150, 100)).toBe(100);
  });

  it('分母为0时返回0', () => {
    expect(formatPercent(50, 0)).toBe(0);
  });
});

describe('generateId', () => {
  it('生成字符串', () => {
    expect(typeof generateId()).toBe('string');
  });

  it('每次生成不同的 ID', () => {
    const ids = new Set(Array.from({ length: 10 }, generateId));
    expect(ids.size).toBe(10);
  });
});
