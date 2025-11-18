import { apiClient } from "@/api/client.js";

/**
 * 🔹 Get a presigned URL from backend
 */
export async function getPresignedUrl(file, courseId, type) {
  const { uploadUrl, fileUrl } = await apiClient.post("/api/presign", {
    filename: file.name,
    folder: `staging/${courseId}`,
    type,
  });
  return { uploadUrl, fileUrl };
}

/**
 * 🔹 Upload a file with progress tracking
 * Works with both video & PDF editors.
 */
export async function uploadWithProgress(uploadUrl, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

/**
 * 🔹 Main uploader (simplified, backward-compatible)
 * If `onProgress` is provided, it uses the progress version.
 */
export async function uploadToAWS(file, courseId, type, onProgress) {
  try {
    const { uploadUrl, fileUrl } = await getPresignedUrl(file, courseId, type);

    if (typeof onProgress === "function") {
      await uploadWithProgress(uploadUrl, file, onProgress);
    } else {
      const res = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!res.ok) throw new Error("Upload failed");
    }

    console.log("✅ Uploaded to S3:", fileUrl);
    return fileUrl;
  } catch (err) {
    console.error("❌ uploadToAWS failed:", err);
    throw err;
  }
}

/**
 * Attach helpers for convenience in editors
 */
uploadToAWS.getPresignedUrl = getPresignedUrl;
uploadToAWS.uploadWithProgress = uploadWithProgress;
