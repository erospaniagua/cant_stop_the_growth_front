import { useState } from "react";

export default function CertEditor({ module, onChange }) {
  const [title, setTitle] = useState(module.title || "Certificate");
  const [description, setDescription] = useState(
    module.payload?.description || ""
  );
  const [file, setFile] = useState(module.payload?.file || null);
  const [previewUrl, setPreviewUrl] = useState(module.payload?.previewUrl || null);

  // handle file input
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFile(f);
    setPreviewUrl(url);
    onChange?.({
      title,
      description,
      file,
      previewUrl: url,
    });
  };

  // handle save on text change
  const handleSave = () => {
    onChange?.({
      title,
      description,
      file,
      previewUrl,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Certificate Module</h2>
      <p className="text-neutral-400 text-sm">
        Define the certificate layout or base file used when the student completes the course.
      </p>

      <div className="grid gap-3 mt-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Certificate Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-white"
            placeholder="Completion Certificate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleSave}
            placeholder="Example: Awarded upon successful completion of all course modules."
            className="w-full bg-neutral-800 border border-neutral-700 rounded px-3 py-2 text-sm text-neutral-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-1">
            Upload Certificate Template (optional)
          </label>
          <div className="border-2 border-dashed border-neutral-700 rounded-lg p-6 text-center hover:border-neutral-500 transition cursor-pointer relative">
            <input
              type="file"
              accept="image/*,.pdf"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            {previewUrl ? (
              <div className="flex flex-col items-center gap-2">
                {file?.type?.includes("image") ? (
                  <img
                    src={previewUrl}
                    alt="Certificate Preview"
                    className="max-h-48 object-contain rounded"
                  />
                ) : (
                  <div className="text-neutral-300 text-sm">
                    PDF file: {file.name}
                  </div>
                )}
                <button
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                    onChange?.({ title, description, file: null, previewUrl: null });
                  }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">
                Drag & drop or click to upload
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
