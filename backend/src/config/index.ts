
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL?.trim(),
    supabase: {
        url: process.env.SUPABASE_URL?.trim(),
        anonKey: process.env.SUPABASE_ANON_KEY?.trim(),
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
        jwtSecret: process.env.SUPABASE_JWT_SECRET?.trim(), // Often needed for verifying tokens
    },
    r2: {
        accountId: process.env.R2_ACCOUNT_ID?.trim(),
        accessKeyId: process.env.R2_ACCESS_KEY_ID?.trim(),
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY?.trim(),
        bucketName: process.env.R2_BUCKET_NAME?.trim(),
        publicUrl: process.env.R2_PUBLIC_URL?.trim(),
    },
};
