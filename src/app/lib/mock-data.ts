// Mock data for GigKavacham PWA

export const PLATFORMS = [
  { id: 'swiggy', name: 'Swiggy Delivery' },
  { id: 'zomato', name: 'Zomato Rider' },
  { id: 'uber', name: 'Uber Driver' },
  { id: 'zepto', name: 'Zepto Rider' },
  { id: 'blinkit', name: 'Blinkit Partner' },
];

export const CITIES = [
  { id: 'bengaluru', name: 'Bengaluru', tier: 1, state: 'Karnataka' },
  { id: 'mumbai', name: 'Mumbai', tier: 1, state: 'Maharashtra' },
  { id: 'chennai', name: 'Chennai', tier: 1, state: 'Tamil Nadu' },
  { id: 'delhi', name: 'New Delhi', tier: 1, state: 'Delhi' },
  { id: 'hyderabad', name: 'Hyderabad', tier: 1, state: 'Telangana' },
  // Existing Tier 2
  { id: 'pune', name: 'Pune', tier: 2, state: 'Maharashtra' },
  { id: 'ahmedabad', name: 'Ahmedabad', tier: 2, state: 'Gujarat' },
  { id: 'kochi', name: 'Kochi', tier: 2, state: 'Kerala' },
  // New Tier 2
  { id: 'coimbatore', name: 'Coimbatore', tier: 2, state: 'Tamil Nadu' },
  { id: 'jaipur', name: 'Jaipur', tier: 2, state: 'Rajasthan' },
  { id: 'surat', name: 'Surat', tier: 2, state: 'Gujarat' },
  { id: 'lucknow', name: 'Lucknow', tier: 2, state: 'Uttar Pradesh' },
  { id: 'nagpur', name: 'Nagpur', tier: 2, state: 'Maharashtra' },
  { id: 'indore', name: 'Indore', tier: 2, state: 'Madhya Pradesh' },
  // New Tier 3
  { id: 'tirunelveli', name: 'Tirunelveli', tier: 3, state: 'Tamil Nadu' },
  { id: 'muzaffarpur', name: 'Muzaffarpur', tier: 3, state: 'Bihar' },
  { id: 'meerut', name: 'Meerut', tier: 3, state: 'Uttar Pradesh' },
  { id: 'shimla', name: 'Shimla', tier: 3, state: 'Himachal Pradesh' },
  { id: 'guntur', name: 'Guntur', tier: 3, state: 'Andhra Pradesh' },
  { id: 'warangal', name: 'Warangal', tier: 3, state: 'Telangana' },
];

export const TIER_FACTORS: Record<number, { factor: number; maxPayout: number }> = {
  1: { factor: 1.00, maxPayout: 8000 },
  2: { factor: 0.85, maxPayout: 5500 },
  3: { factor: 0.65, maxPayout: 3500 },
};

export const ZONES: Record<string, Array<{ id: string; name: string; district: string; zoneCode: string; zoneFloodRiskScore: number; zoneHeatRiskScore: number; zoneAqiRiskScore: number; }>> = {
  bengaluru: [
    { id: 'koramangala', name: 'Koramangala', district: 'Bengaluru South', zoneCode: 'KA-BLR-S', zoneFloodRiskScore: 0.85, zoneHeatRiskScore: 0.45, zoneAqiRiskScore: 0.72 },
    { id: 'whitefield', name: 'Whitefield', district: 'Bengaluru East', zoneCode: 'KA-BLR-E', zoneFloodRiskScore: 0.75, zoneHeatRiskScore: 0.55, zoneAqiRiskScore: 0.88 },
    { id: 'indiranagar', name: 'Indiranagar', district: 'Bengaluru East', zoneCode: 'KA-BLR-E', zoneFloodRiskScore: 0.60, zoneHeatRiskScore: 0.40, zoneAqiRiskScore: 0.78 },
    { id: 'hsr-layout', name: 'HSR Layout', district: 'Bengaluru South', zoneCode: 'KA-BLR-S', zoneFloodRiskScore: 0.90, zoneHeatRiskScore: 0.50, zoneAqiRiskScore: 0.65 },
  ],
  mumbai: [
    { id: 'andheri', name: 'Andheri West', district: 'Mumbai Suburban', zoneCode: 'MH-MUM-W', zoneFloodRiskScore: 0.95, zoneHeatRiskScore: 0.60, zoneAqiRiskScore: 0.85 },
    { id: 'bandra', name: 'Bandra', district: 'Mumbai Suburban', zoneCode: 'MH-MUM-W', zoneFloodRiskScore: 0.75, zoneHeatRiskScore: 0.55, zoneAqiRiskScore: 0.70 },
    { id: 'powai', name: 'Powai', district: 'Mumbai Suburban', zoneCode: 'MH-MUM-E', zoneFloodRiskScore: 0.65, zoneHeatRiskScore: 0.65, zoneAqiRiskScore: 0.75 },
    { id: 'kurla', name: 'Kurla', district: 'Mumbai Suburban', zoneCode: 'MH-MUM-C', zoneFloodRiskScore: 0.98, zoneHeatRiskScore: 0.70, zoneAqiRiskScore: 0.90 },
  ],
  chennai: [
    { id: 'velachery', name: 'Velachery', district: 'Chennai', zoneCode: 'TN-CHE-S', zoneFloodRiskScore: 0.95, zoneHeatRiskScore: 0.75, zoneAqiRiskScore: 0.55 },
    { id: 't-nagar', name: 'T. Nagar', district: 'Chennai', zoneCode: 'TN-CHE-C', zoneFloodRiskScore: 0.80, zoneHeatRiskScore: 0.85, zoneAqiRiskScore: 0.65 },
    { id: 'omr', name: 'OMR Tech Park', district: 'Chengalpattu', zoneCode: 'TN-CGL-OMR', zoneFloodRiskScore: 0.85, zoneHeatRiskScore: 0.80, zoneAqiRiskScore: 0.50 },
  ],
  // Empty states to prevent crashes
  delhi: [], hyderabad: [], pune: [], ahmedabad: [], kochi: [], coimbatore: [], jaipur: [], surat: [], lucknow: [], nagpur: [], indore: [], tirunelveli: [], muzaffarpur: [], meerut: [], shimla: [], guntur: [], warangal: []
};

