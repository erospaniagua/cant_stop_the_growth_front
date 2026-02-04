import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";

// Reuse your existing ModalShell / ConfirmModal if already defined elsewhere.
// If not, paste your ModalShell + ConfirmModal here.
function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[min(820px,92vw)] max-h-[85vh] overflow-auto rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">{title}</h2>
          <button
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  body,
  confirmText = "Confirm",
  danger,
  onConfirm,
  onClose,
  loading,
}) {
  return (
    <ModalShell title={title} onClose={onClose}>
      <p className="text-sm text-gray-700 dark:text-zinc-300">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button
          className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          className={`px-3 py-2 rounded text-white ${
            danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          } disabled:opacity-60`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Working…" : confirmText}
        </button>
      </div>
    </ModalShell>
  );
}

// Skill pill (color by skillType)
function SkillPill({ skill, onClick }) {
  const tone =
    skill.skillType === "communication"
      ? "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/50"
      : "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-900/50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs border transition ${tone}`}
      title={skill.description || skill.surveyQuestion || ""}
    >
      <span className="font-medium">{skill.title}</span>
      {skill.points ? (
        <span className="opacity-70">+{skill.points}</span>
      ) : null}
    </button>
  );
}

function SkillForm({ mode, initial, careerMapId, careerLevelId, onSaved, onClose }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [skillType, setSkillType] = useState(initial?.skillType || "technical");
  const [surveyQuestion, setSurveyQuestion] = useState(initial?.surveyQuestion || "");
  const [order, setOrder] = useState(initial?.order ?? 0);
  const [points, setPoints] = useState(initial?.points ?? 1);
  const [evidencePolicy, setEvidencePolicy] = useState(
    initial?.evidencePolicy || "manager_approval"
  );

  useEffect(() => {
    setTitle(initial?.title || "");
    setDescription(initial?.description || "");
    setSkillType(initial?.skillType || "technical");
    setSurveyQuestion(initial?.surveyQuestion || "");
    setOrder(initial?.order ?? 0);
    setPoints(initial?.points ?? 1);
    setEvidencePolicy(initial?.evidencePolicy || "manager_approval");
  }, [initial?._id]);

  async function submit(e) {
  e.preventDefault();
  setError("");

  const base = {
    title: title.trim(),
    description: description.trim(),
    skillType,
    surveyQuestion: surveyQuestion.trim(),
    points: Number(points || 1),
    evidencePolicy,
  };

  if (!base.title) {
    setError("Title is required.");
    return;
  }

  setSaving(true);
  try {
    if (mode === "create") {
      await apiClient.post("/api/career-skills", {
        ...base,
        careerMapId,
        careerLevelId,
      });
    } else {
      await apiClient.patch(`/api/career-skills/${initial._id}`, base);
    }

    onSaved?.();
    onClose?.();
  } catch (err) {
    setError(err?.response?.data?.message || err?.message || "Failed to save skill");
  } finally {
    setSaving(false);
  }
}

  return (
    <ModalShell title={mode === "create" ? "New Skill" : "Edit Skill"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
              Title
            </label>
            <input
              className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
              Skill Type
            </label>
            <select
              className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              value={skillType}
              onChange={(e) => setSkillType(e.target.value)}
              disabled={saving}
            >
              <option value="technical">technical</option>
              <option value="communication">communication</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
            Description
          </label>
          <textarea
            className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
            Survey Question (optional)
          </label>
          <textarea
            className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
            rows={2}
            value={surveyQuestion}
            onChange={(e) => setSurveyQuestion(e.target.value)}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
              Points
            </label>
            <input
              type="number"
              className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Skill"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

export default function SkillsPanel({ careerMapId, careerLevelId }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [activeSkill, setActiveSkill] = useState(null);
  const [form, setForm] = useState(null); // { mode, skill }
  const [confirm, setConfirm] = useState(null); // { type: "delete", skill }
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function fetchSkills() {
    if (!careerLevelId) {
      setSkills([]);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get(`/api/career-levels/${careerLevelId}/skills`);
      const arr = Array.isArray(res?.skills) ? res.skills : [];
      // stable order: order asc then title
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.title).localeCompare(String(b.title)));
      setSkills(arr);
    } catch (e) {
      setErr(e?.message || "Failed to load skills");
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerLevelId]);

  const grouped = useMemo(() => {
    const comm = [];
    const tech = [];
    for (const s of skills) {
      (s.skillType === "communication" ? comm : tech).push(s);
    }
    return { comm, tech };
  }, [skills]);

  async function deleteSkill(skill) {
    if (!skill?._id) return;
    setConfirmLoading(true);
    try {
      await apiClient.del(`/api/career-skills/${skill._id}`);
      setConfirm(null);
      setActiveSkill(null);
      await fetchSkills();
    } catch (e) {
      alert(e?.message || "Failed to delete skill");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
            Skills
          </h3>
          <div className="text-sm text-gray-600 dark:text-zinc-400">
            {careerLevelId ? (
              loading ? "Loading…" : `${skills.length} skill(s)`
            ) : (
              "Select a level to view skills."
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            className="text-sm px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100 disabled:opacity-60"
            onClick={fetchSkills}
            disabled={!careerLevelId || loading}
          >
            Refresh
          </button>

          <button
            className="text-sm px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            onClick={() => setForm({ mode: "create", skill: null })}
            disabled={!careerLevelId}
          >
            + New Skill
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      ) : null}

      {!careerLevelId ? (
        <div className="mt-4 text-sm text-gray-600 dark:text-zinc-400">
          Pick a level on the left.
        </div>
      ) : loading ? (
        <div className="mt-4 text-sm text-gray-600 dark:text-zinc-400">Loading skills…</div>
      ) : skills.length === 0 ? (
        <div className="mt-4 text-sm text-gray-600 dark:text-zinc-400">
          No skills yet for this level.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Communication */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                Communication
              </div>
              <div className="text-xs text-gray-600 dark:text-zinc-400">
                {grouped.comm.length}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {grouped.comm.map((s) => (
                <SkillPill key={s._id} skill={s} onClick={() => setActiveSkill(s)} />
              ))}
            </div>
          </div>

          {/* Technical */}
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
                Technical
              </div>
              <div className="text-xs text-gray-600 dark:text-zinc-400">
                {grouped.tech.length}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {grouped.tech.map((s) => (
                <SkillPill key={s._id} skill={s} onClick={() => setActiveSkill(s)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Skill Details Modal */}
      {activeSkill ? (
        <ModalShell title={activeSkill.title} onClose={() => setActiveSkill(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-1 rounded-full border ${
                  activeSkill.skillType === "communication"
                    ? "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-200 dark:border-purple-900/50"
                    : "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-900/50"
                }`}
              >
                {activeSkill.skillType}
              </span>
            </div>

            {activeSkill.description ? (
              <div className="text-sm text-gray-800 dark:text-zinc-200">
                {activeSkill.description}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-zinc-400">
                No description.
              </div>
            )}

            {activeSkill.surveyQuestion ? (
              <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 bg-gray-50 dark:bg-zinc-950">
                <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                  Survey Question
                </div>
                <div className="mt-1 text-sm text-gray-800 dark:text-zinc-200">
                  {activeSkill.surveyQuestion}
                </div>
              </div>
            ) : null}

            

            <div className="pt-2 flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
                onClick={() => setForm({ mode: "edit", skill: activeSkill })}
              >
                Edit
              </button>

              <button
                className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setConfirm({ type: "delete", skill: activeSkill })}
              >
                Delete
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {/* Create/Edit Modal */}
      {form ? (
        <SkillForm
          mode={form.mode}
          initial={form.skill}
          careerMapId={careerMapId}
          careerLevelId={careerLevelId}
          onSaved={fetchSkills}
          onClose={() => setForm(null)}
        />
      ) : null}

      {/* Delete Confirm */}
      {confirm ? (
        <ConfirmModal
          title="Delete Skill"
          body={`Delete "${confirm.skill?.title}"? This cannot be undone.`}
          confirmText="Delete"
          danger
          loading={confirmLoading}
          onConfirm={() => deleteSkill(confirm.skill)}
          onClose={() => (confirmLoading ? null : setConfirm(null))}
        />
      ) : null}
    </div>
  );
}
