import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Search, Play } from "lucide-react";

export default function CreateCourse() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [videoSuggestions, setVideoSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    category: string;
    difficulty: "easy" | "medium" | "hard";
    video_url: string;
    content: string;
  }>({
    title: "",
    description: "",
    category: "",
    difficulty: "medium",
    video_url: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to create a course",
          variant: "destructive",
        });
        return;
      }

      // Validate YouTube URL if provided
      if (formData.video_url && !isValidYouTubeUrl(formData.video_url)) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid YouTube URL",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("courses").insert([
        {
          ...formData,
          teacher_id: session.user.id,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course created successfully",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isValidYouTubeUrl = (url: string) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return pattern.test(url);
  };

  const searchYouTubeVideos = async (query: string) => {
    if (!query.trim()) {
      setVideoSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!YOUTUBE_API_KEY) {
        toast({
          title: "API Key Missing",
          description: "YouTube API key not configured. Please add VITE_YOUTUBE_API_KEY to your environment variables.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          query
        )}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}&order=relevance&safeSearch=strict`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch YouTube videos");
      }

      const data = await response.json();
      setVideoSuggestions(data.items || []);
    } catch (error) {
      console.error("YouTube search error:", error);
      toast({
        title: "Search Failed",
        description: "Unable to search YouTube videos. Please try again.",
        variant: "destructive",
      });
      setVideoSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const selectVideoSuggestion = (video: any) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
    const title = video.snippet.title;
    const description = video.snippet.description;

    setFormData({
      ...formData,
      title: title || formData.title,
      description: description || formData.description,
      video_url: videoUrl,
    });
    setVideoSuggestions([]);
    setSearchQuery("");
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchYouTubeVideos(searchQuery);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create New Course</CardTitle>
            <CardDescription>
              Add a new course with video content from YouTube
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Introduction to Programming"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe what students will learn"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Programming, Mathematics"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: "easy" | "medium" | "hard") =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video_search">Search YouTube Videos</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="video_search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for educational videos..."
                      className="pl-10"
                    />
                    {searching && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {videoSuggestions.length > 0 && (
                    <Card className="shadow-card">
                      <CardContent className="p-2">
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {videoSuggestions.map((video) => (
                            <div
                              key={video.id.videoId}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                              onClick={() => selectVideoSuggestion(video)}
                            >
                              <img
                                src={video.snippet.thumbnails.default.url}
                                alt={video.snippet.title}
                                className="w-16 h-12 rounded object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-2">
                                  {video.snippet.title}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {video.snippet.channelTitle}
                                </p>
                              </div>
                              <Play className="h-4 w-4 text-primary" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">YouTube Video URL</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, video_url: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-sm text-muted-foreground">
                    Search above or paste a YouTube URL directly
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Course Content/Materials</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Additional course materials, reading lists, etc."
                  rows={6}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
