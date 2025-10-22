import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, BookOpen, Trophy, BarChart3, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <section className="relative bg-gradient-hero py-20 px-4 overflow-hidden">
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Transform Your Learning Journey</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-primary">
            Learn, Grow, Excel
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of students and teachers on LearnHub. Create engaging courses, 
            track progress, and achieve your learning goals with our comprehensive LMS platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/courses")} className="text-lg px-8">
              Explore Courses
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose LearnHub?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for an engaging learning experience
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="shadow-card hover:shadow-lg-colored transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Interactive Courses</CardTitle>
                <CardDescription>
                  Engage with rich course content, quizzes, and hands-on learning materials
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-lg-colored transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Gamification</CardTitle>
                <CardDescription>
                  Earn badges, maintain streaks, and compete on leaderboards to stay motivated
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-lg-colored transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-lg bg-success/10 w-fit mb-4">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
                <CardTitle>Progress Tracking</CardTitle>
                <CardDescription>
                  Monitor your learning journey with detailed analytics and insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-lg-colored transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-lg bg-warning/10 w-fit mb-4">
                  <Users className="h-6 w-6 text-warning" />
                </div>
                <CardTitle>For Teachers</CardTitle>
                <CardDescription>
                  Create and manage courses, add quizzes, and track student performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-lg-colored transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>For Students</CardTitle>
                <CardDescription>
                  Enroll in courses, take quizzes, and track your learning progress
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="shadow-card hover:shadow-lg-colored transition-all duration-300">
              <CardHeader>
                <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4">
                  <Sparkles className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Smart Features</CardTitle>
                <CardDescription>
                  Notifications, streaks, and achievements to enhance your learning experience
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join our community of learners and educators today
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8">
            Create Your Free Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
