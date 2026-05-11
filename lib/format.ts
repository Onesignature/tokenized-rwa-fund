import { formatUnits, parseUnits } from "viem";

export const USDC_DECIMALS = 6;
export const TOKEN_DECIMALS = 18;
export const NAV_DECIMALS = 18;

export function fmtUsdc(value: bigint | undefined, fractionDigits = 2): string {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, USDC_DECIMALS));
  return num.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function fmtToken(value: bigint | undefined, fractionDigits = 4): string {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, TOKEN_DECIMALS));
  return num.toLocaleString(undefined, {
    minimumFractionDigits: Math.min(2, fractionDigits),
    maximumFractionDigits: fractionDigits,
  });
}

export function fmtNav(value: bigint | undefined, fractionDigits = 4): string {
  if (value === undefined) return "—";
  const num = Number(formatUnits(value, NAV_DECIMALS));
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: fractionDigits,
  });
}

export function parseUsdc(input: string): bigint {
  if (!input || input.trim() === "") return 0n;
  try {
    return parseUnits(input, USDC_DECIMALS);
  } catch {
    return 0n;
  }
}

export function parseToken(input: string): bigint {
  if (!input || input.trim() === "") return 0n;
  try {
    return parseUnits(input, TOKEN_DECIMALS);
  } catch {
    return 0n;
  }
}

export function parseNav(input: string): bigint {
  if (!input || input.trim() === "") return 0n;
  try {
    return parseUnits(input, NAV_DECIMALS);
  } catch {
    return 0n;
  }
}
