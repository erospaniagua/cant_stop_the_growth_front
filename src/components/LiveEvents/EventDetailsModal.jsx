import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { parseZoomLink, buildBrowserJoinUrl } from "@/utils/zoom";
import {useUser} from "@/context/UserContext"

export default function EventDetailsModal({ eventId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const { user: currentUser } = useUser();

  const roleIcon = {
    coach: "👨‍🏫",
    student: "🎓",
    admin: "🧰",
    company: "🏢",
    "team-manager": "🛠️",
  };

  useEffect(() => {
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
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Event details</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-black">
            ✕
          </button>
        </div>

        {loading && <div>Loading…</div>}
        {error && <div className="text-red-500">{error}</div>}

        {event && (
          <>
            {/* Title */}
            <h2 className="text-xl font-semibold">
              {event.title?.replace(" - undefined", "")}
            </h2>

            {/* Date */}
            <p className="text-sm text-gray-600">
              {new Date(event.startDate).toLocaleString()}
            </p>

            {/* Description */}
            <div className="mt-4">
              <h3 className="font-semibold">Description</h3>

              <p className="text-gray-700">
                {event.description?.trim()
                  ? event.description
                  : "No description provided."}
              </p>
            </div>

            {/* Attendees */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Attendees</h3>

              {event.participants.length === 0 && (
                <p className="text-gray-500">No attendees</p>
              )}

              {event.participants.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-3 py-2 border-b text-sm"
                >
                  {/* Role Icon */}
                  <span className="text-lg">
                    {roleIcon[p.role] || "👤"}
                  </span>

                  {/* Name */}
                  <span className="font-medium">{p.name}</span>

                  {/* Company */}
                  <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                    {p.companyId?.name || "CSTG"}
                  </span>

                  {/* email */}
                  <span className="text-gray-500">{p.email}</span>

                  {/* subRole badge */}
                  {p.subRole && (
                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs">
                      {p.subRole}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Zoom */}
            <div>
  <div className="font-semibold mb-1">Zoom link</div>

  {event.zoomJoinUrl ? (
    (() => {
      const { meetingId, pwd } = parseZoomLink(event.zoomJoinUrl);
      const joinUrl = buildBrowserJoinUrl(meetingId, pwd, currentUser.name);

      return (
        <a
          href={joinUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline text-sm font-medium"
        >
          Join live session
        </a>
      );
    })()
  ) : (
    <div className="text-gray-500 text-sm">
      No Zoom link configured.
    </div>
  )}
</div>

          </>
        )}
      </div>
    </div>
  );
}
