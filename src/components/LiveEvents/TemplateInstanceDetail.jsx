import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";

export default function TemplateInstanceDetail({ instanceId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);
  const [editingDates, setEditingDates] = useState({});

  const [coaches, setCoaches] = useState([]);
  const [coachId, setCoachId] = useState("");
  const [zoomUrl, setZoomUrl] = useState("");

  const [savingInstanceMeta, setSavingInstanceMeta] = useState(false);
  const [savingSession, setSavingSession] = useState(null);

  /* ============================================================
     Load data
  ============================================================ */
  useEffect(() => {
    loadInstance();
    loadCoaches();
  }, [instanceId]);


  async function updateEventDuration(eventId, durationMinutes) {
  try {
    await apiClient.patch(
      `/api/calendar-events/${eventId}/duration`,
      { durationMinutes }
    );
    await loadInstance(); // refresh projection
  } catch (err) {
    alert(err.message || "Error updating duration");
  }
}

  async function loadInstance() {
    try {
      setLoading(true);
      const data = await apiClient.get(
        `/api/template-instances/${instanceId}`
      );
      setInstance(data);
      setCoachId(data.coachId || "");
      setZoomUrl(data.zoomUrl || "");
    } catch (err) {
      setError(err.message || "Error loading template instance");
    } finally {
      setLoading(false);
    }
  }

  async function loadCoaches() {
    try {
      const all = await apiClient.get("/api/users");
      const filtered = all.filter(u =>
        ["coach", "teacher", "admin"].includes(u.role)
      );
      setCoaches(filtered);
    } catch (err) {
      console.error("Error loading coaches:", err);
    }
  }

  /* ============================================================
     Helpers
  ============================================================ */
  function isoToLocalInputValue(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  /* ============================================================
     Save instance-level fields
  ============================================================ */
  async function saveInstanceMeta() {
    try {
      setSavingInstanceMeta(true);

      await apiClient.patch(
        `/api/template-instances/${instanceId}`,
        {
          coachId: coachId || null,
          zoomUrl: zoomUrl || null
        }
      );

      await loadInstance();
    } catch (err) {
      alert(err.message || "Error saving instance");
    } finally {
      setSavingInstanceMeta(false);
    }
  }

  /* ============================================================
     Update session
  ============================================================ */
  async function updateSession(sessionId, patch) {
    try {
      setSavingSession(sessionId);

      await apiClient.patch(
        `/api/template-instances/${instanceId}/sessions/${sessionId}`,
        patch
      );

      await loadInstance();
    } catch (err) {
      alert(err.message || "Error updating session");
    } finally {
      setSavingSession(null);
    }
  }

  /* ============================================================
     Render guards
  ============================================================ */
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
          />
        </div>

        <div className="text-sm text-gray-600 mt-1">
          {progress.completed} completed •{" "}
          {progress.scheduled} scheduled •{" "}
          {progress.pending} pending
        </div>
      </div>

      {/* Coach & Zoom */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold mb-1">Coach</label>
          <select
            className="w-full p-2 border rounded"
            value={coachId}
            onChange={(e) => setCoachId(e.target.value)}
          >
            <option value="">No coach</option>
            {coaches.map(c => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Zoom link
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={zoomUrl}
            onChange={(e) => setZoomUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </div>
      </div>

      <button
        onClick={saveInstanceMeta}
        disabled={savingInstanceMeta}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {savingInstanceMeta ? "Saving…" : "Save Coach & Zoom"}
      </button>

      {/* Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Sessions</h2>

        {sessions.map(s => (
          <div
            key={s._id}
            className="p-4 border rounded space-y-2"
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

            {/* Date */}
            <input
  type="datetime-local"
  className="w-full p-2 border rounded"
  value={
    editingDates[s._id] ??
    isoToLocalInputValue(s.assignedDate)
  }
  onChange={(e) => {
    const value = e.target.value;
    setEditingDates(prev => ({
      ...prev,
      [s._id]: value
    }));
  }}
  onBlur={async () => {
    const value = editingDates[s._id];

    if (!value) return;

    await updateSession(s._id, {
      assignedDate: new Date(value).toISOString()
    });

    setEditingDates(prev => {
      const copy = { ...prev };
      delete copy[s._id];
      return copy;
    });
  }}
/>


            {/* Duration */}
{s.calendarEventId ? (
  <select
    className="w-full p-2 border rounded"
    value={s.durationMinutes}
    onChange={(e) =>
      updateEventDuration(
        s.calendarEventId,
        Number(e.target.value)
      )
    }
  >
    <option value={30}>30 minutes</option>
    <option value={45}>45 minutes</option>
    <option value={60}>1 hour</option>
    <option value={90}>1.5 hours</option>
    <option value={120}>2 hours</option>
  </select>
) : (
  <div className="text-sm text-gray-500">
    Set a date to enable duration
  </div>
)}


            {savingSession === s._id && (
              <div className="text-sm text-blue-600">
                Saving…
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
