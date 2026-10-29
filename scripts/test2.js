require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const c = new Client(process.env.DATABASE_URL);
c.connect().then(()=>c.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).then(r=>console.log(r.rows.map(x=>x.tablename))).then(()=>c.end());
