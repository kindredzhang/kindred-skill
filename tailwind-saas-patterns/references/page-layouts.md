# SaaS 页面布局模式

> 你的项目不只有 landing page。本文覆盖 Auth、Console、Dashboard、Admin、Blog 等常见页面的布局模式。

## 1. Auth 页面（登录/注册/找回密码）

最标准的居中卡片布局：

```tsx
<section className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
  <div className="flex w-full max-w-sm flex-col gap-6">
    {/* Logo + 项目名称 */}
    <a href="/" className="flex items-center gap-2 self-center font-medium">
      <Logo />
      project name
    </a>
    {/* Auth 表单 */}
    <SignForm />
  </div>
</section>
```

**关键模式**：
- `min-h-svh` — 视口全高（`svh` 是 stable viewport height，解决手机浏览器地址栏变化导致的高度跳动问题）
- `bg-muted p-6 md:p-10` — 背景与 padding，手机上 padding 更紧凑
- `max-w-sm` — 表单容器最大 384px，不会太宽
- `self-center font-medium` — logo 文字居中

**变形：验证码/OAuth 页面** — 结构完全一样，换表单组件即可。

## 2. Console 布局（侧边栏 + 内容区）

SaaS 中最常见的"用户后台"模式：

```tsx
<div className="container mx-auto py-8 md:max-w-7xl">
  <div className="w-full space-y-6 p-4 pb-16">
    {/* 桌面：左右排列 → 手机：上下堆叠 */}
    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">

      {/* 侧边导航 */}
      <aside className="-mx-4 lg:w-1/5">
        <SidebarNav items={sidebar.nav.items} />
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 lg:max-w-full">
        {children}
      </div>
    </div>
  </div>
</div>
```

**关键模式**：
- `container py-8 md:max-w-7xl` — 覆盖默认 container 的 1200px，让成控制台更宽
- `flex-col lg:flex-row lg:space-x-12 lg:space-y-0` — 手机上下叠、桌面左右分
- `-mx-4` — 抵消父容器 padding，让导航在手机上可以全宽可点击
- `lg:w-1/5` — 侧边栏占 1/5，剩余 4/5 给内容。这个比例最适合 SaaS 控制台

**如果侧边栏需要固定宽度**：
```tsx
<aside className="lg:w-48 xl:w-56 shrink-0">
```

`shrink-0` 防止侧边栏被压缩。

## 3. Dashboard 布局（可折叠侧边栏）

使用 shadcn/ui 的 Sidebar 组件（基于 `vaul` 实现）：

```tsx
"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function DashboardLayout({ children, sidebar }) {
  return (
    <SidebarProvider>
      {/* 侧边栏：可折叠 */}
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Header brand={sidebar.brand} />
        </SidebarHeader>
        <SidebarContent>
          <Nav nav={sidebar.nav} />
        </SidebarContent>
        <SidebarFooter>
          <User />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* 主内容 */}
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
```

**关键模式**：
- `SidebarProvider` 包裹整个布局，管理侧边栏状态
- `collapsible="icon"` — 可折叠为图标模式
- `SidebarRail` — 侧边栏边缘的"把手"，点击展开/收起
- `SidebarHeader` / `SidebarContent` / `SidebarFooter` — 三段式结构

**什么时候用 Console 布局 vs Dashboard 布局**：

| 场景 | 用哪个 | 原因 |
|------|--------|------|
| 用户设置/API Keys 页 | Console | 内容简单、不需要频繁切换 |
| 数据报表/项目管理 | Dashboard | 复杂导航、需要快速切换 |
| 后台管理 | Dashboard | 侧边栏项多、有层级 |

## 4. Blog 列表页（flex-wrap 布局）

不用 grid，用 `flex-wrap` + `w-1/3` 更灵活：

