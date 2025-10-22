import { useState, useEffect, useCallback } from "react";

/**
 * useCourseStaging
 * ------------------
 * Keeps the current course modules and assets persistent while editing.
 * Data stays available even if you close node dialogs or temporarily leave the editor.
 */
export function useCourseStaging(courseId) {
  const key = courseId ? `staging_${courseId}` : "staging_new";
  const [staging, setStaging] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : { modules: [] };
    } catch {
      return { modules: [] };
    }
  });

  // 🔄 Persist every change
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(staging));
    } catch (err) {
      console.warn("Failed to persist staging:", err);
    }
  }, [staging, key]);

  /* -------------------- Update helpers -------------------- */

  // Replace a specific module by index
  const updateModule = useCallback((index, updates) => {
    setStaging((prev) => {
      const newModules = [...(prev.modules || [])];
      if (index < 0 || index >= newModules.length) return prev;

      const old = newModules[index];

      // Preserve existing preview URLs if file changes
      let newPayload = { ...old.payload, ...updates.payload };
      if (updates.payload?.file) {
        newPayload.preview =
          updates.payload.preview ||
          URL.createObjectURL(updates.payload.file);
      }

      newModules[index] = { ...old, ...updates, payload: newPayload };
      return { ...prev, modules: newModules };
    });
  }, []);

  // Completely clear local staging (e.g., after publishing)
  const clearStaging = useCallback(() => {
    setStaging({ modules: [] });
    localStorage.removeItem(key);
  }, [key]);

  return {
    staging,
    setStaging,
    updateModule,
    clearStaging,
  };
}
