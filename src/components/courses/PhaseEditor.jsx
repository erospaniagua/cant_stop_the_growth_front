import { useEffect, useState } from "react";
import { apiClient } from "@/api/client.js";
import CourseFlowBuilder from "@/components/courses/CourseFlowBuilder";
import QuizEditor from "@/components/courses/QuizEditor";
import VideoEditor from "@/components/courses/VideoEditor";
import PdfEditor from "@/components/courses/PdfEditor";

export default function PhaseEditor({ open, onClose, routeId, phaseId, refresh }) {
  const [phase, setPhase] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [reviewItems, setReviewItems] = useState({ files: [], quizzes: [] });

  /* ===========================================================
     Load Phase data
  =========================================================== */
  useEffect(() => {
    if (!open || !routeId || !phaseId) return;
    setLoading(true);
    apiClient
      .get(`/api/learning-routes/${routeId}/phases/${phaseId}`)
      .then((data) => setPhase(data))
      .catch((err) => {
        console.error("Error loading phase:", err);
        setError("Failed to load phase data.");
      })
      .finally(() => setLoading(false));
  }, [open, routeId, phaseId]);

  /* ===========================================================
     Prepare review modal data
  =========================================================== */
  const prepareReviewData = () => {
    if (!phase?.modules?.length) return { files: [], quizzes: [] };

    const files = phase.modules
      .filter((m) => ["video", "pdf"].includes(m.type))
      .map((m) => ({
        type: m.type,
        title: m.title || "Untitled",
        url:
          m.payload?.uploadedUrl ||
          m.payload?.fileUrl ||
          "⚠ Missing upload (staging)",
        inStaging:
          (m.payload?.uploadedUrl || m.payload?.fileUrl || "").includes(
            "/staging/"
          ),
      }));

    const quizzes = phase.modules
      .filter((m) => m.type === "quiz")
      .map((m) => ({
        title: m.title || "Untitled Quiz",
        unsaved: !m.payload?.questions?.length,
        questions: m.payload?.questions?.length || 0,
      }));

    setReviewItems({ files, quizzes });
  };

  /* ===========================================================
     Manual draft save (staging only)
  =========================================================== */
  const handleSaveDraft = async () => {
    if (!phase?._id) return;
    setSaving(true);
    try {
      await apiClient.patch(`/api/learning-routes/${routeId}/phases/${phaseId}`, phase);
      setSaving(false);
      refresh?.();
      alert("✅ Draft saved!");
    } catch (err) {
      console.error("Error saving draft:", err);
      alert("❌ Could not save draft");
      setSaving(false);
    }
  };

  /* ===========================================================
     Final Publish
  =========================================================== */
  const handlePublish = async () => {
  if (!phase?._id) return;
  setSaving(true);
  try {
    // ✅ One single request: backend will update + move files
    await apiClient.patch(
      `/api/learning-routes/${routeId}/phases/${phaseId}/publish`,
      phase
    );

    alert("✅ Phase published successfully!");
    setShowReview(false);
    refresh?.();
    onClose?.();
  } catch (err) {
    console.error("Error publishing phase:", err);
    alert("❌ Could not publish phase");
  } finally {
    setSaving(false);
  }
};

  const handleClose = async () => {
    if (saving) return;
    await handleSaveDraft();
    onClose?.();
  };

  /* ===========================================================
     Module update handler
  =========================================================== */
  const handleModuleChange = (index, updatedModule) => {
    setPhase((prev) => {
      const updatedModules = [...prev.modules];
      updatedModules[index] = updatedModule;
      return { ...prev, modules: updatedModules };
    });
  };

  /* ===========================================================
     Render
  =========================================================== */
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900">
        <h2 className="text-xl font-semibold text-white">
          {phase?.title || "Untitled Phase"}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              prepareReviewData();
              setShowReview(true);
            }}
            disabled={saving}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-sm rounded text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-1 text-sm text-neutral-400 hover:text-white"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 text-white">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-400">{error}</p>
        ) : (
          <>
            <CourseFlowBuilder
              courseId={phase?.courseId || phase?._id}
              modules={phase?.modules || []}
              onChange={(modules) =>
                setPhase((prev) => ({ ...prev, modules }))
              }
              readOnly={false}
            />

            {phase?.modules?.map((mod, i) => {
              switch (mod.type) {
                case "quiz":
                  return (
                    <QuizEditor
                      key={mod._id || i}
                      module={mod}
                      onChange={(updated) => handleModuleChange(i, updated)}
                    />
                  );
                case "video":
                  return (
                    <VideoEditor
                      key={mod._id || i}
                      module={mod}
                      onChange={(updated) => handleModuleChange(i, updated)}
                    />
                  );
                case "pdf":
                  return (
                    <PdfEditor
                      key={mod._id || i}
                      module={mod}
                      onChange={(updated) => handleModuleChange(i, updated)}
                    />
                  );
                default:
                  return (
                    <div
                      key={i}
                      className="p-4 border border-neutral-800 rounded bg-neutral-900/60"
                    >
                      Unknown module type: {mod.type}
                    </div>
                  );
              }
            })}

            {!phase?.modules?.length && (
              <p className="italic text-neutral-500">
                No modules yet — add one in the phase structure.
              </p>
            )}
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-[580px] max-h-[80vh] overflow-y-auto space-y-6">
            <h3 className="text-lg font-semibold text-white">
              Review Before Publishing
            </h3>

            {/* FILES */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-2">
                Uploaded Files
              </h4>
              {reviewItems.files.length ? (
                <ul className="space-y-2 text-sm">
                  {reviewItems.files.map((f, i) => (
                    <li
                      key={i}
                      className={`flex justify-between items-center border-b border-neutral-800 pb-1 ${
                        f.inStaging ? "text-yellow-400" : "text-neutral-400"
                      }`}
                    >
                      <span>
                        {f.type.toUpperCase()} — {f.title}
                      </span>
                      {f.inStaging ? (
                        <span className="text-xs italic">in staging</span>
                      ) : (
                        <span className="text-xs text-green-400">ready</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-500 text-sm italic">
                  No files uploaded.
                </p>
              )}
            </div>

            {/* QUIZZES */}
            <div>
              <h4 className="text-sm font-semibold text-neutral-300 mb-2">
                Quizzes
              </h4>
              {reviewItems.quizzes.length ? (
                <ul className="space-y-2 text-sm">
                  {reviewItems.quizzes.map((q, i) => (
                    <li
                      key={i}
                      className={`flex justify-between border-b border-neutral-800 pb-1 ${
                        q.unsaved ? "text-yellow-400" : "text-neutral-400"
                      }`}
                    >
                      <span>
                        {q.title} — {q.questions} questions
                      </span>
                      {q.unsaved ? (
                        <span className="text-xs italic">unsaved</span>
                      ) : (
                        <span className="text-xs text-green-400">ready</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-neutral-500 text-sm italic">
                  No quizzes added.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => setShowReview(false)}
                className="px-4 py-1 text-sm text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-sm rounded text-white disabled:opacity-50"
              >
                {saving ? "Processing..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
