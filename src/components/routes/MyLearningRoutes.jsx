import { useEffect, useState } from "react";
import { apiClient } from "@/api/client.js";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";

export default function MyLearningRoutes() {
  const { token } = useUser();
  const navigate = useNavigate();

  const [routes, setRoutes] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // 1) Fetch learning routes for the user
        const routeData = await apiClient.get(
          "/api/learning-tracks?matchUserCategories=true",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 2) Fetch all progress for this user
        const progressData = await apiClient.get("/api/progress", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Build a dictionary: { routeId: percentage }
        const map = {};
        progressData.forEach((p) => {
          map[p.routeId._id] = p.percentage || 0
        });

        setProgressMap(map);
        setRoutes(routeData);
      } catch (err) {
        console.error("Error loading routes or progress:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (loading) return <p>Loading your courses...</p>;

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">My Learning Routes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routes.map((r) => {
          const percent = progressMap[r._id] ?? 0;

          return (
            <div
              key={r._id}
              className="
                p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-900/70 
                hover:border-blue-500 dark:hover:border-blue-400 
                transition cursor-pointer
              "
              onClick={() => navigate(`/my-learning-tracks/${r._id}`)}
            >
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                {r.title}
              </h3>

              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                {r.description || "No description"}
              </p>

              {/* Categories */}
              <div className="flex flex-wrap gap-1 mb-2">
                {r.categories?.map((cat) => (
                  <span
                    key={cat}
                    className="
                      px-2 py-0.5 text-xs rounded-full 
                      bg-blue-100 dark:bg-blue-900/40 
                      text-blue-700 dark:text-blue-300
                    "
                  >
                    {cat}
                  </span>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs text-neutral-500 mt-1">
                {percent}% completed
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
