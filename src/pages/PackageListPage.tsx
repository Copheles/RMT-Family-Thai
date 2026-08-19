import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { SaleProductCard } from "@/components/shared/pos/SaleProductCard";
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import { PackageCartLines } from "@/features/package-list/PackageCartLines";
import { PackageListDetailsForm } from "@/features/package-list/PackageListDetailsForm";
import type { PackageListDetailsFormValues } from "@/features/package-list/package-list.validation";
import type { PackageLineEditFormValues } from "@/features/package-list/package-list.validation";
import {
  createThaiPackageList,
  listThaiCategories,
  listThaiProducts,
} from "@/features/thai/thai.api";
import type { ThaiProduct } from "@/features/thai/thai.types";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import {
  useUrlEnumParam,
  useUrlLimit,
  useUrlPage,
  useUrlQueryUpdater,
  useUrlStringParam,
} from "@/hooks/useUrlQuery";
import { useSaleLayoutResize } from "@/hooks/usePointerResize";
import { STOCK_STATUS_FILTERS, type StockStatusFilter } from "@/lib/listFilters";
import { getApiErrorMessage } from "@/lib/http";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import {
  addProductToPackageCart,
  cartTotals,
  cartTotalQtyTon,
  clearPersistedPackageCart,
  computeGrossWeightLb,
  computeNetWeightLb,
  formatQtyTon,
  formatWeightLb,
  loadPersistedPackageCart,
  persistPackageCart,
  type PackageCartLine,
} from "@/lib/packageCart";
import { resetUrlPage, writeUrlString } from "@/lib/urlQuery";
import { cn } from "@/lib/utils";

type PackageStep = "products" | "details";

function matchesStockFilter(product: ThaiProduct, filter: StockStatusFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "OUT_OF_STOCK") return product.stockQty <= 0;
  if (filter === "LOW_STOCK") return product.stockQty > 0 && product.stockQty <= 5;
  return product.stockQty > 0;
}

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

