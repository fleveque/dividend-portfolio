import type { TFunction } from 'i18next'

export function translateSector(t: TFunction, sector: string | null | undefined): string {
  if (!sector) return ''
  return t(`sectors.${sector}`, { defaultValue: sector })
}
