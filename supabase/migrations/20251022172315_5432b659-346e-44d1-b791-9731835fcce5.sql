-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher');

-- Create enum for quiz difficulty
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create enum for badge types
CREATE TYPE badge_type AS ENUM ('streak_7', 'streak_30', 'quiz_master', 'course_complete', 'top_learner');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quiz_questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Create quiz_results table
CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  answers JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create badges table
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type badge_type NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, badge_type)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Anyone can view courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Teachers can create courses" ON courses FOR INSERT WITH CHECK (
  auth.uid() = teacher_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can update own courses" ON courses FOR UPDATE USING (
  auth.uid() = teacher_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);
CREATE POLICY "Teachers can delete own courses" ON courses FOR DELETE USING (
  auth.uid() = teacher_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
);

-- Quizzes policies
CREATE POLICY "Anyone can view quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Teachers can manage quizzes for their courses" ON quizzes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = quizzes.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Quiz questions policies
CREATE POLICY "Anyone can view quiz questions" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "Teachers can manage questions for their quizzes" ON quiz_questions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    JOIN courses ON quizzes.course_id = courses.id 
    WHERE quizzes.id = quiz_questions.quiz_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON enrollments FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can enroll in courses" ON enrollments FOR INSERT WITH CHECK (
  auth.uid() = student_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
);
CREATE POLICY "Students can update own enrollments" ON enrollments FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Teachers can view enrollments for their courses" ON enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses 
    WHERE courses.id = enrollments.course_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Quiz results policies
CREATE POLICY "Users can view own results" ON quiz_results FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create quiz results" ON quiz_results FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Teachers can view results for their quizzes" ON quiz_results FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM quizzes 
    JOIN courses ON quizzes.course_id = courses.id 
    WHERE quizzes.id = quiz_results.quiz_id 
    AND courses.teacher_id = auth.uid()
  )
);

-- Badges policies
CREATE POLICY "Users can view own badges" ON badges FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "System can award badges" ON badges FOR INSERT WITH CHECK (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for streak updates
CREATE TRIGGER update_streak_on_enrollment
  AFTER INSERT ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();

CREATE TRIGGER update_streak_on_quiz_completion
  AFTER INSERT ON quiz_results
  FOR EACH ROW EXECUTE FUNCTION update_user_streak();