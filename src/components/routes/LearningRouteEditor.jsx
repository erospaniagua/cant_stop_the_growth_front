import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/api/client.js";
import PhaseEditor from "@/components/courses/PhaseEditor"; // modal for editing phases

export default function LearningRouteEditor({ open, onClose, routeId, refresh }) {
  const [route, setRoute] = useState(null);
  const [routeTitle, setRouteTitle] = useState("");
  const [routeDesc, setRouteDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showPhaseEditor, setShowPhaseEditor] = useState(null);
  const hasBootstrapped = useRef(false);

  /* ===========================================================
     Load existing route OR create a new one
  =========================================================== */
  useEffect(() => {
    if (!open || hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    if (routeId) {
      setLoading(true);
      apiClient
        .get(`/api/learning-routes/${routeId}`)
        .then((data) => {
          setRoute(data);
          setRouteTitle(data.title || "");
          setRouteDesc(data.description || "");
        })
        .finally(() => setLoading(false));
    } else {
      setCreating(true);
      apiClient
        .post("/api/learning-routes", {
          title: "Untitled Learning Route",
          description: "",
        })
        .then((data) => {
          setRoute(data);
          setRouteTitle(data.title || "");
          setRouteDesc(data.description || "");
        })
        .finally(() => setCreating(false));
    }
  }, [open, routeId]);

  /* ===========================================================
   Debounced autosave for title/description (real-time feedback)
  =========================================================== */
useEffect(() => {
  if (!route?._id) return;

  // 🕓 Immediately show “Saving…” when user types
  setSaving(true);

  const timer = setTimeout(async () => {
    try {
      await apiClient.patch(`/api/learning-routes/${route._id}`, {
        title: routeTitle,
        description: routeDesc,
      });

      // ✅ Update local route safely
      setRoute((prev) => ({
        ...prev,
        title: routeTitle,
        description: routeDesc,
      }));

      // ✅ Done saving
      setSaving(false);
    } catch (e) {
      console.error("Route autosave failed:", e);
      // Show an error state briefly if you want
      setSaving(false);
    }
  }, 600);

  return () => clearTimeout(timer);
}, [routeTitle, routeDesc]);


  /* ===========================================================
     Add a new phase to the route
  =========================================================== */
  const handleAddPhase = async () => {
    if (!route?._id) return;
    try {
      const updated = await apiClient.post(`/api/learning-routes/${route._id}/phases`, {
        title: `Phase ${route.phases?.length + 1 || 1}`,
        description: "",
      });
      setRoute(updated);
    } catch (err) {
      console.error("Error adding phase:", err);
      alert("❌ Could not add new phase");
    }
  };

  /* ===========================================================
     Publish the entire learning route (not a single phase)
  =========================================================== */
  const handlePublish = async () => {
    if (!route?._id) return;
    setPublishing(true);
    try {
      // ✅ this publishes the WHOLE learning route, not individual phases
      const res = await apiClient.patch(`/api/learning-routes/${route._id}/publish`);
      setRoute(res.route || res);
      alert("✅ Learning Route published!");
      refresh?.();
      handleClose();
    } catch (err) {
      console.error("Error publishing route:", err);
      alert(err?.message || "❌ Failed to publish route");
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    hasBootstrapped.current = false;
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800">
        <div className="min-w-0">
          <input
            value={routeTitle}
            onChange={(e) => setRouteTitle(e.target.value)}
            placeholder="Untitled Learning Route"
            className="w-full bg-transparent text-xl font-semibold outline-none truncate"
          />
          <input
            value={routeDesc}
            onChange={(e) => setRouteDesc(e.target.value)}
            placeholder="Add a description…"
            className="w-full bg-transparent text-sm text-neutral-600 dark:text-neutral-400 outline-none"
          />
          <div className="mt-1 text-xs text-neutral-500">
            {saving ? "Saving…" : "Saved"}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleAddPhase}
            disabled={!route || creating}
            className="px-3 py-2 text-sm rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          >
            + Add Phase
          </button>
          <button
            onClick={handlePublish}
            disabled={!route || publishing}
            className="px-3 py-2 text-sm rounded bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50"
          >
            {publishing ? "Publishing..." : "Publish Route"}
          </button>
          <button
            onClick={handleClose}
            className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white text-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {loading || creating ? (
          <p className="text-neutral-600 dark:text-neutral-400">Loading…</p>
        ) : route?.phases?.length ? (
          route.phases.map((p, i) => (
            <div
              key={p.course?._id || i}
              className="p-4 rounded-lg transition border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 hover:border-blue-500 dark:hover:border-blue-400"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-lg text-blue-600 dark:text-blue-400">
                  {p.title || `Phase ${i + 1}`}
                </h3>
                <button
                  onClick={() => setShowPhaseEditor(p.course._id)} // ✅ this sets the selected phase
                  className="text-sm text-blue-500 dark:text-blue-300 hover:underline"
                >
                  Open Editor →
                </button>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-400">
                {p.course?.modules?.length || 0} modules •{" "}
                {p.course?.finished ? "✅ Finished" : "🕓 In Progress"}
              </p>
            </div>
          ))
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400 italic">
            No phases yet — click “Add Phase” to begin.
          </p>
        )}
      </div>

      {/* Modal: Phase Editor */}
      {showPhaseEditor && route && (
        <PhaseEditor
          open={!!showPhaseEditor}
          onClose={() => setShowPhaseEditor(null)}
          routeId={route._id}       // ✅ correct parent route ID
          phaseId={showPhaseEditor} // ✅ selected phase ID
          refresh={() =>
            apiClient.get(`/api/learning-routes/${route._id}`).then(setRoute)
          }
        />
      )}
    </div>
  );
}
