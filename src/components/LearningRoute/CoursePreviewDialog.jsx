import React, { useMemo } from "react";

/**
 * CoursePreviewDialog
 * ---------------------
 * Fully supports nested structure:
 * [
 *   { title: "Module 1", lessons: [ { type, title, payload } ] },
 *   ...
 * ]
 * and all file URL states (preview, uploadedUrl, fileUrl).
 */
export default function CoursePreviewDialog({
  modules = [],
  onClose,
  onConfirm,
  uploading,
}) {
  // 🧮 Summary counts across all lessons
  const summary = useMemo(() => {
    const counts = { video: 0, pdf: 0, quiz: 0, cert: 0 };
    for (const mod of modules) {
      for (const lesson of mod.lessons || []) {
        counts[lesson.type] = (counts[lesson.type] || 0) + 1;
      }
    }
    return counts;
  }, [modules]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-neutral-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            Review Before Publishing
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-sm font-medium"
          >
            ✕ Close
          </button>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3 border-b border-neutral-800 text-sm text-neutral-300 bg-neutral-900/60">
          <span className="mr-4">
            🎥 Videos: <span className="text-white">{summary.video}</span>
          </span>
          <span className="mr-4">
            📄 PDFs: <span className="text-white">{summary.pdf}</span>
          </span>
          <span className="mr-4">
            🧠 Quizzes: <span className="text-white">{summary.quiz}</span>
          </span>
          <span>
            🎓 Certifications: <span className="text-white">{summary.cert}</span>
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modules.length === 0 ? (
            <p className="text-neutral-400 text-center">No modules added yet.</p>
          ) : (
            modules.map((mod, i) => (
              <div
                key={i}
                className="rounded-xl bg-neutral-800/80 border border-neutral-700 p-4 shadow-sm"
              >
                <h3 className="font-semibold text-white mb-4 text-lg">
                  {i + 1}. {mod.title || `Module ${i + 1}`}
                </h3>

                {/* Lessons inside module */}
                {!mod.lessons?.length ? (
                  <p className="text-neutral-400 text-sm italic">
                    No lessons added in this module.
                  </p>
                ) : (
                  mod.lessons.map((lesson, li) => {
                    const src =
                      lesson.payload?.preview ||
                      lesson.payload?.uploadedUrl ||
                      lesson.payload?.fileUrl ||
                      null;

                    return (
                      <div
                        key={li}
                        className="mb-6 last:mb-0 rounded-lg border border-neutral-700 p-4 bg-neutral-850"
                      >
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          {li + 1}. {lesson.title || "Untitled Lesson"}
                          <span className="text-xs text-neutral-400 uppercase">
                            [{lesson.type}]
                          </span>
                        </h4>

                        {/* Type-specific previews */}
                        {lesson.type === "video" && (
                          <div className="w-full">
                            {src ? (
                              <video
                                src={src}
                                controls
                                className="w-full rounded-lg border border-neutral-700"
                              />
                            ) : (
                              <p className="text-sm text-neutral-400 italic">
                                No video uploaded yet.
                              </p>
                            )}
                          </div>
                        )}

                        {lesson.type === "pdf" && (
                          <div className="w-full">
                            {src ? (
                              <iframe
                                src={src}
                                title={lesson.title}
                                className="w-full h-[400px] rounded-lg border border-neutral-700"
                              />
                            ) : (
                              <p className="text-sm text-neutral-400 italic">
                                No PDF uploaded yet.
                              </p>
                            )}
                          </div>
                        )}

                        {lesson.type === "quiz" && (
                          <div className="space-y-3">
                            {lesson.payload?.questions?.length ? (
                              lesson.payload.questions.map((q, qi) => (
                                <div
                                  key={qi}
                                  className="border border-neutral-700 rounded-lg p-3 bg-neutral-900"
                                >
                                  <p className="font-medium text-white mb-2">
                                    {qi + 1}. {q.text}
                                  </p>
                                  <ul className="space-y-1">
                                    {q.answers.map((a, ai) => (
                                      <li
                                        key={ai}
                                        className={`text-sm ${
                                          a.correct
                                            ? "text-green-400 font-medium"
                                            : "text-neutral-300"
                                        }`}
                                      >
                                        {a.text}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-neutral-400 italic">
                                No questions added yet.
                              </p>
                            )}
                          </div>
                        )}

                        {lesson.type === "cert" && (
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center text-neutral-300 border border-neutral-700 rounded-lg px-8 py-5">
                              🎓 Certification Step
                              <p className="text-sm mt-2 text-neutral-500">
                                Marks the end of the learning route.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 border-t border-neutral-800 px-6 py-3 bg-neutral-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600"
          >
            Back to Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={uploading}
            className={`px-4 py-2 rounded text-white font-semibold ${
              uploading
                ? "bg-yellow-600 cursor-wait"
                : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            {uploading ? "Publishing..." : "Confirm & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