export const PLANS = [
  {
    id: 'starter',
    name: 'Kavach Sprint',
    price: 49,
    coverage: 3000,
    maxPayout: 600,
    triggers: ['Rain'],
    description: 'Instant micro-payouts for severe waterlogging and monsoons.',
  },
  {
    id: 'essential',
    name: 'Kavach Essential',
    price: 129,
    coverage: 8000,
    maxPayout: 1500,
    triggers: ['Rain', 'AQI', 'Heat'],
    description: 'Comprehensive shift protection for full-time gig workers.',
    recommended: true,
  },
  {
    id: 'premium',
    name: 'Kavach 360°',
    price: 249,
    coverage: 15000,
    maxPayout: 3000,
    triggers: ['Rain', 'AQI', 'Heat', 'Curfew/Riot'],
    description: 'Maximum resilience. Covers extreme weather and public disturbances.',
  },
];

export const MOCK_CLAIMS = [
  {
    id: 'CLM-98234B',
    date: '2026-06-12',
    type: 'Rain',
    amount: 850,
    status: 'Credited',
    zone: 'Velachery, Chennai',
  },
  {
    id: 'CLM-77491C',
    date: '2026-05-28',
    type: 'Heat',
    amount: 400,
    status: 'Credited',
    zone: 'T. Nagar, Chennai',
  },
  {
    id: 'CLM-55102A',
    date: '2025-11-14',
    type: 'AQI',
    amount: 600,
    status: 'Credited',
    zone: 'Andheri West, Mumbai',
  },
  {
    id: 'CLM-33984X',
    date: '2025-08-05',
    type: 'Traffic',
    amount: 1200,
    status: 'Credited',
    zone: 'HSR Layout, Bengaluru',
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 'NOTIF-8821',
    message: 'Parametric Trigger: IMD reports 90mm rainfall in Velachery. ₹850 compensation credited to your UPI.',
    timestamp: '2026-06-12T14:22:00',
    type: 'payout',
  },
  {
    id: 'NOTIF-8822',
    message: 'Kavach-AI Alert: Heatwave warning (42°C) projected for T. Nagar tomorrow. Shift protection active.',
    timestamp: '2026-05-27T18:00:00',
    type: 'warning',
  },
  {
    id: 'NOTIF-8823',
    message: 'Your Kavach Essential plan has been renewed. Next billing: July 15.',
    timestamp: '2026-06-15T09:00:00',
    type: 'info',
  },
];

// Admin Dashboard Mock Data
export const ADMIN_STATS = {
  activePolicies: 48250,
  claimsToday: 1240,
  totalPayouts: 34580000,
  lossRatio: 0.72,
};

export const ADMIN_WEEKLY_PAYOUTS = [
  { day: 'Mon', amount: 450000 },
  { day: 'Tue', amount: 320000 },
  { day: 'Wed', amount: 840000 },
  { day: 'Thu', amount: 560000 },
  { day: 'Fri', amount: 1280000 },
  { day: 'Sat', amount: 2670000 },
  { day: 'Sun', amount: 3120000 },
];

