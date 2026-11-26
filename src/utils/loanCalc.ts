import Decimal from 'decimal.js';
import { MoneyInput, ZERO, toDecimal } from './money';

/**
 * Equated Monthly Installment (reducing balance), computed with decimal.js.
 * EMI = P·r·(1+r)^n / ((1+r)^n − 1), where r is the monthly rate.
 * Zero interest → P / n. Returns 0 when principal or count is not positive.
 */
export function calculateMonthlyPremium(
    principal: MoneyInput,
    ratePercent: MoneyInput,
    installmentCount: number,
    rateType: 'ANNUALLY' | 'MONTHLY',
): Decimal {
    const p = toDecimal(principal);
    const rate = toDecimal(ratePercent);
    if (!p.greaterThan(0) || installmentCount <= 0) return ZERO;
    if (rate.isZero()) return p.dividedBy(installmentCount);

    // Convert to monthly decimal rate (r)
    const r = rateType === 'ANNUALLY' ? rate.dividedBy(12).dividedBy(100) : rate.dividedBy(100);
    const growth = r.plus(1).pow(installmentCount);
    return p.times(r).times(growth).dividedBy(growth.minus(1));
}
