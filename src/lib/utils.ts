import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utilidad estándar de shadcn/ui: combina clases de Tailwind
// resolviendo conflictos (twMerge) y condiciones (clsx)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}