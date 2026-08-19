import type { ReactNode } from "react";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import {
  cartTotals,
  cartTotalQtyTon,
  computeGrossWeightLb,
  computeNetWeightLb,
  formatQtyTon,
  formatWeightLb,
  type PackageCartLine,
} from "@/lib/packageCart";
import { getThaiSettings } from "@/features/thai/thai.api";
import { queryKeys } from "@/lib/queryKeys";
import {
  packageListDetailsDefaultValues,
  packageListDetailsSchema,
  type PackageListDetailsFormValues,
} from "./package-list.validation";

interface PackageListDetailsFormProps {
  cart: PackageCartLine[];
  isPending: boolean;
  errorMessage?: string;
  onBack: () => void;
  onSubmit: (values: PackageListDetailsFormValues) => void;
}

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-border/60 pb-2 text-xs font-bold uppercase tracking-wide text-foreground">
      {children}
    </h2>
  );
}

function OptionalLabel({ children }: { children: ReactNode }) {
  return (
    <span>
      {children}{" "}
      <span className="font-normal normal-case text-muted-foreground">(optional)</span>
    </span>
  );
}

function BoxSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border-2 border-border/80 bg-card p-4 sm:p-5 ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

export function PackageListDetailsForm({
  cart,
  isPending,
  errorMessage,
  onBack,
  onSubmit,
}: PackageListDetailsFormProps) {
  const settingsQuery = useQuery({
    queryKey: queryKeys.thai.settings,
    queryFn: getThaiSettings,
  });
  const settings = settingsQuery.data;
  const { totalNet, totalGross } = cartTotals(cart);
  const totalQtyTon = cartTotalQtyTon(cart);

  const form = useForm<PackageListDetailsFormValues>({
    resolver: zodResolver(packageListDetailsSchema),
    defaultValues: packageListDetailsDefaultValues,
  });

  useEffect(() => {
    if (!settings) return;
    const current = form.getValues();
    if (!current.companyName) form.setValue("companyName", settings.companyName);
    if (!current.companyAddress) form.setValue("companyAddress", settings.address);
    if (!current.companyCityZip) form.setValue("companyCityZip", settings.cityZip);
    if (!current.companyPhone) form.setValue("companyPhone", settings.phone);
    if (!current.companyEmail) form.setValue("companyEmail", settings.email);
  }, [form, settings]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col pb-28">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Packing list details</h1>
          <p className="text-sm text-muted-foreground">Step 2 · Shipping and consignee information</p>
        </div>
        <Button type="button" variant="outline" className="gap-1.5" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to products
        </Button>
      </div>

      <Form {...form}>
        <form
          id="package-list-details-form"
          className="space-y-4 p-4 sm:p-6"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <BoxSection>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <img
                    src="/rmt-family.png"
                    alt="Logo"
                    className="size-16 shrink-0 rounded-md border border-border/60 bg-white p-1 object-contain"
                  />
                  <div className="flex-1">
                    <SectionHeader>Exporter</SectionHeader>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Company name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyAddress"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyCityZip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>City / ZIP</OptionalLabel></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>Phone</OptionalLabel></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel><OptionalLabel>Email</OptionalLabel></FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-center text-xl font-bold tracking-wide">PACKING LIST</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="piNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>PI no.</OptionalLabel></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="piDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>PI date (DT)</OptionalLabel></FormLabel>
                        <FormControl>
                          <PosDatePicker value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="iecNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>IEC no.</OptionalLabel></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>GSTIN</OptionalLabel></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>Contract no.</OptionalLabel></FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contractDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><OptionalLabel>Contract date (DT)</OptionalLabel></FormLabel>
                        <FormControl>
                          <PosDatePicker value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="listDate"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>List date (DT)</FormLabel>
                        <FormControl>
                          <PosDatePicker value={field.value ?? ""} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </BoxSection>

          <div className="grid gap-4 lg:grid-cols-2">
            <BoxSection>
              <SectionHeader>Consignee</SectionHeader>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="consigneeName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Company name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneeAddress"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Full address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneeCityZip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>City</OptionalLabel></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneeCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>Country</OptionalLabel></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneePostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>Postal code</OptionalLabel></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneeContactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>Contact person</OptionalLabel></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>Phone</OptionalLabel></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consigneeEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>Email</OptionalLabel></FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </BoxSection>

            <BoxSection>
              <SectionHeader>Notify party</SectionHeader>
              <FormField
                control={form.control}
                name="notifyParty"
                render={({ field }) => (
                  <FormItem className="mt-3">
                    <FormLabel><OptionalLabel>Details</OptionalLabel></FormLabel>
                    <FormControl><Textarea rows={10} className="min-h-[220px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </BoxSection>
          </div>

          <BoxSection>
            <SectionHeader>Shipping</SectionHeader>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {([
                ["preCarriageBy", "Pre-carriage by"],
                ["placeOfReceipt", "Place of receipt"],
                ["countryOfOrigin", "Country of origin"],
                ["countryOfFinalDestination", "Final destination country"],
                ["vesselFlightNo", "Vessel / flight no."],
                ["portOfLoading", "Port of loading"],
                ["portOfDischarge", "Port of discharge"],
                ["finalDestination", "Final destination"],
              ] as const).map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><OptionalLabel>{label}</OptionalLabel></FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </BoxSection>

          <section className="overflow-hidden rounded-lg border-2 border-border/80 bg-card">
            <div className="border-b border-border/60 px-4 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wide">Items preview</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-xs">
                <thead className="bg-muted/40 text-[10px] font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2 text-left">SR.NO</th>
                    <th className="px-2 py-2 text-left">No. Pkgs</th>
                    <th className="px-2 py-2 text-left">Description</th>
                    <th className="px-2 py-2 text-left">Code</th>
                    <th className="px-2 py-2 text-left">Qty Total (TON)</th>
                    <th className="px-2 py-2 text-right">Net Wt</th>
                    <th className="px-2 py-2 text-right">Gross Wt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {cart.map((line, index) => (
                    <tr key={line.localId}>
                      <td className="px-2 py-2">{index + 1}</td>
                      <td className="px-2 py-2">{line.noOfPackages}</td>
                      <td className="max-w-[160px] truncate px-2 py-2">{line.description}</td>
                      <td className="px-2 py-2">{line.productCode}</td>
                      <td className="px-2 py-2">{line.qtyTotal ? `${line.qtyTotal} TON` : "—"}</td>
                      <td className="px-2 py-2 text-right">{formatWeightLb(computeNetWeightLb(line))}</td>
                      <td className="px-2 py-2 text-right">{formatWeightLb(computeGrossWeightLb(line))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <BoxSection>
            <SectionHeader>Packing detail totals</SectionHeader>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total quantity</span>
                <span className="font-medium">{formatQtyTon(totalQtyTon)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total net weight</span>
                <span className="font-medium">{formatWeightLb(totalNet)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total gross weight</span>
                <span className="font-medium">{formatWeightLb(totalGross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line items</span>
                <span className="font-medium">{cart.length}</span>
              </div>
            </div>
          </BoxSection>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </form>
      </Form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Qty {formatQtyTon(totalQtyTon)} · Net {formatWeightLb(totalNet)} · Gross {formatWeightLb(totalGross)}
          </p>
          <Button type="submit" form="package-list-details-form" disabled={isPending || cart.length === 0}>
            {isPending ? "Saving..." : "Create packing list"}
          </Button>
        </div>
      </div>
    </div>
  );
}
