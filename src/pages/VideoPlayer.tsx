import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Chatbot } from "@/components/Chatbot";
import { ArrowLeft, Play, BookOpen, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function VideoPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles (full_name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading course:", error);
      return;
    }

    setCourse(data);
    setLoading(false);
  };

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    return match ? match[1] : null;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-success/10 text-success";
      case "medium": return "bg-warning/10 text-warning";
      case "hard": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4" />
            <div className="aspect-video bg-muted rounded-lg mb-6" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <div className="h-6 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-full mb-4" />
                <div className="h-32 bg-muted rounded" />
              </div>
              <div className="h-96 bg-muted rounded" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/courses")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Card className="shadow-card">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Course not found</p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const videoId = getVideoId(course.video_url);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/courses")}
          className="mb-4 hover-lift"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-card card-hover">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{course.title}</CardTitle>
                    <CardDescription className="text-base">
                      {course.description}
                    </CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(course.difficulty)}>
                    {course.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>By {course.profiles?.full_name || "Instructor"}</span>
                  {course.category && (
                    <>
                      <span>•</span>
                      <span>{course.category}</span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {videoId ? (
                  <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={course.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Play className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Video not available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Course Content */}
            {course.content && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Course Materials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{course.content}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chatbot Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-card h-fit sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="animate-pulse-color w-2 h-2 rounded-full" />
                  AI Learning Assistant
                </CardTitle>
                <CardDescription>
                  Ask questions about this video and get instant help
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Chatbot courseId={course.id} videoTitle={course.title} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
