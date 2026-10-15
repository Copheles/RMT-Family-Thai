import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/forms/NumberInput";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { PosToolbar, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
import { PosPaginationFromMeta } from "@/components/shared/pos/PosPagination";
import { PosSummaryCards, PosSummaryCard } from "@/components/shared/pos/PosSummaryCards";
import { useInventorySummary } from "@/features/batches/batch.hooks";
import { ThaiRestockModal } from "@/features/inventory/ThaiRestockModal";
import type { ThaiProduct } from "@/features/thai/thai.types";
import { formatMoneyShort } from "@/lib/format";
import { CategoryCombobox } from "@/components/shared/pos/CategoryCombobox";
import {
  createThaiCategory,
  createThaiProduct,
  deleteThaiProduct,
  listThaiCategories,
  listThaiProducts,
  updateThaiProduct,
} from "@/features/thai/thai.api";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import {
  useUrlEnumParam,
  useUrlLimit,
  useUrlPage,
  useUrlStringParam,
} from "@/hooks/useUrlQuery";
import {
  STOCK_STATUS_FILTERS,
  stockStatusToApi,
  type StockStatusFilter,
} from "@/lib/listFilters";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { getApiErrorMessage } from "@/lib/http";

const emptyProduct = {
  name: "",
  barcode: "",
  description: "",
  weightLb: 0,
  productCode: "",
  stockQty: 0,
  categoryId: "",
};

function stockFilterLabel(value: StockStatusFilter): string {
  switch (value) {
    case "ALL":
      return "All";
    case "IN_STOCK":
      return "In stock";
    case "LOW_STOCK":
      return "Low";
    case "OUT_OF_STOCK":
      return "Out";
    default:
      return value;
  }
}

