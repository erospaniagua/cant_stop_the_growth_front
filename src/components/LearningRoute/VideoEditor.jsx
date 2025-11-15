import { useState, useEffect } from "react";
import { uploadToAWS } from "@/utils/uploadToAWS.js";

/**
 * VideoEditor — safe version for large uploads
 * ---------------------------------------------------
 * ✅ disables close & upload buttons while uploading
 * ✅ shows progress bar (visual feedback)
 * ✅ prevents window/tab close mid-upload
 */
export default function VideoEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [file, setFile] = useState(module.payload?.file || null);
  const [preview, setPreview] = useState(
    module.payload?.signedUrl ||
      module.payload?.uploadedUrl ||
      module.payload?.fileUrl ||
      module.payload?.preview ||
      null
  );

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /* ===========================================================
     ⚠️ Prevent window close during upload
  =========================================================== */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = ""; // Required for Chrome
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [uploading]);

  /* ===========================================================
     Sync external module data (when reopening editor)
  =========================================================== */
  useEffect(() => {
    setTitle(module.title || "");
    const p =
      module.payload?.signedUrl ||
      module.payload?.uploadedUrl ||
      module.payload?.fileUrl ||
      module.payload?.preview ||
      null;
    setPreview(p);
  }, [module]);

  /* ===========================================================
     Handle File Upload
  =========================================================== */
  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const blob = URL.createObjectURL(f);
    setFile(f);
    setPreview(blob);

    // Optimistic update
    onChange?.({
      ...module,
      title,
      payload: { ...module.payload, file: f, preview: blob },
    });

    try {
      setUploading(true);
      setProgress(0);

      const courseId = module.courseId || module._id || "temp";
      const uploadedUrl = await uploadToAWS(f, courseId, module.type || "video", (p) =>
        setProgress(p)
      );

      // ✅ Update parent once final URL exists
      onChange?.({
        ...module,
        title,
        payload: {
          ...module.payload,
          uploadedUrl,
          fileUrl: uploadedUrl,
          preview: uploadedUrl,
        },
      });

      console.log("✅ Video uploaded to staging:", uploadedUrl);
    } catch (err) {
      console.error("❌ Video upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🎥 Video Lesson</h2>

      {/* Title field */}
<input
  type="text"
  value={title}
  onChange={(e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    // ✅ Send a clean new object up to parent
    onChange?.({
      ...module,
      title: newTitle,
      payload: { ...module.payload },
    });
  }}
  placeholder="Video title"
  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
  disabled={uploading}
/>


      {/* Upload field */}
      <div className="border border-neutral-700 p-4 rounded-lg text-center relative">
        <input
          type="file"
          accept="video/*"
          onChange={handleFile}
          className="hidden"
          id={`video-upload-${module._id || "temp"}`}
          disabled={uploading}
        />

        <label
          htmlFor={`video-upload-${module._id || "temp"}`}
          className={`cursor-pointer text-sm font-medium ${
            uploading
              ? "text-neutral-500 pointer-events-none"
              : "text-blue-400 hover:text-blue-300"
          }`}
        >
          {uploading
            ? "Uploading..."
            : file
            ? "Replace video"
            : "Upload video"}
        </label>

        {/* Progress bar */}
        {uploading && (
          <div className="w-full bg-neutral-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Preview */}
        {preview && (
          <video
            controls
            src={preview}
            className="mt-4 w-full rounded-lg border border-neutral-700"
          />
        )}
      </div>

      {uploading && (
        <p className="text-xs text-yellow-400 italic">
          ⚠️ Please don’t close this window until upload completes.
        </p>
      )}
    </div>
  );
}
