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
  const margin = 40;
  const contentWidth = pageWidth - margin * 2; // 515.28 pt

  const isInvoice = job.status === 'invoiced';
  const docTitle = isInvoice ? 'TAX INVOICE' : 'SERVICE ESTIMATE & QUOTE';
  const docNumber = isInvoice 
    ? (job.jobNumber.startsWith('INV') ? job.jobNumber : `INV-${job.jobNumber}`)
    : (quote?.quoteNumber || `QTE-${job.jobNumber}`);

  // Brand Accent Colors
  const primaryColor = isInvoice ? [37, 99, 235] : [217, 119, 6]; // Blue-600 or Amber-600
  const darkTextColor = [15, 23, 42]; // Slate-900
  const mutedTextColor = [100, 116, 139]; // Slate-500
  const subtleBgColor = [248, 250, 252]; // Slate-50

  // 1. TOP HEADER SECTION (Clean Modern Vector Layout with Accent Bar)
  // Top decorative colored bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 6, 'F');

  let y = 36;

  // Left Column: Business & Provider Identity
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  const businessNameLines = doc.splitTextToSize(profile.businessName, 320);
  doc.text(businessNameLines, margin, y);
  y += businessNameLines.length * 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);

  if (profile.abn) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`ABN: ${profile.abn}`, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    y += 13;
  }

  doc.text(`Proprietor: ${profile.name}`, margin, y);
  y += 13;
  doc.text(`Phone: ${profile.phone}  •  Email: ${profile.email}`, margin, y);
  y += 13;
  doc.text(profile.baseAddress, margin, y);
  y += 18;

  // Right Column: Document Type Badge & Reference Details (Rendered on top right)
  const rightColX = pageWidth - margin;
  let rightY = 36;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(docTitle, rightColX, rightY, { align: 'right' });
  rightY += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Ref: ${docNumber}`, rightColX, rightY, { align: 'right' });
  rightY += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`Date Issued: ${formatDate(quote?.createdAt || new Date().toISOString())}`, rightColX, rightY, { align: 'right' });
  rightY += 13;

  const validOrDueDateLabel = isInvoice ? 'Payment Due' : 'Valid Until';
  const validOrDueDateValue = formatDate(quote?.validUntil || new Date(Date.now() + 14 * 86400000).toISOString());
  doc.text(`${validOrDueDateLabel}: ${validOrDueDateValue}`, rightColX, rightY, { align: 'right' });
  rightY += 13;

  doc.text(`Job ID: ${job.jobNumber}  •  Priority: ${job.priority.toUpperCase()}`, rightColX, rightY, { align: 'right' });

  // Synchronize dynamic vertical offset
  y = Math.max(y, rightY) + 10;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 15;

  // 2. CLIENT & PROPERTY MANAGEMENT / AGENCY INFO BOX
  const clientBoxY = y;
  const colWidth = (contentWidth - 20) / 2;

  // Left Column: Bill To / Client
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('CLIENT / SERVICE LOCATION', margin, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(job.clientName, margin, y);
  y += 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const clientAddressLines = doc.splitTextToSize(job.address, colWidth);
  doc.text(clientAddressLines, margin, y);
  y += clientAddressLines.length * 12;
  doc.text(`Phone: ${job.clientPhone}`, margin, y);
  y += 12;
  doc.text(`Email: ${job.clientEmail}`, margin, y);
  y += 12;

  // Right Column: Agency / Work Order Details (or Job Meta)
  let rightInfoY = clientBoxY;
  const rightInfoX = margin + colWidth + 20;

  if (job.isAgencyJob && job.realEstateAgency) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(124, 58, 237); // Purple 600
    doc.text('REAL ESTATE AGENCY / WORK ORDER', rightInfoX, rightInfoY);
    rightInfoY += 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(job.realEstateAgency, rightInfoX, rightInfoY);
    rightInfoY += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    if (job.workOrderNumber) {
      doc.text(`Work Order #: ${job.workOrderNumber}`, rightInfoX, rightInfoY);
      rightInfoY += 12;
    }
    if (job.realEstateAgentName) {
      doc.text(`Property Mgr: ${job.realEstateAgentName}`, rightInfoX, rightInfoY);
      rightInfoY += 12;
    }
    if (job.tenantName) {
      doc.text(`Tenant: ${job.tenantName} (${job.tenantPhone || 'On-site'})`, rightInfoX, rightInfoY);
      rightInfoY += 12;
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text('PROJECT CATEGORY & SERVICE', rightInfoX, rightInfoY);
    rightInfoY += 14;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(job.category, rightInfoX, rightInfoY);
    rightInfoY += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Trade Category: ${job.category}`, rightInfoX, rightInfoY);
    rightInfoY += 12;
    doc.text(`Estimated Duration: ${job.estimatedDurationMinutes || 60} minutes`, rightInfoX, rightInfoY);
    rightInfoY += 12;
  }

  y = Math.max(y, rightInfoY) + 10;

  // 3. SCOPE OF WORK CONTAINER
  const scopeDesc = `${job.title} — ${job.description}`;
  const splitScope = doc.splitTextToSize(scopeDesc, contentWidth - 24);
  const scopeBoxHeight = Math.max(42, splitScope.length * 11 + 24);

  doc.setFillColor(subtleBgColor[0], subtleBgColor[1], subtleBgColor[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, scopeBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('SCOPE OF WORK & SERVICE REQUIREMENTS:', margin + 12, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(splitScope, margin + 12, y + 26);

  y += scopeBoxHeight + 15;

  // 4. LINE ITEMS TABLE (using jspdf-autotable)
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
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 65, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 38, halign: 'center' },
      4: { cellWidth: 65, halign: 'right' },
      5: { cellWidth: 75, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  const lastAutoTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  y = lastAutoTable ? lastAutoTable.finalY + 16 : y + 140;

  // 5. TOTALS BREAKDOWN BOX (Right Aligned)
  const subtotal = quote?.subtotal ?? profile.defaultHourlyRate;
  const taxAmount = quote?.taxAmount ?? (subtotal * (profile.taxRatePercent / 100));
  const discountAmount = quote?.discountAmount ?? 0;
  const totalAmount = quote?.totalAmount ?? (subtotal + taxAmount - discountAmount);

  const summaryWidth = 200;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(formatCurrency(subtotal, profile.currencySymbol), pageWidth - margin, y, { align: 'right' });

  if (discountAmount > 0) {
    y += 14;
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('Discount Applied:', summaryX, y);
    doc.text(`-${formatCurrency(discountAmount, profile.currencySymbol)}`, pageWidth - margin, y, { align: 'right' });
  }

  y += 14;
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(`GST (${profile.taxRatePercent}%):`, summaryX, y);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(formatCurrency(taxAmount, profile.currencySymbol), pageWidth - margin, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, y, pageWidth - margin, y);
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TOTAL DUE:', summaryX, y);
  doc.text(formatCurrency(totalAmount, profile.currencySymbol), pageWidth - margin, y, { align: 'right' });

  y += 24;

  // 6. BANK EFT DIRECT DEPOSIT & PAYID PAYMENT DETAILS
  if (y + 130 > pageHeight - 50) {
    doc.addPage();
    y = 40;
  }

  const payIdValue = profile.payId || profile.phone || profile.email;
  const eftBoxHeight = 72;
  doc.setFillColor(subtleBgColor[0], subtleBgColor[1], subtleBgColor[2]);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, eftBoxHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('DIRECT DEPOSIT (EFT) / PAYID PAYMENT INFORMATION', margin + 12, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const bankTextLeft = [
    `Account Name: ${profile.accountName || profile.businessName}`,
    `Bank: ${profile.bankName || 'Commonwealth Bank of Australia'}`,
    `BSB: ${profile.bsb || '063-875'}`,
    `Acc #: ${profile.accountNumber || '1048 9921'}`
  ];
  doc.text(bankTextLeft.join('   |   '), margin + 12, y + 27);

  if (payIdValue) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235); // Blue
    doc.text(`⚡ Instant PayID: ${payIdValue}`, margin + 12, y + 40);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
  }

  const paymentTerms = profile.paymentTerms || 'Payment due within 7 days of invoice date. Quoted rates include standard warranty on workmanship.';
  const termsWrapped = doc.splitTextToSize(`Terms: ${paymentTerms}  •  Ref: ${docNumber}`, contentWidth - 24);
  doc.text(termsWrapped, margin + 12, y + 53);

  y += eftBoxHeight + 16;

  // 7. CLIENT AUTHORIZATION / DIGITAL SIGNATURE
  if (y + 80 > pageHeight - 50) {
    doc.addPage();
    y = 40;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 68, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('CLIENT SIGN-OFF & AUTHORIZATION', margin + 12, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text(
    'Customer verification confirming satisfactory completion of repair works and acceptance of invoice terms.',
    margin + 12,
    y + 26
  );

  const sigX = pageWidth - margin - 180;
  const signatureData = job.signature?.dataUrl || quote?.clientSignature;
  const signatureName = job.signature?.signedBy || quote?.clientSignatureName || job.clientName;
  const signatureDate = job.signature?.signedAt || quote?.signedAt || new Date().toISOString();

  if (signatureData) {
    try {
      doc.addImage(signatureData, 'PNG', sigX, y + 8, 160, 36);
      doc.setFontSize(7.5);
      doc.setTextColor(16, 185, 129);
      doc.text(`✓ Verified Signed: ${signatureName}`, sigX, y + 52);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(`Date: ${formatDate(signatureDate)}`, sigX, y + 62);
    } catch {
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text(`Electronically Signed by: ${signatureName}`, sigX, y + 36);
      doc.setFontSize(7.5);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(`Date: ${formatDate(signatureDate)}`, sigX, y + 48);
    }
  } else if (signatureName && (quote?.status === 'accepted' || job.status === 'completed' || job.status === 'invoiced')) {
    doc.setFontSize(8.5);
    doc.setTextColor(16, 185, 129);
    doc.text(`✓ Approved: ${signatureName}`, sigX, y + 34);
    doc.setFontSize(7.5);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(`Date: ${formatDate(signatureDate)}`, sigX, y + 48);
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.line(sigX, y + 42, pageWidth - margin - 10, y + 42);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Customer Signature / Date', sigX + 30, y + 54);
  }

  // 8. PAGE FOOTER ON ALL PAGES
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const footerText = `${profile.businessName}${profile.abn ? ` • ABN: ${profile.abn}` : ''} • HandyMap Pro • Page ${i} of ${pageCount}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }

  // Download PDF
  const filename = `${docTitle.replace(/\s+/g, '_')}_${job.jobNumber}.pdf`;
  doc.save(filename);
}

