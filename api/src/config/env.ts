import 'dotenv';
import { z } from 'zod';

// Zod 4 z.url() rejeita URLs sem TLD (ex: https://localhost:3000).
// Como a config aceita localhost/Docker hostnames, validamos via construtor nativo.
const urlString = z.string().refine(
  (s) => {
    try {
      new URL(s);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Invalid URL' },
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Auth
  ADMIN_PASSWORD: z.string().min(1, 'ADMIN_PASSWORD is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Infra
  DATABASE_URL: urlString,
  REDIS_URL: urlString,

  // App
  BASE_URL: urlString,
  PORT: z.coerce.number().int().positive().default(3000),
  // 'loopback', 'linklocal', 'uniquelocal', IP/CIDR, 'true', 'false', ou número de hops.
  // Combina vários com vírgula. Default cobre dev (localhost) e Docker bridge (172.x/192.168.x).
  TRUST_PROXY: z.string().default('loopback, uniquelocal'),

  // Origem(s) permitida(s) pelo CORS. Vírgula-separado pra múltiplas.
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
