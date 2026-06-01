/**
 * env.config.ts — fail-fast production env validation.
 */

export interface GameServerEnv {
  readonly port: number;
  readonly botAiUrl: string;
  readonly corsOrigins: readonly string[];
  readonly supabaseUrl: string | undefined;
  readonly supabaseServiceKey: string | undefined;
  readonly authRequired: boolean;
}

export function loadGameServerEnv(): GameServerEnv {
  const port = Number(process.env.PORT ?? 2567);
  const botAiUrl = process.env.BOT_AI_URL ?? 'http://localhost:8000';
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authRequired = process.env.AUTH_REQUIRED === 'true';
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && (!supabaseUrl || !supabaseServiceKey)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in production');
  }

  return {
    port,
    botAiUrl,
    corsOrigins,
    supabaseUrl,
    supabaseServiceKey,
    authRequired,
  };
}
