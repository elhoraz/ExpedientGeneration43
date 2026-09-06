const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.dodcwulqgrhqpbldrlik',
  password: 'Expedient43!Generation',
  database: 'postgres',
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
