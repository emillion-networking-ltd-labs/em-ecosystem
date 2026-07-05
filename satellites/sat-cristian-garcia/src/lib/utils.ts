// cn — util estándar shadcn/Magic UI (clsx + tailwind-merge). Adoptado vía ADR-019 (fase 1).
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
