import "./settings-accordion.css";

import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

type SettingsToolbarProps = {
  onOpenInvoiceSender?: () => void;
};

function getRoleLabel(role: string | undefined): string {
  switch (role) {
    case "super_admin":
      return "Super Admin";
    case "ygn":
      return "YGN Staff";
    case "thai":
      return "Thai Staff";
    default:
      return "Staff";
  }
}

export function SettingsToolbar({ onOpenInvoiceSender }: SettingsToolbarProps) {
  const { user } = useAuth();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  return (
    <div className="settings-toolbar">
      <div className="settings-toolbar-user">
        <div className="settings-toolbar-avatar">{initials}</div>
        <span className="settings-toolbar-role">{getRoleLabel(user?.role)}</span>
      </div>

      <div className="settings-toolbar-actions">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9"
          onClick={onOpenInvoiceSender}
          aria-label="Invoice sender settings"
        >
          <Store className="size-5" />
        </Button>
      </div>
    </div>
  );
}
