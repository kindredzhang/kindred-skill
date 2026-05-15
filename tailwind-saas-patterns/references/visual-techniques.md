# 视觉效果技巧

## 1. 渐变文字

```tsx
<h1 className="text-4xl font-bold lg:text-7xl">
  普通文字
  <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
    高亮文字
  </span>
  普通文字
</h1>
```

**原理：**
- `bg-gradient-to-r from-primary to-primary`：渐变背景（即使起止颜色相同，也通过这个模式给文字"上色"，因为 bg-clip-text 会裁切背景到文字形状）
- `bg-clip-text`：将背景裁切到文字边界
- `text-transparent`：让文字本身透明，露出背后的渐变背景
- 如果想做真正的渐变文字（如橙色→紫色），改 `to-primary` 为其他色值

## 2. SVG 背景网格

适合 hero 区域做微妙的背景纹理：

```tsx
<svg
  className="absolute -z-50 opacity-25
    [mask-image:linear-gradient(to_right,white,transparent,transparent,white)]
    hidden lg:block"
  width="1920" height="1080" viewBox="0 0 1920 1080"
>
  {/* 水平线 */}
  <line y1="49.5" x2="1920" y2="49.5" className="stroke-muted-foreground" />
  {/* 垂直线 */}
  <line x1="49.6" y1="3.99" x2="49.7" y2="1084" className="stroke-muted-foreground" />
  {/* ...更多线条，每隔 50px 一条 */}
</svg>
```

**三个技巧组合使用：**
1. **`opacity-25`**：降低不透明度，让网格融入背景而非抢占视觉
2. **`[mask-image:linear-gradient(...)]`**：渐变遮罩，两侧可见、中间透明。避免网格覆盖到内容区
3. **`hidden lg:block`**：手机端不渲染，减少 DOM 节点数

所有 line 的 `stroke-muted-foreground` 确保线条颜色随主题自动适应。

## 3. 轮播/卡片容器的渐变边缘

适用于无限滚动的卡片列表，让卡片看起来从两侧"淡入淡出"：

```tsx
<Carousel className="relative
  before:absolute before:bottom-0 before:left-0 before:top-0 before:z-10 before:w-36
  before:bg-gradient-to-r before:from-background before:to-transparent
  after:absolute after:bottom-0 after:right-0 after:top-0 after:z-10 after:w-36
  after:bg-gradient-to-l after:from-background after:to-transparent"
>
  {/* 卡片列表 */}
</Carousel>
```

**关键点：**
- `before:` 和 `after:` 伪元素覆盖在轮播两侧
- `from-background` → `to-transparent`：遮罩从背景色渐变到透明。使用 `background` 语义色保证在亮/暗模式下都正确融合
- `w-36`：渐变宽度 144px，足够覆盖入口/出口
- `z-10`：在卡片之上，实现"遮罩"效果
- `pointer-events-none`（可加）：确保伪元素不阻挡点击

## 4. 卡片 Hover 图片缩放

```tsx
<a className="group flex flex-col rounded-xl border bg-card p-6">
  <div className="aspect-[3/2] overflow-clip rounded-xl">
    <div className="relative h-full w-full origin-bottom transition duration-300 group-hover:scale-105">
      <img src={src} className="h-full w-full object-cover" />
    </div>
  </div>
</a>
```

**参数选择依据：**
- `scale-105`（不是 110）：5% 的缩放足够产生动感但不过度
- `duration-300`：300ms，人眼能感知到的舒适时长
- `origin-bottom`：从底部放大，模拟"往上推"的自然动效
- `overflow-clip`：现代替代 `overflow-hidden`，GPU 渲染更友好

## 5. 头像堆叠

```tsx
<span className="inline-flex items-center -space-x-2">
  {users.map((_, i) => (
    <div key={i} className="size-10 rounded-full border-2 border-background bg-muted" />
  ))}
</span>
```

**说明：** `-space-x-2` 让相邻头像重叠 8px，每个头像的 `border-background` border 产生白色/背景色分隔带，形成堆叠效果。`-space-{n}` 是 Tailwind 内置的负间距工具。

## 6. 渐变背景区块

```tsx
<div className="bg-gradient-to-b from-primary/5 to-background rounded-xl p-12">
  {/* 内容 */}
</div>
```

**注意：** `from-primary/5` 极少量的主色叠加，产生极淡的品牌色背景。不要用深色覆盖，否则会影响内容可读性。

或者使用纯 `bg-muted` + `hover:bg-muted/80` 的改变来制造轻微的区块感。

## 7. 序号圆圈

用作步骤指示或 FAQ 编号：

```tsx
<span className="flex size-6 shrink-0 items-center justify-center
  rounded-sm border border-primary font-mono text-xs text-primary">
  {index + 1}
</span>
```

**样式选择原因：**
- `size-6`：28px 的小圆，不喧宾夺主
- `rounded-sm`：稍方，更显"功能性"（`rounded-full` 更活泼，用在步骤指引中）
- `font-mono`：等宽字体，数字更整齐
- `shrink-0`：防止 flex 容器挤压
- `border-primary text-primary`：品牌色轮廓

选中状态的序号：

```tsx
<span className="flex size-7 items-center justify-center rounded-full
  border bg-background font-mono text-xs font-medium
  group-data-[state=active]:bg-primary
  group-data-[state=active]:text-primary-foreground
  group-data-[state=active]:ring
  group-data-[state=active]:ring-primary/40">
  {index + 1}
</span>
```

选中时：背景填充品牌色 + 外发光（`ring-primary/40`），视觉权重瞬间提升。

## 8. 进度条动画

Accordion 展开时附带的进程指示：

```tsx
<div className="h-px bg-muted">
  <div
    className="h-px animate-progress bg-primary"
    style={{ animationDuration: `${interval}ms` }}
  />
</div>
```

**原理：** 一个 `h-px` 的极细横线，用 CSS animation 控制宽度变化（需要定义 `animate-progress` 关键帧），通过 `style` prop 的 `animationDuration` 动态控制动画周期。这个效果在 auto-play 场景中非常有用。

## 9. 暗色模式 Logo 切换

```tsx
<img src={logo} className="h-7 dark:invert" />
```

**`dark:invert`**：最简单的暗色 Logo 适应法。将亮色背景上的深色 Logo 颜色反转。适用于单色 Logo，彩色 Logo 需要单独准备暗色版本。

## 10. 文字截断

```tsx
// 截断 2 行
<p className="line-clamp-2 text-sm text-muted-foreground">

// 截断 3 行
<h3 className="line-clamp-3 break-words text-lg font-medium">
```

`line-clamp-{n}` 是 Tailwind 对 CSS `-webkit-line-clamp` 的封装。配合 `break-words` 防止长单词溢出。

## 11. Theme Toggle 图标交替

```tsx
{theme === "dark" ? (
  <BsSun className="text-lg text-muted-foreground" onClick={() => setTheme("light")} />
) : (
  <BsMoonStars className="text-lg text-muted-foreground" onClick={() => setTheme("dark")} />
)}
```

**颜色统一用 `text-muted-foreground`**，不是 black/white——这样在亮/暗模式下都视觉柔和。

## 12. 引用文字

```tsx
<q className="leading-7 text-muted-foreground">{content}</q>
```

使用语义化的 `<q>` 标签（而不是 `<p>` 加引号），浏览器自动加引号，同时保持语义正确。`leading-7` 增加行距便于阅读。
