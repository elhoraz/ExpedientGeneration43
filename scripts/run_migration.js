require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const fs = require('fs');
    const fileName = process.argv[2];
    if (!fileName) throw new Error("Please provide migration file name");
    const sql = fs.readFileSync(`./supabase/migrations/${fileName}`, 'utf8');
    await client.query(sql);
    console.log("Migration applied successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
