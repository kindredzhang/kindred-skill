import { cn } from "@/lib/utils";

/**
 * Skeleton 骨架屏组件
 * 用于数据加载时的占位效果，配合 animate-shimmer 使用
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-muted",
        "bg-[linear-gradient(90deg,hsl(var(--muted))_25%,hsl(var(--muted-foreground)/0.05)_50%,hsl(var(--muted))_75%)]",
        "bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
