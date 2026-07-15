ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_lesson_id_fkey;
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_lesson_id_fkey;
ALTER TABLE public.attempts ALTER COLUMN lesson_id TYPE text;
ALTER TABLE public.assignments ALTER COLUMN lesson_id TYPE text;
DROP TABLE IF EXISTS public.lessons;
