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

  const isInvoice = job.status === 'invoiced';
  const docTitle = isInvoice ? 'TAX INVOICE' : 'SERVICE ESTIMATE & QUOTE';
  const docNumber = isInvoice 
    ? (job.jobNumber.startsWith('INV') ? job.jobNumber : `INV-${job.jobNumber}`)
    : (quote?.quoteNumber || `QTE-${job.jobNumber}`);

  // Colors
  const primaryColor = isInvoice ? [37, 99, 235] : [245, 158, 11]; // Blue or Amber
  const darkTextColor = [15, 23, 42]; // Slate-900
  const mutedTextColor = [100, 116, 139]; // Slate-500

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // Dark slate background header
  doc.rect(0, 0, 595.28, 90, 'F');

  // Business Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(profile.businessName, 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`${profile.name} • ${profile.phone} • ${profile.email}`, 40, 62);

  // Document Badge (Right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(docTitle, 555, 42, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Ref: ${docNumber}`, 555, 62, { align: 'right' });

  // 2. Client & Job Metadata Columns
  let yPos = 120;

  // Left Column: Customer Info
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENT / SERVICE LOCATION', 40, yPos);

  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(job.clientName, 40, yPos + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(job.address, 40, yPos + 32);
  doc.text(`Phone: ${job.clientPhone}`, 40, yPos + 48);
  doc.text(`Email: ${job.clientEmail}`, 40, yPos + 62);

  // Right Column: Quote Meta
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('QUOTE DETAILS', 380, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Date Issued: ${formatDate(quote?.createdAt || new Date().toISOString())}`, 380, yPos + 16);
  doc.text(`Valid Until: ${formatDate(quote?.validUntil || new Date(Date.now() + 14 * 86400000).toISOString())}`, 380, yPos + 32);
  doc.text(`Category: ${job.category}`, 380, yPos + 48);
  doc.text(`Job Priority: ${job.priority.toUpperCase()}`, 380, yPos + 62);

  // 3. Job Scope Box
  yPos = 205;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(40, yPos, 515, 50, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text('SCOPE OF WORK:', 52, yPos + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const splitDesc = doc.splitTextToSize(`${job.title} — ${job.description}`, 490);
  doc.text(splitDesc.slice(0, 2), 52, yPos + 32);

  // 4. Line Items Table
  const tableStartY = yPos + 65;

  const tableBody = (quote?.items || []).map((item, index) => [
    index + 1,
    item.type.toUpperCase(),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, profile.currencySymbol),
    formatCurrency(item.total, profile.currencySymbol)
  ]);

  // If no items yet, provide placeholder
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
    startY: tableStartY,
    head: [['#', 'TYPE', 'DESCRIPTION / MATERIALS', 'QTY', 'RATE', 'TOTAL']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 25, halign: 'center' },
      1: { cellWidth: 65, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 65, halign: 'right' },
      5: { cellWidth: 70, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 40, right: 40 }
  });

  // Calculate totals y position after table
  const lastAutoTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable;
  let finalY = lastAutoTable ? lastAutoTable.finalY + 20 : tableStartY + 150;

  const subtotal = quote?.subtotal ?? profile.defaultHourlyRate;
  const taxAmount = quote?.taxAmount ?? (subtotal * (profile.taxRatePercent / 100));
  const discountAmount = quote?.discountAmount ?? 0;
  const totalAmount = quote?.totalAmount ?? (subtotal + taxAmount - discountAmount);

  // Summary box (Right aligned)
  const summaryX = 350;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, finalY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(subtotal, profile.currencySymbol), 555, finalY, { align: 'right' });

  if (discountAmount > 0) {
    finalY += 16;
    doc.setTextColor(16, 185, 129); // Green
    doc.text('Discount Applied:', summaryX, finalY);
    doc.text(`-${formatCurrency(discountAmount, profile.currencySymbol)}`, 555, finalY, { align: 'right' });
  }

  finalY += 16;
  doc.setTextColor(100, 116, 139);
  doc.text(`Tax (${profile.taxRatePercent}%):`, summaryX, finalY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(taxAmount, profile.currencySymbol), 555, finalY, { align: 'right' });

  finalY += 12;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, finalY, 555, finalY);

  finalY += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TOTAL AMOUNT:', summaryX, finalY);
  doc.text(formatCurrency(totalAmount, profile.currencySymbol), 555, finalY, { align: 'right' });

  // 5. Signature and Acceptance Section
  let signatureY = finalY + 40;
  if (signatureY > 720) {
    doc.addPage();
    signatureY = 60;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(40, signatureY, 515, 85, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('TERMS & CLIENT AUTHORIZATION', 52, signatureY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'By signing below, the customer approves the scope and cost outlined above. Work begins upon scheduling.',
    52,
    signatureY + 32
  );

  if (quote?.clientSignature) {
    try {
      doc.addImage(quote.clientSignature, 'PNG', 360, signatureY + 25, 120, 40);
      doc.setFontSize(8);
      doc.setTextColor(16, 185, 129);
      doc.text(`Signed by: ${quote.clientSignatureName || job.clientName}`, 360, signatureY + 75);
    } catch {
      doc.text(`Electronically Signed by: ${quote.clientSignatureName || job.clientName}`, 360, signatureY + 50);
    }
  } else if (quote?.clientSignatureName) {
    doc.setFontSize(9);
    doc.setTextColor(16, 185, 129);
    doc.text(`Accepted by: ${quote.clientSignatureName}`, 360, signatureY + 50);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${formatDate(quote.signedAt || new Date().toISOString())}`, 360, signatureY + 65);
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.line(360, signatureY + 55, 530, signatureY + 55);
    doc.setFontSize(8);
    doc.text('Client Signature / Date', 400, signatureY + 70);
  }

  // 6. Footer
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `HandyMap Pro • ${profile.businessName} • Page ${i} of ${pageCount}`,
      297.64,
      820,
      { align: 'center' }
    );
  }

  // Download
  const filename = `${docTitle.replace(/\s+/g, '_')}_${job.jobNumber}.pdf`;
  doc.save(filename);
}
