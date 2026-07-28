import dotenv from 'dotenv';
dotenv.config();

/**
 * Helper module for Supabase integration.
 * Will initialize the Supabase JS client if credentials are configured.
 */
let supabaseClient = null;

export async function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key || url.includes('[YOUR-PROJECT-REF]') || key.includes('your-anon-public-key')) {
    return null;
  }

  if (!supabaseClient) {
    try {
      // Dynamic import in case @supabase/supabase-js is installed later
      const { createClient } = await import('@supabase/supabase-js');
      supabaseClient = createClient(url, key);
    } catch (err) {
      console.warn('Supabase JS SDK not installed or initialized. Using Prisma database connection.');
    }
  }

  return supabaseClient;
}

export const isSupabaseConfigured = () => {
  const url = process.env.SUPABASE_URL;
  return Boolean(url && !url.includes('[YOUR-PROJECT-REF]'));
};
