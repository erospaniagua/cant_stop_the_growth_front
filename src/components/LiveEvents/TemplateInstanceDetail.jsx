import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";

export default function TemplateInstanceDetail({ instanceId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);

  const [savingSession, setSavingSession] = useState(null);

  useEffect(() => {
    loadInstance();
  }, [instanceId]);

  async function loadInstance() {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/template-instances/${instanceId}`);
      setInstance(data);
    } catch (err) {
      setError(err.message || "Error loading template instance");
    } finally {
      setLoading(false);
    }
  }

  async function updateSessionDate(sessionId, newDate) {
    try {
      setSavingSession(sessionId);

      await apiClient.patch(
        `/api/template-instances/${instanceId}/sessions/${sessionId}`,
        { assignedDate: newDate }
      );

      await loadInstance();
    } catch (err) {
      alert(err.message || "Error updating date");
    } finally {
      setSavingSession(null);
    }
  }

  if (loading) return <div>Loading instance…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!instance) return null;

  const { title, description, sessions, progress } = instance;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{title}</h1>

        <button
          onClick={onBack}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
        >
          Back
        </button>
      </div>

      {/* Description */}
      {description && (
        <p className="text-gray-700">{description}</p>
      )}

      {/* Progress */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Progress</h2>

        <div className="w-full bg-gray-200 h-4 rounded">
          <div
            className="h-4 bg-green-600 rounded"
            style={{
              width:
                (progress.completed / sessions.length) * 100 + "%"
            }}
          ></div>
        </div>

        <div className="text-sm text-gray-600 mt-1">
          {progress.completed} completed • {progress.scheduled} scheduled • {progress.pending} pending
        </div>
      </div>

      {/* Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessions</h2>

        {sessions.map((s) => (
          <div
            key={s._id}
            className="p-4 border rounded black space-y-2"
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold">{s.name}</div>

              <span
                className={
                  s.status === "completed"
                    ? "text-green-700 font-semibold"
                    : s.status === "scheduled"
                    ? "text-yellow-700 font-semibold"
                    : "text-gray-600"
                }
              >
                {s.status}
              </span>
            </div>

            <input
              type="datetime-local"
              className="w-full p-2 border rounded"
              value={s.assignedDate ? s.assignedDate.slice(0, 16) : ""}
              onChange={(e) =>
                updateSessionDate(s._id, e.target.value)
              }
              disabled={savingSession === s._id}
            />

            {savingSession === s._id && (
              <div className="text-sm text-blue-600">Saving…</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
