import { JobCategory } from '../types';
import { SUBURBS_LIST } from '../data/mockJobs';

export interface ParsedWorkOrder {
  jobNumber?: string;
  workOrderNumber?: string;
  title: string;
  description: string;
  address: string;
  suburb: string;
  realEstateAgency: string;
  propertyManager: string;
  realEstatePhone: string;
  realEstateEmail: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  tenant1Name: string;
  tenant1Phone: string;
  tenant1Email: string;
  tenant2Name: string;
  tenant2Phone: string;
  tenant2Email: string;
  hasTenant2: boolean;
  keyAccess: string;
  ownerName: string;
  category: JobCategory;
  tasks: string[];
  nteLimit?: number;
  rawText: string;
}

/**
 * Extract raw text from a PDF file using client-side pdfjs-dist (100% Free, zero AI)
 */
export async function extractTextFromPdfFile(file: File): Promise<string> {
  const [pdfjsLib, workerModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.mjs?url')
  ]);

  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  }

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Sort text items by vertical position (top to bottom) then horizontal (left to right)
    const items = textContent.items as Array<{ str: string; transform: number[] }>;
    
    // Group by line using Y transform coordinate (transform[5])
    let lastY: number | null = null;
    let pageLines: string[] = [];
    let currentLine = '';

    for (const item of items) {
      if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
        pageLines.push(currentLine.trim());
        currentLine = item.str;
      } else {
        currentLine += (currentLine ? ' ' : '') + item.str;
      }
      lastY = item.transform[5];
    }
    if (currentLine.trim()) {
      pageLines.push(currentLine.trim());
    }

    fullText += pageLines.join('\n') + '\n\n';
  }

  return fullText;
}

/**
 * Detect trade category from work order description
 */
function detectTradeCategory(text: string): JobCategory {
  const lower = text.toLowerCase();
  if (lower.includes('flush') || lower.includes('toilet') || lower.includes('tap') || lower.includes('leak') || lower.includes('plumb') || lower.includes('drain') || lower.includes('basin') || lower.includes('shower')) {
    return 'Plumbing';
  }
  if (lower.includes('blind') || lower.includes('curtain') || lower.includes('door') || lower.includes('lock') || lower.includes('window') || lower.includes('hinge') || lower.includes('screen')) {
    return 'Door & Window';
  }
  if (lower.includes('power') || lower.includes('light') || lower.includes('switch') || lower.includes('smoke alarm') || lower.includes('electr')) {
    return 'Electrical';
  }
  if (lower.includes('paint') || lower.includes('plaster') || lower.includes('patch') || lower.includes('drywall')) {
    return 'Painting';
  }
  if (lower.includes('roof') || lower.includes('gutter') || lower.includes('downpipe')) {
    return 'Roofing';
  }
  if (lower.includes('deck') || lower.includes('fence') || lower.includes('carpenter') || lower.includes('timber') || lower.includes('wood')) {
    return 'Carpentry';
  }
  return 'General Repair';
}

/**
 * Format phone string cleanly to 10 digits if Australian mobile/landline
 */
function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 11 && digits.startsWith('61')) {
    const local = '0' + digits.slice(2);
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return raw.trim();
}

/**
 * Extract structured job fields from raw Australian Real Estate work order text
 */
