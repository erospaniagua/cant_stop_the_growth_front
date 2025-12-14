import { useEffect, useState } from "react";
import { apiClient } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TeamForm from "@/components/Teams/TeamForm";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openForm, setOpenForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  async function fetchTeams() {
    try {
      const data = await apiClient.get("/api/teams");
      setTeams(data);
    } catch (err) {
      console.error("Error loading teams:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = () => {
    setEditingTeam(null);
    setOpenForm(true);
  };

  const handleEdit = (team) => {
    setEditingTeam(team);
    setOpenForm(true);
  };

  const handleDelete = async (teamId) => {
    if (!confirm("Delete team? This cannot be undone.")) return;

    try {
      await apiClient.del(`/api/teams/${teamId}`);
      fetchTeams();
    } catch (err) {
      alert("Error deleting team");
    }
  };

  if (loading) return <p className="p-4">Loading teams...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-semibold">Teams</h1>

        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <p>No teams created yet.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {teams.map((team) => (
            <div key={team._id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{team.name}</div>
                <div className="text-sm text-gray-600">
                  Company: {team.companyId?.name || "N/A"}
                </div>
                <div className="text-sm text-gray-600">
                  Manager: {team.managerId?.name || "N/A"}
                </div>
                <div className="text-sm text-gray-600">
                  Members: {team.members?.length || 0}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => handleEdit(team)}>
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(team._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Create/Edit */}
      {openForm && (
        <TeamForm
          open={openForm}
          onClose={() => setOpenForm(false)}
          team={editingTeam}
          onSaved={fetchTeams}
        />
      )}
    </div>
  );
}
