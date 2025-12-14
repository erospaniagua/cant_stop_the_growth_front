import { useUser } from "@/context/UserContext";
import { useState, useRef, useEffect } from "react";

export function UserBadge() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase();

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative flex justify-center">
      {/* Avatar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="
          w-10 h-10 rounded-full
          bg-blue-600 text-white
          flex items-center justify-center
          text-sm font-semibold
          hover:opacity-90 transition
        "
      >
        {initials}
      </button>

      {/* Info card */}
      {open && (
        <div
          className="
            absolute bottom-12 left-0 translate-x-4
    w-60
    rounded-lg p-4
    bg-white dark:bg-neutral-900
    text-neutral-900 dark:text-neutral-100
    border border-neutral-200 dark:border-neutral-800
    shadow-xl
    text-sm
    z-50
          "
        >
          <div className="font-semibold">{user.name}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 break-all">
            {user.email}
          </div>

          {user.company?.name && (
            <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Company
              </div>
              <div className="font-medium">
                {user.company.name}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
