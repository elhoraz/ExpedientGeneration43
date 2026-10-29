require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    await client.connect();

    console.log("Updating handle_new_user trigger function in database...");
    
    await client.query(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Insert into public.profiles
        INSERT INTO public.profiles (id, nama_lengkap, role)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'Alumni Baru'), 'member')
        ON CONFLICT (id) DO NOTHING;

        -- Insert into public.users
        INSERT INTO public.users (id, nama_lengkap, role)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', 'Alumni Baru'), 'member')
        ON CONFLICT (id) DO NOTHING;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log("Trigger function updated successfully!");

  } catch (err) {
    console.error("Database error:", err);
  } finally {
    await client.end();
  }
}
run();
