import * as XLSX from 'xlsx';
import { Job, JobStatus, JobPriority, JobCategory } from '../types';
import {
  SavedAgent,
  SavedTenant,
  SavedOwner,
  SavedCustomer,
  loadSavedAgents,
  loadSavedTenants,
  loadSavedOwners,
  loadSavedCustomers,
  saveOrUpdateAgent,
  saveOrUpdateTenant,
  saveOrUpdateOwner,
  saveOrUpdateCustomer
} from './contactDirectory';
import { formatJobDisplayId, formatDate, formatTime } from '../utils/helpers';
import { formatPhoneNumber } from '../utils/phoneUtils';

/**
 * ============================================================================
 * 1. EXPORT ALL JOBS TO EXCEL (EVERY SINGLE FIELD)
 * ============================================================================
 */
export function exportJobsToExcel(jobs: Job[], customFilename?: string): void {
  const rows = jobs.map(j => {
    return {
      'Display Job ID': formatJobDisplayId(j),
      'Job Number': j.jobNumber || '',
      'Quote Number': j.quoteNumber || j.quote?.quoteNumber || '',
      'Invoice Number': j.invoiceNumber || '',
      'Work Order #': j.workOrderNumber || '',
      'Title': j.title || '',
      'Pipeline Status': j.status || '',
      'Priority': j.priority || '',
      'Trade Category': j.category || '',
      'Estimated Duration (Mins)': j.estimatedDurationMinutes || 45,
      'Approved Budget / NTE ($)': j.nteLimit !== undefined && j.nteLimit !== null ? j.nteLimit : '',
      
      // Site Location
      'Street Address': j.address || '',
      'Suburb': j.suburb || '',
      'Latitude': j.coordinates?.[0] ?? '',
      'Longitude': j.coordinates?.[1] ?? '',

      // Scheduling & Timings
      'Scheduled Appointment Date & Time': j.appointmentTime || '',
      'Quote Requested Date': j.quoteRequestedDate || '',
      'Is Completed': (j.status === 'completed' || j.status === 'invoiced') ? 'YES' : 'NO',
      'Created Date': j.createdAt ? `${formatDate(j.createdAt)} ${formatTime(j.createdAt)}` : '',
      'Last Updated': j.updatedAt ? `${formatDate(j.updatedAt)} ${formatTime(j.updatedAt)}` : '',

      // Owner & Client Details
      'Owner Name': j.ownerName || j.clientName || '',
      'Owner Phone': j.ownerPhone || j.clientPhone || '',
      'Owner Email': j.ownerEmail || j.clientEmail || '',
      'Client Name': j.clientName || j.ownerName || '',
      'Client Phone': j.clientPhone || j.ownerPhone || '',
      'Client Email': j.clientEmail || j.ownerEmail || '',

      // Real Estate Agency
      'Is Agency Job': j.isAgencyJob ? 'YES' : 'NO',
      'Real Estate Agency Partner': j.realEstateAgency || '',
      'Property Manager / Agent Name': j.realEstateAgentName || '',
      'Property Manager Phone': j.realEstateAgentPhone || '',
      'Property Manager Email': j.realEstateAgentEmail || '',

      // Tenants
      'Tenant 1 Name': j.tenant1Name || j.tenantName || '',
      'Tenant 1 Phone': j.tenant1Phone || j.tenantPhone || '',
      'Tenant 1 Email': j.tenant1Email || '',
      'Tenant 2 Name': j.tenant2Name || '',
      'Tenant 2 Phone': j.tenant2Phone || '',
      'Tenant 2 Email': j.tenant2Email || '',

      // Property Owner
      'Property Owner / Landlord': j.ownerName || j.clientName || '',
      'Property Owner Phone': j.ownerPhone || j.clientPhone || '',
      'Property Owner Email': j.ownerEmail || j.clientEmail || '',

      // Scope & Tasks
      'Scope Description': j.description || '',
      'Checklist Tasks': Array.isArray(j.tasks) ? j.tasks.map(t => `${t.isCompleted ? '[X]' : '[ ]'} ${t.title}`).join(' | ') : '',
      'Quote Total Amount ($)': j.quote?.totalAmount ?? '',
      'Internal Notes': Array.isArray(j.internalNotes) ? j.internalNotes.join('; ') : ''
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'All_Jobs');

  // Column width formatting
  worksheet['!cols'] = [
    { wch: 18 }, // Display Job ID
    { wch: 14 }, // Job Number
    { wch: 14 }, // Quote Number
    { wch: 14 }, // Invoice Number
    { wch: 16 }, // Work Order #
    { wch: 40 }, // Title
    { wch: 16 }, // Status
    { wch: 12 }, // Priority
    { wch: 18 }, // Trade Category
    { wch: 22 }, // Duration
    { wch: 24 }, // Budget NTE
    { wch: 35 }, // Street Address
    { wch: 18 }, // Suburb
    { wch: 14 }, // Latitude
    { wch: 14 }, // Longitude
    { wch: 32 }, // Appointment
    { wch: 22 }, // Quote requested
    { wch: 22 }, // Completed
    { wch: 14 }, // Is Completed
    { wch: 20 }, // Created
    { wch: 20 }, // Updated
    { wch: 22 }, // Client Name
    { wch: 16 }, // Client Phone
    { wch: 25 }, // Client Email
    { wch: 14 }, // Is Agency
    { wch: 28 }, // Agency Partner
    { wch: 24 }, // PM Name
    { wch: 18 }, // PM Phone
    { wch: 26 }, // PM Email
    { wch: 20 }, // Tenant 1 Name
    { wch: 16 }, // Tenant 1 Phone
    { wch: 24 }, // Tenant 1 Email
    { wch: 20 }, // Tenant 2 Name
    { wch: 16 }, // Tenant 2 Phone
    { wch: 24 }, // Tenant 2 Email
    { wch: 24 }, // Owner Name
    { wch: 50 }, // Description
    { wch: 45 }, // Tasks
    { wch: 20 }, // Quote Total
    { wch: 40 }  // Internal Notes
  ];

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `HandyMap_Jobs_Export_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * ============================================================================
 * 2. EXPORT ALL CONTACTS TO EXCEL (EVERY SINGLE FIELD ACROSS ALL DIRECTORY TABS)
 * ============================================================================
 */
export function exportContactsToExcel(customFilename?: string): void {
  const agents = loadSavedAgents();
  const tenants = loadSavedTenants();
  const owners = loadSavedOwners();
  const customers = loadSavedCustomers();

  const workbook = XLSX.utils.book_new();

  // 1. Real Estate Agents Sheet
  const agentRows = agents.map(a => ({
    'Agency Name': a.agencyName || '',
    'Property Manager / Agent Name': a.agentName || '',
    'Agent Phone': a.agentPhone || '',
    'Agent Email': a.agentEmail || '',
    'Agency Office Address': a.agencyAddress || '',
    'Agency Suburb': a.agencySuburb || '',
    'Notes / Details': a.notes || '',
    'Usage Count': a.useCount || 1,
    'Last Contacted / Used': a.lastUsedAt || ''
  }));
  const agentSheet = XLSX.utils.json_to_sheet(agentRows);
  agentSheet['!cols'] = [
    { wch: 28 }, { wch: 26 }, { wch: 18 }, { wch: 28 },
    { wch: 32 }, { wch: 18 }, { wch: 35 }, { wch: 12 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, agentSheet, 'Real_Estate_Agents');

  // 2. Tenants Sheet
  const tenantRows = tenants.map(t => ({
    'Tenant Name': t.tenantName || '',
    'Tenant Phone': t.tenantPhone || '',
    'Tenant Email': t.tenantEmail || '',
    'Rented Property Address': t.propertyAddress || '',
    'Suburb': t.suburb || '',
    'Managing Real Estate Agency': t.agencyName || '',
    'Notes / Access Details': t.notes || '',
    'Usage Count': t.useCount || 1,
    'Last Contacted / Used': t.lastUsedAt || ''
  }));
  const tenantSheet = XLSX.utils.json_to_sheet(tenantRows);
  tenantSheet['!cols'] = [
    { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 35 },
    { wch: 18 }, { wch: 28 }, { wch: 35 }, { wch: 12 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, tenantSheet, 'Tenants');

  // 3. Owners / Landlords Sheet
  const ownerRows = owners.map(o => ({
    'Owner / Landlord Name': o.ownerName || '',
    'Phone': o.ownerPhone || '',
    'Email': o.ownerEmail || '',
    'Investment Property Address': o.propertyAddress || '',
    'Suburb': o.suburb || '',
    'Managing Real Estate Agency': o.agencyName || '',
    'Notes': o.notes || '',
    'Usage Count': o.useCount || 1,
    'Last Contacted / Used': o.lastUsedAt || ''
  }));
  const ownerSheet = XLSX.utils.json_to_sheet(ownerRows);
  ownerSheet['!cols'] = [
    { wch: 26 }, { wch: 18 }, { wch: 28 }, { wch: 35 },
    { wch: 18 }, { wch: 28 }, { wch: 35 }, { wch: 12 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, ownerSheet, 'Property_Owners');

  // 4. Direct Customers Sheet
  const customerRows = customers.map(c => ({
    'Customer Full Name': c.name || '',
    'Phone': c.phone || '',
    'Email': c.email || '',
    'Street Address': c.address || '',
    'Suburb': c.suburb || '',
    'Latitude': c.coordinates?.[0] ?? '',
    'Longitude': c.coordinates?.[1] ?? '',
    'Notes': c.notes || '',
    'Jobs Count': c.useCount || 1,
    'Last Contacted / Used': c.lastUsedAt || ''
  }));
  const customerSheet = XLSX.utils.json_to_sheet(customerRows);
  customerSheet['!cols'] = [
    { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 35 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 35 }, { wch: 12 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(workbook, customerSheet, 'Direct_Clients');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = customFilename || `HandyMap_Contacts_Directory_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);
}

/**
 * ============================================================================
 * 3. IMPORT CONTACTS FROM EXCEL / CSV (ACROSS ALL CONTACT TYPES)
 * ============================================================================
 */
export async function importContactsFromSpreadsheet(file: File): Promise<{
  agentsImported: number;
  tenantsImported: number;
  ownersImported: number;
  customersImported: number;
  totalImported: number;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return reject(new Error('The uploaded file contains no sheets.'));
        }

        let agentsCount = 0;
        let tenantsCount = 0;
        let ownersCount = 0;
        let customersCount = 0;
        const errors: string[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) return;

          const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
          if (!Array.isArray(rows) || rows.length === 0) return;

          const sLower = sheetName.toLowerCase();

          rows.forEach((row, rowIndex) => {
            const findCol = (aliases: string[]): string => {
              const keys = Object.keys(row);
              for (const alias of aliases) {
                const match = keys.find(k => k.trim().toLowerCase().replace(/[\s_.-]+/g, '') === alias.toLowerCase().replace(/[\s_.-]+/g, ''));
                if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== '') {
                  return String(row[match]).trim();
                }
              }
              return '';
            };

            const contactType = findCol(['contacttype', 'type', 'category']).toLowerCase();

            // Determine if this row belongs to Agents, Tenants, Owners, or Customers
            const isAgent = sLower.includes('agent') || contactType === 'agent' || Boolean(findCol(['agencyname', 'agency', 'propertymanager', 'propertymanagername']));
            const isTenant = sLower.includes('tenant') || contactType === 'tenant' || Boolean(findCol(['tenantname', 'tenant']));
            const isOwner = sLower.includes('owner') || sLower.includes('landlord') || contactType === 'owner' || contactType === 'landlord' || Boolean(findCol(['ownername', 'landlord', 'owner']));

            if (isAgent && !isTenant && !isOwner) {
              const agency = findCol(['agencyname', 'agency', 'realestateagency', 'company']) || 'Real Estate Agency';
              const name = findCol(['agentname', 'propertymanager', 'propertymanagername', 'name', 'contact']) || 'Property Manager';
              const phone = findCol(['agentphone', 'phone', 'mobile', 'pmphone']);
              const email = findCol(['agentemail', 'email', 'pmemail']);
              const address = findCol(['agencyaddress', 'officeaddress', 'address']);
              const suburb = findCol(['agencysuburb', 'suburb']) || 'Point Cook';
              const notes = findCol(['notes', 'details', 'comment']);

              if (agency || name || phone) {
                saveOrUpdateAgent({
                  agencyName: agency,
                  agentName: name,
                  agentPhone: phone ? formatPhoneNumber(phone) : '',
                  agentEmail: email,
                  agencyAddress: address,
                  agencySuburb: suburb,
                  notes
                });
                agentsCount++;
              }
            } else if (isTenant) {
              const name = findCol(['tenantname', 'name', 'fullname', 'tenant']);
              const phone = findCol(['tenantphone', 'phone', 'mobile']);
              const email = findCol(['tenantemail', 'email']);
              const address = findCol(['propertyaddress', 'address', 'streetaddress']);
              const suburb = findCol(['suburb']) || 'Point Cook';
              const agency = findCol(['managingagency', 'agencyname', 'agency']);
              const notes = findCol(['notes', 'accessdetails', 'details']);

              if (name || phone || address) {
                saveOrUpdateTenant({
                  tenantName: name || 'Tenant',
                  tenantPhone: phone ? formatPhoneNumber(phone) : '',
                  tenantEmail: email,
                  propertyAddress: address,
                  suburb,
                  agencyName: agency,
                  notes
                });
                tenantsCount++;
              }
            } else if (isOwner) {
              const name = findCol(['ownername', 'landlordname', 'name', 'owner', 'landlord']);
              const phone = findCol(['ownerphone', 'phone', 'mobile']);
              const email = findCol(['owneremail', 'email']);
              const address = findCol(['propertyaddress', 'investmentproperty', 'address']);
              const suburb = findCol(['suburb']) || 'Point Cook';
              const agency = findCol(['managingagency', 'agencyname', 'agency']);
              const notes = findCol(['notes', 'details']);

              if (name || phone || address) {
                saveOrUpdateOwner({
                  ownerName: name || 'Landlord',
                  ownerPhone: phone ? formatPhoneNumber(phone) : '',
                  ownerEmail: email,
                  propertyAddress: address,
                  suburb,
                  agencyName: agency,
                  notes
                });
                ownersCount++;
              }
            } else {
              // Direct client
              const name = findCol(['customername', 'clientname', 'name', 'fullname']);
              const phone = findCol(['phone', 'mobile', 'clientphone']);
              const email = findCol(['email', 'clientemail']);
              const address = findCol(['streetaddress', 'address', 'propertyaddress']);
              const suburb = findCol(['suburb']) || 'Point Cook';
              const notes = findCol(['notes', 'comment']);

              if (name || phone || address) {
                saveOrUpdateCustomer({
                  name: name || 'Customer',
                  phone: phone ? formatPhoneNumber(phone) : '',
                  email,
                  address,
                  suburb,
                  notes
                });
                customersCount++;
              }
            }
          });
        });

        resolve({
          agentsImported: agentsCount,
          tenantsImported: tenantsCount,
          ownersImported: ownersCount,
          customersImported: customersCount,
          totalImported: agentsCount + tenantsCount + ownersCount + customersCount,
          errors
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse contacts spreadsheet: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the selected file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * ============================================================================
 * 4. DOWNLOAD SAMPLE CONTACTS EXCEL TEMPLATE (.XLSX)
 * ============================================================================
 */
export function downloadContactsExcelTemplate(): void {
  const workbook = XLSX.utils.book_new();

  // 1. Agents Template
  const sampleAgents = [
    {
      'Agency Name': 'Ray White Point Cook',
      'Property Manager / Agent Name': 'Sarah Jenkins',
      'Agent Phone': '0412 888 901',
      'Agent Email': 'sarah.j@raywhite.com',
      'Agency Office Address': 'Level 1, 12 Main St',
      'Agency Suburb': 'Point Cook',
      'Notes / Details': 'Prefers SMS work order notifications'
    },
    {
      'Agency Name': 'Barry Plant Tarneit',
      'Property Manager / Agent Name': 'Michael Wong',
      'Agent Phone': '0423 445 667',
      'Agent Email': 'm.wong@barryplant.com.au',
      'Agency Office Address': '450 Sayers Rd',
      'Agency Suburb': 'Tarneit',
      'Notes / Details': 'Quote approval within 24 hours'
    }
  ];
  const sheetAgents = XLSX.utils.json_to_sheet(sampleAgents);
  sheetAgents['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, sheetAgents, 'Real_Estate_Agents');

  // 2. Tenants Template
  const sampleTenants = [
    {
      'Tenant Name': 'Jordan Miller',
      'Tenant Phone': '0412 345 678',
      'Tenant Email': 'jordan.m@gmail.com',
      'Rented Property Address': '20 Banjo Paterson Lake',
      'Suburb': 'Point Cook',
      'Managing Real Estate Agency': 'Ray White Point Cook',
      'Notes / Access Details': 'Side gate code is 1234'
    }
  ];
  const sheetTenants = XLSX.utils.json_to_sheet(sampleTenants);
  sheetTenants['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, sheetTenants, 'Tenants');

  // 3. Owners Template
  const sampleOwners = [
    {
      'Owner / Landlord Name': 'David Henderson',
      'Phone': '0433 112 233',
      'Email': 'david.h@investmentprop.com.au',
      'Investment Property Address': '14 Boardwalk Blvd',
      'Suburb': 'Point Cook',
      'Managing Real Estate Agency': 'Ray White Point Cook',
      'Notes': 'Authorize repairs up to $500 directly'
    }
  ];
  const sheetOwners = XLSX.utils.json_to_sheet(sampleOwners);
  sheetOwners['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 28 }, { wch: 30 }, { wch: 18 }, { wch: 25 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(workbook, sheetOwners, 'Property_Owners');

  // 4. Customers Template
  const sampleCustomers = [
    {
      'Customer Full Name': 'Emma Taylor',
      'Phone': '0434 998 112',
      'Email': 'emma.t@example.com.au',
      'Street Address': '7 Seabrook Blvd',
      'Suburb': 'Seabrook',
      'Notes': 'Repeat client - painter & handyman tasks'
    }
  ];
  const sheetCustomers = XLSX.utils.json_to_sheet(sampleCustomers);
  sheetCustomers['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 25 }, { wch: 30 }, { wch: 18 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(workbook, sheetCustomers, 'Direct_Clients');

  XLSX.writeFile(workbook, 'HandyMap_Contacts_Import_Template.xlsx');
}