export function parseWorkOrderText(text: string): ParsedWorkOrder {
  const result: ParsedWorkOrder = {
    jobNumber: '',
    workOrderNumber: '',
    title: '',
    description: '',
    address: '',
    suburb: 'Point Cook',
    realEstateAgency: '',
    propertyManager: '',
    realEstatePhone: '',
    realEstateEmail: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    tenant1Name: '',
    tenant1Phone: '',
    tenant1Email: '',
    tenant2Name: '',
    tenant2Phone: '',
    tenant2Email: '',
    hasTenant2: false,
    keyAccess: '',
    ownerName: '',
    category: 'General Repair',
    tasks: [],
    nteLimit: undefined,
    rawText: text
  };

  // 1. Job / Work Order Number
  const jobNumMatch = text.match(/Job\s*number\s*[-:]\s*([A-Za-z0-9-]+)/i) ||
                      text.match(/Work\s*Order\s*(?:#|number|no\.?)\s*[-:]?\s*([A-Za-z0-9-]+)/i) ||
                      text.match(/WO\s*[-:]\s*([A-Za-z0-9-]+)/i);
  if (jobNumMatch) {
    result.workOrderNumber = jobNumMatch[1].trim();
    result.jobNumber = result.workOrderNumber;
  }

  // 2. Real Estate Agency
  if (/reliance/i.test(text)) result.realEstateAgency = 'Reliance Real Estate';
  else if (/ray\s*white/i.test(text)) result.realEstateAgency = 'Ray White';
  else if (/lj\s*hooker/i.test(text)) result.realEstateAgency = 'LJ Hooker';
  else if (/barry\s*plant/i.test(text)) result.realEstateAgency = 'Barry Plant';
  else if (/mcgrath/i.test(text)) result.realEstateAgency = 'McGrath';
  else if (/first\s*national/i.test(text)) result.realEstateAgency = 'First National';
  else if (/belle\s*property/i.test(text)) result.realEstateAgency = 'Belle Property';
  else if (/harcourts/i.test(text)) result.realEstateAgency = 'Harcourts';
  else if (/micm/i.test(text)) result.realEstateAgency = 'MICM Real Estate';
  else {
    const agencyMatch = text.match(/([A-Za-z0-9\s&]+)\s+real\s+estate/i);
    if (agencyMatch) result.realEstateAgency = agencyMatch[0].trim();
  }

  // 3. Property Address & Key Access
  const propertyMatch = text.match(/Property\s*\n+([^\n]+)/i) ||
                        text.match(/Property\s*Address\s*[-:]\s*([^\n]+)/i) ||
                        text.match(/Premises\s*[-:]\s*([^\n]+)/i);
  if (propertyMatch) {
    let rawAddress = propertyMatch[1].trim();
    
    // Check if key code is attached, e.g. "(key #HQ827)"
    const keyMatch = rawAddress.match(/\((?:key|keys?)\s*#?([^)]+)\)/i) ||
                     text.match(/Key\s*(?:#|number|no\.?|code)?\s*[-:]?\s*([A-Za-z0-9]+)/i);
    if (keyMatch) {
      result.keyAccess = keyMatch[1].trim();
      rawAddress = rawAddress.replace(/\((?:key|keys?)\s*#?[^)]+\)/i, '').trim();
    }
    result.address = rawAddress;

    // Detect Suburb from Address
    for (const sub of SUBURBS_LIST) {
      if (new RegExp(`\\b${sub}\\b`, 'i').test(rawAddress)) {
        result.suburb = sub;
        break;
      }
    }
  }

  // 4. Tenants / Occupants ("For access contact the tenant/s on:")
  const tenantBlockMatch = text.match(/For\s+access\s+contact\s+the\s+tenant\/s\s+on:([\s\S]*?)(?:Work\s+order\s+issued|For\s+queries|Details|Property)/i);
  if (tenantBlockMatch) {
    const tenantBlock = tenantBlockMatch[1];
    const lines = tenantBlock.split('\n').map(l => l.trim()).filter(Boolean);
    const contacts: Array<{ name: string; phone: string; email: string }> = [];
    
    let currentName = '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\(m\)/i.test(line)) {
        const phoneMatch = line.match(/\(m\)\s*([0-9\s]+)/i);
        const phone = phoneMatch ? cleanPhone(phoneMatch[1]) : '';
        let email = '';
        if (i + 1 < lines.length && /^\(e\)/i.test(lines[i + 1])) {
          const emailMatch = lines[i + 1].match(/\(e\)\s*([^\s]+)/i);
          if (emailMatch) email = emailMatch[1].trim();
        }
        contacts.push({ name: currentName, phone, email });
        currentName = '';
      } else if (!/^\(e\)/i.test(line) && !line.includes('@')) {
        currentName = line;
      }
    }

    if (contacts.length > 0) {
      result.tenant1Name = contacts[0].name;
      result.tenant1Phone = contacts[0].phone;
      result.tenant1Email = contacts[0].email;
      result.clientName = contacts[0].name;
      result.clientPhone = contacts[0].phone;
      result.clientEmail = contacts[0].email;

      if (contacts.length > 1) {
        result.tenant2Name = contacts[1].name;
        result.tenant2Phone = contacts[1].phone;
        result.tenant2Email = contacts[1].email;
        result.hasTenant2 = true;
      }
    }
  } else {
    // Fallback tenant regex
    const tenantNameMatch = text.match(/Tenant\s*[-:]\s*([^\n]+)/i);
    if (tenantNameMatch) {
      result.tenant1Name = tenantNameMatch[1].trim();
      result.clientName = result.tenant1Name;
    }
    const mobileMatch = text.match(/(?:04\d{2}\s?\d{3}\s?\d{3}|\+61\s?4\d{2}\s?\d{3}\s?\d{3})/);
    if (mobileMatch) {
      result.tenant1Phone = cleanPhone(mobileMatch[0]);
      result.clientPhone = result.tenant1Phone;
    }
  }

  // 5. Agent / Property Manager ("For queries contact the agent on:")
  const agentBlockMatch = text.match(/For\s+queries\s+contact\s+the\s+agent\s+on:([\s\S]*?)(?:Details|Property|Description)/i);
  if (agentBlockMatch) {
    const lines = agentBlockMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      result.propertyManager = lines[0];
      for (const line of lines) {
        if (/^\(m\)/i.test(line)) {
          const m = line.match(/\(m\)\s*([0-9\s]+)/i);
          if (m) result.realEstatePhone = cleanPhone(m[1]);
        }
        if (/^\(e\)/i.test(line)) {
          const m = line.match(/\(e\)\s*([^\s]+)/i);
          if (m) result.realEstateEmail = m[1].trim();
        }
      }
    }
  }

  // 6. Owner
  const ownerMatch = text.match(/on\s+behalf\s+of\s+the\s+owner\s*-\s*([^\n]+)/i);
  if (ownerMatch) result.ownerName = ownerMatch[1].trim();

  // 7. Not-To-Exceed (NTE) / Limit
  const limitMatch = text.match(/(?:limit|maximum|not\s*to\s*exceed|approved\s*up\s*to)\s*[:$]?\s*\$?([0-9]+(?:\.[0-9]{2})?)/i);
  if (limitMatch) {
    result.nteLimit = parseFloat(limitMatch[1]);
  }

  // 8. Description & Tasks
  const descMatch = text.match(/Description\s*\n+Summary\s*\n+[^\n]+\n+Description\s*\n+([\s\S]*?)(?:\nNotes|\nPage|\Z)/i) ||
                    text.match(/Description\s*[-:]\s*([\s\S]*?)(?:\nNotes|\nPage|\Z)/i);
  if (descMatch) {
    result.description = descMatch[1].trim();
  } else {
    // Look for generic work required block
    const workBlock = text.match(/(?:Scope\s*of\s*Work|Work\s*Required|Maintenance\s*Required)\s*[-:]\s*([\s\S]*?)(?:\nNotes|\nPage|\Z)/i);
    if (workBlock) result.description = workBlock[1].trim();
  }

  // Generate Tasks from Description lines
  if (result.description) {
    const descLines = result.description.split('\n').map(l => l.trim()).filter(Boolean);
    result.tasks = descLines.map(l => l.replace(/^[-*•\d.)]+\s*/, '').trim()).filter(l => l.length > 5);

    // Generate clean concise Title
    const firstLine = descLines[0] || 'Work Order Maintenance';
    const cleanFirstLine = firstLine.replace(/^[-*•\d.)]+\s*/, '').replace(/^[A-Za-z\s]+:\s*/, '').trim();
    result.title = cleanFirstLine.length > 55 ? cleanFirstLine.substring(0, 52) + '...' : cleanFirstLine;
  } else {
    result.title = `Work Order ${result.workOrderNumber || 'Maintenance'}`;
  }

  // 9. Trade Category
  result.category = detectTradeCategory(result.description + ' ' + result.title);

  return result;
}

export interface GeocodeAddressResult {
  coordinates: [number, number];
  formattedAddress: string;
  suburb?: string;
  postcode?: string;
  state?: string;
}

/**
 * Fast, reliable zero-cost geocoding for Australian addresses using Photon
 * with Melbourne location bias and OpenStreetMap Nominatim fallback.
 */
export async function geocodeAustralianAddress(
  rawAddress: string,
  centerCoords: [number, number] = [-37.9175, 144.7492]
): Promise<GeocodeAddressResult | null> {
  try {
    if (!rawAddress || rawAddress.trim().length < 5) return null;
    // Strip unit/flat number e.g. "111/38 Clark St" -> "38 Clark St", "Unit 2/88 Sneydes Rd" -> "88 Sneydes Rd"
    const cleaned = rawAddress
      .replace(/^\s*(?:unit|apt|apartment|flat|lot)?\s*#?\s*\d+\s*[\/\-]?\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 1. Try Photon with local coordinate bias
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleaned)}&lat=${centerCoords[0]}&lon=${centerCoords[1]}&limit=6`;
    const res = await fetch(photonUrl, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const auFeat = data.features.find((f: any) => {
          const country = (f.properties?.country || '').toLowerCase();
          const code = (f.properties?.countrycode || '').toLowerCase();
          return country.includes('australia') || code === 'au' || !f.properties?.country;
        }) || data.features[0];

        const coords = auFeat.geometry.coordinates; // [lng, lat]
        const p = auFeat.properties || {};
        const suburb = p.district || p.locality || p.city || p.town || '';
        const street = [p.housenumber, p.street || p.name].filter(Boolean).join(' ');
        const state = p.state || 'VIC';
        const postcode = p.postcode || '';

        return {
          coordinates: [coords[1], coords[0]], // [lat, lng]
          formattedAddress: street ? `${street}, ${suburb} ${state} ${postcode}`.trim() : rawAddress,
          suburb,
          postcode,
          state
        };
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim with Australia bias
    const cleanSearch = cleaned.replace(/[,;]/g, ' ').replace(/\s+/g, ' ').trim();
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanSearch)}&countrycodes=au&format=json&limit=1`;
    const nomRes = await fetch(nomUrl, { headers: { 'User-Agent': 'HandyMapPro/1.0' } });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (nomData && nomData.length > 0) {
        const item = nomData[0];
        return {
          coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
          formattedAddress: item.display_name,
          suburb: ''
        };
      }
    }
  } catch (err) {
    console.warn('Geocoding error:', err);
  }
  return null;
}
