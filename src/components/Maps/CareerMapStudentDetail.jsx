import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";

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
function skillStatusFor(skillId, skillStates = []) {
  const hit = (skillStates || []).find((s) => String(s.skillId) === String(skillId));
  return hit?.status || "unknown";
}

function Badge({ children, tone = "gray" }) {
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

function PillButton({ active, children, onClick, disabled }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={[
        "w-full text-left px-3 py-2 rounded-lg border transition",
        active
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900",
        disabled ? "opacity-60 cursor-not-allowed" : "",
      ].join(" ")}
    >
      {children}
    </button>
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

function SurveyUnderReview() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">Survey under review</div>
      <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
        Your manager/company is reviewing your claimed skills. This level unlocks after at least one
        approval.
      </div>
    </div>
  );
}

function SurveyReviewedButLocked() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">Waiting for approval</div>
      <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
        Your survey was reviewed, but no skill has been approved yet. This level unlocks after at
        least one approval.
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

  // ✅ Guard: do not fetch without a valid id
  if (!careerLevelId) {
    setLoading(false);
    setErr("");
    setTpl(null);
    return () => { mounted = false; };
  }

  (async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get(`/api/career-survey/levels/${careerLevelId}/template`);

      if (!mounted) return;

      // ✅ likely: res.data (depends on your apiClient wrapper)
      setTpl(res?.data ?? res ?? null);

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
  console.log("submit survey failed:", {
    status: e?.status,
    payload: e?.payload,
    message: e?.message,
    url: e?.url,
  });

  setErr(safeErrMsg(e));
  setMode("review");
}

  }

  if (loading) {
    return (
      <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">
        Loading survey…
      </div>
    );
  }
  if (err) {
    return (
      <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
        {err}
      </div>
    );
  }
  if (!questions.length) {
    return (
      <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">
        No survey questions for this level.
      </div>
    );
  }

  if (mode === "done") {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
        <div className="font-semibold text-gray-900 dark:text-zinc-100">Survey submitted</div>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Now it goes to review. Yes, waiting is a feature.
        </div>
      </div>
    );
  }

  if (mode === "review") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900 dark:text-zinc-100">Review answers</div>
          <Badge tone={allAnswered ? "green" : "yellow"}>
            {allAnswered ? "ready" : "missing answers"}
          </Badge>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
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
                <div className="mt-2 text-xs text-red-700 dark:text-red-300">
                  Missing answer.
                </div>
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
        <div className="font-semibold text-gray-900 dark:text-zinc-100">
          {q?.title || "Question"}
        </div>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1 whitespace-pre-line">
          {q?.prompt || "—"}
        </div>

        <div className="mt-4 space-y-2">
          {(q?.options || []).map((opt) => (
            <label
              key={String(opt.value)}
              className="flex items-center gap-2 text-sm text-gray-900 dark:text-zinc-100"
            >
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
              {opt.label}
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
        No partial submissions. Because chaos is not a product feature.
      </div>
    </div>
  );
}

export default function CareerMapStudentDetail() {
  const { user } = useUser();
  const { careerMapId } = useParams();
  const mapId = careerMapId;

  const [mapLoading, setMapLoading] = useState(false);
  const [mapErr, setMapErr] = useState("");
  const [mapState, setMapState] = useState(null);

  const [activeLevelId, setActiveLevelId] = useState("");
  const [levelLoading, setLevelLoading] = useState(false);
  const [levelErr, setLevelErr] = useState("");
  const [levelState, setLevelState] = useState(null);

  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadErr, setThreadErr] = useState("");
  const [threadData, setThreadData] = useState(null);

  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const canUseThreads = useMemo(() => user?.role === "student", [user?.role]);

  async function fetchMapState(careerMapIdParam) {
    if (!isObjectId(careerMapIdParam)) return;
    setMapLoading(true);
    setMapErr("");
    try {
      const res = await apiClient.get(`/api/career-paths/${careerMapIdParam}/state`);
      setMapState(res || null);

      const firstLevelId = res?.levels?.[0]?.levelId ? String(res.levels[0].levelId) : "";
      setActiveLevelId(firstLevelId || "");
    } catch (e) {
      setMapState(null);
      setMapErr(safeErrMsg(e));
    } finally {
      setMapLoading(false);
    }
  }

  async function fetchLevelState(careerLevelId) {
    if (!isObjectId(careerLevelId)) return;
    setLevelLoading(true);
    setLevelErr("");
    try {
      const res = await apiClient.get(`/api/career-levels/${careerLevelId}/state`);
      setLevelState(res || null);

      // If unlocked, default select first skill. If locked, clear selection.
      const unlocked = Boolean(res?.unlocked);
      const firstSkillId = unlocked && res?.skills?.[0]?._id ? String(res.skills[0]._id) : "";
      setSelectedSkillId(firstSkillId || "");
    } catch (e) {
      setLevelState(null);
      setLevelErr(safeErrMsg(e));
    } finally {
      setLevelLoading(false);
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
      if (status === 404) {
        setThreadData(null);
      } else {
        setThreadErr(safeErrMsg(e));
        setThreadData(null);
      }
    } finally {
      setThreadLoading(false);
    }
  }

  useEffect(() => {
    if (mapId) fetchMapState(mapId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  useEffect(() => {
    if (activeLevelId) fetchLevelState(activeLevelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevelId]);

  useEffect(() => {
    if (selectedSkillId) fetchThread(selectedSkillId);
    else setThreadData(null);
    setComposer("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkillId]);

  const levelsRail = useMemo(() => mapState?.levels || [], [mapState]);

  const skills = useMemo(() => levelState?.skills || [], [levelState]);
  const skillStates = useMemo(() => levelState?.skillStates || [], [levelState]);

  const selectedSkill = useMemo(() => {
    return skills.find((s) => String(s._id) === String(selectedSkillId)) || null;
  }, [skills, selectedSkillId]);

  const currentThread = threadData?.thread || null;
  const currentMessages = threadData?.messages || [];
  const studentTurn = useMemo(() => isStudentsTurn(currentMessages), [currentMessages]);

  const isLevelUnlocked = Boolean(levelState?.unlocked);
  const surveyExists = Boolean(levelState?.survey?.exists);
  const surveyStatus = String(levelState?.survey?.status || "not_submitted"); // not_submitted | pending | reviewed | ...
  const needsSurvey = !isLevelUnlocked && (!surveyExists || surveyStatus === "not_submitted");
  const surveyPending = !isLevelUnlocked && surveyExists && surveyStatus === "pending";
  const reviewedButLocked = !isLevelUnlocked && surveyExists && surveyStatus === "reviewed";

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

  const inputEnabled = Boolean(currentThread) && isThreadOpen(currentThread) && studentTurn && canUseThreads;

  async function handlePrimaryClick() {
    if (!selectedSkill?._id) return;

    if (primaryAction === "open") {
      await fetchThread(selectedSkill._id);
      return;
    }

    if (!canUseThreads) return;

    setRequesting(true);
    try {
      await apiClient.post(`/api/skill-threads/me/${selectedSkill._id}/request`, {
        body: "Requesting approval. I can provide evidence.",
      });
      await fetchThread(selectedSkill._id);
    } catch (e) {
      const status = e?.status || e?.response?.status;
      if (status === 409) {
        await fetchThread(selectedSkill._id);
      } else {
        alert(safeErrMsg(e));
      }
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

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/my-career-maps"
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100"
            >
              ← Back
            </Link>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
                {mapState?.map?.title || "Career Map"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-zinc-400">
                {mapState?.map?.category ? `Category: ${mapState.map.category}` : ""}
              </p>
            </div>
          </div>

          {mapErr ? (
            <div className="mt-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
              {mapErr}
            </div>
          ) : null}
        </div>

        {mapLoading ? <Badge tone="gray">Loading…</Badge> : null}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_360px_1fr] gap-4">
        {/* LEFT: Levels */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 dark:text-zinc-100">Levels</div>
            <Badge tone="gray">{levelsRail.length}</Badge>
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {levelsRail.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-zinc-400">No levels.</div>
            ) : (
              levelsRail.map((lvl) => {
                const active = String(lvl.levelId) === String(activeLevelId);
                const unlocked = Boolean(lvl.unlocked);
                const s = lvl?.survey?.status || "—";
                const progress = lvl?.progress ? `${lvl.progress.acquired}/${lvl.progress.total}` : "—";

                return (
                  <PillButton
                    key={lvl.levelId}
                    active={active}
                    disabled={!isObjectId(lvl.levelId)}
                    onClick={() => setActiveLevelId(String(lvl.levelId))}
                  >
                    <div className="font-medium truncate">
                      Level {lvl.levelNumber}: {lvl.title || "—"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge tone={unlocked ? "green" : "gray"}>{unlocked ? "unlocked" : "locked"}</Badge>
                      <Badge tone={s === "pending" ? "yellow" : "gray"}>{s}</Badge>
                      <Badge tone="blue">progress {progress}</Badge>
                    </div>
                  </PillButton>
                );
              })
            )}
          </div>
        </div>

        {/* MIDDLE: Skills OR Survey */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 dark:text-zinc-100">
              {needsSurvey || surveyPending || reviewedButLocked ? "Survey" : "Skills"}
            </div>
            <div className="flex items-center gap-2">
              {levelLoading ? <Badge tone="gray">Loading…</Badge> : null}
              {!needsSurvey && !surveyPending && !reviewedButLocked ? (
                <Badge tone="gray">{skills.length}</Badge>
              ) : (
                <Badge tone="gray">{surveyStatus}</Badge>
              )}
            </div>
          </div>

          {levelErr ? (
            <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {levelErr}
            </div>
          ) : null}

          <div className="max-h-[70vh] overflow-auto pr-1">
            {levelLoading ? (
              <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">Loading…</div>
            ) : needsSurvey ? (
              <SurveyWizard
                careerLevelId={activeLevelId}
                onSubmitted={async () => {
                  // After submit, refresh level state so the panel flips to "under review"
                  await fetchLevelState(activeLevelId);
                }}
              />
            ) : surveyPending ? (
              <SurveyUnderReview />
            ) : reviewedButLocked ? (
              <SurveyReviewedButLocked />
            ) : skills.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">No skills for this level.</div>
            ) : (
              <SkillsPills
                skills={skills}
                skillStates={skillStates}
                selectedSkillId={selectedSkillId}
                onPickSkill={(sk) => setSelectedSkillId(String(sk._id))}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Thread window (skill details live here) */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col min-h-[520px]">
          {/* If level locked, we don't let them browse threads. */}
          {!isLevelUnlocked ? (
            <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-2">
              <div className="font-semibold text-gray-900 dark:text-zinc-100">Skill threads locked</div>
              <div>
                Complete the survey first. Then wait for at least one skill approval to unlock this
                level.
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-500">
                Yes, bureaucracy. It’s how humans simulate progress.
              </div>
            </div>
          ) : !selectedSkill ? (
            <div className="text-sm text-gray-600 dark:text-zinc-400">
              Select a skill pill to view the thread and details.
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
                      <Badge tone={selectedSkill.skillType === "communication" ? "purple" : "blue"}>
                        {selectedSkill.skillType || "technical"}
                      </Badge>
                      <Badge tone="gray">points {selectedSkill.points ?? 1}</Badge>
                      <Badge tone="gray">{selectedSkill.evidencePolicy || "manager_approval"}</Badge>
                      <Badge tone="gray">state {skillStatusFor(selectedSkill._id, skillStates)}</Badge>
                    </div>
                  </div>

                  <button
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                    disabled={!canUseThreads || requesting}
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
                    <div>No thread yet for this skill.</div>
                    <div>
                      Hit <span className="font-medium">Request skill</span> to start the approval
                      workflow.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge tone={isThreadOpen(currentThread) ? "yellow" : "gray"}>
                        {String(currentThread.status || "unknown")}
                      </Badge>
                      <Badge tone="gray">round {currentThread.round ?? 1}</Badge>
                      {!isThreadOpen(currentThread) ? (
                        <Badge tone="gray">thread closed</Badge>
                      ) : studentTurn ? (
                        <Badge tone="blue">your turn</Badge>
                      ) : (
                        <Badge tone="gray">waiting</Badge>
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
                        ? "Start a request to message…"
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
                    This thread is closed. Use “Request skill again” to start a new round.
                  </div>
                ) : !studentTurn ? (
                  <div className="mt-2 text-xs text-gray-600 dark:text-zinc-400">
                    Waiting for a reviewer response. You can’t send another message yet.
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
