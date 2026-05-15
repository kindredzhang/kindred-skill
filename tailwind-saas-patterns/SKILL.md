---
name: tailwind-saas-patterns
description: >
  Tailwind CSS 样式编排参考手册 + 项目脚手架。专为 CSS 不熟练者设计。
  当用户要搭建样式体系、问布局技巧、色彩搭配、动画实现、组件状态时触发。
  能自动检测项目是 Tailwind v3 还是 v4，并根据场景匹配最佳方案。
---

# Tailwind SaaS Patterns

## 步骤 0：项目检测

用户提到项目时，先检测 Tailwind 版本。

```bash
# 看 package.json
cat package.json | grep -E '"tailwindcss"' | head -3
```

- `"tailwindcss": "^3.x"` → **v3 模式**
- `"tailwindcss": "^4.x"` 或 没有 tailwind.config, 但有 `@import "tailwindcss"` → **v4 模式**

检测结果决定后续走 v3 还是 v4 路径。**如果项目不明确，按 v4 处理**。

### v3 vs v4 核心差异速查

| 项目 | v3 | v4 |
|------|----|----|
| 配置位置 | `tailwind.config.ts` | `app.css` 中的 `@theme inline` |
| 入口指令 | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| 暗色模式 | `darkMode: ["class"]` | `@custom-variant dark (&:where(.dark, .dark *));` |
| 插件 | `tailwindcss-animate` postcss 插件 | 内置，不需额外装 |
| 构建工具 | PostCSS 插件 | 推荐 `@tailwindcss/vite` |
| 容器查询 | 需额外装 `@tailwindcss/container-queries` | 内置 |
| cn() 版本 | tailwind-merge ^2.x | tailwind-merge ^3.x |

---

<DETECTED-V3>
## 模式 A：脚手架模式（v3 链路）

1. 创建 `app/theme.css` — 从 `templates/theme.css` 复制
2. 创建 `app/globals.css` — 从 `templates/globals.css` 复制（注意 @import theme.css）
3. 创建 `tailwind.config.ts` — 从 `templates/tailwind.config.ts` 复制
4. 创建 `lib/utils.ts` — 从 `templates/lib/utils.ts` 复制
5. UI 组件 / blocks / layout 更新 — 见下方通用步骤
</DETECTED-V3>

<DETECTED-V4>
## 模式 A：脚手架模式（v4 链路 — 默认）

1. 删除（或不创建）`tailwind.config.ts` — v4 不需要
2. 检查构建工具：
   - Vite → `npm install tailwindcss @tailwindcss/vite` → `vite.config.ts` 添加 `tailwindcss()` 插件
   - Next.js / PostCSS → `npm install tailwindcss @tailwindcss/postcss` → `postcss.config.js` 添加
3. 创建 `app/app.css`（或 `app/globals.css`）— 从 `templates/v4/app.css` 复制
   - 注意：用 `@import "tailwindcss"` 替代 `@tailwind` 指令
4. 创建 `lib/utils.ts` — 从 `templates/v4/lib/utils.ts` 复制（注意 tailwind-merge 版本 ^3.x）
5. 提醒用户阅读 `templates/v4/README-v4.md` 了解 v4 迁移要点
</DETECTED-V4>

### 通用步骤（v3 & v4 共用）

