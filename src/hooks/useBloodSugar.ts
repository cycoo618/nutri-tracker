// ============================================
// 血糖记录 Hook（控血糖目标专用）
// local-first：本地缓存即时显示 + Firestore 异步同步
// 结构参考 useFoodLog
// ============================================

import { useState, useEffect, useCallback } from 'react';
import type { BloodSugarReading } from '../types/bloodSugar';
import {
  getBloodSugarReadings,
  getBloodSugarReadingsInRange,
  saveBloodSugarReading,
  deleteBloodSugarReading,
} from '../services/firestore';
import { getDateRange, generateId } from '../utils/calculator';

/** localStorage key：某用户某天的血糖读数数组 */
function localKey(userId: string, date: string) {
  return `nutri_bs_${userId}_${date}`;
}

function saveToLocal(userId: string, date: string, readings: BloodSugarReading[]) {
  try {
    localStorage.setItem(localKey(userId, date), JSON.stringify(readings));
  } catch { /* storage full — ignore */ }
}

function loadFromLocal(userId: string, date: string): BloodSugarReading[] | null {
  try {
    const raw = localStorage.getItem(localKey(userId, date));
    return raw ? (JSON.parse(raw) as BloodSugarReading[]) : null;
  } catch {
    return null;
  }
}

const sortByTime = (a: BloodSugarReading, b: BloodSugarReading) => a.measuredAt.localeCompare(b.measuredAt);

/** 新增读数时的输入（其余字段由 hook 补全） */
export type NewReadingInput = Omit<
  BloodSugarReading,
  'id' | 'userId' | 'date' | 'createdAt' | 'updatedAt'
>;

/**
 * @param enabled 仅在用户目标含 blood_sugar 时为 true；false 时不查 Firestore，返回空
 */
export function useBloodSugar(userId: string | undefined, currentDate: string, enabled: boolean) {
  const [readings, setReadings] = useState<BloodSugarReading[]>([]);
  const [trend, setTrend] = useState<BloodSugarReading[]>([]);
  const [loading, setLoading] = useState(false);

  // ── 加载当天读数：先本地缓存，再 Firestore 覆盖 ──
  useEffect(() => {
    if (!userId || !enabled) { setReadings([]); return; }

    const cached = loadFromLocal(userId, currentDate);
    if (cached) {
      setReadings(cached.sort(sortByTime));
      setLoading(false);
    } else {
      setLoading(true);
    }

    getBloodSugarReadings(userId, currentDate)
      .then(list => {
        setReadings(list);
        saveToLocal(userId, currentDate, list);
      })
      .catch(err => {
        // Firestore 失败 → 继续用本地缓存（已显示）；没缓存则空
        if (!cached) setReadings([]);
        console.warn('Blood sugar load failed:', err);
      })
      .finally(() => setLoading(false));
  }, [userId, currentDate, enabled]);

  // ── 加载近 7 天趋势 ──
  useEffect(() => {
    if (!userId || !enabled) { setTrend([]); return; }
    const days = getDateRange(7, currentDate); // 降序：[currentDate, ..., currentDate-6]
    const end = days[0];                        // 最新 = currentDate
    const start = days[days.length - 1];        // 最早 = currentDate-6
    getBloodSugarReadingsInRange(userId, start, end)
      .then(setTrend)
      .catch(err => console.warn('Blood sugar trend load failed:', err));
  }, [userId, currentDate, enabled]);

  // 本地 + Firestore 双写，并刷新趋势
  const persist = useCallback((userId: string, date: string, next: BloodSugarReading[]) => {
    saveToLocal(userId, date, next);
    // 若改动落在趋势窗口内，同步更新趋势 state（乐观）
    setTrend(prev => {
      const merged = prev.filter(r => r.date !== date).concat(next.filter(r => r.date === date));
      return merged.sort(sortByTime);
    });
  }, []);

  const addReading = useCallback(async (input: NewReadingInput) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const date = input.measuredAt.slice(0, 10); // ISO → YYYY-MM-DD
    const reading: BloodSugarReading = {
      ...input,
      id: generateId(),
      userId,
      date,
      createdAt: now,
      updatedAt: now,
    };
    // 乐观更新：只有落在当前查看日才进 readings
    if (date === currentDate) {
      setReadings(prev => [...prev, reading].sort(sortByTime));
    }
    const dayList = (date === currentDate
      ? [...readings, reading]
      : [...(loadFromLocal(userId, date) ?? []), reading]).sort(sortByTime);
    persist(userId, date, dayList);
    try {
      await saveBloodSugarReading(reading);
    } catch (err) {
      console.warn('Blood sugar save failed:', err);
    }
  }, [userId, currentDate, readings, persist]);

  const updateReading = useCallback(async (id: string, patch: Partial<NewReadingInput>) => {
    if (!userId) return;
    const existing = readings.find(r => r.id === id);
    if (!existing) return;
    const updated: BloodSugarReading = {
      ...existing,
      ...patch,
      date: patch.measuredAt ? patch.measuredAt.slice(0, 10) : existing.date,
      updatedAt: new Date().toISOString(),
    };
    const next = readings.filter(r => r.id !== id);
    if (updated.date === currentDate) next.push(updated);
    next.sort(sortByTime);
    setReadings(next);
    persist(userId, currentDate, next);
    try {
      await saveBloodSugarReading(updated);
    } catch (err) {
      console.warn('Blood sugar update failed:', err);
    }
  }, [userId, currentDate, readings, persist]);

  const deleteReading = useCallback(async (id: string) => {
    if (!userId) return;
    const next = readings.filter(r => r.id !== id);
    setReadings(next);
    persist(userId, currentDate, next);
    try {
      await deleteBloodSugarReading(id);
    } catch (err) {
      console.warn('Blood sugar delete failed:', err);
    }
  }, [userId, currentDate, readings, persist]);

  return { readings, trend, loading, addReading, updateReading, deleteReading };
}
