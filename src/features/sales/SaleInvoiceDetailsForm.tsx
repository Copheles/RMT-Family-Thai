import type { ReactNode } from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomerCombobox } from "@/components/shared/pos/CustomerCombobox";
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import { formatMoneyShort, todayISO } from "@/lib/format";
import { getCartSubtotal, getLineTotal, type ThaiCartLine } from "@/lib/sale";
import { getThaiSettings } from "@/features/thai/thai.api";
import type { ThaiCustomer, ThaiPaymentType } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import {
  invoiceDetailsSchema,
  type InvoiceDetailsFormValues,
} from "./sale.validation";

const PAYMENT_TYPES: ThaiPaymentType[] = ["DEBIT", "CREDIT", "CHECK", "CASH", "ZELLE"];

const PARTY_FIELDS = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "cityZip", label: "City / ZIP" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
] as const;

const emptyParty = {
  name: "",
  address: "",
  cityZip: "",
  phone: "",
  email: "",
};

function isPartyEmpty(party: typeof emptyParty): boolean {
  return PARTY_FIELDS.every(({ key }) => !party[key]?.trim());
}

function partyFromCustomer(customer: ThaiCustomer): typeof emptyParty {
  return {
    name: customer.name ?? "",
    address: customer.address ?? "",
    cityZip: "",
    phone: customer.phone ?? "",
    email: "",
  };
}

interface SaleInvoiceDetailsFormProps {
  cart: ThaiCartLine[];
  isPending: boolean;
  errorMessage?: string;
  onBack: () => void;
  onSubmit: (values: InvoiceDetailsFormValues) => void;
}

