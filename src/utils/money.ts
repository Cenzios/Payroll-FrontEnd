import Decimal from 'decimal.js';

/**
 * Money helpers. The API returns every money field as a decimal STRING
 * (e.g. "12500.0000"). All arithmetic goes through decimal.js; values are only
 * turned into JS numbers at third-party boundaries that require them (charts).
 *
 * `number` is accepted as input only for values typed by the user / counts
 * (days, hours) that take part in money arithmetic.
 */
export type MoneyInput = string | number | Decimal | null | undefined;

export const ZERO: Decimal = new Decimal(0);

/** Safe conversion: null/undefined/''/invalid → 0. */
export function toDecimal(value: MoneyInput): Decimal {
  if (value === null || value === undefined) return ZERO;
  if (value instanceof Decimal) return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? new Decimal(value) : ZERO;
  }
  const trimmed = value.trim().replace(/,/g, '');
  if (trimmed === '') return ZERO;
  try {
    return new Decimal(trimmed);
  } catch {
    return ZERO;
  }
}

/** Sum of any list of money values. */
export function sumMoney(values: readonly MoneyInput[]): Decimal {
  return values.reduce<Decimal>((acc, value) => acc.plus(toDecimal(value)), ZERO);
}

/** Sum a money field over a list of records. */
export function sumBy<T>(items: readonly T[] | null | undefined, pick: (item: T) => MoneyInput): Decimal {
  return (items ?? []).reduce<Decimal>((acc, item) => acc.plus(toDecimal(pick(item))), ZERO);
}

export interface FormatMoneyOptions {
  /** Minimum fraction digits (default 2). */
  minFractionDigits?: number;
  /** Maximum fraction digits (default 2). */
  maxFractionDigits?: number;
}

function groupThousands(integerPart: string): string {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Display helper: thousands separators + 2 decimals by default
 * ("1234.5" → "1,234.50"), rounding half-up like toLocaleString.
 */
export function formatMoney(value: MoneyInput, options: FormatMoneyOptions = {}): string {
  const maxDigits = options.maxFractionDigits ?? 2;
  const minDigits = Math.min(options.minFractionDigits ?? 2, maxDigits);
  const rounded = toDecimal(value).toDecimalPlaces(maxDigits, Decimal.ROUND_HALF_UP);
  const isNegative = rounded.isNegative() && !rounded.isZero();
  const [integerPart, rawFraction = ''] = rounded.abs().toFixed(maxDigits).split('.');
  let fraction = rawFraction;
  while (fraction.length > minDigits && fraction.endsWith('0')) {
    fraction = fraction.slice(0, -1);
  }
  const body = fraction ? `${groupThousands(integerPart)}.${fraction}` : groupThousands(integerPart);
  return isNegative ? `-${body}` : body;
}

/** Fixed-point string for request bodies / inputs (no exponent, no separators). */
export function toMoneyString(value: MoneyInput, decimalPlaces = 2): string {
  return toDecimal(value).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP).toFixed(decimalPlaces);
}

/** Plain decimal string preserving precision (e.g. rates, hours) for request bodies. */
export function toDecimalString(value: MoneyInput): string {
  return toDecimal(value).toFixed();
}

/**
 * ONLY for third-party libraries that require a JS number (recharts, Stripe
 * display, numeric spreadsheet cells). Rounded to 2 decimals first.
 */
export function toChartNumber(value: MoneyInput): number {
  return Number(toDecimal(value).toFixed(2));
}

export function isPositive(value: MoneyInput): boolean {
  return toDecimal(value).greaterThan(0);
}
