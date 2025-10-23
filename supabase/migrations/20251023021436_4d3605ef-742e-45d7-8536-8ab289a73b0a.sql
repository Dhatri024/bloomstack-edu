-- Add video_url column to courses table for YouTube videos
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS video_url text;

-- Add content column for course materials
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS content text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);