drop policy "Users can view own limits" on "public"."user_limits";

revoke delete on table "public"."user_limits" from "anon";

revoke insert on table "public"."user_limits" from "anon";

revoke references on table "public"."user_limits" from "anon";

revoke select on table "public"."user_limits" from "anon";

revoke trigger on table "public"."user_limits" from "anon";

revoke truncate on table "public"."user_limits" from "anon";

revoke update on table "public"."user_limits" from "anon";

revoke delete on table "public"."user_limits" from "authenticated";

revoke insert on table "public"."user_limits" from "authenticated";

revoke references on table "public"."user_limits" from "authenticated";

revoke select on table "public"."user_limits" from "authenticated";

revoke trigger on table "public"."user_limits" from "authenticated";

revoke truncate on table "public"."user_limits" from "authenticated";

revoke update on table "public"."user_limits" from "authenticated";

revoke delete on table "public"."user_limits" from "service_role";

revoke insert on table "public"."user_limits" from "service_role";

revoke references on table "public"."user_limits" from "service_role";

revoke select on table "public"."user_limits" from "service_role";

revoke trigger on table "public"."user_limits" from "service_role";

revoke truncate on table "public"."user_limits" from "service_role";

revoke update on table "public"."user_limits" from "service_role";

alter table "public"."user_limits" drop constraint "user_limits_chat_count_check";

alter table "public"."user_limits" drop constraint "user_limits_rec_count_check";

alter table "public"."user_limits" drop constraint "user_limits_user_id_fkey";

drop function if exists "public"."increment_chat_count"(p_user_id uuid);

drop function if exists "public"."increment_rec_count"(p_user_id uuid);

alter table "public"."user_limits" drop constraint "user_limits_pkey";

drop index if exists "public"."user_limits_limit_date_idx";

drop index if exists "public"."user_limits_pkey";

drop table "public"."user_limits";


