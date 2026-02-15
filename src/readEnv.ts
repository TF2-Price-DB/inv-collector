import * as process from "node:process";

export function readEnv(key: string, asNumber: true): number;
export function readEnv(key: string, asNumber: false): string;
export function readEnv(key: string): string;
export function readEnv(
  key: string,
  asNumber: boolean = false,
): string | number {
  key = "INV_COLLECTOR_" + key;

  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Missing environment variable ${key}`);
  }

  if (!asNumber) {
    return value;
  }

  const num = +value;
  if (isNaN(num) || !Number.isSafeInteger(num) || num < 1) {
    throw new Error(
      `Environment variable ${key} must be a positive integer value`,
    );
  }

  return num;
}
