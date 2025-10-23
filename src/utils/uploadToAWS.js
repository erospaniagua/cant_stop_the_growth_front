import { apiClient } from "@/api/client.js";

/**
 * Upload a file to S3 via presigned URL.
 * The backend generates a presigned URL in the correct folder:
 *    staging/{courseId}/filename.ext
 *
 * @param {File} file - The file to upload
 * @param {string} courseId - The course ID (used for folder path)
 * @param {string} type - Module type (video/pdf/quiz)
 * @returns {Promise<string>} - The final public file URL on S3
 */
export async function uploadToAWS(file, courseId, type) {
  try {
    // 1️⃣ Ask backend for a presigned upload URL
    const { uploadUrl, fileUrl } = await apiClient.post("/api/presign", {
      filename: file.name,
      folder: `staging/${courseId}`,
      type,
    });

    // 2️⃣ Upload directly to S3 using the presigned URL
    const res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });

    if (!res.ok) throw new Error("Upload to S3 failed");
    console.log("✅ Uploaded to S3:", fileUrl);

    // 3️⃣ Return the public file URL to store in Mongo
    return fileUrl;
  } catch (err) {
    console.error("❌ uploadToAWS failed:", err);
    throw err;
  }
}
