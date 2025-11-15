import { useState, useEffect } from "react";

/**
 * QuizEditor — handles quiz creation within a phase module.
 * - No backend autosave
 * - Syncs changes upward via onChange
 * - Parent (PhaseEditor) handles saving when user closes the node
 */
export default function QuizEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [questions, setQuestions] = useState(module.payload?.questions || []);
  const [status, setStatus] = useState("idle"); // "idle" | "editing" | "saved"

  /* =========================================================
     🔄 Keep parent (phase) state in sync immediately
  ========================================================= */
  useEffect(() => {
    onChange?.({
      ...module,                     // ✅ preserve other fields (type, _id, etc.)
      title,
      payload: { questions },        // ✅ consistent payload shape
    });
    setStatus("editing");
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
    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)));
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
        {status === "editing" && (
          <span className="text-xs text-yellow-400">Unsaved changes</span>
        )}
        {status === "saved" && (
          <span className="text-xs text-green-400">Saved ✓</span>
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
