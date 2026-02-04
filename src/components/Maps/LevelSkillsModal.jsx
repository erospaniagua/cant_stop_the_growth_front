import { useState, useEffect, useMemo } from "react";
import { apiClient } from "@/api/client";
import ModalShell from "../ui/ModalShell";

function isObjectId(v) {
  return /^[a-f\d]{24}$/i.test(String(v || ""));
}

function safeErrMsg(e) {
  return (
    e?.response?.data?.message ||
    e?.data?.message ||
    e?.message ||
    "Something broke. Congrats."
  );
}

function isThreadOpen(thread) {
  if (!thread) return false;
  return String(thread.status || "").toLowerCase() === "pending";
}
function isThreadClosed(thread) {
  if (!thread) return false;
  const s = String(thread.status || "").toLowerCase();
  return ["closed", "approved", "rejected", "resolved", "done"].includes(s);
}
function isStudentsTurn(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return true;
  const last = messages[messages.length - 1];
  return String(last?.senderRole || "").toLowerCase() !== "student";
}

function PillBadge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
    green:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
    yellow:
      "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-900",
    purple:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}

function SurveyUnderReview() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">
        Survey under review
      </div>
      <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
        Your claimed skills are being reviewed. This level unlocks after at least one approval.
      </div>
    </div>
  );
}

function SurveyReviewedButLocked() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">
        Waiting for approval
      </div>
      <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
        Survey reviewed, but no skill has been approved yet. This level unlocks after at least one approval.
      </div>
    </div>
  );
}

