import { useEffect, useState } from "react"
import { apiClient } from "@/api/client.js"
import { useUser } from "@/context/UserContext"

export default function MyLearningRoutes() {
  const { token } = useUser()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    apiClient
      .get("/api/learning-routes?matchUserCategories=true", { headers: { Authorization: `Bearer ${token}` }})
      .then(setRoutes)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading your courses...</p>

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold mb-4">My Learning Routes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {routes.map((r) => (
          <div
            key={r._id}
            className="p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-900/70 hover:border-blue-500 transition"
            onClick={() => window.location.href = `/my-learning-routes/${r._id}`}
          >
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">{r.title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{r.description}</p>

            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-2">
              {r.categories.map((cat) => (
                <span key={cat} className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  {cat}
                </span>
              ))}
            </div>

            {/* Progress bar */}
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${r.progress || 0}%` }}
              />
            </div>
            <p className="text-xs text-neutral-500 mt-1">{r.progress || 0}% completed</p>
          </div>
        ))}
      </div>
    </div>
  )
}
