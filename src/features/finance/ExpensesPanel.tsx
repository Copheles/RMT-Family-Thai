import { useMemo, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/forms/NumberInput";
import { EmptyState, LoadingState } from "@/components/shared/PageStates";
import { StatCard } from "@/components/shared/pos/StatCard";
import { PosToolbar, PosToolbarActions, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import {
  PosRecordCard,
  PosRecordCardList,
} from "@/components/shared/pos/PosRecordCard";
import { PosPaginationFromMeta } from "@/components/shared/pos/PosPagination";
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import { PosModal } from "@/components/shared/pos/PosModal";
import { DeleteConfirmModal } from "@/components/shared/pos/DeleteConfirmModal";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useIsMobileLayout } from "@/hooks/useMediaQuery";
import { useUrlLimit, useUrlPage, useUrlStringParam } from "@/hooks/useUrlQuery";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { getApiErrorMessage } from "@/lib/http";
import { formatDate, formatMoneyShort } from "@/lib/format";
import {
  useThaiExpenseMutations,
  useThaiExpenses,
  type ThaiExpense,
  type ThaiExpensePayload,
} from "./expense.hooks";

const defaultExpenseForm: ThaiExpensePayload = {
  name: "",
  price: 0,
  date: new Date().toISOString().slice(0, 10),
};

export function ExpensesPanel() {
  const isMobile = useIsMobileLayout();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(
    PAGE_SIZE.expenses,
    PAGE_SIZE_OPTIONS.expenses,
  );
  const [dateFrom, setDateFrom] = useUrlStringParam("from");
  const [dateTo, setDateTo] = useUrlStringParam("to");
  const filters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, limit, appliedSearch, dateFrom, dateTo],
  );
  const { data, isLoading } = useThaiExpenses(filters);
  const { createMutation, updateMutation, deleteMutation } =
    useThaiExpenseMutations(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ThaiExpense | null>(null);
  const [deleting, setDeleting] = useState<ThaiExpense | null>(null);
  const [form, setForm] = useState<ThaiExpensePayload>(defaultExpenseForm);
  const [errorText, setErrorText] = useState("");

  const rows = data?.data ?? [];
  const expenseTotal = rows.reduce((sum, item) => sum + item.price, 0);

  function openCreate() {
    setEditing(null);
    setForm(defaultExpenseForm);
    setErrorText("");
    setModalOpen(true);
  }

  function openEdit(row: ThaiExpense) {
    setEditing(row);
    setForm({ name: row.name, price: row.price, date: row.date.slice(0, 10) });
    setErrorText("");
    setModalOpen(true);
  }

  function resetFilters() {
    resetSearch();
    setDateFrom("");
    setDateTo("");
  }

  async function submit() {
    try {
      setErrorText("");
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      setModalOpen(false);
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      setDeleteOpen(false);
    } catch (error) {
      setErrorText(getApiErrorMessage(error));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Receipt} label="Records on Page" value={rows.length} />
        <StatCard
          icon={Receipt}
          label="Page Amount"
          value={formatMoneyShort(expenseTotal)}
        />
        <StatCard
          icon={Receipt}
          label="Total Records"
          value={data?.meta.total ?? 0}
          accent
        />
      </div>

      <PosToolbar>
        <PosToolbarGroup>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Search
            </label>
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder="Expense name..."
              className="max-w-none"
            />
          </div>
          <div className="w-full min-w-[140px] sm:w-[160px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              From
            </label>
            <PosDatePicker
              value={dateFrom}
              onChange={(next) => {
                setDateFrom(next);
              }}
              placeholder="From date"
            />
          </div>
          <div className="w-full min-w-[140px] sm:w-[160px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              To
            </label>
            <PosDatePicker
              value={dateTo}
              onChange={(next) => {
                setDateTo(next);
              }}
              placeholder="To date"
            />
          </div>
        </PosToolbarGroup>
        <PosToolbarActions>
          <Button variant="outline" onClick={resetFilters}>Reset</Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="size-4" />
            Add Expense
          </Button>
        </PosToolbarActions>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading expenses..." />
      ) : rows.length === 0 ? (
        <EmptyState message="No expenses found." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {rows.map((row) => (
                <PosRecordCard
                  key={row.id}
                  title={row.name}
                  subtitle={formatDate(row.date)}
                  trailing={
                    <span className="text-sm font-semibold tabular-nums">
                      {formatMoneyShort(row.price)}
                    </span>
                  }
                  fields={[]}
                  actions={
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setDeleting(row); setDeleteOpen(true); }}
                      >
                        Delete
                      </Button>
                    </>
                  }
                />
              ))}
            </PosRecordCardList>
          ) : (
            <PosDataTable>
              <PosTable>
                <PosTableHead>
                  <PosTableRow>
                    <PosTableHeaderCell>Name</PosTableHeaderCell>
                    <PosTableHeaderCell>Price</PosTableHeaderCell>
                    <PosTableHeaderCell>Date</PosTableHeaderCell>
                    <PosTableHeaderCell>Actions</PosTableHeaderCell>
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {rows.map((row) => (
                    <PosTableRow key={row.id}>
                      <PosTableCell className="font-medium">{row.name}</PosTableCell>
                      <PosTableCell className="tabular-nums">{formatMoneyShort(row.price)}</PosTableCell>
                      <PosTableCell>{formatDate(row.date)}</PosTableCell>
                      <PosTableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => { setDeleting(row); setDeleteOpen(true); }}
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
          )}

          {data?.meta && (
            <PosPaginationFromMeta
              meta={data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.expenses}
              onPageSizeChange={setLimit}
            />
          )}
        </>
      )}

      {modalOpen && (
        <PosModal
          title={editing ? "Edit Expense" : "Create Expense"}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Price</label>
              <NumberInput
                min={0}
                step="0.01"
                value={form.price}
                onChange={(price) => setForm((prev) => ({ ...prev, price }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Date</label>
              <PosDatePicker
                value={form.date}
                onChange={(next) => setForm((prev) => ({ ...prev, date: next }))}
                placeholder="Select date"
              />
            </div>
            {errorText ? <p className="text-sm text-destructive">{errorText}</p> : null}
            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </PosModal>
      )}

      {deleteOpen && deleting && (
        <DeleteConfirmModal
          title="Delete Expense"
          message="This removes the expense permanently."
          isPending={deleteMutation.isPending}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
