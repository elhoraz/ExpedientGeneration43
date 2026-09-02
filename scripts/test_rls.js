const { Client } = require('pg');
const c = new Client('postgresql://postgres:Expedient43!Generation@db.dodcwulqgrhqpbldrlik.supabase.co:5432/postgres');
c.connect().then(()=>c.query("SELECT * FROM pg_policies WHERE tablename = 'notifications'")).then(r=>console.log(r.rows)).then(()=>c.end());
