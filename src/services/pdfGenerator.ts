import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Job, HandymanProfile } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';

export function generateQuotePDF(job: Job, profile: HandymanProfile): void {
  const quote = job.quote;
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
  const margin = 36; // 12.7mm margin
  const contentWidth = pageWidth - margin * 2; // 523.28 pt

  const isInvoice = job.status === 'invoiced' || job.status === 'completed';
  const docTitle = isInvoice ? 'TAX INVOICE' : 'SERVICE ESTIMATE & QUOTE';
  const docNumber = isInvoice
    ? (job.jobNumber.startsWith('INV') ? job.jobNumber : `INV-${job.jobNumber}`)
    : (quote?.quoteNumber || `QTE-${job.jobNumber}`);

  // Brand Accent Colors
  const primaryColor = isInvoice ? [37, 99, 235] : [217, 119, 6]; // Blue-600 (Invoice) or Amber-600 (Quote)
  const darkTextColor = [15, 23, 42]; // Slate-900
  const bodyTextColor = [51, 65, 85]; // Slate-700
  const mutedTextColor = [100, 116, 139]; // Slate-500
  const cardBgColor = [248, 250, 252]; // Slate-50
  const cardBorderColor = [226, 232, 240]; // Slate-200

  // 1. TOP BRAND ACCENT BAR
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 5, 'F');

  let y = 28;

  // 2. HEADER SECTION (STRICT 2-COLUMN ISOLATION - NO HORIZONTAL OVERLAPS)
  const leftColWidth = 280; // Left column bounds: margin (36) to 316
  const rightColX = pageWidth - margin; // Right edge: 559.28

  // --- Left Column: Business & Provider Identity ---
  let leftY = y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  const businessNameLines = doc.splitTextToSize(profile.businessName, leftColWidth);
  doc.text(businessNameLines, margin, leftY);
  leftY += businessNameLines.length * 15;

  if (profile.abn) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`ABN: ${profile.abn}`, margin, leftY);
    leftY += 12;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

  doc.text(`Proprietor: ${profile.name}`, margin, leftY);
  leftY += 11;

  const contactLine = `Phone: ${profile.phone}  |  Email: ${profile.email}`;
  const contactLines = doc.splitTextToSize(contactLine, leftColWidth);
  doc.text(contactLines, margin, leftY);
  leftY += contactLines.length * 11;

  if (profile.baseAddress) {
    const addressLines = doc.splitTextToSize(profile.baseAddress, leftColWidth);
    doc.text(addressLines, margin, leftY);
    leftY += addressLines.length * 11;
  }

  // --- Right Column: Document Type Pill & Reference Details ---
  let rightY = y;

  // Document Title Badge Pill
  const pillWidth = 170;
  const pillHeight = 22;
  const pillX = rightColX - pillWidth;
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(pillX, rightY, pillWidth, pillHeight, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(docTitle, pillX + pillWidth / 2, rightY + 14, { align: 'center' });
  rightY += pillHeight + 8;

  // Document Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Ref: ${docNumber}`, rightColX, rightY, { align: 'right' });
  rightY += 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Date Issued: ${formatDate(quote?.createdAt || new Date().toISOString())}`, rightColX, rightY, { align: 'right' });
  rightY += 11;

  const validOrDueDateLabel = isInvoice ? 'Payment Due' : 'Valid Until';
  const validOrDueDateValue = formatDate(quote?.validUntil || new Date(Date.now() + 14 * 86400000).toISOString());
  doc.text(`${validOrDueDateLabel}: ${validOrDueDateValue}`, rightColX, rightY, { align: 'right' });
  rightY += 11;

  doc.text(`Job Ref: #${job.jobNumber}  |  Priority: ${job.priority.toUpperCase()}`, rightColX, rightY, { align: 'right' });
  rightY += 11;

  // Synchronize dynamic vertical offset
  y = Math.max(leftY, rightY) + 8;

  // Thin separator line
  doc.setDrawColor(cardBorderColor[0], cardBorderColor[1], cardBorderColor[2]);
  doc.setLineWidth(0.75);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // 3. CLIENT & SERVICE / AGENCY DETAILS (SIDE-BY-SIDE CARDS)
  const cardGap = 12;
  const cardWidth = (contentWidth - cardGap) / 2; // ~255.6 pt each
  const cardHeight = 78;

  // Left Card: CLIENT & SERVICE LOCATION
  doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
  doc.setDrawColor(cardBorderColor[0], cardBorderColor[1], cardBorderColor[2]);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 4, 4, 'FD');

  let clientY = y + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('BILL TO / SERVICE LOCATION', margin + 10, clientY);
  clientY += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(job.clientName, margin + 10, clientY);
  clientY += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
  const addressSplit = doc.splitTextToSize(job.address, cardWidth - 20);
  doc.text(addressSplit, margin + 10, clientY);
  clientY += addressSplit.length * 10;

  doc.text(`Phone: ${job.clientPhone}`, margin + 10, clientY);
  clientY += 10;
  if (job.clientEmail) {
    doc.text(`Email: ${job.clientEmail}`, margin + 10, clientY);
  }

  // Right Card: PROJECT / AGENCY DETAILS
  const rightCardX = margin + cardWidth + cardGap;
  doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
  doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 4, 4, 'FD');

  let projectY = y + 12;
  if (job.isAgencyJob && job.realEstateAgency) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(126, 34, 206); // Purple-700
    doc.text('REAL ESTATE AGENCY WORK ORDER', rightCardX + 10, projectY);
    projectY += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(job.realEstateAgency, rightCardX + 10, projectY);
    projectY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
    if (job.workOrderNumber) {
      doc.text(`Work Order #: ${job.workOrderNumber}`, rightCardX + 10, projectY);
      projectY += 10;
    }
    if (job.realEstateAgentName) {
      doc.text(`Property Mgr: ${job.realEstateAgentName} (${job.realEstateAgentPhone || 'PM'})`, rightCardX + 10, projectY);
      projectY += 10;
    }
    if (job.tenantName) {
      doc.text(`Tenant: ${job.tenantName} (${job.tenantPhone || 'Occupant'})`, rightCardX + 10, projectY);
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text('PROJECT CATEGORY & SERVICE', rightCardX + 10, projectY);
    projectY += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(job.category, rightCardX + 10, projectY);
    projectY += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
    doc.text(`Trade: Handyman & Property Maintenance`, rightCardX + 10, projectY);
    projectY += 10;
    doc.text(`Location: ${job.suburb || 'Point Cook'}`, rightCardX + 10, projectY);
    projectY += 10;
    doc.text(`Est. Visit Duration: ${job.estimatedDurationMinutes || 45} minutes`, rightCardX + 10, projectY);
  }

  y += cardHeight + 10;

  // 4. SCOPE OF WORK CONTAINER
  const scopeDesc = `${job.title}${job.description ? ` — ${job.description}` : ''}`;
  const splitScope = doc.splitTextToSize(scopeDesc, contentWidth - 20);
  const scopeBoxHeight = Math.max(34, splitScope.length * 10 + 20);

  doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
  doc.setDrawColor(cardBorderColor[0], cardBorderColor[1], cardBorderColor[2]);
  doc.roundedRect(margin, y, contentWidth, scopeBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('SCOPE OF WORK & SERVICE REQUIREMENTS:', margin + 10, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
  doc.text(splitScope, margin + 10, y + 23);

  y += scopeBoxHeight + 10;

  // 5. LINE ITEMS TABLE (jspdf-autotable)
  const tableBody = (quote?.items || []).map((item, index) => [
    (index + 1).toString(),
    item.type.toUpperCase(),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, profile.currencySymbol),
    formatCurrency(item.total, profile.currencySymbol)
  ]);

  if (tableBody.length === 0) {
    tableBody.push([
      '1',
      'LABOR',
      `${job.title} (Standard Labor Estimate)`,
      '1',
      formatCurrency(profile.defaultHourlyRate, profile.currencySymbol),
      formatCurrency(profile.defaultHourlyRate, profile.currencySymbol)
    ]);
  }

  autoTable(doc, {
    startY: y,
    head: [['#', 'TYPE', 'DESCRIPTION & MATERIALS', 'QTY', 'RATE', 'TOTAL (AUD)']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4.5
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 4.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 65, halign: 'right' },
      5: { cellWidth: 75, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  const lastAutoTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  y = lastAutoTable ? lastAutoTable.finalY + 12 : y + 100;

  // 6. TOTALS BREAKDOWN SUMMARY BOX (RIGHT-ALIGNED)
  const subtotal = quote?.subtotal ?? profile.defaultHourlyRate;
  const taxAmount = quote?.taxAmount ?? (subtotal * (profile.taxRatePercent / 100));
  const discountAmount = quote?.discountAmount ?? 0;
  const totalAmount = quote?.totalAmount ?? (subtotal + taxAmount - discountAmount);

  const summaryWidth = 210;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(formatCurrency(subtotal, profile.currencySymbol), pageWidth - margin, y, { align: 'right' });

  if (discountAmount > 0) {
    y += 12;
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('Discount Applied:', summaryX, y);
    doc.text(`-${formatCurrency(discountAmount, profile.currencySymbol)}`, pageWidth - margin, y, { align: 'right' });
  }

  y += 12;
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`GST (${profile.taxRatePercent}%):`, summaryX, y);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(formatCurrency(taxAmount, profile.currencySymbol), pageWidth - margin, y, { align: 'right' });

  y += 6;
  doc.setDrawColor(cardBorderColor[0], cardBorderColor[1], cardBorderColor[2]);
  doc.line(summaryX, y, pageWidth - margin, y);
  y += 12;

  // Grand Total Highlight Pill
  doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1);
  doc.roundedRect(summaryX - 6, y - 10, summaryWidth + 6, 22, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TOTAL DUE:', summaryX, y + 4);
  doc.setFontSize(11);
  doc.text(formatCurrency(totalAmount, profile.currencySymbol), pageWidth - margin - 4, y + 4, { align: 'right' });

  y += 24;

  // 7. BANK EFT DIRECT DEPOSIT & PAYID PAYMENT DETAILS CARD
  if (y + 115 > pageHeight - 40) {
    doc.addPage();
    y = 36;
  }

  const payIdValue = profile.payId || profile.phone || profile.email;
  const eftBoxHeight = 66;

  doc.setFillColor(cardBgColor[0], cardBgColor[1], cardBgColor[2]);
  doc.setDrawColor(cardBorderColor[0], cardBorderColor[1], cardBorderColor[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, y, contentWidth, eftBoxHeight, 4, 4, 'FD');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('PAYMENT DETAILS & DIRECT DEPOSIT (EFT)', margin + 10, y + 12);

  // Split into 2 clean columns inside the EFT box
  const eftColWidth = (contentWidth - 20) / 2;

  // Left EFT column (Bank info)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(bodyTextColor[0], bodyTextColor[1], bodyTextColor[2]);
  doc.text(`Account Name: ${profile.accountName || profile.businessName}`, margin + 10, y + 25);
  doc.text(`Bank: ${profile.bankName || 'Commonwealth Bank of Australia'}`, margin + 10, y + 36);
  doc.setFont('helvetica', 'bold');
  doc.text(`BSB: ${profile.bsb || '063-875'}    Account #: ${profile.accountNumber || '1048 9921'}`, margin + 10, y + 48);

  // Right EFT column (PayID & Terms)
  const eftRightX = margin + eftColWidth + 10;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text(`Instant PayID: ${payIdValue}`, eftRightX, y + 25);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Terms: ${profile.paymentTerms || 'Payment due within 7 days of invoice date.'}`, eftRightX, y + 36);
  doc.text(`Payment Reference: Use Ref #${docNumber}`, eftRightX, y + 48);

  y += eftBoxHeight + 10;

  // 8. CLIENT AUTHORIZATION & DIGITAL SIGN-OFF CARD (STRICT 2-COLUMN - NO OVERLAP)
  if (y + 70 > pageHeight - 40) {
    doc.addPage();
    y = 36;
  }

  const signBoxHeight = 58;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cardBorderColor[0], cardBorderColor[1], cardBorderColor[2]);
  doc.roundedRect(margin, y, contentWidth, signBoxHeight, 4, 4, 'FD');

  // Left side: Agreement statement (wrapped to max 290pt so it NEVER touches signature)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('CLIENT SIGN-OFF & ACCEPTANCE', margin + 10, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  const signDisclaimer = 'Customer verification confirming satisfactory completion of repair works and acceptance of invoice terms.';
  const signDisclaimerLines = doc.splitTextToSize(signDisclaimer, 280);
  doc.text(signDisclaimerLines, margin + 10, y + 24);

  // Right side: Signature / Approval stamp (isolated in right 180pt)
  const sigX = pageWidth - margin - 170;
  const signatureData = job.signature?.dataUrl || quote?.clientSignature;
  const signatureName = job.signature?.signedBy || quote?.clientSignatureName || job.clientName;
  const signatureDate = job.signature?.signedAt || quote?.signedAt || new Date().toISOString();

  if (signatureData) {
    try {
      doc.addImage(signatureData, 'PNG', sigX, y + 5, 130, 26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(`[VERIFIED] Signed by: ${signatureName}`, sigX, y + 40);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(`Date: ${formatDate(signatureDate)}`, sigX, y + 50);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text(`[VERIFIED] Signed: ${signatureName}`, sigX, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(`Date: ${formatDate(signatureDate)}`, sigX, y + 38);
    }
  } else if (signatureName && (quote?.status === 'accepted' || job.status === 'completed' || job.status === 'invoiced')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(16, 185, 129);
    doc.text(`[APPROVED] Signed by: ${signatureName}`, sigX, y + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(`Date: ${formatDate(signatureDate)}`, sigX, y + 38);
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.line(sigX, y + 32, sigX + 160, y + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Customer Signature & Date', sigX + 20, y + 44);
  }

  // 9. PAGE FOOTER ON ALL PAGES
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const footerText = `${profile.businessName}${profile.abn ? ` | ABN: ${profile.abn}` : ''} | HandyMap PRO | Page ${i} of ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 16, { align: 'center' });
  }

  // Download PDF
  const filename = `${docTitle.replace(/\s+/g, '_')}_${job.jobNumber}.pdf`;
  doc.save(filename);
}


