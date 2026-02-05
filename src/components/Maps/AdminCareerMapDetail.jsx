import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";
import { MultiSelectCatalog } from "./MultiSelectCatalog";
import { KpiTargetsEditor } from "./KpiTargetsEditor";
import ModalShell from "../ui/ModalShell";
import MapSettingsForm from "@/components/Maps/MapSettingsForm"
import SkillsPanel from "./SkillsPanel";

const CATEGORY_OPTIONS = ["Install", "Service", "Sales", "Office", "Leadership"];



function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-800 border-yellow-200",
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



function ConfirmModal({
  title,
  body,
  confirmText = "Confirm",
  danger,
  loading,
  onConfirm,
  onClose,
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
            danger
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
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



/* =========================
   LEVEL MODAL
========================= */

function CareerLevelFormModal({ mode, careerMapId, initial, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [kpiTargets, setKpiTargets] = useState(
  Array.isArray(initial?.kpiTargets) ? initial.kpiTargets : []
);

  const [title, setTitle] = useState(initial?.title || "");

  const [salaryMin, setSalaryMin] = useState(initial?.salary?.min ?? "");
  const [salaryMax, setSalaryMax] = useState(initial?.salary?.max ?? "");

  useEffect(() => {
  setKpiTargets(Array.isArray(initial?.kpiTargets) ? initial.kpiTargets : []);
}, [initial?._id]);


  async function handleSubmit(e) {
  e.preventDefault();
  setError("");
  setSaving(true);

  const cleanedKpis = (kpiTargets || [])
    .filter((x) => x && x.kpiId)
    .map((x) => ({ kpiId: x.kpiId, target: Number(x.target || 0) }));

  const base = {
    title: title.trim(),
    salary: {
      min: salaryMin === "" ? null : Number(salaryMin),
      max: salaryMax === "" ? null : Number(salaryMax),
    },
    kpiTargets: cleanedKpis,
  };

  // ✅ only include careerMapId when creating
  const payload = mode === "create" ? { ...base, careerMapId } : base;

  if (!payload.title) {
    setSaving(false);
    setError("Title is required.");
    return;
  }

  try {
    if (mode === "create") {
      await apiClient.post("/api/career-levels", payload);
    } else {
      await apiClient.patch(`/api/career-levels/${initial._id}`, payload);
    }
    onSaved?.();
    onClose?.();
  } catch (err) {
    setError(err?.response?.data?.message || err?.message || "Failed to save level");
  } finally {
    setSaving(false);
  }
}


  return (
    <ModalShell
      title={mode === "create" ? "New Career Level" : "Edit Career Level"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
              Salary Min
            </label>
            <input
              type="number"
              className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
              Salary Max
            </label>
            <input
              type="number"
              className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              disabled={saving}
            />
          </div>
        </div>
        <KpiTargetsEditor value={kpiTargets} onChange={setKpiTargets} />
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* =========================
   BUILDER PANELS
========================= */

function LevelsListPanel({ careerMapId, selectedLevelId, onSelectLevel }) {
  const [levels, setLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [levelsError, setLevelsError] = useState("");

  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [levelModalMode, setLevelModalMode] = useState("create");
  const [editingLevel, setEditingLevel] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function fetchLevels() {
    setLevelsLoading(true);
    setLevelsError("");
    try {
      const res = await apiClient.get(`/api/career-maps/${careerMapId}/levels`);
      const arr = Array.isArray(res?.levels) ? res.levels : [];

      // ✅ backend owns ordering; we only apply a safe, stable view sort
      // (if backend already returns in order, this just keeps it consistent)
      const sorted = [...arr].sort((a, b) => {
        const al = Number(a?.levelNumber ?? 0);
        const bl = Number(b?.levelNumber ?? 0);
        if (al !== bl) return al - bl;
        return String(a?._id || "").localeCompare(String(b?._id || ""));
      });

      setLevels(sorted);

      // pick a default level if none selected
      if (!selectedLevelId && sorted.length > 0) {
        onSelectLevel(sorted[0]._id);
      }

      // if selected is invalid (deleted), also fix it
      if (selectedLevelId && !sorted.some((l) => l._id === selectedLevelId)) {
        onSelectLevel(sorted.length ? sorted[0]._id : "");
      }
    } catch (e) {
      setLevelsError(e?.message || "Failed to load levels");
      setLevels([]);
      onSelectLevel("");
    } finally {
      setLevelsLoading(false);
    }
  }

  useEffect(() => {
    if (!careerMapId) return;
    fetchLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerMapId]);

  function openCreate() {
    setLevelModalMode("create");
    setEditingLevel(null);
    setLevelModalOpen(true);
  }

  function openEdit(level) {
    setLevelModalMode("edit");
    setEditingLevel(level);
    setLevelModalOpen(true);
  }

  function openDelete(level) {
    setConfirmDelete({ level });
  }

  async function runDelete() {
    if (!confirmDelete?.level?._id) return;
    setConfirmLoading(true);
    try {
      await apiClient.del(`/api/career-levels/${confirmDelete.level._id}`);
      setConfirmDelete(null);
      await fetchLevels();
    } catch (e) {
      alert(e?.message || "Failed to delete level");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          Levels
        </div>
        <div className="flex gap-2">
          <button
            className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100 disabled:opacity-60"
            onClick={fetchLevels}
            disabled={levelsLoading}
          >
            Refresh
          </button>
          <button
            className="text-sm px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white"
            onClick={openCreate}
          >
            + Level
          </button>
        </div>
      </div>

      {levelsError ? (
        <div className="p-3 text-sm text-red-700 bg-red-50 border-b border-red-200">
          {levelsError}
        </div>
      ) : null}

      <div className="max-h-[520px] overflow-auto bg-white dark:bg-zinc-900">
        {levelsLoading ? (
          <div className="p-4 text-sm text-gray-600 dark:text-zinc-400">
            Loading levels…
          </div>
        ) : levels.length === 0 ? (
          <div className="p-4 text-sm text-gray-600 dark:text-zinc-400">
            No levels yet. Add one.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-zinc-800">
            {levels.map((lvl) => {
              const active = lvl._id === selectedLevelId;
              return (
                <li
                  key={lvl._id}
                  className={`p-3 cursor-pointer ${
                    active
                      ? "bg-blue-50 dark:bg-blue-950/20"
                      : "hover:bg-gray-50 dark:hover:bg-zinc-950"
                  }`}
                  onClick={() => onSelectLevel(lvl._id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                        {lvl.title}
                      </div>

                      <div className="mt-0.5 text-xs text-gray-600 dark:text-zinc-400">
                        Level {lvl.levelNumber}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-1">
                        {lvl?.salary?.min != null || lvl?.salary?.max != null ? (
                          <Pill tone="blue">
                            ${lvl?.salary?.min ?? "—"} - ${lvl?.salary?.max ?? "—"}
                          </Pill>
                        ) : null}

                        {Array.isArray(lvl.kpiTargets) ? (
                          <Pill tone="yellow">{lvl.kpiTargets.length} KPI</Pill>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button
                        className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(lvl);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDelete(lvl);
                        }}
                      >
                        Del
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {levelModalOpen ? (
        <CareerLevelFormModal
          mode={levelModalMode}
          careerMapId={careerMapId}
          initial={editingLevel}
          onClose={() => setLevelModalOpen(false)}
          onSaved={fetchLevels}
        />
      ) : null}

      {confirmDelete ? (
        <ConfirmModal
          title="Delete Career Level"
          body={`Delete "${confirmDelete.level?.title || "this level"}"? This cannot be undone.`}
          confirmText="Delete"
          danger
          loading={confirmLoading}
          onConfirm={runDelete}
          onClose={() => (confirmLoading ? null : setConfirmDelete(null))}
        />
      ) : null}
    </div>
  );
}




export default function AdminCareerMapDetail() {
  const { id: careerMapId } = useParams();
  const nav = useNavigate();
  const { user } = useUser();

  // ✅ this endpoint returns a wrapper: { map, levels, skills }
  const [detail, setDetail] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [tab, setTab] = useState("builder");
  const [confirm, setConfirm] = useState(null); // { type: "publish" | "unpublish" }
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [selectedLevelId, setSelectedLevelId] = useState("");

  const canManage = useMemo(
    () => ["admin", "coach"].includes(user?.role),
    [user?.role]
  );

  const careerMap = detail?.map || null;
  const levels = detail?.levels || [];
  const skills = detail?.skills || [];

  // optional debug
  // console.log("AdminCareerMapDetail detail", detail);

  async function fetchDetail() {
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get(`/api/career-maps/${careerMapId}`);
      setDetail(res);
    } catch (e) {
      setErr(e?.message || "Failed to load career map");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!careerMapId) return;
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [careerMapId]);

  async function saveSettings(payload) {
    if (!canManage) throw new Error("Not authorized");
    await apiClient.patch(`/api/career-maps/${careerMapId}`, payload);
    await fetchDetail();
  }

  async function runPublishToggle() {
    if (!careerMap?._id) return;

    setConfirmLoading(true);
    try {
      if (confirm?.type === "publish") {
        await apiClient.post(`/api/career-maps/${careerMapId}/publish`);
      } else {
        await apiClient.post(`/api/career-maps/${careerMapId}/unpublish`);
      }
      setConfirm(null);
      await fetchDetail();
    } catch (e) {
      alert(e?.message || "Action failed");
    } finally {
      setConfirmLoading(false);
    }
  }

  // ✅ loading / error
  if (loading) {
    return (
      <div className="p-6 text-gray-700 dark:text-zinc-300">
        Loading…
      </div>
    );
  }

  if (!careerMap) {
    return (
      <div className="p-6">
        <div className="mb-3">
          <button
            className="text-sm px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
            onClick={() => nav(-1)}
          >
            ← Back
          </button>
        </div>
        <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {err || "Career map not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/career-maps"
              className="text-sm text-blue-600 hover:underline"
            >
              Career Maps
            </Link>
            <span className="text-sm text-gray-400">/</span>
            <span className="text-sm text-gray-700 dark:text-zinc-300">
              {careerMap.title}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            {careerMap.title}{careerMap.company}
          </h1>

          <div className="mt-2 flex flex-wrap gap-2">
            <Pill>{careerMap.category || "—"}</Pill>
            {careerMap.published ? (
              <Pill tone="green">Published</Pill>
            ) : (
              <Pill>Draft</Pill>
            )}
          </div>

          {careerMap.description ? (
            <p className="mt-2 text-sm text-gray-600 dark:text-zinc-400">
              {careerMap.description}
            </p>
          ) : null}
        </div>

        
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-gray-200 dark:border-zinc-800">
        <button
          className={`px-3 py-2 text-sm rounded-t ${
            tab === "builder"
              ? "bg-white dark:bg-zinc-900 border border-b-0 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100"
              : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
          }`}
          onClick={() => setTab("builder")}
        >
          Builder
        </button>

        <button
          className={`px-3 py-2 text-sm rounded-t ${
            tab === "settings"
              ? "bg-white dark:bg-zinc-900 border border-b-0 border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100"
              : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
          }`}
          onClick={() => setTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="mt-4">
        {tab === "builder" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <LevelsListPanel
                careerMapId={careerMapId}
                levels={levels} // optional: if your panel can accept preloaded levels
                selectedLevelId={selectedLevelId}
                onSelectLevel={setSelectedLevelId}
              />
            </div>

            <div className="lg:col-span-2">
              <SkillsPanel
                careerMapId={careerMapId}
                careerLevelId={selectedLevelId}
                // optional: if your panel can accept preloaded skills
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
              Map Settings
            </h3>
            <div className="mt-3">
              <MapSettingsForm map={careerMap} onSave={saveSettings} />
            </div>
          </div>
        )}
      </div>

      {/* Confirm publish/unpublish */}
      {confirm ? (
        <ConfirmModal
          title={confirm.type === "publish" ? "Publish Career Map" : "Unpublish Career Map"}
          body={
            confirm.type === "publish"
              ? "Publishing makes this map visible to students who match category. Continue?"
              : "Unpublishing hides this map from students. Continue?"
          }
          confirmText={confirm.type === "publish" ? "Publish" : "Unpublish"}
          danger={confirm.type !== "publish"}
          loading={confirmLoading}
          onConfirm={runPublishToggle}
          onClose={() => (confirmLoading ? null : setConfirm(null))}
        />
      ) : null}
    </div>
  );
}
