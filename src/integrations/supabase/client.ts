import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase URL and key from environment or localStorage
const getSupabaseConfig = () => {
  // Try to get from localStorage first (set during setup)
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');
  
  if (localUrl && localKey) {
    console.log('Using Supabase config from localStorage');
    return { supabaseUrl: localUrl, supabaseKey: localKey };
  }
  
  // Fallback to default values
  console.log('Using default Supabase config');
  return {
    supabaseUrl: "https://bfveluzxxkrxwvlpelgx.supabase.co",
    supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdmVsdXp4eGtyeHd2bHBlbGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1NDk5MTYsImV4cCI6MjA0NzEyNTkxNn0.DV2fKcV7ecdwfg8BkepqChyh8ZLPk2MsbiPPPsE8XQo"
  };
};

const { supabaseUrl, supabaseKey } = getSupabaseConfig();

// Create and export the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Add a listener for storage changes to update the client when config changes
window.addEventListener('storage', () => {
  const newUrl = localStorage.getItem('supabase_url');
  const newKey = localStorage.getItem('supabase_key');
  
  if (newUrl && newKey) {
    console.log('Supabase config updated, refreshing client');
    window.location.reload(); // Refresh the page to reinitialize the client
  }
});