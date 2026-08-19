import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  UserGroupIcon,
  Notification01Icon,
  Shield01Icon,
  ColorsIcon,
  Database01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, LoadingState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { getThaiSettings, updateThaiSettings } from "@/features/thai/thai.api";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";

type SettingsSectionId = "general" | null;

interface SettingsCardProps {
  id: SettingsSectionId | "placeholder";
  title: string;
  description: string;
  icon: ReactNode;
  accentColor: string;
  onSelect?: () => void;
}

function SettingsCard({
  title,
  description,
  icon,
  accentColor,
  onSelect,
}: SettingsCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full cursor-pointer rounded-xl border border-border/70 bg-card p-4 text-left shadow-card transition-all duration-200 sm:p-5",
        "hover:border-primary/25 hover:shadow-card-hover",
        onSelect ? "" : "cursor-default",
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={cn(
            "shrink-0 rounded-lg p-2.5 transition-transform duration-200 group-hover:scale-105",
            accentColor,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-semibold text-card-foreground">{title}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <ChevronRight
          className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </div>
    </button>
  );
}

const SETTINGS_ITEMS: Omit<SettingsCardProps, "onSelect">[] = [
  {
    id: "general",
    title: "General Settings",
    description: "Company letterhead used on Thai invoices.",
    icon: <HugeiconsIcon icon={Settings01Icon} size={20} strokeWidth={1.5} />,
    accentColor: "bg-primary/5 text-primary",
  },
  {
    id: "placeholder",
    title: "User Management",
    description: "Manage users, roles, and permissions.",
    icon: <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.5} />,
    accentColor: "bg-blue-500/10 text-blue-500",
  },
  {
    id: "placeholder",
    title: "Notifications",
    description: "Configure email and push notification preferences.",
    icon: <HugeiconsIcon icon={Notification01Icon} size={20} strokeWidth={1.5} />,
    accentColor: "bg-amber-500/10 text-amber-500",
  },
  {
    id: "placeholder",
    title: "Security",
    description: "Manage passwords, sessions, and two-factor auth.",
    icon: <HugeiconsIcon icon={Shield01Icon} size={20} strokeWidth={1.5} />,
    accentColor: "bg-emerald-500/10 text-emerald-500",
  },
  {
    id: "placeholder",
    title: "Appearance",
    description: "Customize theme, colors, and layout options.",
    icon: <HugeiconsIcon icon={ColorsIcon} size={20} strokeWidth={1.5} />,
    accentColor: "bg-purple-500/10 text-purple-500",
  },
  {
    id: "placeholder",
    title: "Data & Backup",
    description: "Export data, manage backups, and storage settings.",
    icon: <HugeiconsIcon icon={Database01Icon} size={20} strokeWidth={1.5} />,
    accentColor: "bg-cyan-500/10 text-cyan-500",
  },
];

function GeneralSettingsForm() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.thai.settings,
    queryFn: getThaiSettings,
  });
  const [form, setForm] = useState({
    companyName: "",
    address: "",
    cityZip: "",
    phone: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        companyName: data.companyName,
        address: data.address,
        cityZip: data.cityZip,
        phone: data.phone,
        email: data.email,
      });
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => updateThaiSettings(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.thai.settings });
      setSaved(true);
    },
  });

  if (isLoading) {
    return <LoadingState label="Loading settings..." />;
  }

  return (
    <div className="max-w-xl space-y-3 rounded-xl border border-border/70 bg-card p-5 shadow-card">
      <div>
        <h3 className="text-sm font-semibold">Company letterhead</h3>
        <p className="text-xs text-muted-foreground">
          Shown on Thai invoices as the shop header.
        </p>
      </div>
      {(
        [
          ["companyName", "Company name"],
          ["address", "Address"],
          ["cityZip", "City / ZIP"],
          ["phone", "Phone"],
          ["email", "Email"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground">{label}</label>
          <Input
            value={form[key]}
            onChange={(e) => {
              setSaved(false);
              setForm((prev) => ({ ...prev, [key]: e.target.value }));
            }}
          />
        </div>
      ))}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {saved && !error ? (
        <p className="text-sm text-emerald-600">Settings saved.</p>
      ) : null}
      <Button
        onClick={async () => {
          try {
            setError("");
            setSaved(false);
            await mutation.mutateAsync();
          } catch (e) {
            setError(getApiErrorMessage(e));
          }
        }}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "Saving..." : "Save settings"}
      </Button>
    </div>
  );
}

export function SettingsPage() {
  const [section, setSection] = useState<SettingsSectionId>(null);

  return (
    <PosPageShell>
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Settings"
          description="Manage system settings and preferences."
        />

        {section === "general" ? (
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => setSection(null)}
            >
              <ArrowLeft className="size-4" />
              Back to settings
            </Button>
            <GeneralSettingsForm />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5 xl:grid-cols-3">
            {SETTINGS_ITEMS.map((item) => (
              <SettingsCard
                key={item.title}
                {...item}
                onSelect={
                  item.id === "general" ? () => setSection("general") : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </PosPageShell>
  );
}
