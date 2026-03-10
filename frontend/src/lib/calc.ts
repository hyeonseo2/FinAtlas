export function simpleMonthlyInterest(monthlyPayment: number, annualRate: number, months: number): number {
  if (monthlyPayment <= 0 || months <= 0) return 0;
  const r = annualRate / 100;
  return Math.max(0, Math.round(monthlyPayment * (r / 12) * (months * (months + 1) / 2)));
}

export function maturityAmount(monthlyPayment: number, months: number, interest: number) {
  return monthlyPayment * months + interest;
}

export function expectedInterestWithRate(monthlyPayment: number, expectedRate: number, months: number): number {
  return simpleMonthlyInterest(monthlyPayment, expectedRate, months);
}
