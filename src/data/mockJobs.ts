import { Job, HandymanProfile } from '../types';

export const DEFAULT_PROFILE: HandymanProfile = {
  name: 'Alex Miller',
  businessName: 'Apex Handyman & Property Maintenance',
  abn: '83 912 405 618',
  phone: '0412 890 442',
  email: 'alex@apexhandyman.com.au',
  defaultHourlyRate: 85,
  baseAddress: 'Point Cook Town Centre, Main St, Point Cook VIC 3030',
  baseCoordinates: [-37.9175, 144.7492],
  currencySymbol: '$',
  taxRatePercent: 10.0,
  accountName: 'Apex Handyman Pty Ltd',
  bsb: '063-875',
  accountNumber: '1048 9921',
  bankName: 'Commonwealth Bank of Australia',
  paymentTerms: 'Payment due within 7 days of invoice issue. Direct deposit EFT or on-site card tap.'
};

export const REAL_ESTATE_AGENCIES = [
  'Ray White Point Cook',
  'Barry Plant Sanctuary Lakes',
  'LJ Hooker Point Cook',
  'Reliance Real Estate',
  'Harcourts Point Cook'
];

export const SUBURBS_LIST = [
  'Point Cook',
  'Williams Landing',
  'Seabrook',
  'Altona Meadows',
  'Hoppers Crossing',
  'Truganina'
];

// Completely clean empty jobs by default - no hardcoded mock jobs
export const INITIAL_JOBS: Job[] = [];
