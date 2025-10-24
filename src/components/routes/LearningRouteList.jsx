import { useEffect, useState } from "react";
import { apiClient } from "@/api/client.js";
import LearningRouteEditor from "./LearningRouteEditor";
import { useTheme } from "next-themes";

export default function LearningRouteList() {
  const { theme } = useTheme();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openEditor, setOpenEditor] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState(null);

  /* ===========================================================
     🟢 Load all learning routes
  =========================================================== */
  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/api/learning-routes");
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
     ➕ Create new learning route
  =========================================================== */
  const handleCreate = () => {
    setActiveRouteId(null);
    setOpenEditor(true);
  };

  /* ===========================================================
     🧩 Render
  =========================================================== */
  return (
    <div
      className="
        p-8 min-h-screen
        text-neutral-900 dark:text-white
        bg-white dark:bg-neutral-950
        transition-colors
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <span role="img" aria-label="book">
            📚
          </span>{" "}
          Learning Routes
        </h1>
        <button
          onClick={handleCreate}
          className="
            px-4 py-2 rounded text-sm font-medium
            bg-blue-600 hover:bg-blue-500
            text-white shadow-sm
            transition
          "
        >
          + New Learning Route
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
      ) : routes.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400 italic">
          No learning routes yet — click “+ New Learning Route”.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {routes.map((r) => (
            <div
              key={r._id}
              className="
                flex flex-col justify-between p-4 rounded-lg border
                bg-neutral-50 dark:bg-neutral-900/70
                border-neutral-300 dark:border-neutral-800
                hover:border-blue-500 dark:hover:border-blue-400
                hover:shadow-md transition
              "
            >
              <div>
                <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  {r.title}
                </h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-400 mb-2 line-clamp-2">
                  {r.description || "No description"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  {r.phases?.length || 0} phases •{" "}
                  {r.finished ? "✅ Published" : "🕓 Draft"}
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveRouteId(r._id);
                  setOpenEditor(true);
                }}
                className="
                  mt-4 w-full px-3 py-2 rounded text-sm font-medium
                  border border-neutral-300 dark:border-neutral-700
                  bg-neutral-100 dark:bg-neutral-800
                  text-neutral-800 dark:text-neutral-200
                  hover:border-blue-500 dark:hover:border-blue-400
                  transition
                "
              >
                Open
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Editor */}
      {openEditor && (
        <LearningRouteEditor
          open={openEditor}
          onClose={() => setOpenEditor(false)}
          routeId={activeRouteId}
          refresh={fetchRoutes}
        />
      )}
    </div>
  );
}
