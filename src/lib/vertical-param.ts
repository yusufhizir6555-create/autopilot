import { verticals } from "@/verticals";

export const DEFAULT_VERTICAL = "housing";

export function resolveVerticalKey(v: string | string[] | undefined): string {
  const key = typeof v === "string" ? v : DEFAULT_VERTICAL;
  return key in verticals ? key : DEFAULT_VERTICAL;
}
