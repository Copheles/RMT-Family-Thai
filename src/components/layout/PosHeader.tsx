import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  HelpCircle,
  LogOut,
  Maximize2,
  Minimize2,
  Monitor,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { useAuth } from "@/hooks/useAuth";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { performLogout } from "@/components/auth/AuthBootstrap";
import { useAppDispatch } from "@/redux/hooks";

function HeaderIconButton({
  title,
  onClick,
  disabled,
  active,
  children,
  className,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground",
        active && "bg-muted text-primary",
        className,
      )}
    >
      {children}
    </Button>
  );
}

function HeaderDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("mx-1 h-5 w-px shrink-0 bg-border", className)}
    />
  );
}

function ProfileMenuItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {label}
    </button>
  );
}

export function PosHeader() {
  const { user } = useAuth();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showBreadcrumb = location.pathname !== "/dashboard";
  const showSettings = user?.role === "super_admin";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  async function handleLogout() {
    setIsProfileOpen(false);
    await performLogout(dispatch);
    navigate("/login");
  }

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "U";

  const ThemeIcon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  const themeLabel =
    theme === "system"
      ? "System theme"
      : resolvedTheme === "dark"
        ? "Dark theme"
        : "Light theme";

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-card/80 shadow-[0_1px_3px_rgba(15,23,42,0.04)] backdrop-blur-xl supports-backdrop-filter:bg-card/70">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            <BrandLogo
              compact={false}
              onClick={() => navigate("/dashboard")}
            />
            {showBreadcrumb && (
              <>
                <div
                  aria-hidden
                  className="hidden h-8 w-px shrink-0 bg-border sm:block"
                />
                <Breadcrumb className="min-w-0 flex-1" />
              </>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {showSettings && (
              <HeaderIconButton
                title="Settings"
                onClick={() => navigate("/settings")}
              >
                <Settings className="size-4" />
              </HeaderIconButton>
            )}

            <HeaderIconButton
              title={themeLabel}
              onClick={cycleTheme}
              className="hidden md:inline-flex"
            >
              <ThemeIcon className="size-4" />
            </HeaderIconButton>

            {!isFullscreen ? (
              <HeaderIconButton title="Full screen" onClick={() => void enterFullscreen()}>
                <Maximize2 className="size-4" />
              </HeaderIconButton>
            ) : (
              <HeaderIconButton title="Exit full screen" onClick={() => void exitFullscreen()}>
                <Minimize2 className="size-4" />
              </HeaderIconButton>
            )}

            <HeaderDivider />

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-muted",
                  isProfileOpen && "bg-muted",
                )}
                aria-label="Profile menu"
                aria-expanded={isProfileOpen}
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="hidden min-w-0 text-left lg:block">
                  <p className="max-w-28 truncate text-xs font-semibold capitalize leading-tight text-foreground">
                    {user?.username}
                  </p>
                  <p className="max-w-28 truncate text-[10px] capitalize leading-tight text-muted-foreground">
                    {user?.role ?? "Staff"}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
                    isProfileOpen && "rotate-180",
                  )}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-border bg-card p-1.5 shadow-sm">
                  <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold capitalize text-foreground">
                        {user?.username}
                      </p>
                      <p className="truncate text-xs capitalize text-muted-foreground">
                        {user?.role ?? "Staff"}
                      </p>
                    </div>
                  </div>

                  <div className="my-1 h-px bg-border" />

                  <div className="py-0.5">
                    {showSettings && (
                      <ProfileMenuItem
                        icon={Settings}
                        label="Settings"
                        onClick={() => {
                          navigate("/settings");
                          setIsProfileOpen(false);
                        }}
                      />
                    )}
                    <ProfileMenuItem
                      icon={HelpCircle}
                      label="Help Center"
                      onClick={() => {
                        navigate("/help");
                        setIsProfileOpen(false);
                      }}
                    />
                    <ProfileMenuItem
                      icon={ThemeIcon}
                      label={themeLabel}
                      onClick={cycleTheme}
                    />
                  </div>

                  <div className="my-1 h-px bg-border" />

                  <ProfileMenuItem
                    icon={LogOut}
                    label="Logout"
                    destructive
                    onClick={handleLogout}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