export function InventoryPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [error, setError] = useState("");
  const [newCat, setNewCat] = useState("");
  const [restockTarget, setRestockTarget] = useState<ThaiProduct | null>(null);

  const summaryQuery = useInventorySummary();
  const summary = summaryQuery.data;

  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(
    PAGE_SIZE.inventoryProducts,
    PAGE_SIZE_OPTIONS.inventoryProducts,
  );
  const [categoryId, setCategoryId] = useUrlStringParam("category");
  const [stockFilter, setStockFilter] = useUrlEnumParam<StockStatusFilter>(
    "stock",
    "ALL",
    STOCK_STATUS_FILTERS,
  );

  const filtersKey = JSON.stringify({
    page,
    limit,
    search: appliedSearch,
    categoryId,
    stock: stockFilter,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.thai.products(filtersKey),
    queryFn: () =>
      listThaiProducts({
        page,
        limit,
        search: appliedSearch || undefined,
        categoryId: categoryId || undefined,
        stockStatus: stockStatusToApi(stockFilter),
      }),
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.thai.categories,
    queryFn: listThaiCategories,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        categoryId: form.categoryId || null,
        weightLb: Number(form.weightLb) || 0,
        stockQty: Number(form.stockQty) || 0,
      };
      if (editId) return updateThaiProduct(editId, payload);
      return createThaiProduct(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thai", "products"] });
      setOpen(false);
    },
  });

  const rows = productsQuery.data?.data ?? [];
  const meta = productsQuery.data?.meta;
  const categories = categoriesQuery.data ?? [];

  return (
    <PosPageShell>
      <PageHeader
        title="Inventory"
        description="Products, restock (paid or on credit), and stock totals."
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/purchases">Purchases</Link>
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                setEditId(null);
                setForm(emptyProduct);
                setOpen(true);
              }}
            >
              <Plus className="size-4" /> Add product
            </Button>
          </div>
        }
      />

      <PosSummaryCards className="mb-4 lg:grid-cols-3">
        <PosSummaryCard label="Products" value={summary?.productCount ?? "—"} />
        <PosSummaryCard label="Total stock qty" value={summary?.totalStockQty ?? "—"} />
        <PosSummaryCard
          label="Stock value (at cost)"
          value={
            summary ? formatMoneyShort(summary.stockValue) : "—"
          }
          accent
        />
      </PosSummaryCards>

      <PosToolbar>
        <PosToolbarGroup>
          <div className="min-w-[220px] w-full flex-1 basis-full lg:basis-auto">
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder="Search name, code, or barcode..."
              className="max-w-none"
            />
          </div>
          <div className="w-full min-w-[160px] sm:max-w-xs">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Category
            </label>
            <CategoryCombobox
              size="sm"
              className="w-full"
              options={categories}
              value={categoryId}
              placeholder="All categories"
              onChange={(next) => setCategoryId(next)}
            />
          </div>
          <div className="w-full sm:ml-auto sm:w-auto">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Stock
            </label>
            <PosFilterTabs
              value={stockFilter}
              options={STOCK_STATUS_FILTERS}
              getLabel={stockFilterLabel}
              onChange={setStockFilter}
              className="w-full sm:w-auto"
            />
          </div>
        </PosToolbarGroup>
      </PosToolbar>

      {productsQuery.isLoading ? (
        <LoadingState label="Loading products..." />
      ) : rows.length === 0 ? (
        <EmptyState message="No products found." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-border/70 bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Barcode</th>
                  <th className="px-3 py-2">Weight</th>
                  <th className="px-3 py-2">Stock</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="px-3 py-2 font-medium">{p.name}</td>
                    <td className="px-3 py-2">{p.productCode}</td>
                    <td className="px-3 py-2 tabular-nums">{p.barcode}</td>
                    <td className="px-3 py-2 tabular-nums">{p.weightLb} lb</td>
                    <td className="px-3 py-2 tabular-nums">{p.stockQty}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setRestockTarget(p)}>
                          Restock
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditId(p.id);
                            setForm({
                              name: p.name,
                              barcode: p.barcode,
                              description: p.description ?? "",
                              weightLb: p.weightLb,
                              productCode: p.productCode,
                              stockQty: p.stockQty,
                              categoryId: p.categoryId ?? "",
                            });
                            setOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            deleteThaiProduct(p.id).then(() =>
                              qc.invalidateQueries({ queryKey: ["thai", "products"] }),
                            )
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <PosPaginationFromMeta
              meta={meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.inventoryProducts}
              onPageSizeChange={setLimit}
            />
          )}
        </>
      )}

      {restockTarget ? (
        <ThaiRestockModal
          productId={restockTarget.id}
          productName={restockTarget.name}
          onClose={() => setRestockTarget(null)}
        />
      ) : null}

      {open && (
        <PosModal title={editId ? "Edit product" : "Create product"} onClose={() => setOpen(false)} wide>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Name</label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Product code</label>
                <Input value={form.productCode} onChange={(e) => setForm((p) => ({ ...p, productCode: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Barcode (6 digits)</label>
                <Input value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Weight (lb)</label>
                <NumberInput value={form.weightLb} onChange={(weightLb) => setForm((p) => ({ ...p, weightLb }))} min={0} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Stock qty</label>
                <NumberInput value={form.stockQty} onChange={(stockQty) => setForm((p) => ({ ...p, stockQty }))} min={0} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Category</label>
                <CategoryCombobox
                  options={categories}
                  value={form.categoryId}
                  placeholder="None"
                  emptyOptionLabel="None"
                  onChange={(next) => setForm((p) => ({ ...p, categoryId: next }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <Input placeholder="Quick create category" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (!newCat.trim()) return;
                  await createThaiCategory(newCat.trim());
                  setNewCat("");
                  qc.invalidateQueries({ queryKey: queryKeys.thai.categories });
                }}
              >
                Add category
              </Button>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    setError("");
                    await saveMutation.mutateAsync();
                  } catch (e) {
                    setError(getApiErrorMessage(e));
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </PosModal>
      )}
    </PosPageShell>
  );
}
