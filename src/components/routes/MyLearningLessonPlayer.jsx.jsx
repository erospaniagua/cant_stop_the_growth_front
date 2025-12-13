import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "@/api/client.js";
import { useUser } from "@/context/UserContext";
import { useRef } from "react";

/* ===========================================================
   📘 LESSON PLAYER
=========================================================== */
export default function MyLearningLessonPlayer() {
  const { routeId, lessonId } = useParams();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(true);

  const { user, loading: userLoading } = useUser();
  const userId = user?.id;

  /* ===========================================================
     ⛔ HARD GUARD — USER MUST EXIST
     
  =========================================================== */
  if (userLoading) {
    return <p className="p-8">Loading user…</p>;
  }

  /* ===========================================================
     Load Lesson + Playlist
  =========================================================== */
  useEffect(() => {
    (async () => {
      try {
        const [lessonRes, playlistRes] = await Promise.all([
          apiClient.get(`/api/learning-tracks/${routeId}/lessons/${lessonId}`),
          apiClient.get(`/api/learning-tracks/${routeId}/lessons`),
        ]);

        setLesson(lessonRes);
        setPlaylist(playlistRes.lessons || []);
      } catch (err) {
        console.error("Failed to load lesson player:", err);
      } finally {
        setLoadingLesson(false);
      }
    })();
  }, [routeId, lessonId]);

  /* ===========================================================
     Sync Lesson Completion
  =========================================================== */
  useEffect(() => {
    if (!completed) return;

    (async () => {
      try {
        await apiClient.patch(
          `/api/progress/${routeId}/lesson/${lessonId}/complete`
        );
        console.log("Progress synced");
      } catch (err) {
        console.error("Failed syncing progress:", err);
      }
    })();
  }, [completed, routeId, lessonId]);

  /* ===========================================================
     Indexing logic
  =========================================================== */
  const currentIndex = useMemo(
    () => playlist.findIndex((l) => l.id === lessonId),
    [playlist, lessonId]
  );

  const nextLesson = currentIndex >= 0 ? playlist[currentIndex + 1] : null;
  const prevLesson = currentIndex > 0 ? playlist[currentIndex - 1] : null;

  /* ===========================================================
     Rendering guards
  =========================================================== */
  if (loadingLesson) return <p className="p-8">Loading lesson…</p>;
  if (!lesson) return <p className="p-8 text-red-500">Lesson not found</p>;

  const type = lesson.type;
  const fileUrl = lesson.payload?.fileUrl;
  const title = lesson.title;

  console.log("CERT RENDER CHECK:", { type, userId });

  /* ===========================================================
     Navigation
  =========================================================== */
  const goPrev = () => {
    if (!prevLesson) return;
    navigate(`/my-learning-tracks/${routeId}/lessons/${prevLesson.id}`);
  };

  const goNext = () => {
    if (!completed && type !== "pdf") return;

    if (!nextLesson) {
      navigate(`/my-learning-tracks/${routeId}`);
      return;
    }

    navigate(`/my-learning-tracks/${routeId}/lessons/${nextLesson.id}`);
  };

  /* ===========================================================
     RENDER
  =========================================================== */
  return (
    <div className="p-6 min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">{title || "Lesson"}</h1>
          <p className="text-xs text-neutral-500">{type?.toUpperCase()}</p>
        </div>
        <button
          onClick={() => navigate(`/my-learning-tracks/${routeId}`)}
          className="text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
        >
          ← Back to route
        </button>
      </header>

      {/* VIEWER */}
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

        {type === "cert" && (
          <CertificateStub
            routeId={routeId}
            userId={userId}
            onReady={() => setCompleted(true)}
          />
        )}

      </div>

      {/* FOOTER */}
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
   🎓 CERTIFICATE STUB
=========================================================== */
function CertificateStub({ routeId, userId, onReady }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const hasRun = useRef(false)

  useEffect(() => {
    if (!userId || !routeId) return;
    if (hasRun.current) return; // 🚫 prevent double fire
        hasRun.current = true;

    async function run() {
      try {
        // 1️⃣ Ensure cert exists + email sent (idempotent)
        await apiClient.post("/api/certificates/send", {
          userId,
          routeId,
        });

        // 2️⃣ Ask backend for signed S3 URL
        const res = await apiClient.get(
          `/api/certificates/${userId}/${routeId}/view`
        );

        setPdfUrl(res.url);
        onReady?.();
      } catch (err) {
        console.error("Certificate flow failed:", err);
      }
    }

    run();
  }, [userId, routeId]);

  if (!pdfUrl) {
    return (
      <p className="text-center text-gray-500">
        Generating certificate…
      </p>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      className="w-full h-[80vh] border rounded-lg"
      title="Certificate"
    />
  );
}

function QuizViewer({ lesson, onComplete }) {
  const questions = lesson.payload?.questions || [];

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => answers[q.id] !== undefined);

  const handleSelect = (questionId, answerIndex) => {
    if (submitted) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const handleSubmit = () => {
    if (!allAnswered) return;

    setSubmitted(true);

    // Optional scoring (not enforced yet)
    const score = questions.reduce((acc, q) => {
      const selectedIdx = answers[q.id];
      const selected = q.answers[selectedIdx];
      return acc + (selected?.correct ? 1 : 0);
    }, 0);

    console.log("Quiz completed:", {
      score,
      total: questions.length,
    });

    onComplete?.();
  };

  if (!questions.length) {
    return (
      <p className="text-center text-neutral-500">
        Quiz not available
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {questions.map((q, qi) => (
        <div
          key={q.id}
          className="border rounded-lg p-4 dark:border-neutral-800"
        >
          <p className="font-medium mb-3">
            {qi + 1}. {q.text}
          </p>

          <div className="space-y-2">
            {q.answers.map((a, ai) => {
              const selected = answers[q.id] === ai;

              let stateClass =
                "border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900";

              if (submitted) {
                if (a.correct) {
                  stateClass =
                    "bg-green-600 text-white border-green-600";
                } else if (selected) {
                  stateClass =
                    "bg-red-600 text-white border-red-600";
                }
              } else if (selected) {
                stateClass =
                  "bg-blue-600 text-white border-blue-600";
              }

              return (
                <button
                  key={ai}
                  onClick={() => handleSelect(q.id, ai)}
                  className={`w-full text-left px-3 py-2 rounded border ${stateClass}`}
                >
                  {a.text}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="pt-4 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered || submitted}
          className={`px-6 py-2 rounded text-white ${
            allAnswered
              ? "bg-green-600 hover:bg-green-500"
              : "bg-neutral-400 cursor-not-allowed"
          }`}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}


