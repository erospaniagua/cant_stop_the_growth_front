import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";

export default function TeamForm({ open, onClose, team, onSaved }) {
  const isEditing = !!team;

  const [companies, setCompanies] = useState([]);
  const [managers, setManagers] = useState([]);
  const [members, setMembers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    companyId: "",
    managerId: "",
    members: []
  });

  async function loadCompanies() {
    const data = await apiClient.get("/api/companies");
    setCompanies(data);
  }

  async function loadUsers() {
    const users = await apiClient.get("/api/users");
    const managers = users.filter((u) => u.role === "team-manager");
    const students = users.filter((u) => u.role === "student");

    setManagers(managers);
    setMembers(students);
  }

  useEffect(() => {
    if (!open) return;
    loadCompanies();
    loadUsers();

    if (isEditing) {
      setForm({
        name: team.name,
        companyId: team.companyId?._id || "",
        managerId: team.managerId?._id || "",
        members: team.members?.map((m) => m._id) || []
      });
    } else {
      setForm({
        name: "",
        companyId: "",
        managerId: "",
        members: []
      });
    }
  }, [open]);

  const toggleMember = (id) => {
    setForm((prev) => {
      return prev.members.includes(id)
        ? { ...prev, members: prev.members.filter((m) => m !== id) }
        : { ...prev, members: [...prev.members, id] };
    });
  };

  const handleSubmit = async () => {
    const body = { ...form };

    try {
      if (isEditing) {
        await apiClient.put(`/api/teams/${team._id}`, body);
      } else {
        await apiClient.post(`/api/teams`, body);
      }

      onClose();
      onSaved();
    } catch (err) {
      alert("Error saving team");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Team" : "Create Team"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-2">
          <input
            className="border rounded p-2 w-full"
            placeholder="Team name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* COMPANY */}
          <select
            className="border rounded p-2 w-full"
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* MANAGER */}
          <select
            className="border rounded p-2 w-full"
            value={form.managerId}
            onChange={(e) => setForm({ ...form, managerId: e.target.value })}
          >
            <option value="">Select team manager</option>
            {managers.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>

          {/* MEMBERS */}
          <div>
            <label className="font-medium text-sm">Team Members</label>
            <div className="max-h-56 overflow-y-auto border rounded p-2">
              {members.map((m) => (
                <label key={m._id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    checked={form.members.includes(m._id)}
                    onChange={() => toggleMember(m._id)}
                  />
                  <span>
                    {m.name} ({m.email})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {isEditing ? "Save Changes" : "Create Team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
