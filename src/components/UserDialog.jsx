import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import UserConfirmDialog from "./UserConfirmDialog";
import { apiClient } from "@/api/client";

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

function validatePassword(password) {
  if (!password) return { ok: false, message: "Password is required" };
  if (!PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      message:
        "Password must be at least 8 characters long, include an uppercase letter and a number.",
    };
  }
  return { ok: true };
}

function generateTempPassword() {
  const uppers = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowers = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const all = uppers + lowers + digits;
  let pwd = "";
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

const CATEGORY_OPTIONS = [
  "Leadership",
  "Service",
  "Sales",
  "Office Staff",
  "Install",
];

export default function UserDialog({ open, onOpenChange, user, onRefresh }) {
  const { token, user: currentUser } = useUser();

  const [companies, setCompanies] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "coach",
    subRole: "",
    companyId: "",
    categories: [],
  });

  useEffect(() => {
    if (open) fetchCompanies();
  }, [open]);

  const fetchCompanies = async () => {
    try {
      const data = await apiClient.get("/api/companies");
      setCompanies(data);
    } catch (err) {
      console.error("Error loading companies", err);
    }
  };

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: "",
        role: user.role,
        subRole: user.subRole || "",
        companyId: user.companyId?._id || "",
        categories: user.categories || [],
      });
    } else {
      setForm({
        name: "",
        email: "",
        password: "",
        role: "coach",
        subRole: "",
        companyId: "",
        categories: [],
      });
    }
  }, [user]);

  const rolesRequiringCompany = ["company", "student", "team-manager"];
  const requiresCompany = rolesRequiringCompany.includes(form.role);
  const requiresCategories = ["student", "team-manager"].includes(form.role);

  const handleGeneratePassword = () => {
    const newPass = generateTempPassword();
    setForm({ ...form, password: newPass });
  };

  const toggleCategory = (cat) => {
    setForm((prev) => {
      return prev.categories.includes(cat)
        ? { ...prev, categories: prev.categories.filter((c) => c !== cat) }
        : { ...prev, categories: [...prev.categories, cat] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = { ...form };

    // Cleanup depending on role
    if (!requiresCompany) delete body.companyId;
    if (!requiresCategories) delete body.categories;

    if (!["admin", "coach"].includes(form.role)) {
      delete body.subRole;
    }

    if (!user) {
      const { ok, message } = validatePassword(form.password);
      if (!ok) return alert(message);
    }

    try {
      if (user) {
        await apiClient.put(`/api/users/${user._id}`, body);
      } else {
        await apiClient.post("/api/users", body);
      }

      onOpenChange(false);
      onRefresh();
    } catch (err) {
      alert(err.message || "Error saving user");
    }
  };

  const canArchive = user && currentUser?.id !== user._id;

  const handleArchive = () => setOpenConfirm(true);

  const confirmArchive = async (masterKey) => {
    try {
      await apiClient.patch(`/users/${user._id}/archive`, { masterKey });
      alert("User archived successfully");
      setOpenConfirm(false);
      onOpenChange(false);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleForceReset = async () => {
    const newPass = generateTempPassword();

    try {
      await apiClient.patch(`/api/users/${user._id}/force-reset`, {
        newPassword: newPass,
      });

      alert(
        `Temporary password set:\n\n${newPass}\n\nUser will be forced to change it at next login.`
      );
    } catch (err) {
      alert(err.message || "Error forcing password reset");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{user ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* NAME */}
            <input
              className="border rounded p-2 w-full"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            {/* EMAIL */}
            <input
              className="border rounded p-2 w-full"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              type="email"
              required
            />

            {/* NEW USER PASSWORD */}
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

            {/* FORCE RESET */}
            {user && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleForceReset}
              >
                Force Reset Password
              </Button>
            )}

            {/* ROLE */}
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

            {/* SUB-ROLE — only admin/coach */}
            {["admin", "coach"].includes(form.role) && (
              <select
                className="border rounded p-2 w-full"
                value={form.subRole}
                onChange={(e) =>
                  setForm({ ...form, subRole: e.target.value })
                }
              >
                <option value="">No sub-role</option>
                <option value="salesman">Salesman</option>
                <option value="coach">Coach (Internal)</option>
                <option value="successManager">Success Manager</option>
              </select>
            )}

            {/* COMPANY */}
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

            {/* CATEGORIES */}
            {requiresCategories && (
              <div className="border rounded p-2">
                <label className="block mb-2 font-medium text-sm">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={form.categories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="accent-red-500"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* FOOTER */}
            <DialogFooter className="flex justify-between gap-2 pt-2">
              {canArchive && (
                <Button
                  variant="destructive"
                  type="button"
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

      <UserConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        onConfirm={confirmArchive}
      />
    </>
  );
}
