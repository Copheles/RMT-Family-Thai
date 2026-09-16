import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/forms/NumberInput";
import { PosModal } from "@/components/shared/pos/PosModal";
import {
  computeGrossWeightLb,
  computeNetWeightLb,
  formatWeightLb,
  PACKAGE_GROSS_PADDING_LB,
  type PackageCartLine,
} from "@/lib/packageCart";
import { packageLineEditSchema, type PackageLineEditFormValues } from "@/features/package-list/package-list.validation";

interface PackageCartLinesProps {
  lines: PackageCartLine[];
  editingLineId: string | null;
  onEditLine: (localId: string | null) => void;
  onRemoveLine: (localId: string) => void;
  onSaveLineEdit: (localId: string, values: PackageLineEditFormValues) => void;
}

function PackageCartEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Package className="size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
      <p className="text-xs text-muted-foreground/80">Add products to build a packing list</p>
    </div>
  );
}

export function PackageCartLines({
  lines,
  editingLineId,
  onEditLine,
  onRemoveLine,
  onSaveLineEdit,
}: PackageCartLinesProps) {
  const editingLine = lines.find((line) => line.localId === editingLineId) ?? null;

  const editForm = useForm<PackageLineEditFormValues>({
    resolver: zodResolver(packageLineEditSchema),
    defaultValues: {
      noOfPackages: 1,
      qtyTotal: "",
      grossWeightAddLb: PACKAGE_GROSS_PADDING_LB,
      description: "",
    },
  });

  useEffect(() => {
    if (!editingLine) return;
    editForm.reset({
      noOfPackages: editingLine.noOfPackages,
      qtyTotal: editingLine.qtyTotal,
      grossWeightAddLb: editingLine.grossWeightAddLb ?? PACKAGE_GROSS_PADDING_LB,
      description: editingLine.description,
    });
  }, [editForm, editingLine]);

  return (
    <>
      {lines.length === 0 ? (
        <PackageCartEmpty />
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="sticky top-0 bg-muted/80 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr className="border-b border-border/70">
                <th className="px-2 py-2 text-left">SR.NO</th>
                <th className="px-2 py-2 text-left">No. Pkgs</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Code</th>
                <th className="px-2 py-2 text-left">Qty Total (TON)</th>
                <th className="px-2 py-2 text-right">Net Wt</th>
                <th className="px-2 py-2 text-right">Gross Wt</th>
                <th className="px-2 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {lines.map((line, index) => (
                <tr key={line.localId} className="hover:bg-muted/20">
                  <td className="px-2 py-2 tabular-nums">{index + 1}</td>
                  <td className="px-2 py-2 tabular-nums">{line.noOfPackages}</td>
                  <td className="max-w-[140px] truncate px-2 py-2" title={line.description}>
                    {line.description}
                  </td>
                  <td className="px-2 py-2">{line.productCode}</td>
                  <td className="px-2 py-2">{line.qtyTotal ? `${line.qtyTotal} TON` : "—"}</td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatWeightLb(computeNetWeightLb(line))}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatWeightLb(computeGrossWeightLb(line))}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => onEditLine(line.localId)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => onRemoveLine(line.localId)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingLine && (
        <PosModal title={`Edit — ${editingLine.productName}`} onClose={() => onEditLine(null)}>
          <Form {...editForm}>
            <form
              className="space-y-4"
              onSubmit={editForm.handleSubmit((values) => {
                onSaveLineEdit(editingLine.localId, values);
                onEditLine(null);
              })}
            >
              <FormField
                control={editForm.control}
                name="noOfPackages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. of packages</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={1}
                        step={1}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="qtyTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty total (TON)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        min={0}
                        placeholder="e.g. 100"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="grossWeightAddLb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gross weight add (LB)</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={0}
                        name={field.name}
                        value={field.value}
                        onBlur={field.onBlur}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description of goods</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                <p className="text-muted-foreground">
                  Net: {formatWeightLb(
                    computeNetWeightLb({
                      ...editingLine,
                      noOfPackages: editForm.watch("noOfPackages") || 1,
                    }),
                  )}
                </p>
                <p className="text-muted-foreground">
                  Gross: {formatWeightLb(
                    computeGrossWeightLb({
                      ...editingLine,
                      noOfPackages: editForm.watch("noOfPackages") || 1,
                      grossWeightAddLb: editForm.watch("grossWeightAddLb") ?? PACKAGE_GROSS_PADDING_LB,
                    }),
                  )}
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => onEditLine(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </div>
            </form>
          </Form>
        </PosModal>
      )}
    </>
  );
}
