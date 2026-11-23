// Open-world Vice City environment and simulation state for GTA 6.
// Full city simulation: districts, roads, 2.5D buildings with varied heights,
// neon signs, water/beach features, vehicles, pedestrians, police AI, missions and camera.

export const KIND_BLOCK = 0;
export const KIND_COIN = 1;

export const EVENT_HIT = 1;
export const EVENT_COIN = 2;
export const EVENT_OVER = 4;

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2400;

export const DISTRICTS = {
  OCEAN_BEACH: 'Ocean Beach',
  OCEAN_DRIVE: 'Ocean Drive Strip',
  DOWNTOWN: 'Downtown Vice City',
  STARFISH_ISLAND: 'Starfish Island',
  VICE_PORT: 'Port of Vice City',
};

// Vehicle templates
export const VEHICLE_DEFS = {
  cheetah: { name: 'Grotti Cheetah', w: 46, h: 22, maxSpeed: 420, accel: 360, handling: 3.8, color: '#ff007f', accent: '#ffffff', style: 'sports' },
  infernus: { name: 'Pegassi Infernus', w: 48, h: 22, maxSpeed: 440, accel: 380, handling: 3.9, color: '#00f0ff', accent: '#111111', style: 'super' },
  banshee: { name: 'Bravado Banshee', w: 44, h: 21, maxSpeed: 410, accel: 350, handling: 3.7, color: '#2563eb', accent: '#ffffff', style: 'sports' },
  stallion: { name: 'Declasse Stallion', w: 48, h: 22, maxSpeed: 360, accel: 300, handling: 3.2, color: '#ea580c', accent: '#111111', style: 'muscle' },
  phoenix: { name: 'Imponte Phoenix', w: 49, h: 22, maxSpeed: 370, accel: 310, handling: 3.3, color: '#18181b', accent: '#eab308', style: 'muscle' },
  cop: { name: 'VCPD Cruiser', w: 48, h: 22, maxSpeed: 390, accel: 340, handling: 3.6, color: '#f8fafc', accent: '#1e3a8a', style: 'cop' },
  cab: { name: 'Vice Cab', w: 47, h: 22, maxSpeed: 340, accel: 280, handling: 3.2, color: '#facc15', accent: '#000000', style: 'taxi' },
  cabrio: { name: 'Ocean Cabrio', w: 44, h: 21, maxSpeed: 350, accel: 290, handling: 3.4, color: '#2dd4bf', accent: '#ffffff', style: 'convertible' },
  admiral: { name: 'Dundreary Admiral', w: 50, h: 23, maxSpeed: 330, accel: 260, handling: 3.0, color: '#1e293b', accent: '#94a3b8', style: 'sedan' },
  burrito: { name: 'Gang Burrito', w: 52, h: 25, maxSpeed: 320, accel: 250, handling: 2.8, color: '#09090b', accent: '#dc2626', style: 'van' },
};

