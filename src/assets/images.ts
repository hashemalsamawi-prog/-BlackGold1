export const ASSETS = {
  logo: '/images/black_gold_logo_transparent.svg',
  logoRaster: '/images/black_gold_logo_1786125297515.jpg',
  pouchPair: '/images/black_gold_pouch_pair_1786125935649.jpg',
  shishaSession: '/images/black_gold_shisha_session_1786125947470.jpg',
  retailStand: '/images/black_gold_retail_stand_1786125959576.jpg',
  deliveryFleet: '/images/black_gold_delivery_fleet_1786125973582.jpg',
  merchKit: '/images/black_gold_merch_kit_1786125990648.jpg',
  heroBanner: '/images/charcoal_hero_banner_1786118670743.jpg',
  localPack: '/images/local_charcoal_pack_1786118685561.jpg',
  premiumPack: '/images/premium_charcoal_pack_1786118701517.jpg',
};

export const resolveAsset = (path?: string | null): string => {
  if (!path || path.trim() === '') return ASSETS.pouchPair;
  // Convert legacy /src/assets/images/ to standard /images/
  if (path.startsWith('/src/assets/images/')) {
    return path.replace('/src/assets/images/', '/images/');
  }
  return path;
};

