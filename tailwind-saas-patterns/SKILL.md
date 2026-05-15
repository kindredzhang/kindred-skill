---
name: tailwind-saas-patterns
description: >
  SaaS 项目的 Tailwind CSS 样式编排参考手册 + 项目脚手架。
  当用户要创建新项目并需要搭建样式体系（CSS变量/theme.css/tailwind.config）时，
  或者用户询问 Tailwind CSS 布局技巧、视觉效果实现、组件样式编写时，
  必须调用此 skill。即使是"我要初始化项目"、"怎么写样式"、"帮我搭个好看的结构"这类泛问题也应触发。
---

# Tailwind SaaS Patterns

这是一个参考手册 + 脚手架工具，用于在新建 Next.js SaaS 项目时用成熟的项目级 CSS 编排体系快速起步，并在后续开发中提供样式技巧查询。

## 体系总览

此技能基于 shadcn/ui 风格的 CSS 变量体系，核心链路：

```
theme.css (HSL 裸值)
  → globals.css (@import + @layer base 定义全局默认)
    → tailwind.config.ts (CSS 变量映射为语义类名)
      → lib/utils.ts (cn() 工具: clsx + tailwind-merge)
        → components/ui/* (Button, Card, Badge...)
          → components/blocks/* (Hero, Feature, Stats, CTA...)
            → app/page.tsx (最终组装)
```

## 两种操作模式

### 模式 A：脚手架模式

用户说"新建项目"、"初始化"、"搭个结构"时触发。按以下步骤执行：

1. **创建 CSS 变量体系**
   - 从 `templates/theme.css` 生成 `app/theme.css` — HSL 变量定义，含 `:root`（亮色）和 `.dark`（暗色）
   - 从 `templates/globals.css` 生成 `app/globals.css` — 引入 theme.css + Tailwind 指令 + base 层全局样式

2. **创建 Tailwind 配置**
   - 从 `templates/tailwind.config.ts` 生成 `tailwind.config.ts` — 语义色映射、动画、container
   - 从 `templates/lib/utils.ts` 生成 `lib/utils.ts` — cn() 工具函数

3. **创建基础 UI 组件示例**（可选，视用户需求而定）
   - 参考 templates/ui/ 下的文件（如果存在），或者直接在 SKILL.md 中给出模板

   > 组件模板已内嵌在此 SKILL.md 中，见下方"基础 UI 组件模板"章节

4. **创建 demo 落地页**
   - 从 `templates/blocks/` 生成完整的 landing page 区块组件到 `components/blocks/`
   - 生成一个演示用的 `app/page.tsx` 来组合这些区块

5. **更新 layout**
   - 设置 `<html suppressHydrationWarning>`
   - body 上挂 `fontSans.variable` + 类名: `min-h-screen bg-background font-sans antialiased`
   - 包裹 `<ThemeProvider attribute="class" disableTransitionOnChange>`

### 模式 B：参考手册模式

用户问"这个效果怎么写"、"布局怎么做"、"有什么技巧"时触发。根据问题类型读取对应参考文件：

- **布局与间距技巧** → 读取 `references/layout-and-spacing.md`
- **视觉效果技巧** → 读取 `references/visual-techniques.md`

回答问题时应：
- 直接给出 Tailwind 类名字符串，可复制即用
- 解释每个技巧的**为什么**（原理）而非只说"这么写"
- 结合实际场景举例，不要给孤立代码片段

---

## CSS 变量体系设计原则

（内嵌参考，无需额外文件）

### 变量存储格式

HSL 变量存成**三个空格分隔的值**（不包裹 `hsl()`），方便在 JS 中拼接透明度：

```css
--primary: 24.6 95% 53.1%;
/* 使用时: hsl(var(--primary))  → 纯色
          hsl(var(--primary) / 0.8)  → 80% 透明度（Tailwind 的 /{opacity} 语法） */
```

### 语义色命名规范

每个语义角色有一对 DEFAULT + foreground：

```
--{role}
--{role}-foreground
```

角色：`background`、`foreground`、`primary`、`secondary`、`muted`、`accent`、`destructive`、`card`、`popover`、`border`、`input`、`ring`

### 主题切换机制

`:root` 定义亮色值，`.dark` 定义暗色值，通过 `<html class="dark">` 切换。使用 `next-themes` 或自定义 ThemeProvider 来管理 class 切换。

### globals.css 的全局默认

```css
@layer base {
  * { @apply border-border; }        /* 所有元素有默认边框色 */
  body { @apply bg-background text-foreground; }  /* 页面基础背景/文字 */
}
```

---

## Tailwind Config Bridge 原则

```ts
// tailwind.config.ts 核心映射模式
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  },
  // ... 每个语义色同理
},
borderRadius: {
  lg: 'var(--radius)',
  md: 'calc(var(--radius) - 2px)',
  sm: 'calc(var(--radius) - 4px)'
}
```

所有颜色通过 `hsl(var(--x))` 映射，保证主题切换时所有引用类名（`bg-primary`、`text-muted-foreground`）自动响应。

`containers` 配置：居中、2rem padding、最大宽 1200px。

---

## 基础 UI 组件模板

### Button (CVA 变体模式)

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

核心要点：
- variant 里所有颜色引用**语义类名**（`bg-primary`, `hover:bg-accent`），不出现任何具体颜色值
- 透明度用 Tailwind 的 `/{opacity}` 语法（如 `hover:bg-primary/90`）
- CVA 的 className 通过 `cn()` 与外部传入的 className 合并

### Card (纯 className 模式)

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

核心要点：默认样式写在 `cn()` 的第一个参数里，外部 className 通过第二个参数覆盖。

---

## Scaffold 完成后告知用户

脚手架搭建完成后，输出以下信息给用户：

```
样式体系已搭建完毕。

使用的架构:
  ├── app/theme.css          — HSL 变量（亮色/暗色）
  ├── app/globals.css        — 全局样式导入 + @layer base
  ├── tailwind.config.ts     — CSS 变量 → 语义类名映射
  ├── lib/utils.ts           — cn() 工具函数
  ├── components/blocks/     — 落地页区块组件
  └── app/page.tsx           — demo 落地页

核心技巧:
  - 所有样式引用语义类名（bg-primary, text-muted-foreground），不写具体颜色
  - 所有 section 用 py-16 间距节奏
  - 响应式：手机默认单列，md: 两列，lg: 三列
  - 暗色模式: 改 theme.css 的 .dark 块

如需样式编写技巧，随时问我，我会查询参考文件给你指引。
```
