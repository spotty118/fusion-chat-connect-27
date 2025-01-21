import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get Supabase URL and key from environment or localStorage
const getSupabaseConfig = () => {
  console.log('Initializing Supabase configuration...');
  
  // Try to get from localStorage first (set during setup)
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');
  
  if (localUrl && localKey) {
    console.log('Using Supabase config from localStorage');
    return { supabaseUrl: localUrl, supabaseKey: localKey };
  }
  
  // Fallback to default values
  console.log('Using default Supabase config');
  const defaultUrl = "https://gyecztjxhffpkdweoqzb.supabase.co";
  const defaultKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5ZWN6dGp4aGZmcGtkd2VvcXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MTUyNjEsImV4cCI6MjA1Mjk5MTI2MX0.lLPoqBsxeDMq6c38Mrl3C7LQMFydzrfiaMZGbzvRFZs";
  
  return {
    supabaseUrl: defaultUrl,
    supabaseKey: defaultKey
  };
};

const { supabaseUrl, supabaseKey } = getSupabaseConfig();

console.log('Creating Supabase client with URL:', supabaseUrl);

// Create and export the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Add a listener for storage changes to update the client when config changes
window.addEventListener('storage', (event) => {
  if (event.key === 'supabase_url' || event.key === 'supabase_key') {
    console.log('Supabase config updated, refreshing client');
    window.location.reload(); // Refresh the page to reinitialize the client
  }
});

// Test the connection
supabase.from('api_keys').select('count').limit(1)
  .then(() => {
    console.log('Successfully connected to Supabase');
  })
  .catch((error: Error) => {
    console.error('Failed to connect to Supabase:', error);
  });