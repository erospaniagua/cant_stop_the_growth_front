import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/api/client";

function safeErrMsg(e) {
  return (
    e?.response?.data?.message ||
    e?.data?.message ||
    e?.message ||
    "Failed to load"
  );
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700",
    green: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-900",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

export default function MyCareerMaps() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [maps, setMaps] = useState([]);

  async function fetchMaps() {
    setLoading(true);
    setErr("");
    try {
      const res = await apiClient.get("/api/career-maps"); // student-visible maps
      setMaps(Array.isArray(res) ? res : []);
    } catch (e) {
      setMaps([]);
      setErr(safeErrMsg(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMaps();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
            My Career Maps
          </h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400">
            Pick one. Then go prove you can do things.
          </p>
        </div>

        <button
          className="px-3 py-2 rounded border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-900 dark:text-zinc-100 disabled:opacity-60"
          onClick={fetchMaps}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="mt-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-sm text-gray-600 dark:text-zinc-400">Loading maps…</div>
        ) : maps.length === 0 ? (
          <div className="text-sm text-gray-600 dark:text-zinc-400">
            No career maps available for your categories.
          </div>
        ) : (
          maps.map((m) => (
            <Link
              key={m._id}
              to={`/career-maps/${m._id}`} // ✅ routes to CareerMapStudentDetail
              className="block rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 hover:bg-gray-50 dark:hover:bg-zinc-900 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
                    {m.title}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                    {m.description || "—"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone="blue">{m.category || "—"}</Badge>
                  {m.published ? <Badge tone="green">Published</Badge> : <Badge>Draft</Badge>}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-zinc-400">
                <span>{Array.isArray(m.careerPathCategoryIds) ? `${m.careerPathCategoryIds.length} tags` : "0 tags"}</span>
                <span className="text-blue-600 dark:text-blue-300">Open →</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
