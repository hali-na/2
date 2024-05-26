import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://uyacotpozbebgfibwpwr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5YWNvdHBvemJlYmdmaWJ3cHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYxNTM0NDQsImV4cCI6MjAzMTcyOTQ0NH0.3qRmxKDcHnfPQULDIDUgrhoOlERtUDGZGrXJyh4tcoc';
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
