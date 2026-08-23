const compactUnits = [
  { value: 1_000_000_000_000, suffix: "T" },
  { value: 1_000_000_000, suffix: "B" },
  { value: 1_000_000, suffix: "M" },
  { value: 1_000, suffix: "K" }
] as const;

function clampFractionDigits(value: number) {
  return Math.max(0, Math.min(20, Math.trunc(value)));
}

function roundDecimal(value: number, maximumFractionDigits: number) {
  const factor = 10 ** clampFractionDigits(maximumFractionDigits);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function trimFixed(value: number, maximumFractionDigits: number) {
  const digits = clampFractionDigits(maximumFractionDigits);
  const fixed = roundDecimal(value, digits).toFixed(digits);
  if (!fixed.includes(".")) return fixed;
  return fixed.replace(/0+$/, "").replace(/\.$/, "");
}

function formatCompactValue(value: number, maximumFractionDigits = 1) {
  const digits = clampFractionDigits(maximumFractionDigits);
  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  let unitIndex = compactUnits.findIndex((unit) => absolute >= unit.value);

  if (unitIndex === -1) {
    if (roundDecimal(absolute, digits) < 1_000) return `${sign}${trimFixed(absolute, digits)}`;
    unitIndex = compactUnits.length - 1;
  }

  let unit = compactUnits[unitIndex];
  let scaled = absolute / unit.value;

  if (roundDecimal(scaled, digits) >= 1_000 && unitIndex > 0) {
    unit = compactUnits[unitIndex - 1];
    scaled = absolute / unit.value;
  }

  return `${sign}${trimFixed(scaled, digits)}${unit.suffix}`;
}

export function formatCurrency(value: number, options?: { compact?: boolean; maximumFractionDigits?: number }) {
  const maximumFractionDigits = options?.maximumFractionDigits ?? (options?.compact ? 1 : 2);

  if (options?.compact) {
    const sign = value < 0 ? "-" : "";
    return `${sign}$${formatCompactValue(Math.abs(value), maximumFractionDigits)}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "standard",
    maximumFractionDigits
  }).format(value);
}

export function formatNumber(value: number, compact = false) {
  if (compact) return formatCompactValue(value, 1);

  return new Intl.NumberFormat("en-US", {
    notation: "standard",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export function shortAddress(address: string) {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
