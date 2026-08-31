export const ASSETS = {
  logo: '/src/assets/images/black_gold_logo_transparent.svg',
  logoRaster: '/src/assets/images/black_gold_logo_1786125297515.jpg',
  pouchPair: '/src/assets/images/black_gold_pouch_pair_1786125935649.jpg',
  shishaSession: '/src/assets/images/black_gold_shisha_session_1786125947470.jpg',
  retailStand: '/src/assets/images/black_gold_retail_stand_1786125959576.jpg',
  deliveryFleet: '/src/assets/images/black_gold_delivery_fleet_1786125973582.jpg',
  merchKit: '/src/assets/images/black_gold_merch_kit_1786125990648.jpg',
  heroBanner: '/src/assets/images/charcoal_hero_banner_1786118670743.jpg',
  localPack: '/src/assets/images/local_charcoal_pack_1786118685561.jpg',
  premiumPack: '/src/assets/images/premium_charcoal_pack_1786118701517.jpg',
};

export const resolveAsset = (path: string): string => {
  if (!path) return ASSETS.logo;
  return path;
};

