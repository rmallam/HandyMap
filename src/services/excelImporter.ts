import * as XLSX from 'xlsx';
import { Job, JobStatus, JobPriority, JobCategory, JobTask } from '../types';

// Suburb Coordinates Lookup for Melbourne West & Greater Melbourne
const SUBURB_COORDINATES: Record<string, [number, number]> = {
  'point cook': [-37.9175, 144.7492],
  'sanctuary lakes': [-37.9015, 144.7565],
  'williams landing': [-37.8688, 144.7466],
  'seabrook': [-37.8860, 144.7645],
  'altona meadows': [-37.8765, 144.7812],
  'altona': [-37.8667, 144.8333],
  'altona north': [-37.8422, 144.8561],
  'tarneit': [-37.8360, 144.6640],
  'truganina': [-37.8280, 144.7180],
  'werribee': [-37.9020, 144.6620],
  'werribee south': [-37.9620, 144.7120],
  'hoppers crossing': [-37.8833, 144.7000],
  'laverton': [-37.8620, 144.7740],
  'wyndham vale': [-37.8920, 144.6150],
  'manor lakes': [-37.8770, 144.5980],
  'melton': [-37.6830, 144.5830],
  'rockbank': [-37.7330, 144.6500],
  'caroline springs': [-37.7520, 144.7390],
  'deer park': [-37.7710, 144.7760],
  'st albans': [-37.7450, 144.8020],
  'sunshine': [-37.7810, 144.8330],
  'footscray': [-37.8000, 144.9000],
  'yarraville': [-37.8180, 144.8910],
  'williamstown': [-37.8560, 144.8970],
  'newport': [-37.8430, 144.8870],
  'melbourne': [-37.8136, 144.9631]
};

function normalizeStatus(val: any): JobStatus {
  if (!val) return 'quote_requested';
  const str = String(val).toLowerCase().trim().replace(/[\s-_]+/g, '_');
  if (str.includes('quote_req') || str.includes('lead') || str.includes('request') || str === 'new') return 'quote_requested';
  if (str.includes('quoted') || str.includes('estimate') || str.includes('sent')) return 'quoted';
  if (str.includes('prog') || str.includes('active') || str.includes('sched') || str.includes('start')) return 'in_progress';
  if (str.includes('urg') || str.includes('emerg') || str.includes('rush') || str.includes('crit')) return 'urgent';
  if (str.includes('comp') || str.includes('done') || str.includes('finish')) return 'completed';
  if (str.includes('inv') || str.includes('bill') || str.includes('paid')) return 'invoiced';
  return 'quote_requested';
}

function normalizePriority(val: any): JobPriority {
  if (!val) return 'medium';
  const str = String(val).toLowerCase().trim();
  if (str.includes('urg') || str.includes('crit') || str.includes('emerg') || str.includes('flood') || str.includes('burst')) return 'urgent';
  if (str.includes('high') || str.includes('leak') || str.includes('lock') || str.includes('broken')) return 'high';
  if (str.includes('low')) return 'low';
  return 'medium';
}

function normalizeCategory(val: any): JobCategory {
  if (!val) return 'General Repair';
  const str = String(val).toLowerCase().trim();
  if (str.includes('plumb') || str.includes('tap') || str.includes('pipe') || str.includes('leak') || str.includes('toilet') || str.includes('drain') || str.includes('basin') || str.includes('shower') || str.includes('bath') || str.includes('sink')) return 'Plumbing';
  if (str.includes('elect') || str.includes('power') || str.includes('light') || str.includes('switch') || str.includes('wiring') || str.includes('sensor') || str.includes('lamp') || str.includes('globe')) return 'Electrical';
  if (str.includes('carp') || str.includes('timber') || str.includes('wood') || str.includes('deck') || str.includes('frame') || str.includes('skirting') || str.includes('fence') || str.includes('gate') || str.includes('flooring')) return 'Carpentry';
  if (str.includes('paint') || str.includes('coat') || str.includes('render') || str.includes('patch')) return 'Painting';
  if (str.includes('hvac') || str.includes('air') || str.includes('heat') || str.includes('cool') || str.includes('vent') || str.includes('rangehood') || str.includes('exhaust') || str.includes('oven')) return 'HVAC';
  if (str.includes('roof') || str.includes('gutter') || str.includes('tile') || str.includes('downpipe')) return 'Roofing';
  if (str.includes('assem') || str.includes('mount') || str.includes('ikea') || str.includes('tv') || str.includes('bracket') || str.includes('blind') || str.includes('curtain')) return 'Assembly & Mounting';
  if (str.includes('drywall') || str.includes('plaster') || str.includes('mason') || str.includes('brick') || str.includes('hole') || str.includes('wall')) return 'Drywall & Masonry';
  if (str.includes('door') || str.includes('window') || str.includes('lock') || str.includes('hinge') || str.includes('screen') || str.includes('sliding') || str.includes('cavity') || str.includes('latch') || str.includes('flyscreen')) return 'Door & Window';
  return 'General Repair';
}