**layout.tsx 修改：**
```tsx
<html lang="zh-CN" suppressHydrationWarning>
<body className={`${sansFont.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
  <ThemeProvider attribute="class" disableTransitionOnChange>
    {children}
  </ThemeProvider>
</body>
```

**Button 组件**：参考内嵌在 SKILL.md 底部的 shadcn/ui Button 模板（适用于两个版本）。
**Card 组件**：同样见底部模板。

> **blocks 说明**：本 skill 提供的 blocks 只是结构演示（templates/blocks/*），实际使用时请用 shadcn/ui CLI 生成（`npx shadcn@latest add`），然后再在本 skill 的参考手册模式下查询拼合技巧。

---

## 模式 B：参考手册模式

用户问样式/布局/色彩/动画相关问题。**根据问题类型自动匹配最佳参考文档**：

### 场景匹配表

| 用户说（关键词） | 匹配文档 | 解决的核心问题 |
|-----------------|---------|--------------|
| "颜色" "配色" "换色" "加个颜色" "调色" | **`references/color-system.md`** | 选色原则、扩展语义色、HSL/OKLCH、透明度用法 |
| "动画" "入场" "动效" "过渡" "滚到才播" "shimmer" "marquee" "skeleton加载" | **`references/animation-and-motion.md`** | fade-in/fade-up、stagger、scroll-trigger、hover动效、reduce-motion |
| "布局" "排版" "对齐" "grid" "flex" "响应式" "间距" "移动端" "断点" | **`references/responsive-and-layout.md`** | grid系统、断点策略、flex布局、:has()、container queries、section间距 |
| "调试" "不生效" "没效果" "为什么" "样式冲突" "font" "字体" "变量" | **`references/practical-css-recipes.md`** | 调试方法、cn()版本匹配、@layer优先级、font loading、CSS变量技巧 |
| "skeleton" "loading" "空状态" "错误" "加载中" "骨架" | **`references/component-states.md`** | skeleton组件、三态渲染（loading/empty/error）、图片加载占位 |
| "v3 v4" "升级" "迁移" "版本" | **`references/practical-css-recipes.md`**（第7节）+ `templates/v4/README-v4.md` | 版本检测、迁移要点 |
| "视觉" "效果" "渐变" "背景" "网格" "头像堆叠" "图标" | **`references/visual-techniques.md`** | 渐变文字、SVG网格、轮播渐变边缘、暗色logo切换等 |
| "间距" "section" "container" "排版" "图文" "卡片" "nav" "header" | **`references/layout-and-spacing.md`** | section间距节奏、container、grid断点、图文排列、header/nav |
| "表单" "输入" "验证" "提交" "form" "table" "表格" "数据列表" | **`references/forms-and-tables.md`** | 表单宽度控制、字段类型、验证状态、提交按钮、数据表格空态、CRUD页面组合 |
| "登录" "注册" "auth" "控制台" "后台" "dashboard" "admin" "博客" "blog" | **`references/page-layouts.md`** | Auth居中卡片、Console侧边栏、Dashboard可折叠、Blog列表/详情、区块组合策略 |

### 多关键词匹配

如果用户的问题涉及多个领域（如"我做了个卡片列表动画，但加载时布局跳了"），按优先级读：

1. **先定位核心问题** — 上表加粗的部分
2. 读主要文档
3. 如果还涉及其他文档的内容，顺带提一句"XX方面可以看看 XX 文档"

---

## 模式 C：调试/诊断模式

用户说"不生效"、"报错"、"样式没出来"、"不知道哪里错了"时，按以下顺序排查：

### 快速诊断三板斧

**1. 先确认文件是否导入**
```
pages/_app.tsx 或 app/layout.tsx 中有没有 import "globals.css" 或 import "app.css"？
```
最简单也最常见的问题：文件名错了或者忘记 import。

**2. 确认 CSS 变量存在**
> 浏览器 DevTools → Elements → 选目标元素 → Computed → 搜 `--primary`
> 如果找不到 → 变量没定义。检查 theme.css/app.css 是否有 `:root` 块。

**3. 确认类名生效**
> DevTools → 看目标元素的 Styles 面板，搜 `bg-primary`
> 如果有但被划掉 → 被更高优先级的类名覆盖了（常见于 cn() 合并问题）。试 `!important` 临时确认。

### 各问题类型速查

| 症状 | 诊断入口 | 修复文档 |
|------|---------|---------|
| 颜色不对 | 先看变量值 → 看 tailwind 映射 | color-system.md |
| 布局乱了 | 看断点 → 看 gap 数值 → 看容器宽度 | responsive-and-layout.md |
| 动画没播 | 看 keyframe 名称 → 看 animation 引用名 | animation-and-motion.md |
| 类名合并有问题 | 查 tailwind-merge 版本 | practical-css-recipes.md（第3节） |

---

## CSS 变量体系总览

```
theme.css (HSL 裸值) 或 v4 app.css (:root + .dark)
  → @import 到 globals.css 或直接在 app.css 中
    → v3: tailwind.config.ts 中映射为语义色
    → v4: @theme inline { --color-*: hsl(var(--*)) }
      → lib/utils.ts cn() 工具
        → components/ui/* (Button, Card...)
          → app/page.tsx
```

### 变量设计原则

- **HSL 存裸值**（不含 `hsl()` 包裹），方便拼透明度：`hsl(var(--primary) / 0.8)`
- **语义色成对出现**：每个 `--{role}` 都有 `--{role}-foreground`
- **亮暗色统一变量名**：`:root` 亮、`.dark` 暗，引用方不变

布局/视觉/颜色等细分技巧直接看对应的 reference 文件。

---

## 基础 UI 组件模板

### Button（两个版本通用）

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

### Card（两个版本通用）

```tsx
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )} {...props} />
  )
)
```
