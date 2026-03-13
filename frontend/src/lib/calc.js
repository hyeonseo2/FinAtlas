export function simpleMonthlyInterest(monthlyPayment, annualRate, months) {
    if (monthlyPayment <= 0 || months <= 0)
        return 0;
    const r = annualRate / 100;
    return Math.max(0, Math.round(monthlyPayment * (r / 12) * (months * (months + 1) / 2)));
}
export function maturityAmount(paymentAmount, months, interest, productType = "saving") {
    if (productType === "deposit") {
        return paymentAmount + interest;
    }
    return paymentAmount * months + interest;
}
export function expectedInterestWithRate(monthlyPayment, expectedRate, months) {
    return simpleMonthlyInterest(monthlyPayment, expectedRate, months);
}
export function simpleLumpSumInterest(lumpSum, annualRate, months) {
    if (lumpSum <= 0 || months <= 0)
        return 0;
    const r = annualRate / 100;
    return Math.max(0, Math.round(lumpSum * r * (months / 12)));
}
export function expectedInterestByProductType(monthlyOrLumpSum, annualRate, months, productType) {
    return productType === "deposit"
        ? simpleLumpSumInterest(monthlyOrLumpSum, annualRate, months)
        : simpleMonthlyInterest(monthlyOrLumpSum, annualRate, months);
}
