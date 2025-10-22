import React from "react";

/**
 * CoursePreviewDialog
 * ---------------------
 * Shows the entire course content (modules in sequence)
 * before confirming the bulk upload/publish step.
 */
export default function CoursePreviewDialog({ modules, onClose, onConfirm, uploading }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-[90%] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Course Preview</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-sm font-medium"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {modules.length === 0 ? (
            <p className="text-neutral-400 text-center">No modules yet.</p>
          ) : (
            modules.map((mod, i) => (
              <div
                key={i}
                className="rounded-xl bg-neutral-800 border border-neutral-700 p-4"
              >
                <h3 className="font-medium text-white mb-3">
                  {i + 1}. {mod.title || "Untitled Module"}{" "}
                  <span className="ml-2 text-xs text-neutral-400 uppercase">
                    [{mod.type}]
                  </span>
                </h3>

                {/* Preview by module type */}
                {mod.type === "video" && (
                  <div className="w-full">
                    {mod.payload?.preview ? (
                      <video
                        src={mod.payload.preview}
                        controls
                        className="w-full rounded-lg border border-neutral-700"
                      />
                    ) : mod.payload?.uploadedUrl ? (
                      <video
                        src={mod.payload.uploadedUrl}
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

                {mod.type === "pdf" && (
                  <div className="w-full">
                    {mod.payload?.preview ? (
                      <iframe
                        src={mod.payload.preview}
                        title={mod.title}
                        className="w-full h-[400px] rounded-lg border border-neutral-700"
                      />
                    ) : mod.payload?.uploadedUrl ? (
                      <iframe
                        src={mod.payload.uploadedUrl}
                        title={mod.title}
                        className="w-full h-[400px] rounded-lg border border-neutral-700"
                      />
                    ) : (
                      <p className="text-sm text-neutral-400 italic">
                        No PDF uploaded yet.
                      </p>
                    )}
                  </div>
                )}

                {mod.type === "quiz" && (
                  <div className="space-y-3">
                    {mod.payload?.questions?.length ? (
                      mod.payload.questions.map((q, qi) => (
                        <div
                          key={qi}
                          className="border border-neutral-700 rounded-lg p-3 bg-neutral-850"
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

                {mod.type === "cert" && (
                  <div className="flex items-center justify-center py-10">
                    <div className="text-center text-neutral-300 border border-neutral-700 rounded-lg px-10 py-6">
                      🎓 Certification step
                      <p className="text-sm mt-2 text-neutral-500">
                        This marks the course completion milestone.
                      </p>
                    </div>
                  </div>
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
            className={`px-4 py-2 rounded text-white font-medium ${
              uploading
                ? "bg-yellow-600 cursor-wait"
                : "bg-purple-600 hover:bg-purple-500"
            }`}
          >
            {uploading ? "Publishing..." : "Confirm & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
