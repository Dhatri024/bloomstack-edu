-- Harden function by setting search_path
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.profiles
  SET 
    streak_count = CASE
      WHEN last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_count + 1
      WHEN last_activity_date = CURRENT_DATE THEN streak_count
      ELSE 1
    END,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE id = NEW.student_id OR id = NEW.user_id;
  RETURN NEW;
END;
$function$;