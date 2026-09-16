import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader, EmptyState, LoadingState, ErrorState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
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
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import { downloadThaiPackageListPdf } from "@/features/package-list/package-list.pdf";
import { getThaiPackageList, listThaiPackageLists } from "@/features/thai/thai.api";
import type { ThaiPackageList } from "@/features/thai/thai.types";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useIsMobileLayout } from "@/hooks/useMediaQuery";
import { useUrlLimit, useUrlPage } from "@/hooks/useUrlQuery";
import { formatDate } from "@/lib/format";
import {
  formatPackages,
  formatPdfDate,
  formatQtyTon,
  formatWeightKg,
  formatWeightLb,
  listTotalQtyLabel,
  parseQtyTon,
} from "@/lib/packageCart";
import { PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { queryKeys } from "@/lib/queryKeys";
import { Link, useSearchParams } from "react-router-dom";

async function downloadPackageListPdf(list: ThaiPackageList): Promise<void> {
  await downloadThaiPackageListPdf(list);
}

export function PackageListsPage() {
  const isMobile = useIsMobileLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, showToast, dismiss } = usePosToast();
  const handledCreatedRef = useRef<string | null>(null);
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(10, PAGE_SIZE_OPTIONS.invoices);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const createdId = searchParams.get("created");

  const filters = useMemo(
    () => ({ page, limit, search: appliedSearch || undefined }),
    [page, limit, appliedSearch],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.thai.packageLists(JSON.stringify(filters)),
    queryFn: () => listThaiPackageLists(filters),
  });

  const rows = data?.data ?? [];

  useEffect(() => {
    if (!createdId || handledCreatedRef.current === createdId) return;

    let cancelled = false;
    handledCreatedRef.current = createdId;

    void (async () => {
      try {
        const list = await getThaiPackageList(createdId);
        if (cancelled) return;
        setSelectedId(list.id);
        showToast("success", `Packing list created — ${list.listNo}`);
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete("created");
          return next;
        }, { replace: true });
      } catch {
        if (!cancelled) {
          showToast("error", "Packing list created, but unable to open it.");
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete("created");
            return next;
          }, { replace: true });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [createdId, setSearchParams, showToast]);

  return (
    <PosPageShell>
      <PosToaster toasts={toasts} onDismiss={dismiss} />
      <PageHeader
        title="Packing lists"
        description="Saved packing lists for shipment."
        action={
          <Button asChild>
            <Link to="/package-list/create">Create package</Link>
          </Button>
        }
      />

      <div className="mb-4">
        <PosSearchBar
          value={searchInput}
          onChange={setSearchInput}
          onSubmit={submitSearch}
          onClear={resetSearch}
          placeholder="Search list no, consignee, invoice..."
        />
      </div>

      {isLoading ? (
        <LoadingState label="Loading packing lists..." />
      ) : isError ? (
        <ErrorState message="Unable to load packing lists." />
      ) : rows.length === 0 ? (
        <EmptyState message="No packing lists yet." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {rows.map((row) => (
                <PosRecordCard
                  key={row.id}
                  title={row.listNo}
                  subtitle={row.consigneeName}
                  fields={[
                    { label: "Date", value: formatDate(row.date) },
                    { label: "Invoice", value: row.invoiceNo ?? "—" },
                    { label: "Total qty", value: listTotalQtyLabel(row) },
                    { label: "Gross", value: formatWeightLb(row.totalGrossWeightLb) },
                  ]}
                  actions={
                    <>
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
                        View
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => void downloadPackageListPdf(row)}>
                        PDF
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
                    <PosTableHeaderCell>List No</PosTableHeaderCell>
                    <PosTableHeaderCell>Date</PosTableHeaderCell>
                    <PosTableHeaderCell>Invoice No</PosTableHeaderCell>
                    <PosTableHeaderCell>Consignee</PosTableHeaderCell>
                    <PosTableHeaderCell>Total Qty</PosTableHeaderCell>
                    <PosTableHeaderCell>Gross Wt</PosTableHeaderCell>
                    <PosTableHeaderCell>Actions</PosTableHeaderCell>
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {rows.map((row) => (
                    <PosTableRow key={row.id}>
                      <PosTableCell className="font-medium">{row.listNo}</PosTableCell>
                      <PosTableCell>{formatDate(row.date)}</PosTableCell>
                      <PosTableCell>{row.invoiceNo ?? "—"}</PosTableCell>
                      <PosTableCell>{row.consigneeName}</PosTableCell>
                      <PosTableCell>{listTotalQtyLabel(row)}</PosTableCell>
                      <PosTableCell>{formatWeightLb(row.totalGrossWeightLb)}</PosTableCell>
                      <PosTableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
                            View
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => void downloadPackageListPdf(row)}>
                            PDF
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
              pageSizeOptions={PAGE_SIZE_OPTIONS.invoices}
              onPageSizeChange={setLimit}
            />
          )}
        </>
      )}

      <PackageListDetailModal listId={selectedId} onClose={() => setSelectedId(null)} />
    </PosPageShell>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  );
}

function PackageListDetailModal({
  listId,
  onClose,
}: {
  listId: string | null;
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.thai.packageList(listId ?? "none"),
    queryFn: () => getThaiPackageList(listId!),
    enabled: Boolean(listId),
  });

  if (!listId) return null;

  return (
    <PosModal title={data ? `Packing list ${data.listNo}` : "Packing list"} onClose={onClose} wide>
      {isLoading ? (
        <LoadingState label="Loading..." />
      ) : isError || !data ? (
        <ErrorState message="Unable to load packing list." />
      ) : (
        <div className="space-y-5 text-sm">
          <div className="grid gap-4 rounded-lg border border-border/70 p-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase">Exporter</p>
              <p className="font-medium">{data.companyName}</p>
              <p className="text-muted-foreground">{data.companyAddress}</p>
              <p className="text-muted-foreground">{data.companyCityZip}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <DetailField label="Invoice no." value={data.invoiceNo ?? ""} />
              <DetailField label="Invoice date" value={formatPdfDate(data.invoiceDate)} />
              <DetailField label="PI no." value={data.piNo ?? ""} />
              <DetailField label="PI date" value={formatPdfDate(data.piDate)} />
              <DetailField label="IEC no." value={data.iecNo ?? ""} />
              <DetailField label="GSTIN" value={data.gstin ?? ""} />
              <DetailField label="Contract no." value={data.contractNo ?? ""} />
              <DetailField label="Contract date" value={formatPdfDate(data.contractDate)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase">Consignee</p>
              <p className="font-medium">{data.consigneeName}</p>
              <p className="text-muted-foreground">{data.consigneeAddress}</p>
              <p className="text-muted-foreground">
                {[data.consigneeCityZip, data.consigneeCountry, data.consigneePostalCode]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
              <p className="text-muted-foreground">
                {[data.consigneeContactPerson, data.consigneePhone, data.consigneeEmail]
                  .filter(Boolean)
                  .join(" · ") || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/70 p-4">
              <p className="mb-2 text-xs font-bold uppercase">Notify party</p>
              <p className="whitespace-pre-wrap text-muted-foreground">{data.notifyParty || "—"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 p-4">
            <p className="mb-3 text-xs font-bold uppercase">Shipping</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Pre-carriage by" value={data.preCarriageBy ?? ""} />
              <DetailField label="Place of receipt" value={data.placeOfReceipt ?? ""} />
              <DetailField label="Country of origin" value={data.countryOfOrigin ?? ""} />
              <DetailField label="Final destination country" value={data.countryOfFinalDestination ?? ""} />
              <DetailField label="Vessel / flight no." value={data.vesselFlightNo ?? ""} />
              <DetailField label="Port of loading" value={data.portOfLoading ?? ""} />
              <DetailField label="Port of discharge" value={data.portOfDischarge ?? ""} />
              <DetailField label="Final destination" value={data.finalDestination ?? ""} />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full min-w-[900px] text-xs">
              <thead className="bg-muted/40 text-[10px] font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 text-left">SR</th>
                  <th className="px-2 py-2 text-left">No. of packages</th>
                  <th className="px-2 py-2 text-left">Description</th>
                  <th className="px-2 py-2 text-left">Code</th>
                  <th className="px-2 py-2 text-left">Qty total</th>
                  <th className="px-2 py-2 text-right">Net wt</th>
                  <th className="px-2 py-2 text-right">Gross wt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-2">{item.serialNo}</td>
                    <td className="px-2 py-2">{formatPackages(item.noOfPackages)}</td>
                    <td className="px-2 py-2">{item.description}</td>
                    <td className="px-2 py-2">{item.productCode}</td>
                    <td className="px-2 py-2">{formatQtyTon(parseQtyTon(item.qtyTotal))}</td>
                    <td className="px-2 py-2 text-right">{formatWeightKg(item.netWeightLb)}</td>
                    <td className="px-2 py-2 text-right">{formatWeightKg(item.grossWeightLb)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/20 px-4 py-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-muted-foreground">Total qty: </span>
                <span className="font-semibold">{listTotalQtyLabel(data)}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Net: </span>
                <span className="font-semibold">{formatWeightKg(data.totalNetWeightLb)}</span>
              </span>
              <span>
                <span className="text-muted-foreground">Gross: </span>
                <span className="font-semibold">{formatWeightKg(data.totalGrossWeightLb)}</span>
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={() => void downloadPackageListPdf(data)}>Download PDF</Button>
            </div>
          </div>
        </div>
      )}
    </PosModal>
  );
}
