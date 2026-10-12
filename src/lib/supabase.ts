import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ddczvzqidmezxkzapchb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3p2enFpZG1lenhremFwY2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3Mjg5ODAsImV4cCI6MjEwNzMwNDk4MH0.PX37M6r4OCc926ZBRa_BIHIkcmUb5L3YIurrOCUZJ9E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);