# 响应式布局与高级 CSS 技巧

## 1. 断点速查表

Tailwind 默认断点（**移动端优先**，基准样式给手机，用前缀覆盖大屏）：

| 断点 | 最小宽度 | 适用场景 |
|------|---------|---------|
| (无) | 0 | 手机默认 — 所有基础样式无前缀 |
| `sm:` | 640px | **按钮组**从纵向变横向 |
| `md:` | 768px | **简单内容**排多列（Stats、CTA 文字放大） |
| `lg:` | 1024px | **复杂内容**开多列（卡片网格、图文混排、桌面导航） |
| `xl:` | 1280px | 更宽的 content、多列 layout（较少用） |
| `2xl:` | 1536px | 超大内容区（Carousel 边缘计算） |

**核心原则**：先写手机版样式，用 `sm:` `md:` `lg:` 前缀逐级覆盖。

### 断点选择的实战逻辑

不要随意选断点。参考真实 SaaS 项目的选择规则：

| 内容复杂度 | 用哪个断点 | 为什么 |
|-----------|-----------|--------|
| 按钮组（`flex-col` → `flex-row`） | **`sm:`** | 按钮很窄，640px 以上完全能横排 |
| 简单 grid（Stats 数据、Logo 墙） | **`md:`** | 3 个数字不需要大空间，768px 够用 |
| CTA 标题放大 | **`md:`** | CTA 内容少，不等到 1024px |
| 多列卡片（Feature、Testimonial） | **`lg:`** | 卡片内容多，1024px 才能容纳好看 |
| 桌面导航 | **`lg:`** | 导航有下拉菜单、多级结构 |
| 页面标题放大 | **`lg:`** | 标题是视觉焦点，大屏才需要放大 |

**口诀**：内容简单选小断点（`sm`/`md`），内容复杂选大断点（`lg`）。

### 反向断点（控制上限）

```tsx
{/* 手机专属内容 */}
<div className="block lg:hidden">手机导航（Sheet 抽屉）</div>

{/* 桌面专属内容 */}
<div className="hidden lg:flex">桌面导航（NavigationMenu）</div>

{/* 手机纵向，桌面横向 */}
<div className="max-md:flex-col md:flex-row">
```

`max-*` 断点是 v3.2+ 支持的，`max-md:` ≈ "手机端"。同一个元素用 `hidden lg:flex` / `hidden lg:block` 来切换两种完全不同的布局。

## 2. 断点选择速查

不确定该用哪个？直接对号入座：

```
按钮布局  → sm:
简单grid  → md:
复杂grid  → lg:
CTA/数据  → md:
标题放大  → lg:
桌面导航  → lg:
```

## 3. Section 间距节奏体系

所有页面区块使用统一垂直间距：

```tsx
<section className="py-16">     // 标准（Feature, Stats, FAQ, CTA, Testimonial...）
<section className="py-24">     // 强调（Hero — 更大视觉权重）
<section className="py-32">     // 特例（Feature2 — 左右结构+轮播，内容最复杂）
<section className="py-8">      // 紧凑（Banner, 公告栏）
```

**重要**：`py-16` 是默认值，覆盖绝大多区块。只在需要明显视觉区分时用 `py-24` / `py-32`（参考项目只 Feature2 用了 `py-32`—— 它的内容最复杂：Accordion + 同步轮播）。

## 4. Grid 布局三板斧

### 等宽卡片网格（最常用）
```tsx
{/* 手机：1列 → 平板：2列 → 桌面：3列 */}
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>
```

### 图文混排（内容区 + 图片）
```tsx
{/* 手机：图片在上文字在下 → 桌面：左右对称 */}
<div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
  <div>文字</div>
  <div>图片</div>
</div>
```

**图片在右 vs 交替排列：**
```tsx
{items.map((item, i) => (
  <div key={i} className="grid items-center gap-8 lg:grid-cols-2">
    <div className={i % 2 === 0 ? "order-1" : "order-2"}>文字</div>
    <div className={i % 2 === 0 ? "order-2" : "order-1"}>图片</div>
  </div>
))}
```

`order-1`/`order-2` 在 lg 断点下交换左右位置。

### 数据展示 Stats Grid
```tsx
{/* 手机：1列 → 桌面：3列（用 md: 因为内容简单） */}
<div className="grid gap-10 md:grid-cols-3 lg:gap-0">
  {items.map(item => (
    <div className="text-center">
      <p className="text-lg font-semibold text-muted-foreground">{item.label}</p>
      <p className="pt-2 text-7xl font-semibold text-primary">{item.value}</p>
    </div>
  ))}
</div>
```

