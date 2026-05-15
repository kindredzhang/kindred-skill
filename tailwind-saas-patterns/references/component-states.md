# 组件状态：Skeleton、Loading、Empty、Error

> **场景**：你从 API 拿数据渲染列表/卡片，数据没回来时该显示什么？数据是空数组时呢？

## 1. Skeleton 组件（加载占位）

最简洁的骨架屏方案，直接用现成的 animate-shimmer + bg-muted：

```tsx
import { cn } from "@/lib/utils";

/* 通用骨架屏组件（建议放到 components/ui/skeleton.tsx） */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-muted",
        "bg-[linear-gradient(90deg,hsl(var(--muted))_25%,hsl(var(--muted-foreground)/0.05)_50%,hsl(var(--muted))_75%)]",
        "bg-[length:200%_100%]",
        className
      )}
    />
  );
}
```

**常见尺寸用法**：

```tsx
{/* 按钮级别 */}
<Skeleton className="h-10 w-32" />          {/* 按钮加载 */}
<Skeleton className="h-9 w-full" />         {/* 输入框加载 */}

{/* 文字级别 */}
<Skeleton className="h-4 w-3/4" />          {/* 标题行 */}
<Skeleton className="h-3 w-1/2" />          {/* 描述行 */}
<Skeleton className="h-3 w-2/3" />          {/* 第二行描述 */}

{/* 卡片级别 */}
<div className="space-y-4">
  <Skeleton className="h-48 w-full rounded-xl" />   {/* 卡片图片 */}
  <Skeleton className="h-4 w-3/4" />                 {/* 卡片标题 */}
  <Skeleton className="h-3 w-full" />                {/* 卡片第一行 */}
  <Skeleton className="h-3 w-2/3" />                 {/* 卡片第二行 */}
</div>
```

**卡片列表骨架屏**：
```tsx
{/* 3 个骨架卡片占位，结构和真实卡片一致 */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {Array.from({ length: 3 }).map((_, i) => (
    <div key={i} className="space-y-4 rounded-lg border p-4">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  ))}
</div>
```

**计数原则**：骨架卡片数量 = 你预期一屏显示多少张真实卡片就显示多少个骨架。不要固定写 `3`，用 `whileInView` 或 SSR 时保持和 grid 列数一致。

## 2. 三态渲染模式

组件标配：loading / empty / error / data：

```tsx
function FeatureList() {
  // 这个 isPending / data / error 来自你的数据请求方式（React Query / SWR / server action）
  if (isPending) return <FeatureSkeleton />;
  if (error) return <FeatureError error={error} />;
  if (!data || data.length === 0) return <FeatureEmpty />;
  return <FeatureGrid data={data} />;
}
```

### Empty 状态
```tsx
function FeatureEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      {/* icon 可选 */}
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <span className="text-2xl text-muted-foreground">!</span>
      </div>
      <p className="text-lg font-medium">当前没有数据</p>
      <p className="text-sm text-muted-foreground">数据将在稍后加载，请稍后再试。</p>
    </div>
  );
}
```

Empty 的设计原则：不用太复杂，用户看明白"没数据"就行——一个居中的 icon + 文字 + 可选的 CTA 按钮。

### Error 状态
```tsx
function FeatureError({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <span className="text-2xl text-destructive">X</span>
      </div>
      <p className="text-lg font-medium">加载失败</p>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      {/* 始终提供重试按钮 */}
      <Button variant="outline" onClick={() => window.location.reload()}>
        重试
      </Button>
    </div>
  );
}
```

Error 状态必须有：有含义的错误信息 + 重试按钮。不要让用户看到 Error 后不知所措。

## 3. 图片加载状态

```tsx
<div className="relative overflow-clip rounded-xl bg-muted">
  {/* 加载中 — 骨架背景始终可见 */}
  <Skeleton className="absolute inset-0" />

  {/* 图片加载后覆盖骨架 */}
  <img
    src={src}
    alt={alt}
    className="relative z-10 h-full w-full object-cover"
    loading="lazy"    {/* 懒加载：视口外图片不加载 */}
    onLoad={(e) => {
      // 图片加载完成后隐藏骨架
      (e.target as HTMLElement).style.opacity = "1";
    }}
    style={{ opacity: 0 }}  {/* 初始透明，加载后显示 */}
  />
</div>
```

**简化版**（颜色区分法）：
```tsx
{/* 用 bg-muted + 图片覆盖 — 加载完成自动覆盖灰色背景 */}
<div className="aspect-video overflow-clip rounded-xl bg-muted">
  <img src={src} alt={alt} className="h-full w-full object-cover" loading="lazy" />
</div>
```
这种方式最简洁：图片加载时显示 `bg-muted` 灰色，加载完成后图片覆盖它。不需要 JS 控制，视觉效果也OK。

**loading="lazy" 说明**：只加在"首屏以下"的图片上。Hero 区域的图片应该去掉 lazy（用 `loading="eager"` 或不加该属性），因为它是首屏最关键的内容。

## 4. 列表过渡动画

数据从无到有时，用简单的入场动画避免生硬闪现：

```tsx
{/* 使用 framer-motion */}
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.05 } },
  }}
>
  {data.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      <Card>{item}</Card>
    </motion.div>
  ))}
</motion.div>
```

**staggerChildren: 0.05**：每项间隔 50ms 入场，列表项越多这个值越小（30 项时用 0.03，5 项时用 0.1）。

## 5. 最佳实践总结

| 状态 | 做什么 | 不做什么 |
|------|--------|---------|
| Loading | 骨架屏，结构和真实内容一致 | ❌ 转圈 spinner |
| Empty | 居中的 icon + 文字 + 可选 CTA | ❌ 直接空白页 |
| Error | 错误信息 + 重试按钮 | ❌ console.error 就不管了 |
| 图片加载中 | `bg-muted` 底色 + lazy loading | ❌ 图片区域空白闪跳 |

**核心原则**：用户不应该在页面上看到"空白"——如果内容没回来，骨架屏占位。如果是空数据列表，显示空状态。任何情况都有 UI 反应，不要"什么都没发生"。
