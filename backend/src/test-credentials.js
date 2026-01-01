
const { createClient } = require('@supabase/supabase-js');

// User provided keys (Hardcoded for verification)
const SUPABASE_URL = 'https://ppubqfyrbeemnnvnybfb.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdWJxZnlyYmVlbW5udm55YmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTQzMjIyOSwiZXhwIjoyMDgxMDA4MjI5fQ.wM6Ydu0im9BJzxJfgDsp9Q1do9TXIu6eU1ojvwTY44E';

console.log('Testing connection to:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    try {
        // Try to list users - this requires Service Role permissions
        const { data, error } = await supabase.auth.admin.listUsers();

        if (error) {
            console.error('❌ Connection Failed:', error.message);
            console.error('Full Error:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ Connection Successful!');
            console.log('User count:', data.users.length);
        }
    } catch (err) {
        console.error('❌ Exception:', err);
    }
}

testConnection();
