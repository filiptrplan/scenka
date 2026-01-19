alter table "public"."climbs" drop constraint "climbs_hold_color_check";

alter table "public"."climbs" add constraint "climbs_hold_color_check" CHECK ((hold_color = ANY (ARRAY['red'::text, 'green'::text, 'blue'::text, 'yellow'::text, 'black'::text, 'white'::text, 'orange'::text, 'purple'::text, 'pink'::text]))) not valid;

alter table "public"."climbs" validate constraint "climbs_hold_color_check";


