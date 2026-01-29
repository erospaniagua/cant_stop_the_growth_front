import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/api/client";

/** Normalize id shapes:
 * - "abc"
 * - { _id: "abc" }
 * - { $oid: "abc" }
 * - { _id: { $oid: "abc" } }
 */
function toId(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") {
    if (x.$oid) return String(x.$oid);
    if (x._id?.$oid) return String(x._id.$oid);
    if (x._id) return String(x._id);
  }
  return "";
}

function MiniModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-[min(520px,92vw)] rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
          <div className="font-semibold text-gray-900 dark:text-zinc-100">{title}</div>
          <button
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * MultiSelectCatalog
 * - listPath: GET endpoint returning array of items
 * - createPath: POST endpoint (expects { name })
 * - archivePathForId: (id) => PATCH endpoint
 *
 * Assumes each item has:
 * - _id
 * - name (optional)
 * - archived OR isArchived (optional)
 */
export function MultiSelectCatalog({
  label,
  valueIds,
  onChangeIds,

  listPath,
  createPath = null,
  archivePathForId = null,

  placeholder = "Select…",

  // 👇 allowCreate/allowArchive now default to "only if endpoint exists"
  allowCreate: allowCreateProp,
  allowArchive: allowArchiveProp,

  showArchivedToggle = false,

  // 👇 customizable empty state
  emptyText = "No options yet.",

  itemLabel = (x) => x?.name || toId(x?._id) || "—",

  isArchived = (x) => Boolean(x?.archived || x?.isArchived),
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [showArchived, setShowArchived] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [createSaving, setCreateSaving] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const [archivingId, setArchivingId] = useState("");

  const selectedSet = useMemo(() => {
    return new Set((valueIds || []).map((v) => toId(v)));
  }, [valueIds]);

  const allowCreate = Boolean(createPath) && (allowCreateProp ?? true);
const allowArchive = Boolean(archivePathForId) && (allowArchiveProp ?? true);


  async function fetchItems() {
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get(listPath);
      const arr = Array.isArray(res) ? res : [];
      setItems(arr);
    } catch (e) {
      setErr(e?.message || "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listPath]);

  const visibleItems = useMemo(() => {
    const base = Array.isArray(items) ? items : [];
    const filtered = showArchived ? base : base.filter((x) => !isArchived(x));
    return filtered
      .slice()
      .sort((a, b) => String(itemLabel(a)).localeCompare(String(itemLabel(b))));
  }, [items, showArchived, itemLabel, isArchived]);

  function toggleId(idRaw) {
    const id = toId(idRaw);
    if (!id) return;

    const set = new Set(selectedSet);
    if (set.has(id)) set.delete(id);
    else set.add(id);

    onChangeIds(Array.from(set));
  }

  async function handleCreate() {
  if (!createPath) return; // ✅ list-only mode safety
  setCreateErr("");
  const name = newName.trim();
  if (!name) {
    setCreateErr("Name is required.");
    return;
  }
  setCreateSaving(true);
  try {
    await apiClient.post(createPath, { name });
    setNewName("");
    setOpenCreate(false);
    await fetchItems();
  } catch (e) {
    setCreateErr(e?.message || "Failed to create");
  } finally {
    setCreateSaving(false);
  }
}


 async function handleArchive(idRaw) {
  if (!archivePathForId) return; // ✅ list-only mode safety
  const id = toId(idRaw);
  if (!id) return;

  setArchivingId(id);
  try {
    await apiClient.patch(archivePathForId(id), {});
    if (selectedSet.has(id)) {
      onChangeIds((valueIds || []).map(toId).filter((x) => x !== id));
    }
    await fetchItems();
  } catch (e) {
    alert(e?.message || "Failed to archive");
  } finally {
    setArchivingId("");
  }
}


  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
          {label}
        </label>

        <div className="flex items-center gap-2">
          {showArchivedToggle ? (
            <label className="text-xs text-gray-600 dark:text-zinc-400 flex items-center gap-1">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              show archived
            </label>
          ) : null}

          <button
            type="button"
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
            onClick={fetchItems}
            disabled={loading}
          >
            Refresh
          </button>

          {allowCreate ? (
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setOpenCreate(true)}
            >
              + Add
            </button>
          ) : null}
        </div>
      </div>

      {err ? (
        <div className="mt-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
          {err}
        </div>
      ) : null}

      <div className="mt-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2">
        {loading ? (
          <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">Loading…</div>
        ) : visibleItems.length === 0 ? (
  <div className="text-sm text-gray-600 dark:text-zinc-400 p-2">
    {emptyText}
  </div>
        ) : (
          <div className="max-h-52 overflow-auto space-y-1">
            {visibleItems.map((it) => {
              const id = toId(it?._id);
              const checked = selectedSet.has(id);

              return (
                <div
                  key={id || Math.random()}
                  className="flex items-center justify-between gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                  <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-zinc-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleId(id)}
                    />
                    <span className={isArchived(it) ? "line-through text-gray-400" : ""}>
                      {itemLabel(it)}
                    </span>
                  </label>

                  {allowArchive && !isArchived(it) ? (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100 disabled:opacity-60"
                      onClick={() => handleArchive(id)}
                      disabled={archivingId === id}
                    >
                      {archivingId === id ? "Archiving…" : "Archive"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-2 text-xs text-gray-600 dark:text-zinc-400">
          Selected: {selectedSet.size ? selectedSet.size : placeholder}
        </div>
      </div>

      {openCreate ? (
        <MiniModal title={`Add ${label}`} onClose={() => setOpenCreate(false)}>
          {createErr ? (
            <div className="mb-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {createErr}
            </div>
          ) : null}

          <div className="space-y-2">
            <input
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              disabled={createSaving}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
                onClick={() => setOpenCreate(false)}
                disabled={createSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                onClick={handleCreate}
                disabled={createSaving}
              >
                {createSaving ? "Saving…" : "Create"}
              </button>
            </div>
          </div>
        </MiniModal>
      ) : null}
    </div>
  );
}

export default MultiSelectCatalog;
