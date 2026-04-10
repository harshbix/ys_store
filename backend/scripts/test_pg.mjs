import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres.mchdclonkwhjvlygtwsc:Yusuph%232026@aws-0-eu-central-1.pooler.supabase.com:5432/postgres' });
client.connect().then(() => {
  console.log('Connected via pooler! AWS-0 EU central');
  process.exit(0);
}).catch(console.error);
