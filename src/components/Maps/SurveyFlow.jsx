import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";

const OPTIONS = [
  { value: "not_confident", label: "Never Done it" },
  { value: "somewhat_confident", label: "Know the Topic" },
  { value: "very_confident", label: "Some hands-on Experience" },
  { value: "mastered", label: "Can complete without supervision" },
];

function optionLabel(value) {
  return OPTIONS.find((o) => o.value === value)?.label || "—";
}

export default function SurveyFlow({ careerMapId, onClose, onSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [template, setTemplate] = useState(null);

  // steps: "intro" -> "question" -> "review" -> "submitted"
  const [step, setStep] = useState("intro");

  // question index (0..n-1)
  const [idx, setIdx] = useState(0);

  // edit mode: when user clicks a review item
  // in edit mode, "Next" should return to review instead of advancing
  const [editFromReview, setEditFromReview] = useState(false);

  // answers: { [skillId]: value }
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // ✅ correct route base: career-surveys
        const data = await apiClient.get(
          `/api/career-survey/career-maps/${careerMapId}/template`
        );

        if (!alive) return;

        setTemplate(data);

        const init = {};
        for (const q of data?.questions || []) init[String(q.skillId)] = "";
        setAnswers(init);

        setStep("intro");
        setIdx(0);
        setEditFromReview(false);
      } catch (e) {
        setErr(e?.payload?.message || e?.message || "Failed to load survey");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => (alive = false);
  }, [careerMapId]);

  const questions = useMemo(() => template?.questions || [], [template]);
  const total = questions.length;

  const allAnswered = useMemo(() => {
    if (!total) return false;
    return questions.every((q) => Boolean(answers[String(q.skillId)]));
  }, [questions, answers, total]);

  const masteredCount = useMemo(() => {
    return Object.values(answers).filter((v) => v === "mastered").length;
  }, [answers]);

  const currentQ = questions[idx];

  function setAnswer(skillId, value) {
    setAnswers((prev) => ({ ...prev, [String(skillId)]: value }));
  }

  function goToQuestion(i, { fromReview = false } = {}) {
    setIdx(Math.max(0, Math.min(total - 1, i)));
    setEditFromReview(Boolean(fromReview));
    setStep("question");
  }

  function nextFromQuestion() {
    if (!currentQ) return;

    // if editing from review, next goes back to review
    if (editFromReview) {
      setEditFromReview(false);
      setStep("review");
      return;
    }

    // normal flow
    if (idx < total - 1) setIdx((x) => x + 1);
    else setStep("review");
  }

  function backFromQuestion() {
    if (editFromReview) {
      setEditFromReview(false);
      setStep("review");
      return;
    }
    if (idx > 0) setIdx((x) => x - 1);
    else setStep("intro");
  }

  async function handleSubmit() {
    try {
      if (!allAnswered) return;

      setSaving(true);
      setErr("");

      const payload = {
        answers: questions.map((q) => ({
          skillId: q.skillId,
          value: answers[String(q.skillId)],
        })),
      };

      await apiClient.post(
        `/api/career-survey/career-maps/${careerMapId}/submit`,
        payload
      );

      setStep("submitted");
      onSubmitted?.();
    } catch (e) {
      setErr(e?.payload?.message || e?.message || "Submit failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-4">Loading survey…</div>;

  if (err) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-red-600">{err}</div>
        <button className="px-3 py-2 border rounded" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  if (!total) {
    return (
      <div className="p-4 space-y-3">
        <div className="font-semibold">No questions</div>
        <div className="text-sm text-gray-600">
          This career map has no survey questions yet.
        </div>
        <button className="px-3 py-2 border rounded" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  if (step === "submitted") {
    return (
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Survey under review</h2>
        <p className="text-sm text-gray-600">
          Your survey is under review. Your career map will unlock once it’s reviewed.
        </p>
        <button className="px-3 py-2 border rounded" onClick={onClose}>
          Close
        </button>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-semibold">
          Survey: {template?.careerMap?.title || "Career Map"}
        </h2>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            Please complete this survey in order to unlock your career map.
          </p>
          <p>
            Try to solve it in one sitting. Partial submissions are not supported.
          </p>
          <p>
            You’ll answer <b>{total}</b> questions (one per skill). Each question has 4 options:
          </p>
          <ul className="list-disc pl-5">
            {OPTIONS.map((o) => (
              <li key={o.value}>
                <b>{o.label}</b>
              </li>
            ))}
          </ul>
          
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 bg-black text-white rounded"
            onClick={() => goToQuestion(0)}
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === "question") {
    const skillId = String(currentQ?.skillId);
    const chosen = answers[skillId];

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-gray-600">
            Question {idx + 1} / {total}
          </div>
          {editFromReview ? (
            <div className="text-xs px-2 py-1 border rounded text-gray-600">
              editing from review
            </div>
          ) : null}
        </div>

        <div className="rounded border p-4 space-y-3">
          <div className="text-lg font-semibold">{currentQ?.title || "Question"}</div>
          <div className="text-sm text-gray-700">{currentQ?.prompt || "—"}</div>

          <div className="space-y-2 pt-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={[
                  "w-full text-left px-3 py-2 border rounded",
                  chosen === o.value ? "bg-black text-white" : "hover:bg-gray-50",
                ].join(" ")}
                onClick={() => setAnswer(skillId, o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button className="px-3 py-2 border rounded" onClick={backFromQuestion}>
            Back
          </button>
          <button
            className="px-3 py-2 bg-black text-white rounded disabled:opacity-50"
            disabled={!chosen}
            onClick={nextFromQuestion}
          >
            {editFromReview ? "Back to review" : idx === total - 1 ? "Review" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  // step === "review"
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Review your answers</h2>
          <p className="text-sm text-gray-600">
            Mastered: <b>{masteredCount}</b>
          </p>
        </div>
        <button className="px-3 py-2 border rounded" onClick={onClose} disabled={saving}>
          Close
        </button>
      </div>

      {/* Minimalist list, no inner scroll */}
      <div className="divide-y border rounded">
        {questions.map((q, i) => {
          const val = answers[String(q.skillId)];
          return (
            <button
              key={String(q.skillId)}
              type="button"
              className="w-full text-left p-3 hover:bg-gray-50"
              onClick={() => goToQuestion(i, { fromReview: true })}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {i + 1}. {q.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{q.prompt}</div>
                </div>
                <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                  {val ? optionLabel(val) : "—"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {!allAnswered ? (
        <div className="text-sm text-red-600">
          Some questions are missing answers. Click them to finish.
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <button className="px-3 py-2 border rounded" onClick={() => goToQuestion(total - 1)}>
          Back
        </button>
        <button
          className="px-3 py-2 bg-black text-white rounded disabled:opacity-50"
          disabled={!allAnswered || saving}
          onClick={handleSubmit}
        >
          {saving ? "Submitting…" : "Submit survey"}
        </button>
      </div>
    </div>
  );
}