export function createWorld(random) {
  const rng = random || Math.random;

  // 1. Water and Beach geography
  const waterZones = [
    // Atlantic Ocean (East side)
    { id: 'ocean', x: 2550, y: 0, w: 650, h: WORLD_HEIGHT, type: 'ocean' },
    // Starfish Island Canals / Bays
    { id: 'north_bay', x: 800, y: 920, w: 1050, h: 180, type: 'canal' },
    { id: 'south_bay', x: 800, y: 2060, w: 1050, h: 180, type: 'canal' },
    { id: 'west_channel', x: 740, y: 1000, w: 160, h: 1100, type: 'canal' },
    { id: 'east_channel', x: 1720, y: 1000, w: 180, h: 1100, type: 'canal' },
    // Harbor Bay (Southwest)
    { id: 'port_water', x: 0, y: 1250, w: 180, h: 1150, type: 'port_water' },
  ];

  const beachZones = [
    // Golden sand beach along the Atlantic
    { id: 'main_beach', x: 2280, y: 0, w: 270, h: WORLD_HEIGHT },
  ];

  const promenade = { x: 2200, y: 0, w: 80, h: WORLD_HEIGHT };

  // 2. Road Network
  const roads = [
    // Ocean Drive (North-South arterial along beachfront)
    { id: 'ocean_dr', x: 2080, y: 60, w: 120, h: 2280, isH: false, lanes: 4, name: 'Ocean Drive' },

    // Grand Avenue (Downtown North-South)
    { id: 'grand_ave', x: 700, y: 60, w: 120, h: 900, isH: false, lanes: 4, name: 'Grand Avenue' },

    // Downtown Metro Boulevard (East-West connecting Downtown to Ocean Drive)
    { id: 'vice_blvd', x: 100, y: 440, w: 2000, h: 120, isH: true, lanes: 4, name: 'Vice Boulevard' },

    // North Downtown Cross Street
    { id: 'bay_st_n', x: 100, y: 100, w: 2000, h: 90, isH: true, lanes: 2, name: 'Biscayne Street' },

    // Downtown South Street
    { id: 'civic_way', x: 100, y: 800, w: 700, h: 90, isH: true, lanes: 2, name: 'Civic Center Way' },

    // Port Highway (South-West Industrial)
    { id: 'port_hwy', x: 420, y: 920, w: 110, h: 1420, isH: false, lanes: 4, name: 'Port Highway' },

    // Port Access Road
    { id: 'docks_rd', x: 150, y: 1350, w: 300, h: 80, isH: true, lanes: 2, name: 'Docks Road' },
    { id: 'chop_rd', x: 150, y: 1950, w: 300, h: 80, isH: true, lanes: 2, name: 'Chop Shop Alley' },

    // South Causeway Bridge (Spanning canal from Downtown/Port across to Ocean Drive)
    { id: 'causeway_w', x: 500, y: 1480, w: 400, h: 100, isH: true, lanes: 2, name: 'West Causeway Bridge' },
    { id: 'causeway_e', x: 1680, y: 1480, w: 430, h: 100, isH: true, lanes: 2, name: 'East Causeway Bridge' },

    // Starfish Island Ring Road
    { id: 'starfish_n', x: 880, y: 1140, w: 820, h: 80, isH: true, lanes: 2, name: 'Starfish Boulevard North' },
    { id: 'starfish_s', x: 880, y: 1940, w: 820, h: 80, isH: true, lanes: 2, name: 'Starfish Boulevard South' },
    { id: 'starfish_w', x: 880, y: 1140, w: 80, h: 880, isH: false, lanes: 2, name: 'Starfish Drive West' },
    { id: 'starfish_e', x: 1620, y: 1140, w: 80, h: 880, isH: false, lanes: 2, name: 'Starfish Drive East' },
    { id: 'starfish_mid', x: 880, y: 1490, w: 820, h: 80, isH: true, lanes: 2, name: 'Mansion Parkway' },

    // Ocean Beach Cross Avenues
    { id: 'beach_cross_1', x: 1800, y: 440, w: 300, h: 100, isH: true, lanes: 2, name: 'Malibu Way' },
    { id: 'beach_cross_2', x: 1800, y: 980, w: 300, h: 90, isH: true, lanes: 2, name: 'Flamingo Way' },
    { id: 'beach_cross_3', x: 1800, y: 1480, w: 300, h: 100, isH: true, lanes: 2, name: 'Sunset Way' },
    { id: 'beach_cross_4', x: 1800, y: 1980, w: 300, h: 90, isH: true, lanes: 2, name: 'Palm Avenue' },
  ];

  // Bridges over water
  const bridges = [
    { id: 'br_causeway_w', x: 730, y: 1475, w: 180, h: 110, name: 'West Channel Bridge' },
    { id: 'br_causeway_e', x: 1690, y: 1475, w: 200, h: 110, name: 'East Channel Bridge' },
    { id: 'br_vice_blvd', x: 1530, y: 435, w: 300, h: 130, name: 'Vice Bay Bridge' },
  ];

  // Marina Piers jutting into the Atlantic Ocean
  const piers = [
    { id: 'pier_north', x: 2550, y: 680, w: 340, h: 48, name: 'Ocean Marina Pier North' },
    { id: 'pier_south', x: 2550, y: 1620, w: 340, h: 48, name: 'Ocean Marina Pier South' },
  ];

  // Moored Boats & Luxury Yachts
  const boats = [
    { name: 'Marquis 50', x: 2780, y: 640, w: 90, h: 32, heading: 0, color: '#f8fafc', trim: '#0284c7' },
    { name: 'Tropic Squalo', x: 2660, y: 740, w: 65, h: 24, heading: 0, color: '#dc2626', trim: '#ffffff' },
    { name: 'Vice Superyacht', x: 2720, y: 1570, w: 130, h: 42, heading: 0, color: '#0f172a', trim: '#facc15' },
    { name: 'Rio Jet 300', x: 2650, y: 1680, w: 55, h: 22, heading: 0, color: '#10b981', trim: '#ffffff' },
  ];

  // 3. Buildings with Diverse Heights, 2.5D Roofs, & Glowing Neon Signs
  const buildings = [
    // === OCEAN DRIVE STRIP (Art Deco Hotels & Clubs with Iconic Neon Signs) ===
    {
      id: 'malibu_club',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 220, w: 220, h: 180, stories: 4,
      wallColor: '#f472b6', roofColor: '#db2777', trimColor: '#00f0ff',
      neon: { text: 'CLUB MALIBU', color: '#ff007f', glow: '#ff00aa', type: 'pulse', size: 14 },
      type: 'nightclub',
    },
    {
      id: 'ocean_view_hotel',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 580, w: 220, h: 190, stories: 5,
      wallColor: '#38bdf8', roofColor: '#0284c7', trimColor: '#f43f5e',
      neon: { text: 'OCEAN VIEW HOTEL', color: '#00f0ff', glow: '#0284c7', type: 'steady', size: 13 },
      type: 'hotel',
    },
    {
      id: 'the_tropics',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 800, w: 220, h: 160, stories: 3,
      wallColor: '#4ade80', roofColor: '#16a34a', trimColor: '#facc15',
      neon: { text: 'THE TROPICS', color: '#39ff14', glow: '#22c55e', type: 'flicker', size: 14 },
      type: 'hotel',
    },
    {
      id: 'deco_palace',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 1100, w: 220, h: 170, stories: 4,
      wallColor: '#fb923c', roofColor: '#ea580c', trimColor: '#ec4899',
      neon: { text: 'DECO PALACE', color: '#ffaa00', glow: '#ea580c', type: 'steady', size: 14 },
      type: 'hotel',
    },
    {
      id: 'starlite_lounge',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 1300, w: 220, h: 160, stories: 3,
      wallColor: '#c084fc', roofColor: '#9333ea', trimColor: '#38bdf8',
      neon: { text: 'STARLITE LOUNGE', color: '#d946ef', glow: '#a855f7', type: 'pulse', size: 13 },
      type: 'lounge',
    },
    {
      id: 'flamingo_casino',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 1610, w: 220, h: 210, stories: 6,
      wallColor: '#fb7185', roofColor: '#e11d48', trimColor: '#facc15',
      neon: { text: 'PINK FLAMINGO CASINO', color: '#ff1493', glow: '#e11d48', type: 'pulse', size: 13 },
      type: 'casino',
    },
    {
      id: 'vice_palms',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 1850, w: 220, h: 170, stories: 4,
      wallColor: '#2dd4bf', roofColor: '#0d9488', trimColor: '#fb7185',
      neon: { text: 'VICE PALMS SUITES', color: '#06b6d4', glow: '#0891b2', type: 'steady', size: 13 },
      type: 'hotel',
    },
    {
      id: 'sunset_condos',
      district: DISTRICTS.OCEAN_DRIVE,
      x: 1830, y: 2100, w: 220, h: 180, stories: 5,
      wallColor: '#f43f5e', roofColor: '#be123c', trimColor: '#38bdf8',
      neon: { text: 'SUNSET TOWERS', color: '#f97316', glow: '#ea580c', type: 'steady', size: 14 },
      type: 'condos',
    },

    // === DOWNTOWN FINANCIAL DISTRICT (Massive Skyscraper Towers) ===
    {
      id: 'vice_bank_tower',
      district: DISTRICTS.DOWNTOWN,
      x: 180, y: 190, w: 240, h: 220, stories: 18,
      wallColor: '#1e293b', roofColor: '#0f172a', trimColor: '#10b981',
      neon: { text: 'VICE BANK & TRUST', color: '#10b981', glow: '#059669', type: 'steady', size: 13 },
      helipad: true, antenna: false, type: 'skyscraper',
    },
    {
      id: 'citadel_tower',
      district: DISTRICTS.DOWNTOWN,
      x: 450, y: 190, w: 220, h: 220, stories: 22,
      wallColor: '#1e1b4b', roofColor: '#0f0e2b', trimColor: '#3b82f6',
      neon: { text: 'CITADEL METRO', color: '#38bdf8', glow: '#2563eb', type: 'pulse', size: 14 },
      helipad: true, antenna: true, type: 'skyscraper',
    },
    {
      id: 'starlight_broadcasting',
      district: DISTRICTS.DOWNTOWN,
      x: 840, y: 190, w: 240, h: 220, stories: 16,
      wallColor: '#312e81', roofColor: '#1e1b4b', trimColor: '#fbbf24',
      neon: { text: 'STARLIGHT MEDIA', color: '#facc15', glow: '#f59e0b', type: 'steady', size: 13 },
      helipad: false, antenna: true, type: 'skyscraper',
    },
    {
      id: 'horizon_tower',
      district: DISTRICTS.DOWNTOWN,
      x: 1120, y: 190, w: 240, h: 220, stories: 15,
      wallColor: '#18181b', roofColor: '#09090b', trimColor: '#a855f7',
      neon: { text: 'HORIZON PLAZA', color: '#c084fc', glow: '#9333ea', type: 'steady', size: 14 },
      helipad: true, antenna: false, type: 'skyscraper',
    },
    {
      id: 'vcpd_hq',
      district: DISTRICTS.DOWNTOWN,
      x: 180, y: 580, w: 240, h: 200, stories: 10,
      wallColor: '#172554', roofColor: '#1e3a8a', trimColor: '#60a5fa',
      neon: { text: 'VCPD METROPOLITAN HQ', color: '#60a5fa', glow: '#2563eb', type: 'police_beacon', size: 13 },
      helipad: true, antenna: true, type: 'police_station',
    },
    {
      id: 'ammu_nation_downtown',
      district: DISTRICTS.DOWNTOWN,
      x: 450, y: 580, w: 220, h: 190, stories: 5,
      wallColor: '#450a0a', roofColor: '#7f1d1d', trimColor: '#facc15',
      neon: { text: 'AMMU-NATION', color: '#ef4444', glow: '#b91c1c', type: 'steady', size: 15 },
      type: 'gun_shop',
    },
    {
      id: 'grand_metropolitan',
      district: DISTRICTS.DOWNTOWN,
      x: 840, y: 580, w: 260, h: 210, stories: 14,
      wallColor: '#27272a', roofColor: '#18181b', trimColor: '#f43f5e',
      neon: { text: 'GRAND METROPOLITAN', color: '#f43f5e', glow: '#e11d48', type: 'steady', size: 13 },
      helipad: false, antenna: false, type: 'skyscraper',
    },
    {
      id: 'sunshine_autos',
      district: DISTRICTS.DOWNTOWN,
      x: 1130, y: 580, w: 250, h: 190, stories: 4,
      wallColor: '#3b0764', roofColor: '#581c87', trimColor: '#fbbf24',
      neon: { text: 'SUNSHINE AUTOS', color: '#facc15', glow: '#eab308', type: 'flicker', size: 14 },
      type: 'dealership',
    },

    // === STARFISH ISLAND (Luxury Mansions with Private Pools) ===
    {
      id: 'vercetti_estate',
      district: DISTRICTS.STARFISH_ISLAND,
      x: 990, y: 1240, w: 280, h: 220, stories: 3,
      wallColor: '#fef08a', roofColor: '#b45309', trimColor: '#14b8a6',
      neon: { text: 'VERCETTI ESTATE', color: '#f59e0b', glow: '#d97706', type: 'steady', size: 13 },
      pool: { x: 1040, y: 1380, w: 100, h: 60 },
      type: 'mansion',
    },
    {
      id: 'villa_capri',
      district: DISTRICTS.STARFISH_ISLAND,
      x: 990, y: 1670, w: 260, h: 200, stories: 2,
      wallColor: '#fed7aa', roofColor: '#9a3412', trimColor: '#06b6d4',
      neon: { text: 'VILLA CAPRI', color: '#38bdf8', glow: '#0284c7', type: 'steady', size: 13 },
      pool: { x: 1030, y: 1780, w: 90, h: 50 },
      type: 'mansion',
    },
    {
      id: 'villa_paradiso',
      district: DISTRICTS.STARFISH_ISLAND,
      x: 1340, y: 1240, w: 260, h: 220, stories: 3,
      wallColor: '#fed7aa', roofColor: '#b45309', trimColor: '#f472b6',
      neon: { text: 'VILLA PARADISO', color: '#f472b6', glow: '#db2777', type: 'steady', size: 13 },
      pool: { x: 1380, y: 1380, w: 90, h: 50 },
      type: 'mansion',
    },
    {
      id: 'villa_sol',
      district: DISTRICTS.STARFISH_ISLAND,
      x: 1340, y: 1670, w: 260, h: 200, stories: 2,
      wallColor: '#fef08a', roofColor: '#9a3412', trimColor: '#34d399',
      neon: { text: 'VILLA DEL SOL', color: '#34d399', glow: '#059669', type: 'steady', size: 13 },
      pool: { x: 1380, y: 1780, w: 90, h: 50 },
      type: 'mansion',
    },

    // === PORT OF VICE CITY (Industrial Warehouses, Shipping & Chop Shop) ===
    {
      id: 'port_warehouse_a',
      district: DISTRICTS.VICE_PORT,
      x: 200, y: 1060, w: 200, h: 160, stories: 2,
      wallColor: '#374151', roofColor: '#1f2937', trimColor: '#9ca3af',
      neon: { text: 'PORT FREIGHT TERMINAL A', color: '#9ca3af', glow: '#4b5563', type: 'steady', size: 12 },
      type: 'warehouse',
    },
    {
      id: 'port_customs',
      district: DISTRICTS.VICE_PORT,
      x: 200, y: 1460, w: 200, h: 170, stories: 3,
      wallColor: '#1f2937', roofColor: '#111827', trimColor: '#38bdf8',
      neon: { text: 'PORT OF VICE CITY', color: '#38bdf8', glow: '#0284c7', type: 'steady', size: 13 },
      type: 'port_hq',
    },
    {
      id: 'chop_shop',
      district: DISTRICTS.VICE_PORT,
      x: 200, y: 1770, w: 200, h: 160, stories: 2,
      wallColor: '#451a03', roofColor: '#78350f', trimColor: '#facc15',
      neon: { text: 'CHOP SHOP - AUTO RECYCLE', color: '#facc15', glow: '#eab308', type: 'pulse', size: 12 },
      type: 'chop_shop',
    },
    {
      id: 'port_cold_storage',
      district: DISTRICTS.VICE_PORT,
      x: 200, y: 2060, w: 200, h: 160, stories: 2,
      wallColor: '#1e293b', roofColor: '#0f172a', trimColor: '#64748b',
      neon: { text: 'VICE CARGO DOCKS B', color: '#64748b', glow: '#334155', type: 'steady', size: 12 },
      type: 'warehouse',
    },
  ];

  // 4. Props & Environment Details
  // Shipping containers in Port of Vice City
  const containers = [
    { x: 210, y: 1250, w: 60, h: 25, color: '#dc2626' },
    { x: 280, y: 1250, w: 60, h: 25, color: '#2563eb' },
    { x: 210, y: 1285, w: 60, h: 25, color: '#16a34a' },
    { x: 280, y: 1285, w: 60, h: 25, color: '#ca8a04' },
    { x: 210, y: 1650, w: 60, h: 25, color: '#2563eb' },
    { x: 280, y: 1650, w: 60, h: 25, color: '#dc2626' },
    { x: 210, y: 1950, w: 60, h: 25, color: '#e11d48' },
    { x: 280, y: 1950, w: 60, h: 25, color: '#0891b2' },
  ];

  // Palm Trees (distinctive Vice City fan palms)
  const palmTrees = [];
  // Along Ocean Drive Promenade
  for (let py = 80; py <= 2320; py += 75) {
    palmTrees.push({ x: 2240, y: py, size: 28, sway: rng() * Math.PI * 2 });
  }
  // Along Beach
  for (let py = 120; py <= 2300; py += 160) {
    palmTrees.push({ x: 2360, y: py, size: 26, sway: rng() * Math.PI * 2 });
  }
  // Starfish Island Palms
  for (let px = 920; px <= 1640; px += 100) {
    palmTrees.push({ x: px, y: 1100, size: 26, sway: rng() * Math.PI * 2 });
    palmTrees.push({ x: px, y: 2020, size: 26, sway: rng() * Math.PI * 2 });
  }
  // Downtown Grand Avenue Palms
  for (let py = 120; py <= 840; py += 90) {
    palmTrees.push({ x: 670, y: py, size: 24, sway: rng() * Math.PI * 2 });
    palmTrees.push({ x: 850, y: py, size: 24, sway: rng() * Math.PI * 2 });
  }

  // Street Lamps (warm radial illumination in twilight/night)
  const streetLamps = [];
  // Ocean Drive
  for (let ly = 100; ly <= 2300; ly += 140) {
    streetLamps.push({ x: 2060, y: ly, radius: 140, color: 'rgba(255, 230, 160, 0.45)' });
    streetLamps.push({ x: 2210, y: ly, radius: 140, color: 'rgba(255, 230, 160, 0.45)' });
  }
  // Vice Boulevard
  for (let lx = 140; lx <= 2040; lx += 160) {
    streetLamps.push({ x: lx, y: 420, radius: 130, color: 'rgba(255, 235, 180, 0.4)' });
    streetLamps.push({ x: lx, y: 580, radius: 130, color: 'rgba(255, 235, 180, 0.4)' });
  }
  // Bridges
  for (let lx = 740; lx <= 890; lx += 70) {
    streetLamps.push({ x: lx, y: 1460, radius: 120, color: 'rgba(255, 240, 190, 0.5)' });
    streetLamps.push({ x: lx, y: 1600, radius: 120, color: 'rgba(255, 240, 190, 0.5)' });
  }
  for (let lx = 1700; lx <= 1870; lx += 70) {
    streetLamps.push({ x: lx, y: 1460, radius: 120, color: 'rgba(255, 240, 190, 0.5)' });
    streetLamps.push({ x: lx, y: 1600, radius: 120, color: 'rgba(255, 240, 190, 0.5)' });
  }

  // Beach Items (Umbrellas, chairs, lifeguard towers)
  const beachProps = [
    { type: 'lifeguard_tower', x: 2470, y: 400, color: '#f43f5e' },
    { type: 'lifeguard_tower', x: 2470, y: 1000, color: '#06b6d4' },
    { type: 'lifeguard_tower', x: 2470, y: 1600, color: '#facc15' },
    { type: 'lifeguard_tower', x: 2470, y: 2150, color: '#10b981' },
    // Umbrella clusters
    { type: 'umbrella', x: 2420, y: 320, r: 16, color: '#ef4444' },
    { type: 'umbrella', x: 2440, y: 350, r: 16, color: '#3b82f6' },
    { type: 'umbrella', x: 2410, y: 380, r: 16, color: '#eab308' },
    { type: 'umbrella', x: 2430, y: 920, r: 16, color: '#ec4899' },
    { type: 'umbrella', x: 2450, y: 950, r: 16, color: '#06b6d4' },
    { type: 'umbrella', x: 2420, y: 1520, r: 16, color: '#f97316' },
    { type: 'umbrella', x: 2450, y: 1560, r: 16, color: '#8b5cf6' },
    { type: 'umbrella', x: 2430, y: 2060, r: 16, color: '#10b981' },
    // Volleyball court
    { type: 'volleyball_net', x: 2430, y: 680, w: 60, h: 100 },
  ];

  // 5. Initial Vehicles
  const vehicles = [
    // Cheetah sports car outside Club Malibu on Ocean Drive
    { id: 'v1', type: 'cheetah', ...VEHICLE_DEFS.cheetah, x: 2120, y: 300, angle: Math.PI / 2, speed: 0, health: 1000, siren: false, occupied: false },
    // Infernus outside Ocean View Hotel
    { id: 'v2', type: 'infernus', ...VEHICLE_DEFS.infernus, x: 2120, y: 660, angle: Math.PI / 2, speed: 0, health: 1000, siren: false, occupied: false },
    // VCPD Cruiser patrolling Ocean Drive
    { id: 'v3', type: 'cop', ...VEHICLE_DEFS.cop, x: 2170, y: 1200, angle: -Math.PI / 2, speed: 120, health: 1200, siren: false, occupied: true, isPolice: true },
    // Vice Cab on Ocean Drive
    { id: 'v4', type: 'cab', ...VEHICLE_DEFS.cab, x: 2120, y: 1400, angle: Math.PI / 2, speed: 100, health: 1000, siren: false, occupied: true },
    // Stallion muscle car at Starfish Island Mansion
    { id: 'v5', type: 'stallion', ...VEHICLE_DEFS.stallion, x: 1180, y: 1290, angle: 0, speed: 0, health: 1000, siren: false, occupied: false },
    // Banshee at Downtown Citadel
    { id: 'v6', type: 'banshee', ...VEHICLE_DEFS.banshee, x: 740, y: 280, angle: Math.PI / 2, speed: 0, health: 1000, siren: false, occupied: false },
    // VCPD Cruiser outside Police HQ
    { id: 'v7', type: 'cop', ...VEHICLE_DEFS.cop, x: 260, y: 520, angle: 0, speed: 0, health: 1200, siren: false, occupied: true, isPolice: true },
    // Burrito van at Port of Vice City
    { id: 'v8', type: 'burrito', ...VEHICLE_DEFS.burrito, x: 340, y: 1400, angle: 0, speed: 0, health: 1300, siren: false, occupied: false },
    // Ocean Cabrio on Vice Boulevard
    { id: 'v9', type: 'cabrio', ...VEHICLE_DEFS.cabrio, x: 1200, y: 470, angle: 0, speed: 140, health: 1000, siren: false, occupied: true },
    // Admiral sedan on Grand Ave
    { id: 'v10', type: 'admiral', ...VEHICLE_DEFS.admiral, x: 730, y: 640, angle: Math.PI / 2, speed: 110, health: 1100, siren: false, occupied: true },
  ];

  // 6. Pedestrians
  const pedestrians = [
    { id: 'p1', x: 2240, y: 260, vx: 0, vy: 40, angle: Math.PI / 2, type: 'tourist', shirt: '#ec4899', pants: '#38bdf8', health: 100, animPhase: 0 },
    { id: 'p2', x: 2240, y: 380, vx: 0, vy: -35, angle: -Math.PI / 2, type: 'roller_skater', shirt: '#facc15', pants: '#f43f5e', health: 100, animPhase: 1 },
    { id: 'p3', x: 2240, y: 640, vx: 0, vy: 45, angle: Math.PI / 2, type: 'beachgoer', shirt: '#06b6d4', pants: '#fef08a', health: 100, animPhase: 2 },
    { id: 'p4', x: 2060, y: 700, vx: 0, vy: -30, angle: -Math.PI / 2, type: 'clubber', shirt: '#a855f7', pants: '#18181b', health: 100, animPhase: 0 },
    { id: 'p5', x: 2240, y: 1150, vx: 0, vy: 40, angle: Math.PI / 2, type: 'tourist', shirt: '#4ade80', pants: '#f8fafc', health: 100, animPhase: 3 },
    { id: 'p6', x: 670, y: 260, vx: 0, vy: 50, angle: Math.PI / 2, type: 'business', shirt: '#1e293b', pants: '#475569', health: 100, animPhase: 1 },
    { id: 'p7', x: 860, y: 320, vx: 0, vy: -40, angle: -Math.PI / 2, type: 'business', shirt: '#0f172a', pants: '#334155', health: 100, animPhase: 2 },
    { id: 'p8', x: 210, y: 520, vx: 40, vy: 0, angle: 0, type: 'cop', shirt: '#1e3a8a', pants: '#0f172a', health: 150, animPhase: 0 },
  ];

  // 7. Crime Missions
  const missions = [
    {
      id: 'm1',
      title: 'VICE CITY INITIATION',
      desc: 'Steal the pink Grotti Cheetah parked at Club Malibu and deliver it to the Port Chop Shop.',
      targetX: 280,
      targetY: 1800,
      reward: 5000,
      completed: false,
    },
    {
      id: 'm2',
      title: 'OCEAN DRIVE HEAT',
      desc: 'Evade the VCPD patrol sirens along Ocean Drive and reach Starfish Island safehouse.',
      targetX: 1150,
      targetY: 1350,
      reward: 7500,
      completed: false,
    },
    {
      id: 'm3',
      title: 'CITADEL DATA BREACH',
      desc: 'Infiltrate Citadel Tower in Downtown and secure the syndicate briefcase.',
      targetX: 520,
      targetY: 340,
      reward: 12000,
      completed: false,
    },
  ];

  // 8. Player Character
  const player = {
    x: 2140,
    y: 360,
    width: 28,
    height: 28,
    angle: Math.PI / 2,
    speed: 0,
    maxSpeed: 160,
    sprintSpeed: 270,
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    wantedStars: 0,
    wantedCooldown: 0,
    inVehicle: null,
    weapon: 'UZI 9mm',
    ammo: 240,
    cash: 2500,
    invulnerable: 0,
  };

  // Camera tracking
  const camera = {
    x: player.x,
    y: player.y,
    targetX: player.x,
    targetY: player.y,
    zoom: 1.0,
    shake: 0,
  };

  // Particles & Projectiles
  const particles = [];
  const bullets = [];

  // Backward compatibility pool for starter test harness (shots.js etc.)
  const items = [];
  for (let index = 0; index < 64; index += 1) {
    items.push({ active: false, kind: KIND_BLOCK, x: 0, y: 0, width: 0, height: 0, speed: 0 });
  }

  const state = {
    player,
    vehicles,
    pedestrians,
    buildings,
    roads,
    bridges,
    piers,
    boats,
    waterZones,
    beachZones,
    promenade,
    palmTrees,
    streetLamps,
    beachProps,
    containers,
    missions,
    activeMissionIdx: 0,
    particles,
    bullets,
    camera,
    worldTime: 0,
    timeOfDay: 'twilight', // 'twilight', 'night', 'sunset'
    score: 0,
    lives: 3,
    level: 1,
    elapsed: 0,
    items,
  };

  function reset() {
    player.x = 2140;
    player.y = 360;
    player.angle = Math.PI / 2;
    player.speed = 0;
    player.health = 100;
    player.armor = 100;
    player.wantedStars = 0;
    player.inVehicle = null;
    player.invulnerable = 0;
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    state.elapsed = 0;
    state.worldTime = 0;
    particles.length = 0;
    bullets.length = 0;
    camera.x = player.x;
    camera.y = player.y;
    for (const item of items) item.active = false;
  }

  function addParticle(x, y, vx, vy, color, size, life) {
    particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
  }

  function checkBuildingCollision(x, y, radius) {
    for (let index = 0; index < buildings.length; index += 1) {
      const b = buildings[index];
      if (x + radius > b.x && x - radius < b.x + b.w && y + radius > b.y && y - radius < b.y + b.h) {
        return b;
      }
    }
    return null;
  }

  function isWater(x, y) {
    // Check if on any bridge first
    for (let index = 0; index < bridges.length; index += 1) {
      const br = bridges[index];
      if (x >= br.x && x <= br.x + br.w && y >= br.y && y <= br.y + br.h) {
        return false;
      }
    }
    // Check water bodies
    for (let index = 0; index < waterZones.length; index += 1) {
      const w = waterZones[index];
      if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) {
        return true;
      }
    }
    return false;
  }

  /**
   * Advances the simulation by dt seconds.
   * Can accept either an input object (from GTA 6 input system) or classic direction number.
   */
  function step(dt, inputArg, harmless) {
    let events = 0;
    state.elapsed += dt;
    state.worldTime += dt;
    state.level = Math.min(12, 1 + Math.floor(state.elapsed / 12));

    // Handle input: either object with keys or scalar direction
    let dirX = 0;
    let dirY = 0;
    let isSprinting = false;
    let actionTrigger = false;
    let brakeTrigger = false;

    if (typeof inputArg === 'object' && inputArg !== null) {
      if (inputArg.left) dirX -= 1;
      if (inputArg.right) dirX += 1;
      if (inputArg.up) dirY -= 1;
      if (inputArg.down) dirY += 1;
      isSprinting = Boolean(inputArg.sprint);
      actionTrigger = Boolean(inputArg.action);
      brakeTrigger = Boolean(inputArg.brake);
    } else if (typeof inputArg === 'number') {
      dirX = inputArg;
    }

    // Enter / Exit vehicle action
    if (actionTrigger) {
      if (player.inVehicle) {
        // Exit car
        const car = player.inVehicle;
        car.occupied = false;
        player.inVehicle = null;
        player.x = car.x + Math.cos(car.angle + Math.PI / 2) * 32;
        player.y = car.y + Math.sin(car.angle + Math.PI / 2) * 32;
      } else {
        // Find nearest car to enter
        for (let index = 0; index < vehicles.length; index += 1) {
          const car = vehicles[index];
          const dist = Math.hypot(car.x - player.x, car.y - player.y);
          if (dist < 60) {
            player.inVehicle = car;
            car.occupied = true;
            if (car.isPolice && player.wantedStars === 0) {
              player.wantedStars = 1;
            }
            break;
          }
        }
      }
    }

    // Movement: Player driving or on foot
    if (player.inVehicle) {
      const car = player.inVehicle;
      const turnSpeed = car.handling * (car.speed / (car.maxSpeed || 350));
      if (dirX < 0) car.angle -= turnSpeed * dt * (car.speed >= 0 ? 1 : -1);
      if (dirX > 0) car.angle += turnSpeed * dt * (car.speed >= 0 ? 1 : -1);

      if (dirY < 0) {
        car.speed = Math.min(car.maxSpeed, car.speed + car.accel * dt);
        // Tire smoke when accelerating hard
        if (rng() < 0.2) {
          const rearX = car.x - Math.cos(car.angle) * 20;
          const rearY = car.y - Math.sin(car.angle) * 20;
          addParticle(rearX, rearY, (rng() - 0.5) * 10, (rng() - 0.5) * 10, 'rgba(200, 200, 200, 0.4)', 6, 0.5);
        }
      } else if (dirY > 0) {
        car.speed = Math.max(-120, car.speed - car.accel * 0.8 * dt);
      } else {
        // Drag / deceleration
        car.speed *= 0.98;
      }

      if (brakeTrigger) {
        car.speed *= 0.92;
        const rearX = car.x - Math.cos(car.angle) * 20;
        const rearY = car.y - Math.sin(car.angle) * 20;
        addParticle(rearX, rearY, (rng() - 0.5) * 20, (rng() - 0.5) * 20, 'rgba(220, 220, 220, 0.6)', 8, 0.6);
      }

      const nextX = car.x + Math.cos(car.angle) * car.speed * dt;
      const nextY = car.y + Math.sin(car.angle) * car.speed * dt;

      if (!checkBuildingCollision(nextX, nextY, 20) && !isWater(nextX, nextY)) {
        car.x = Math.max(50, Math.min(WORLD_WIDTH - 50, nextX));
        car.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, nextY));
      } else {
        // Impact
        car.speed = -car.speed * 0.3;
        car.health = Math.max(0, car.health - 25);
        for (let i = 0; i < 5; i += 1) {
          addParticle(car.x, car.y, (rng() - 0.5) * 80, (rng() - 0.5) * 80, '#facc15', 3, 0.4);
        }
      }

      player.x = car.x;
      player.y = car.y;
      player.angle = car.angle;
    } else {
      // On Foot
      let speed = isSprinting ? player.sprintSpeed : player.maxSpeed;
      if (dirX !== 0 || dirY !== 0) {
        player.angle = Math.atan2(dirY, dirX);
        const len = Math.hypot(dirX, dirY);
        const vx = (dirX / len) * speed * dt;
        const vy = (dirY / len) * speed * dt;

        if (!checkBuildingCollision(player.x + vx, player.y, 14) && !isWater(player.x + vx, player.y)) {
          player.x = Math.max(30, Math.min(WORLD_WIDTH - 30, player.x + vx));
        }
        if (!checkBuildingCollision(player.x, player.y + vy, 14) && !isWater(player.x, player.y + vy)) {
          player.y = Math.max(30, Math.min(WORLD_HEIGHT - 30, player.y + vy));
        }
      }
    }

    // Traffic AI & Police AI
    for (let index = 0; index < vehicles.length; index += 1) {
      const v = vehicles[index];
      if (v === player.inVehicle || !v.occupied) continue;

      if (v.isPolice && player.wantedStars > 0) {
        // Police Siren & Pursuit
        v.siren = true;
        const dx = player.x - v.x;
        const dy = player.y - v.y;
        const dist = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        v.angle += Math.max(-0.06, Math.min(0.06, targetAngle - v.angle));
        v.speed = Math.min(320, v.speed + 160 * dt);

        const nx = v.x + Math.cos(v.angle) * v.speed * dt;
        const ny = v.y + Math.sin(v.angle) * v.speed * dt;
        if (!checkBuildingCollision(nx, ny, 20) && !isWater(nx, ny)) {
          v.x = nx;
          v.y = ny;
        }

        // Police ram player
        if (dist < 40) {
          player.health = Math.max(0, player.health - 5 * dt);
          events |= EVENT_HIT;
          if (player.health <= 0) events |= EVENT_OVER;
        }
      } else {
        // Normal traffic cruising along their heading
        const nx = v.x + Math.cos(v.angle) * v.speed * dt;
        const ny = v.y + Math.sin(v.angle) * v.speed * dt;
        if (!checkBuildingCollision(nx, ny, 20) && !isWater(nx, ny)) {
          v.x = nx;
          v.y = ny;
        } else {
          v.angle += Math.PI; // turn around
        }
      }
    }

    // Pedestrian wander
    for (let index = 0; index < pedestrians.length; index += 1) {
      const ped = pedestrians[index];
      ped.animPhase += dt * 4;
      ped.x += ped.vx * dt;
      ped.y += ped.vy * dt;
      if (rng() < 0.01) {
        ped.vy = -ped.vy;
        ped.angle = Math.atan2(ped.vy, ped.vx);
      }
    }

    // Particles update
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const p = particles[index];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) {
        particles.splice(index, 1);
      }
    }

    // Mission target proximity check
    const curMission = missions[state.activeMissionIdx];
    if (curMission && !curMission.completed) {
      const dist = Math.hypot(player.x - curMission.targetX, player.y - curMission.targetY);
      if (dist < 80) {
        curMission.completed = true;
        player.cash += curMission.reward;
        state.score += curMission.reward;
        events |= EVENT_COIN;
        if (state.activeMissionIdx < missions.length - 1) {
          state.activeMissionIdx += 1;
        }
      }
    }

    // Camera follow player smoothly
    const lookAheadDist = player.inVehicle ? player.inVehicle.speed * 0.4 : 30;
    const targetCamX = player.x + Math.cos(player.angle) * lookAheadDist;
    const targetCamY = player.y + Math.sin(player.angle) * lookAheadDist;
    camera.x += (targetCamX - camera.x) * Math.min(1, dt * 6);
    camera.y += (targetCamY - camera.y) * Math.min(1, dt * 6);

    // Keep camera within world bounds
    camera.x = Math.max(640, Math.min(WORLD_WIDTH - 640, camera.x));
    camera.y = Math.max(360, Math.min(WORLD_HEIGHT - 360, camera.y));

    return events;
  }

  reset();
  return { state, reset, step, checkBuildingCollision, isWater };
}