function findValue(row: Record<string, any>, aliases: string[]): any {
  const rowKeys = Object.keys(row);
  for (const alias of aliases) {
    const key = rowKeys.find(k => k.trim().toLowerCase().replace(/[\s_.-]+/g, '') === alias.toLowerCase().replace(/[\s_.-]+/g, ''));
    if (key !== undefined && row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
      return row[key];
    }
  }
  return undefined;
}

/**
 * Parses an Excel (.xlsx, .xls) or CSV File into HandyMap Job objects
 */
export async function parseSpreadsheetFile(file: File): Promise<{
  jobs: Job[];
  warnings: string[];
  totalRows: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return reject(new Error('The uploaded spreadsheet contains no readable sheets.'));
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          return reject(new Error('No data rows found in spreadsheet.'));
        }

        const jobs: Job[] = [];
        const warnings: string[] = [];
        const timestamp = Date.now();

        rawRows.forEach((row, index) => {
          let rawTitle = String(findValue(row, ['title', 'jobtitle', 'summary', 'task', 'jobname', 'workdescription', 'name']) || '').trim();
          let rawNotes = String(findValue(row, ['notes', 'description', 'desc', 'details', 'scope', 'instructions']) || '').replace(/\r/g, '\n').trim();
          
          let clientName = String(findValue(row, ['clientname', 'client', 'customer', 'customername', 'contact', 'name', 'landlord']) || '');
          let clientPhone = String(findValue(row, ['clientphone', 'phone', 'mobile', 'cell', 'contactnumber', 'tel']) || '');
          let clientEmail = String(findValue(row, ['clientemail', 'email', 'contactemail']) || '');

          let address = String(findValue(row, ['address', 'streetaddress', 'street', 'propertyaddress', 'siteaddress', 'location']) || '');
          let suburb = String(findValue(row, ['suburb', 'area', 'locality', 'town', 'city']) || '');

          let realEstateAgency = String(findValue(row, ['realestateagency', 'agency', 'agencyname', 'realestate', 'reagency', 'propertymanagement']) || '');
          let realEstateAgentName = String(findValue(row, ['realestateagentname', 'agentname', 'agent', 'propertymanager', 'pmname']) || '');
          let realEstateAgentPhone = String(findValue(row, ['realestateagentphone', 'agentphone', 'pmphone']) || '');
          let realEstateAgentEmail = String(findValue(row, ['realestateagentemail', 'agentemail', 'pmemail']) || '');
          let workOrderNumber = String(findValue(row, ['workordernumber', 'workorder', 'wo', 'wonumber', 'jobnumber', 'jobno', 'jobid', 'invoicenumber', 'invoiceno', 'invno', 'bookkeepid', 'bookkeepingid', 'bookkeep', 'ref', 'reference', 'customid', 'externalid', 'id']) || '');
          let tenantName = String(findValue(row, ['tenantname', 'tenant', 'occupant', 'resident']) || '');
          let tenantPhone = String(findValue(row, ['tenantphone', 'occupantphone', 'residentphone']) || '');

          // --- Intelligent Multi-Line & Field Extraction if CSV has combined Notes/Title ---
          if (rawTitle.includes(' - ') && !workOrderNumber && !realEstateAgentName) {
            const titleParts = rawTitle.split(' - ');
            if (titleParts.length > 1) {
              realEstateAgentName = titleParts[0].trim();
              workOrderNumber = titleParts.slice(1).join(' - ').trim();
            }
          }

          // If rawNotes contains address / tenant info lumped together
          if (rawNotes && (!address || !clientPhone || !tenantName)) {
            const lines = rawNotes.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            const remainingLines: string[] = [];

            for (const line of lines) {
              // Check for address pattern
              let matchedSuburb = '';
              for (const subKey of Object.keys(SUBURB_COORDINATES)) {
                if (line.toLowerCase().includes(subKey) && (line.includes('VIC') || line.includes('Vic') || line.match(/\b3\d{3}\b/) || line.match(/\d+\s+[A-Za-z]/))) {
                  matchedSuburb = subKey.charAt(0).toUpperCase() + subKey.slice(1);
                  break;
                }
              }

              if (matchedSuburb && !address) {
                address = line;
                if (!suburb) suburb = matchedSuburb;
                continue;
              }

              // Check for tenant phone & name pattern
              const phoneMatch = line.match(/(?:\+61|0)4\d{2}[\s\d-]{6,12}/) || line.match(/04\d{8}/);
              if (phoneMatch && !tenantPhone) {
                tenantPhone = phoneMatch[0].trim();
                if (!clientPhone) clientPhone = tenantPhone;
                const namePart = line.replace(phoneMatch[0], '').replace(/\(Tenant\)|\(Agent\)|[-:,]/g, '').trim();
                if (namePart.length > 2 && !tenantName) {
                  tenantName = namePart;
                  if (!clientName) clientName = tenantName;
                }
                continue;
              }

              remainingLines.push(line);
            }

            if (remainingLines.length > 0 && remainingLines.join('\n') !== rawNotes) {
              rawNotes = remainingLines.join('\n');
            }
          }

          // Suburb Fallback
          if (!suburb) {
            suburb = 'Point Cook';
            for (const subKey of Object.keys(SUBURB_COORDINATES)) {
              if (address.toLowerCase().includes(subKey)) {
                suburb = subKey.charAt(0).toUpperCase() + subKey.slice(1);
                break;
              }
            }
          }

          if (!address) {
            address = `Property Address, ${suburb} VIC`;
          }

          if (!clientName) {
            clientName = tenantName || (realEstateAgentName ? `${realEstateAgentName} (Property Manager)` : 'Client');
          }

          let finalTitle = rawTitle;
          if (!finalTitle || finalTitle.toLowerCase().startsWith('job ') || finalTitle.toLowerCase().startsWith('quote ')) {
            finalTitle = rawNotes.split('\n')[0]?.replace(/^[-–•\d.]+\s*/, '').slice(0, 60) || `${workOrderNumber || 'Handyman Service'} - ${suburb}`;
          }

          // Coordinates
          let lat = parseFloat(findValue(row, ['latitude', 'lat']));
          let lng = parseFloat(findValue(row, ['longitude', 'lng', 'long', 'lon']));

          if (isNaN(lat) || isNaN(lng)) {
            const normalizedSuburbKey = suburb.toLowerCase().trim();
            const baseCoord = SUBURB_COORDINATES[normalizedSuburbKey] || SUBURB_COORDINATES['point cook'];
            // Jitter to spread out markers in the suburb
            const jitterLat = (Math.random() - 0.5) * 0.012;
            const jitterLng = (Math.random() - 0.5) * 0.012;
            lat = Number((baseCoord[0] + jitterLat).toFixed(6));
            lng = Number((baseCoord[1] + jitterLng).toFixed(6));
          }

          const status = normalizeStatus(findValue(row, ['status', 'jobstatus', 'stage', 'state']) || rawTitle);
          const priority = normalizePriority(findValue(row, ['priority', 'urgency', 'severity']) || rawNotes);
          const category = normalizeCategory(findValue(row, ['category', 'trade', 'servicetype', 'type', 'service']) || rawNotes || rawTitle);
          const description = rawNotes || rawTitle;

          const isAgencyJob = Boolean(realEstateAgency && realEstateAgency.trim().length > 0);
          const estimatedDurationMinutes = parseInt(findValue(row, ['duration', 'durationminutes', 'estimatedduration', 'time', 'estimatedmins']) || '60', 10);

          const parsedTasks: JobTask[] = [];
          if (description) {
            const descLines = String(description).split('\n').map(l => l.trim()).filter(Boolean);
            descLines.forEach((line, i) => {
              const clean = line.replace(/^[-*•\d.)]+\s*/, '').trim();
              if (clean.length > 2) {
                parsedTasks.push({
                  id: `task-imp-${timestamp}-${index + 1}-${i + 1}`,
                  title: clean,
                  isCompleted: status === 'completed' || status === 'invoiced'
                });
              }
            });
          }

          const newJob: Job = {
            id: `job-imp-${timestamp}-${index + 1}`,
            jobNumber: String(workOrderNumber || `JOB-${Math.floor(1000 + Math.random() * 9000)}`),
            title: String(finalTitle),
            clientName: String(clientName),
            clientPhone: String(clientPhone),
            clientEmail: String(clientEmail),
            address: String(address),
            suburb: String(suburb),
            coordinates: [lat, lng],
            status,
            priority,
            category,
            description: String(description),
            tasks: parsedTasks,
            quoteRequestedDate: new Date().toISOString(),
            estimatedDurationMinutes: isNaN(estimatedDurationMinutes) ? 60 : estimatedDurationMinutes,
            
            isAgencyJob,
            realEstateAgency: realEstateAgency || undefined,
            realEstateAgentName: realEstateAgentName || undefined,
            realEstateAgentPhone: realEstateAgentPhone || undefined,
            realEstateAgentEmail: realEstateAgentEmail || undefined,
            workOrderNumber: workOrderNumber || undefined,
            tenantName: tenantName || undefined,
            tenantPhone: tenantPhone || undefined,

            photos: [],
            timeLogs: [],
            internalNotes: [`Imported from spreadsheet file "${file.name}" on ${new Date().toLocaleDateString()}`],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          jobs.push(newJob);
        });

        resolve({
          jobs,
          warnings,
          totalRows: rawRows.length
        });
      } catch (err: any) {
        reject(new Error(`Failed to parse spreadsheet: ${err.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read the selected file.'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and downloads a sample XLSX template
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Job Title': 'Fix leaking bathroom vanity tap & seal base',
      'Client Name': 'Sarah Williams',
      'Client Phone': '0412 334 556',
      'Client Email': 'sarah.w@example.com.au',
      'Street Address': '14 Boardwalk Blvd',
      'Suburb': 'Point Cook',
      'Status': 'Quote Requested',
      'Priority': 'Medium',
      'Category': 'Plumbing',
      'Description': 'Mixer tap leaking at base joint when turned on. Also check silicone bead around vanity.',
      'Real Estate Agency': 'Ray White Point Cook',
      'Agent Name': 'Michael Evans (PM)',
      'Agent Phone': '0491 223 344',
      'Work Order No': 'WO-RW-8942',
      'Tenant Name': 'Sarah Williams',
      'Tenant Phone': '0412 334 556',
      'Estimated Mins': 45
    },
    {
      'Job Title': 'Replace broken sliding door latch & rollers',
      'Client Name': 'David Chen',
      'Client Phone': '0423 778 899',
      'Client Email': 'david.chen@example.com',
      'Street Address': '28 Palmers Rd',
      'Suburb': 'Williams Landing',
      'Status': 'Quote Requested',
      'Priority': 'High',
      'Category': 'Door & Window',
      'Description': 'Rear patio aluminium sliding door stiff to open, roller damaged, latch missing screw.',
      'Real Estate Agency': 'Barry Plant Sanctuary Lakes',
      'Agent Name': 'Jessica Taylor',
      'Agent Phone': '0488 112 233',
      'Work Order No': 'WO-BP-5521',
      'Tenant Name': 'David Chen',
      'Tenant Phone': '0423 778 899',
      'Estimated Mins': 60
    },
    {
      'Job Title': 'Plaster repair drywall hole in bedroom hallway',
      'Client Name': 'Emma & Luke Taylor',
      'Client Phone': '0434 998 112',
      'Client Email': 'emma.t@example.com.au',
      'Street Address': '7 Seabrook Blvd',
      'Suburb': 'Seabrook',
      'Status': 'In Progress',
      'Priority': 'Medium',
      'Category': 'Drywall & Masonry',
      'Description': '15cm doorknob hole in gyprock. Patch, sand, and paint match with ceiling white.',
      'Real Estate Agency': '',
      'Agent Name': '',
      'Agent Phone': '',
      'Work Order No': '',
      'Tenant Name': '',
      'Tenant Phone': '',
      'Estimated Mins': 90
    },
    {
      'Job Title': 'URGENT: Burst laundry water hose leak',
      'Client Name': 'Mark Johnson',
      'Client Phone': '0400 554 433',
      'Client Email': 'mark.j@example.com',
      'Street Address': '42 Sanctuary Lakes East Blvd',
      'Suburb': 'Sanctuary Lakes',
      'Status': 'Urgent',
      'Priority': 'Urgent',
      'Category': 'Plumbing',
      'Description': 'Emergency water leak under laundry trough. Main valve turned off, needs new flexi hose immediately.',
      'Real Estate Agency': 'Ray White Point Cook',
      'Agent Name': 'Michael Evans (PM)',
      'Agent Phone': '0491 223 344',
      'Work Order No': 'WO-RW-9001',
      'Tenant Name': 'Mark Johnson',
      'Tenant Phone': '0400 554 433',
      'Estimated Mins': 45
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Jobs_Import_Template');

  // Auto-fit column widths
  worksheet['!cols'] = [
    { wch: 35 }, // Job Title
    { wch: 20 }, // Client Name
    { wch: 15 }, // Client Phone
    { wch: 25 }, // Client Email
    { wch: 25 }, // Street Address
    { wch: 18 }, // Suburb
    { wch: 18 }, // Status
    { wch: 12 }, // Priority
    { wch: 18 }, // Category
    { wch: 45 }, // Description
    { wch: 25 }, // Real Estate Agency
    { wch: 22 }, // Agent Name
    { wch: 15 }, // Agent Phone
    { wch: 15 }, // Work Order No
    { wch: 18 }, // Tenant Name
    { wch: 15 }, // Tenant Phone
    { wch: 14 }  // Estimated Mins
  ];

  XLSX.writeFile(workbook, 'HandyMap_Jobs_Import_Template.xlsx');
}

/**
 * Downloads a sample CSV template
 */
export function downloadSampleCsvTemplate() {
  const csvContent = 
`Job Title,Client Name,Client Phone,Client Email,Street Address,Suburb,Status,Priority,Category,Description,Real Estate Agency,Agent Name,Agent Phone,Work Order No,Tenant Name,Tenant Phone,Estimated Mins
"Fix leaking bathroom vanity tap","Sarah Williams","0412 334 556","sarah@example.com","14 Boardwalk Blvd","Point Cook","Quote Requested","Medium","Plumbing","Mixer tap leaking at base. Check seal.","Ray White Point Cook","Michael Evans","0491 223 344","WO-RW-8942","Sarah Williams","0412 334 556",45
"Replace sliding patio door rollers","David Chen","0423 778 899","david@example.com","28 Palmers Rd","Williams Landing","Quote Requested","High","Door & Window","Door stiff to open, replace rollers.","Barry Plant","Jessica Taylor","0488 112 233","WO-BP-5521","David Chen","0423 778 899",60
"Drywall plaster repair in hallway","Emma Taylor","0434 998 112","emma@example.com","7 Seabrook Blvd","Seabrook","In Progress","Medium","Drywall & Masonry","15cm doorknob hole in wall. Patch and paint.","","","","","","",90
"URGENT: Burst laundry flexi hose","Mark Johnson","0400 554 433","mark@example.com","42 Sanctuary Lakes Blvd","Sanctuary Lakes","Urgent","Urgent","Plumbing","Emergency water leak under sink. Replace hose.","Ray White Point Cook","Michael Evans","0491 223 344","WO-RW-9001","Mark Johnson","0400 554 433",45`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'HandyMap_Jobs_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
