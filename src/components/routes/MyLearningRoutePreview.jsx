import { useEffect, useState } from "react"
import { apiClient } from "@/api/client.js"
import { useParams, useNavigate } from "react-router-dom"
import { useUser } from "@/context/UserContext"

export default function MyLearningRoutePreview() {
  const { token } = useUser()
  const { routeId } = useParams()
  const navigate = useNavigate()

  const [route, setRoute] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [routeData, progressData] = await Promise.all([
          apiClient.get(`/api/learning-routes/${routeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          apiClient.get(`/api/progress/${routeId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        setRoute(routeData)
        setProgress(progressData)
      } catch (err) {
        console.error("Error loading route preview:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [routeId, token])

  if (loading) return <p className="p-8">Loading...</p>
  if (!route) return <p className="p-8 text-red-500">Route not found</p>

  const totalPhases = route.phases.length
  const completed = progress?.completedPhases?.length || 0
  const percentage = progress?.percentage || 0
  const currentPhase =
    route.phases[completed] || route.phases[route.phases.length - 1]
  const firstLesson =
    currentPhase?.course?.modules?.[0]?.lessons?.[0] || null

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{route.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {route.description}
          </p>
          <div className="mt-3 w-full max-w-lg h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-neutral-500">
            {percentage}% completed
          </p>
        </div>

        {/* Continue button */}
        {firstLesson && (
          <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 p-4 rounded-lg w-full md:w-80">
            <div className="w-full mb-3">
              <h3 className="text-lg font-medium">
                {firstLesson.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                {firstLesson.type}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/my-learning-routes/${routeId}/lessons/${firstLesson._id}`
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 w-full"
            >
              Continue →
            </button>
          </div>
        )}
      </div>

      {/* Phase list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {route.phases.map((phase, pi) => {
          const isPhaseLocked = pi > completed
          return (
            <div
              key={phase._id}
              className="p-4 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70"
            >
              <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">
                {phase.title || `Phase ${pi + 1}`}
              </h3>
              {(phase.course?.modules || []).map((mod, mi) => (
                <div key={mod._id} className="mb-3">
                  <p className="text-sm font-medium mb-2">
                    {mod.title}
                  </p>
                  <ul className="space-y-1">
                    {(mod.lessons || []).map((lesson, li) => {
                      const locked = isPhaseLocked
                      return (
                        <li
                          key={lesson._id}
                          className={`flex items-center justify-between text-sm p-2 rounded border ${
                            locked
                              ? "opacity-50 cursor-not-allowed border-neutral-200"
                              : "cursor-pointer border-transparent hover:border-blue-400"
                          }`}
                          onClick={() =>
                            !locked &&
                            navigate(
                              `/my-learning-routes/${routeId}/lessons/${lesson._id}`
                            )
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span>
                              {progress?.completedPhases?.includes(phase._id)
                                ? "✅"
                                : "📘"}
                            </span>
                            <span>{lesson.title}</span>
                          </div>
                          <span className="capitalize text-neutral-500">
                            {lesson.type}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
