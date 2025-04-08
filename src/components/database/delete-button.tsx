// src/components/database/delete-button.tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteDatabase } from "@/app/actions/database-actions";
import { toast } from "sonner";

interface DeleteDatabaseButtonProps {
  id: string;
}

export function DeleteDatabaseButton({ id }: DeleteDatabaseButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteDatabase(id);
      setOpen(false);
      toast.success("The database has been successfully deleted.");
    } catch (error) {
      console.error("Error deleting database:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete the database"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Database</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this database connection? This
              action cannot be undone. All associated query history will also be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
