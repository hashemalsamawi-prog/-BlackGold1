import logoSvg from './images/black_gold_logo_transparent.svg';
import logoRasterJpg from './images/black_gold_logo_1786125297515.jpg';
import pouchPairJpg from './images/black_gold_pouch_pair_1786125935649.jpg';
import shishaSessionJpg from './images/black_gold_shisha_session_1786125947470.jpg';
import retailStandJpg from './images/black_gold_retail_stand_1786125959576.jpg';
import deliveryFleetJpg from './images/black_gold_delivery_fleet_1786125973582.jpg';
import merchKitJpg from './images/black_gold_merch_kit_1786125990648.jpg';
import heroBannerJpg from './images/charcoal_hero_banner_1786118670743.jpg';
import localPackJpg from './images/local_charcoal_pack_1786118685561.jpg';
import premiumPackJpg from './images/premium_charcoal_pack_1786118701517.jpg';

export const ASSETS = {
  logo: logoSvg,
  logoRaster: logoRasterJpg,
  pouchPair: pouchPairJpg,
  shishaSession: shishaSessionJpg,
  retailStand: retailStandJpg,
  deliveryFleet: deliveryFleetJpg,
  merchKit: merchKitJpg,
  heroBanner: heroBannerJpg,
  localPack: localPackJpg,
  premiumPack: premiumPackJpg,
};

export const resolveAsset = (path?: string | null): string => {
  if (!path || path.trim() === '') return ASSETS.pouchPair;

  // If path matches a known image name or legacy path, map to bundled asset
  if (path.includes('pouch_pair')) return ASSETS.pouchPair;
  if (path.includes('logo_transparent')) return ASSETS.logo;
  if (path.includes('black_gold_logo')) return ASSETS.logoRaster;
  if (path.includes('shisha_session')) return ASSETS.shishaSession;
  if (path.includes('retail_stand')) return ASSETS.retailStand;
  if (path.includes('delivery_fleet')) return ASSETS.deliveryFleet;
  if (path.includes('merch_kit')) return ASSETS.merchKit;
  if (path.includes('hero_banner')) return ASSETS.heroBanner;
  if (path.includes('local_charcoal') || path.includes('local_pack')) return ASSETS.localPack;
  if (path.includes('premium_charcoal') || path.includes('premium_pack')) return ASSETS.premiumPack;

  return path;
};

