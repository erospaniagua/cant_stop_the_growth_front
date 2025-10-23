// src/hooks/useAutoSaveCourse.js
import { useEffect, useRef } from "react";
import { apiClient } from "@/api/client.js";

export function useAutoSaveCourse(courseId, staging) {
  const timer = useRef(null);

  useEffect(() => {
    if (!courseId || !staging) return;

    // 🕐 Clear existing timer to debounce
    if (timer.current) clearTimeout(timer.current);

    // 💾 Auto-save after 2 seconds of inactivity
    timer.current = setTimeout(async () => {
      try {
        await apiClient.patch(`/api/courses/${courseId}`, {
          title: staging.title,
          description: staging.description,
          modules: staging.modules,
          finished: false,
        });
        console.log("💾 Auto-saved course draft:", courseId);
      } catch (err) {
        console.error("❌ Auto-save failed:", err);
      }
    }, 2000);

    // 🧹 Cleanup if component unmounts
    return () => clearTimeout(timer.current);
  }, [courseId, staging]);
}
