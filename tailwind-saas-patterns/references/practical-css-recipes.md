# 实战 CSS recipes

> 这部分包含你不会在日常看教程里学到的"实战经验"——CSS 变量用法、调试方法、常见翻车修复。

## 1. CSS 变量调试速查

写了一个 `bg-primary` 但没效果？一步步查：

| 步骤 | 检查什么 | 命令/操作 |
|------|---------|----------|
| 1 | CSS 变量定义了没？ | 浏览器 DevTools → Elements → Computed → 搜 `--primary` |
| 2 | 变量值是裸值还是 `hsl()` 包裹？ | 裸值：`24.6 95% 53.1%`（正确）。`hsl(24.6 95% 53.1%)`（错——/opacity 语法失效）|
| 3 | tailwind.config.ts 映射对了没(v3)？ | 搜 `hsl(var(--primary))` 确认键名正确 |
| 4 | app.css 导入了没？ | 确认 `_app.tsx` 或 `layout.tsx` 中有 `import "./app.css"` |
| 5 | 是不是被其他类名覆盖了？ | DevTools 看 computed styles，检查有没有 `tailwind-merge` 冲突 |

**CSS 变量未生效的 3 个最常见原因**：
1. 变量名拼写错（`--primay` vs `--primary`）
2. 变量值包裹了 `hsl()`（导致 `/opacity` 失效）
3. 文件没被 import（Next.js 中 theme.css 要 import 到 globals.css，再 import 到 layout）

## 2. @layer 优先级（v3 & v4 通用）

```css
@layer base {
  /* 最低优先级 — 最先被组件样式覆盖 */
  * { @apply border-border; }
}

@layer components {
  /* 中间优先级 */
  .btn { @apply rounded-lg; }
}

@layer utilities {
  /* 最高优先级 */
  .text-shadow { text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
}
```

**你只需要记住**：所有全局默认放 `@layer base`（一定会被组件类名覆盖）。如果你有样式要覆盖组件默认，放 `@layer utilities` 或直接用 `!important`。

**注意**：外部 import 的 CSS（如 node_modules 中的第三方组件库）优先级高于 `@layer base`。如果第三方组件的 border 颜色不对，不要用 base layer 去改，用 utility 覆盖或直接改组件。

## 3. cn() 调试

```tsx
// 如果你看到两个类名没被正确合并：
<div className={cn("px-4 py-2", "px-6")} />
// → twMerge 会判断 px-4 和 px-6 冲突，保留 px-6
// → 结果: "py-2 px-6"

// 但如果类名不同属性但没法去，问题可能出在 tailwind-merge 版本
// tailwind-merge v2.x 才能正确识别 v3 class
// tailwind-merge v3.x 才能正确识别 v4 class
```

**版本匹配**：
```json
// v3 项目
"tailwind-merge": "^2.6.0"

// v4 项目
"tailwind-merge": "^3.0.0"
```

版本不对会导致 cn() 无法正确合并类名。如果发现 `cn("text-lg", "text-xl")` 没有保留最后一个，先检查 tailwind-merge 版本。

## 4. Font Loading 策略（避免布局偏移）

### 使用 next/font（Next.js 项目）

```tsx
// app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${sansFont.variable} ${monoFont.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**CSS 变量桥接**（把 next/font 的变量连接到 Tailwind）：

```css
/* v3 — tailwind.config.ts */
fontFamily: {
  sans: ["var(--font-sans)", ...fontFamily.sans],
  mono: ["var(--font-mono)", ...fontFamily.mono],
}

/* v4 — app.css @theme inline */
@theme inline {
  --font-sans: var(--font-sans-family), ui-sans-serif, system-ui;
  --font-mono: var(--font-mono-family), ui-monospace, SFMono-Regular;
}
```

之后就可用 `font-sans` / `font-mono` 类名了。

## 5. CSS 变量作为"状态信号"（高级技巧）

不用 JS 条件 className，用 CSS 变量在父级控制子元素状态：

```tsx
{/* 父级通过 data attribute 标记状态 */}
<div data-loading={true} data-error={hasError}>
  <form className="[&>button]:opacity-[var(--btn-opacity,1)]">
    <Button type="submit">提交</Button>
  </form>
</div>
```

```css
/* 在 CSS 中统一控制 */
[data-loading="true"] { --btn-opacity: 0.5; }
[data-error="true"]   { --btn-opacity: 1; --btn-color: var(--destructive); }
```

**场景**：表单 loading 时整组按钮变灰、error 时保持可点击但变色。不用在每个按钮写条件 className。

## 6. 实用 CSS 工具

### 截断文字
```tsx
{/* 单行截断 */}
<p className="truncate max-w-48">

{/* 多行截断（v1.4+） */}
<p className="line-clamp-2">
<p className="line-clamp-3">
```

### 滚动行为
```tsx
{/* 禁止 overscroll */}
<div className="overscroll-none">

{/* 触摸滚动时 momentum 平滑 */}
<div className="overscroll-auto">

{/* 防止页面滚动穿透（弹窗打开时） */}
<body className="overflow-hidden">  {/* JS 动态加 */}
```

### 图片比例控制
```tsx
{/* 固定宽高比 */}
<div className="aspect-video">      {/* 16:9 */}
<div className="aspect-square">     {/* 1:1 */}
<div className="aspect-[3/2]">      {/* 自定义 */}
<div className="aspect-[4/3]">
```

### 安全边距（iPhone 刘海屏）
```tsx
<div className="pb-safe-bottom">    {/* 需要 tailwind.config 扩展 */}
```

如需此项，在 tailwind.config.ts 或 @theme 中添加：
```ts
// v3
extend: {
  padding: {
    'safe-bottom': 'env(safe-area-inset-bottom)',
  }
}

// v4
@theme { --spacing-safe-bottom: env(safe-area-inset-bottom); }
```

## 7. 检测 Tailwind 版本

```bash
# 看 package.json 中的依赖
cat package.json | grep -E '"tailwindcss"'

# 如果输出
"tailwindcss": "^3.4.0"    → v3
"tailwindcss": "^4.0.0"    → v4

# 或用 CLI
npx tailwindcss --help | head -1
# 会输出 tailwindcss v4.x.x 或 v3.x.x
```

**v3 vs v4 快速判断**：项目根目录有 `tailwind.config.{ts,js}` 且有 `postcss.config.js` 引用 `tailwindcss` 插件 → v3。没有 config 文件、CSS 中用 `@import "tailwindcss"` → v4。
