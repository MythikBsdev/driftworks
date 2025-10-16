import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, { message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is required" }),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  console.warn("[env] Missing or invalid environment variables", parsed.error.flatten().fieldErrors);
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
};