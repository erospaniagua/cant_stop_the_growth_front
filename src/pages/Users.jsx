import { useState, useEffect } from "react"
import { useUser } from "@/context/UserContext"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import UserDialog from "@/components/UserDialog"

export default function Users() {
  const { token } = useUser()
  const [users, setUsers] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers(showArchived)
  }, [showArchived])

  const fetchUsers = async (archived = false) => {
    try {
      setLoading(true)
      const res = await fetch(
        `http://localhost:5000/api/users?archived=${archived}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedUser(null)
    setOpenDialog(true)
  }

  const handleOpen = (user) => {
    setSelectedUser(user)
    setOpenDialog(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        {/* Tabs: Active / Archived */}
        <div className="flex gap-4 border-b mb-4">
          <button
            className={`pb-2 ${
              !showArchived ? "border-b-2 border-primary font-semibold" : ""
            }`}
            onClick={() => setShowArchived(false)}
          >
            Active
          </button>
          <button
            className={`pb-2 ${
              showArchived ? "border-b-2 border-primary font-semibold" : ""
            }`}
            onClick={() => setShowArchived(true)}
          >
            Archived
          </button>
        </div>

        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* 🧩 User list */}
      <div className="divide-y border rounded-md">
        {loading && (
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        )}
        {!loading && users.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No {showArchived ? "archived" : "active"} users found.
          </div>
        )}
        {users.map((u) => (
          <div
            key={u._id}
            className="p-4 hover:bg-muted flex justify-between items-center transition cursor-pointer"
            onClick={() => handleOpen(u)}
          >
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-sm text-muted-foreground">
                {u.role} · {u.email}
              </p>
              {u.companyId && (
                <p className="text-xs text-muted-foreground">
                  Company: {u.companyId.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 🧠 Popup dialog */}
      <UserDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        user={selectedUser}
        onRefresh={() => fetchUsers(showArchived)}
      />
    </div>
  )
}
