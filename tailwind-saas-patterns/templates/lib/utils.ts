import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — Tailwind className 合并工具
 * - clsx: 条件合并（如 cn("px-4", isActive && "bg-primary")）
 * - twMerge: 解决 Tailwind 类名冲突（px-4 px-6 → 保留最后的 px-6）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
