import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Pencil, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { NumberInput } from "@/components/forms/NumberInput";
import { Textarea } from "@/components/ui/textarea";
import { PosModal } from "@/components/shared/pos/PosModal";
import { formatMoneyShort } from "@/lib/format";
import { getLineTotal, type ThaiCartLine } from "@/lib/sale";
import { lineEditSchema, type LineEditFormValues } from "./sale.validation";

interface SaleCartLinesProps {
  lines: ThaiCartLine[];
  stockByProductId: Map<string, number>;
  editingLineId: string | null;
  onEditLine: (localId: string | null) => void;
  onUpdateQty: (localId: string, delta: number) => void;
  onRemoveLine: (localId: string) => void;
  onSaveLineEdit: (localId: string, values: LineEditFormValues) => void;
  readOnly?: boolean;
}

function SaleCartEmpty() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <ShoppingCart className="size-8 text-muted-foreground/50" />
      <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
      <p className="text-xs text-muted-foreground/80">Add products from the grid</p>
    </div>
  );
}

export function SaleCartLines({
  lines,
  stockByProductId,
  editingLineId,
  onEditLine,
  onUpdateQty,
  onRemoveLine,
  onSaveLineEdit,
  readOnly = false,
}: SaleCartLinesProps) {
  const editingLine = lines.find((line) => line.localId === editingLineId) ?? null;

  const editForm = useForm<LineEditFormValues>({
    resolver: zodResolver(lineEditSchema),
    defaultValues: { quantity: 1, unitPrice: 0, description: "" },
  });

  useEffect(() => {
    if (!editingLine) return;
    editForm.reset({
      quantity: editingLine.quantity,
      unitPrice: editingLine.unitPrice,
      description: editingLine.description,
    });
  }, [editForm, editingLine]);

  return (
    <>
      {lines.length === 0 ? (
        <SaleCartEmpty />
      ) : (
        <>
          <div
            className="grid shrink-0 grid-cols-[minmax(0,1fr)_88px_72px_32px] items-center gap-2 border-b border-border/70 bg-muted/50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:grid-cols-[minmax(0,1fr)_96px_80px_36px] sm:px-3.5"
            role="row"
          >
            <span>Product</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Total</span>
            <span className="sr-only">Delete</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {lines.map((line) => (
              <div
                key={line.localId}
                className="grid grid-cols-[minmax(0,1fr)_88px_72px_32px] items-center gap-2 border-b border-border/50 px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_96px_80px_36px] sm:px-3.5"
              >
                {readOnly ? (
                  <div className="min-w-0">
                    <span className="truncate text-sm font-medium text-foreground">
                      {line.productName}
                    </span>
                    <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                      {formatMoneyShort(line.unitPrice)} each
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEditLine(line.localId)}
                    className="group flex min-w-0 items-center gap-1.5 rounded-md py-0.5 pr-1 text-left transition-colors hover:text-primary"
                    title="Edit line"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                          {line.productName}
                        </span>
                        <Pencil className="size-3 shrink-0 text-muted-foreground/60 group-hover:text-primary" />
                      </span>
                      <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                        {line.unitPrice > 0
                          ? `${formatMoneyShort(line.unitPrice)} each`
                          : "Set price in edit"}
                      </span>
                    </span>
                  </button>
                )}

                <div className="flex items-center justify-center gap-0.5">
                  {readOnly ? (
                    <span className="min-w-7 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                  ) : (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-7 rounded-md"
                        onClick={() => onUpdateQty(line.localId, -1)}
                      >
                        <Minus className="size-3" />
                      </Button>
                      <span className="min-w-7 text-center text-sm font-semibold tabular-nums">
                        {line.quantity}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="size-7 rounded-md"
                        onClick={() => onUpdateQty(line.localId, 1)}
                      >
                        <Plus className="size-3" />
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-right text-sm font-semibold tabular-nums">
                  {formatMoneyShort(getLineTotal(line))}
                </p>

                <div className="flex justify-end">
                  {!readOnly && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onRemoveLine(line.localId)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!readOnly && editingLine && (
        <PosModal
          onClose={() => onEditLine(null)}
          title="Edit cart line"
          description={editingLine.productName}
        >
          <Form {...editForm}>
            <form
              className="space-y-3"
              onSubmit={editForm.handleSubmit((values) => {
                const maxStock =
                  stockByProductId.get(editingLine.productId) ?? editingLine.quantity;
                if (values.quantity > maxStock) {
                  editForm.setError("quantity", {
                    type: "manual",
                    message: `Maximum available stock is ${maxStock}`,
                  });
                  return;
                }
                onSaveLineEdit(editingLine.localId, values);
                onEditLine(null);
              })}
            >
              <FormField
                control={editForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={1}
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
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit price</FormLabel>
                    <FormControl>
                      <NumberInput
                        min={0}
                        step="0.01"
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
