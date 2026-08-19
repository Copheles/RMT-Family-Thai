import { HugeiconsIcon } from "@hugeicons/react";
import {
  CustomerSupportIcon,
  Book01Icon,
  Chat01Icon,
  HelpCircleIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";

interface HelpCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
}

function HelpCard({ title, description, icon, accentColor }: HelpCardProps) {
  return (
    <div className="group cursor-pointer rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className={`rounded-lg p-2.5 ${accentColor} transition-transform duration-200 group-hover:scale-110`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-card-foreground">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <svg
          className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </div>
  );
}

export function HelpCenterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Help Center</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Get help and support for using the system.
        </p>
      </div>

      {/* Help Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <HelpCard
          title="Documentation"
          description="Browse user guides, tutorials, and API references."
          icon={<HugeiconsIcon icon={Book01Icon} size={20} strokeWidth={1.5} />}
          accentColor="bg-primary/5 text-primary"
        />
        <HelpCard
          title="Live Chat"
          description="Chat with our support team in real-time."
          icon={<HugeiconsIcon icon={Chat01Icon} size={20} strokeWidth={1.5} />}
          accentColor="bg-emerald-500/10 text-emerald-500"
        />
        <HelpCard
          title="FAQ"
          description="Find answers to frequently asked questions."
          icon={<HugeiconsIcon icon={HelpCircleIcon} size={20} strokeWidth={1.5} />}
          accentColor="bg-amber-500/10 text-amber-500"
        />
        <HelpCard
          title="Email Support"
          description="Send us an email and we'll respond within 24 hours."
          icon={<HugeiconsIcon icon={Mail01Icon} size={20} strokeWidth={1.5} />}
          accentColor="bg-blue-500/10 text-blue-500"
        />
        <HelpCard
          title="Contact Support"
          description="Get in touch with our dedicated support team."
          icon={<HugeiconsIcon icon={CustomerSupportIcon} size={20} strokeWidth={1.5} />}
          accentColor="bg-purple-500/10 text-purple-500"
        />
      </div>
    </div>
  );
}
