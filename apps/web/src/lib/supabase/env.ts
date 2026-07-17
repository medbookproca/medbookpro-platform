import { z } from 'zod';

const supabaseEnvSchema = z.object({
  url: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  publishableKey: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required'),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

export function parseSupabaseEnv(input: {
  url?: string;
  publishableKey?: string;
}): SupabaseEnv {
  const result = supabaseEnvSchema.safeParse(input);

  if (!result.success) {
    const messages = result.error.issues.map((issue) => {
      const variableName = issue.path[0] === 'url'
        ? 'NEXT_PUBLIC_SUPABASE_URL'
        : 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY';
      return `${variableName}: ${issue.message}`;
    }).join('; ');
    throw new Error(`Supabase environment is not configured: ${messages}`);
  }

  return result.data;
}

export function getSupabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