export const ADMIN_ZONE_DATA = [
  {
    id: 'zone-1',
    name: 'Velachery',
    dcs: 92,
    status: 'triggered',
    activeWorkers: 1245,
    expectedPayout: 1058250,
    lat: 12.9750,
    lng: 80.2167,
  },
  {
    id: 'zone-2',
    name: 'Koramangala',
    dcs: 85,
    status: 'triggered',
    activeWorkers: 980,
    expectedPayout: 833000,
    lat: 12.9352,
    lng: 77.6245,
  },
  {
    id: 'zone-3',
    name: 'Andheri West',
    dcs: 45,
    status: 'safe',
    activeWorkers: 2150,
    expectedPayout: 0,
    lat: 19.1363,
    lng: 72.8277,
  },
  {
    id: 'zone-4',
    name: 'T. Nagar',
    dcs: 78,
    status: 'risk',
    activeWorkers: 840,
    expectedPayout: 336000,
    lat: 13.0418,
    lng: 80.2341,
  },
];

export const ADMIN_CLAIMS_PIPELINE = [
  {
    id: 'PIPE-A442',
    workerName: 'Muthu Kumar',
    workerId: 'WK-TN-9821',
    zone: 'Velachery',
    triggerType: 'Rain',
    amount: 850,
    status: 'Approved',
    timestamp: '2026-06-12T14:15:00',
    fraudFlag: false,
  },
  {
    id: 'PIPE-A443',
    workerName: 'Priyanka Desai',
    workerId: 'WK-MH-4412',
    zone: 'Andheri West',
    triggerType: 'AQI',
    amount: 600,
    status: 'Approved',
    timestamp: '2026-06-12T14:12:00',
    fraudFlag: false,
  },
  {
    id: 'PIPE-A444',
    workerName: 'Sanjay Reddy',
    workerId: 'WK-KA-7721',
    zone: 'Koramangala',
    triggerType: 'Rain',
    amount: 850,
    status: 'Flagged',
    timestamp: '2026-06-12T14:08:00',
    fraudFlag: true,
    fraudReason: 'App Cloning Detected',
  },
  {
    id: 'PIPE-A445',
    workerName: 'Abdul Rahman',
    workerId: 'WK-TN-8823',
    zone: 'T. Nagar',
    triggerType: 'Heat',
    amount: 400,
    status: 'Approved',
    timestamp: '2026-06-12T13:55:00',
    fraudFlag: false,
  },
];

export const FRAUD_REVIEWS = [
  {
    id: 'FRD-REV-901',
    workerName: 'Sanjay Reddy',
    workerId: 'WK-KA-7721',
    zone: 'Koramangala',
    claimAmount: 850,
    fraudProbability: 0.94,
    issues: [
      { type: 'Parallel Space App Cloning', severity: 'high' },
      { type: 'Impossible Travel Velocity', severity: 'high' },
    ],
    lastKnownLocation: { lat: 12.9716, lng: 77.5946 }, // Majestic
    claimLocation: { lat: 12.9352, lng: 77.6245 }, // Koramangala
  },
  {
    id: 'FRD-REV-902',
    workerName: 'Vikram Singh',
    workerId: 'WK-DL-3321',
    zone: 'Gurugram Sector 29',
    claimAmount: 1500,
    fraudProbability: 0.78,
    issues: [
      { type: 'Mock Location API Active', severity: 'high' },
      { type: 'Rooted Device', severity: 'medium' },
    ],
    lastKnownLocation: { lat: 28.5355, lng: 77.3910 }, // Noida
    claimLocation: { lat: 28.4714, lng: 77.0620 }, // Gurugram
  },
  {
    id: 'FRD-REV-903',
    workerName: 'Ravi Teja',
    workerId: 'WK-TS-1123',
    zone: 'HITEC City',
    claimAmount: 600,
    fraudProbability: 0.82,
    issues: [
      { type: 'Platform API Mismatch', severity: 'high' },
      { type: 'Zero Shift Activity (48h)', severity: 'medium' },
    ],
    lastKnownLocation: { lat: 17.4435, lng: 78.3772 },
    claimLocation: { lat: 17.4435, lng: 78.3772 },
  },
];

export const PREDICTIVE_DATA = [
  {
    date: 'Jun 13',
    expectedClaims: 3200,
    expectedPayout: 2720000,
    riskLevel: 'medium',
  },
  {
    date: 'Jun 14',
    expectedClaims: 5400,
    expectedPayout: 4590000,
    riskLevel: 'high',
  },
  {
    date: 'Jun 15',
    expectedClaims: 1800,
    expectedPayout: 1530000,
    riskLevel: 'low',
  },
  {
    date: 'Jun 16',
    expectedClaims: 2100,
    expectedPayout: 1785000,
    riskLevel: 'medium',
  },
  {
    date: 'Jun 17',
    expectedClaims: 8500,
    expectedPayout: 7225000,
    riskLevel: 'high',
  },
];
