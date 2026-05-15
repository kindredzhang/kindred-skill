# Tailwind CSS v4 迁移须知

## 核心变化

| 项目 | v3 | v4 |
|------|----|----|
| 配置方式 | `tailwind.config.ts` + `postcss.config.js` + CSS 文件 | **CSS-first** — 配置全写在 `app.css` 中 |
| 入口指令 | `@tailwind base/components/utilities` | `@import "tailwindcss"` |
| 颜色映射 | `tailwind.config.ts` → `colors: { primary: { DEFAULT: 'hsl(var(--primary))' } }` | `@theme inline { --color-primary: hsl(var(--primary)); }` |
| 暗色模式 | `darkMode: ["class"]` | `@custom-variant dark (&:is(.dark *));` |
| 动画定义 | `keyframes: {}` + `animation: {}` in tailwind.config.ts | `@theme inline` 中用 `--animate-xxx` + `@keyframes` |
| 插件机制 | `plugins: [require("tailwindcss-animate")]` | 内置，不再需要 tailwindcss-animate |

## 安装方式

```bash
# v4 使用 @tailwindcss/vite (Vite) 或 @tailwindcss/postcss (其他)
npm install tailwindcss @tailwindcss/vite

# vite.config.ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [tailwindcss()],
});
```

## 不需要的文件

v4 项目**不再需要**以下文件：
- `tailwind.config.ts`（配置已在 CSS 中）
- `postcss.config.js` 中的 tailwindcss 插件（如果使用 `@tailwindcss/vite`）

需要 `postcss.config.js` 的场景只有：
- 使用 `@tailwindcss/postcss`（非 Vite 项目）
- 项目同时使用了 Autoprefixer 等其他 PostCSS 插件
