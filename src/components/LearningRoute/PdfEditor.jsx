import { useState, useEffect } from "react";
import { uploadToAWS } from "@/utils/uploadToAWS.js";
import { v4 as uuidv4 } from "uuid";

export default function PdfEditor({ module, onChange }) {
  const lessonId = module.payload?.lessonId || uuidv4();

  const [title, setTitle] = useState(module.title || "");
  const [file, setFile] = useState(module.payload?.file || null);

  const [preview, setPreview] = useState(
    module.payload?.preview ||
      module.payload?.uploadedUrl ||
      module.payload?.fileUrl ||
      null
  );

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTitle(module.title || "");

    if (module.payload?.fileUrl) setPreview(module.payload.fileUrl);
    if (module.payload?.uploadedUrl) setPreview(module.payload.uploadedUrl);
    if (module.payload?.preview) setPreview(module.payload.preview);
  }, [module]);

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const blob = URL.createObjectURL(f);
    setFile(f);
    setPreview(blob);

    // Immediate optimistic update
    onChange?.({
      ...module,
      title,
      payload: {
        ...module.payload,
        lessonId,
        file: f,
        preview: blob,
      },
    });

    try {
      setUploading(true);
      setProgress(0);

      const courseId = module.courseId || module._id || "temp";

      // 1) Request presigned URL
      const { uploadUrl, fileUrl } = await uploadToAWS.getPresignedUrl(
        f,
        courseId,
        "pdf"
      );

      // 2) Upload with progress
      await uploadWithProgress(uploadUrl, f, setProgress);

      // 3) Finalize
      onChange?.({
        ...module,
        title,
        payload: {
          ...module.payload,
          lessonId,
          uploadedUrl: fileUrl,
          fileUrl,
          preview: fileUrl,
        },
      });
    } catch (err) {
      console.error("❌ PDF upload failed:", err);
      alert("Upload failed. Try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

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

      xhr.onerror = () => reject(new Error("Network Error"));
      xhr.send(file);
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">📄 Lecture (PDF)</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => {
          const newTitle = e.target.value;
          setTitle(newTitle);

          onChange?.({
            ...module,
            title: newTitle,
            payload: {
              ...module.payload,
              lessonId,
            },
          });
        }}
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
        placeholder="PDF title"
        disabled={uploading}
      />

      <div className="border border-neutral-700 p-4 rounded-lg text-center relative">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="hidden"
          id={`pdf-upload-${lessonId}`}
          disabled={uploading}
        />

        <label
          htmlFor={`pdf-upload-${lessonId}`}
          className={`cursor-pointer ${
            uploading ? "text-neutral-500" : "text-green-400 hover:text-green-300"
          }`}
        >
          {uploading ? "Uploading..." : file ? "Replace PDF" : "Upload PDF"}
        </label>

        {uploading && (
          <>
            <p className="mt-3 text-yellow-400 text-sm">
              ⚠️ Don't close the window.
            </p>

            <div className="w-full bg-neutral-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-green-500 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        )}

        {!uploading && preview && (
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
