import type { CategoryCode } from '../types'

export interface CategoryMeta {
  code: CategoryCode
  label: string
  description: string
  color: string
}

// Fixed colors so a category looks identical across every chart.
export const CATEGORIES: Record<CategoryCode, CategoryMeta> = {
  A: { code: 'A', label: 'Cat A', description: 'Cars up to 1600cc & 130bhp', color: '#2563eb' },
  B: { code: 'B', label: 'Cat B', description: 'Cars above 1600cc or 130bhp', color: '#f97316' },
  C: { code: 'C', label: 'Cat C', description: 'Goods vehicles & buses', color: '#16a34a' },
  D: { code: 'D', label: 'Cat D', description: 'Motorcycles', color: '#9333ea' },
  E: { code: 'E', label: 'Cat E', description: 'Open category', color: '#dc2626' },
}

export const CATEGORY_ORDER: CategoryCode[] = ['A', 'B', 'C', 'D', 'E']

// Maps data.gov.sg "vehicle_class" strings to our short codes.
export function parseCategory(vehicleClass: string): CategoryCode | null {
  const m = vehicleClass.match(/Category\s+([A-E])/i)
  if (m) return m[1].toUpperCase() as CategoryCode
  const single = vehicleClass.trim().toUpperCase()
  if (['A', 'B', 'C', 'D', 'E'].includes(single)) return single as CategoryCode
  return null
}
