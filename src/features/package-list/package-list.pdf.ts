import jsPDF from "jspdf";
import type { ThaiPackageList } from "@/features/thai/thai.types";
import {
  formatPackages,
  formatPdfDate,
  formatQtyTon,
  formatWeightKg,
  listTotalQtyLabel,
  parseQtyTon,
} from "@/lib/packageCart";

const LOGO_PATH = "/rmt-family.png";

/** Label / header size — matches reference packing list. */
const FONT_LABEL = 8;
/** Body / value size. */
const FONT_VALUE = 9;
/** Title size. */
const FONT_TITLE = 14;

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(LOGO_PATH);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function setStroke(doc: jsPDF): void {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
}

function drawHLine(doc: jsPDF, x: number, y: number, w: number): void {
  setStroke(doc);
  doc.line(x, y, x + w, y);
}

function drawVLine(doc: jsPDF, x: number, y: number, h: number): void {
  setStroke(doc);
  doc.line(x, y, x, y + h);
}

function drawRect(doc: jsPDF, x: number, y: number, w: number, h: number): void {
  setStroke(doc);
  doc.rect(x, y, w, h);
}

/** Single-line meta cell: LABEL: value .... DT.: date (as in reference). */
function drawMetaRowWithDate(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  dateValue: string,
): void {
  const pad = 5;
  const midY = y + h / 2 + 2.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_LABEL);
  doc.text(`${label}:`, x + pad, midY);

  const labelW = doc.getTextWidth(`${label}: `);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_VALUE);
  const valueText = value?.trim() ? value.toUpperCase() : "";
  doc.text(valueText, x + pad + labelW, midY, {
    maxWidth: w - labelW - 78,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_LABEL);
  doc.text("DT.:", x + w - 68, midY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_VALUE);
  doc.text(dateValue || "", x + w - 48, midY);
}

/** Half-width meta cell (IEC / GSTIN) — label + value on one line. */
function drawMetaHalfCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
): void {
  const pad = 5;
  const midY = y + h / 2 + 2.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_LABEL);
  doc.text(`${label}:`, x + pad, midY);

  const labelW = doc.getTextWidth(`${label}: `);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_VALUE);
  doc.text(value?.trim() ? value.toUpperCase() : "", x + pad + labelW, midY, {
    maxWidth: w - labelW - pad * 2,
  });
}

function drawPartyBlock(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  lines: string[],
): void {
  const pad = 6;
  let cy = y + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_LABEL);
  doc.text(title, x + pad, cy);

  cy += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_VALUE);
  const lineGap = 11;
  const bottom = y + h - 4;
  for (const line of lines.filter(Boolean)) {
    if (cy > bottom) break;
    const parts = doc.splitTextToSize(String(line).toUpperCase(), w - pad * 2) as string[];
    for (const part of parts) {
      if (cy > bottom) break;
      doc.text(part, x + pad, cy);
      cy += lineGap;
    }
  }
}

function drawShipCell(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
): void {
  const pad = 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_LABEL);
  doc.text(label, x + pad, y + 10, { maxWidth: w - pad * 2 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_VALUE);
  doc.text(value?.trim() ? value.toUpperCase() : "", x + pad, y + h - 6, {
    maxWidth: w - pad * 2,
  });
}

