const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Source file
const sourceFilePath = '/Users/rakeshkumarmallam/.gemini/antigravity/brain/aea64183-5062-4a5a-922f-5a10d26a3892/.user_uploaded/media_1791282415614.xlsx';

const SUBURB_PATTERNS = [
  'Point Cook',
  'Werribee',
  'Wyndham Vale',
  'Hoppers Crossing',
  'Truganina',
  'Tarneit',
  'Altona North',
  'Altona Meadows',
  'Altona',
  'Laverton',
  'Mambourin',
  'Cobblebank',
  'Melton South',
  'Melton',
  'Deer Park',
  'Fraser Rise',
  'Williams Landing',
  'Manor Lakes',
  'Brookfield',
  'Rockbank',
  'Burnside',
  'Delahey',
  'Sanctuary Lakes',
  'Seabrook',
  'Strathtulloh'
];

function determineCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('tap') || t.includes('leak') || t.includes('toilet') || t.includes('drain') || t.includes('sink') || t.includes('shower') || t.includes('water') || t.includes('basin') || t.includes('pipe') || t.includes('gutter') || t.includes('silicon') || t.includes('regrout') || t.includes('washbasin') || t.includes('trough')) return 'Plumbing';
  if (t.includes('light') || t.includes('switch') || t.includes('exhaust') || t.includes('fan') || t.includes('bulb') || t.includes('power') || t.includes('electrical') || t.includes('smoke alarm') || t.includes('circuit') || t.includes('switchboard') || t.includes('downlight') || t.includes('remote') || t.includes('bell')) return 'Electrical';
  if (t.includes('door') || t.includes('lock') || t.includes('roller') || t.includes('sliding') || t.includes('screen') || t.includes('latch') || t.includes('window') || t.includes('blind') || t.includes('handle') || t.includes('hinge') || t.includes('flyscreen') || t.includes('cavity') || t.includes('curtain') || t.includes('deadlock') || t.includes('wand') || t.includes('hook')) return 'Door & Window';
  if (t.includes('plaster') || t.includes('wall') || t.includes('hole') || t.includes('drywall') || t.includes('crack') || t.includes('skirting') || t.includes('timber') || t.includes('floor') || t.includes('carpet') || t.includes('tile') || t.includes('mould') || t.includes('mold') || t.includes('ceiling') || t.includes('verandah') || t.includes('fence') || t.includes('gate') || t.includes('turf') || t.includes('letterbox') || t.includes('mailbox')) return 'Drywall & Masonry';
  if (t.includes('paint')) return 'Painting';
  if (t.includes('heat') || t.includes('air') || t.includes('ac') || t.includes('cool') || t.includes('ducted') || t.includes('aircon')) return 'HVAC';
  if (t.includes('oven') || t.includes('cooktop') || t.includes('rangehood') || t.includes('dishwasher') || t.includes('stove') || t.includes('burner') || t.includes('appliance') || t.includes('washing machine')) return 'General Repair';
  return 'General Repair';
}

function determineStatus(title) {
  const t = title.toLowerCase();
  if (t.includes('quote') && t.includes('sent')) return 'Quoted';
  if (t.includes('job')) return 'In Progress';
  if (t.includes('quote')) return 'Quote Requested';
  return 'Quote Requested';
}

function determinePriority(notes) {
  const n = notes.toLowerCase();
  if (n.includes('urgent') || n.includes('leakage') || n.includes('burst') || n.includes('gas leak') || n.includes('full of water') || n.includes('cracked') || n.includes('shattered')) return 'Urgent';
  if (n.includes('lock') || n.includes('unable to be locked') || n.includes('safety concern') || n.includes('water damage') || n.includes('stuck') || n.includes('broken')) return 'High';
  return 'Medium';
}

