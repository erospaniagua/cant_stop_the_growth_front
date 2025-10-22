import { useState, useEffect } from "react";

export default function QuizEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [questions, setQuestions] = useState(module.payload?.questions || []);

  // Persist changes
  useEffect(() => {
    onChange?.({ title, payload: { questions } });
  }, [questions]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", answers: [{ text: "", correct: false }] },
    ]);
  };

  const updateQuestion = (idx, updated) => {
    const newQs = [...questions];
    newQs[idx] = updated;
    setQuestions(newQs);
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const addAnswer = (qIdx) => {
    const newQs = [...questions];
    newQs[qIdx].answers.push({ text: "", correct: false });
    setQuestions(newQs);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🧩 Quiz</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onChange?.({ title: e.target.value });
        }}
        placeholder="Quiz title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
      />

      <div className="space-y-3">
        {questions.map((q, qi) => (
          <div
            key={qi}
            className="p-3 border border-neutral-700 rounded-lg bg-neutral-800/60"
          >
            <input
              type="text"
              value={q.text}
              onChange={(e) =>
                updateQuestion(qi, { ...q, text: e.target.value })
              }
              placeholder={`Question ${qi + 1}`}
              className="w-full mb-2 px-2 py-1 bg-neutral-700 rounded text-sm text-white"
            />
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
                    updateQuestion(qi, { ...q, answers: updatedAnswers });
                  }}
                />
                <input
                  type="text"
                  value={a.text}
                  onChange={(e) => {
                    const updatedAnswers = [...q.answers];
                    updatedAnswers[ai].text = e.target.value;
                    updateQuestion(qi, { ...q, answers: updatedAnswers });
                  }}
                  placeholder={`Answer ${ai + 1}`}
                  className="flex-1 px-2 py-1 bg-neutral-700 rounded text-sm text-white"
                />
              </div>
            ))}
            <div className="flex justify-between text-xs text-neutral-400 mt-2">
              <button onClick={() => addAnswer(qi)}>+ Add answer</button>
              <button onClick={() => removeQuestion(qi)}>🗑 Remove</button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="px-3 py-2 bg-yellow-500 text-black rounded text-sm"
      >
        + Add Question
      </button>
    </div>
  );
}
