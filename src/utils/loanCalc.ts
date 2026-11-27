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

/**
 * Adds whole months to a 'YYYY-MM-DD' date, clamping the day to the target month's length
 * (31 Jan + 1 month = 28/29 Feb), the same rule the API uses for instalment due dates.
 * Returns '' for an unparseable date.
 */
export function addMonthsClamped(isoDate: string, months: number): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
    if (!match) return '';
    const monthIndex = Number(match[2]) - 1 + months;
    const year = Number(match[1]) + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const day = Math.min(Number(match[3]), lastDay);
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
