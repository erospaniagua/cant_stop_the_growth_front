import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function UserConfirmDialog({ open, onOpenChange, onConfirm }) {
  const [key, setKey] = useState("")

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

        <p className="text-sm text-muted-foreground">
          To confirm this action, please enter the master key.
        </p>

        <input
          className="border rounded p-2 w-full mt-3"
          type="password"
          placeholder="Enter master key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        <DialogFooter className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
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
