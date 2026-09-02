const { Client } = require('pg');
const c = new Client('postgresql://postgres:Expedient43!Generation@db.dodcwulqgrhqpbldrlik.supabase.co:5432/postgres');
c.connect().then(()=>c.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).then(r=>console.log(r.rows.map(x=>x.tablename))).then(()=>c.end());
