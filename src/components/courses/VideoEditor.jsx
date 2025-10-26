import { useState, useEffect } from "react";
import { uploadToAWS } from "@/utils/uploadToAWS.js";

/**
 * VideoEditor — handles upload and preview of video lessons.
 * Immediately uploads video to staging/<courseId>/ when selected.
 */
export default function VideoEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [file, setFile] = useState(module.payload?.file || null);

  // ✅ Prefer signedUrl when available (for reopened published phases)
  const [preview, setPreview] = useState(
    module.payload?.signedUrl ||
      module.payload?.uploadedUrl ||
      module.payload?.fileUrl ||
      module.payload?.preview ||
      null
  );

  const [uploading, setUploading] = useState(false);

  /* ===========================================================
     Sync local title/preview when module changes externally
  =========================================================== */
  useEffect(() => {
    setTitle(module.title || "");

    if (module.payload?.signedUrl) {
      setPreview(module.payload.signedUrl);
    } else if (module.payload?.uploadedUrl) {
      setPreview(module.payload.uploadedUrl);
    } else if (module.payload?.fileUrl) {
      setPreview(module.payload.fileUrl);
    } else if (module.payload?.preview) {
      setPreview(module.payload.preview);
    }
  }, [module]);

  /* ===========================================================
     Handle file selection → immediate upload to S3 staging
  =========================================================== */
  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const blob = URL.createObjectURL(f);
    setFile(f);
    setPreview(blob);

    // ✅ Immediately notify parent (for optimistic UI)
    onChange?.({
      ...module,
      title,
      payload: {
        ...module.payload,
        file: f,
        preview: blob,
      },
    });

    try {
      setUploading(true);

      const courseId = module.courseId || module._id || "temp";
      const uploadedUrl = await uploadToAWS(f, courseId, module.type || "video");

      // ✅ Update parent again with final S3 URL so autosave has correct value
      onChange?.({
        ...module,
        title,
        payload: {
          ...module.payload,
          uploadedUrl,          // used later by publishPhase
          fileUrl: uploadedUrl,  // optional alias for backend safety
          preview: uploadedUrl,
        },
      });

      console.log("✅ Video uploaded to staging:", uploadedUrl);
    } catch (err) {
      console.error("❌ Video upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
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
          setTitle(e.target.value);
          onChange?.({ ...module, title: e.target.value });
        }}
        placeholder="Video title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
      />

      {/* Upload field */}
      <div className="border border-neutral-700 p-4 rounded-lg text-center">
        <input
          type="file"
          accept="video/*"
          onChange={handleFile}
          className="hidden"
          id={`video-upload-${module._id || "temp"}`}
        />

        <label
          htmlFor={`video-upload-${module._id || "temp"}`}
          className={`cursor-pointer ${
            uploading ? "text-neutral-500" : "text-blue-400 hover:text-blue-300"
          }`}
        >
          {uploading
            ? "Uploading..."
            : file
            ? "Replace video"
            : "Upload video"}
        </label>

        {preview && (
          <video
            controls
            src={preview}
            className="mt-4 w-full rounded-lg border border-neutral-700"
          />
        )}
      </div>
    </div>
  );
}
