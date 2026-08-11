/**
 * Barrel for shared components.
 *
 *   import { Shared } from "@/components/shared"
 *   <Shared.BrandMark />
 *
 * NOTE: files inside this folder must import siblings directly (e.g.
 * `./BrandMark`), never via this barrel — that would create a circular
 * import.
 */
import { BrandMark } from "./BrandMark"

export const Shared = {
  BrandMark,
}