export async function downloadThaiPackageListPdf(list: ThaiPackageList): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const docX = margin;
  const docW = pageWidth - margin * 2;

  let cursorY = margin;

  const logo = await loadLogoDataUrl();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", pageWidth / 2 - 20, cursorY, 40, 40);
    } catch {
      // skip broken logo
    }
    cursorY += 44;
  }

  const docY = cursorY;
  const docH = pageHeight - margin - docY;

  // Proportions tuned to match the reference form
  const titleH = 24;
  const metaRowH = 88;
  const partyH = 64;
  const shipRowH = 28;
  const shipH = shipRowH * 2;
  const tableHeaderH = 22;
  const footerH = 20;

  const tableTop = docY + titleH + metaRowH + partyH + shipH;
  const tableBodyTop = tableTop + tableHeaderH;
  const footerY = docY + docH - footerH;
  const availableBodyH = footerY - tableBodyTop;
  const minRows = Math.max(list.items.length, 8);
  const rowH = Math.max(18, Math.floor(availableBodyH / Math.max(minRows, 1)));
  const bodyRows = Math.max(list.items.length, Math.floor(availableBodyH / rowH));

  drawRect(doc, docX, docY, docW, docH);

  // —— Title (no gray fill — matches photo) ——
  drawHLine(doc, docX, docY + titleH, docW);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_TITLE);
  doc.text("PACKING LIST", docX + docW / 2, docY + titleH / 2 + 5, { align: "center" });

  const halfW = docW / 2;
  const block1Y = docY + titleH;

  // —— Exporter | Invoice meta ——
  drawVLine(doc, docX + halfW, block1Y, metaRowH);
  drawHLine(doc, docX, block1Y + metaRowH, docW);

  const exporterLines = [
    list.companyName,
    list.companyAddress,
    list.companyCityZip,
    list.companyPhone,
    list.companyEmail,
  ].filter(Boolean);
  drawPartyBlock(doc, docX, block1Y, halfW, metaRowH, "EXPORTER:", exporterLines);

  const metaX = docX + halfW;
  const metaW = halfW;
  const metaInnerH = metaRowH / 4;

  for (let i = 1; i < 4; i += 1) {
    drawHLine(doc, metaX, block1Y + metaInnerH * i, metaW);
  }
  // Vertical split only on IEC | GSTIN row
  drawVLine(doc, metaX + metaW / 2, block1Y + metaInnerH * 2, metaInnerH);

  drawMetaRowWithDate(
    doc,
    metaX,
    block1Y,
    metaW,
    metaInnerH,
    "INVOICE NO.",
    list.invoiceNo ?? "",
    formatPdfDate(list.invoiceDate),
  );
  drawMetaRowWithDate(
    doc,
    metaX,
    block1Y + metaInnerH,
    metaW,
    metaInnerH,
    "PI NO.",
    list.piNo ?? "",
    formatPdfDate(list.piDate),
  );
  drawMetaHalfCell(
    doc,
    metaX,
    block1Y + metaInnerH * 2,
    metaW / 2,
    metaInnerH,
    "IEC NO.",
    list.iecNo ?? "",
  );
  drawMetaHalfCell(
    doc,
    metaX + metaW / 2,
    block1Y + metaInnerH * 2,
    metaW / 2,
    metaInnerH,
    "GSTIN",
    list.gstin ?? "",
  );
  drawMetaRowWithDate(
    doc,
    metaX,
    block1Y + metaInnerH * 3,
    metaW,
    metaInnerH,
    "CONTRACT NO.",
    list.contractNo ?? "",
    formatPdfDate(list.contractDate),
  );

  // —— Consignee | Notify ——
  const block2Y = block1Y + metaRowH;
  drawVLine(doc, docX + halfW, block2Y, partyH);
  drawHLine(doc, docX, block2Y + partyH, docW);

  const consigneeLines = [
    list.consigneeName,
    list.consigneeAddress,
    [list.consigneeCityZip, list.consigneeCountry, list.consigneePostalCode]
      .filter(Boolean)
      .join(", "),
    [list.consigneeContactPerson, list.consigneePhone, list.consigneeEmail]
      .filter(Boolean)
      .join("  "),
  ].filter(Boolean);
  drawPartyBlock(doc, docX, block2Y, halfW, partyH, "CONSIGNEE:", consigneeLines);
  drawPartyBlock(doc, docX + halfW, block2Y, halfW, partyH, "NOTIFY PARTY:", [
    list.notifyParty ?? "",
  ]);

  // —— Shipping grid (4 × 2) ——
  const block3Y = block2Y + partyH;
  const shipColW = docW / 4;

  drawHLine(doc, docX, block3Y + shipRowH, docW);
  drawHLine(doc, docX, block3Y + shipH, docW);
  for (let i = 1; i < 4; i += 1) {
    drawVLine(doc, docX + shipColW * i, block3Y, shipH);
  }

  const shipFields: Array<[string, string | null | undefined]> = [
    ["PRE-CARRIAGE BY:", list.preCarriageBy],
    ["PLACE OF RECEIPT BY PRE CARRIER", list.placeOfReceipt],
    ["COUNTRY OF ORIGIN OF GOODS:", list.countryOfOrigin],
    ["COUNTRY OF FINAL DESTINATION", list.countryOfFinalDestination],
    ["VESSEL / FLIGHT NO", list.vesselFlightNo],
    ["PORT OF LOADING", list.portOfLoading],
    ["PORT OF DISCHARGE", list.portOfDischarge],
    ["FINAL DESTINATION", list.finalDestination],
  ];

  shipFields.forEach(([label, val], i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    drawShipCell(
      doc,
      docX + col * shipColW,
      block3Y + row * shipRowH,
      shipColW,
      shipRowH,
      label,
      String(val ?? ""),
    );
  });

  // —— Items table (no H.S. CODE) ——
  // Widths match reference: narrow SR, medium packages/codes/weights, wide description
  const cols = [
    { label: "SR. NO.", pct: 0.06 },
    { label: "NO. OF PACKAGES", pct: 0.12 },
    { label: "DESCRIPTION OF GOODS", pct: 0.34 },
    { label: "PRODUCT CODE", pct: 0.12 },
    { label: "QTY. TOTAL", pct: 0.12 },
    { label: "NET WT.", pct: 0.12 },
    { label: "GROSS WT.", pct: 0.12 },
  ];

  const colWidths = cols.map((col) => Math.floor(docW * col.pct));
  colWidths[colWidths.length - 1] =
    docW - colWidths.slice(0, -1).reduce((a, b) => a + b, 0);

  const colXs = colWidths.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? docX : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, []);

  // Header — white background, bold labels (like photo)
  drawHLine(doc, docX, tableTop, docW);
  drawHLine(doc, docX, tableTop + tableHeaderH, docW);

  cols.forEach((col, i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_LABEL);
    doc.text(col.label, colXs[i] + colWidths[i] / 2, tableTop + tableHeaderH / 2 + 3, {
      align: "center",
      maxWidth: colWidths[i] - 4,
    });
    if (i > 0) drawVLine(doc, colXs[i], tableTop, tableHeaderH);
  });

  for (let r = 0; r < bodyRows; r += 1) {
    const rowY = tableBodyTop + r * rowH;
    drawHLine(doc, docX, rowY + rowH, docW);

    const item = list.items[r];
    if (!item) continue;

    const values = [
      String(item.serialNo),
      formatPackages(item.noOfPackages).toUpperCase(),
      (item.description || "").toUpperCase(),
      (item.productCode || "").toUpperCase(),
      formatQtyTon(parseQtyTon(item.qtyTotal)).toUpperCase(),
      formatWeightKg(item.netWeightLb).toUpperCase(),
      formatWeightKg(item.grossWeightLb).toUpperCase(),
    ];

    values.forEach((val, i) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT_VALUE);
      // Description left-aligned; others centered (matches photo)
      const align = i === 2 ? "left" : "center";
      const tx =
        align === "left" ? colXs[i] + 4 : colXs[i] + colWidths[i] / 2;
      const textY = rowY + Math.min(14, rowH / 2 + 3);
      doc.text(val, tx, textY, {
        align,
        maxWidth: colWidths[i] - 8,
      });
    });
  }

  // Column rules through body + footer (photo keeps grid to bottom)
  for (let i = 1; i < cols.length; i += 1) {
    drawVLine(doc, colXs[i], tableTop, footerY + footerH - tableTop);
  }

  // —— TOTAL QTY under QTY. TOTAL column (as in photo) ——
  drawHLine(doc, docX, footerY, docW);
  drawHLine(doc, docX, footerY + footerH, docW);

  const qtyColIndex = 4;
  const totalQty = listTotalQtyLabel(list).toUpperCase();
  const qtyLabel = totalQty.endsWith(".") ? totalQty : `${totalQty}.`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_LABEL);
  doc.text("TOTAL QTY.", colXs[qtyColIndex] + 4, footerY + footerH / 2 + 3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(FONT_VALUE);
  doc.text(qtyLabel, colXs[qtyColIndex] + colWidths[qtyColIndex] - 4, footerY + footerH / 2 + 3, {
    align: "right",
  });

  doc.save(`packing-list-${list.listNo}.pdf`);
}
