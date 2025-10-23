import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, Flame, Target, Play } from "lucide-react";

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    // Load all available courses instead of enrollments
    const { data: coursesData } = await supabase
      .from("courses")
      .select(`
        *,
        profiles (full_name)
      `)
      .order("created_at", { ascending: false })
      .limit(6); // Show recent courses

    const { data: badgesData } = await supabase
      .from("badges")
      .select("*")
      .eq("student_id", session.user.id);

    setProfile(profileData);
    setCourses(coursesData || []);
    setBadges(badgesData || []);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {profile?.full_name || "Student"}!</h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.streak_count || 0} days</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">Educational videos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Trophy className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{badges.length}</div>
            <p className="text-xs text-muted-foreground">Achievements</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.streak_count || 0}
            </div>
            <p className="text-xs text-muted-foreground">Days in a row</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Courses</CardTitle>
          <CardDescription>Explore the latest educational content</CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No courses available yet</p>
              <p className="text-sm text-muted-foreground mt-1">Check back soon for new content</p>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="flex items-center gap-4 p-4 rounded-lg border border-border hover-lift card-hover">
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By {course.profiles?.full_name || "Instructor"}
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate(`/courses/${course.id}/watch`)}
                    className="hover-lift"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {badges.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Your Badges</CardTitle>
            <CardDescription>Achievements you've unlocked</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <Badge key={badge.id} variant="secondary" className="text-sm py-2 px-4">
                  <Trophy className="h-3 w-3 mr-1" />
                  {badge.badge_type.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
