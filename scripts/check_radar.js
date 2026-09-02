require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const sbAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // List existing RLS policies for profiles table
  const { data: policies, error: pError } = await sbAdmin
    .rpc('get_policies', {})
    .select();
  
  // Try a different approach - check via SQL
  const { data, error } = await sbAdmin.rpc('exec_sql', { sql: `
    SELECT policyname, cmd, qual, with_check 
    FROM pg_policies 
    WHERE tablename = 'profiles';
  `});
  
  console.log('Policies query result:', JSON.stringify(data, null, 2));
  console.log('Policies query error:', JSON.stringify(error, null, 2));
}

main().catch(console.error);
