import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { changePassword } from "@/apis/auth.api";
import { FormTextField } from "@/components/forms/FormTextField";
import { FormTextareaField } from "@/components/forms/FormTextareaField";
import { SettingsAccordionSection } from "@/components/settings/SettingsAccordionSection";
import { SettingsToolbar } from "@/components/settings/SettingsToolbar";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { LoadingState } from "@/components/shared/PageStates";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { getThaiSettings, updateThaiSettings } from "@/features/thai/thai.api";
import { DEFAULT_THAI_COMPANY_NAME } from "@/features/settings/settings.constants";
import {
  invoiceSenderSettingsSchema,
  passwordSettingsSchema,
  type InvoiceSenderSettingsFormValues,
  type PasswordSettingsFormValues,
} from "@/features/settings/settings.validation";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/http";
import { queryKeys } from "@/lib/queryKeys";

type SettingsSectionId = "general" | "invoiceSender";

function SuccessNote({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground">
      <CheckCircle2 className="size-4 shrink-0" />
      {message}
    </p>
  );
}

function SettingsErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}

export function SettingsPage() {
  const { isThai } = useAuth();
  const [openSections, setOpenSections] = useState<Record<SettingsSectionId, boolean>>({
    general: false,
    invoiceSender: false,
  });

  const setSectionOpen = useCallback((id: SettingsSectionId, open: boolean) => {
    setOpenSections((prev) => ({ ...prev, [id]: open }));
  }, []);

  const openSection = useCallback((id: SettingsSectionId) => {
    setOpenSections((prev) => ({ ...prev, [id]: true }));
  }, []);

  return (
    <PosPageShell>
      <div className="mx-auto max-w-2xl">
        <SettingsToolbar onOpenInvoiceSender={() => openSection("invoiceSender")} />

        <div className="settings-accordion-stack">
          {isThai ? (
            <GeneralSettingsSection
              open={openSections.general}
              onOpenChange={(open) => setSectionOpen("general", open)}
            />
          ) : null}

          <InvoiceSenderSettingsSection
            open={openSections.invoiceSender}
            onOpenChange={(open) => setSectionOpen("invoiceSender", open)}
          />
        </div>
      </div>
    </PosPageShell>
  );
}

function GeneralSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<PasswordSettingsFormValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => form.reset(),
  });

  return (
    <SettingsAccordionSection
      title="General"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mx-auto max-w-md space-y-3"
        >
          <FormTextField
            control={form.control}
            name="currentPassword"
            label="Current password"
            type="password"
          />
          <FormTextField
            control={form.control}
            name="newPassword"
            label="New password"
            type="password"
          />
          {mutation.isSuccess ? (
            <SuccessNote message="Password updated." />
          ) : null}
          {mutation.error ? (
            <SettingsErrorNote message={getApiErrorMessage(mutation.error)} />
          ) : null}
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}

function InvoiceSenderSettingsSection({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const settingsQuery = useQuery({
    queryKey: queryKeys.thai.settings,
    queryFn: getThaiSettings,
  });

  const defaultValues = useMemo<InvoiceSenderSettingsFormValues>(
    () => ({
      companyName: DEFAULT_THAI_COMPANY_NAME,
      address: "",
      cityZip: "",
      phone: "",
      email: "",
    }),
    [],
  );

  const form = useForm<InvoiceSenderSettingsFormValues>({
    resolver: zodResolver(invoiceSenderSettingsSchema),
    values: settingsQuery.data
      ? {
          companyName: settingsQuery.data.companyName.trim() || DEFAULT_THAI_COMPANY_NAME,
          address: settingsQuery.data.address,
          cityZip: settingsQuery.data.cityZip,
          phone: settingsQuery.data.phone,
          email: settingsQuery.data.email,
        }
      : defaultValues,
  });

  const mutation = useMutation({
    mutationFn: updateThaiSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.thai.settings, data);
    },
  });

  if (settingsQuery.isLoading) {
    return (
      <SettingsAccordionSection
        title="Invoice sender"
        open={open}
        onOpenChange={onOpenChange}
      >
        <LoadingState label="Loading settings..." />
      </SettingsAccordionSection>
    );
  }

  return (
    <SettingsAccordionSection
      title="Invoice sender"
      open={open}
      onOpenChange={onOpenChange}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mx-auto max-w-md space-y-3"
        >
          <FormTextField
            control={form.control}
            name="companyName"
            label="From name (company)"
          />
          <FormTextareaField
            control={form.control}
            name="address"
            label="Address"
            rows={3}
          />
          <FormTextField
            control={form.control}
            name="cityZip"
            label="City / ZIP"
          />
          <FormTextField control={form.control} name="phone" label="Phone" />
          <FormTextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
          />
          <p className="text-xs text-muted-foreground">
            Shown after &quot;FROM:&quot; on Thai invoice PDFs.
          </p>
          {mutation.isSuccess ? (
            <SuccessNote message="Invoice sender settings saved." />
          ) : null}
          {(mutation.error || settingsQuery.error) && (
            <SettingsErrorNote
              message={getApiErrorMessage(mutation.error ?? settingsQuery.error)}
            />
          )}
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsAccordionSection>
  );
}
