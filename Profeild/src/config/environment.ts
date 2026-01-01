import { API_BASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_WEB_CLIENT_ID, GOOGLE_PROJECT_ID } from '@env';

export const Config = {
  API_BASE_URL: API_BASE_URL || 'http://10.0.2.2:5000/api/v1',
  SUPABASE_URL: SUPABASE_URL || 'https://nhkpiaahmdxzxmpdbsqu.supabase.co',
  SUPABASE_ANON_KEY: SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oa3BpYWFobWR4enhtcGRic3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzExOTcsImV4cCI6MjA4MDQwNzE5N30.4axUeqfTV8MBt02ZcmS7SYRUyqlJPdZUUHbuKhA21Mc',
  GOOGLE_WEB_CLIENT_ID: GOOGLE_WEB_CLIENT_ID || '185788397468-b8ibjpf5jlme02lct3bdmcf4tnovpafb.apps.googleusercontent.com',
  GOOGLE_PROJECT_ID: GOOGLE_PROJECT_ID || 'reslestate-480606',
};

export default Config;