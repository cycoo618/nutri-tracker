import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { NutritionStatus } from '../../../hooks/useNutrition';
import { FOOD_GROUPS } from '../tokens';

interface Banner {
  tag: string;
  tagColor: string;
  icon: string;
  body: string;
}

interface RotatingBannerProps {
  nutritionStatus?: NutritionStatus | null;
  coveredGroups?: Set<string>;
}

const FOOD_GROUP_NUDGE: Record<string, { icon: string; tag: string; tagColor: string; body: string }> = {
  veg:   { icon: '🥬', tag: '蔬菜',    tagColor: 'var(--veg)',    body: '今日还没有蔬菜，午餐或晚餐加一份叶菜，每天 300–500g。' },
  fruit: { icon: '🍎', tag: '水果',    tagColor: 'var(--fruit)',  body: '今日还没有水果，饭后来一个苹果或一把蓝莓都很好。' },
  grain: { icon: '🌾', tag: '全谷物',  tagColor: 'var(--grain)',  body: '今日还没有全谷物，可以把白米饭换成糙米或加点燕麦。' },
  bean:  { icon: '🫘', tag: '豆类',    tagColor: 'var(--bean)',   body: '今日还没有豆制品，豆腐、豆浆或毛豆都是很好的选择。' },
  nut:   { icon: '🥜', tag: '坚果',    tagColor: 'var(--nut)',    body: '今日还没有坚果，一小把核桃或杏仁就能补充优质脂肪。' },
  fish:  { icon: '🐟', tag: '鱼/海鲜', tagColor: 'var(--fish)',   body: '今日还没有鱼类，清蒸鱼或一小片三文鱼是很好的蛋白质来源。' },
  ferm:  { icon: '🫙', tag: '发酵食品', tagColor: 'var(--ferm)',  body: '今日还没有发酵食品，一杯酸奶、一勺味噌汤都行。' },
};

const FOOD_GROUP_DONE: Record<string, { icon: string; tag: string; tagColor: string; body: string }> = {
  veg:   { icon: '🥬', tag: '蔬菜 ✓',    tagColor: 'var(--veg)',   body: '今日蔬菜已达标，棒！膳食纤维和植物营养素都在路上了。' },
  fruit: { icon: '🍎', tag: '水果 ✓',    tagColor: 'var(--fruit)', body: '今日有吃水果，维生素和天然抗氧化剂都到位了。' },
  fish:  { icon: '🐟', tag: '鱼/海鲜 ✓', tagColor: 'var(--fish)',  body: '今日有吃鱼，Omega-3 和优质蛋白都在走！' },
  ferm:  { icon: '🫙', tag: '发酵食品 ✓', tagColor: 'var(--ferm)', body: '今日有发酵食品，肠道菌群今天有被照顾到。' },
  nut:   { icon: '🥜', tag: '坚果 ✓',    tagColor: 'var(--nut)',   body: '今日有坚果，健康脂肪和维生素E都很好。' },
};

