# 布局与间距技巧

## 1. 一致的 Section 间距节奏

所有页面区块使用相同的基础垂直间距，只在关键区块上做差异化：

```tsx
<section className="py-16">    // 标准间距（Feature, Stats, FAQ, CTA, Testimonial...）
<section className="py-24">    // Hero — 更大视觉权重
<section className="py-32">    // 特例块 — 内容更丰富时使用
```

**为什么：** 用户滚动时会建立心理预期，一致 = 整齐。偏离常规的间距值只在确实需要强调时才使用。

## 2. Container 系统

```tsx
<div className="container">
  // 内容区域，居中、最大宽 1200px、左右 2rem padding
</div>
```

Container 配置在 tailwind.config.ts 中：
```ts
container: {
  center: true,
  padding: "2rem",
  screens: { "2xl": "1200px" },
},
```

需要突破容器限制时（如 CTA 全宽背景）：
```tsx
<section className="py-16">
  <div className="px-8">                           // 脱离 container，手动控制 padding
    <div className="rounded-2xl bg-muted p-16">    // 背景全宽圆角容器
      <div className="mx-auto max-w-screen-md">    // 内层内容重新约束宽度
        ...
      </div>
    </div>
  </div>
</section>
```

## 3. Grid 布局的经典断点组合

移动端默认单列，tablet 两列，desktop 三列：

```tsx
// 三列特征卡片
<div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">

// 两列 FAQ/图文混排
<div className="grid gap-8 md:grid-cols-2 md:gap-12">
```

**间距选择：** 密集内容（卡片网格）→ `gap-10`；稀疏内容（图文）→ `gap-20`。根据视觉密度调整。

## 4. 图文并列排列

```tsx
<div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
  <img className="w-full rounded-md object-cover" />
  <div className="flex flex-col">
    <h2 className="text-3xl font-bold lg:text-4xl">...</h2>
    <p className="text-muted-foreground lg:text-lg">...</p>
  </div>
</div>
```

**Key：** `items-center` 使图文垂直居中对齐，`gap-8` 手机上、`lg:gap-16` 桌面拉开间距。

## 5. Typography 排版模板

每个 section 的文字层级：

```tsx
// 标题
<h2 className="mb-4 text-pretty text-3xl font-bold lg:text-4xl">
  {title}
</h2>

// 描述
<p className="max-w-xl text-muted-foreground lg:max-w-none lg:text-lg">
  {description}
</p>

// 标签（小标签徽标）
<span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary">
  {label}
</span>

// 元信息（日期、次要文字）
<p className="text-sm text-muted-foreground">...</p>
```

- `text-pretty`：防止标题最后一行孤零零一个单词
- `max-w-xl lg:max-w-none`：手机上限制宽度方便阅读，桌面展开
- `text-muted-foreground`：描述文字统一用淡色，和标题区分

## 6. 文字 + 徽标对齐布局

```tsx
<div className="flex items-center gap-2 mb-4">
  <h3 className="text-xl font-semibold">{title}</h3>
  <div className="flex-1"></div>    {/* 空 flex-1 spacer */}
  <Badge>热门</Badge>
</div>
```

**空 `flex-1` div 作间隔** — 比 `justify-between` 更灵活，当右侧元素可选显示时不影响左侧。

## 7. 卡片排版

```tsx
<div className="flex flex-col rounded-lg border bg-card text-card-foreground p-6">
  {/* 固定高度图片区域 */}
  <div className="aspect-[3/2] overflow-clip rounded-xl">
    <img className="h-full w-full object-cover" />
  </div>

  {/* 标题 — 截断多行 */}
  <h3 className="line-clamp-3 break-words pt-4 text-lg font-medium">
    {title}
  </h3>

  {/* 描述 — 截断 2 行 */}
  <p className="line-clamp-2 text-sm text-muted-foreground">
    {description}
  </p>
</div>
```

- `line-clamp-{n}`：文字超出 n 行时截断显示 `...`
- `aspect-[3/2]`：固定宽高比
- `overflow-clip`：比 `overflow-hidden` 更新的写法，GPU 友好

## 8. 响应式 Flexbox 布局

```tsx
// Footer: 手机上垂直 → 桌面水平
<div className="flex flex-col items-center justify-between gap-10
  text-center lg:flex-row lg:text-left">

// Hero 操作按钮: 手机上纵向 → 桌面横向
<div className="flex flex-col items-center gap-4 sm:flex-row">

// 头像堆叠
<span className="inline-flex items-center -space-x-2">
```

**原则：** 默认值设计为移动端布局（垂直/居中），`lg:` 或 `sm:` 断点才展开。

## 9. Navigation 菜单模式

```tsx
// 桌面导航
<nav className="hidden lg:flex">...</nav>

// 手机侧边栏
<div className="block lg:hidden">
  <Sheet>
    <SheetTrigger><Menu /></SheetTrigger>
    <SheetContent>...</SheetContent>
  </Sheet>
</div>
```

用 `hidden lg:flex` + `block lg:hidden` 实现导航的桌面/移动切换。

## 10. Header 布局

```tsx
<nav className="flex items-center justify-between">
  <div className="flex items-center gap-6">       {/* 左侧：Logo + 导航 */}
    <Logo />
    <NavigationMenu>...</NavigationMenu>
  </div>
  <div className="flex shrink-0 items-center gap-2"> {/* 右侧：按钮 + 主题切换 */}
    <ThemeToggle />
    <Button>...</Button>
  </div>
</nav>
```

**Key:** 两侧使用 `flex`，中间不写 `justify-between` 而是靠 `flex-1` 或自然撑开。

## 11. Stats 数据展示

```tsx
<div className="text-center">
  <p className="text-lg font-semibold text-muted-foreground">  {/* 标签在上 */}
    {item.label}
  </p>
  <p className="pt-2 text-7xl font-semibold text-primary lg:pt-4">  {/* 数字在下 */}
    {item.value}
  </p>
</div>
```

数据展示的层级：**小字标签 → 巨大的数字**，视觉冲击力来自 `text-7xl`。

## 12. Hover 效果

```tsx
// 导航链接 hover
className="hover:bg-accent hover:text-accent-foreground transition-colors"

// 卡片图片 hover 放大
<div className="group">
  <div className="overflow-clip rounded-xl">
    <img className="origin-bottom transition duration-300 group-hover:scale-105" />
  </div>
</div>
```

- `transition-colors`：仅颜色过渡，性能更好
- `origin-bottom`：从底部放大（图片内容向上扩展）
- `duration-300`：300ms，刚好让人感知到又不会觉得慢
