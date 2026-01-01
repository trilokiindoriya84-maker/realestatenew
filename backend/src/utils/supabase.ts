
import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Removed hardcoded keys. Now using environment variables from .env
const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceRoleKey;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in environment variables');
    // We explicitly throw here to fail fast if config is missing
    throw new Error('Supabase configuration missing');
}

export const supabaseAdmin = createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false
        }
    }
);
