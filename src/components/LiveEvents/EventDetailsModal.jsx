import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { useUser } from "@/context/UserContext";
import PreJoinModal from "./PreJoinModal";

export default function EventDetailsModal({ eventId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const { user: currentUser } = useUser();
  const [openPreJoin, setOpenPreJoin] = useState(false);

  const roleIcon = {
    coach: "👨‍🏫",
    student: "🎓",
    admin: "🧰",
    company: "🏢",
    "team-manager": "🛠️",
  };

  useEffect(() => {
    if (!eventId) return;
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    try {
      const data = await apiClient.get(`/api/calendar-events/${eventId}`);
      setEvent(data);
    } catch (err) {
      setError(err.message || "Error loading event");
    } finally {
      setLoading(false);
    }
  }

  if (!eventId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div
        className="
          w-full max-w-xl max-h-[90vh] overflow-y-auto
          rounded-lg p-6 space-y-4 shadow-xl
          bg-white dark:bg-[hsl(var(--sidebar-background))]
          text-neutral-900 dark:text-[hsl(var(--sidebar-foreground))]
          border border-neutral-200 dark:border-[hsl(var(--sidebar-border))]
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Event details</h2>
          <button
            onClick={onClose}
            className="
              text-neutral-500 hover:text-neutral-900
              dark:text-neutral-400 dark:hover:text-white
            "
          >
            ✕
          </button>
        </div>

        {loading && (
          <div className="text-neutral-500 dark:text-neutral-400">
            Loading…
          </div>
        )}

        {error && (
          <div className="text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {event && (
          <>
            {/* Title */}
            <h2 className="text-xl font-semibold">
              {event.title?.replace("undefined", "").trim()}
            </h2>

            {/* Date */}
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {new Date(event.startDate).toLocaleString()}
            </p>

            {/* Description */}
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {event.description?.trim()
                  ? event.description
                  : "No description provided."}
              </p>
            </div>

            {/* Attendees */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Attendees</h3>

              {event.participants.length === 0 && (
                <p className="text-neutral-500 dark:text-neutral-400">
                  No attendees
                </p>
              )}

              {event.participants.map((p) => (
                <div
                  key={p._id}
                  className="
                    flex flex-wrap items-center gap-3 py-2 border-b text-sm
                    border-neutral-200 dark:border-[hsl(var(--sidebar-border))]
                  "
                >
                  <span className="text-lg">{roleIcon[p.role] || "👤"}</span>

                  <span className="font-medium">
                    {p.name}
                  </span>

                  <span
                    className="
                      px-2 py-0.5 rounded text-xs
                      bg-neutral-200 text-neutral-700
                      dark:bg-[hsl(var(--sidebar-accent))]
                      dark:text-[hsl(var(--sidebar-foreground))]
                    "
                  >
                    {p.companyId?.name || "CSTG"}
                  </span>

                  <span className="text-neutral-500 dark:text-neutral-400">
                    {p.email}
                  </span>

                  {p.subRole && (
                    <span
                      className="
                        px-2 py-0.5 rounded text-xs
                        bg-pink-100 text-pink-700
                        dark:bg-pink-900 dark:text-pink-200
                      "
                    >
                      {p.subRole}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Zoom */}
            <div className="mt-4">
              <div className="font-semibold mb-1">Zoom</div>

              {event.zoomJoinUrl ? (
                <button
                  onClick={() => setOpenPreJoin(true)}
                  className="
                    text-blue-600 hover:underline text-sm
                    dark:text-[hsl(var(--sidebar-primary))]
                  "
                >
                  Join session
                </button>
              ) : (
                <div className="text-neutral-500 dark:text-neutral-400 text-sm">
                  No Zoom link configured.
                </div>
              )}
            </div>

            {/* PreJoin Modal */}
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
    </div>
  );
}
