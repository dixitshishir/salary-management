const moneyFormatters = new Map<string, Intl.NumberFormat>()

/** "₹18,00,000"-style amounts in whole units, using the currency's own symbol. */
export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return '—'
  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
    moneyFormatters.set(currency, formatter)
  }
  return formatter.format(amount)
}

/** Large USD totals as "$12.4M" so dashboard cards stay readable. */
export function formatCompactUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount)
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/** 0.7 -> "-30%", 1.5 -> "+50%": distance from the peer median. */
export function formatCompaGap(ratio: number): string {
  const gap = Math.round((ratio - 1) * 100)
  return `${gap > 0 ? '+' : ''}${gap}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatEmploymentType(type: string): string {
  return type.replace('_', '-').replace(/^./, (c) => c.toUpperCase())
}
