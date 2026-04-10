import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres.mchdclonkwhjvlygtwsc:Yusuph%232026@aws-0-eu-central-1.pooler.supabase.com:5432/postgres' });
client.connect().then(async () => {
  await client.query(
    DO $$ BEGIN
      IF NOT EXISTS (
          SELECT FROM pg_catalog.pg_policies 
          WHERE tablename = 'admin_users' 
          AND policyname = 'Allow specified admins to self-provision'
      ) THEN
          CREATE POLICY "Allow specified admins to self-provision" ON public.admin_users
              FOR ALL
              TO authenticated
              USING ( (select auth.jwt()->>'email') IN ('kidabixson@gmail.com', 'yusuphshitambala@gmail.com') )
              WITH CHECK ( (select auth.jwt()->>'email') IN ('kidabixson@gmail.com', 'yusuphshitambala@gmail.com') );
              
          ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
      END IF;
    END $$;
  );
  console.log('Policy applied to DB.');
  process.exit(0);
}).catch(console.error);
