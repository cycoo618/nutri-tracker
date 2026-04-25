// ============================================
// 通用计算工具
// ============================================

/** 本地时区日期 → YYYY-MM-DD 字符串（避免 toISOString() 的 UTC 偏差） */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 获取今天的日期字符串 YYYY-MM-DD（使用用户本地时区） */
export function getTodayString(): string {
  return toLocalDateStr(new Date());
}

/** 格式化日期为中文 */
export function formatDateCN(dateStr: string): string {
  return formatDate(dateStr, 'zh');
}

/** 本地化日期格式：zh → "4月25日 周六"，en → "Apr 25, Sat" */
export function formatDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (locale === 'en') {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${days[d.getDay()]}`;
  }
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${month}月${day}日 周${weekdays[d.getDay()]}`;
}

/** 获取过去 N 天的日期列表 */
export function getDateRange(days: number, endDate?: string): string[] {
  const end = endDate ? new Date(endDate + 'T00:00:00') : new Date();
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
}

/** 获取本周的起止日期（周一开始） */
export function getCurrentWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // 调整为周一开始
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: toLocalDateStr(monday),
    end:   toLocalDateStr(sunday),
  };
}

/** 获取本月的起止日期 */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: toLocalDateStr(start),
    end:   toLocalDateStr(end),
  };
}

/** 数字格式化：保留1位小数，去掉尾部0 */
export function formatNumber(n: number, decimals = 1): string {
  return parseFloat(n.toFixed(decimals)).toString();
}

/** 百分比格式化 */
export function formatPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

/** 生成唯一 ID */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
