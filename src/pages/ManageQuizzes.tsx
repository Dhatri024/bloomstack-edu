import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
}

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  points: number;
}

export default function ManageQuizzes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("courseId");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
    passing_score: 70,
  });
  const [questions, setQuestions] = useState<Question[]>([
    { question: "", options: ["", "", "", ""], correct_answer: 0, points: 10 },
  ]);

  useEffect(() => {
    if (courseId) {
      loadCourseAndQuizzes();
    }
  }, [courseId]);

  const loadCourseAndQuizzes = async () => {
    setLoading(true);
    try {
      const { data: course } = await supabase
        .from("courses")
        .select("title, description")
        .eq("id", courseId)
        .single();

      if (course) {
        setCourseName(course.title);
        setCourseDescription(course.description || "");
      }

      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("course_id", courseId);

      if (quizzesData) {
        setQuizzes(quizzesData);
      }
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

  const handleGenerateWithAI = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quiz", {
        body: {
          courseTitle: courseName,
          courseDescription: courseDescription,
          numberOfQuestions: 5,
          difficulty: "medium",
        },
      });

      if (error) throw error;

      if (data.questions) {
        setQuestions(data.questions);
        toast({
          title: "Success",
          description: "AI generated quiz questions successfully",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    if (!courseId) return;
    
    setLoading(true);
    try {
      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from("quizzes")
        .insert([
          {
            course_id: courseId,
            title: newQuiz.title,
            description: newQuiz.description,
            passing_score: newQuiz.passing_score,
          },
        ])
        .select()
        .single();

      if (quizError) throw quizError;

      // Create questions
      const questionsToInsert = questions
        .filter((q) => q.question.trim() !== "")
        .map((q) => ({
          quiz_id: quiz.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          points: q.points,
        }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: "Success",
        description: "Quiz created successfully",
      });
      
      setShowCreateDialog(false);
      setNewQuiz({ title: "", description: "", passing_score: 70 });
      setQuestions([{ question: "", options: ["", "", "", ""], correct_answer: 0, points: 10 }]);
      loadCourseAndQuizzes();
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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correct_answer: 0, points: 10 },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manage Quizzes</h1>
            <p className="text-muted-foreground mt-1">Course: {courseName}</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
                <DialogDescription>
                  Create questions manually or use AI to generate them
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quiz-title">Quiz Title *</Label>
                  <Input
                    id="quiz-title"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                    placeholder="Quiz 1: Introduction"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea
                    id="quiz-description"
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                    placeholder="What will this quiz cover?"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passing-score">Passing Score (%)</Label>
                  <Input
                    id="passing-score"
                    type="number"
                    min="0"
                    max="100"
                    value={newQuiz.passing_score}
                    onChange={(e) => setNewQuiz({ ...newQuiz, passing_score: parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <h3 className="text-lg font-semibold">Questions</h3>
                  <Button
                    onClick={handleGenerateWithAI}
                    disabled={aiLoading}
                    variant="outline"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>

                {questions.map((q, qIndex) => (
                  <Card key={qIndex}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <Label>Question {qIndex + 1}</Label>
                        {questions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <Input
                        value={q.question}
                        onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                        placeholder="Enter your question"
                      />

                      <div className="space-y-2">
                        <Label>Options</Label>
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <Input
                              value={opt}
                              onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                            />
                            <input
                              type="radio"
                              name={`correct-${qIndex}`}
                              checked={q.correct_answer === oIndex}
                              onChange={() => updateQuestion(qIndex, "correct_answer", oIndex)}
                              className="h-4 w-4"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                          <Label>Points</Label>
                          <Input
                            type="number"
                            min="1"
                            value={q.points}
                            onChange={(e) => updateQuestion(qIndex, "points", parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button onClick={addQuestion} variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Question
                </Button>

                <Button
                  onClick={handleCreateQuiz}
                  disabled={loading || !newQuiz.title}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Quiz"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : quizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No quizzes created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <CardDescription>{quiz.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Passing Score: {quiz.passing_score}%
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