Stats 用 `md:` 因为数据项简单（一个标签 + 一个巨大数字），不需要等到 lg 才排 3 列。

### 不规则网格（dashboard）
```tsx
<div className="grid grid-cols-4 gap-4">
  <div className="col-span-4 md:col-span-2 lg:col-span-1">侧边栏</div>
  <div className="col-span-4 lg:col-span-3">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">主区域</div>
      <div>卡片1</div>
      <div>卡片2</div>
    </div>
  </div>
</div>
```

## 5. Container 的三种用法

参考项目中实际出现了三种 container 策略：

```tsx
{/* 1. 标准 container（居中 + 2rem padding + 1200px max）—— 90% 场景 */}
<section className="py-16">
  <div className="container">
    {/* Feature, Stats, FAQ, Pricing... */}
  </div>
</section>

{/* 2. 手动控制宽度（Footer — 比 container 更宽） */}
<section className="py-16">
  <div className="mx-auto max-w-7xl px-8">
    <footer>...</footer>
  </div>
</section>

{/* 3. 脱离 container（CTA — 全宽彩色背景板 + 内层约束） */}
<section className="py-16">
  <div className="px-8">
    <div className="rounded-2xl bg-muted px-8 py-16 text-center">
      <div className="mx-auto max-w-screen-md">
        <h2>...</h2>
        <p>...</p>
      </div>
    </div>
  </div>
</section>
```

**什么时候用哪种**：
- 标准内容 → `container`
- 需要宽一点 → `max-w-7xl mx-auto px-8`
- 全宽背景 + 内层约束 → `px-8` + 内层 `max-w-screen-md`

Stats 区块的小技巧：当 `container` 限制了 grid 宽度导致看起来不够宽时，加 `w-full`：
```tsx
<div className="container flex flex-col items-center gap-4">
  <h2>...</h2>
  <div className="w-full grid gap-10 md:grid-cols-3">
    {/* w-full 确保 grid 撑满 container 宽度 */}
```

## 6. 响应式文字系统

```tsx
{/* 区块标题 — lg: 放大 */}
<h2 className="text-3xl font-bold lg:text-4xl xl:text-5xl">

{/* Hero 标题 — lg: 大幅放大 */}
<h1 className="text-4xl font-bold lg:text-7xl">

{/* CTA 标题 — md: 提前放大（CTA 内容少，不等 lg） */}
<h2 className="text-3xl font-semibold md:text-5xl">

{/* 描述 — lg: 放大 */}
<p className="text-muted-foreground lg:text-lg">

{/* 元信息 — 不变 */}
<p className="text-sm text-muted-foreground">

{/* 卡片标题 — 不变（卡片在 grid 中空间固定） */}
<h3 className="text-xl font-semibold">
```

**text-balance / text-pretty**：
```tsx
<h2 className="text-balance">     {/* 标题最后一行不孤零零一个词 */}
<p className="text-pretty">       {/* 类似，更柔和 */}
```

## 7. 双布局模式：同一个组件，不同的响应式布局

场景：桌面和手机差的不仅仅是样式，DOM 结构也需要完全不同。

参考 Feature3（Tabs 区块）的做法：
```tsx
{/* 手机版：序号列表 + 行内图片 */}
<div className="lg:hidden">
  {items.map(item => (
    <div>
      <span>序号</span>
      <div>{item.title}</div>
      {/* 图片直接在文本下方 */}
      {item.image && <img src={item.image.src} />}
    </div>
  ))}
</div>

{/* 桌面版：Tab 标签 + 独立图片展示区 */}
<div className="hidden lg:block">
  <Tabs>
    <TabsList>
      <TabsTrigger>标签1</TabsTrigger>
      <TabsTrigger>标签2</TabsTrigger>
    </TabsList>
    <TabsContent>
      <img src={...} />
    </TabsContent>
  </Tabs>
</div>
```

**什么时候用这种模式**：显示同一批数据，但手机和桌面需要的交互方式完全不同时（比如 Tabs → 纵向列表）。

## 8. Header 响应式（桌面 Nav + 手机 Sheet）

```tsx
<header>
  <nav className="hidden justify-between lg:flex">
    {/* 桌面版：完整 NavigationMenu */}
  </nav>

  <div className="block lg:hidden">
    {/* 手机版：Logo + Sheet 触发器 */}
    <Sheet>
      <SheetTrigger>
        <Menu />
      </SheetTrigger>
      <SheetContent>
        {/* 手机版导航列表 */}
      </SheetContent>
    </Sheet>
  </div>
</header>
```

