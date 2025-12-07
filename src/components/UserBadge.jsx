 import { useUser } from "@/context/UserContext"
 import { useState } from "react"
 import { NavLink } from "react-router-dom"
 export function UserBadge() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer"
      >
        {initials}
      </button>

      {open && (
        <div className=" right-0 bottom-12 w-56 bg-black dark:bg-neutral-900 shadow-lg rounded-md p-3 text-sm border">
          <div className="font-bold">{user.name}</div>
          <div className="text-xs opacity-80">{user.email}</div>

          {user.companyId?.name && (
            <div className="mt-2 pt-2 border-t text-xs">
              <span className="opacity-70">Company: </span>
              <span className="font-medium">{user.companyId.name}</span>
            </div>
          )}

          <div className="mt-3 pt-2 border-t">
            <NavLink
              to="/config"
              className="text-blue-500 text-xs hover:underline"
            >
              View profile
            </NavLink>
          </div>
        </div>
      )}
    </div>
  );
}
