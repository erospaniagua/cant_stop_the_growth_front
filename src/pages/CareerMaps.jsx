import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";
import MultiSelectCatalog from "@/components/Maps/MultiSelectCatalog";
import UserConfirmDialog from "@/components/UserConfirmDialog";


/**
 * Admin Career Maps Hub
 * - Companies selector: GET /api/companies
 * - Maps list: GET /api/career-maps/admin/company/:companyId
 * - CRUD:
 *   POST /api/career-maps
 *   PATCH /api/career-maps/:id
 *   POST /api/career-maps/:id/publish
 *   POST /api/career-maps/:id/unpublish
 *
 * NOTES:
 * - No client-side truth: refetch after any mutation.
 * - Uses fetch-based apiClient (returns JSON directly, no .data).
 */

const CATEGORY_OPTIONS = ["Install", "Service", "Sales", "Office Staff", "Leadership"];
const isObjectId = (v) => /^[a-f\d]{24}$/i.test(String(v || ""));

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

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


function ModalShell({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[min(720px,92vw)] max-h-[85vh] overflow-auto rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            {title}
          </h2>
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

function toIdArray(maybeIds) {
  if (!Array.isArray(maybeIds)) return [];
  return maybeIds
    .map((x) => {
      if (!x) return null;
      if (typeof x === "string") return x;
      if (typeof x === "object" && x._id) return String(x._id);
      return null;
    })
    .filter(Boolean);
}

function CareerMapFormModal({
  mode, // "create" | "edit"
  initial,
  companyId,
  onClose,
  onSaved,
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState(initial?.category || CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState(initial?.description || "");

  // ✅ Multi-select state
const [managerIds, setManagerIds] = useState(toIdArray(initial?.managerIds));
  const [careerPathCategoryIds, setCareerPathCategoryIds] = useState(
    toIdArray(initial?.careerPathCategoryIds)
  );

  // ✅ If editing and `initial` changes, sync form
  useEffect(() => {
    setTitle(initial?.title || "");
    setCategory(initial?.category || CATEGORY_OPTIONS[0]);
    setDescription(initial?.description || "");
    setManagerIds(toIdArray(initial?.managerIds));
    setCareerPathCategoryIds(toIdArray(initial?.careerPathCategoryIds));
    setError("");
  }, [initial?._id]);

  

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      companyId,
      title: title.trim(),
      category,
      description: description.trim(),
      managerIds,
      careerPathCategoryIds,
      // published is controlled via publish/unpublish endpoint
    };

    if (!payload.title) {
      setSaving(false);
      setError("Title is required.");
      return;
    }

    try {
      if (mode === "create") {
        await apiClient.post("/api/career-maps", payload);
      } else {
        await apiClient.patch(`/api/career-maps/${initial._id}`, payload);
      }
      onSaved?.();
      onClose?.();
    } catch (err) {
     setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      title={mode === "create" ? "New Career Map" : "Edit Career Map"}
      onClose={onClose}
    >
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
              placeholder="e.g., HVAC Install Path"
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
            placeholder="Short explanation for admins/coaches"
            disabled={saving}
          />
        </div>

        {/* ✅ Multi-select catalogs */}
        <MultiSelectCatalog
  label="Team Managers (optional)"
  valueIds={managerIds}
  onChangeIds={setManagerIds}
  listPath={`/api/companies/${companyId}/team-managers`}
  allowCreate={false}
  allowArchive={false}
  emptyText="No team managers found for this company."
  itemLabel={(u) => {
    const base = u?.name || u?.email || u?._id;
    const team = u?.teamId?.name || u?.teamId?.title; // depends how your Team schema names it
    return team ? `${base} (${team})` : base;
  }}
/>

        <MultiSelectCatalog
          label="Career Path Categories (optional)"
          valueIds={careerPathCategoryIds}
          onChangeIds={setCareerPathCategoryIds}
          listPath="/api/maps-catalogs/career-path-categories"
          createPath="/api/maps-catalogs/career-path-categories"
          archivePathForId={(id) =>
            `/api/maps-catalogs/career-path-categories/${id}/archive`
          }
          itemLabel={(x) => x?.name || x?._id}
          showArchivedToggle={false}
        />

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

export default function CareerMaps() {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingMap, setEditingMap] = useState(null);

  const [confirm, setConfirm] = useState(null); // { type: "publish"|"unpublish", map }
const [confirmOpen, setConfirmOpen] = useState(false);
const [confirmLoading, setConfirmLoading] = useState(false);

  const canPublish = useMemo(() => user?.role === "admin", [user?.role]);


  const canUseAdminHub = useMemo(
    () => ["admin", "coach"].includes(user?.role),
    [user?.role]
  );

  // initial company id (ignore garbage like "c")
  const qpCompanyId = searchParams.get("companyId");
  const initialCompanyId = isObjectId(qpCompanyId)
    ? qpCompanyId
    : isObjectId(user?.companyId)
    ? user.companyId
    : "";

  const [companyId, setCompanyId] = useState(initialCompanyId);

  // Safe selected id that always matches an option if companies exist
  const selectedCompanyId = useMemo(() => {
    if (isObjectId(companyId) && companies.some((c) => c._id === companyId)) {
      return companyId;
    }
    if (companies.length > 0) return companies[0]._id;
    return "";
  }, [companyId, companies]);

  async function handleSuitConfirm(masterKey) {
  if (!confirm?.map?._id) return;

  setConfirmLoading(true);
  try {
    if (confirm.type === "publish") {
      await apiClient.post(`/api/career-maps/${confirm.map._id}/publish`, { masterKey });
    } else {
      await apiClient.post(`/api/career-maps/${confirm.map._id}/unpublish`, { masterKey });
    }

    setConfirmOpen(false);
    setConfirm(null);
    await fetchMaps(selectedCompanyId);
  } catch (err) {
    alert(err?.message || "Action failed");
  } finally {
    setConfirmLoading(false);
  }
}


  async function fetchCompanies() {
    setCompaniesLoading(true);
    try {
      const res = await apiClient.get("/api/companies"); // returns array
      console.log("GET /api/companies =>", res);
      setCompanies(Array.isArray(res) ? res : []);
    } catch (err) {
      console.log("GET /api/companies FAILED =>", err);
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  }

  async function fetchMaps(activeCompanyId) {
    if (!isObjectId(activeCompanyId)) {
      setMaps([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(
        canUseAdminHub
          ? `/api/career-maps/admin/company/${activeCompanyId}`
          : "/api/career-maps"
      );
      setMaps(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err?.message || "Failed to load maps");
      setMaps([]);
    } finally {
      setLoading(false);
    }
  }

  // load companies once
  useEffect(() => {
    fetchCompanies();
  }, []);

  // clean junk query param like ?companyId=c on mount
  useEffect(() => {
    const qp = searchParams.get("companyId");
    if (qp && !isObjectId(qp)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("companyId");
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep internal companyId aligned to selectedCompanyId once companies are known
  useEffect(() => {
    if (selectedCompanyId && selectedCompanyId !== companyId) {
      setCompanyId(selectedCompanyId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  // fetch maps when selected company changes
  useEffect(() => {
    if (!isObjectId(selectedCompanyId)) {
      setMaps([]);
      return;
    }

    fetchMaps(selectedCompanyId);

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("companyId", selectedCompanyId);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyId]);

  function openCreate() {
    if (!isObjectId(selectedCompanyId)) return;
    setFormMode("create");
    setEditingMap(null);
    setFormOpen(true);
  }

  function openEdit(map) {
    setFormMode("edit");
    setEditingMap(map);
    setFormOpen(true);
  }

  function openPublish(map) {
  setConfirm({ type: "publish", map });
  setConfirmOpen(true);
}

  function openUnpublish(map) {
  setConfirm({ type: "unpublish", map });
  setConfirmOpen(true);
}

  async function runConfirm() {
    if (!confirm?.map?._id) return;

    setConfirmLoading(true);
    try {
      if (confirm.type === "publish") {
        await apiClient.post(`/api/career-maps/${confirm.map._id}/publish`);
      } else {
        await apiClient.post(`/api/career-maps/${confirm.map._id}/unpublish`);
      }
      setConfirm(null);
      await fetchMaps(selectedCompanyId);
    } catch (err) {
      alert(err?.message || "Action failed");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            Career Maps
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Create, edit, and publish career progression maps. Publishing controls student visibility.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700
                       bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100
                       min-w-[260px]"
            value={selectedCompanyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={companiesLoading || companies.length === 0}
          >
            {companiesLoading ? (
              <option value="">Loading companies…</option>
            ) : companies.length === 0 ? (
              <option value="">No companies found</option>
            ) : (
              companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name || c.title || c._id}
                </option>
              ))
            )}
          </select>

          <button
            className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            onClick={openCreate}
            disabled={!isObjectId(selectedCompanyId)}
          >
            New Map
          </button>
        </div>
      </div>

      <div className="mt-6">
        {error ? (
          <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <div className="mt-3 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-zinc-300">
              {loading ? "Loading…" : `${maps.length} map(s)`}
            </div>
            <button
              className="text-sm px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100 disabled:opacity-60"
              onClick={() => fetchMaps(selectedCompanyId)}
              disabled={!isObjectId(selectedCompanyId) || loading}
            >
              Refresh
            </button>
          </div>

          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white dark:bg-zinc-950">
                <tr className="text-left text-gray-600 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white dark:bg-zinc-950">
                {loading ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-gray-600 dark:text-zinc-400"
                      colSpan={5}
                    >
                      Loading career maps…
                    </td>
                  </tr>
                ) : maps.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-6 text-gray-600 dark:text-zinc-400"
                      colSpan={5}
                    >
                      No career maps found for this company.
                    </td>
                  </tr>
                ) : (
                  maps.map((m) => (
                    <tr
                      key={m._id}
                      className="border-b border-gray-100 dark:border-zinc-900"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-zinc-100">
                          {m.title}
                        </div>
                        {m.description ? (
                          <div className="text-xs text-gray-600 dark:text-zinc-400 mt-0.5">
                            {m.description}
                          </div>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Array.isArray(m.coachIds) && m.coachIds.length ? (
                           <Pill tone="blue">{m.coachIds.length} coach</Pill>
                           ) : null}

                          {Array.isArray(m.careerPathCategoryIds) &&
                          m.careerPathCategoryIds.length ? (
                            <Pill tone="yellow">
                              {m.careerPathCategoryIds.length} path tags
                            </Pill>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <Pill>{m.category || "—"}</Pill>
                      </td>

                      <td className="px-4 py-3">
                        {m.published ? (
                          <Pill tone="green">Published</Pill>
                        ) : (
                          <Pill>Draft</Pill>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-700 dark:text-zinc-300">
                        {formatDate(m.updatedAt)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/career-maps/${m._id}`}
                            className="px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
                          >
                            Open
                          </Link>

                          <button
                            className="px-3 py-1.5 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
                            onClick={() => openEdit(m)}
                          >
                            Edit
                          </button>

                          {canPublish ? (
  m.published ? (
    <button
      className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white"
      onClick={() => openUnpublish(m)}
    >
      Unpublish
    </button>
  ) : (
    <button
      className="px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white"
      onClick={() => openPublish(m)}
    >
      Publish
    </button>
  )
) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {formOpen ? (
        <CareerMapFormModal
          mode={formMode}
          initial={editingMap}
          companyId={selectedCompanyId}
          onClose={() => setFormOpen(false)}
          onSaved={() => fetchMaps(selectedCompanyId)}
        />
      ) : null}
      <UserConfirmDialog
  open={confirmOpen}
  onOpenChange={(v) => {
    if (confirmLoading) return;
    setConfirmOpen(v);
    if (!v) setConfirm(null);
  }}
  message={
    confirm?.type === "publish"
      ? "Publishing makes this map visible to students (category gated)."
      : "Unpublishing hides this map from students."
  }
  onConfirm={handleSuitConfirm}
/>

    </div>
  );
}