这个模式在所有 SaaS 项目中都一样：`hidden lg:flex` / `block lg:hidden`。

## 9. Flex 布局进阶

### 自适应间距（gap 层级体系）

| 密集程度 | gap 值 | 适用场景 |
|---------|--------|---------|
| 紧凑 | `gap-4` | 表单、按钮组、标签 |
| 标准 | `gap-6` / `gap-8` | 卡片网格、导航链接 |
| 宽松 | `gap-10` | Features 区块 |
| 稀疏 | `gap-16` / `gap-20` | 图文混排，Footer 列 |

### shrink-0 用法（防止 flex 子元素被挤压）

```tsx
{/* 图标容器：防止图标被文字挤小 */}
<div className="flex shrink-0 items-center justify-center size-16">
  <Icon />
</div>

{/* 标签徽标：防止被标题挤压 */}
<div className="flex items-center gap-2">
  <h3 className="text-xl font-semibold">{title}</h3>
  <div className="flex-1"></div>
  <Badge className="shrink-0">热门</Badge>
</div>
```

### flex-1 作为 Spacer

```tsx
{/* flex-1 比 justify-between 更灵活（右侧条件渲染时不影响左侧） */}
<div className="flex items-center gap-2">
  <h3>{title}</h3>
  <div className="flex-1"></div>
  {showBadge && <Badge>热门</Badge>}
</div>
```

### 响应式 flex 方向

```tsx
{/* Hero 按钮：手机纵向、sm 以上横向 */}
<div className="flex flex-col gap-4 sm:flex-row">

{/* Footer 版权信息：手机居中、桌面左对齐 */}
<div className="flex flex-col gap-4 text-center lg:flex-row lg:items-center lg:text-left">

{/* Footer 整体：手机垂直居中、桌面水平分开 */}
<div className="flex flex-col items-center gap-10 text-center lg:flex-row lg:text-left">
```

## 10. 按钮组响应式

所有区块中的按钮区域统一模式：

```tsx
<div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
  <Button size="lg">主要操作</Button>
  <Button size="lg" variant="ghost">次要操作</Button>
</div>
```

`flex-col sm:flex-row` — 手机纵向堆叠，640px 以上横向排列。gap 用 `gap-4`（16px）为标准。

## 11. Carousel 边缘到边缘设计

Showcase 区块中的轮播突破了 container 限制：

```tsx
<Carousel>
  <CarouselContent className="container
    ml-[calc(theme(container.padding)-20px)]
    mr-[calc(theme(container.padding))]
    2xl:ml-[calc(50vw-700px+theme(container.padding)-20px)]
    2xl:mr-[calc(50vw-700px+theme(container.padding))]">

    <CarouselItem className="max-w-[320px] pl-[20px] lg:max-w-[360px]">
```

**原理**：轮播列表以 container 为基准左对齐，但内容可以超出右侧。大屏上通过 2xl 的 calc 计算让轮播"居中但左侧对齐 container"。这是高级用法，只在英雄级板块使用。

## 12. Container Queries（容器查询）

vs Viewport 断点：容器查询基于**父容器宽度**而非视口宽度。

```tsx
<div className="@container">
  <div className="@lg:grid-cols-3 @md:grid-cols-2 grid-cols-1 grid gap-4">
```

**启用方式**：

v3（安装插件）：
```bash
npm install @tailwindcss/container-queries
```
```ts
// tailwind.config.ts
plugins: [require("@tailwindcss/container-queries")]
```

v4（内置）：
```tsx
<div className="@container">
  <p className="@lg:text-xl text-sm">在宽容器内字变大</p>
</div>
```

**什么场景用**：可复用的 Section/Block 组件（Feature、Stats）在页面不同位置使用，宽窄不一致时。

## 13. `:has()` 选择器技巧

```tsx
{/* 卡片内 active 时加边框 */}
<div className="has-[[data-state=active]]:border-primary rounded-lg border p-4">

{/* 输入框验证错误时变 label 颜色 */}
<div className="has-[input[aria-invalid=true]]:text-destructive">
  <label>Email</label>
  <input aria-invalid={hasError} />
</div>

{/* 表单 loading 时透明 */}
<form className="has-[[data-loading=true]]:opacity-50 has-[[data-loading=true]]:pointer-events-none">
  <Button data-loading={isLoading}>提交</Button>
</form>
```

`has-[]` 在 tailwind v3.4+ 和 v4 中都支持。
