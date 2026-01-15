-- Add close_logger_after_add field to profiles table
alter table profiles add column close_logger_after_add boolean default true not null;
