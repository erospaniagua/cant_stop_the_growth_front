import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";
import PreJoinModal from "./PreJoinModal";

export default function EventDetailsModal({
  eventId,
  onClose,
  onUpdated,
  onEdit,
}) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [openPreJoin, setOpenPreJoin] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  const { user: currentUser } = useUser();

  const roleIcon = {
    coach: "👨‍🏫",
    student: "🎓",
    admin: "🧰",
    company: "🏢",
    "team-manager": "🛠️",
  };

  const canManage =
    ["admin", "coach"].includes(currentUser?.role) &&
    event?.source === "manual";

  useEffect(() => {
    if (!eventId) return;
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    try {
      setLoading(true);
      const data = await apiClient.get(`/api/calendar-events/${eventId}`);
      setEvent(data);
    } catch (err) {
      setError(err.message || "Error loading event");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this event? This cannot be undone.")) return;

    try {
      setDeleting(true);
      await apiClient.del(`/api/calendar-events/${event._id}`);
      onClose();
      onUpdated?.();
    } catch (err) {
      alert(err.message || "Failed to delete event");
    } finally {
      setDeleting(false);
    }
  }

  if (!eventId) return null;

  /* ======================================================
     Attendee visibility logic
  ====================================================== */

  const isStaff = ["admin", "coach"].includes(currentUser?.role);
  const currentCompanyId = currentUser?.company?.id || null;

  const visibleParticipants =
    event && !isStaff
      ? event.participants.filter(p => {
          // Same company
          if (p.companyId?._id === currentCompanyId) return true;

          // CSTG users (admins / coaches without company)
          if (!p.companyId) return true;

          return false;
        })
      : event?.participants || [];

  const coach = event?.templateInstanceId?.coachId || null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="
          relative w-full max-w-xl max-h-[90vh] overflow-y-auto
          rounded-lg p-6 space-y-4 shadow-xl
          bg-white dark:bg-[hsl(var(--sidebar-background))]
          text-neutral-900 dark:text-[hsl(var(--sidebar-foreground))]
          border border-neutral-200 dark:border-[hsl(var(--sidebar-border))]
        "
      >
        {/* Watermark */}
        <div className="absolute top-4 right-6 text-xs uppercase tracking-widest opacity-40">
          {event?.templateInstanceId ? "Cohort" : "Event"}
        </div>

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Event details</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {loading && <div className="text-neutral-500">Loading…</div>}
        {error && <div className="text-red-600">{error}</div>}

        {event && (
          <>
            {/* Title */}
            <h2 className="text-xl font-semibold">
              {event.title?.replace("undefined", "").trim()}
            </h2>

            {/* Date */}
            <p className="text-sm text-neutral-500">
              {new Date(event.startDate).toLocaleString()} –{" "}
              {new Date(event.endDate).toLocaleTimeString()}
            </p>

            {/* Coach */}
            {coach && (
              <p className="text-sm text-neutral-500">
                Coach:{" "}
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  {coach.name}
                </span>
              </p>
            )}

            {/* Description */}
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {event.description?.trim()
                  ? event.description
                  : "No description provided."}
              </p>
            </div>

            {/* Attendees summary */}
            <div className="mt-6">
              <button
                onClick={() => setShowAttendees(true)}
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 dark:hover:text-white"
              >
                <span className="font-semibold">Attendees</span>
                <span className="opacity-70">
                  {visibleParticipants.length}
                </span>
              </button>

              {visibleParticipants.length > 0 && (
                <p className="text-xs text-neutral-500 mt-1">
                  {visibleParticipants[0]?.name}
                  {visibleParticipants.length > 1 &&
                    ` + ${visibleParticipants.length - 1} more`}
                </p>
              )}
            </div>

            {/* Zoom */}
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Join</h3>

              {event.zoomJoinUrl ? (
                <button
                  onClick={() => setOpenPreJoin(true)}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Join session
                </button>
              ) : (
                <div className="text-neutral-500 text-sm">
                  No Zoom link configured.
                </div>
              )}
            </div>

            {/* ADMIN / COACH CONTROLS */}
            {canManage && (
              <div className="flex gap-3 pt-4 border-t mt-6">
                <button
                  onClick={() => onEdit?.(event)}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Edit
                </button>

                <button
                  disabled={deleting}
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            )}

            {/* PreJoin */}
            {openPreJoin && (
              <PreJoinModal
                event={event}
                currentUser={currentUser}
                onClose={() => setOpenPreJoin(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Attendees Overlay */}
      {showAttendees && event && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg max-h-[80vh] rounded-lg p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Attendees ({visibleParticipants.length})
              </h3>
              <button onClick={() => setShowAttendees(false)}>✕</button>
            </div>

            {visibleParticipants.length === 0 && (
              <p className="text-neutral-500">No attendees</p>
            )}

            {visibleParticipants.map((p) => (
              <div
                key={p._id}
                className="flex items-center gap-3 py-2 border-b text-sm"
              >
                <span className="text-lg">
                  {roleIcon[p.role] || "👤"}
                </span>

                <div className="flex-1">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-neutral-500">
                    {p.email}
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-xs bg-neutral-200 dark:bg-neutral-800">
                  {p.companyId?.name || "CSTG"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
