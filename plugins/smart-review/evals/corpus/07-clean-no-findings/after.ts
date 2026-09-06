// Sum a small, bounded set of prices and apply one of three fixed tax brackets.
const TAX_RATES = [0.0, 0.05, 0.1];

export function totalWithTax(prices: number[], bracket: 0 | 1 | 2): number {
  let sum = 0;
  for (const p of prices) sum += p;
  const rate = TAX_RATES[bracket];
  return Math.round(sum * (1 + rate) * 100) / 100;
}
