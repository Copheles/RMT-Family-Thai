import jsPDF from "jspdf";
import type { ThaiInvoice, ThaiPaymentType } from "@/features/thai/thai.types";

const LOGO_PATH = "/rmt-family.png";
const PAYMENT_TYPES: ThaiPaymentType[] = ["DEBIT", "CREDIT", "CHECK", "CASH", "ZELLE"];

function money(value: number): string {
  return Number(value ?? 0).toFixed(2);
}

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

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

function drawCheckbox(
  doc: jsPDF,
  x: number,
  y: number,
  size: number,
  checked: boolean,
): void {
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.8);
  doc.rect(x, y - size + 2, size, size);
  if (checked) {
    doc.setLineWidth(1.4);
    doc.line(x + 2, y - size / 2 + 1, x + size / 2 - 0.5, y - 1);
    doc.line(x + size / 2 - 0.5, y - 1, x + size - 2, y - size + 4);
    doc.setLineWidth(0.5);
  }
}

function partyLines(party: {
  name: string;
  address: string;
  cityZip: string;
  phone: string;
  email: string;
}): string[] {
  return [
    party.name || "—",
    party.address || "—",
    party.cityZip || "—",
    party.phone ? `Phone: ${party.phone}` : "Phone: —",
    party.email ? `Email: ${party.email}` : "Email: —",
  ];
}

