import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Grid3x3, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosSummaryCards, PosSummaryCard } from "@/components/shared/pos/PosSummaryCards";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import { PosRecordCard, PosRecordCardList } from "@/components/shared/pos/PosRecordCard";
import { PosPaginationFromMeta } from "@/components/shared/pos/PosPagination";
import { PosModal } from "@/components/shared/pos/PosModal";
import { DeleteConfirmModal } from "@/components/shared/pos/DeleteConfirmModal";
import type { ThaiCustomer, ThaiCustomerPayload } from "./customer.hooks";
import { useThaiCustomerMutations, useThaiCustomers } from "./customer.hooks";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useUrlLimit, useUrlPage } from "@/hooks/useUrlQuery";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { getApiErrorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";

const defaultCustomerForm: ThaiCustomerPayload = {
  name: "",
  phone: "",
  address: "",
  notes: "",
};

function CustomerCard({
  customer,
  onEdit,
  onDelete,
}: {
  customer: ThaiCustomer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-card transition-shadow hover:shadow-card-hover">
      <div className="flex flex-1 flex-col items-center p-5 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {customer.name.charAt(0).toUpperCase()}
        </div>
        <p className="mt-3 font-semibold text-foreground">{customer.name}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{customer.phone}</p>
        {customer.address && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{customer.address}</p>
        )}
      </div>
      <div className="flex border-t border-border/60">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Edit
        </button>
        <div className="w-px bg-border/60" />
        <button
          type="button"
          onClick={onDelete}
          className="flex-1 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function CustomersFlow() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "grid" ? "grid" : "list";

  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(
    PAGE_SIZE.customers,
    PAGE_SIZE_OPTIONS.customers,
  );
  const filters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch || undefined,
    }),
    [page, limit, appliedSearch],
  );
  const { data, isLoading } = useThaiCustomers(filters);
  const { createMutation, updateMutation, deleteMutation } = useThaiCustomerMutations(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ThaiCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<ThaiCustomer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<ThaiCustomer | null>(null);
  const [form, setForm] = useState<ThaiCustomerPayload>(defaultCustomerForm);
  const [errorText, setErrorText] = useState("");

  const customers = data?.data ?? [];

  function setView(next: "grid" | "list") {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("view", next);
      return params;
    });
  }

  function openCreate() {
    setEditingCustomer(null);
    setForm(defaultCustomerForm);
    setErrorText("");
    setModalOpen(true);
  }

  function openEdit(customer: ThaiCustomer) {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      address: customer.address ?? "",
      notes: customer.notes ?? "",
    });
    setErrorText("");
    setModalOpen(true);
  }

  async function submit() {
    try {
      setErrorText("");
      if (!form.name.trim() || !form.phone.trim()) {
        setErrorText("Name and phone are required");
        return;
      }
      if (editingCustomer) {
        await updateMutation.mutateAsync({ id: editingCustomer.id, payload: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      setModalOpen(false);
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deletingCustomer) return;
    try {
      await deleteMutation.mutateAsync(deletingCustomer.id);
      if (selectedCustomer?.id === deletingCustomer.id) {
        setSelectedCustomer(null);
      }
      setDeleteOpen(false);
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    }
  }

  return (
    <PosPageShell>
      <PageHeader
        title="Customers"
        description="Thai branch customers (separate from YGN)."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Add Customer
          </Button>
        }
      />

      <PosSummaryCards className="lg:grid-cols-2">
        <PosSummaryCard label="Active customers" value={data?.meta?.total ?? 0} accent />
        <PosSummaryCard label="On page" value={customers.length} />
      </PosSummaryCards>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PosSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={submitSearch}
          onClear={resetSearch}
          placeholder="Search name, phone, address..."
          hideButton
        />
        <div className="flex shrink-0 gap-1 rounded-xl border border-border/70 bg-muted/25 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              view === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Grid3x3 className="size-3.5" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              view === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" />
            List
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4",
          selectedCustomer && "xl:grid-cols-[1.35fr_0.85fr]",
        )}
      >
        <div>
          {isLoading ? (
            <LoadingState label="Loading customers..." />
          ) : customers.length === 0 ? (
            <EmptyState message="No customers found." />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.id}
                  customer={customer}
                  onEdit={() => openEdit(customer)}
                  onDelete={() => {
                    setDeletingCustomer(customer);
                    setDeleteOpen(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              <PosRecordCardList>
                {customers.map((customer) => (
                  <PosRecordCard
                    key={customer.id}
                    title={customer.name}
                    subtitle={customer.phone}
                    leading={
                      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                    }
                    fields={[
                      { label: "Address", value: customer.address || "—" },
                      { label: "Notes", value: customer.notes || "—" },
                    ]}
                    actions={
                      <>
                        <Button size="sm" variant="outline" onClick={() => openEdit(customer)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setDeletingCustomer(customer);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </>
                    }
                  />
                ))}
              </PosRecordCardList>

              <div className="hidden md:block">
                <PosDataTable>
                  <PosTable>
                    <PosTableHead>
                      <PosTableRow>
                        <PosTableHeaderCell>Name</PosTableHeaderCell>
                        <PosTableHeaderCell>Phone</PosTableHeaderCell>
                        <PosTableHeaderCell>Address</PosTableHeaderCell>
                        <PosTableHeaderCell>Actions</PosTableHeaderCell>
                      </PosTableRow>
                    </PosTableHead>
                    <PosTableBody>
                      {customers.map((customer) => (
                        <PosTableRow
                          key={customer.id}
                          className={
                            selectedCustomer?.id === customer.id
                              ? "bg-primary/[0.04]"
                              : undefined
                          }
                        >
                          <PosTableCell>
                            <button
                              type="button"
                              className="font-medium hover:text-primary"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              {customer.name}
                            </button>
                          </PosTableCell>
                          <PosTableCell>{customer.phone}</PosTableCell>
                          <PosTableCell className="text-muted-foreground">
                            {customer.address ?? "—"}
                          </PosTableCell>
                          <PosTableCell>
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="outline" onClick={() => openEdit(customer)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setDeletingCustomer(customer);
                                  setDeleteOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </PosTableCell>
                        </PosTableRow>
                      ))}
                    </PosTableBody>
                  </PosTable>
                </PosDataTable>
              </div>
            </>
          )}

          {data?.meta && (
            <PosPaginationFromMeta
              meta={data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.customers}
              onPageSizeChange={setLimit}
            />
          )}
        </div>

        {selectedCustomer ? (
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-card">
            <div className="flex items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <span className="text-base font-bold">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Customer Detail
                </p>
                <h4 className="text-lg font-bold">{selectedCustomer.name}</h4>
              </div>
            </div>
            <dl className="mt-5 space-y-3 border-t border-border/60 pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Phone</dt>
                <dd className="font-medium">{selectedCustomer.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="text-muted-foreground">{selectedCustomer.address || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Notes</dt>
                <dd className="text-muted-foreground">{selectedCustomer.notes || "—"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
      </div>

      {modalOpen && (
        <PosModal
          title={editingCustomer ? "Edit Customer" : "Create Customer"}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Phone</label>
              <Input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Address</label>
              <Input
                value={form.address ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Notes</label>
              <Input
                value={form.notes ?? ""}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              />
            </div>
            {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={submit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </PosModal>
      )}

      {deleteOpen && deletingCustomer && (
        <DeleteConfirmModal
          title="Delete Customer"
          message="This marks the customer as inactive."
          isPending={deleteMutation.isPending}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </PosPageShell>
  );
}
