# 动画与动效

> **前提**：以下所有动画定义已在 templates 的 theme.css / app.css 中预制。如果你的项目没有这些动画，先检查是否走 scaffold 初始化了。

## 1. 基础入场动画（无需 JS）

最常见的 SaaS 页面入场效果，直接用现成的 class：

```tsx
{/* 从下方滑入 + 渐显 */}
<div className="animate-fade-up">

{/* 从上方滑入 + 渐显 */}
<div className="animate-fade-in">
```

**延迟控制**（用 CSS 变量）：
```tsx
<div
  className="animate-fade-up"
  style={{ '--animation-delay': '200ms' } as React.CSSProperties}
>
```

**stagger 效果** — 多元素依次入场：
```tsx
{items.map((item, i) => (
  <div
    key={i}
    className="animate-fade-up"
    style={{ '--animation-delay': `${i * 150}ms` } as React.CSSProperties}
  >
    {item}
  </div>
))}
```

原理：`animation-delay` 在 animations 定义中用了 `var(--animation-delay, 0ms)`，不传时默认 0ms。上面例子每项依次延迟 150ms 入场。这是 CSS-only 方案，零 JS 开销。

## 2. 滚动触发动画（Intersection Observer）

需要用 `framer-motion` 或 `motion` 库，纯 CSS 无法实现"滚动到才播放"：

```tsx
import { motion } from "motion";

{/* 单个元素 */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6 }}
>

{/* stagger 子元素 */}
<motion.div
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true }}
  variants={{
    visible: { transition: { staggerChildren: 0.1 } },
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {item}
    </motion.div>
  ))}
</motion.div>
```

**viewport 参数说明**：
- `once: true` — 只触发一次，滚回去再滚上来不重复播
- `margin: "-100px"` — 提前 100px 触发（元素离可见区还有 100px 就开始播）。做 landing page 建议加这个值

**不要用** Intersection Observer + useState 自己写——framer-motion 已经封装好了。

## 3. Shimmer（加载骨架闪烁）

用于卡片、表单、表格的加载占位效果（已在模板中预制）：

```tsx
<div
  className="h-4 w-full animate-shimmer rounded-md bg-muted"
  style={{
    background: `linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted-foreground) / 0.05) 50%, hsl(var(--muted)) 75%)`,
    backgroundSize: "200% 100%",
    '--shimmer-width': '100px',
  } as React.CSSProperties}
/>
```

**快速使用**——封装成 Skeleton 组件：
```tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("h-4 animate-shimmer rounded-md bg-muted", className)} />;
}

// 使用
<Skeleton className="h-10 w-full" />       {/* 完整的按钮高度 */}
<Skeleton className="h-4 w-3/4" />         {/* 3/4 宽的文字行 */}
<Skeleton className="h-48 w-full rounded-xl" />  {/* 图片/卡片占位 */}
```

## 4. Marquee（无限滚动）

用于 Logo 墙、合作伙伴展示：

```tsx
<div className="overflow-hidden">
  <div
    className="flex animate-marquee gap-8"
    style={{ '--duration': '30s', '--gap': '2rem' } as React.CSSProperties}
  >
    {/* 内容区域 — 这里放实际 logo */}
    {[...Array(8)].map((_, i) => (
      <div key={i} className="shrink-0">Logo {i + 1}</div>
    ))}
  </div>
</div>
```

**参数说明**：
- `--duration`：滚动总时长，默认 30s。内容越多时间越长
- `--gap`：项目间距。必须等于 CSS keyframe 中 `calc(-100% - var(--gap))` 的值

## 5. Hover 动效（性能最佳实践）

```tsx
{/* ✅ 推荐 — 只用 transform/opacity，触发 GPU 合成 */}
<div className="transition duration-300 hover:scale-105 hover:opacity-90">

{/* ✅ 推荐 — 颜色过渡 */}
<button className="transition-colors duration-200 hover:bg-primary/90">

{/* ❌ 避免 — 改变宽高触发布局重排 */}
<div className="transition-all duration-300 hover:w-48 hover:h-48">
```

**性能排序**：`transform` + `opacity`（GPU 合成） > `color/background`（重绘） > `width/height/margin`（重排）。

**duration 选择参考**：
- 100-200ms：按钮 hover、导航链接、开关切换
- 300ms：卡片 hover、图片缩放
- 500-1000ms：入场动画、页面切换

## 6. prefers-reduced-motion（无障碍降级）

用户可能在系统设置中开启了"减少动效"。禁用所有动画：

```css
/* 在 app.css 或 globals.css 添加 */
@layer base {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

放在 `@layer base` 中确保优先级最高。加入后，所有动画变为瞬间完成，不影响功能。

## 7. v3 vs v4 动画定义差异

| | v3 | v4 |
|--|----|----|
| 定义位置 | `tailwind.config.ts` 的 theme.extend.keyframes + animation | `app.css` 的 `@theme inline` + `@keyframes` |
| 键格式 | `animation: { 'fade-in': 'fade-in 1000ms ease' }` | `--animate-fade-in: fade-in 1000ms ease` |
| 插件 | 需要 `require("tailwindcss-animate")` | 内置，不需要 |

**v4 版本（`@theme inline` + 外部 `@keyframes`）：**
```css
@theme inline {
  --animate-fade-in: fade-in 1000ms ease;
}

/* @keyframes 必须在 @theme inline 外部 */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: none; }
}
```

使用方式两个版本完全一样：`animate-fade-in`。