export function SaleInvoiceDetailsForm({
  cart,
  isPending,
  errorMessage,
  onBack,
  onSubmit,
}: SaleInvoiceDetailsFormProps) {
  const [customerLabel, setCustomerLabel] = useState("");
  const settingsQuery = useQuery({
    queryKey: queryKeys.thai.settings,
    queryFn: getThaiSettings,
  });
  const settings = settingsQuery.data;

  const form = useForm<InvoiceDetailsFormValues>({
    resolver: zodResolver(invoiceDetailsSchema),
    defaultValues: {
      customerId: "",
      purchaseOrderDate: "",
      consignee: emptyParty,
      billTo: emptyParty,
      policyText: "",
      taxAmount: 0,
      discountAmount: 0,
      deliveryFee: 0,
      paymentType: "CASH",
      notes: "",
    },
  });

  const watched = form.watch();
  const subtotal = getCartSubtotal(cart);
  const totalAmount =
    subtotal +
    (watched.taxAmount ?? 0) +
    (watched.deliveryFee ?? 0) -
    (watched.discountAmount ?? 0);

  function handleCustomerChange(customerId: string, customer: ThaiCustomer | null) {
    form.setValue("customerId", customerId, { shouldValidate: true });
    setCustomerLabel(customer ? `${customer.name} (${customer.phone})` : "");
    if (!customer) return;

    const fromCustomer = partyFromCustomer(customer);
    if (isPartyEmpty(form.getValues("consignee"))) {
      form.setValue("consignee", fromCustomer);
    }
    if (isPartyEmpty(form.getValues("billTo"))) {
      form.setValue("billTo", fromCustomer);
    }
  }

  function copyConsigneeToBillTo() {
    form.setValue("billTo", { ...form.getValues("consignee") });
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-28 sm:pb-24">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Invoice details</h1>
          <p className="text-sm text-muted-foreground">
            Step 2 · Review the invoice layout, then create
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to products
        </Button>
      </div>

      <Form {...form}>
        <form
          id="invoice-details-form"
          className="space-y-5 p-4 sm:p-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Letterhead */}
          <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
              <div className="flex gap-4">
                <img
                  src="/rmt-family.png"
                  alt="RMT Family"
                  className="size-16 shrink-0 rounded-md border border-border/60 object-contain bg-white p-1"
                />
                <div className="min-w-0 space-y-0.5 text-sm">
                  <p className="font-semibold text-foreground">
                    {settings?.companyName || "Company name"}
                  </p>
                  <p className="text-muted-foreground">{settings?.address || "Address"}</p>
                  <p className="text-muted-foreground">{settings?.cityZip || "City / ZIP"}</p>
                  <p className="text-muted-foreground">{settings?.phone || "Phone"}</p>
                  <p className="text-muted-foreground">{settings?.email || "Email"}</p>
                </div>
              </div>

              <div className="w-full space-y-3 sm:max-w-xs">
                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight">Invoice</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium tabular-nums">{todayISO()}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Invoice No</span>
                    <span className="text-muted-foreground">Assigned on create</span>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <FormControl>
                        <CustomerCombobox
                          value={field.value ?? ""}
                          selectedLabel={customerLabel}
                          onChange={(customerId, customer) => {
                            handleCustomerChange(customerId, customer);
                            field.onChange(customerId);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="purchaseOrderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase order date</FormLabel>
                      <FormControl>
                        <PosDatePicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          placeholder="Select date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* Consignee | Bill To */}
          <div className="grid gap-4 lg:grid-cols-2">
            <PartyFields form={form} prefix="consignee" title="Consignee" />
            <PartyFields
              form={form}
              prefix="billTo"
              title="Bill To"
              headerAction={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={copyConsigneeToBillTo}
                >
                  <Copy className="size-3.5" />
                  Copy
                </Button>
              }
            />
          </div>

          {/* Product list */}
          <section className="overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="text-sm font-semibold">Items</h2>
              <p className="text-xs text-muted-foreground">{cart.length} line(s) from cart</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5">Item</th>
                    <th className="px-3 py-2.5">Des</th>
                    <th className="px-3 py-2.5 text-right">Qty</th>
                    <th className="px-3 py-2.5 text-right">Unit Pr</th>
                    <th className="px-3 py-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {cart.map((line) => (
                    <tr key={line.localId}>
                      <td className="px-3 py-2.5 font-medium">{line.productName}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {line.description || "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{line.quantity}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {formatMoneyShort(line.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                        {formatMoneyShort(getLineTotal(line))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Policy | Totals */}
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
              <h2 className="text-sm font-semibold">Policy</h2>
              <FormField
                control={form.control}
                name="policyText"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Policy / terms and conditions"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (internal)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Optional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <section className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
              <h2 className="text-sm font-semibold">Totals</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-border/50 py-1.5">
                  <span className="text-muted-foreground">Sub Total</span>
                  <span className="font-medium tabular-nums">{formatMoneyShort(subtotal)}</span>
                </div>
                <FormField
                  control={form.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel className="mb-0">Tax</FormLabel>
                        <FormControl>
                          <Input
                            className="h-8 w-28 text-right"
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel className="mb-0">Dis</FormLabel>
                        <FormControl>
                          <Input
                            className="h-8 w-28 text-right"
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryFee"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between gap-3">
                        <FormLabel className="mb-0">Delivery</FormLabel>
                        <FormControl>
                          <Input
                            className="h-8 w-28 text-right"
                            type="number"
                            min={0}
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums text-primary">
                    {formatMoneyShort(totalAmount)}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {/* Payment type */}
          <section className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
            <h2 className="text-sm font-semibold">Payment type</h2>
            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {PAYMENT_TYPES.map((type) => {
                        const selected = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                              selected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-4 items-center justify-center rounded border text-[10px]",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40",
                              )}
                            >
                              {selected ? "✓" : ""}
                            </span>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </form>
      </Form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="text-muted-foreground">
              Subtotal {formatMoneyShort(subtotal)}
              {(watched.taxAmount ?? 0) > 0 ||
              (watched.deliveryFee ?? 0) > 0 ||
              (watched.discountAmount ?? 0) > 0
                ? " · fees applied"
                : ""}
            </p>
            <p className="text-base font-semibold tabular-nums">
              Total <span className="text-primary">{formatMoneyShort(totalAmount)}</span>
            </p>
          </div>
          <Button
            type="submit"
            form="invoice-details-form"
            className="min-w-40 shrink-0"
            disabled={isPending || cart.length === 0}
          >
            {isPending ? "Creating..." : "Create invoice"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PartyFields({
  form,
  prefix,
  title,
  headerAction,
}: {
  form: UseFormReturn<InvoiceDetailsFormValues>;
  prefix: "consignee" | "billTo";
  title: string;
  headerAction?: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {headerAction}
      </div>
      <div className="grid gap-3">
        {PARTY_FIELDS.map(({ key, label }) => (
          <FormField
            key={key}
            control={form.control}
            name={`${prefix}.${key}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>
    </section>
  );
}