// Read raw workbook
const wb = XLSX.readFile(sourceFilePath);
const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const cleanedData = rawRows.map((row, idx) => {
  const title = String(row.Title || '').trim();
  const notesRaw = String(row.Notes || '').replace(/[\u2028\u2029\r]/g, '\n').trim();

  // Extract Bookkeep / Job Number from Title
  let contactFromTitle = '';
  let jobNumber = '';
  const titleParts = title.split('-');
  if (titleParts.length > 1) {
    contactFromTitle = titleParts[0].trim();
    jobNumber = titleParts.slice(1).join('-').trim().replace(/Sent.*$/i, '').trim();
  } else {
    jobNumber = title.replace(/Sent.*$/i, '').trim();
  }

  // Parse lines in Notes
  const lines = notesRaw.split('\n').map(l => l.trim()).filter(Boolean);

  let streetAddress = '';
  let suburb = '';
  let clientName = '';
  let clientPhone = '';
  let taskList = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Check if line is Street Address
    let isAddr = false;
    for (const sub of SUBURB_PATTERNS) {
      if (line.toLowerCase().includes(sub.toLowerCase()) && (line.includes('VIC') || line.includes('Vic') || line.includes('Victoria') || line.match(/\b3\d{3}\b/) || line.match(/\d+\s+[A-Za-z]/))) {
        // Special case: if address has contact concatenated right after postcode
        const vicMatch = line.match(/(VIC\s*\d{4}|Victoria\s*\d{4})/i);
        if (vicMatch && (vicMatch.index + vicMatch[0].length < line.length)) {
          const splitIdx = vicMatch.index + vicMatch[0].length;
          streetAddress = line.slice(0, splitIdx).trim();
          const extraPart = line.slice(splitIdx).trim();
          suburb = sub;
          isAddr = true;
          // Process extraPart for phone/contact
          const pMatch = extraPart.match(/(?:\+61|0)4\d{2}[\s\d-]{6,12}/) || extraPart.match(/04\d{8}/) || extraPart.match(/\+?\d[\d\s-]{8,15}/);
          if (pMatch) {
            clientPhone = pMatch[0].trim();
            const nPart = extraPart.replace(pMatch[0], '').replace(/\(Tenant\)|\(Agent\)|\(Client\)|[-:,]/g, '').trim();
            if (nPart.length > 2) clientName = nPart;
          }
          break;
        } else {
          streetAddress = line;
          suburb = sub;
          isAddr = true;
          break;
        }
      }
    }
    if (isAddr) continue;

    // 2. Check if line is Contact / Phone
    const phoneMatch = line.match(/(?:\+61|0)4\d{2}[\s\d-]{6,12}/) || line.match(/04\d{8}/) || line.match(/\+?\d[\d\s-]{8,15}/);
    if (phoneMatch && !clientPhone) {
      clientPhone = phoneMatch[0].trim();
      let namePart = line.replace(phoneMatch[0], '').replace(/\(Tenant\)|\(Agent\)|\(Client\)|[-:,]/g, '').trim();
      if (namePart.length > 2 && !clientName) {
        clientName = namePart;
      }
      continue;
    }

    // 3. Otherwise it is a task / scope line
    taskList.push(line);
  }

  // Suburb fallback
  if (!suburb) suburb = 'Point Cook';
  if (!streetAddress) streetAddress = `Property Address, ${suburb} VIC`;
  if (!clientName) clientName = contactFromTitle ? `${contactFromTitle} (Client)` : 'Client';

  // Format clean checklist description
  const cleanDescription = taskList.map(t => {
    let cleanT = t.replace(/^[-–•\d.]+\s*/, '').trim();
    return cleanT ? `- ${cleanT}` : '';
  }).filter(Boolean).join('\n');

  // Generate clean Job Title
  let cleanJobTitle = '';
  if (taskList.length > 0) {
    const firstTask = taskList[0].replace(/^[-–•\d.]+\s*/, '').trim();
    cleanJobTitle = firstTask.length > 70 ? firstTask.slice(0, 67) + '...' : firstTask;
  } else {
    cleanJobTitle = `${jobNumber || 'Maintenance Service'} - ${suburb}`;
  }

  return {
    'Job ID': jobNumber || `BK-${1000 + idx}`,
    'Job Title': cleanJobTitle,
    'Client Name': clientName,
    'Client Phone': clientPhone,
    'Client Email': '',
    'Street Address': streetAddress,
    'Suburb': suburb,
    'Status': determineStatus(title),
    'Priority': determinePriority(notesRaw),
    'Category': determineCategory(notesRaw),
    'Description': cleanDescription || notesRaw,
    'Estimated Mins': 60
  };
});

// Output clean CSV and clean XLSX files
const cleanSheet = XLSX.utils.json_to_sheet(cleanedData);
const cleanWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(cleanWorkbook, cleanSheet, 'Cleaned_HandyMap_Jobs');

// Set column widths
cleanSheet['!cols'] = [
  { wch: 18 }, // Job ID
  { wch: 45 }, // Job Title
  { wch: 25 }, // Client Name
  { wch: 18 }, // Client Phone
  { wch: 20 }, // Client Email
  { wch: 42 }, // Street Address
  { wch: 20 }, // Suburb
  { wch: 18 }, // Status
  { wch: 12 }, // Priority
  { wch: 20 }, // Category
  { wch: 65 }, // Description
  { wch: 14 }  // Estimated Mins
];

const outputPaths = [
  path.join(__dirname, '../public/Cleaned_HandyMap_Jobs.xlsx'),
  path.join(__dirname, '../public/Cleaned_HandyMap_Jobs.csv'),
  path.join(__dirname, '../dist/Cleaned_HandyMap_Jobs.xlsx'),
  path.join(__dirname, '../dist/Cleaned_HandyMap_Jobs.csv'),
  '/Users/rakeshkumarmallam/.gemini/antigravity/brain/aea64183-5062-4a5a-922f-5a10d26a3892/Cleaned_HandyMap_Jobs.xlsx',
  '/Users/rakeshkumarmallam/.gemini/antigravity/brain/aea64183-5062-4a5a-922f-5a10d26a3892/Cleaned_HandyMap_Jobs.csv'
];

const csvOutput = XLSX.utils.sheet_to_csv(cleanSheet);

outputPaths.forEach(p => {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (p.endsWith('.xlsx')) {
    XLSX.writeFile(cleanWorkbook, p);
    console.log(`Saved XLSX: ${p}`);
  } else {
    fs.writeFileSync(p, csvOutput, 'utf8');
    console.log(`Saved CSV: ${p}`);
  }
});

console.log(`\nSuccessfully processed all ${cleanedData.length} jobs cleanly with 0 agency/RayWhite fields!`);
