import { Button } from "@/components/ui/button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  onCancel,
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel}>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-5 flex justify-end gap-2 border-t border-border/60 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? "Please wait..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
}
