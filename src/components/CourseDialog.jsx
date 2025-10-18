import { useEffect, useState } from "react";
import { apiClient } from "../api/client.js";
import { ReactFlowProvider } from "reactflow";
import CourseFlowBuilder from "./CourseFlowBuilder";


export default function CourseDialog({ open, onClose, courseId, refresh }) {
  const [course, setCourse] = useState({ title: "", description: "", modules: [] });
  const [mode, setMode] = useState(courseId ? "view" : "create");
  const isEditable = mode === "edit" || mode === "create";

  useEffect(() => {
    if (courseId && open) {
      apiClient.get(`/api/courses/${courseId}`).then(setCourse);
    }
  }, [courseId, open]);

  const handleSave = async () => {
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-[90vw] h-[90vh] rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {mode === "create" ? "New Course" : course.title || "Course"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black text-lg px-2"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* Course Info */}
          <div className="grid gap-3 max-w-3xl">
            <input
              disabled={!isEditable}
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              placeholder="Course title"
              className="border rounded p-2 text-lg font-medium"
            />
            <textarea
              disabled={!isEditable}
              value={course.description}
              onChange={(e) =>
                setCourse({ ...course, description: e.target.value })
              }
              placeholder="Description"
              rows={3}
              className="border rounded p-2 resize-none"
            />
          </div>

          {/* Canvas */}
          <div className="border rounded-lg overflow-hidden w-full h-[700px] bg-neutral-50">
            <ReactFlowProvider>
            <CourseFlowBuilder
              modules={course.modules}
              onChange={(mods) => setCourse({ ...course, modules: mods })}
            />
            </ReactFlowProvider>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          {mode === "view" && (
            <button
              onClick={() => setMode("edit")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          {isEditable && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded border-neutral-400 hover:bg-neutral-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
