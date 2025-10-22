import { useState, useEffect } from "react";

export default function PDFEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "");
  const [file, setFile] = useState(module.payload?.file || null);
  const [preview, setPreview] = useState(module.payload?.preview || null);

  // 🧩 Persist preview if it exists
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
      <h2 className="text-lg font-semibold">📄 Lecture (PDF)</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          onChange?.({ title: e.target.value });
        }}
        placeholder="PDF title"
        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white text-sm"
      />

      <div className="border border-neutral-700 p-4 rounded-lg text-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="cursor-pointer text-green-400 hover:text-green-300"
        >
          {file ? "Replace PDF" : "Upload PDF"}
        </label>

        {preview && (
          <iframe
            src={preview}
            className="mt-4 w-full h-80 rounded-lg border border-neutral-700"
          />
        )}
      </div>
    </div>
  );
}
