import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";

export default function TemplateForm({ templateId, onBack }) {
  const isEdit = Boolean(templateId);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [sessions, setSessions] = useState([]);

  // Load existing template if editing
  useEffect(() => {
    if (!isEdit) return;
    loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    try {
      const data = await apiClient.get(`/api/event-templates/${templateId}`);
      setTitle(data.title);
      setDescription(data.description || "");
      setCategories(data.categories || []);
      setSessions(
        data.sessions.map(s => ({
          _id: s._id,
          name: s.name,
          description: s.description || "",
        }))
      );
    } catch (err) {
      setError(err.message || "Error loading template");
    } finally {
      setLoading(false);
    }
  }

  function addSession() {
    setSessions(prev => [
      ...prev,
      { _id: null, name: "", description: "" }
    ]);
  }

  function updateSession(index, field, value) {
    setSessions(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  }

  function deleteSession(index) {
    setSessions(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      setSaving(true);

      const payload = {
        title,
        description,
        categories,
        sessions: sessions.map(s => ({
          name: s.name,
          description: s.description
        }))
      };

      if (isEdit) {
        await apiClient.patch(`/api/event-templates/${templateId}`, payload);
      } else {
        await apiClient.post(`/api/event-templates`, payload);
      }

      onBack();
    } catch (err) {
      setError(err.message || "Error saving template");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading template…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">
          {isEdit ? "Edit Template" : "Create Template"}
        </h1>

        <button
          onClick={onBack}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
        >
          Back
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block font-semibold mb-1">Title</label>
        <input
          type="text"
          className="w-full p-2 border rounded"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-semibold mb-1">Description</label>
        <textarea
          className="w-full p-2 border rounded"
          rows={3}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div>
        <label className="block font-semibold mb-1">Categories</label>

        {/* Replace with your own dropdown if needed */}
        <div className="space-y-2">

  {["Leadership", "Sales", "Service", "Office Staff", "Install"].map(cat => (
    <label key={cat} className="flex items-center gap-2">
      <input
        type="checkbox"
        value={cat}
        checked={categories.includes(cat)}
        onChange={e => {
          if (e.target.checked) {
            setCategories(prev => [...prev, cat]);
          } else {
            setCategories(prev => prev.filter(c => c !== cat));
          }
        }}
      />
      {cat}
    </label>
  ))}

</div>

      </div>

      {/* Sessions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Sessions</h2>

          <button
            onClick={addSession}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Add Session
          </button>
        </div>

        {sessions.length === 0 && (
          <div className="text-gray-500">No sessions added yet.</div>
        )}

        {sessions.map((session, idx) => (
          <div key={idx} className="p-4 border rounded space-y-2 black">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Session {idx + 1}</h3>

              <button
                onClick={() => deleteSession(idx)}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
            </div>

            <input
              type="text"
              placeholder="Session name"
              className="w-full p-2 border rounded"
              value={session.name}
              onChange={e => updateSession(idx, "name", e.target.value)}
            />

            <textarea
              placeholder="Description"
              className="w-full p-2 border rounded"
              rows={2}
              value={session.description}
              onChange={e => updateSession(idx, "description", e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
      >
        {saving ? "Saving..." : "Save Template"}
      </button>
    </div>
  );
}
