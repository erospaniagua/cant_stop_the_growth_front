import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/api/client";

export default function TeamForm({ open, onClose, team, onSaved }) {
  const isEditing = !!team;

  const [companies, setCompanies] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  const [form, setForm] = useState({
    name: "",
    companyId: "",
    managerId: "",
    members: []
  });

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [onlyFreeUsers, setOnlyFreeUsers] = useState(false);

  async function loadCompanies() {
    const data = await apiClient.get("/api/companies");
    setCompanies(data);
  }

  async function loadUsers() {
  const users = await apiClient.get("/api/users");
  console.log("BACKEND USERS:", users);
  setAllUsers(users);
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

  // Filter by company
 const companyUsers = useMemo(() => {
  if (!form.companyId) return [];

  return allUsers.filter(u => {
    if (!u.companyId) return false;

    // If backend returned a populated company (object)
    const id =
      typeof u.companyId === "object" && u.companyId._id
        ? u.companyId._id
        : u.companyId;

    return String(id) === String(form.companyId);
  });
}, [allUsers, form.companyId]);


  const managers = useMemo(() => {
    return companyUsers.filter(u => u.role === "team-manager");
  }, [companyUsers]);

  const students = useMemo(() => {
    let filtered = companyUsers.filter(u => u.role === "student");

    if (categoryFilter) {
      filtered = filtered.filter(u => u.categories?.includes(categoryFilter));
    }

    if (onlyFreeUsers) {
      filtered = filtered.filter(u => !u.teamId && !u.managerId);
    }

    if (search.trim()) {
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered;
  }, [companyUsers, categoryFilter, onlyFreeUsers, search]);

  const toggleMember = (id) => {
    setForm(prev => 
      prev.members.includes(id)
        ? { ...prev, members: prev.members.filter(m => m !== id) }
        : { ...prev, members: [...prev.members, id] }
    );
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

          {/* FILTERS */}
          <div className="flex gap-2 items-center">
            <input
              className="border p-2 flex-1 rounded"
              placeholder="Search name/email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border p-2 rounded"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Sales">Sales</option>
              <option value="Install">Install</option>
              <option value="Service">Service</option>
              <option value="Leadership">Leadership</option>
              <option value="Office Staff">Office Staff</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyFreeUsers}
                onChange={() => setOnlyFreeUsers(v => !v)}
              />
              Without manager
            </label>
          </div>

          {/* MEMBERS */}
          <div>
            <label className="font-medium text-sm">Team Members</label>
            <div className="max-h-56 overflow-y-auto border rounded p-2">
              {students.map((m) => (
                <label key={m._id} className="flex items-center gap-2 p-1">
                  <input
                    type="checkbox"
                    checked={form.members.includes(m._id)}
                    onChange={() => toggleMember(m._id)}
                  />
                  <span>{m.name} ({m.email})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>{isEditing ? "Save Changes" : "Create Team"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
