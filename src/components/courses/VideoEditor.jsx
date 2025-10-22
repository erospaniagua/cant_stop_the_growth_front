import { useState, useEffect } from "react";

export default function VideoEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [file, setFile] = useState(module.payload?.file || null);
  const [preview, setPreview] = useState(module.payload?.preview || null);

  // 🧩 Load existing preview (if persisted)
  useEffect(() => {
    if (module.payload?.preview) {
      setPreview(module.payload.preview);
    } else if (module.payload?.uploadedUrl) {
      setPreview(module.payload.uploadedUrl);
    }
  }, [module]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const blob = URL.createObjectURL(f);
    setFile(f);
    setPreview(blob);
    onChange?.({
      title,
      payload: { file: f, preview: blob },
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🎥 Video Lesson</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onChange?.({ title: e.target.value });
        }}
        placeholder="Video title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
      />

      <div className="border border-neutral-700 p-4 rounded-lg text-center">
        <input
          type="file"
          accept="video/*"
          onChange={handleFile}
          className="hidden"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="cursor-pointer text-blue-400 hover:text-blue-300"
        >
          {file ? "Replace video" : "Upload video"}
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
