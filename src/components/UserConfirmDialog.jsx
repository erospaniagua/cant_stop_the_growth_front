import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function UserConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  message, // 🆕 optional
}) {
  const [key, setKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  const handleConfirm = () => {
    if (!key.trim()) {
      alert("Please enter the master key.")
      return
    }
    onConfirm(key)
    setKey("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Admin Action</DialogTitle>
        </DialogHeader>

        {/* Optional contextual warning */}
        {message && (
          <div className="mb-3 rounded border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
            {message}
          </div>
        )}

        {/* Default explanation (always shown) */}
        <p className="text-sm text-muted-foreground mb-3">
          To confirm this action, please enter the admin master key.
        </p>

        {/* Master key input */}
        <input
          className="border rounded p-2 w-full"
          type={showKey ? "text" : "password"}
          placeholder="Enter master key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        {/* Show password toggle */}
        <label className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showKey}
            onChange={(e) => setShowKey(e.target.checked)}
            className="h-4 w-4 accent-red-500"
          />
          <span>Show master key</span>
        </label>

        <DialogFooter className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setKey("")
              onOpenChange(false)
            }}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
