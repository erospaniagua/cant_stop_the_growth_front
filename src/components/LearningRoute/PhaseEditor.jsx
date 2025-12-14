import { useEffect, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { apiClient } from "@/api/client.js";
import CourseFlowBuilder from "@/components/LearningRoute/CourseFlowBuilder";
import QuizEditor from "@/components/LearningRoute/QuizEditor";
import VideoEditor from "@/components/LearningRoute/VideoEditor";
import PdfEditor from "@/components/LearningRoute/PdfEditor"

export default function PhaseEditor({ open, onClose, routeId, phaseId, refresh }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
      .get(`/api/learning-tracks/${routeId}/phases/${phaseId}`)
      .then((data) => setPhase(data))
      .catch((err) => {
        console.error("❌ Error loading phase:", err);
        setError("Failed to load phase data.");
      })
      .finally(() => setLoading(false));
  }, [open, routeId, phaseId]);

  /* ===========================================================
     Prepare review modal data (nested modules → lessons)
  =========================================================== */
  const prepareReviewData = useCallback(() => {
    if (!phase?.modules?.length) return setReviewItems({ files: [], quizzes: [] });

    const files = [];
    const quizzes = [];

    for (const mod of phase.modules) {
      for (const lesson of mod.lessons || []) {
        if (["video", "pdf"].includes(lesson.type)) {
          files.push({
            type: lesson.type,
            title: lesson.title || "Untitled Lesson",
            url:
              lesson.payload?.uploadedUrl ||
              lesson.payload?.fileUrl ||
              lesson.payload?.preview ||
              null,
            inStaging:
              (lesson.payload?.uploadedUrl || lesson.payload?.fileUrl || "").includes(
                "/staging/"
              ),
          });
        }
        if (lesson.type === "quiz") {
          quizzes.push({
            title: lesson.title || "Untitled Quiz",
            unsaved: !lesson.payload?.questions?.length,
            questions: lesson.payload?.questions?.length || 0,
          });
        }
      }
    }

    setReviewItems({ files, quizzes });
  }, [phase]);

  /* ===========================================================
     Manual draft save
  =========================================================== */
  const handleSaveDraft = async () => {
    if (!phase?._id) return;
    setSaving(true);
    try {
      await apiClient.patch(`/api/learning-tracks/${routeId}/phases/${phaseId}`, phase);
      alert("✅ Draft saved!");
      refresh?.();
    } catch (err) {
      console.error("❌ Error saving draft:", err);
      alert("❌ Could not save draft");
    } finally {
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
      await apiClient.patch(
        `/api/learning-tracks/${routeId}/phases/${phaseId}/publish`,
        phase
      );
      alert("✅ Phase published successfully!");
      setShowReview(false);
      refresh?.();
      onClose?.();
    } catch (err) {
      console.error("❌ Error publishing phase:", err);
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
     Safe modules update handler
  =========================================================== */
  const handleModulesChange = useCallback((modules) => {
    setPhase((prev) => ({ ...prev, modules }));
  }, []);

  /* ===========================================================
     Update a single module (legacy editors support)
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

  const bgMain = isDark ? "bg-neutral-950 text-white" : "bg-white text-neutral-900";
  const bgHeader = isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-300";
  const bgPanel = isDark ? "bg-neutral-900/60 border-neutral-800" : "bg-neutral-50 border-neutral-300";

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${bgMain}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b ${bgHeader}`}>
        <h2 className="text-xl font-semibold truncate">
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
            className="px-3 py-1 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto space-y-6 ${bgMain}`}>
        {loading ? (
          <p className="text-neutral-500">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <CourseFlowBuilder
              courseId={phase?.courseId || phase?._id}
              modules={phase?.modules || []}
              onChange={handleModulesChange}
              readOnly={false}
            />

            {/* Legacy inline editors (optional) */}
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
                  return null;
              }
            })}
          </>
        )}
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className={`rounded-2xl p-6 w-[580px] max-h-[80vh] overflow-y-auto space-y-6 border ${
              isDark
                ? "bg-neutral-900 border-neutral-800 text-white"
                : "bg-white border-neutral-300 text-neutral-900"
            }`}
          >
            <h3 className="text-lg font-semibold">Review Before Publishing</h3>

            {/* FILES */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Uploaded Files</h4>
              {reviewItems.files.length ? (
                <ul className="space-y-2 text-sm">
                  {reviewItems.files.map((f, i) => (
                    <li
                      key={i}
                      className={`flex justify-between items-center border-b pb-1 ${
                        isDark ? "border-neutral-800" : "border-neutral-300"
                      } ${f.inStaging ? "text-yellow-500" : "text-neutral-500"}`}
                    >
                      <span>
                        {f.type.toUpperCase()} — {f.title}
                      </span>
                      <span
                        className={`text-xs ${
                          f.inStaging
                            ? "italic text-yellow-400"
                            : "text-green-500"
                        }`}
                      >
                        {f.inStaging ? "in staging" : "ready"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-neutral-400">
                  No files uploaded.
                </p>
              )}
            </div>

            {/* QUIZZES */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Quizzes</h4>
              {reviewItems.quizzes.length ? (
                <ul className="space-y-2 text-sm">
                  {reviewItems.quizzes.map((q, i) => (
                    <li
                      key={i}
                      className={`flex justify-between border-b pb-1 ${
                        isDark ? "border-neutral-800" : "border-neutral-300"
                      } ${q.unsaved ? "text-yellow-500" : "text-neutral-500"}`}
                    >
                      <span>
                        {q.title} — {q.questions} questions
                      </span>
                      <span
                        className={`text-xs ${
                          q.unsaved
                            ? "italic text-yellow-400"
                            : "text-green-500"
                        }`}
                      >
                        {q.unsaved ? "unsaved" : "ready"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-neutral-400">
                  No quizzes added.
                </p>
              )}
            </div>

            <div
              className={`flex justify-end gap-3 pt-4 border-t ${
                isDark ? "border-neutral-800" : "border-neutral-300"
              }`}
            >
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
