import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/api/client.js";

/**
 * QuizEditor — handles quiz creation and auto-saves progress to MongoDB.
 * - Syncs changes to parent state via onChange
 * - Auto-saves every 2s after user input stops
 * - Shows save status in UI
 */
export default function QuizEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [questions, setQuestions] = useState(module.payload?.questions || []);
  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved" | "error"
  const timer = useRef(null);

  /* =========================================================
     🔄 Keep parent staging in sync immediately
  ========================================================= */
  useEffect(() => {
    onChange?.({ title, payload: { questions } });
  }, [title, questions]);

  /* =========================================================
     💾 Auto-save to Mongo after debounce (2s)
  ========================================================= */
  useEffect(() => {
    if (!module.courseId && !module._id) return; // skip if no course context

    // Clear previous timer
    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");

        const courseId = module.courseId || module._id;
        await apiClient.patch(`/api/courses/${courseId}`, {
          title: module.title || title,
          modules: [
            {
              ...module,
              title,
              payload: { questions },
            },
          ],
          finished: false,
        });

        setSaveStatus("saved");
        console.log("💾 Quiz auto-saved to Mongo:", courseId);

        // reset status after a short delay
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (err) {
        console.error("❌ Quiz auto-save failed:", err);
        setSaveStatus("error");
      }
    }, 2000);

    // Cleanup timer on unmount
    return () => clearTimeout(timer.current);
  }, [title, questions]);

  /* =========================================================
     🧩 Question / Answer management
  ========================================================= */
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: "",
        answers: [{ text: "", correct: false }],
      },
    ]);
  };

  const updateQuestion = (id, updated) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? updated : q))
    );
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const addAnswer = (qId) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId
          ? { ...q, answers: [...q.answers, { text: "", correct: false }] }
          : q
      )
    );
  };

  /* =========================================================
     🧱 Render
  ========================================================= */
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">🧩 Quiz</h2>
        {saveStatus === "saving" && (
          <span className="text-xs text-blue-400 animate-pulse">Saving...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-xs text-green-400">All changes saved ✓</span>
        )}
        {saveStatus === "error" && (
          <span className="text-xs text-red-400">Save failed ⚠</span>
        )}
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quiz title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
      />

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div
            key={q.id || qi}
            className="p-3 border border-neutral-700 rounded-lg bg-neutral-800/60"
          >
            {/* Question text */}
            <input
              type="text"
              value={q.text}
              onChange={(e) =>
                updateQuestion(q.id, { ...q, text: e.target.value })
              }
              placeholder={`Question ${qi + 1}`}
              className="w-full mb-2 px-2 py-1 bg-neutral-700 rounded text-sm text-white"
            />

            {/* Answers */}
            {q.answers.map((a, ai) => (
              <div key={ai} className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  checked={a.correct}
                  onChange={() => {
                    const updatedAnswers = q.answers.map((ans, i) => ({
                      ...ans,
                      correct: i === ai,
                    }));
                    updateQuestion(q.id, { ...q, answers: updatedAnswers });
                  }}
                />
                <input
                  type="text"
                  value={a.text}
                  onChange={(e) => {
                    const updatedAnswers = [...q.answers];
                    updatedAnswers[ai].text = e.target.value;
                    updateQuestion(q.id, { ...q, answers: updatedAnswers });
                  }}
                  placeholder={`Answer ${ai + 1}`}
                  className="flex-1 px-2 py-1 bg-neutral-700 rounded text-sm text-white"
                />
              </div>
            ))}

            {/* Controls */}
            <div className="flex justify-between text-xs text-neutral-400 mt-2">
              <button onClick={() => addAnswer(q.id)}>+ Add answer</button>
              <button onClick={() => removeQuestion(q.id)}>🗑 Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new question */}
      <button
        onClick={addQuestion}
        className="px-3 py-2 bg-yellow-500 text-black rounded text-sm"
      >
        + Add Question
      </button>
    </div>
  );
}
