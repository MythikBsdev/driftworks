import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const currencyFormatter = (currency: string, locale = "en-GB") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

export const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

