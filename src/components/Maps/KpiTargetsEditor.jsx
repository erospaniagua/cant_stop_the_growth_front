import { useState, useEffect } from "react"; 
import { apiClient } from "@/api/client";
import ModalShell from "../ui/ModalShell";
 export function KpiTargetsEditor({ value, onChange }) {
  const [kpis, setKpis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [openCreate, setOpenCreate] = useState(false);
  const [newKpiName, setNewKpiName] = useState("");
  const [newKpiKey, setNewKpiKey] = useState("");
  const [newKpiUnit, setNewKpiUnit] = useState("#");
  const [createSaving, setCreateSaving] = useState(false);
  const [createErr, setCreateErr] = useState("");

  const [archivingId, setArchivingId] = useState("");

  const kpiTargets = Array.isArray(value) ? value : [];

  async function fetchKpis() {
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get("/api/maps-catalogs/kpis");
      const arr = Array.isArray(res) ? res : [];
      // backend uses isArchived, not archived
      const active = arr.filter((k) => !k.isArchived);
      active.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
      setKpis(active);
    } catch (e) {
      setErr(e?.message || "Failed to load KPIs");
      setKpis([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKpis();
  }, []);

  function addRow() {
    onChange([...(kpiTargets || []), { kpiId: "", target: 0 }]);
  }

  function removeRow(idx) {
    onChange(kpiTargets.filter((_, i) => i !== idx));
  }

  function updateRow(idx, patch) {
    onChange(
      kpiTargets.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  }

  const chosenIds = new Set(kpiTargets.map((r) => String(r.kpiId || "")));

  async function handleCreateKpi() {
    setCreateErr("");
    const name = newKpiName.trim();
    const key = newKpiKey.trim();
    const unit = (newKpiUnit || "").trim();

    if (!name) return setCreateErr("KPI name is required.");
    if (!key) return setCreateErr("KPI key is required.");
    if (!unit) return setCreateErr("KPI unit is required.");

    setCreateSaving(true);
    try {
      await apiClient.post("/api/maps-catalogs/kpis", { name, key, unit });
      setOpenCreate(false);
      setNewKpiName("");
      setNewKpiKey("");
      setNewKpiUnit("#");
      await fetchKpis();
    } catch (e) {
      setCreateErr(e?.message || "Failed to create KPI");
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleArchiveKpi(id) {
    if (!id) return;
    setArchivingId(id);
    try {
      await apiClient.patch(`/api/maps-catalogs/kpis/${id}/archive`, {});
      // remove any targets using that KPI
      onChange(kpiTargets.filter((t) => String(t.kpiId) !== String(id)));
      await fetchKpis();
    } catch (e) {
      alert(e?.message || "Failed to archive KPI");
    } finally {
      setArchivingId("");
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">
          KPI Targets
        </h4>
        <div className="flex gap-2">
          <button
            type="button"
            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-800 dark:text-zinc-100"
            onClick={fetchKpis}
            disabled={loading}
          >
            Refresh KPIs
          </button>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setOpenCreate(true)}
          >
            + New KPI
          </button>
          <button
            type="button"
            className="text-xs px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
            onClick={addRow}
          >
            + Target
          </button>
        </div>
      </div>

      {err ? (
        <div className="mt-2 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {err}
        </div>
      ) : null}

      <div className="mt-3 overflow-auto rounded-lg border border-gray-200 dark:border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-950">
            <tr className="text-left text-gray-600 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
              <th className="px-3 py-2">KPI</th>
              <th className="px-3 py-2 w-[160px]">Target</th>
              <th className="px-3 py-2 w-[120px]">Unit</th>
              <th className="px-3 py-2 w-[160px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-zinc-900">
            {kpiTargets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-gray-600 dark:text-zinc-400">
                  No KPI targets yet.
                </td>
              </tr>
            ) : (
              kpiTargets.map((row, idx) => {
                const selected = kpis.find((k) => String(k._id) === String(row.kpiId));
                const selectedUnit = selected?.unit || "—";

                return (
                  <tr key={idx} className="border-b border-gray-100 dark:border-zinc-800">
                    <td className="px-3 py-2">
                      <select
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
                        value={row.kpiId || ""}
                        onChange={(e) => {
                          const nextId = e.target.value;
                          // prevent duplicates
                          const alreadyUsed = Array.from(chosenIds).includes(String(nextId));
                          if (nextId && alreadyUsed && String(nextId) !== String(row.kpiId)) {
                            alert("That KPI is already selected in another row.");
                            return;
                          }
                          updateRow(idx, { kpiId: nextId });
                        }}
                      >
                        <option value="">Select KPI…</option>
                        {kpis.map((k) => (
                          <option key={k._id} value={k._id}>
                            {k.name} ({k.key})
                          </option>
                        ))}
                      </select>
                      {row.kpiId ? (
                        <div className="mt-1 flex justify-between text-xs text-gray-600 dark:text-zinc-400">
                          <span>{selected ? `Key: ${selected.key}` : ""}</span>
                          {selected ? (
                            <button
                              type="button"
                              className="underline"
                              onClick={() => handleArchiveKpi(selected._id)}
                              disabled={archivingId === selected._id}
                            >
                              {archivingId === selected._id ? "Archiving…" : "Archive KPI"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
                        value={row.target ?? 0}
                        onChange={(e) =>
                          updateRow(idx, { target: Number(e.target.value) })
                        }
                      />
                    </td>

                    <td className="px-3 py-2 text-gray-700 dark:text-zinc-300">
                      {selectedUnit}
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => removeRow(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {openCreate ? (
        <ModalShell title="Create KPI" onClose={() => setOpenCreate(false)}>
          {createErr ? (
            <div className="mb-3 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
              {createErr}
            </div>
          ) : null}

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
                Name
              </label>
              <input
                className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
                value={newKpiName}
                onChange={(e) => setNewKpiName(e.target.value)}
                disabled={createSaving}
                placeholder="Cancelations"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
                Key
              </label>
              <input
                className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
                value={newKpiKey}
                onChange={(e) => setNewKpiKey(e.target.value)}
                disabled={createSaving}
                placeholder="cancelations"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
                Lowercase, stable identifier. Don’t get creative.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-zinc-200">
                Unit
              </label>
              <input
                className="mt-1 w-full px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100"
                value={newKpiUnit}
                onChange={(e) => setNewKpiUnit(e.target.value)}
                disabled={createSaving}
                placeholder="#"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
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
                onClick={handleCreateKpi}
                disabled={createSaving}
              >
                {createSaving ? "Saving…" : "Create KPI"}
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
