import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { SaleProductCard } from "@/components/shared/pos/SaleProductCard";
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import { SaleCartLines } from "@/features/sales/SaleCartLines";
import { SaleInvoiceDetailsForm } from "@/features/sales/SaleInvoiceDetailsForm";
import { SaleSuccessScreen } from "@/features/sales/SaleSuccessScreen";
import type { InvoiceDetailsFormValues } from "@/features/sales/sale.validation";
import {
  createThaiInvoice,
  listThaiCategories,
  listThaiProducts,
} from "@/features/thai/thai.api";
import type { ThaiInvoice, ThaiProduct } from "@/features/thai/thai.types";
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
import { formatMoneyShort } from "@/lib/format";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import {
  clearPersistedCart,
  getCartSubtotal,
  loadPersistedCart,
  persistCart,
  SALE_CLEAR_CART_EVENT,
  tryAddToCart,
  type ThaiCartLine,
} from "@/lib/sale";
import { resetUrlPage, writeUrlString } from "@/lib/urlQuery";
import { cn } from "@/lib/utils";

type SaleStep = "products" | "details" | "success";

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

export function SalesPage() {
  const qc = useQueryClient();
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

  const [step, setStep] = useState<SaleStep>("products");
  const [cart, setCart] = useState<ThaiCartLine[]>(() => loadPersistedCart());
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");
  const [allProducts, setAllProducts] = useState<ThaiProduct[]>([]);
  const [successInvoice, setSuccessInvoice] = useState<ThaiInvoice | null>(null);
  const [submitError, setSubmitError] = useState("");
  const {
    cartPanelRef,
    cartListRef,
    cartColumnRef,
    startWidthResize,
    startHeightResize,
    reapplyLayout,
  } = useSaleLayoutResize();

  const categoriesQuery = useQuery({
    queryKey: queryKeys.thai.categories,
    queryFn: listThaiCategories,
  });

  const productQueryKey = queryKeys.thai.products(
    JSON.stringify({
      page: productPage,
      limit: productLimit,
      search: appliedSearch,
      categoryId,
    }),
  );

  const productsQuery = useQuery({
    queryKey: productQueryKey,
    queryFn: () =>
      listThaiProducts({
        page: productPage,
        limit: productLimit,
        search: appliedSearch || undefined,
        categoryId: categoryId || undefined,
      }),
  });

  useEffect(() => {
    persistCart(cart);
  }, [cart]);

  useEffect(() => {
    function handleClearCartEvent() {
      cartRef.current = [];
      setCart([]);
      clearPersistedCart();
      showToast("info", "Cart cleared");
    }
    window.addEventListener(SALE_CLEAR_CART_EVENT, handleClearCartEvent);
    return () => window.removeEventListener(SALE_CLEAR_CART_EVENT, handleClearCartEvent);
  }, [showToast]);

  useEffect(() => {
    setAllProducts([]);
  }, [appliedSearch, categoryId, productLimit]);

  useEffect(() => {
    if (!productsQuery.data || productsQuery.isFetching) return;
    setAllProducts((prev) => {
      if (productPage === 1) return productsQuery.data.data;
      const existingIds = new Set(prev.map((p) => p.id));
      const next = productsQuery.data.data.filter((p) => !existingIds.has(p.id));
      return [...prev, ...next];
    });
  }, [productsQuery.data, productsQuery.isFetching, productPage]);

  const visibleProducts = useMemo(
    () => allProducts.filter((p) => matchesStockFilter(p, stockFilter)),
    [allProducts, stockFilter],
  );

  const stockByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of allProducts) {
      map.set(product.id, product.stockQty);
    }
    for (const line of cart) {
      if (!map.has(line.productId)) {
        map.set(line.productId, line.quantity);
      }
    }
    return map;
  }, [allProducts, cart]);

  const cartItemCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart],
  );
  const subtotal = getCartSubtotal(cart);

  const createMutation = useMutation({
    mutationFn: createThaiInvoice,
    onSuccess: (invoice) => {
      setSuccessInvoice(invoice);
      setStep("success");
      cartRef.current = [];
      setCart([]);
      clearPersistedCart();
      setSubmitError("");
      qc.invalidateQueries({ queryKey: ["thai", "products"] });
      qc.invalidateQueries({ queryKey: ["thai", "invoices"] });
      showToast("success", "Invoice created");
    },
    onError: (error) => {
      setSubmitError(getApiErrorMessage(error));
      showToast("error", getApiErrorMessage(error));
    },
  });

  const addProductToCart = useCallback(
    (product: ThaiProduct) => {
      const { lines, result } = tryAddToCart(cartRef.current, product);
      cartRef.current = lines;
      setCart(lines);

      if (result === "max_stock") {
        showToast("warning", `Maximum stock reached for ${product.name}`);
      } else if (result === "added") {
        showToast("success", `${product.name} added to cart`);
      }
    },
    [showToast],
  );

  function updateQty(localId: string, delta: number) {
    let maxStockName: string | null = null;
    const nextCart = cartRef.current
      .map((line) => {
        if (line.localId !== localId) return line;
        const nextQty = line.quantity + delta;
        if (nextQty <= 0) return null;
        const maxStock = stockByProductId.get(line.productId) ?? nextQty;
        if (nextQty > maxStock) {
          maxStockName = line.productName;
          return line;
        }
        return { ...line, quantity: nextQty };
      })
      .filter(Boolean) as ThaiCartLine[];

    cartRef.current = nextCart;
    setCart(nextCart);

    if (maxStockName) {
      showToast("warning", `Maximum stock reached for ${maxStockName}`);
    }
  }

  function removeLine(localId: string) {
    const nextCart = cartRef.current.filter((line) => line.localId !== localId);
    cartRef.current = nextCart;
    setCart(nextCart);
  }

  function handleSaveLineEdit(
    localId: string,
    patch: { quantity: number; unitPrice: number; description: string },
  ) {
    const nextCart = cartRef.current.map((line) =>
      line.localId === localId
        ? {
            ...line,
            quantity: patch.quantity,
            unitPrice: patch.unitPrice,
            description: patch.description,
          }
        : line,
    );
    cartRef.current = nextCart;
    setCart(nextCart);
  }

  function handleClearCart() {
    cartRef.current = [];
    setCart([]);
    clearPersistedCart();
    showToast("info", "Cart cleared");
  }

  function goToDetails() {
    if (cart.length === 0) {
      showToast("error", "Add at least one product");
      return;
    }
    setSubmitError("");
    setStep("details");
  }

  function handleCreateInvoice(values: InvoiceDetailsFormValues) {
    if (cart.length === 0) {
      showToast("error", "Cart is empty");
      return;
    }
    setSubmitError("");
    createMutation.mutate({
      customerId: values.customerId,
      purchaseOrderDate: values.purchaseOrderDate
        ? new Date(values.purchaseOrderDate).toISOString()
        : null,
      consigneeName: values.consignee.name,
      consigneeAddress: values.consignee.address,
      consigneeCityZip: values.consignee.cityZip,
      consigneePhone: values.consignee.phone,
      consigneeEmail: values.consignee.email,
      billToName: values.billTo.name,
      billToAddress: values.billTo.address,
      billToCityZip: values.billTo.cityZip,
      billToPhone: values.billTo.phone,
      billToEmail: values.billTo.email,
      policyText: values.policyText,
      taxAmount: values.taxAmount,
      discountAmount: values.discountAmount,
      deliveryFee: values.deliveryFee,
      paymentType: values.paymentType,
      notes: values.notes,
      items: cart.map((line) => ({
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    });
  }

  function startNewSale() {
    setSuccessInvoice(null);
    setStep("products");
    setMobileView("products");
    setSubmitError("");
  }

  useEffect(() => {
    if (step === "products") {
      reapplyLayout();
    }
  }, [step, reapplyLayout]);

  const totalProductPages = productsQuery.data?.meta.totalPages ?? 1;
  const hasMoreProducts = productPage < totalProductPages;
  const categories = categoriesQuery.data ?? [];

  if (step === "success" && successInvoice) {
    return (
      <>
        <PosToaster toasts={toasts} onDismiss={dismiss} />
        <SaleSuccessScreen invoice={successInvoice} onNewSale={startNewSale} />
      </>
    );
  }

  if (step === "details") {
    return (
      <>
        <PosToaster toasts={toasts} onDismiss={dismiss} />
        <PosPageShell className="overflow-y-auto">
          <SaleInvoiceDetailsForm
            cart={cart}
            isPending={createMutation.isPending}
            errorMessage={submitError || undefined}
            onBack={() => setStep("products")}
            onSubmit={handleCreateInvoice}
          />
        </PosPageShell>
      </>
    );
  }

  return (
    <>
      <PosToaster toasts={toasts} onDismiss={dismiss} />
      <PosPageShell
        fullHeight
        className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row"
      >
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
            Cart
            {cartItemCount > 0 && (
              <span
                className={cn(
                  "inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[11px] font-semibold leading-none",
                  mobileView === "cart"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        <div
          ref={cartPanelRef}
          className={cn(
            "min-h-0 w-full flex-col overflow-hidden border-b border-border bg-card lg:h-full lg:shrink-0 lg:border-b-0 lg:border-r",
            mobileView === "cart" ? "flex max-lg:flex-1" : "hidden lg:flex",
          )}
        >
          <div
            data-sale-cart-header
            className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-4 py-2.5 sm:px-5"
          >
            <p className="min-w-0 truncate text-sm">
              <span className="font-medium text-foreground">Cart</span>
              <span className="text-muted-foreground"> · {cartItemCount} items</span>
            </p>

            {cart.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleClearCart}
              >
                <Trash2 className="size-3.5" />
                Clear
              </Button>
            )}
          </div>

          <div
            ref={cartColumnRef}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div
              ref={cartListRef}
              className="flex min-h-0 flex-col overflow-hidden px-4 pt-3 sm:px-5 lg:px-4 lg:pt-3"
            >
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/70 bg-card">
                <SaleCartLines
                  lines={cart}
                  stockByProductId={stockByProductId}
                  editingLineId={editingLineId}
                  onEditLine={setEditingLineId}
                  onUpdateQty={updateQty}
                  onRemoveLine={removeLine}
                  onSaveLineEdit={handleSaveLineEdit}
                />
              </div>
            </div>

            <div
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize cart list"
              onPointerDown={startHeightResize}
              className="group hidden shrink-0 items-center justify-center py-1.5 lg:flex"
            >
              <div className="h-1.5 w-16 rounded-full bg-border transition-colors group-hover:bg-primary/40 group-active:bg-primary/60" />
            </div>

            <div className="flex min-h-0 shrink-0 flex-col border-t border-border bg-card px-4 py-3 sm:px-5 lg:border-t-0 lg:pb-3 lg:pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold tabular-nums">{formatMoneyShort(subtotal)}</span>
                </div>
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={cart.length === 0}
                  onClick={goToDetails}
                >
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
          aria-label="Resize cart panel"
          onPointerDown={startWidthResize}
          className="group hidden w-1.5 shrink-0 cursor-col-resize items-stretch justify-center lg:flex"
        >
          <div className="my-4 w-1 rounded-full bg-border transition-colors group-hover:bg-primary/40 group-active:bg-primary/60" />
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
                placeholder="Search products by name, code, or barcode"
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
                  onChange={(value) => setStockFilter(value)}
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
              <EmptyState message="No products. Try a different search or category filter." />
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

          {cartItemCount > 0 && (
            <div className="shrink-0 border-t border-border bg-card p-3 lg:hidden">
              <Button
                type="button"
                className="w-full gap-2"
                onClick={() => setMobileView("cart")}
              >
                View cart ({cartItemCount})
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </PosPageShell>
    </>
  );
}



