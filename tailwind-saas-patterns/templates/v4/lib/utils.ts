import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — Tailwind className 合并工具
 * v4 与 v3 用法完全一致，clsx + twMerge 都不依赖 Tailwind 版本
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
