import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, EmptyState, LoadingState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosSummaryCards, PosSummaryCard } from "@/components/shared/pos/PosSummaryCards";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { PosToolbar, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
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
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useIsMobileLayout } from "@/hooks/useMediaQuery";
import { useUrlLimit, useUrlPage } from "@/hooks/useUrlQuery";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { getApiErrorMessage } from "@/lib/http";
import type { ThaiVendor, ThaiVendorPayload } from "./vendor.hooks";
import { useThaiVendorMutations, useThaiVendors } from "./vendor.hooks";

const emptyForm: ThaiVendorPayload = {
  name: "",
  companyNo: "",
  phone: "",
  address: "",
  email: "",
};

export function VendorsFlow() {
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
    PAGE_SIZE.vendors,
    PAGE_SIZE_OPTIONS.vendors,
  );
  const filters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch || undefined,
    }),
    [page, limit, appliedSearch],
  );
  const { data, isLoading } = useThaiVendors(filters);
  const { createMutation, updateMutation, deleteMutation } = useThaiVendorMutations(filters);

  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState<ThaiVendor | null>(null);
  const [deleting, setDeleting] = useState<ThaiVendor | null>(null);
  const [form, setForm] = useState<ThaiVendorPayload>(emptyForm);
  const [errorText, setErrorText] = useState("");

  const vendors = data?.data ?? [];

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrorText("");
    setModalOpen(true);
  }

  function openEdit(vendor: ThaiVendor) {
    setEditing(vendor);
    setForm({
      name: vendor.name,
      companyNo: vendor.companyNo ?? "",
      phone: vendor.phone ?? "",
      address: vendor.address ?? "",
      email: vendor.email ?? "",
    });
    setErrorText("");
    setModalOpen(true);
  }

  async function submit() {
    try {
      setErrorText("");
      if (!form.name.trim()) {
        setErrorText("Name is required");
        return;
      }
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
    <PosPageShell>
      <PageHeader
        title="Vendors"
        description="Thai vendor contacts."
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            Add Vendor
          </Button>
        }
      />

      <PosSummaryCards className="lg:grid-cols-2">
        <PosSummaryCard label="Active vendors" value={data?.meta?.total ?? 0} accent />
        <PosSummaryCard label="This page" value={vendors.length} />
      </PosSummaryCards>

      <PosToolbar>
        <PosToolbarGroup>
          <div className="min-w-[220px] flex-1">
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder="Search name, phone, company..."
              className="max-w-none"
            />
          </div>
        </PosToolbarGroup>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading vendors..." />
      ) : vendors.length === 0 ? (
        <EmptyState message="No vendors found." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {vendors.map((vendor) => (
                <PosRecordCard
                  key={vendor.id}
                  title={vendor.name}
                  subtitle={vendor.phone || vendor.companyNo || "—"}
                  fields={[
                    { label: "Email", value: vendor.email || "—" },
                    { label: "Address", value: vendor.address || "—" },
                  ]}
                  actions={
                    <>
                      <Button size="sm" variant="outline" onClick={() => openEdit(vendor)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleting(vendor);
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
          ) : (
            <PosDataTable>
              <PosTable>
                <PosTableHead>
                  <PosTableRow>
                    <PosTableHeaderCell>Name</PosTableHeaderCell>
                    <PosTableHeaderCell>Company No</PosTableHeaderCell>
                    <PosTableHeaderCell>Phone</PosTableHeaderCell>
                    <PosTableHeaderCell>Email</PosTableHeaderCell>
                    <PosTableHeaderCell>Actions</PosTableHeaderCell>
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {vendors.map((vendor) => (
                    <PosTableRow key={vendor.id}>
                      <PosTableCell className="font-medium">{vendor.name}</PosTableCell>
                      <PosTableCell>{vendor.companyNo || "—"}</PosTableCell>
                      <PosTableCell>{vendor.phone || "—"}</PosTableCell>
                      <PosTableCell className="text-muted-foreground">
                        {vendor.email || "—"}
                      </PosTableCell>
                      <PosTableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEdit(vendor)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setDeleting(vendor);
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
          )}

          {data?.meta ? (
            <PosPaginationFromMeta
              meta={data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.vendors}
              onPageSizeChange={setLimit}
            />
          ) : null}
        </>
      )}

      {modalOpen && (
        <PosModal
          title={editing ? "Edit Vendor" : "Add Vendor"}
          onClose={() => setModalOpen(false)}
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Company No</label>
                <Input
                  value={form.companyNo ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, companyNo: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Phone</label>
                <Input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Email</label>
              <Input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Address</label>
              <Input
                value={form.address ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
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

      {deleteOpen && deleting && (
        <DeleteConfirmModal
          title="Delete Vendor"
          message={`“${deleting.name}” will be set inactive.`}
          isPending={deleteMutation.isPending}
          onClose={() => setDeleteOpen(false)}
          onConfirm={confirmDelete}
        />
      )}
    </PosPageShell>
  );
}