```tsx
<section className="py-16">
  <div className="container">
    <div className="flex flex-wrap items-start">
      {posts.map(post => (
        <a key={post.id}
          href={post.url}
          className="w-full p-4 md:w-1/2 lg:w-1/3"
        >
          <article className="flex flex-col overflow-clip rounded-xl border">
            {/* 封面图 */}
            {post.cover && (
              <img
                src={post.cover}
                alt={post.title}
                className="aspect-[16/9] h-full w-full object-cover"
              />
            )}
            {/* 内容 */}
            <div className="p-4">
              <h3 className="mb-3 text-lg font-semibold md:text-xl">
                {post.title}
              </h3>
              <p className="mb-3 text-muted-foreground">{post.description}</p>
              <p className="flex items-center text-sm hover:underline">
                阅读更多 →  {/* cursor pointer icon */}
              </p>
            </div>
          </article>
        </a>
      ))}
    </div>
  </div>
</section>
```

**flex-wrap vs grid 的选择**：

| 场景 | 用 flex-wrap | 用 grid |
|------|-------------|---------|
| 卡片大小不同 | ✅ flex | ❌ grid |
| 需要 flex-1 拉伸 | ✅ flex | ❌ |
| 等宽卡片 | ✅ flex 也可 | ✅ grid 更简洁 |
| 需要 gap 控制 | ✅ | ✅ |
| 每列不想写 `w-1/3` | ❌ | ✅ `grid-cols-3` |

**优先用 grid**，只有在卡片内容不同、需要 flex 控制时才用 flex-wrap。

## 5. Blog 详情页（文章正文布局）

```tsx
<article className="prose prose-lg mx-auto max-w-3xl px-4 py-12 dark:prose-invert">
  {/* 面包屑 */}
  <nav className="mb-8 text-sm text-muted-foreground">
    <a href="/blog">Blog</a> / <span>当前文章</span>
  </nav>

  {/* 封面 */}
  <img src={post.cover} alt="" className="mb-8 aspect-video rounded-xl object-cover" />

  {/* 文章标题 */}
  <h1 className="mb-2 text-4xl font-bold">{post.title}</h1>
  <p className="mb-8 text-muted-foreground">{post.date}</p>

  {/* 正文 */}
  <div className="prose-headings:scroll-mt-20">
    {post.content}
  </div>

  {/* 底部 CTA */}
  <div className="mt-16 border-t pt-8 text-center">
    <p className="text-muted-foreground">觉得有用？分享给朋友</p>
  </div>
</article>
```

**关键模式**：
- `prose prose-lg dark:prose-invert` — Tailwind Typography 插件，一键给文章正文加排版样式
- `max-w-3xl px-4` — 正文限制宽度，手机上左右留边
- `prose-headings:scroll-mt-20` — 锚点跳转时标题不贴顶

## 6. 区块组合策略

Landing page 由多个独立区块组成，每个可独立 disabled：

```tsx
export default function LandingPage() {
  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      {page.branding && <Branding section={page.branding} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />}
      {page.stats && <Stats section={page.stats} />}
      {page.pricing && <Pricing pricing={page.pricing} />}
      {page.testimonial && <Testimonial section={page.testimonial} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
```

**原则**：
- 每个区块是独立组件，通过 data prop 驱动
- 区块内部通过 `section.disabled` 判断是否渲染
- `section.name` 用于 id，支持锚点导航（`#pricing` → `<section id={section.name}>`）

**Header 和 Footer 放在 layout 层**，不在 page 中：
```tsx
// layout.tsx
<>
  {page.header && <Header header={page.header} />}
  <main className="overflow-x-hidden">{children}</main>
  {page.footer && <Footer footer={page.footer} />}
</>
```

## 7. 页面布局选择速查

```
新页面 → 先确定类型：

需要用户登录 → 验证是否有 session
  有 session:
    功能单一 → Console 布局（API Keys、设置）
    功能复杂 → Dashboard 布局（后台管理）
  无 session:
    用户主动操作 → Auth 布局（登录/注册）
    其他人访问 → 显示 401 空状态

不需要登录 → 
  内容展示 → Landing page 布局
  文章列表 → Blog 列表布局
  文章详情 → Blog 详情布局
  错误/空 → 居中空状态布局
```
