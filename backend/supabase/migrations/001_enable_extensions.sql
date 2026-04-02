-- 001_enable_extensions.sql
-- Required Postgres extensions for UUID and hashing.

create extension if not exists pgcrypto;
