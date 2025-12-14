import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import InvitationsModal from "@/components/LiveEvents/InvitationsModal";

export default function UseTemplateForm({
  templateId,
  onBack,
  onCreatedInstance
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [template, setTemplate] = useState(null);
  const [instanceTitle, setInstanceTitle] = useState("");
  const [instanceDescription, setInstanceDescription] = useState("");

  const [sessionDates, setSessionDates] = useState([]);

  const [autoEnroll, setAutoEnroll] = useState(true);
  const [candidatePreview, setCandidatePreview] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const [showInvites, setShowInvites] = useState(false);

  // state
const [coaches, setCoaches] = useState([]);
const [coachId, setCoachId] = useState("");
const [zoomUrl, setZoomUrl] = useState("");

// in useEffect after loadTemplate():
useEffect(() => {
  loadTemplate();
  loadCoaches();
}, [templateId]);

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


  // ============================================================
  // Load Template
  // ============================================================
  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    try {
      const data = await apiClient.get(`/api/event-templates/${templateId}`);

      setTemplate(data);
      setInstanceTitle(data.title + " (Run)");
      setInstanceDescription(data.description || "");

      setSessionDates(
        data.sessions.map(s => ({
          sessionId: s._id,
          name: s.name,
          assignedDate: ""
        }))
      );

      previewAutoEnrollCandidates(data.categories || []);

    } catch (err) {
      setError(err.message || "Error loading template");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================
  // Auto Enroll Preview
  // ============================================================
  async function previewAutoEnrollCandidates(categories) {
    if (!categories.length) {
      setCandidatePreview([]);
      return;
    }

    setLoadingCandidates(true);

    try {
      const params = new URLSearchParams();
      params.append("categories", categories.join(","));
      params.append("roles", "student");

      const res = await apiClient.get(
        `/api/tour-invites/search?${params.toString()}`
      );

      setCandidatePreview(res);
    } catch (err) {
      console.error("Preview auto-enroll error:", err);
    } finally {
      setLoadingCandidates(false);
    }
  }

  // ============================================================
  // Update Date
  // ============================================================
  function updateDate(index, value) {
    setSessionDates(prev => {
      const copy = [...prev];
      copy[index].assignedDate = value;
      return copy;
    });
  }

  // ============================================================
  // Final Create Instance (after modal returns invites)
  // ============================================================
  async function handleCreateInstance(invitesList) {
  try {
    setSaving(true);

    const payload = {
      title: instanceTitle,
      description: instanceDescription,
      sessions: sessionDates.map(s => ({
        sessionId: s.sessionId,
        assignedDate: s.assignedDate || null
      })),
      autoEnroll,
      coachId: coachId || null,
      zoomUrl: zoomUrl || null
    };

    // 1️⃣ Create instance
    const instance = await apiClient.post(
      `/api/event-templates/${templateId}/use`,
      payload
    );

    // 2️⃣ Commit initial invites (THIS WAS MISSING)
    if (invitesList?.length) {
      await apiClient.post(
        `/api/tour-invites/${instance._id}/bulk-commit`,
        {
          add: invitesList,
          remove: []
        }
      );
    }

    onCreatedInstance(instance._id);

  } catch (err) {
    console.error(err);
    setError(err.message || "Error creating instance");
  } finally {
    setSaving(false);
    setShowInvites(false);
  }
}


  // ============================================================
  // RENDER
  // ============================================================
  if (loading) return <div>Loading template…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          Use Template: {template.title}
        </h1>

        <button
          onClick={onBack}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
        >
          Back
        </button>
      </div>

      {/* TITLE */}
      <div>
        <label className="block font-semibold mb-1">Run Title</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={instanceTitle}
          onChange={e => setInstanceTitle(e.target.value)}
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block font-semibold mb-1">Description (optional)</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={2}
          value={instanceDescription}
          onChange={e => setInstanceDescription(e.target.value)}
        />
      </div>

      {/* AUTO ENROLL */}
      <div className="p-4 border rounded space-y-2">
        <label className="font-semibold flex items-center gap-3">
          <input
            type="checkbox"
            checked={autoEnroll}
            onChange={e => setAutoEnroll(e.target.checked)}
          />
          Auto-enroll matching candidates
        </label>

        {autoEnroll && (
          <div>
            <div className="font-semibold mb-1">Eligible Candidates:</div>

            {loadingCandidates ? (
              <div>Loading candidates...</div>
            ) : candidatePreview.length === 0 ? (
              <div className="text-gray-500">No matching students found.</div>
            ) : (
              <ul className="border rounded p-3 max-h-40 overflow-auto text-sm">
                {candidatePreview.map(c => (
                  <li key={c._id} className="py-1 border-b last:border-none">
                    {c.name} – {c.email}
                    <span className="text-xs text-gray-500">
                      {" "}{c.categories.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Coach selection */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block font-semibold mb-1">Coach</label>
    <select
      className="w-full p-2 border rounded"
      value={coachId}
      onChange={(e) => setCoachId(e.target.value)}
    >
      <option value="">No coach</option>
      {coaches.map((c) => (
        <option key={c._id} value={c._id}>
          {c.name} ({c.email})
        </option>
      ))}
    </select>
  </div>

  <div>
    <label className="block font-semibold mb-1">Zoom link for this tour</label>
    <input
      type="text"
      className="w-full p-2 border rounded"
      value={zoomUrl}
      onChange={(e) => setZoomUrl(e.target.value)}
      placeholder="https://zoom.us/j/..."
    />
  </div>
</div>


      {/* SESSIONS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Assign Dates</h2>

        {sessionDates.map((session, idx) => (
          <div
            key={session.sessionId}
            className="p-4 border rounded black space-y-2"
          >
            <div className="font-semibold">{session.name}</div>

            <input
              type="datetime-local"
              className="p-2 border rounded w-full"
              value={session.assignedDate}
              onChange={e => updateDate(idx, e.target.value)}
            />

            <div className="text-sm text-gray-500">
              Leave empty to schedule later.
            </div>
          </div>
        ))}
      </div>

      {/* NEXT BUTTON */}
      <button
        onClick={() => setShowInvites(true)}
        className="px-5 py-2 bg-blue-600 text-white rounded"
      >
        Next: Manage Invitations
      </button>

      {/* MODAL */}
      {showInvites && (
        <InvitationsModal
          mode="new-instance"
          initialInvites={autoEnroll ? candidatePreview.map(c => c._id) : []}
          onClose={() => setShowInvites(false)}
          onConfirm={invitesList => handleCreateInstance(invitesList)}
        />
      )}

    </div>
  );
}