function SurveyWizard({ careerLevelId, onSubmitted }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [tpl, setTpl] = useState(null);

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState("answer"); // answer | review | submitting | done
  const [answers, setAnswers] = useState({}); // skillId -> value

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!careerLevelId) return;
      setLoading(true);
      setErr("");
      try {
        const res = await apiClient.get(`/api/career-survey/levels/${careerLevelId}/template`);
        if (!mounted) return;
        setTpl(res || null);
        setAnswers({});
        setStep(0);
        setMode("answer");
      } catch (e) {
        if (!mounted) return;
        setErr(safeErrMsg(e));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [careerLevelId]);

  const questions = tpl?.questions || [];
  const q = questions[step];

  const allAnswered =
    questions.length > 0 && questions.every((qq) => Boolean(answers[String(qq.skillId)]));

  const optionLabel = (qq, val) =>
    (qq?.options || []).find((o) => String(o.value) === String(val))?.label || String(val);

  async function submitAll() {
    if (!allAnswered) return;

    setMode("submitting");
    setErr("");
    try {
      const payload = {
        answers: questions.map((qq) => ({
          skillId: qq.skillId,
          value: answers[String(qq.skillId)],
        })),
      };
      await apiClient.post(`/api/career-survey/levels/${careerLevelId}/submit`, payload);
      setMode("done");
      onSubmitted?.();
    } catch (e) {
      setErr(safeErrMsg(e));
      setMode("review");
    }
  }

  if (loading) return <div className="text-sm text-gray-600 dark:text-zinc-400">Loading survey…</div>;
  if (err) {
    return (
      <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {err}
      </div>
    );
  }
  if (!questions.length) {
    return <div className="text-sm text-gray-600 dark:text-zinc-400">No survey questions.</div>;
  }

  if (mode === "done") {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
        <div className="font-semibold text-gray-900 dark:text-zinc-100">Survey submitted</div>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Now it goes to review.
        </div>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-zinc-100">Review answers</div>
          <PillBadge tone={allAnswered ? "green" : "yellow"}>
            {allAnswered ? "ready" : "missing answers"}
          </PillBadge>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
          {questions.map((qq, idx) => (
            <div
              key={String(qq.skillId)}
              className="rounded border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3"
            >
              <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                {idx + 1}. {qq.title}
              </div>
              <div className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                {qq.prompt}
              </div>
              <div className="text-sm mt-2">
                <span className="text-gray-600 dark:text-zinc-400">Answer: </span>
                <span className="font-medium text-gray-900 dark:text-zinc-100">
                  {answers[String(qq.skillId)]
                    ? optionLabel(qq, answers[String(qq.skillId)])
                    : "—"}
                </span>
              </div>
              {!answers[String(qq.skillId)] ? (
                <div className="mt-2 text-xs text-red-700 dark:text-red-300">Missing answer.</div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100"
            onClick={() => setMode("answer")}
            disabled={mode === "submitting"}
          >
            Back
          </button>
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            onClick={submitAll}
            disabled={!allAnswered || mode === "submitting"}
          >
            {mode === "submitting" ? "Submitting…" : "Submit survey"}
          </button>
        </div>
      </div>
    );
  }

  // mode === "answer"
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-gray-600 dark:text-zinc-400">
          Question {step + 1} / {questions.length}
        </div>
        <button
          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
          onClick={() => setMode("review")}
          disabled={!allAnswered}
          title={!allAnswered ? "Answer all questions first" : "Review before submit"}
        >
          Review
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
        <div className="font-semibold text-gray-900 dark:text-zinc-100">{q?.title}</div>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1 whitespace-pre-line">
          {q?.prompt || "—"}
        </div>

        <div className="mt-4 space-y-2">
          {(q?.options || []).map((opt) => (
            <label key={String(opt.value)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`q_${String(q.skillId)}`}
                value={opt.value}
                checked={String(answers[String(q.skillId)] || "") === String(opt.value)}
                onChange={() =>
                  setAnswers((prev) => ({
                    ...prev,
                    [String(q.skillId)]: String(opt.value),
                  }))
                }
              />
              <span className="text-gray-900 dark:text-zinc-100">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </button>

        {step < questions.length - 1 ? (
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            onClick={() => setStep((s) => Math.min(questions.length - 1, s + 1))}
            disabled={!answers[String(q.skillId)]}
          >
            Next
          </button>
        ) : (
          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            onClick={() => setMode("review")}
            disabled={!allAnswered}
          >
            Review answers
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 dark:text-zinc-400">
        No partial submissions. One sitting. One life choice.
      </div>
    </div>
  );
}

function SkillsPills({ skills, skillStates, selectedSkillId, onPickSkill }) {
  const statusById = useMemo(() => {
    const m = new Map();
    (skillStates || []).forEach((s) => m.set(String(s.skillId), s));
    return m;
  }, [skillStates]);

  const groups = useMemo(() => {
    const g = { communication: [], technical: [] };
    (skills || []).forEach((sk) => {
      const t = sk?.skillType === "communication" ? "communication" : "technical";
      g[t].push(sk);
    });
    return g;
  }, [skills]);

  const pillTone = (type) =>
    type === "communication"
      ? "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900"
      : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:border-blue-900";

  const dotTone = (status) => {
    if (status === "acquired") return "bg-green-500";
    if (status === "pending") return "bg-yellow-500";
    if (status === "rejected") return "bg-red-500";
    return "bg-gray-400";
  };

  return (
    <div className="space-y-4">
      {["communication", "technical"].map((type) => {
        const list = groups[type] || [];
        if (!list.length) return null;

        return (
          <div key={type}>
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400 mb-2">
              {type}
            </div>

            <div className="flex flex-wrap gap-2">
              {list.map((sk) => {
                const active = String(sk._id) === String(selectedSkillId);
                const status = statusById.get(String(sk._id))?.status || "locked";

                return (
                  <button
                    key={sk._id}
                    type="button"
                    onClick={() => onPickSkill?.(sk)}
                    className={[
                      "px-3 py-1.5 rounded-full text-sm border transition",
                      pillTone(type),
                      active ? "ring-2 ring-blue-600 dark:ring-blue-500" : "hover:opacity-90",
                    ].join(" ")}
                    title="Open thread"
                  >
                    <span className={`inline-block h-2 w-2 rounded-full mr-2 ${dotTone(status)}`} />
                    {sk.title}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LevelSkillsModal({ open, levelId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);

  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadErr, setThreadErr] = useState("");
  const [threadData, setThreadData] = useState(null);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function fetchLevelState() {
    if (!levelId) return;
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get(`/api/career-levels/${levelId}/state`);
      setData(res || null);

      const unlocked = Boolean(res?.unlocked);
      const firstSkillId = unlocked && res?.skills?.[0]?._id ? String(res.skills[0]._id) : "";
      setSelectedSkillId(firstSkillId || "");
      setThreadData(null);
      setComposer("");
    } catch (e) {
      setErr(safeErrMsg(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchThread(skillId) {
    if (!isObjectId(skillId)) {
      setThreadData(null);
      return;
    }
    setThreadLoading(true);
    setThreadErr("");
    try {
      const res = await apiClient.get(`/api/skill-threads/me/${skillId}`);
      setThreadData(res || null);
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 404) setThreadData(null);
      else setThreadErr(safeErrMsg(e));
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    if (open) fetchLevelState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, levelId]);

  useEffect(() => {
    if (!open) return;
    if (selectedSkillId) fetchThread(selectedSkillId);
    else setThreadData(null);
    setComposer("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedSkillId]);

  const skillStates = useMemo(() => data?.skillStates || [], [data]);
  const skills = useMemo(() => data?.skills || [], [data]);

  const selectedSkill = useMemo(() => {
    return skills.find((s) => String(s._id) === String(selectedSkillId)) || null;
  }, [skills, selectedSkillId]);

  const unlocked = Boolean(data?.unlocked);
  const surveyStatus = String(data?.survey?.status || "not_submitted");
  const surveyExists = Boolean(data?.survey?.exists);

  const needsSurvey = !unlocked && (!surveyExists || surveyStatus === "not_submitted");
  const surveyPending = !unlocked && surveyExists && surveyStatus === "pending";
  const reviewedButLocked = !unlocked && surveyExists && surveyStatus === "reviewed";

  const currentThread = threadData?.thread || null;
  const currentMessages = threadData?.messages || [];
  const studentTurn = useMemo(() => isStudentsTurn(currentMessages), [currentMessages]);

  const primaryAction = useMemo(() => {
    if (!currentThread) return "request";
    if (isThreadOpen(currentThread)) return "open";
    if (isThreadClosed(currentThread)) return "request_again";
    return "open";
  }, [currentThread]);

  const primaryLabel =
    primaryAction === "request"
      ? "Request skill"
      : primaryAction === "request_again"
      ? "Request skill again"
      : "Open thread";

  const inputEnabled = Boolean(currentThread) && isThreadOpen(currentThread) && studentTurn;

  async function handlePrimaryClick() {
    if (!selectedSkill?._id) return;

    if (primaryAction === "open") {
      await fetchThread(selectedSkill._id);
      return;
    }

    setRequesting(true);
    try {
      await apiClient.post(`/api/skill-threads/me/${selectedSkill._id}/request`, {
        body: "Requesting approval. I can provide evidence.",
      });
      await fetchThread(selectedSkill._id);
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 409) await fetchThread(selectedSkill._id);
      else alert(safeErrMsg(e));
    } finally {
      setRequesting(false);
    }
  }

  async function handleSend() {
    if (!inputEnabled) return;
    const body = composer.trim();
    if (!body) return;

    setSending(true);
    try {
      await apiClient.post(`/api/skill-threads/${currentThread._id}/message`, { body });
      setComposer("");
      await fetchThread(selectedSkill._id);
    } catch (e) {
      alert(safeErrMsg(e));
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  return (
    <ModalShell
      title={`Level ${data?.level?.levelNumber ?? ""}: ${data?.level?.title ?? "Skills"}`}
      onClose={onClose}
    >
      {err ? (
        <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600 dark:text-zinc-400">Loading…</div>
      ) : !data ? (
        <div className="text-sm text-gray-600 dark:text-zinc-400">No data.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <PillBadge tone={unlocked ? "green" : needsSurvey ? "red" : "yellow"}>
              {unlocked ? "Unlocked" : needsSurvey ? "Survey required" : "In review"}
            </PillBadge>
            <PillBadge tone="gray">{data?.map?.title}</PillBadge>
            <PillBadge tone="gray">{data?.map?.category}</PillBadge>
          </div>

          {/* Survey replaces skills window when locked */}
          {needsSurvey ? (
            <SurveyWizard
              careerLevelId={levelId}
              onSubmitted={async () => {
                await fetchLevelState();
              }}
            />
          ) : surveyPending ? (
            <SurveyUnderReview />
          ) : reviewedButLocked ? (
            <SurveyReviewedButLocked />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
              {/* LEFT: pill list */}
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-gray-900 dark:text-zinc-100">Skills</div>
                  <PillBadge tone="gray">{skills.length}</PillBadge>
                </div>

                {skills.length === 0 ? (
                  <div className="text-sm text-gray-600 dark:text-zinc-400">No skills.</div>
                ) : (
                  <SkillsPills
                    skills={skills}
                    skillStates={skillStates}
                    selectedSkillId={selectedSkillId}
                    onPickSkill={(sk) => setSelectedSkillId(String(sk._id))}
                  />
                )}
              </div>

              {/* RIGHT: thread + details */}
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col min-h-[420px]">
                {!selectedSkill ? (
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    Pick a skill to see details and the thread.
                  </div>
                ) : (
                  <>
                    <div className="pb-3 border-b border-gray-200 dark:border-zinc-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-lg font-semibold text-gray-900 dark:text-zinc-100 truncate">
                            {selectedSkill.title}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                            {selectedSkill.description || "—"}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <PillBadge tone={selectedSkill.skillType === "communication" ? "purple" : "blue"}>
                              {selectedSkill.skillType || "technical"}
                            </PillBadge>
                            <PillBadge tone="gray">points {selectedSkill.points ?? 1}</PillBadge>
                            <PillBadge tone="gray">{selectedSkill.evidencePolicy || "manager_approval"}</PillBadge>
                            <PillBadge tone="gray">
                              state {String((skillStates || []).find((s) => String(s.skillId) === String(selectedSkill._id))?.status || "unknown")}
                            </PillBadge>
                          </div>
                        </div>

                        <button
                          className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                          disabled={requesting}
                          onClick={handlePrimaryClick}
                        >
                          {requesting ? "Working…" : primaryLabel}
                        </button>
                      </div>

                      {threadErr ? (
                        <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                          {threadErr}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex-1 py-3 overflow-auto">
                      {threadLoading ? (
                        <div className="text-sm text-gray-600 dark:text-zinc-400">Loading thread…</div>
                      ) : !currentThread ? (
                        <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-2">
                          <div>No thread yet.</div>
                          <div>
                            Use <span className="font-medium">Request skill</span> to start.
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2 items-center">
                            <PillBadge tone={isThreadOpen(currentThread) ? "yellow" : "gray"}>
                              {String(currentThread.status || "unknown")}
                            </PillBadge>
                            <PillBadge tone="gray">round {currentThread.round ?? 1}</PillBadge>
                            {!isThreadOpen(currentThread) ? (
                              <PillBadge tone="gray">thread closed</PillBadge>
                            ) : studentTurn ? (
                              <PillBadge tone="blue">your turn</PillBadge>
                            ) : (
                              <PillBadge tone="gray">waiting</PillBadge>
                            )}
                          </div>

                          {currentMessages.length === 0 ? (
                            <div className="text-sm text-gray-600 dark:text-zinc-400">No messages yet.</div>
                          ) : (
                            <div className="space-y-2">
                              {currentMessages.map((m) => {
                                const mine = String(m.senderRole).toLowerCase() === "student";
                                return (
                                  <div
                                    key={m._id}
                                    className={[
                                      "max-w-[80%] rounded-xl border px-3 py-2 text-sm",
                                      mine
                                        ? "ml-auto bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                                        : "mr-auto bg-white border-gray-200 dark:bg-zinc-950 dark:border-zinc-800",
                                    ].join(" ")}
                                  >
                                    <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">
                                      {mine ? "You" : m.senderRole}
                                    </div>
                                    <div className="whitespace-pre-line text-gray-900 dark:text-zinc-100">
                                      {m.body}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-zinc-800">
                      <div className="flex gap-2">
                        <input
                          className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
                          placeholder={
                            !currentThread
                              ? "Request the skill to message…"
                              : !isThreadOpen(currentThread)
                              ? "Thread closed…"
                              : studentTurn
                              ? "Write your message…"
                              : "Waiting for reviewer…"
                          }
                          value={composer}
                          onChange={(e) => setComposer(e.target.value)}
                          disabled={!inputEnabled || sending}
                        />
                        <button
                          className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
                          disabled={!inputEnabled || sending}
                          onClick={handleSend}
                        >
                          {sending ? "Sending…" : "Send"}
                        </button>
                      </div>

                      {!currentThread ? (
                        <div className="mt-2 text-xs text-gray-600 dark:text-zinc-400">
                          No thread exists yet. Request the skill to open the conversation.
                        </div>
                      ) : !isThreadOpen(currentThread) ? (
                        <div className="mt-2 text-xs text-gray-600 dark:text-zinc-400">
                          Thread closed. Use “Request skill again” to start a new round.
                        </div>
                      ) : !studentTurn ? (
                        <div className="mt-2 text-xs text-gray-600 dark:text-zinc-400">
                          Waiting for reviewer response. You can’t send another message yet.
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}
