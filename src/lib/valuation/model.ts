/** Amounts share the user's unit; rates are decimals and cash flows occur at year end. */
export interface DcfInputs {
  enterpriseValue: number;
  revenue: number;
  forecastYears: number;
  discountRate: number;
  terminalGrowthRate: number;
  operatingMargin: number;
  taxRate: number;
  reinvestmentRate: number;
}
export const example: DcfInputs = {
  enterpriseValue: 2000,
  revenue: 1000,
  forecastYears: 10,
  discountRate: 0.1,
  terminalGrowthRate: 0.025,
  operatingMargin: 0.2,
  taxRate: 0.25,
  reinvestmentRate: 0.25,
};
export function validateInputs(p: DcfInputs): void {
  if (
    Object.keys(example).some((key) => {
      const v = p[key as keyof DcfInputs];
      return typeof v !== 'number' || !Number.isFinite(v);
    })
  )
    throw new Error('Enter a finite number in every field.');
  if (
    p.enterpriseValue <= 0 ||
    p.revenue <= 0 ||
    p.enterpriseValue > 1e12 ||
    p.revenue > 1e12
  )
    throw new Error(
      'Enterprise value and revenue must be positive and no greater than one trillion in your chosen unit.',
    );
  if (
    !Number.isInteger(p.forecastYears) ||
    p.forecastYears < 1 ||
    p.forecastYears > 30
  )
    throw new Error('Choose a forecast period from 1 to 30 whole years.');
  if (
    p.discountRate <= 0 ||
    p.discountRate > 0.5 ||
    p.terminalGrowthRate < 0 ||
    p.terminalGrowthRate >= p.discountRate
  )
    throw new Error(
      'Discount rate must exceed terminal growth and be at most 50%. Terminal growth cannot be negative.',
    );
  if (
    p.operatingMargin <= 0 ||
    p.operatingMargin > 1 ||
    p.taxRate < 0 ||
    p.taxRate >= 1 ||
    p.reinvestmentRate < 0 ||
    p.reinvestmentRate >= 1
  )
    throw new Error(
      'Margin must be above 0% and at most 100%. Tax and reinvestment must be from 0% to below 100%.',
    );
}
export function enterpriseValueAtGrowth(p: DcfInputs, growth: number) {
  validateInputs(p);
  if (!Number.isFinite(growth) || growth <= -1 || growth > 5)
    throw new Error('Growth must be above −100% and at most 500%.');
  const rows = [];
  let revenue = p.revenue,
    presentValue = 0;
  const conversion =
    p.operatingMargin * (1 - p.taxRate) * (1 - p.reinvestmentRate);
  for (let year = 1; year <= p.forecastYears; year++) {
    revenue *= 1 + growth;
    const cashFlow = revenue * conversion;
    const discounted = cashFlow / (1 + p.discountRate) ** year;
    presentValue += discounted;
    rows.push({ year, revenue, cashFlow, presentValue: discounted });
  }
  const terminalValue =
    (revenue * (1 + p.terminalGrowthRate) * conversion) /
    (p.discountRate - p.terminalGrowthRate);
  const discountedTerminal =
    terminalValue / (1 + p.discountRate) ** p.forecastYears;
  return { value: presentValue + discountedTerminal, discountedTerminal, rows };
}
export function solveGrowth(p: DcfInputs): number | null {
  validateInputs(p);
  let low = -0.99,
    high = 5;
  if (
    enterpriseValueAtGrowth(p, low).value > p.enterpriseValue ||
    enterpriseValueAtGrowth(p, high).value < p.enterpriseValue
  )
    return null;
  for (let i = 0; i < 100; i++) {
    const middle = (low + high) / 2;
    if (enterpriseValueAtGrowth(p, middle).value < p.enterpriseValue)
      low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}
