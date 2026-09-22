import { Job, HandymanProfile } from '../types';

export const DEFAULT_PROFILE: HandymanProfile = {
  name: 'Alex Miller',
  businessName: 'Apex Handyman & Property Maintenance',
  phone: '0412 890 442',
  email: 'alex@apexhandyman.com.au',
  defaultHourlyRate: 85,
  baseAddress: 'Point Cook Town Centre, Main St, Point Cook VIC 3030',
  baseCoordinates: [-37.9175, 144.7492], // Point Cook Town Centre
  currencySymbol: '$',
  taxRatePercent: 10.0 // Australian GST
};

export const INITIAL_JOBS: Job[] = [
  // 1. QUOTE REQUEST 1 (Point Cook - Alamanda Estate)
  {
    id: 'job-101',
    jobNumber: 'REQ-1082',
    title: 'Custom Floating Shelves & TV Cable Concealment',
    clientName: 'Marcus Vance',
    clientPhone: '0431 998 214',
    clientEmail: 'marcus.vance@gmail.com',
    address: '42 Alamanda Blvd, Point Cook VIC 3030',
    coordinates: [-37.9335, 144.7418],
    status: 'quote_requested',
    priority: 'medium',
    category: 'Carpentry',
    description: 'Looking for a custom 3-tier hardwood floating shelf installation above the living room fireplace and routing power/HDMI cables through plasterboard cavity.',
    quoteRequestedDate: '2026-09-22T08:30:00',
    appointmentTime: '2026-09-22T10:30:00',
    estimatedDurationMinutes: 45,
    photos: [
      {
        id: 'p-101',
        url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
        type: 'assessment',
        caption: 'Living room wall where shelves will go',
        uploadedAt: '2026-09-22T08:35:00'
      }
    ],
    timeLogs: [],
    internalNotes: ['Client works from home in Alamanda; prefers morning visit before 12pm.'],
    createdAt: '2026-09-22T08:30:00',
    updatedAt: '2026-09-22T08:30:00'
  },

  // 2. QUOTE REQUEST 2 (Sanctuary Lakes)
  {
    id: 'job-102',
    jobNumber: 'REQ-1083',
    title: 'Timber Deck Board Replacement & Oiling Estimate',
    clientName: 'Sarah Jenkins',
    clientPhone: '0455 412 901',
    clientEmail: 'sarah.j88@outlook.com.au',
    address: '18 Sanctuary Lakes East Blvd, Sanctuary Lakes VIC 3030',
    coordinates: [-37.9045, 144.7620],
    status: 'quote_requested',
    priority: 'high',
    category: 'Carpentry',
    description: 'Lakeside merbau deck has 6 weathered planks and loose perimeter railings. Need measurement on-site and quote for board replacement and pressure wash/seal.',
    quoteRequestedDate: '2026-09-22T09:15:00',
    appointmentTime: '2026-09-22T11:45:00',
    estimatedDurationMinutes: 40,
    photos: [
      {
        id: 'p-102',
        url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600&auto=format&fit=crop&q=80',
        type: 'assessment',
        caption: 'Damaged deck boards near lakeside patio',
        uploadedAt: '2026-09-22T09:20:00'
      }
    ],
    timeLogs: [],
    internalNotes: ['Gated estate access: Gate code #4492. Beware of golden retriever in backyard.'],
    createdAt: '2026-09-22T09:15:00',
    updatedAt: '2026-09-22T09:15:00'
  },

  // 3. QUOTE REQUEST 3 (Saltwater Coast, Point Cook)
  {
    id: 'job-103',
    jobNumber: 'REQ-1084',
    title: 'Master Ensuite Double Vanity & Tapware Upgrade Quote',
    clientName: 'David & Emily Ross',
    clientPhone: '0477 340 192',
    clientEmail: 'dross.pointcook@gmail.com',
    address: '15 Saltwater Promenade, Point Cook VIC 3030',
    coordinates: [-37.9392, 144.7635],
    status: 'quote_requested',
    priority: 'medium',
    category: 'Plumbing',
    description: 'Replacing old 1500mm double vanity with a modern wall-hung stone top unit. Need on-site inspection for plumbing pipe alignment and mirror cabinet mounting.',
    quoteRequestedDate: '2026-09-22T09:40:00',
    appointmentTime: '2026-09-22T14:00:00',
    estimatedDurationMinutes: 45,
    photos: [],
    timeLogs: [],
    internalNotes: ['Vanity delivered from Bunnings; stored in garage.'],
    createdAt: '2026-09-22T09:40:00',
    updatedAt: '2026-09-22T09:40:00'
  },

  // 4. QUOTE REQUEST 4 (Williams Landing)
  {
    id: 'job-104',
    jobNumber: 'REQ-1085',
    title: 'Kitchen Herringbone Splashback & LED Channel Lighting',
    clientName: 'Elena Rostova',
    clientPhone: '0461 288 743',
    clientEmail: 'elena.rostova@techco.io',
    address: '28 Overton Rd, Williams Landing VIC 3027',
    coordinates: [-37.8682, 144.7485],
    status: 'quote_requested',
    priority: 'low',
    category: 'Drywall & Masonry',
    description: 'Roughly 4.5 sqm of white subway herringbone splashback tiling + hardwired under-cabinet LED strip lighting channel install.',
    quoteRequestedDate: '2026-09-21T18:00:00',
    appointmentTime: '2026-09-22T15:30:00',
    estimatedDurationMinutes: 35,
    photos: [],
    timeLogs: [],
    internalNotes: ['Townhouse opposite Williams Landing Shopping Centre. Driveway parking available.'],
    createdAt: '2026-09-21T18:00:00',
    updatedAt: '2026-09-21T18:00:00'
  },

  // 5. URGENT / EMERGENCY (Seabrook)
  {
    id: 'job-105',
    jobNumber: 'EMG-902',
    title: 'URGENT: Laundry Washing Machine Isolation Tap Burst',
    clientName: 'Robert Sterling',
    clientPhone: '0499 433 218',
    clientEmail: 'rsterling55@yahoo.com.au',
    address: '12 Truganina Ave, Seabrook VIC 3028',
    coordinates: [-37.8865, 144.7682],
    status: 'urgent',
    priority: 'urgent',
    category: 'Plumbing',
    description: 'Hot water isolation tap behind washing machine has cracked fitting leaking water onto laundry floor tiles. Main meter partially shut.',
    quoteRequestedDate: '2026-09-22T07:15:00',
    appointmentTime: '2026-09-22T09:30:00',
    estimatedDurationMinutes: 60,
    photos: [
      {
        id: 'p-105',
        url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600&auto=format&fit=crop&q=80',
        type: 'assessment',
        caption: 'Corroded brass tap valve leaking under pressure',
        uploadedAt: '2026-09-22T07:20:00'
      }
    ],
    timeLogs: [],
    internalNotes: ['Bring 15mm copper compression mini ball valves and PTFE tape.'],
    createdAt: '2026-09-22T07:15:00',
    updatedAt: '2026-09-22T07:15:00'
  },

  // 6. QUOTED (Altona Meadows - Awaiting approval)
  {
    id: 'job-106',
    jobNumber: 'QTE-441',
    title: 'Ceiling Fan Replacement (3 Bedrooms) & Smart Dimmer Switches',
    clientName: 'Karen Peterson',
    clientPhone: '0434 911 205',
    clientEmail: 'karen.p@petersonlaw.com.au',
    address: '54 Central Ave, Altona Meadows VIC 3028',
    coordinates: [-37.8795, 144.7865],
    status: 'quoted',
    priority: 'medium',
    category: 'Electrical',
    description: 'Replacing 3 older bedroom ceiling fans with new 52-inch DC motor timber blade fans and smart wall controllers.',
    quoteRequestedDate: '2026-09-20T14:00:00',
    appointmentTime: undefined,
    estimatedDurationMinutes: 180,
    quote: {
      id: 'q-106',
      quoteNumber: 'Q-2026-0044',
      createdAt: '2026-09-21T11:00:00',
      validUntil: '2026-10-05T23:59:59',
      hourlyLaborRate: 85,
      estimatedLaborHours: 3.5,
      taxRatePercent: 10.0,
      discountAmount: 0,
      items: [
        {
          id: 'qi-1',
          type: 'labor',
          description: 'Ceiling Fan Removal & Safe Installation (3 units @ $90/ea)',
          quantity: 3,
          unitPrice: 90,
          total: 270
        },
        {
          id: 'qi-2',
          type: 'labor',
          description: 'Smart Dimmer / Wall Switch Controller Wiring & Setup',
          quantity: 3,
          unitPrice: 40,
          total: 120
        },
        {
          id: 'qi-3',
          type: 'material',
          description: 'Heavy duty ceiling joist mounting brackets & hardware',
          quantity: 3,
          unitPrice: 28,
          total: 84
        }
      ],
      subtotal: 474.00,
      taxAmount: 47.40,
      totalAmount: 521.40,
      notes: 'Estimate valid for 14 days. Includes old fan eco disposal.',
      status: 'sent'
    },
    photos: [],
    timeLogs: [],
    internalNotes: ['Quote sent. Karen will confirm by Wednesday.'],
    createdAt: '2026-09-20T14:00:00',
    updatedAt: '2026-09-21T11:30:00'
  },

  // 7. IN PROGRESS (Point Cook - Boardwalk Estate)
  {
    id: 'job-107',
    jobNumber: 'ACT-780',
    title: 'Plasterboard Wall Repair, Texture Matching & Skirting',
    clientName: 'Daniel Cho',
    clientPhone: '0448 077 912',
    clientEmail: 'dcho.creatives@gmail.com',
    address: '89 Boardwalk Blvd, Point Cook VIC 3030',
    coordinates: [-37.9125, 144.7520],
    status: 'in_progress',
    priority: 'high',
    category: 'Drywall & Masonry',
    description: 'Patching two 400x600mm cutout holes in hallway plasterboard from previous air con duct inspection. Base coat, top coat finish, sanding, and reattaching MDF skirting boards.',
    quoteRequestedDate: '2026-09-18T10:00:00',
    appointmentTime: '2026-09-22T13:00:00',
    estimatedDurationMinutes: 120,
    quote: {
      id: 'q-107',
      quoteNumber: 'Q-2026-0039',
      createdAt: '2026-09-19T09:00:00',
      validUntil: '2026-10-01T00:00:00',
      hourlyLaborRate: 85,
      estimatedLaborHours: 3.0,
      taxRatePercent: 10.0,
      discountAmount: 25,
      items: [
        {
          id: 'qi-107-1',
          type: 'labor',
          description: 'Plasterboard framing backing, sheetrock fixing, 3-coat compound & sand',
          quantity: 1,
          unitPrice: 220,
          total: 220
        },
        {
          id: 'qi-107-2',
          type: 'labor',
          description: 'Skirting board mitre cutting, fixing & gap filling',
          quantity: 1,
          unitPrice: 85,
          total: 85
        },
        {
          id: 'qi-107-3',
          type: 'material',
          description: 'Gyprock sheet, base coat, topping compound, paper tape, 67mm skirting',
          quantity: 1,
          unitPrice: 48,
          total: 48
        }
      ],
      subtotal: 328.00,
      taxAmount: 32.80,
      totalAmount: 335.80,
      notes: 'Customer accepted quote on 19/09.',
      status: 'accepted',
      clientSignatureName: 'Daniel Cho',
      signedAt: '2026-09-20T16:45:00'
    },
    photos: [
      {
        id: 'p-107-1',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        type: 'before',
        caption: 'Hallway wall cutout before patching',
        uploadedAt: '2026-09-22T13:05:00'
      }
    ],
    timeLogs: [
      {
        id: 'tl-1',
        startTime: '2026-09-22T13:00:00',
        durationMinutes: 45,
        notes: 'Backing noggins installed, gyprock cut and fixed, base compound applied.'
      }
    ],
    internalNotes: ['Base compound curing. Will apply finish coat on next stop.'],
    createdAt: '2026-09-18T10:00:00',
    updatedAt: '2026-09-22T13:45:00'
  },

  // 8. IN PROGRESS (Hoppers Crossing)
  {
    id: 'job-108',
    jobNumber: 'ACT-781',
    title: 'Solid Core Garage Entry Door Hanging & Digital Deadbolt',
    clientName: 'Jennifer Walsh',
    clientPhone: '0483 329 401',
    clientEmail: 'jennifer.walsh@vicmail.com.au',
    address: '67 Morris Rd, Hoppers Crossing VIC 3029',
    coordinates: [-37.8765, 144.7085],
    status: 'in_progress',
    priority: 'medium',
    category: 'Door & Window',
    description: 'Trimming 2040x820mm solid core fire-rated door, rebating 3 heavy duty hinges into jamb, and fitting Yale smart digital lock keypad.',
    quoteRequestedDate: '2026-09-19T11:00:00',
    appointmentTime: '2026-09-22T16:30:00',
    estimatedDurationMinutes: 90,
    quote: {
      id: 'q-108',
      quoteNumber: 'Q-2026-0041',
      createdAt: '2026-09-20T10:00:00',
      validUntil: '2026-10-01T00:00:00',
      hourlyLaborRate: 85,
      estimatedLaborHours: 2.5,
      taxRatePercent: 10.0,
      discountAmount: 0,
      items: [
        {
          id: 'qi-108-1',
          type: 'labor',
          description: 'Door slab trimming, planing & mortising 3 ball-bearing hinges',
          quantity: 1,
          unitPrice: 175,
          total: 175
        },
        {
          id: 'qi-108-2',
          type: 'labor',
          description: 'Smart digital lock installation & striker alignment',
          quantity: 1,
          unitPrice: 65,
          total: 65
        },
        {
          id: 'qi-108-3',
          type: 'material',
          description: '100mm satin chrome ball bearing hinges & heavy timber screws',
          quantity: 1,
          unitPrice: 32,
          total: 32
        }
      ],
      subtotal: 272.00,
      taxAmount: 27.20,
      totalAmount: 299.20,
      notes: 'Customer provided door slab and Yale smart lock.',
      status: 'accepted',
      clientSignatureName: 'Jennifer Walsh',
      signedAt: '2026-09-20T17:15:00'
    },
    photos: [],
    timeLogs: [],
    internalNotes: ['Bring plunge router and hinge jig.'],
    createdAt: '2026-09-19T11:00:00',
    updatedAt: '2026-09-21T09:00:00'
  },

  // 9. COMPLETED (Point Cook - Innisfail Estate)
  {
    id: 'job-109',
    jobNumber: 'CMP-610',
    title: 'Kitchen Sink Tapware & Waste Disposer Replacement',
    clientName: 'Thomas Wright',
    clientPhone: '0430 266 512',
    clientEmail: 'twright.vic@gmail.com',
    address: '14 Dunnings Rd, Point Cook VIC 3030',
    coordinates: [-37.8985, 144.7435],
    status: 'completed',
    priority: 'medium',
    category: 'Plumbing',
    description: 'Replaced seized sink mixer with Dorf brushed brass pull-out vegetable spray mixer and installed new 50mm PVC trap and flexible hose connections.',
    quoteRequestedDate: '2026-09-21T08:00:00',
    appointmentTime: '2026-09-21T15:00:00',
    estimatedDurationMinutes: 60,
    quote: {
      id: 'q-109',
      quoteNumber: 'Q-2026-0043',
      createdAt: '2026-09-21T08:30:00',
      validUntil: '2026-09-30T00:00:00',
      hourlyLaborRate: 85,
      estimatedLaborHours: 1.5,
      taxRatePercent: 10.0,
      discountAmount: 0,
      items: [
        {
          id: 'qi-109-1',
          type: 'labor',
          description: 'Sink mixer installation & hot/cold flow pressure testing',
          quantity: 1,
          unitPrice: 135,
          total: 135
        },
        {
          id: 'qi-109-2',
          type: 'material',
          description: 'Dorf pull-out kitchen mixer + 1/2" flexible braided hoses',
          quantity: 1,
          unitPrice: 165,
          total: 165
        }
      ],
      subtotal: 300.00,
      taxAmount: 30.00,
      totalAmount: 330.00,
      notes: 'Paid on-site via Square EFTPOS tap.',
      status: 'accepted',
      clientSignatureName: 'Thomas Wright',
      signedAt: '2026-09-21T16:15:00'
    },
    photos: [
      {
        id: 'p-109-1',
        url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
        type: 'after',
        caption: 'New pull-out spray tap installed and leak-free tested',
        uploadedAt: '2026-09-21T16:10:00'
      }
    ],
    timeLogs: [
      {
        id: 'tl-109',
        startTime: '2026-09-21T15:10:00',
        endTime: '2026-09-21T16:10:00',
        durationMinutes: 60,
        notes: 'Clean install, test isolators working smoothly.'
      }
    ],
    internalNotes: ['Client gave positive feedback on Google Reviews.'],
    createdAt: '2026-09-21T08:00:00',
    updatedAt: '2026-09-21T16:30:00'
  },

  // 10. INVOICED (Truganina / Tarneit border)
  {
    id: 'job-110',
    jobNumber: 'INV-502',
    title: 'Gutter Guard Aluminium Mesh & Downpipe Flush',
    clientName: 'Patricia Campbell',
    clientPhone: '0467 098 119',
    clientEmail: 'pcampbell@westrealty.com.au',
    address: '112 Leakes Rd, Truganina VIC 3029',
    coordinates: [-37.8485, 144.7215],
    status: 'invoiced',
    priority: 'low',
    category: 'Roofing',
    description: 'Supplied and fitted 36m of corrugated Colorbond gutter mesh guard to prevent leaf blockages and cleared twin downpipes.',
    quoteRequestedDate: '2026-09-17T11:00:00',
    appointmentTime: '2026-09-19T09:00:00',
    estimatedDurationMinutes: 180,
    quote: {
      id: 'q-110',
      quoteNumber: 'Q-2026-0035',
      createdAt: '2026-09-17T15:00:00',
      validUntil: '2026-10-01T00:00:00',
      hourlyLaborRate: 85,
      estimatedLaborHours: 4.0,
      taxRatePercent: 10.0,
      discountAmount: 50,
      items: [
        {
          id: 'qi-110-1',
          type: 'labor',
          description: 'Gutter vacuum cleanout, pressure flush & mesh installation (36m)',
          quantity: 36,
          unitPrice: 15.00,
          total: 540
        },
        {
          id: 'qi-110-2',
          type: 'material',
          description: 'Colorbond Monument aluminium gutter guard rolls & screws',
          quantity: 3,
          unitPrice: 75,
          total: 225
        }
      ],
      subtotal: 715.00,
      taxAmount: 71.50,
      totalAmount: 736.50,
      notes: 'Tax Invoice sent via email. Due within 7 days.',
      status: 'accepted',
      clientSignatureName: 'Patricia Campbell',
      signedAt: '2026-09-19T14:30:00'
    },
    photos: [],
    timeLogs: [],
    internalNotes: ['Invoice #INV-2026-0502 sent.'],
    createdAt: '2026-09-17T11:00:00',
    updatedAt: '2026-09-19T15:00:00'
  }
];
