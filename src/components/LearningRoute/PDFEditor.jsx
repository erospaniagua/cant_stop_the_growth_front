import { useState, useEffect } from "react";
import { uploadToAWS } from "@/utils/uploadToAWS.js";

/**
 * PdfEditor — uploads the selected PDF to staging/<courseId>/
 * Shows progress bar + disables closing while uploading.
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
  const [progress, setProgress] = useState(0);

  /* ===========================================================
     Sync title/preview when module changes externally
  =========================================================== */
  useEffect(() => {
    setTitle(module.title || "");

    if (module.payload?.signedUrl) setPreview(module.payload.signedUrl);
    else if (module.payload?.uploadedUrl) setPreview(module.payload.uploadedUrl);
    else if (module.payload?.fileUrl) setPreview(module.payload.fileUrl);
    else if (module.payload?.preview) setPreview(module.payload.preview);
  }, [module]);

  /* ===========================================================
     Handle file select → upload to S3 with progress tracking
  =========================================================== */
  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const blob = URL.createObjectURL(f);
    setFile(f);
    setPreview(blob);

    // ✅ Optimistic update
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
      setProgress(0);

      const courseId = module.courseId || module._id || "temp";

      // 1️⃣ Request presigned URL
      const { uploadUrl, fileUrl } = await uploadToAWS.getPresignedUrl(
        f,
        courseId,
        module.type || "pdf"
      );

      // 2️⃣ Upload to S3 with progress tracking
      await uploadWithProgress(uploadUrl, f, setProgress);

      // 3️⃣ Notify parent
      onChange?.({
        ...module,
        title,
        payload: {
          ...module.payload,
          uploadedUrl: fileUrl,
          fileUrl,
          preview: fileUrl,
        },
      });

      console.log("✅ PDF uploaded:", fileUrl);
    } catch (err) {
      console.error("❌ PDF upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  /* ===========================================================
     Helper: upload with progress using XMLHttpRequest
  =========================================================== */
  const uploadWithProgress = (url, file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error("S3 upload failed"));
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(file);
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">📄 Lecture (PDF)</h2>

      {/* Title input */}
      <input
        type="text"
        value={title}
        onChange={(e) => {
          const newTitle = e.target.value;
          setTitle(newTitle);
          onChange?.({ ...module, title: newTitle });
        }}
        placeholder="PDF title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
        disabled={uploading}
      />

      {/* Upload field */}
      <div className="border border-neutral-700 p-4 rounded-lg text-center relative">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="hidden"
          id={`pdf-upload-${module._id || "temp"}`}
          disabled={uploading}
        />

        <label
          htmlFor={`pdf-upload-${module._id || "temp"}`}
          className={`cursor-pointer ${
            uploading ? "text-neutral-500" : "text-green-400 hover:text-green-300"
          }`}
        >
          {uploading
            ? "Uploading..."
            : file
            ? "Replace PDF"
            : "Upload PDF"}
        </label>

        {/* Warning while uploading */}
        {uploading && (
          <p className="mt-3 text-yellow-400 text-sm font-medium">
            ⚠️ Please don’t close or refresh this window while uploading.
          </p>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-green-500 h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}

        {/* PDF Preview */}
        {preview && !uploading && (
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

/* ===========================================================
   Patch: make uploadToAWS.getPresignedUrl work directly
   (add this helper inside uploadToAWS.js if not yet)
=========================================================== */
// Example usage reference:
// uploadToAWS.getPresignedUrl = async (file, courseId, type) => {
//   return await apiClient.post("/api/presign", {
//     filename: file.name,
//     folder: `staging/${courseId}`,
//     type,
//   });
// };
