import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind classes, letting later classes override conflicting ones
 * (e.g. `cn("h-8", "h-10")` → "h-10").
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
