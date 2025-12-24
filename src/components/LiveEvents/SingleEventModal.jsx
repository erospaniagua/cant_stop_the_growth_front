import { useEffect, useState } from "react";
import InvitationsModal from "@/components/LiveEvents/InvitationsModal";
import { apiClient } from "@/api/client";

/* ============================================================
   Helpers
============================================================ */
function toLocalDatetimeInput(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function SingleEventModal({
  mode = "create",        // "create" | "edit"
  initialEvent = null,    // required for edit
  onClose,
  onCreated,
  onSaved,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [zoomUrl, setZoomUrl] = useState("");

  // normalized invite objects: { _id, userId } OR { _id, email }
  const [invites, setInvites] = useState([]);
  const [showInvites, setShowInvites] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  /* ============================================================
     Prefill for EDIT mode
  ============================================================ */
  useEffect(() => {
    if (mode !== "edit" || !initialEvent) return;

    setTitle(initialEvent.title || "");
    setDescription(initialEvent.description || "");

    if (initialEvent.startDate) {
      setStartDate(toLocalDatetimeInput(initialEvent.startDate));
    }

    if (initialEvent.startDate && initialEvent.endDate) {
      const mins =
        (new Date(initialEvent.endDate) -
          new Date(initialEvent.startDate)) /
        60000;
      setDurationMinutes(Math.round(mins));
    }

    setZoomUrl(initialEvent.zoomJoinUrl || "");

    setInvites(
      initialEvent.participants?.map((p) => ({
        _id: "local",
        userId: p, // KEEP FULL USER OBJECT
      })) || []
    );
  }, [mode, initialEvent]);

  /* ============================================================
     Create / Update
  ============================================================ */
 async function handleSubmit() {
  if (!title || !startDate) {
    setError("Title and start date are required.");
    return;
  }

  try {
    setSaving(true);
    setError(null);

    // 🔒 Only real users go into CalendarEvent.participants
   const participantIds = invites
  .map(inv => {
    if (typeof inv === "string") return inv; // defensive
    return inv.userId?._id;
  })
  .filter(Boolean);


    const payload = {
  title,
  description,
  startDate,
  durationMinutes,
  participants: participantIds.length ? participantIds : undefined,
  zoomJoinUrl: zoomUrl || null,
  zoomStartUrl: zoomUrl || null,
};


    let event;

    if (mode === "edit") {
      event = await apiClient.patch(
        `/api/calendar-events/${initialEvent._id}`,
        payload
      );
      onSaved?.(event);
    } else {
      event = await apiClient.post(
        "/api/calendar-events/manual",
        payload
      );
      onCreated?.(event);
    }

    onClose();
  } catch (err) {
    console.error(err);
    setError(err.message || "Failed to save event");
  } finally {
    setSaving(false);
  }
}



  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-40">
        <div className="bg-neutral-900 text-white p-6 rounded-lg w-full max-w-lg space-y-4">
          <h2 className="text-xl font-semibold">
            {mode === "edit" ? "Edit event" : "Add single event"}
          </h2>

          {error && <div className="text-red-400">{error}</div>}

          <input
            placeholder="Event title"
            className="w-full p-2 rounded bg-neutral-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <textarea
            placeholder="Description (optional)"
            className="w-full p-2 rounded bg-neutral-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="datetime-local"
            className="w-full p-2 rounded bg-neutral-800"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <select
            className="w-full p-2 rounded bg-neutral-800"
            value={durationMinutes}
            onChange={(e) =>
              setDurationMinutes(Number(e.target.value))
            }
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>

          <input
            placeholder="Zoom link (optional)"
            className="w-full p-2 rounded bg-neutral-800"
            value={zoomUrl}
            onChange={(e) => setZoomUrl(e.target.value)}
          />

          <div className="flex gap-2">
            <button
              onClick={() => setShowInvites(true)}
              className="px-3 py-2 bg-gray-700 rounded"
            >
              Manage Invitations ({invites.length})
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-700 rounded"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              onClick={handleSubmit}
              className="px-3 py-2 bg-blue-600 rounded disabled:opacity-50"
            >
              {mode === "edit" ? "Save changes" : "Create"}
            </button>
          </div>
        </div>
      </div>

      {showInvites && (
        <InvitationsModal
          mode="new-instance"
          initialInvites={invites}
          onClose={() => setShowInvites(false)}
          onConfirm={(list) => {
            setInvites(list);
            setShowInvites(false);
          }}
        />
      )}
    </>
  );
}
