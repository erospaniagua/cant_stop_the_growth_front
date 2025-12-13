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
          apiClient.get(`/api/learning-tracks/${routeId}`, {
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

  const completedLessons = progress?.completedLessons || []

  // 🔥 1. Flatten all lessons in order
  const allLessons = []
  route.phases.forEach((phase) => {
    phase.course.modules.forEach((mod) => {
      mod.lessons.forEach((lesson) => {
        allLessons.push({
          ...lesson,
          phaseId: phase._id,
          moduleId: mod._id,
          phase,
          mod,
        })
      })
    })
  })

  // 🔥 2. Find next incomplete lesson
  const nextLesson =
    allLessons.find((lesson) => !completedLessons.includes(lesson._id)) ||
    allLessons[allLessons.length - 1]

  // 🔥 3. Helper: is lesson unlocked?
  const isLessonUnlocked = (lesson) => {
    const index = allLessons.findIndex((l) => l._id === lesson._id)
    if (index === 0) return true // first lesson always unlocked
    const prev = allLessons[index - 1]
    return completedLessons.includes(prev._id)
  }

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{route.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-3xl">
            {route.description}
          </p>

          {/* Progress bar */}
          <div className="mt-3 w-full max-w-lg h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full">
            <div
              className="h-2 bg-blue-600 rounded-full transition-all"
              style={{ width: `${progress?.percentage || 0}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-neutral-500">
            {progress?.percentage || 0}% completed
          </p>
        </div>

        {/* Continue Button */}
        {nextLesson && (
          <div className="flex flex-col items-center bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 p-4 rounded-lg w-full md:w-80">
            <div className="w-full mb-3">
              <h3 className="text-lg font-medium">{nextLesson.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                {nextLesson.type}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/my-learning-tracks/${routeId}/lessons/${nextLesson._id}`
                )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 w-full"
            >
              Continue →
            </button>
          </div>
        )}
      </div>

      {/* Phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {route.phases.map((phase) => (
          <div
            key={phase._id}
            className="p-4 rounded-lg border border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/70"
          >
            <h3 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">
              {phase.title}
            </h3>

            {phase.course.modules.map((mod) => (
              <div key={mod._id} className="mb-3">
                <p className="text-sm font-medium mb-2">{mod.title}</p>

                <ul className="space-y-1">
                  {mod.lessons.map((lesson) => {
                    const unlocked = isLessonUnlocked(lesson)
                    const completed = completedLessons.includes(lesson._id)

                    return (
                      <li
                        key={lesson._id}
                        className={`flex items-center justify-between text-sm p-2 rounded border ${
                          unlocked
                            ? "cursor-pointer hover:border-blue-400 border-transparent"
                            : "opacity-50 cursor-not-allowed border-neutral-300"
                        }`}
                        onClick={() =>
                          unlocked &&
                          navigate(
                            `/my-learning-tracks/${routeId}/lessons/${lesson._id}`
                          )
                        }
                      >
                        <div className="flex items-center gap-2">
                          <span>{completed ? "✅" : "📘"}</span>
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
        ))}
      </div>
    </div>
  )
}
