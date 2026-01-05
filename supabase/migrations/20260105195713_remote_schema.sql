drop extension if exists "pg_net";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, preferred_grade_scale, preferred_discipline)
  VALUES (NEW.id, 'font', 'boulder');
  RETURN NEW;
END;
$function$
;


