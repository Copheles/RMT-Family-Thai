import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThaiCustomerMutations } from "@/features/customers/customer.hooks";
import type { ThaiCustomerPayload } from "@/features/customers/customer.hooks";
import { listThaiCustomers } from "@/features/thai/thai.api";
import type { ThaiCustomer } from "@/features/thai/thai.types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage } from "@/lib/http";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

interface CustomerComboboxProps {
  value: string;
  selectedLabel?: string;
  onChange: (customerId: string, customer: ThaiCustomer | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  size?: "default" | "sm";
}

type ModalPanel = "list" | "add";

const defaultForm: ThaiCustomerPayload = {
  name: "",
  phone: "",
  address: "",
  notes: "",
};

function CustomerAvatar({ name }: { name: string }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CustomerPickerModal({
  value,
  onClose,
  onChange,
}: {
  value: string;
  onClose: () => void;
  onChange: (customerId: string, customer: ThaiCustomer | null) => void;
}) {
  const [panel, setPanel] = useState<ModalPanel>("list");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ThaiCustomerPayload>(defaultForm);
  const [errorText, setErrorText] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const listFilters = {
    page: 1,
    limit: 30,
    search: debouncedSearch || undefined,
  };

  const query = useQuery({
    queryKey: queryKeys.thai.customers(`picker:${debouncedSearch}`),
    queryFn: () =>
      listThaiCustomers({
        page: listFilters.page,
        limit: listFilters.limit,
        search: listFilters.search,
      }),
    enabled: panel === "list",
  });

  const { createMutation } = useThaiCustomerMutations(listFilters);
  const customers = query.data?.data ?? [];

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function selectCustomer(customer: ThaiCustomer) {
    onChange(customer.id, customer);
    onClose();
  }

  function openAddPanel() {
    setForm(defaultForm);
    setErrorText("");
    setPanel("add");
  }

  async function submitNewCustomer() {
    try {
      setErrorText("");
      if (!form.name.trim() || !form.phone.trim()) {
        setErrorText("Name and phone are required.");
        return;
      }
      const created = await createMutation.mutateAsync({
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address?.trim() || "",
        notes: form.notes?.trim() || "",
      });
      onChange(created.id, created);
      onClose();
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(480px,72vh)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 sm:slide-in-from-bottom-0"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={panel === "list" ? "Select customer" : "Add customer"}
      >
        {panel === "list" ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Select customer</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Search and choose a customer for this invoice
                </p>
              </div>
              <Button type="button" size="sm" onClick={openAddPanel}>
                <Plus className="size-4" />
                Add customer
              </Button>
            </div>

            <div className="border-b border-border/60 px-5 py-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name or phone..."
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="max-h-56 min-h-0 flex-1 overflow-y-auto p-2 sm:max-h-64">
              {query.isLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading customers...
                </div>
              )}

              {!query.isLoading && customers.length === 0 && (
                <div className="px-3 py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No customers found</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Try another search or add a new customer.
                  </p>
                  <Button type="button" size="sm" className="mt-4" onClick={openAddPanel}>
                    <Plus className="size-4" />
                    Add customer
                  </Button>
                </div>
              )}

              {!query.isLoading &&
                customers.map((customer) => {
                  const isSelected = customer.id === value;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => selectCustomer(customer)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/70",
                        isSelected && "bg-muted/60",
                      )}
                    >
                      <CustomerAvatar name={customer.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">
                          {customer.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {customer.phone}
                        </span>
                      </span>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setPanel("list")}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-foreground">Add customer</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Create and use this customer for the invoice
                </p>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Name *</label>
                <Input
                  autoFocus
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Phone *</label>
                <Input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Address</label>
                <Input
                  value={form.address ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Optional address"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Notes</label>
                <Input
                  value={form.notes ?? ""}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Optional notes"
                />
              </div>
              {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setPanel("list")}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void submitNewCustomer()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Save & select"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CustomerCombobox({
  value,
  selectedLabel,
  onChange,
  placeholder = "Select customer",
  disabled,
  id,
  size = "default",
}: CustomerComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-left leading-normal shadow-xs transition-all hover:border-ring/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "h-9 text-xs" : "h-10 text-sm",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selectedLabel && "text-muted-foreground",
          )}
        >
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </button>

      {open && (
        <CustomerPickerModal
          value={value}
          onClose={() => setOpen(false)}
          onChange={onChange}
        />
      )}
    </>
  );
}
