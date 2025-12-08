import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const currencyFormatter = (currency: string, locale?: string) => {
  const resolvedLocale = locale ?? (currency === "USD" ? "en-US" : "en-GB");
  return new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });
};

export const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);


