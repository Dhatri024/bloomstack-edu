import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Plus, BarChart } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, totalQuizzes: 0 });

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: coursesData } = await supabase
      .from("courses")
      .select(`
        *,
        enrollments (count),
        quizzes (count)
      `)
      .eq("teacher_id", session.user.id);

    if (coursesData) {
      setCourses(coursesData);
      const totalStudents = coursesData.reduce((sum, course: any) => sum + (course.enrollments?.[0]?.count || 0), 0);
      const totalQuizzes = coursesData.reduce((sum, course: any) => sum + (course.quizzes?.[0]?.count || 0), 0);
      setStats({
        totalCourses: coursesData.length,
        totalStudents,
        totalQuizzes,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and track student progress</p>
        </div>
        <Button onClick={() => navigate("/courses/create")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <BarChart className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">Created quizzes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Your Courses</CardTitle>
          <CardDescription>Manage and edit your courses</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses created yet</p>
              <Button onClick={() => navigate("/courses/create")} className="mt-4">
                Create Your First Course
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{course.enrollments?.[0]?.count || 0} students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart className="h-4 w-4" />
                        <span>{course.quizzes?.[0]?.count || 0} quizzes</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/quizzes/manage?courseId=${course.id}`)}
                    >
                      Manage Quizzes
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
