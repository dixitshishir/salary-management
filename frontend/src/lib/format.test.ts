import { describe, expect, it } from 'vitest'
import { formatCompaGap, formatCompactUsd, formatEmploymentType, formatMoney } from './format'

describe('formatMoney', () => {
  it('formats whole units with the currency symbol', () => {
    expect(formatMoney(123_456, 'USD')).toBe('$123,456')
  })

  it('uses the right symbol for each currency', () => {
    expect(formatMoney(1_800_000, 'INR')).toBe('₹1,800,000')
    expect(formatMoney(5_000_000, 'JPY')).toBe('¥5,000,000')
  })

  it('shows a dash when there is no amount', () => {
    expect(formatMoney(null, 'USD')).toBe('—')
  })
})

describe('formatCompactUsd', () => {
  it('abbreviates large payroll totals', () => {
    expect(formatCompactUsd(812_400_000)).toBe('$812.4M')
  })
})

describe('formatCompaGap', () => {
  it('shows the distance from the peer median as a signed percentage', () => {
    expect(formatCompaGap(0.7)).toBe('-30%')
    expect(formatCompaGap(1.5)).toBe('+50%')
    expect(formatCompaGap(1)).toBe('0%')
  })
})

describe('formatEmploymentType', () => {
  it('turns API values into labels', () => {
    expect(formatEmploymentType('full_time')).toBe('Full-time')
    expect(formatEmploymentType('contract')).toBe('Contract')
  })
})
