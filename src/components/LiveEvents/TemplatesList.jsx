import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import UserConfirmDialog from "@/components/UserConfirmDialog"

export default function TemplatesList({
  onCreate,
  onEdit,
  onUse,
  onOpenInstance,
  onOpenInvites
}) {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [error, setError] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetInst, setTargetInst] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Optional: If you plan to show instances in the table
  const [instances, setInstances] = useState([]);

  useEffect(() => {
    loadTemplates();
    loadInstances(); // you can remove this if you're not showing them yet
  }, []);

  async function loadTemplates() {
    try {
      setLoading(true);
      const data = await apiClient.get("/api/event-templates");
      setTemplates(data);
    } catch (err) {
      setError(err.message || "Error loading templates");
    } finally {
      setLoading(false);
    }
  }

  async function loadInstances() {
    try {
      const data = await apiClient.get("/api/template-instances");
      setInstances(data);
    } catch {
      /* ignore for now */
    }
  }

  const openEraseDialog = (inst) => {
  setTargetInst(inst);
  setConfirmOpen(true);
};

const handleEraseInstance = async (masterKey) => {
  if (!targetInst?._id) return;

  try {
    setDeleting(true);

    await apiClient.del(`/api/template-instances/${targetInst._id}`, undefined, {
      headers: { "x-master-key": masterKey },
    });

    setConfirmOpen(false);
    setTargetInst(null);

    // refresh list: call whatever you already use to reload instances
    await loadInstances(); // <-- replace with your real function name
  } catch (e) {
    console.error("Failed to erase instance", e);
    alert("❌ " + (e.message || "Failed to erase instance"));
  } finally {
    setDeleting(false);
  }
};


  if (loading) return <div>Loading templates…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Event Templates</h1>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
        >
          New Template
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="color-black">
            <tr>
              <th className="px-4 py-2 text-left color-black">Title</th>
              <th className="px-4 py-2 text-left">Categories</th>
              <th className="px-4 py-2 text-left">Sessions</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {templates.map((template) => (
              <tr key={template._id} className="border-b">
                <td className="px-4 py-2">{template.title}</td>

                <td className="px-4 py-2">
                  {template.categories?.length
                    ? template.categories.join(", ")
                    : "-"}
                </td>

                <td className="px-4 py-2">
                  {template.sessions?.length || 0}
                </td>

                <td className="px-4 py-2">
                  {new Date(template.createdAt).toLocaleDateString()}
                </td>

                <td className="px-4 py-2 text-right space-x-2">
                  <button
                    onClick={() => onUse(template._id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Use Template
                  </button>

                  <button
                    onClick={() => onEdit(template._id)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {templates.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  No templates created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* OPTIONAL: Show existing Template Instances */}
      {instances.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-2 black">Existing Tours (Instances)</h2>

          <div className="overflow-x-auto border rounded black">
            <table className="min-w-full text-sm">
              <thead className="black">
                <tr>
                  <th className="px-4 py-2 text-left">Title</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Progress</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {instances.map((inst) => (
                  <tr key={inst._id} className="border-b">
                    <td className="px-4 py-2">{inst.title}</td>

                    <td className="px-4 py-2">
                      {new Date(inst.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-2">
                      {inst.sessions.length} sessions
                    </td>

                    <td className="px-4 py-2 text-right">
                        <button
                        onClick={() =>onOpenInvites(inst._id)}
                        className="px-3 py-1 bg-red-500 hover:bg-blue-700 text-white rounded mr-3"
                      >
                        Invites
                      </button>
                      <button
                        onClick={() => onOpenInstance(inst._id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        View
                      </button>
                      <button
                       onClick={() => openEraseDialog(inst)}
                       disabled={deleting}
                       className="px-3 py-1 bg-black hover:bg-red-700 text-white rounded ml-3"
                       >
                        Erase
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <UserConfirmDialog
              open={confirmOpen}
              onOpenChange={(v) => {
              setConfirmOpen(v);
              if (!v) setTargetInst(null);
              }}
            onConfirm={handleEraseInstance}
            message={
            targetInst
            ? `This will PERMANENTLY delete this cohort instance:\n\n"${targetInst.title}"\n\nIt will also delete ALL related calendar events.\n\nThis cannot be undone.`
            : ""
            }
            />
          </div>
        </div>
      )}

    </div>
  );
}
