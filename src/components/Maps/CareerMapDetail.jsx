import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link , useSearchParams} from "react-router-dom";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";
import SurveyFlow from "@/components/Maps/SurveyFlow"; // ✅ you said it exists in same folder

function isObjectId(v) {
  return /^[a-f\d]{24}$/i.test(String(v || ""));
}

function safeErrMsg(e) {
  return (
    e?.payload?.message ||
    e?.response?.data?.message ||
    e?.data?.message ||
    e?.message ||
    "Something broke. Congrats."
  );
}

function normalizeId(v) {
  if (!v) return null;
  if (typeof v === "string") return v;
  // handle { _id: { $oid: "..." } } dumps or weird shapes
  if (v?.$oid) return String(v.$oid);
  return String(v);
}

function normalizeIdArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeId).filter(Boolean);
}

function normalizeMapSurvey(raw) {
  if (!raw) {
    return {
      exists: false,
      submissionId: null,
      status: "not_submitted",
      awardedSkillIds: [],
      reviewedSkills: [],
    };
  }

  // shape A (your API): { exists, submissionId, status, ... }
  if (typeof raw.exists === "boolean") {
    return {
      exists: raw.exists,
      submissionId: raw.submissionId || raw._id || raw.id || null,
      status: String(raw.status || "not_submitted"),
      awardedSkillIds: normalizeIdArray(raw.awardedSkillIds),
      reviewedSkills: Array.isArray(raw.reviewedSkills) ? raw.reviewedSkills : [],
    };
  }

  // shape B (raw mongo doc): { _id, status, awardedSkillIds, reviewedSkills, ... }
  const submissionId = raw._id || raw.id || null;

  return {
    exists: Boolean(submissionId),
    submissionId,
    status: String(raw.status || "not_submitted"),
    awardedSkillIds: normalizeIdArray(raw.awardedSkillIds),
    reviewedSkills: Array.isArray(raw.reviewedSkills) ? raw.reviewedSkills : [],
  };
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

function isReviewerTurn(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const last = messages[messages.length - 1];
  return String(last?.senderRole || "").toLowerCase() === "student";
}

function isStudentsTurn(messages = []) {
  // No messages yet → student hasn’t requested anything yet
  // BUT we treat this as student turn only AFTER a thread exists
  if (!Array.isArray(messages) || messages.length === 0) {
    return true;
  }

  const last = messages[messages.length - 1];
  const lastRole = String(last?.senderRole || "").toLowerCase();

  // Student can write only if the last message
  // was NOT written by the student
  return lastRole !== "student";
}




function skillStatusFor(skillId, skillStates = []) {
  const hit = (skillStates || []).find((s) => String(s.skillId) === String(skillId));
  return hit?.status || "unknown";
}

function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return v.toLocaleString();
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray:
      "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
    green:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900",
    red:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900",
    blue:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
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
        "w-full text-left",
        "px-2 py-1",                 // ⬅️ tighter padding
        "rounded-md",                // ⬅️ less bubbly
        "border transition",
        "text-sm leading-5",         // ⬅️ denser text
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

            <div className="flex flex-wrap gap-1.5 px-0.5 py-0.5">
              {list.map((sk) => {
                const active = String(sk._id) === String(selectedSkillId);
                const status = statusById.get(String(sk._id))?.status || "locked";

                return (
                  <button
  key={sk._id}
  type="button"
  onClick={() => onPickSkill?.(sk)}
  className={[
    "px-2 py-[1px]",                 // tighter padding
    "rounded-md",                    // less bubble
    "text-[11px] leading-4",             // denser text
    "border transition",
    pillTone(type),
    active
      ? "ring-1 ring-blue-600 dark:ring-blue-500"
      : "hover:opacity-90",
  ].join(" ")}
  title="Open thread"
>
  <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1.5 ${dotTone(status)}`} />
  <span className="truncate">{sk.title}</span>
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

function MapSurveyPending() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">
        Survey submitted
      </div>
      <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
        Your map will unlock once your survey is reviewed.
      </div>
    </div>
  );
}

function MapSurveyNotSubmitted({ reviewer }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
      <div className="font-semibold text-gray-900 dark:text-zinc-100">
        Survey not submitted
      </div>
      <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
        {reviewer
          ? "Student hasn’t submitted the map survey yet."
          : "Complete the map survey to unlock the career map."}
      </div>
    </div>
  );
}

function MapSurveyReviewPanel({
  submissionId,
  claimedSkills,
  reviewedSkills,
  onReviewed,
  levelsRail, // ✅ pass mapState.levels from parent (optional but recommended)
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // step: "intro" | "review" | "summary"
  const [step, setStep] = useState("intro");
  const [idx, setIdx] = useState(0);

  // local decisions: { [skillId]: { action: "approve"|"reject", comment: "" } }
  const [draft, setDraft] = useState({});

  // backend decisions (so we can skip already-reviewed items)
  const decisionBySkill = useMemo(() => {
    const m = new Map();
    (reviewedSkills || []).forEach((r) => m.set(String(r.skillId), r));
    return m;
  }, [reviewedSkills]);

  // Level ordering map: careerLevelId -> index
  const levelOrder = useMemo(() => {
    const m = new Map();
    (levelsRail || []).forEach((lvl, i) => {
      // lvl.levelId is string in your state
      m.set(String(lvl.levelId), i);
    });
    return m;
  }, [levelsRail]);

  const orderedClaimed = useMemo(() => {
    const list = (claimedSkills || [])
      .map((sk) => ({
        ...sk,
        _id: String(sk._id),
        careerLevelId: sk?.careerLevelId ? String(sk.careerLevelId) : null,
        order: Number.isFinite(Number(sk?.order)) ? Number(sk.order) : 0,
      }))
      // keep only those still pending in reviewedSkills
      .filter((sk) => {
        const r = decisionBySkill.get(String(sk._id));
        const decision = String(r?.decision || "pending").toLowerCase();
        return decision === "pending";
      })
      // sort by: level order -> skill.order -> title
      .sort((a, b) => {
        const la = a.careerLevelId ? levelOrder.get(a.careerLevelId) ?? 9999 : 9999;
        const lb = b.careerLevelId ? levelOrder.get(b.careerLevelId) ?? 9999 : 9999;
        if (la !== lb) return la - lb;
        if (a.order !== b.order) return a.order - b.order;
        return String(a.title || "").localeCompare(String(b.title || ""));
      });

    return list;
  }, [claimedSkills, decisionBySkill, levelOrder]);

  const total = orderedClaimed.length;

  const current = useMemo(() => {
    if (idx < 0 || idx >= total) return null;
    return orderedClaimed[idx];
  }, [orderedClaimed, idx, total]);

  // initialize draft with defaults when list changes
  useEffect(() => {
    if (!total) return;

    setDraft((prev) => {
      const next = { ...prev };
      for (const sk of orderedClaimed) {
        const sid = String(sk._id);
        if (!next[sid]) next[sid] = { action: "", comment: "" };
      }
      return next;
    });

    // keep idx safe
    setIdx((prev) => {
      if (prev < 0) return 0;
      if (prev >= total) return total - 1;
      return prev;
    });
  }, [total, orderedClaimed]);

  function setAction(skillId, action) {
    setDraft((prev) => ({
      ...prev,
      [String(skillId)]: { ...(prev[String(skillId)] || {}), action },
    }));
  }

  function setComment(skillId, comment) {
    setDraft((prev) => ({
      ...prev,
      [String(skillId)]: { ...(prev[String(skillId)] || {}), comment },
    }));
  }

  const progressLabel = useMemo(() => {
    if (!total) return "0/0";
    return `${idx + 1}/${total}`;
  }, [idx, total]);

  const currentDraft = current ? draft[String(current._id)] : null;
  const currentAction = String(currentDraft?.action || "");
  const currentComment = String(currentDraft?.comment || "");

  const canGoNext = step !== "review" || (current && (currentAction === "approve" || currentAction === "reject"));
  const canSubmit = useMemo(() => {
  if (!total) return false;

  return orderedClaimed.every((sk) => {
    const entry = draft[String(sk._id)] || {};
    const action = entry.action;
    if (action !== "approve" && action !== "reject") return false;
    if (action === "reject" && !String(entry.comment || "").trim()) return false;
    return true;
  });
}, [orderedClaimed, draft, total]);


  async function submitAll() {
  // 🔔 explicit guard with alert
  const missingReject = orderedClaimed.find((sk) => {
    const entry = draft[String(sk._id)] || {};
    return (
      entry.action === "reject" &&
      !String(entry.comment || "").trim()
    );
  });

  if (missingReject) {
    alert("All rejected requests require a comment.");
    return;
  }

  if (!canSubmit) {
    alert("Please review all requests before submitting.");
    return;
  }

  setBusy(true);
  setErr("");
  try {
    for (const sk of orderedClaimed) {
      const sid = String(sk._id);
      const entry = draft[sid];

      await apiClient.post(
        `/api/career-survey/submissions/${submissionId}/skills/${sid}/review`,
        {
          action: entry.action,
          comment: String(entry.comment || "").trim(),
        }
      );
    }

    await onReviewed?.();
    setStep("intro");
    setIdx(0);
  } catch (e) {
    setErr(safeErrMsg(e));
  } finally {
    setBusy(false);
  }
}


  if (!total) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
        <div className="font-semibold text-gray-900 dark:text-zinc-100">No claimed skills</div>
        <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
          Either the student didn’t claim anything as “Mastered”, or everything was already reviewed.
        </div>
      </div>
    );
  }

  // helpers for level label (optional)
  const levelLabel = (() => {
    if (!current?.careerLevelId) return "";
    const lvl = (levelsRail || []).find((l) => String(l.levelId) === String(current.careerLevelId));
    if (!lvl) return "";
    return `Level ${lvl.levelNumber}: ${lvl.title || "—"}`;
  })();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-gray-900 dark:text-zinc-100">Review claimed skills</div>
        <div className="flex items-center gap-2">
          <Badge tone="yellow">pending</Badge>
          <Badge tone="gray">{progressLabel}</Badge>
        </div>
      </div>

      {err ? (
        <div className="p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{err}</div>
      ) : null}

      {/* INTRO */}
      {step === "intro" ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
          <div className="text-sm text-gray-700 dark:text-zinc-300">
            You have <span className="font-semibold">{total}</span> claimed skills to review.
          </div>
          <div className="text-xs text-gray-600 dark:text-zinc-400">
            Order is by level, then skill order. Because humans like structure, allegedly.
          </div>

          <div className="flex justify-end">
            <button
              className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
              disabled={busy}
              onClick={() => setStep("review")}
            >
              Start review
            </button>
          </div>
        </div>
      ) : null}

      {/* REVIEW ONE SKILL */}
      {step === "review" && current ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
          {levelLabel ? (
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-zinc-400">{levelLabel}</div>
          ) : null}

          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{current.title}</div>
            <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">{current.description || "—"}</div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className={[
                "px-3 py-2 rounded border text-sm disabled:opacity-60",
                currentAction === "approve"
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900",
              ].join(" ")}
              disabled={busy}
              onClick={() => setAction(current._id, "approve")}
            >
              Approve
            </button>

            <button
              type="button"
              className={[
                "px-3 py-2 rounded border text-sm disabled:opacity-60",
                currentAction === "reject"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900",
              ].join(" ")}
              disabled={busy}
              onClick={() => setAction(current._id, "reject")}
            >
              More Reps
            </button>
          </div>

          <textarea
            className="w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
            placeholder="Comment required"
            value={currentComment}
            onChange={(e) => setComment(current._id, e.target.value)}
            rows={3}
            disabled={busy}
          />

          <div className="flex items-center justify-between">
            <button
              className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
              disabled={busy || idx === 0}
              onClick={() => setIdx((p) => Math.max(0, p - 1))}
            >
              Back
            </button>

            <div className="flex gap-2">
              <button
                className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
                disabled={busy}
                onClick={() => setStep("summary")}
              >
                Review summary
              </button>

              <button
                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                disabled={busy || !canGoNext}
                onClick={() => {
                  if (!canGoNext) return;
                  if (idx + 1 >= total) setStep("summary");
                  else setIdx((p) => p + 1);
                }}
              >
                Next
              </button>
            </div>
          </div>

          {currentAction !== "approve" && currentAction !== "reject" ? (
            <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
              Pick approve/or request more reps to continue.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* SUMMARY */}
      {step === "summary" ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900 dark:text-zinc-100">Summary</div>
            <Badge tone={canSubmit ? "green" : "yellow"}>{canSubmit ? "ready" : "incomplete"}</Badge>
          </div>

          <div className="text-sm text-gray-700 dark:text-zinc-300">
            Approve/or request more reps, then submit. Revolutionary concept.
          </div>

          <div className="max-h-[45vh] overflow-auto pr-1 space-y-2">
            {orderedClaimed.map((sk) => {
              const entry = draft[String(sk._id)] || {};
              const action = entry.action || "—";
              const tone = action === "approve" ? "green" : action === "reject" ? "red" : "yellow";

              return (
                <button
                  key={sk._id}
                  type="button"
                  className="w-full text-left rounded-lg border border-gray-200 dark:border-zinc-800 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900"
                  onClick={() => {
                    const i = orderedClaimed.findIndex((x) => String(x._id) === String(sk._id));
                    if (i >= 0) {
                      setIdx(i);
                      setStep("review");
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">
                        {sk.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-zinc-400 truncate">
                        {sk.description || "—"}
                      </div>
                    </div>
                    <Badge tone={tone}>{action}</Badge>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
              disabled={busy}
              onClick={() => setStep("review")}
            >
              Back to review
            </button>

            <button
              className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
              disabled={busy || !canSubmit}
              onClick={submitAll}
            >
              {busy ? "Submitting…" : "Submit all decisions"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="text-xs text-gray-600 dark:text-zinc-400">
        Once all claimed skills are decided, the map unlocks. That’s the whole point of this ritual.
      </div>
    </div>
  );
}

/**
 * Reviewer panel for thread approvals (unchanged)
 */

function roleLabel(roleRaw) {
  const r = String(roleRaw || "").toLowerCase();
  const map = {
    student: "Student",
    coach: "Coach",
    admin: "Admin",
    company: "Company",
    "team-manager": "Team Manager",
    system: "System",
    manager: "Manager", // legacy fallback if old data exists
  };
  return map[r] || "User";
}


function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function displayNameForMessage(m, canStudentInteract) {
  const senderRole = String(m?.senderRole || "").toLowerCase();
  if (senderRole === "system") return "System";

  // backend now populates senderId: { name, role, email }
  const u = m?.senderId || null;
  const name = u?.name || u?.fullName || u?.email || "Unknown";

  // if student is viewing, show "You" for student messages
  if (canStudentInteract && senderRole === "student") return "You";

  return name;
}




export default function CareerMapDetail() {
  const { user } = useUser();
  const { careerMapId, studentId } = useParams();
  const [kpis, setKpis] = useState([]);
const [kpisErr, setKpisErr] = useState("");
const [searchParams] = useSearchParams();
const focus = searchParams.get("focus"); // "thread" | "survey"
const deepSkillId = searchParams.get("skillId");
const deepSubmissionId = searchParams.get("submissionId");

async function goToSkill(skillId) {
  // try current level first
  if (activeLevelId) {
    const res = await apiClient.get(levelStateUrl(activeLevelId));
    const found = (res?.skills || []).some((s) => String(s._id) === String(skillId));
    if (found) {
      setLevelState(res || null);
      setSelectedSkillId(String(skillId));
      return true;
    }
  }

  // brute-force levels until found (usually small count)
  for (const lvl of (mapState?.levels || [])) {
    const levelId = String(lvl.levelId || "");
    if (!isObjectId(levelId)) continue;

    const res = await apiClient.get(levelStateUrl(levelId));
    const found = (res?.skills || []).some((s) => String(s._id) === String(skillId));
    if (found) {
      setActiveLevelId(levelId);
      setLevelState(res || null);
      setSelectedSkillId(String(skillId));
      return true;
    }
  }

  return false;
}



 useEffect(() => {
  let ignore = false;

  async function fetchKpis() {
    try {
      setKpisErr("");
      const res = await apiClient.get("/api/maps-catalogs/kpis");
      if (!ignore) setKpis(Array.isArray(res) ? res : []);
    } catch (e) {
      if (!ignore) setKpisErr(safeErrMsg(e));
    }
  }

  fetchKpis();
  return () => { ignore = true; };
}, []);

const kpiById = useMemo(() => {
  const m = new Map();
  (kpis || []).forEach((k) => m.set(String(k._id), k));
  return m;
}, [kpis]);

  const mapId = careerMapId;

  // ✅ Reviewer mode ONLY when studentId param exists.
  const isReviewerRoute = Boolean(studentId);
  const isReviewerView = isReviewerRoute;

  const canStudentInteract = useMemo(() => !isReviewerView, [isReviewerView]);

  const canReviewerInteract = useMemo(
    () => ["team-manager", "company", "admin", "coach"].includes(user?.role) && isReviewerView,
    [user?.role, isReviewerView]
  );

  // State
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

  useEffect(() => {
  if (!isReviewerView) return;
  if (focus !== "thread") return;
  if (!isObjectId(deepSkillId)) return;
  if (!mapState?.levels?.length) return;

  // attempt deep navigation
  goToSkill(deepSkillId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isReviewerView, focus, deepSkillId, mapState]);

  

  // URLs
  const mapStateUrl = useMemo(() => {
    return isReviewerView
      ? `/api/career-review/students/${studentId}/maps/${mapId}/state`
      : `/api/career-paths/${mapId}/state`;
  }, [isReviewerView, studentId, mapId]);

  const levelStateUrl = useCallback(
    (levelId) => {
      return isReviewerView
        ? `/api/career-review/students/${studentId}/levels/${levelId}/state`
        : `/api/career-levels/${levelId}/state`;
    },
    [isReviewerView, studentId]
  );

  function threadUrl(skillIdParam) {
    if (!isReviewerView) return `/api/skill-threads/me/${skillIdParam}`;
    return `/api/skill-threads/student/${studentId}/${skillIdParam}`;
  }

  // Fetchers
  async function fetchMapState() {
    if (!isObjectId(mapId)) return;

    setMapLoading(true);
    setMapErr("");
    try {
      const res = await apiClient.get(mapStateUrl);
      setMapState(res || null);

      const raw = res?.levels?.[0]?.levelId;
const first = raw ? String(raw) : "";

setActiveLevelId((prev) => {
  // keep what we already chose (from deep link or user click)
  if (isObjectId(prev)) return prev;
  return isObjectId(first) ? first : "";
});

    } catch (e) {
      setMapState(null);
      setMapErr(safeErrMsg(e));
    } finally {
      setMapLoading(false);
    }
  }

  async function fetchLevelState(levelId) {
    if (!isObjectId(levelId)) return;

    setLevelLoading(true);
    setLevelErr("");
    try {
      const res = await apiClient.get(levelStateUrl(levelId));
      setLevelState(res || null);

      // auto pick first skill if nothing selected
      const firstSkillId = res?.skills?.[0]?._id ? String(res.skills[0]._id) : "";
      setSelectedSkillId((prev) => prev || firstSkillId || "");
    } catch (e) {
      setLevelState(null);
      setLevelErr(safeErrMsg(e));
    } finally {
      setLevelLoading(false);
    }
  }

  async function fetchThread(skillIdParam) {
    if (!isObjectId(skillIdParam)) {
      setThreadData(null);
      return;
    }

    setThreadLoading(true);
    setThreadErr("");
    try {
      const res = await apiClient.get(threadUrl(skillIdParam));
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

  // Effects
  useEffect(() => {
    fetchMapState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId, studentId, isReviewerView]);

  useEffect(() => {
    if (activeLevelId) fetchLevelState(activeLevelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevelId, studentId, isReviewerView]);

  useEffect(() => {
    if (selectedSkillId) fetchThread(selectedSkillId);
    else setThreadData(null);

    setComposer("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkillId, studentId, isReviewerView]);

  // Derived
  const levelsRail = useMemo(() => mapState?.levels || [], [mapState]);
  const skills = useMemo(() => levelState?.skills || [], [levelState]);
  const skillStates = useMemo(() => levelState?.skillStates || [], [levelState]);

  const selectedSkill = useMemo(() => {
    return skills.find((s) => String(s._id) === String(selectedSkillId)) || null;
  }, [skills, selectedSkillId]);

  const currentThread = threadData?.thread || null;
const currentMessages = threadData?.messages || [];



const studentTurn = useMemo(() => isStudentsTurn(currentMessages), [currentMessages]);
const reviewerTurn = useMemo(() => isReviewerTurn(currentMessages), [currentMessages]);


  // ✅ Map survey status (supports both response shapes)
const mapSurveyRaw = mapState?.mapSurvey || mapState?.survey || null;
const mapSurvey = useMemo(() => normalizeMapSurvey(mapSurveyRaw), [mapSurveyRaw]);

const mapSurveyExists = mapSurvey.exists;
const mapSurveyStatus = mapSurvey.status;

const mapUnlocked = mapSurveyStatus === "reviewed";
const threadPending = Boolean(currentThread && isThreadOpen(currentThread));
const studentCanType =
  canStudentInteract && mapUnlocked && (
    !currentThread ||
    (threadPending && studentTurn) ||
    String(currentThread?.status || "").toLowerCase() === "rejected"
  );

const reviewerCanAct =
  canReviewerInteract && threadPending && reviewerTurn;

// Middle panel logic
const showSurveyPanelForStudent =
  canStudentInteract && (!mapSurveyExists || mapSurveyStatus !== "reviewed");

// Reviewer survey review logic
const reviewerSubmissionId = mapSurvey.submissionId;
const reviewerReviewedSkills = mapSurvey.reviewedSkills;

const awarded = useMemo(() => new Set(mapSurvey.awardedSkillIds.map(String)), [mapSurvey.awardedSkillIds]);


  const reviewerClaimedSkills = useMemo(() => {
  const all = mapState?.allSkills;
  if (Array.isArray(all) && all.length) {
    return all.filter((s) => awarded.has(String(s._id)));
  }

  // fallback: show “unknown skill” rows based on reviewedSkills
  // so reviewer still can act even without titles
  return (reviewerReviewedSkills || [])
    .filter((r) => awarded.has(String(r.skillId)))
    .map((r) => ({
      _id: r.skillId,
      title: "Claimed skill",
      description: "",
    }));
}, [mapState, awarded, reviewerReviewedSkills]);


  const hasPendingClaims = reviewerReviewedSkills.some((r) => String(r?.decision) === "pending");

const reviewerShouldReviewSurvey =
  canReviewerInteract &&
  mapSurveyExists &&
  mapSurveyStatus === "pending" &&
  hasPendingClaims;


  useEffect(() => {
  if (!isReviewerView) return;
  console.log("REVIEW DEBUG", {
    mapStateUrl,
    canReviewerInteract,
    mapSurveyRaw,
    mapSurvey,
    hasPendingClaims,
    reviewerShouldReviewSurvey,
  });
}, [isReviewerView, mapStateUrl, canReviewerInteract, mapSurveyRaw, mapSurvey, hasPendingClaims, reviewerShouldReviewSurvey]);



  // Thread primary CTA (student-only)
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

 const inputEnabled =
  canStudentInteract &&
  mapUnlocked &&
  (
    !currentThread ||
    (isThreadOpen(currentThread) && studentTurn) ||
    String(currentThread?.status || "").toLowerCase() === "rejected"
  );


  

async function handleSend() {
  if (!inputEnabled) return;

  const body = composer.trim();
  if (!body) return;

  const ok = window.confirm(
    "Send this message? You won’t be able to send another until the reviewer responds."
  );
  if (!ok) return;

  setSending(true);
  try {
    const status = String(currentThread?.status || "").toLowerCase();

    // First message OR rejected thread => use request endpoint (new round)
    if (!currentThread || status === "rejected") {
      await apiClient.post(`/api/skill-threads/me/${selectedSkill._id}/request`, { body });
      setComposer("");
      await fetchThread(selectedSkill._id);
      return;
    }

    // Normal pending thread messaging
    await apiClient.post(`/api/skill-threads/${currentThread._id}/message`, { body });
    setComposer("");
    await fetchThread(selectedSkill._id);
  } catch (e) {
    alert(safeErrMsg(e));
  } finally {
    setSending(false);
  }
}



  // Back link depends on mode
  const backTo = isReviewerView ? "/team-careers" : "/my-career-maps";
  const titlePrefix = isReviewerView ? "Reviewing" : "";

  // Find active level meta for salary/kpis display
  const activeLevelMeta = useMemo(() => {
    return levelsRail.find((l) => String(l.levelId) === String(activeLevelId)) || null;
  }, [levelsRail, activeLevelId]);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to={backTo}
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100"
            >
              ← Back
            </Link>

            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
                {titlePrefix ? `${titlePrefix}: ` : ""}
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

        <div className="flex items-center gap-2">
          {mapLoading ? <Badge tone="gray">Loading…</Badge> : null}
          {isReviewerView ? <Badge tone="purple">reviewer</Badge> : <Badge tone="blue">student</Badge>}
          <Badge tone={mapUnlocked ? "green" : mapSurveyStatus === "pending" ? "yellow" : "gray"}>
            map {mapSurveyExists ? mapSurveyStatus : "not_submitted"}
          </Badge>
        </div>
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
                const unlocked = mapUnlocked; // ✅ map unlock governs all levels now
                const acquired = Number(lvl?.progress?.acquired || 0);
const total = Number(lvl?.progress?.total || 0);

const progressPct =
  total > 0 ? Math.round((acquired / total) * 100) : 0;

                return (
                  <PillButton
  key={lvl.levelId}
  active={active}
  disabled={!isObjectId(lvl.levelId) || (!mapUnlocked && canStudentInteract)}
  onClick={() => {
    const id = String(lvl.levelId || "");
    if (!isObjectId(id)) return;
    setSelectedSkillId("");
    setActiveLevelId(id);
  }}
>
  <div className="font-medium truncate">
    Level {lvl.levelNumber}: {lvl.title || "—"}
  </div>

  <div className="mt-2 flex items-center gap-3">
  <Badge className="px-2 py-0.5 text-xs rounded-md" tone={unlocked ? "green" : "gray"}>
    {unlocked ? "unlocked" : "locked"}
  </Badge>

  <div className="flex-1 min-w-[140px]">
    <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/15 overflow-hidden">
      <div
        className="h-full rounded-full bg-black/40 dark:bg-white/70 transition-all"
        style={{ width: `${progressPct}%` }}
      />
    </div>

    <div className="mt-1 text-[11px] text-gray-600 dark:text-zinc-300 text-right">
      {progressPct}%
    </div>
  </div>
</div>


  {/* ✅ EXPAND KPIs when this level is selected */}
  {active ? (
  <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
    <div
      className={[
        "text-[11px] uppercase tracking-wide font-semibold",
        active ? "text-white/90" : "text-gray-600 dark:text-zinc-300",
      ].join(" ")}
    >
      KPIs
    </div>

    {(lvl?.kpiTargets || []).length ? (
      <ul className="mt-2 space-y-1.5">
        {lvl.kpiTargets.map((t, idx) => {
          const kpi = kpiById.get(String(t.kpiId));
          const label = kpi ? `${kpi.name} (${kpi.unit})` : `KPI ${String(t.kpiId)}`;

          return (
            <li
              key={idx}
              className={[
                "flex items-center justify-between gap-2 rounded-md px-2 py-1",
                active
                  ? "bg-white/10 text-white"
                  : "bg-gray-50 text-gray-800 dark:bg-zinc-900/50 dark:text-zinc-200",
              ].join(" ")}
            >
              <span className={["truncate", active ? "text-white/90" : "text-gray-700 dark:text-zinc-300"].join(" ")}>
                {label}
              </span>
              <span className={["font-semibold tabular-nums shrink-0", active ? "text-white" : "text-gray-900 dark:text-zinc-100"].join(" ")}>
                {t.target}
              </span>
            </li>
          );
        })}
      </ul>
    ) : (
      <div className={["mt-2 text-xs", active ? "text-white/70" : "text-gray-600 dark:text-zinc-400"].join(" ")}>
        —
      </div>
    )}
  </div>
) : null}

</PillButton>

                );
              })
            )}
          </div>
        </div>

        {/* MIDDLE: Survey (map) OR Skills */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-900 dark:text-zinc-100">
              {showSurveyPanelForStudent || reviewerShouldReviewSurvey ? "Survey" : "Skills"}
            </div>
            <div className="flex items-center gap-2">
              {levelLoading ? <Badge tone="gray">Loading…</Badge> : null}
              <Badge tone="gray">
                {mapSurveyExists ? mapSurveyStatus : "not_submitted"}
              </Badge>
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
            ) : reviewerShouldReviewSurvey ? (
              <MapSurveyReviewPanel
                submissionId={reviewerSubmissionId}
                claimedSkills={reviewerClaimedSkills}
                reviewedSkills={reviewerReviewedSkills}
                 levelsRail={levelsRail}
                onReviewed={async () => {
                  await fetchMapState();
                  if (activeLevelId) await fetchLevelState(activeLevelId);
                }}
              />
            ) : showSurveyPanelForStudent ? (
              !mapSurveyExists ? (
                <SurveyFlow
                  careerMapId={mapId}
                  onClose={() => {}}
                  onSubmitted={async () => {
                    await fetchMapState();
                    if (activeLevelId) await fetchLevelState(activeLevelId);
                  }}
                />
              ) : mapSurveyStatus === "pending" ? (
                <MapSurveyPending />
              ) : mapSurveyStatus === "reviewed" ? (
                <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4">
                  <div className="font-semibold text-gray-900 dark:text-zinc-100">Map unlocked</div>
                  <div className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                    Survey reviewed. The bureaucracy has spoken.
                  </div>
                </div>
              ) : (
                <MapSurveyNotSubmitted reviewer={false} />
              )
            ) : !mapUnlocked && canStudentInteract ? (
              <MapSurveyPending />
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

        {/* RIGHT: Thread window + level meta */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col min-h-[520px]">
          {!mapUnlocked && canStudentInteract ? (
            <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-2">
              <div className="font-semibold text-gray-900 dark:text-zinc-100">Map locked</div>
              <div>
                {!mapSurveyExists
                  ? "Complete the map survey first."
                  : "Your survey is under review. Map unlocks when review completes."}
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-500">
                Paperwork: still undefeated.
              </div>
            </div>
          ) : !selectedSkill ? (
            <div className="text-sm text-gray-600 dark:text-zinc-400">
              Select a skill pill to view details and the thread.
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

                    

                  </div>
                </div>
                {threadErr ? (
                  <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
                    {threadErr}
                  </div>
                ) : null}
              </div>

              <div className="flex-1 min-h-0 py-3">
  {/* Only the message list scrolls */}
  <div className="h-full overflow-y-auto pr-1">
    {threadLoading ? (
      <div className="text-sm text-gray-600 dark:text-zinc-400">
        Loading thread…
      </div>
    ) : !currentThread ? (
      <div className="text-sm text-gray-600 dark:text-zinc-400 space-y-2">
        <div>No thread yet for this skill.</div>
        {canStudentInteract ? (
          <div>Write a message below to start the request.</div>
        ) : (
          <div>Student hasn’t requested this skill yet.</div>
        )}
      </div>
    ) : currentMessages.length === 0 ? (
      <div className="text-sm text-gray-600 dark:text-zinc-400">
        No messages yet.
      </div>
    ) : (
      <div className="space-y-2">
        {currentMessages.map((m) => {
          const senderRole = String(m?.senderRole || "").toLowerCase();
          const isStudentMsg = senderRole === "student";
          const isSystem = senderRole === "system";

          const alignRight = isStudentMsg; // student right, others left
          const name = displayNameForMessage(m, canStudentInteract);
          const role = roleLabel(senderRole);
          const when = formatTime(m?.createdAt);

          return (
            <div
              key={m._id}
              className={["flex", alignRight ? "justify-end" : "justify-start"].join(" ")}
            >
              <div
                className={[
                  "max-w-[80%] rounded-2xl border px-3 py-2 text-sm",
                  alignRight
                    ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900"
                    : isSystem
                    ? "bg-gray-50 border-gray-200 dark:bg-zinc-900/40 dark:border-zinc-800"
                    : "bg-white border-gray-200 dark:bg-zinc-950 dark:border-zinc-800",
                ].join(" ")}
              >
                <div className="whitespace-pre-line text-gray-900 dark:text-zinc-100">
                  {m.body}
                </div>

                <div
                  className={[
                    "mt-1 text-[11px] text-gray-500 dark:text-zinc-400",
                    alignRight ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  {name} · {role}
                  {when ? ` · ${when}` : ""}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>


              <div className="pt-3 border-t border-gray-200 dark:border-zinc-800">
  {/* STUDENT footer */}
  {canStudentInteract ? (
    <div className="flex gap-2">
      <input
        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
        placeholder={
          !mapUnlocked ? "Map locked." :
          !selectedSkill ? "Select a skill…" :
          !currentThread ? "Write your request message…" :
          !threadPending ? "Thread closed." :
          studentTurn ? "Your turn: write your message…" :
          "Waiting for reviewer…"
        }
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        disabled={!studentCanType || sending}
      />

      <button
        className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
        disabled={!studentCanType || sending || !composer.trim()}
        onClick={handleSend}
      >
        {sending ? "Sending…" : "Send"}
      </button>
    </div>
  ) : null}

  {/* REVIEWER footer */}
  {canReviewerInteract ? (
    <div className="flex gap-2">
      <input
        className="flex-1 px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
        placeholder={
          !currentThread ? "No thread yet." :
          !threadPending ? "Thread closed." :
          reviewerTurn ? "Optional comment (required for reject)" :
          "Waiting for student…"
        }
        value={composer}
        onChange={(e) => setComposer(e.target.value)}
        disabled={!reviewerCanAct || sending}
      />

      <button
        className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white disabled:opacity-60"
        disabled={!reviewerCanAct || sending}
        onClick={async () => {
          const text = composer.trim();
          if (!text) {
            alert("Rejection requires a reason.");
            return;
          }
          const ok = window.confirm("Request more reps? The student will need to request his skill again.");
          if (!ok) return;

          setSending(true);
          try {
            await apiClient.post(`/api/skill-threads/${currentThread._id}/review`, {
              action: "reject",
              body: text,
            });
            setComposer("");
            await fetchThread(selectedSkill._id);
            await fetchLevelState(activeLevelId);
            await fetchMapState();
          } catch (e) {
            alert(safeErrMsg(e));
          } finally {
            setSending(false);
          }
        }}
      >
        More Reps
      </button>

      <button
        className="px-3 py-2 rounded bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
        disabled={!reviewerCanAct || sending}
        onClick={async () => {
          const text = composer.trim();
          const ok = window.confirm("Approve this skill? This locks the thread forever.");
          if (!ok) return;

          setSending(true);
          try {
            await apiClient.post(`/api/skill-threads/${currentThread._id}/review`, {
              action: "approve",
              body: text, // may be empty: your backend will create system msg only when empty
            });
            setComposer("");
            await fetchThread(selectedSkill._id);
            await fetchLevelState(activeLevelId);
            await fetchMapState();
          } catch (e) {
            alert(safeErrMsg(e));
          } finally {
            setSending(false);
          }
        }}
      >
        Approve
      </button>
    </div>
  ) : null}
</div>

            </>
          )}
        </div>
      </div>

      {/* Reviewer: if no survey exists, show notice in middle panel context */}
      {canReviewerInteract && !mapSurveyExists ? (
        <div className="mt-4">
          <MapSurveyNotSubmitted reviewer />
        </div>
      ) : null}
    </div>
  );
}
