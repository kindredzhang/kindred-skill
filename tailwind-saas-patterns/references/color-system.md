# 色彩系统与搭配技巧

## 1. 快速判断：你的配色有没问题？

对照自查表（每条都是一个常见翻车点）：

| 问题 | 解决方法 |
|------|---------|
| "文字看不清" | `text-foreground` vs `text-muted-foreground` 选错。主内容用前者，辅助文字用后者 |
| "按钮颜色怪怪的" | `bg-primary` 用于主要操作按钮，次要操作用 `bg-secondary` 或 `outline` variant |
| "暗色模式瞎眼了" | `.dark` 中 `--foreground` 亮度太高，确保 dark 的 foreground 在 85-97% 之间 |
| "hover 效果没变化" | 用 `hover:bg-primary/90`（加透明度）而非 hover 时换色 |
| "加了个颜色整个页面不协调了" | 不要加新色，先用现有的 `muted` / `accent` / `secondary` 组合 |

## 2. 选择主色（primary）的黄金法则

HSL 选色口诀（以 shadcn/ui 的 CSS 变量格式理解）：

```
--primary: H  S%  L%;
```

- **H（色相 0-360）**：决定品牌调性
  - 0-15：红（热情、紧急）
  - 30-50：橙（活力、SaaS 常用）
  - 200-250：蓝（专业、信任、最安全的选择）
  - 260-300：紫（创意、高端）
- **S（饱和度）**：SaaS 项目 85-95% 之间最舒服，太饱和刺眼，太低没精神
- **L（亮度）**：浅色模式下 45-55%，深色模式下 40-50%

**懒人推荐**：如果不知道选什么色，`24.6 95% 53.1%`（橙）或 `221.2 83.2% 53.3%`（蓝）最安全。

## 3. 扩展语义色（添加新颜色）

场景：你想加一个 `bg-success` / `text-warning` 用于表单验证或 toast。

### v3 步骤

**theme.css 添加变量：**
```css
:root {
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}
.dark {
  --success: 142 70% 45%;
  --success-foreground: 0 0% 100%;
}
```

**tailwind.config.ts 添加映射：**
```ts
colors: {
  // ...现有颜色
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))'
  },
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))'
  },
}
```

### v4 步骤

**app.css 的 @theme inline 添加：**
```css
@theme inline {
  /* ...现有映射 */
  --color-success: hsl(var(--success));
  --color-success-foreground: hsl(var(--success-foreground));
  --color-warning: hsl(var(--warning));
  --color-warning-foreground: hsl(var(--warning-foreground));
}
```

**`:root` / `.dark` 添加变量裸值**（位置在 @theme inline 下方）：
```css
:root {
  /* ...现有变量 */
  --success: 142 76% 36%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 100%;
}
```

完成后即可使用：`bg-success` / `text-success-foreground` / `border-warning` / `bg-warning/80`。

> **原则：** 每新增一个语义角色，必须成对添加 `--{role}` + `--{role}-foreground`，缺一个就会在暗色模式翻车。

## 4. HSL → OKLCH 迁移

OKLCH 是比 HSL 更感知均匀的色彩空间。v4 天然支持。

```css
/* HSL 版本 */
--primary: 24.6 95% 53.1%;

/* OKLCH 版本（视觉上≈相同橙色） */
--primary: 0.62 0.23 42;

/* 使用方式完全不变 */
hsl(var(--primary))     →  oklch(var(--primary))
bg-primary/80            →  bg-primary/80（Tailwind 自动适配）
```

迁移原则：**先改变量值，逐步测试**，tailwind.config.ts / @theme inline 映射不用改。

## 5. 透明度叠加的两种方式

```tsx
{/* 方式一：Tailwind 类名（推荐，仅静态） */}
<Button className="bg-primary/80" />

{/* 方式二：style 属性（动态透明度需要 JS） */}
<div style={{ background: `hsl(var(--primary) / ${opacity})` }}>

{/* 方式三：CSS 变量间接控制 */}
<div className="bg-primary/80">          {/* 编译结果 ≈ hsl(var(--primary) / 0.8) */}
```

**规则**：静态透明度用类名（`bg-primary/80`），动态透明度走 style。

## 6. 常见的颜色踩坑

| 症状 | 原因 | 修法 |
|------|------|------|
| `bg-primary` 不显示 | CSS 变量格式不对 | 检查是 `--primary: 24.6 95% 53.1%`（裸值）而非 `hsl(24.6 95% 53.1%)` |
| 暗色模式按钮文字看不清 | `primary-foreground` 没调 | dark 模式下 `primary-foreground` 亮度要 > 90% |
| `hover:bg-primary/90` 无效 | CSS 变量值包裹了 `hsl()` | 改成裸值：`24.6 95% 53.1%` 而不是 `hsl(24.6 95% 53.1%)` |
| 渐变色不显示 | `bg-gradient-to-r from-primary to-transparent` 缺了 `bg-clip-text text-transparent`（如果是文字渐变） | 确认需求是背景渐变还是文字渐变 |
