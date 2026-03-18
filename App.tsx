import { supabase } from './lib/supabase';

supabase.auth.getSession().then(({ data, error }) => {
  if (error) console.log('Supabase error:', error);
  else console.log('Supabase connected:', data);
});
