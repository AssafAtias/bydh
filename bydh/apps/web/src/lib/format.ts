export const currencyFormatter = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
})

export function toCurrency(value: number): string {
  return currencyFormatter.format(value)
}
