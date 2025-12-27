import { useEffect, useState } from "react";
import { apiClient } from "@/api/client.js";
import LearningRouteEditor from "./LearningRouteEditor";
import UserConfirmDialog from "@/components/UserConfirmDialog";
import { useTheme } from "next-themes";

export default function LearningRouteList() {
  const { theme } = useTheme();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("active"); // "active" | "archived"

  const [openEditor, setOpenEditor] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState(null);

  // Admin-confirm flow
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);// "archive" | "unarchive" | "delete"
  const [confirmMessage, setConfirmMessage] = useState("");
  const [targetRouteId, setTargetRouteId] = useState(null);

  /* ===========================================================
     🟢 Load learning routes
  =========================================================== */
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/api/learning-tracks");
      setRoutes(data);
    } catch (err) {
      console.error("Error loading learning routes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  /* ===========================================================
     🔐 Admin-confirmed action
  =========================================================== */
  async function handleAdminConfirm(masterKey) {
  if (!pendingAction || !targetRouteId) return;

  try {
    if (pendingAction === "archive") {
      await apiClient.patch(
        `/api/learning-tracks/${targetRouteId}/archive`,
        { masterKey }
      );
    }

    if (pendingAction === "unarchive") {
      await apiClient.patch(
        `/api/learning-tracks/${targetRouteId}/unarchive`,
        { masterKey }
      );
    }

    if (pendingAction === "delete") {
      await apiClient.del(
        `/api/learning-tracks/${targetRouteId}`,
        { body: { masterKey } }
      );
    }

    await fetchRoutes();
  } catch (err) {
    console.error("Admin action failed:", err);
    alert("Action failed. Check admin key or server logs.");
  } finally {
    setConfirmOpen(false);
    setPendingAction(null);
    setTargetRouteId(null);
    setConfirmMessage("");
  }
}


  /* ===========================================================
     🧠 Derived state
  =========================================================== */
  const visibleRoutes = routes.filter((r) =>
    activeTab === "active" ? !r.isArchived : r.isArchived
  );

  /* ===========================================================
     🧩 Render
  =========================================================== */
  return (
    <div className="p-8 min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">📚 Learning Tracks</h1>

        {activeTab === "active" && (
          <button
            onClick={() => {
              setActiveRouteId(null);
              setOpenEditor(true);
            }}
            className="px-4 py-2 rounded text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            + New Learning Track
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm rounded ${
            activeTab === "active"
              ? "bg-blue-600 text-white"
              : "bg-neutral-200 dark:bg-neutral-800"
          }`}
        >
          Active
        </button>

        <button
          onClick={() => setActiveTab("archived")}
          className={`px-4 py-2 text-sm rounded ${
            activeTab === "archived"
              ? "bg-blue-600 text-white"
              : "bg-neutral-200 dark:bg-neutral-800"
          }`}
        >
          Archived
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : visibleRoutes.length === 0 ? (
        <p className="text-neutral-500 italic">
          {activeTab === "active"
            ? "No active learning tracks."
            : "No archived learning tracks."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleRoutes.map((r) => (
            <div
              key={r._id}
              className={`flex flex-col justify-between p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-900/70 border-neutral-300 dark:border-neutral-800 transition ${
                r.isArchived ? "opacity-60" : "hover:border-blue-500"
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  {r.title}
                </h3>

                <p className="text-sm text-neutral-700 dark:text-neutral-400 mb-2 line-clamp-2">
                  {r.description || "No description"}
                </p>

                {r.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {r.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-neutral-500">
                  {r.phases?.length || 0} phases •{" "}
                  {r.finished ? "✅ Published" : "🕓 Draft"}
                </p>
              </div>

              {/* Actions */}
              <div className="mt-4 space-y-2">
                {activeTab === "active" && (
                  <>
                    <button
                      onClick={() => {
                        setActiveRouteId(r._id);
                        setOpenEditor(true);
                      }}
                      className="w-full px-3 py-2 rounded text-sm border bg-neutral-100 dark:bg-neutral-800"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => {
                        setPendingAction("archive");
                        setTargetRouteId(r._id);
                        setConfirmOpen(true);
                      }}
                      className="w-full px-3 py-2 text-sm rounded bg-yellow-600 text-white"
                    >
                      Archive
                    </button>
                  </>
                )}

                {activeTab === "archived" && (
                  <>
                   <button
  onClick={() => {
    setPendingAction("unarchive");
    setTargetRouteId(r._id);
    setConfirmMessage(
      "This learning track will be restored and become visible to users again."
    );
    setConfirmOpen(true);
  }}
  className="w-full px-3 py-2 text-sm rounded bg-green-600 text-white"
>
  Unarchive
</button>


                    <button
  onClick={() => {
    setPendingAction("delete");
    setTargetRouteId(r._id);
    setConfirmMessage(
      "This action is PERMANENT.\n\n" +
      "The learning track will be permanently deleted.\n" +
      "All related videos, PDFs, and test files will be removed from cloud storage.\n\n" +
      "This action CANNOT be undone."
    );
    setConfirmOpen(true);
  }}
  className="w-full px-3 py-2 text-sm rounded bg-red-600 text-white"
>
  Delete
</button>

                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      {openEditor && (
        <LearningRouteEditor
          open={openEditor}
          onClose={() => setOpenEditor(false)}
          routeId={activeRouteId}
          refresh={fetchRoutes}
        />
      )}

      {/* Admin Confirm */}
      {confirmOpen && (
        <UserConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleAdminConfirm}
          message={confirmMessage}
        />
      )}
    </div>
  );
}
