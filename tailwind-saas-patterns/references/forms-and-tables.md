# 表单与数据表格

> SaaS 项目中除了 landing page，你写得最多的就是表单和表格。本文覆盖它们的布局控制、状态变化、和交互细节。

## 1. 表单宽度控制

表单宽度不要太宽，否则用户眼睛需要扫很长的距离。

### 标准宽度策略

```tsx
{/* 手机上全宽 → 平板 1/2 → 桌面 1/3 */}
<form className="w-full space-y-6 md:w-1/2 lg:w-1/3 px-2 pb-8">
```

| 场景 | 推荐宽度 | 原因 |
|------|---------|------|
| 简单表单（登录、注册） | `max-w-sm` | 仅 email + password，窄就够了 |
| 中等表单（设置、API Key创建） | `w-full md:w-1/2 lg:w-1/3` | 字段适中，桌面 1/3 最舒服 |
| 复杂表单（详情编辑、发帖） | `max-w-2xl` 或 `w-full` | 字段很多，需要更多空间 |

### 表单字段分组

```tsx
<div className="grid gap-6 md:grid-cols-2">
  <div className="space-y-2">
    <Label>姓</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>名</Label>
    <Input />
  </div>
</div>
```

同一行的字段用 grid 分两列，关系紧密的字段排在一起。

## 2. 表单字段类型

标准的字段渲染模式（支持动态表单）：

```tsx
{/* 普通输入框 */}
<Input type="text" placeholder="请输入..." />

{/* 文本域 */}
<Textarea placeholder="详细描述..." />

{/* 下拉选择 */}
<Select>
  <SelectTrigger>
    <SelectValue placeholder="选择一项" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">选项一</SelectItem>
    <SelectItem value="2">选项二</SelectItem>
  </SelectContent>
</Select>

{/* Markdown 编辑器 */}
<MarkdownEditor value={content} onChange={setContent} />
```

## 3. 表单验证状态

使用 react-hook-form + zod 时的标准结构：

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      {/* 标签 + 必填标记 */}
      <FormLabel>
        Email
        <span className="text-destructive ml-1">*</span>
      </FormLabel>

      {/* 输入控件 */}
      <FormControl>
        <Input type="email" placeholder="you@example.com" {...field} />
      </FormControl>

      {/* 帮助文字 */}
      <FormDescription>
        我们将通过该邮箱与你联系
      </FormDescription>

      {/* 错误提示 — 自动显示验证失败信息 */}
      <FormMessage />
    </FormItem>
  )}
/>
```

**关键 state 类名**（Tailwind 自动应用）：
- `aria-invalid="true"` — 输入框加红色边框（shadcn/ui Input 已经默认支持）
- `has-[input[aria-invalid=true]]:text-destructive` — 父元素上的 label 变红色

## 4. 提交按钮状态

```tsx
<Button
  type="submit"
  className="flex items-center justify-center gap-2 font-semibold"
  disabled={loading}
>
  {loading ? (
    <>
      <Loader className="h-4 w-4 animate-spin" />
      提交中...
    </>
  ) : (
    "提交"
  )}
</Button>
```

**状态覆盖**：
- 默认 — 显示"提交"
- Loading — 显示 spinner + "提交中...", 按钮 disabled
- 成功 — toast 提示 + 跳转
- 失败 — toast 错误信息，按钮恢复可点击

## 5. 数据表格

### 标准 Table 结构

```tsx
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function DataTable({ columns, data, emptyMessage }) {
  return (
    <Table className="w-full">
      {/* 表头 */}
      <TableHeader>
        <TableRow>
          {columns.map(col => (
            <TableHead key={col.name} className={col.className}>
              {col.title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      {/* 表体 */}
      <TableBody>
        {data?.length > 0 ? (
          data.map((row, i) => (
            <TableRow key={i}>
              {columns.map(col => (
                <TableCell key={col.name}>
                  {/* 支持 callback 自定义渲染 */}
                  {col.callback ? col.callback(row) : row[col.name]}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          {/* 空状态：colSpan 跨所有列 */}
          <TableRow>
            <TableCell colSpan={columns.length}>
              <div className="flex w-full items-center justify-center py-8 text-muted-foreground">
                <p>{emptyMessage}</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
```

### 列类型：复制列

当列的内容是 API Key、Token 等需要复制的数据时：

```tsx
<TableCell>
  {/* 显示截断后的值 */}
  <span>{`${value.slice(0, 4)}...${value.slice(-4)}`}</span>
  {/* 点击复制按钮 */}
  <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(value)}>
    复制
  </Button>
</TableCell>
```

用 `slice` 做部分隐藏 + 复制功能，是最常见的 API Key 展示方式。

## 6. Table + Toolbar + 空状态 组合

SaaS 中一个 CRUD 页面的标准模式：

```tsx
<div className="w-full space-y-6 p-4 pb-16">
  {/* 标题 */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">API Keys</h1>
  </div>

  {/* 提示信息（可选） */}
  {tip && (
    <div className="rounded-lg border bg-muted p-4 text-sm text-muted-foreground">
      {tip}
    </div>
  )}

  {/* 工具栏 */}
  <div className="flex space-x-4">
    <Button size="sm">创建新 Key</Button>
  </div>

  {/* 数据表格 */}
  <DataTable
    columns={columns}
    data={data}
    emptyMessage="还没有 API Key，点击上面按钮创建"
  />
</div>
```

**组合原则**：Title → Tip（可选）→ Toolbar → Table/Empty — 从上到下排列，用户阅读顺序自然。

## 7. 空状态（Empty State）

```tsx
export default function Empty({ message }: { message: string }) {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
```

**`h-[50vh]`** — 半屏高度，在视觉上足够明显但不夸张。用于：
- 表格没有数据时
- 用户没有权限时（结合 `Empty message="No access"`）
- 页面内容被条件过滤后为空时

## 8. 加载状态的表单占位

当表单数据从 API 加载时，用 skeleton 占满表单区域：

```tsx
{if (isLoading) return (
  <div className="w-full space-y-6 md:w-1/2 lg:w-1/3">
    <Skeleton className="h-4 w-1/4" />  {/* Label 占位 */}
    <Skeleton className="h-10 w-full" />  {/* Input 占位 */}
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-10 w-1/3" />  {/* 按钮占位 */}
  </div>
)}
```

**注意**：skeleton 的布局结构要和真实表单一致，这样加载完成后不会"跳"。

## 9. 表单和表格的日常问题速查

| 问题 | 原因 | 解决 |
|------|------|------|
| 表单太宽 | 没限制 max-width | `w-full md:w-1/2 lg:w-1/3` |
| 表格手机端显示不全 | 没有水平滚动 | 表格外面包 `overflow-x-auto` |
| Label 和输入框离得太远 | gap 太大 | `space-y-2` 就够了 |
| 按钮和输入框宽度不一致 | Button 没加 `w-full` | 手机端 `Button className="w-full"` |
| 空状态太突兀 | 直接空白页 | 加 Empty 组件 + `h-[50vh]` |
| Loading 时布局跳 | 没有结构对应的 skeleton | 按照真实表单结构写 skeleton |