export async function downloadThaiInvoicePdf(invoice: ThaiInvoice): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 42;
  const right = pageWidth - 42;
  const contentWidth = right - left;
  let y = 40;

  const logo = await loadLogoDataUrl();
  const logoSize = 52;
  if (logo) {
    try {
      doc.addImage(logo, "PNG", left, y, logoSize, logoSize);
    } catch {
      // continue without logo if embed fails
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text("Invoice", right, y + 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const metaX = right;
  let metaY = y + 40;
  const metaRows = [
    `Date: ${formatDisplayDate(invoice.date)}`,
    `Invoice No: ${invoice.invoiceNo}`,
    `Customer ID: ${invoice.customerId}`,
    `Purchase Order: ${formatDisplayDate(invoice.purchaseOrderDate)}`,
  ];
  for (const row of metaRows) {
    doc.text(row, metaX, metaY, { align: "right" });
    metaY += 14;
  }

  const companyX = left;
  let companyY = y + logoSize + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(invoice.companyName || "—", companyX, companyY);
  companyY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  for (const line of [
    invoice.companyAddress,
    invoice.companyCityZip,
    invoice.companyPhone ? `Phone: ${invoice.companyPhone}` : "",
    invoice.companyEmail ? `Email: ${invoice.companyEmail}` : "",
  ].filter(Boolean)) {
    doc.text(line, companyX, companyY);
    companyY += 12;
  }

  y = Math.max(companyY, metaY) + 18;

  const halfGap = 16;
  const halfW = (contentWidth - halfGap) / 2;
  const partyTop = y;
  const partyBoxH = 88;

  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.7);
  doc.rect(left, partyTop, halfW, partyBoxH);
  doc.rect(left + halfW + halfGap, partyTop, halfW, partyBoxH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Consignee", left + 8, partyTop + 14);
  doc.text("Bill To", left + halfW + halfGap + 8, partyTop + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const consignee = partyLines({
    name: invoice.consigneeName,
    address: invoice.consigneeAddress,
    cityZip: invoice.consigneeCityZip,
    phone: invoice.consigneePhone,
    email: invoice.consigneeEmail,
  });
  const billTo = partyLines({
    name: invoice.billToName,
    address: invoice.billToAddress,
    cityZip: invoice.billToCityZip,
    phone: invoice.billToPhone,
    email: invoice.billToEmail,
  });
  consignee.forEach((line, i) => {
    doc.text(line, left + 8, partyTop + 30 + i * 11, { maxWidth: halfW - 16 });
  });
  billTo.forEach((line, i) => {
    doc.text(line, left + halfW + halfGap + 8, partyTop + 30 + i * 11, {
      maxWidth: halfW - 16,
    });
  });

  y = partyTop + partyBoxH + 16;

  const itemW = contentWidth * 0.28;
  const desW = contentWidth * 0.28;
  const qtyW = contentWidth * 0.12;
  const unitW = contentWidth * 0.16;
  const totalW = contentWidth * 0.16;
  const rowH = 20;
  const headerH = 22;

  doc.setFillColor(245, 245, 245);
  doc.rect(left, y, contentWidth, headerH, "F");
  doc.setDrawColor(60, 60, 60);
  doc.rect(left, y, contentWidth, headerH);
  doc.line(left + itemW, y, left + itemW, y + headerH);
  doc.line(left + itemW + desW, y, left + itemW + desW, y + headerH);
  doc.line(left + itemW + desW + qtyW, y, left + itemW + desW + qtyW, y + headerH);
  doc.line(
    left + itemW + desW + qtyW + unitW,
    y,
    left + itemW + desW + qtyW + unitW,
    y + headerH,
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Item", left + 4, y + 14);
  doc.text("Des", left + itemW + 4, y + 14);
  doc.text("Qty", left + itemW + desW + qtyW / 2, y + 14, { align: "center" });
  doc.text("Unit Pr", left + itemW + desW + qtyW + unitW / 2, y + 14, { align: "center" });
  doc.text("Total", right - 4, y + 14, { align: "right" });

  y += headerH;
  doc.setFont("helvetica", "normal");
  const minRows = Math.max(invoice.items.length, 6);
  for (let i = 0; i < minRows; i += 1) {
    doc.rect(left, y, contentWidth, rowH);
    doc.line(left + itemW, y, left + itemW, y + rowH);
    doc.line(left + itemW + desW, y, left + itemW + desW, y + rowH);
    doc.line(left + itemW + desW + qtyW, y, left + itemW + desW + qtyW, y + rowH);
    doc.line(
      left + itemW + desW + qtyW + unitW,
      y,
      left + itemW + desW + qtyW + unitW,
      y + rowH,
    );

    const item = invoice.items[i];
    if (item) {
      doc.setFontSize(8);
      doc.text(item.product?.name ?? "—", left + 4, y + 13, { maxWidth: itemW - 8 });
      doc.text(item.description || "—", left + itemW + 4, y + 13, { maxWidth: desW - 8 });
      doc.text(String(item.quantity), left + itemW + desW + qtyW / 2, y + 13, {
        align: "center",
      });
      doc.text(money(item.unitPrice), left + itemW + desW + qtyW + unitW / 2, y + 13, {
        align: "center",
      });
      doc.text(money(item.total), right - 4, y + 13, { align: "right" });
    }
    y += rowH;
  }

  y += 12;
  const policyW = contentWidth * 0.58;
  const totalsW = contentWidth - policyW;
  const totalsRowH = 18;
  const totalsH = totalsRowH * 5;

  doc.setDrawColor(60, 60, 60);
  doc.rect(left, y, policyW - 10, totalsH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Policy", left + 8, y + 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  if (invoice.policyText) {
    doc.text(invoice.policyText, left + 8, y + 28, {
      maxWidth: policyW - 26,
    });
  }

  const totalsLeft = left + policyW;
  doc.rect(totalsLeft, y, totalsW, totalsH);
  const labelW = totalsW * 0.55;
  doc.line(totalsLeft + labelW, y, totalsLeft + labelW, y + totalsH);
  for (let i = 1; i < 5; i += 1) {
    doc.line(totalsLeft, y + totalsRowH * i, right, y + totalsRowH * i);
  }

  const totalRows: Array<[string, string, boolean]> = [
    ["Sub Total", money(invoice.subtotal), false],
    ["Tax", money(invoice.taxAmount), false],
    ["Dis", money(invoice.discountAmount), false],
    ["Delivery", money(invoice.deliveryFee), false],
    ["Total", money(invoice.totalAmount), true],
  ];

  totalRows.forEach(([label, value, bold], index) => {
    const cy = y + totalsRowH * index + 12;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 10 : 9);
    doc.text(label, totalsLeft + 6, cy);
    doc.text(value, right - 6, cy, { align: "right" });
  });

  y += totalsH + 18;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Payment type", left, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const colW = contentWidth / PAYMENT_TYPES.length;
  PAYMENT_TYPES.forEach((type, index) => {
    const cx = left + index * colW;
    const checked = invoice.paymentType === type;
    drawCheckbox(doc, cx, y, 10, checked);
    doc.text(type.charAt(0) + type.slice(1).toLowerCase(), cx + 14, y);
  });

  doc.save(`invoice-${invoice.invoiceNo}.pdf`);
}
