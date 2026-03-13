export function simpleMonthlyInterest(monthlyPayment: number, annualRate: number, months: number): number {
  if (monthlyPayment <= 0 || months <= 0) return 0;
  const r = annualRate / 100;
  return Math.max(0, Math.round(monthlyPayment * (r / 12) * (months * (months + 1) / 2)));
}

export function maturityAmount(paymentAmount: number, months: number, interest: number, productType: string = "saving"): number {
  if (productType === "deposit") {
    return paymentAmount + interest;
  }
  return paymentAmount * months + interest;
}

export function expectedInterestWithRate(monthlyPayment: number, expectedRate: number, months: number): number {
  return simpleMonthlyInterest(monthlyPayment, expectedRate, months);
}


export function simpleLumpSumInterest(lumpSum: number, annualRate: number, months: number): number {
  if (lumpSum <= 0 || months <= 0) return 0;
  const r = annualRate / 100;
  return Math.max(0, Math.round(lumpSum * r * (months / 12)));
}

export type DepositMode = "monthly" | "lump_sum";

export function expectedInterestByProductType(monthlyOrLumpSum: number, annualRate: number, months: number, productType: string): number {
  return productType === "deposit"
    ? simpleLumpSumInterest(monthlyOrLumpSum, annualRate, months)
    : simpleMonthlyInterest(monthlyOrLumpSum, annualRate, months);
}
