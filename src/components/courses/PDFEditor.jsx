import { useState, useEffect } from "react";
import { uploadToAWS } from "@/utils/uploadToAWS.js";

/**
 * PdfEditor — immediately uploads the selected PDF
 * to staging/<courseId>/ and provides instant preview.
 */
export default function PdfEditor({ module, onChange }) {
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
     Sync title/preview when module changes externally
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
     Handle file select → upload to S3 staging
  =========================================================== */
  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const blob = URL.createObjectURL(f);
    setFile(f);
    setPreview(blob);

    // ✅ Optimistic update for UI
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
      const uploadedUrl = await uploadToAWS(f, courseId, module.type || "pdf");

      // ✅ Update parent with final S3 URL for autosave
      onChange?.({
        ...module,
        title,
        payload: {
          ...module.payload,
          uploadedUrl,          // used later by publishPhase
          fileUrl: uploadedUrl,  // alias for backend safety
          preview: uploadedUrl,
        },
      });

      console.log("✅ PDF uploaded to staging:", uploadedUrl);
    } catch (err) {
      console.error("❌ PDF upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">📄 Lecture (PDF)</h2>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onChange?.({ ...module, title: e.target.value });
        }}
        placeholder="PDF title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
      />

      {/* Upload field */}
      <div className="border border-neutral-700 p-4 rounded-lg text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="hidden"
          id={`pdf-upload-${module._id || "temp"}`}
        />

        <label
          htmlFor={`pdf-upload-${module._id || "temp"}`}
          className={`cursor-pointer ${
            uploading
              ? "text-neutral-500"
              : "text-green-400 hover:text-green-300"
          }`}
        >
          {uploading ? "Uploading..." : file ? "Replace PDF" : "Upload PDF"}
        </label>

        {/* PDF Preview */}
        {preview && (
          <iframe
            src={preview}
            className="mt-4 w-full h-80 rounded-lg border border-neutral-700"
            title="PDF Preview"
          />
        )}
      </div>
    </div>
  );
}
