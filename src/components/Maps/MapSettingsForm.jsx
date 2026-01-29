import { useEffect, useMemo, useState } from "react";
import { MultiSelectCatalog } from "@/components/Maps/MultiSelectCatalog";

// Must match backend enum exactly
const CATEGORY_OPTIONS = ["Install", "Service", "Sales", "Office Staff", "Leadership"];

function toId(x) {
  if (!x) return null;
  if (typeof x === "string") return x;
  if (typeof x === "object") {
    if (x.$oid) return String(x.$oid);
    if (x._id?.$oid) return String(x._id.$oid);
    if (x._id) return String(x._id);
  }
  return null;
}

function toIdArray(maybeIds) {
  if (!Array.isArray(maybeIds)) return [];
  return maybeIds.map(toId).filter(Boolean);
}

export default function MapSettingsForm({ map, onSave }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const mapId = useMemo(() => String(map?._id?.$oid || map?._id || ""), [map?._id]);
  const companyId = useMemo(
    () => String(map?.companyId?._id?.$oid || map?.companyId?._id || map?.companyId || ""),
    [map?.companyId]
  );

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState("");

  // ✅ NEW: team managers instead of departments
  const [managerIds, setManagerIds] = useState([]);

  const [careerPathCategoryIds, setCareerPathCategoryIds] = useState([]);

  useEffect(() => {
    if (!mapId) return;

    setTitle(map?.title || "");
    setCategory(map?.category || CATEGORY_OPTIONS[0]);
    setDescription(map?.description || "");

    setManagerIds(toIdArray(map?.managerIds));
    setCareerPathCategoryIds(toIdArray(map?.careerPathCategoryIds));

    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      companyId: companyId || map.companyId, // keep compatibility if map.companyId is already a string id
      title: title.trim(),
      category,
      description: description.trim(),
      managerIds,
      careerPathCategoryIds,
    };

    if (!payload.title) {
      setSaving(false);
      setError("Title is required.");
      return;
    }

    try {
      await onSave(payload);
    } catch (err) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
            Category
          </label>
          <select
            className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={saving}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
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

      {/* ✅ Team Managers picker (list-only) */}
      <MultiSelectCatalog
        label="Team Managers (optional)"
        valueIds={managerIds}
        onChangeIds={setManagerIds}
        listPath={companyId ? `/api/companies/${companyId}/team-managers` : ""}
        allowCreate={false}
        allowArchive={false}
        emptyText={companyId ? "No team managers found for this company." : "Select a company first."}
        itemLabel={(u) => {
          const base = u?.name || u?.email || u?._id;
          const team = u?.teamId?.name || u?.teamId?.title;
          return team ? `${base} (${team})` : base;
        }}
      />

      <MultiSelectCatalog
        label="Career Path Categories (optional)"
        valueIds={careerPathCategoryIds}
        onChangeIds={setCareerPathCategoryIds}
        listPath="/api/maps-catalogs/career-path-categories"
        createPath="/api/maps-catalogs/career-path-categories"
        archivePathForId={(id) => `/api/maps-catalogs/career-path-categories/${id}/archive`}
        itemLabel={(x) => x?.name || x?._id}
      />

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
