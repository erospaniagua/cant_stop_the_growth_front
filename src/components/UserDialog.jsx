import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useUser } from "@/context/UserContext"

export default function UserDialog({ open, onOpenChange, user, onRefresh }) {
  const { token } = useUser()
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "coach",
    companyId: "",
  })

  // 🧭 Load companies for dropdown
  useEffect(() => {
    if (open) fetchCompanies()
  }, [open])

  const fetchCompanies = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setCompanies(data)
    } catch (err) {
      console.error("Error loading companies", err)
    }
  }

  // 🧩 Prefill when editing
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        companyId: user.companyId?._id || "",
      })
    } else {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "coach",
        companyId: "",
      })
    }
  }, [user])

  // 🧠 Roles that require a company link
  const rolesRequiringCompany = ["company", "student", "team-manager"]
  const requiresCompany = rolesRequiringCompany.includes(form.role)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = user ? "PUT" : "POST"
    const url = user
      ? `http://localhost:5000/api/users/${user._id}`
      : `http://localhost:5000/api/users`

    // 🧹 Clean body to avoid validation errors
    const body = { ...form }
    if (!requiresCompany) delete body.companyId

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (res.ok) {
      onOpenChange(false)
      onRefresh()
    } else {
      alert(data.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className="border rounded p-2 w-full"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="border rounded p-2 w-full"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {!user && (
            <input
              className="border rounded p-2 w-full"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}

          <select
            className="border rounded p-2 w-full"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="admin">Admin</option>
            <option value="coach">Coach</option>
            <option value="company">Company</option>
            <option value="student">Student</option>
            <option value="team-manager">Team Manager</option>
          </select>

          {/* 🏢 Only show when needed */}
          {requiresCompany && (
            <select
              className="border rounded p-2 w-full"
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="submit"
            className="bg-primary text-white w-full py-2 rounded hover:bg-primary/80"
          >
            {user ? "Save Changes" : "Create User"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