function buildBanners(ns: NutritionStatus | null, covered: Set<string>): Banner[] {
  const banners: Banner[] = [];

  // 1. 热量状态
  if (ns) {
    const pct = ns.caloriePercent;
    if (pct >= 90 && pct <= 110) {
      banners.push({ icon: '🎯', tag: '热量达标', tagColor: 'var(--sage)', body: '今日热量摄入很到位，继续保持均衡节奏！' });
    } else if (pct > 110) {
      const over = Math.round(ns.consumedCalories - ns.targetCalories);
      banners.push({ icon: '⚠️', tag: '热量偏高', tagColor: 'var(--tomato)', body: `今日已超出目标 ${over} kcal，晚餐可以清淡一点。` });
    } else if (pct < 30 && ns.consumedCalories > 0) {
      banners.push({ icon: '📝', tag: '记录提醒', tagColor: 'var(--mustard)', body: '今日记录较少，别忘了把午餐和晚餐也记上。' });
    }
  }

  // 2. 宏量不足提醒（最多 2 个）
  if (ns) {
    const proteinPct = ns.macros.protein.target > 0 ? ns.macros.protein.consumed / ns.macros.protein.target : 1;
    const fiberPct   = ns.fiber.target > 0 ? ns.fiber.consumed / ns.fiber.target : 1;
    const carbsPct   = ns.macros.carbs.target > 0 ? ns.macros.carbs.consumed / ns.macros.carbs.target : 1;

    if (proteinPct < 0.6) {
      const need = Math.round((1 - proteinPct) * ns.macros.protein.target);
      banners.push({ icon: '🥚', tag: '蛋白质', tagColor: 'var(--sky)', body: `蛋白质还差约 ${need}g，鸡蛋、鱼、豆腐或鸡胸肉都能快速补上。` });
    }
    if (fiberPct < 0.5) {
      banners.push({ icon: '🌿', tag: '膳食纤维', tagColor: 'var(--sage)', body: '今日纤维摄入偏少，多吃蔬菜和杂粮，肠道会很开心的。' });
    }
    if (carbsPct > 1.2) {
      banners.push({ icon: '🌾', tag: '碳水偏多', tagColor: 'var(--mustard)', body: '今日碳水已超出，晚餐可以减少米饭份量，多吃菜和蛋白质。' });
    }
  }

  // 3. 食物多样性 — 未覆盖的（优先显示"重要"类别：veg、fish、ferm）
  const missingPriority = ['veg', 'fish', 'ferm', 'fruit', 'bean', 'nut', 'grain'];
  let missingCount = 0;
  for (const key of missingPriority) {
    if (!covered.has(key) && FOOD_GROUP_NUDGE[key]) {
      banners.push(FOOD_GROUP_NUDGE[key]);
      if (++missingCount >= 2) break; // 最多 2 个缺失提醒
    }
  }

  // 4. 食物多样性 — 已覆盖的鼓励（veg/fish/ferm 最有价值时鼓励）
  const donePriority = ['fish', 'ferm', 'veg', 'fruit', 'nut'];
  for (const key of donePriority) {
    if (covered.has(key) && FOOD_GROUP_DONE[key]) {
      banners.push(FOOD_GROUP_DONE[key]);
      break; // 只显示一个鼓励
    }
  }

  // 兜底：至少有一条
  if (banners.length === 0) {
    banners.push({ icon: '✨', tag: '继续加油', tagColor: 'var(--mustard)', body: '记录饮食是照顾自己的一种方式，今天也要好好吃饭！' });
  }

  return banners;
}

export function RotatingBanner({ nutritionStatus, coveredGroups = new Set() }: RotatingBannerProps) {
  const banners = useMemo(
    () => buildBanners(nutritionStatus ?? null, coveredGroups),
    [nutritionStatus, coveredGroups],
  );

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 数据变化时重置到第一页
  useEffect(() => { setCurrent(0); }, [banners.length]);

  // clamp current index after banners rebuild
  const safeIdx = Math.min(current, banners.length - 1);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 4500);
    return () => clearInterval(id);
  }, [paused, banners.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: safeIdx * scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  }, [safeIdx]);

  const pause = () => {
    setPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), 8000);
  };

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        ref={scrollRef}
        onTouchStart={pause}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ display: 'flex', overflowX: 'hidden', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}
      >
        {banners.map((b, i) => (
          <div key={i} style={{ minWidth: '100%', scrollSnapAlign: 'start', display: 'flex', alignItems: 'baseline', gap: 8, padding: '8px 0 4px' }}>
            <span style={{ fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>{b.icon}</span>
            <p className="nt-serif" style={{ margin: 0, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              <span className="nt-chip" style={{ marginRight: 5, background: b.tagColor + '18', borderColor: b.tagColor + '33', color: b.tagColor, verticalAlign: 'middle' }}>
                {b.tag}
              </span>
              {b.body}
            </p>
          </div>
        ))}
      </div>
      {/* Dots */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
        {banners.map((b, i) => (
          <div key={i} onClick={() => { setCurrent(i); pause(); }} style={{
            height: 5, width: i === safeIdx ? 14 : 5, borderRadius: 999,
            background: i === safeIdx ? b.tagColor : 'var(--ink-faint)',
            transition: 'all 0.3s', cursor: 'pointer',
          }} />
        ))}
      </div>
    </div>
  );
}
