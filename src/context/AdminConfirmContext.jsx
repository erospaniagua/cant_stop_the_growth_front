import { createContext, useContext, useState, useCallback } from "react";
import UserConfirmDialog from "@/components/UserConfirmDialog";

const AdminConfirmContext = createContext(null);

export function AdminConfirmProvider({ children }) {
  const [resolver, setResolver] = useState(null);
  const [open, setOpen] = useState(false);

  const askAdminKey = useCallback(() => {
    return new Promise((resolve) => {
      setResolver(() => resolve);
      setOpen(true);
    });
  }, []);

  const handleConfirm = (key) => {
    resolver?.(key);
    cleanup();
  };

  const handleCancel = () => {
    resolver?.(null);
    cleanup();
  };

  const cleanup = () => {
    setOpen(false);
    setResolver(null);
  };

  return (
    <AdminConfirmContext.Provider value={askAdminKey}>
      {children}

      <UserConfirmDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) handleCancel();
        }}
        onConfirm={handleConfirm}
      />
    </AdminConfirmContext.Provider>
  );
}


export function useAdminConfirm() {
  return useContext(AdminConfirmContext);
}
