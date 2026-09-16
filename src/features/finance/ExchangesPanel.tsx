import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/forms/NumberInput";
import { Select } from "@/components/ui/select";
import { EmptyState, LoadingState } from "@/components/shared/PageStates";
import { StatCard } from "@/components/shared/pos/StatCard";
import { PosToolbar, PosToolbarGroup, PosToolbarActions } from "@/components/shared/pos/PosToolbar";
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
import {
  useUrlEnumParam,
  useUrlLimit,
  useUrlPage,
} from "@/hooks/useUrlQuery";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { getApiErrorMessage } from "@/lib/http";
import { formatDate, formatMoneyShort } from "@/lib/format";
import type { ExchangeType } from "@/features/thai/thai.types";
import {
  useThaiExchangeMutations,
  useThaiExchanges,
  type ThaiExchange,
  type ThaiExchangePayload,
} from "./exchange.hooks";

const defaultExchangeForm: ThaiExchangePayload = {
  name: "",
  amountMmk: 0,
  rateMmkPerUsd: 0,
  senderName: "",
  receiverName: "",
  type: "OTHER",
  date: new Date().toISOString().slice(0, 10),
};

const exchangeTypes: ExchangeType[] = ["IMPORT", "EXPORT", "OTHER"];
const EXCHANGE_TYPE_FILTERS = ["ALL", "IMPORT", "EXPORT", "OTHER"] as const;

export function ExchangesPanel() {
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
    PAGE_SIZE.exchanges,
    PAGE_SIZE_OPTIONS.exchanges,
  );
  const [typeFilter, setTypeFilter] = useUrlEnumParam<
    (typeof EXCHANGE_TYPE_FILTERS)[number]
  >("type", "ALL", EXCHANGE_TYPE_FILTERS);
  const filters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch,
      type: typeFilter === "ALL" ? undefined : typeFilter,
    }),
    [page, limit, appliedSearch, typeFilter],
  );
  const { data, isLoading } = useThaiExchanges(filters);
  const { createMutation, updateMutation, deleteMutation } =
    useThaiExchangeMutations(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ThaiExchange | null>(null);
  const [deleting, setDeleting] = useState<ThaiExchange | null>(null);
  const [form, setForm] = useState<ThaiExchangePayload>(defaultExchangeForm);
  const [errorText, setErrorText] = useState("");

  const rows = data?.data ?? [];
  const mmkTotal = rows.reduce((sum, item) => sum + item.amountMmk, 0);

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

  function resetFilters() {
    resetSearch();
    setTypeFilter("ALL");
  }

  function openEdit(row: ThaiExchange) {
    setEditing(row);
    setForm({
      name: row.name,
      amountMmk: row.amountMmk,
      rateMmkPerUsd: row.rateMmkPerUsd,
      senderName: row.senderName,
      receiverName: row.receiverName,
      type: row.type,
      date: row.date.slice(0, 10),
    });
    setErrorText("");
    setModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard icon={Wallet} label="Records on Page" value={rows.length} />
        <StatCard
          icon={Wallet}
          label="Page total"
          value={formatMoneyShort(mmkTotal)}
        />
        <StatCard
          icon={Wallet}
          label="Total Records"
          value={data?.meta.total ?? 0}
          accent
        />
      </div>

      <PosToolbar>
        <PosToolbarGroup>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Search</label>
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder="Name or sender/receiver..."
              hideButton
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as (typeof EXCHANGE_TYPE_FILTERS)[number]);
              }}
            >
              <option value="ALL">All types</option>
              {exchangeTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </PosToolbarGroup>
        <PosToolbarActions>
          <Button variant="outline" onClick={resetFilters}>Reset</Button>
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setForm(defaultExchangeForm);
              setErrorText("");
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add Exchange
          </Button>
        </PosToolbarActions>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading exchange records..." />
      ) : rows.length === 0 ? (
        <EmptyState message="No exchange records found." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {rows.map((row) => (
                <PosRecordCard
                  key={row.id}
                  title={row.name}
                  subtitle={`${row.senderName} → ${row.receiverName}`}
                  trailing={
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      {row.type}
                    </span>
                  }
                  fields={[
                    { label: "Amount", value: formatMoneyShort(row.amountMmk) },
                    { label: "Rate", value: row.rateMmkPerUsd },
                    { label: "Date", value: formatDate(row.date) },
                  ]}
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
                    <PosTableHeaderCell>Sender</PosTableHeaderCell>
                    <PosTableHeaderCell>Receiver</PosTableHeaderCell>
                    <PosTableHeaderCell>Amount</PosTableHeaderCell>
                    <PosTableHeaderCell>Rate</PosTableHeaderCell>
                    <PosTableHeaderCell>Type</PosTableHeaderCell>
                    <PosTableHeaderCell>Actions</PosTableHeaderCell>
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {rows.map((row) => (
                    <PosTableRow key={row.id}>
                      <PosTableCell className="font-medium">{row.name}</PosTableCell>
                      <PosTableCell>{row.senderName}</PosTableCell>
                      <PosTableCell>{row.receiverName}</PosTableCell>
                      <PosTableCell className="tabular-nums">{formatMoneyShort(row.amountMmk)}</PosTableCell>
                      <PosTableCell className="tabular-nums">{row.rateMmkPerUsd}</PosTableCell>
                      <PosTableCell>
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">
                          {row.type}
                        </span>
                      </PosTableCell>
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
              pageSizeOptions={PAGE_SIZE_OPTIONS.exchanges}
              onPageSizeChange={setLimit}
            />
          )}
        </>
      )}

      {modalOpen && (
        <PosModal
          title={editing ? "Edit Exchange Record" : "Create Exchange Record"}
          onClose={() => setModalOpen(false)}
          wide
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Amount</label>
                <NumberInput
                  min={0}
                  step="0.01"
                  value={form.amountMmk}
                  onChange={(amountMmk) => setForm((prev) => ({ ...prev, amountMmk }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Rate (per USD)</label>
                <NumberInput
                  min={0}
                  step="0.01"
                  value={form.rateMmkPerUsd}
                  onChange={(rateMmkPerUsd) => setForm((prev) => ({ ...prev, rateMmkPerUsd }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sender Name</label>
                <Input value={form.senderName} onChange={(event) => setForm((prev) => ({ ...prev, senderName: event.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Receiver Name</label>
                <Input value={form.receiverName} onChange={(event) => setForm((prev) => ({ ...prev, receiverName: event.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Type</label>
                <Select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as ExchangeType }))}
                >
                  {exchangeTypes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Date</label>
                <PosDatePicker
                  value={form.date}
                  onChange={(next) => setForm((prev) => ({ ...prev, date: next }))}
                  placeholder="Select date"
                />
              </div>
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
          title="Delete Exchange Record"
          message="This removes the exchange record permanently."
          isPending={deleteMutation.isPending}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