function toApiDate(value?: string): string | null {
  if (!value?.trim()) return null;
  return value.includes("T") ? value : new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function PackageListPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { toasts, showToast, dismiss } = usePosToast();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const updateUrl = useUrlQueryUpdater();
  const [categoryId] = useUrlStringParam("category");
  const [productPage, setProductPage] = useUrlPage();
  const [productLimit] = useUrlLimit(
    PAGE_SIZE.saleProducts,
    PAGE_SIZE_OPTIONS.saleProducts,
  );
  const [stockFilter, setStockFilter] = useUrlEnumParam<StockStatusFilter>(
    "stock",
    "ALL",
    STOCK_STATUS_FILTERS,
  );

  const [step, setStep] = useState<PackageStep>("products");
  const [cart, setCart] = useState<PackageCartLine[]>(() => loadPersistedPackageCart());
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");
  const [allProducts, setAllProducts] = useState<ThaiProduct[]>([]);
  const [submitError, setSubmitError] = useState("");
  const {
    cartPanelRef,
    cartListRef,
    cartColumnRef,
    startWidthResize,
    startHeightResize,
    reapplyLayout,
  } = useSaleLayoutResize();

  useEffect(() => {
    persistPackageCart(cart);
  }, [cart]);

  const categoriesQuery = useQuery({
    queryKey: queryKeys.thai.categories,
    queryFn: listThaiCategories,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.thai.products(
      JSON.stringify({
        page: productPage,
        limit: productLimit,
        search: appliedSearch,
        categoryId,
      }),
    ),
    queryFn: () =>
      listThaiProducts({
        page: productPage,
        limit: productLimit,
        search: appliedSearch || undefined,
        categoryId: categoryId || undefined,
      }),
  });

  useEffect(() => {
    if (!productsQuery.data?.data) return;
    setAllProducts((prev) => {
      if (productPage === 1) return productsQuery.data.data;
      const existingIds = new Set(prev.map((p) => p.id));
      const next = productsQuery.data.data.filter((p) => !existingIds.has(p.id));
      return [...prev, ...next];
    });
  }, [productsQuery.data, productPage]);

  const visibleProducts = useMemo(
    () => allProducts.filter((p) => matchesStockFilter(p, stockFilter)),
    [allProducts, stockFilter],
  );

  const { totalNet, totalGross } = cartTotals(cart);
  const totalQtyTon = cartTotalQtyTon(cart);

  const createMutation = useMutation({
    mutationFn: createThaiPackageList,
    onSuccess: (list) => {
      cartRef.current = [];
      setCart([]);
      clearPersistedPackageCart();
      setSubmitError("");
      qc.invalidateQueries({ queryKey: ["thai", "packageLists"] });
      navigate(`/package-list?created=${list.id}`);
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
      showToast("error", getApiErrorMessage(error));
    },
  });

  const addProductToCart = useCallback(
    (product: ThaiProduct) => {
      const next = addProductToPackageCart(cartRef.current, product);
      if (next.length === cartRef.current.length) {
        showToast("warning", "Product could not be added");
        return;
      }
      cartRef.current = next;
      setCart(next);
      showToast("success", `${product.name} added`);
    },
    [showToast],
  );

  function removeLine(localId: string) {
    const next = cartRef.current.filter((line) => line.localId !== localId);
    cartRef.current = next;
    setCart(next);
  }

  function handleSaveLineEdit(localId: string, patch: PackageLineEditFormValues) {
    const next = cartRef.current.map((line) =>
      line.localId === localId
        ? {
            ...line,
            noOfPackages: patch.noOfPackages,
            qtyTotal: patch.qtyTotal,
            grossWeightAddLb: patch.grossWeightAddLb,
            description: patch.description,
          }
        : line,
    );
    cartRef.current = next;
    setCart(next);
  }

  function handleClearCart() {
    cartRef.current = [];
    setCart([]);
    clearPersistedPackageCart();
    showToast("info", "Cart cleared");
  }

  function goToDetails() {
    if (cart.length === 0) {
      showToast("error", "Add at least one product");
      return;
    }
    const missingQty = cart.filter((line) => !line.qtyTotal.trim());
    if (missingQty.length > 0) {
      showToast("error", "Enter qty total for each line (edit row in cart)");
      return;
    }
    const invalidQty = cart.filter((line) => !/^\d+(\.\d+)?$/.test(line.qtyTotal.trim()));
    if (invalidQty.length > 0) {
      showToast("error", "Qty total must be a number in tons for each line");
      return;
    }
    setSubmitError("");
    setStep("details");
  }

  function handleCreate(values: PackageListDetailsFormValues) {
    if (cart.length === 0) {
      showToast("error", "Cart is empty");
      return;
    }
    setSubmitError("");
    const { listDate, ...rest } = values;
    const totalQtyTon = cartTotalQtyTon(cart);
    createMutation.mutate({
      ...rest,
      date: toApiDate(listDate) ?? undefined,
      totalQtyLabel: formatQtyTon(totalQtyTon),
      companyEmail: values.companyEmail || undefined,
      companyCityZip: values.companyCityZip || undefined,
      companyPhone: values.companyPhone || undefined,
      consigneeEmail: values.consigneeEmail || undefined,
      consigneeCityZip: values.consigneeCityZip || undefined,
      consigneeCountry: values.consigneeCountry || undefined,
      consigneePostalCode: values.consigneePostalCode || undefined,
      consigneeContactPerson: values.consigneeContactPerson || undefined,
      piDate: toApiDate(values.piDate),
      contractDate: toApiDate(values.contractDate),
      items: cart.map((line) => ({
        productId: line.productId,
        noOfPackages: line.noOfPackages,
        description: line.description,
        productCode: line.productCode,
        qtyTotal: line.qtyTotal,
        netWeightLb: computeNetWeightLb(line),
        grossWeightLb: computeGrossWeightLb(line),
      })),
    });
  }

  useEffect(() => {
    if (step === "products") reapplyLayout();
  }, [step, reapplyLayout]);

  const totalProductPages = productsQuery.data?.meta.totalPages ?? 1;
  const hasMoreProducts = productPage < totalProductPages;
  const categories = categoriesQuery.data ?? [];

  if (step === "details") {
    return (
      <>
        <PosToaster toasts={toasts} onDismiss={dismiss} />
        <PosPageShell className="overflow-y-auto">
          <PackageListDetailsForm
            cart={cart}
            isPending={createMutation.isPending}
            errorMessage={submitError || undefined}
            onBack={() => setStep("products")}
            onSubmit={handleCreate}
          />
        </PosPageShell>
      </>
    );
  }

  return (
    <>
      <PosToaster toasts={toasts} onDismiss={dismiss} />
      <PosPageShell fullHeight className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
        <div className="flex shrink-0 gap-1 border-b border-border bg-card p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileView("products")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mobileView === "products"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setMobileView("cart")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
              mobileView === "cart"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            Cart ({cart.length})
          </button>
        </div>

        <div
          ref={cartPanelRef}
          className={cn(
            "min-h-0 w-full flex-col overflow-hidden border-b border-border bg-card lg:h-full lg:shrink-0 lg:border-b-0 lg:border-r",
            mobileView === "cart" ? "flex max-lg:flex-1" : "hidden lg:flex",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5">
            <p className="text-sm font-medium">Packing cart · {cart.length} items</p>
            {cart.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={handleClearCart}
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            )}
          </div>

          <div ref={cartColumnRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div ref={cartListRef} className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pt-2 lg:px-3">
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card">
                <PackageCartLines
                  lines={cart}
                  editingLineId={editingLineId}
                  onEditLine={setEditingLineId}
                  onRemoveLine={removeLine}
                  onSaveLineEdit={handleSaveLineEdit}
                />
              </div>
            </div>

            <div
              role="separator"
              aria-orientation="horizontal"
              onPointerDown={startHeightResize}
              className="group hidden shrink-0 items-center justify-center py-1.5 lg:flex"
            >
              <div className="h-1.5 w-16 rounded-full bg-border transition-colors group-hover:bg-primary/40" />
            </div>

            <div className="shrink-0 border-t border-border px-4 py-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total quantity</span>
                  <span className="font-semibold tabular-nums">{formatQtyTon(totalQtyTon)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net weight</span>
                  <span className="font-semibold tabular-nums">{formatWeightLb(totalNet)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross weight</span>
                  <span className="font-semibold tabular-nums">{formatWeightLb(totalGross)}</span>
                </div>
                <Button type="button" className="w-full gap-2" disabled={cart.length === 0} onClick={goToDetails}>
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          onPointerDown={startWidthResize}
          className="group hidden w-1.5 shrink-0 cursor-col-resize items-stretch justify-center lg:flex"
        >
          <div className="my-4 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/40" />
        </div>

        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col",
            mobileView === "products" ? "flex" : "hidden lg:flex",
          )}
        >
          <div className="shrink-0 border-b border-border/80 bg-card px-3 py-2 sm:px-4">
            <div className="space-y-2">
              <PosSearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSubmit={() => {
                  submitSearch();
                  setAllProducts([]);
                }}
                onClear={() => {
                  resetSearch();
                  setAllProducts([]);
                }}
                placeholder="Search products..."
                className="w-full max-w-none flex-1"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Category"
                  value={categoryId}
                  className="h-9 min-w-[160px] flex-1 text-sm sm:max-w-[220px]"
                  onChange={(event) => {
                    updateUrl((params) => {
                      writeUrlString(params, "category", event.target.value);
                      resetUrlPage(params);
                    });
                    setAllProducts([]);
                  }}
                >
                  <option value="">All categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
                {categoryId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1"
                    onClick={() => {
                      updateUrl((params) => {
                        params.delete("category");
                        resetUrlPage(params);
                      });
                      setAllProducts([]);
                    }}
                  >
                    <RotateCcw className="size-3.5" />
                    Reset
                  </Button>
                )}
                <PosFilterTabs
                  value={stockFilter}
                  options={STOCK_STATUS_FILTERS}
                  onChange={setStockFilter}
                  getLabel={stockFilterLabel}
                  align="end"
                  className="ml-auto"
                />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {productsQuery.isLoading && allProducts.length === 0 ? (
              <LoadingState label="Loading products…" />
            ) : productsQuery.isError ? (
              <ErrorState message={getApiErrorMessage(productsQuery.error)} />
            ) : visibleProducts.length === 0 ? (
              <EmptyState message="No products found." />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => (
                    <SaleProductCard
                      key={product.id}
                      name={product.name}
                      stockQty={product.stockQty}
                      sku={product.productCode}
                      onAdd={() => addProductToCart(product)}
                    />
                  ))}
                </div>
                {hasMoreProducts && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={productsQuery.isFetching}
                      onClick={() => setProductPage(productPage + 1)}
                    >
                      {productsQuery.isFetching ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Loading…
                        </>
                      ) : (
                        "Load more"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="shrink-0 border-t border-border bg-card p-3 lg:hidden">
              <Button type="button" className="w-full gap-2" onClick={() => setMobileView("cart")}>
                View cart ({cart.length})
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </PosPageShell>
    </>
  );
}
