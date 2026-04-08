-- 021_add_admin_password_hash.sql
-- Add password_hash column to admin_users table for email/password authentication

alter table admin_users add column password_hash text;
alter table admin_users add column auth_method text not null default 'password';

comment on column admin_users.password_hash is 'Bcrypt hashed password for email/password authentication';
comment on column admin_users.auth_method is 'Authentication method: password or oauth';
