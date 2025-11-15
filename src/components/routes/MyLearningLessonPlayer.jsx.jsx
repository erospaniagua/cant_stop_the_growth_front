import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client.js";

/* ===========================================================
   📘 LESSON PLAYER
   =========================================================== */
export default function MyLearningLessonPlayer() {
  const { routeId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ===========================================================
     Load current lesson + full playlist
  =========================================================== */
  useEffect(() => {
    (async () => {
      try {
        const [lessonRes, playlistRes] = await Promise.all([
          apiClient.get(`/api/learning-routes/${routeId}/lessons/${lessonId}`),
          apiClient.get(`/api/learning-routes/${routeId}/lessons`),
        ]);

        setLesson(lessonRes);
        setPlaylist(playlistRes.lessons || []);
      } catch (err) {
        console.error("Failed to load lesson player:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [routeId, lessonId]);

  /* ===========================================================
     Indexing logic (prev / next)
  =========================================================== */
  const currentIndex = useMemo(
    () => playlist.findIndex((l) => l.id === lessonId),
    [playlist, lessonId]
  );

  const nextLesson = currentIndex >= 0 ? playlist[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? playlist[currentIndex - 1] : null;

  const goPrev = () => {
    if (!prevLesson) return;
    navigate(`/my-learning-routes/${routeId}/lessons/${prevLesson.id}`);
  };

  const goNext = () => {
    if (!nextLesson) {
      // Last lesson in route
      navigate(`/my-learning-routes/${routeId}`);
      return;
    }
    navigate(`/my-learning-routes/${routeId}/lessons/${nextLesson.id}`);
  };

  /* ===========================================================
     Rendering
  =========================================================== */
  if (loading) return <p className="p-8">Loading lesson...</p>;
  if (!lesson) return <p className="p-8 text-red-500">Lesson not found</p>;

  const type = lesson.type;
  const fileUrl = lesson.payload?.fileUrl;
  const title = lesson.title;

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">{title || "Lesson"}</h1>
          <p className="text-xs text-neutral-500">{type?.toUpperCase()}</p>
        </div>
        <button
          onClick={() => navigate(`/my-learning-routes/${routeId}`)}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Back to route
        </button>
      </header>

      {/* Viewer */}
      <div className="flex-1">
        {type === "video" && (
          <video
            src={fileUrl}
            controls
            onEnded={() => setCompleted(true)}
            className="w-full max-w-4xl rounded-lg mx-auto"
          />
        )}

        {type === "pdf" && (
          <iframe
            src={fileUrl}
            className="w-full h-[80vh] border rounded-lg"
            title={title}
            onLoad={() => setCompleted(true)}
          />
        )}

        {type === "quiz" && (
          <QuizViewer lesson={lesson} onComplete={() => setCompleted(true)} />
        )}

        {type === "cert" && <CertificateStub onReady={() => setCompleted(true)} />}

        {!["video", "pdf", "quiz", "cert"].includes(type || "") && (
          <p className="text-neutral-500 italic text-center mt-20">
            Unsupported lesson type
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="pt-4 flex justify-between">
        <button
          onClick={goPrev}
          disabled={!prevLesson}
          className={`px-4 py-2 rounded text-white ${
            prevLesson
              ? "bg-neutral-700 hover:bg-neutral-600"
              : "bg-neutral-500 cursor-not-allowed"
          }`}
        >
          ← Previous
        </button>

        <button
          onClick={goNext}
          disabled={!completed && type !== "pdf"}
          className={`px-4 py-2 rounded text-white ${
            completed || type === "pdf"
              ? "bg-blue-600 hover:bg-blue-500"
              : "bg-neutral-500 cursor-not-allowed"
          }`}
        >
          {nextLesson ? "Next →" : "Finish Route"}
        </button>
      </footer>
    </div>
  );
}

/* ===========================================================
   🧩 QUIZ VIEWER
   =========================================================== */
function QuizViewer({ lesson, onComplete }) {
  const questions = lesson?.payload?.questions || [];
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (qId, aIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qId]: aIndex }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => onComplete?.(), 800);
  };

  return (
    <div className="max-w-xl mx-auto mt-8 space-y-6">
      {questions.map((q) => (
        <div key={q.id} className="border p-4 rounded-lg">
          <h3 className="font-medium mb-2">{q.text}</h3>
          <div className="space-y-2">
            {q.answers.map((a, i) => {
              const selected = answers[q.id] === i;
              const correct = submitted && a.correct;
              const wrong = submitted && selected && !a.correct;

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(q.id, i)}
                  disabled={submitted}
                  className={`w-full text-left p-3 rounded border ${
                    correct
                      ? "bg-green-500 text-white"
                      : wrong
                      ? "bg-red-500 text-white"
                      : selected
                      ? "border-blue-500"
                      : "hover:border-blue-400"
                  }`}
                >
                  {a.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < questions.length}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      )}

      {submitted && (
        <p className="text-center text-green-600 font-medium">
          Quiz completed ✅
        </p>
      )}
    </div>
  );
}

/* ===========================================================
   🎓 CERTIFICATE STUB
   =========================================================== */
function CertificateStub({ onReady }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Certificate</h2>
        <p className="text-neutral-500">Generated upon completion</p>
      </div>
    </div>
  );
}
