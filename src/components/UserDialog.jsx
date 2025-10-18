import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useUser } from "@/context/UserContext"
import UserConfirmDialog from "./UserConfirmDialog"

// 🧩 Password validation regex (8+ chars, 1 uppercase, 1 number)
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/

function validatePassword(password) {
  if (!password) return { ok: false, message: "Password is required" }
  if (!PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      message:
        "Password must be at least 8 characters long, include at least one uppercase letter and one number.",
    }
  }
  return { ok: true }
}

// 🧠 Simple temp password generator
function generateTempPassword() {
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowers = "abcdefghijklmnopqrstuvwxyz"
  const digits = "0123456789"
  const all = uppers + lowers + digits
  let pwd = ""
  pwd += uppers[Math.floor(Math.random() * uppers.length)]
  pwd += digits[Math.floor(Math.random() * digits.length)]
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)]
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("") // shuffle
}

export default function UserDialog({ open, onOpenChange, user, onRefresh }) {
  const { token, user: currentUser } = useUser()
  const [companies, setCompanies] = useState([])
  const [openConfirm, setOpenConfirm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
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

  // ✨ Generate random password
  const handleGeneratePassword = () => {
    const newPass = generateTempPassword()
    setForm({ ...form, password: newPass })
  }

  // 🧩 Create or edit
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate password only for new user
    if (!user) {
      const { ok, message } = validatePassword(form.password)
      if (!ok) {
        alert(message)
        return
      }
    }

    const method = user ? "PUT" : "POST"
    const url = user
      ? `http://localhost:5000/api/users/${user._id}`
      : `http://localhost:5000/api/users`

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

  // 🧱 Handle archive toggle (opens confirm dialog)
  const handleArchive = () => {
    setOpenConfirm(true)
  }

  // 🧩 Actually send archive request after confirmation
  const confirmArchive = async (masterKey) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/${user._id}/archive`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ masterKey }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        alert(data.message || "Error archiving user")
        return
      }

      alert(data.message)
      setOpenConfirm(false)
      onOpenChange(false)
      onRefresh()
    } catch (err) {
      console.error("Error archiving user:", err)
      alert("Unexpected error")
    }
  }

  // 🚫 Prevent showing Archive if editing own account
  const canArchive = user && currentUser?.id !== user._id

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <input
              className="border rounded p-2 w-full"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {/* Email */}
            <input
              className="border rounded p-2 w-full"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              required
            />

            {/* Password field (only on create) */}
            {!user && (
              <div>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGeneratePassword}
                  >
                    Generate Random Password
                  </Button>
                </div>
                <input
                  className="border rounded p-2 w-full"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <label className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="h-4 w-4 accent-red-500"
                  />
                  <span>Show password</span>
                </label>
              </div>
            )}

            {/* Role */}
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

            {/* Company dropdown if required */}
            {requiresCompany && (
              <select
                className="border rounded p-2 w-full"
                value={form.companyId}
                onChange={(e) =>
                  setForm({ ...form, companyId: e.target.value })
                }
              >
                <option value="">Select a company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Footer buttons */}
            <DialogFooter className="flex justify-between gap-2 pt-2">
              {canArchive && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleArchive}
                >
                  {user.isArchived ? "Unarchive" : "Archive"}
                </Button>
              )}
              <Button type="submit" className="w-full">
                {user ? "Save Changes" : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🔒 Confirmation modal for master key */}
      <UserConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        onConfirm={confirmArchive}
      />
    </>
  )
}
