
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ilukexelmihfdezbgcrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsdWtleGVsbWloZmRlemJnY3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4NTQzOTIsImV4cCI6MjA3OTQzMDM5Mn0._m4mYwQ7dsV6sxKHc2aEiK0r_OQ2NZqZw4MbKLtLEBw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
