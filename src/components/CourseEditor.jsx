import { useEffect, useState } from "react";
import { apiClient } from "../api/client.js";
import CourseFlowBuilder from "./CourseFlowBuilder";

export default function CourseEditor({ open, onClose, courseId, refresh }) {
  const [course, setCourse] = useState({ title: "Untitled Course", description: "", modules: [] });
  const [mode, setMode] = useState(courseId ? "view" : "create");
  const [showDetails, setShowDetails] = useState(false);
  const isEditable = mode === "edit" || mode === "create";

  // Load course when editing
  useEffect(() => {
    if (courseId && open) {
      apiClient.get(`/api/courses/${courseId}`).then(setCourse);
    }
  }, [courseId, open]);

  const handleSave = async () => {
    if (!course.title.trim()) return alert("Please add a course name");
    if (mode === "create") {
      await apiClient.post("/api/courses", course);
    } else {
      await apiClient.patch(`/api/courses/${courseId}`, course);
    }
    refresh?.();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-neutral-950 flex flex-col text-white z-50">
      {/* 🔹 Breadcrumb Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-neutral-900 border-b border-neutral-800 text-sm">
        {/* Left side: Breadcrumb for name + details */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
          >
            <span className="truncate max-w-[200px]">
              {course.title || "Untitled Course"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 transition-transform ${
                showDetails ? "rotate-180" : ""
              }`}
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {showDetails && (
            <div className="absolute top-14 left-6 bg-neutral-900 border border-neutral-800 rounded-lg p-4 shadow-xl w-[300px] z-50">
              <input
                disabled={!isEditable}
                value={course.title}
                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                placeholder="Course name"
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-white text-sm mb-2"
              />
              <textarea
                disabled={!isEditable}
                value={course.description}
                onChange={(e) =>
                  setCourse({ ...course, description: e.target.value })
                }
                placeholder="Description"
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-neutral-300 resize-none"
              />
            </div>
          )}
        </div>

        {/* Right side: Save / Close breadcrumbs */}
        <div className="flex items-center gap-4">
          {mode === "view" && (
            <button
              onClick={() => setMode("edit")}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Edit
            </button>
          )}
          {isEditable && (
            <button
              onClick={handleSave}
              className="text-green-400 hover:text-green-300 font-medium"
            >
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* 🧩 Full Canvas */}
      <div className="flex-1 relative">
        <CourseFlowBuilder
          modules={course.modules}
          onChange={(mods) => setCourse({ ...course, modules: mods })}
          readOnly={!isEditable}
        />
      </div>
    </div>
  );
}
