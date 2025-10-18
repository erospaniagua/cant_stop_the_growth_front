import { useEffect, useState, useMemo } from "react";
import { apiClient } from "../api/client.js";
import CourseDialog from "../components/CourseDialog.jsx";
import CourseEditor from "@/components/CourseEditor.jsx";


export default function CoursesAdminPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get("/api/courses");
      setCourses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const table = useMemo(
    () => (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Title</th>
            <th className="py-2">Modules</th>
            <th className="py-2">Updated</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c._id} className="border-b hover:bg-neutral-100">
              <td className="py-2 font-medium">{c.title}</td>
              <td className="py-2">{c.modules?.length || 0}</td>
              <td className="py-2">
                {new Date(c.updatedAt).toLocaleDateString()}
              </td>
              <td className="py-2">
                <button
                  onClick={() => {
                    setSelectedCourse(c._id);
                    setDialogOpen(true);
                  }}
                  className="text-blue-600 underline"
                >
                  Open
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
    [courses]
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={() => {
            setSelectedCourse(null);
            setDialogOpen(true);
          }}
          className="px-3 py-2 bg-blue-600 text-white rounded"
        >
          + New Course
        </button>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        table
      )}

      {dialogOpen && (
        
        <CourseEditor
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          courseId={selectedCourse}
          refresh={fetchCourses}
        />
        
      )}
    </div>
  );
}
