import { Product, DeliveryAddress, DeliveryAgent, MarketingCampaign, StoreSettings, GalleryItem } from '../types';
import { ASSETS } from '../assets/images';

export interface SanaaDistrictInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  fee: number;
  coords: { lat: number; lng: number };
}

export const SANAA_DISTRICTS: SanaaDistrictInfo[] = [
  { id: 'حدة', nameAr: 'حدة', nameEn: 'Haddah', fee: 800, coords: { lat: 15.3195, lng: 44.1843 } },
  { id: 'السبعين', nameAr: 'السبعين', nameEn: 'Al Sabeen', fee: 800, coords: { lat: 15.3289, lng: 44.2045 } },
  { id: 'الأصبحي', nameAr: 'الأصبحي', nameEn: 'Al Asbahi', fee: 1000, coords: { lat: 15.3054, lng: 44.2154 } },
  { id: 'شميلة', nameAr: 'شميلة', nameEn: 'Shumaylah', fee: 1000, coords: { lat: 15.3184, lng: 44.2254 } },
  { id: 'بيت بوس', nameAr: 'بيت بوس', nameEn: 'Bayt Baws', fee: 1200, coords: { lat: 15.2894, lng: 44.2012 } },
  { id: 'الصافية', nameAr: 'الصافية', nameEn: 'Al Safiyah', fee: 800, coords: { lat: 15.3394, lng: 44.2145 } },
  { id: 'التحرير', nameAr: 'التحرير', nameEn: 'Al Tahrir', fee: 800, coords: { lat: 15.3562, lng: 44.2041 } },
  { id: 'شعوب', nameAr: 'شعوب', nameEn: 'Shuub', fee: 1000, coords: { lat: 15.3721, lng: 44.2241 } },
  { id: 'مذبح', nameAr: 'مذبح', nameEn: 'Mathbah', fee: 1000, coords: { lat: 15.3712, lng: 44.1754 } },
  { id: 'الحصبة', nameAr: 'الحصبة', nameEn: 'Al Hasaba', fee: 1000, coords: { lat: 15.3854, lng: 44.2014 } },
  { id: 'شيراتون', nameAr: 'شيراتون / نقم', nameEn: 'Sheraton', fee: 1000, coords: { lat: 15.3612, lng: 44.2384 } },
  { id: 'الروضة', nameAr: 'الروضة', nameEn: 'Al Rawdah', fee: 1200, coords: { lat: 15.4214, lng: 44.2154 } },
  { id: 'بني الحارث', nameAr: 'بني الحارث', nameEn: 'Bani Al Harith', fee: 1500, coords: { lat: 15.4454, lng: 44.2284 } },
  { id: 'دار سلم', nameAr: 'دار سلم', nameEn: 'Dar Silm', fee: 1200, coords: { lat: 15.2812, lng: 44.2412 } },
  { id: 'عصر', nameAr: 'عصر', nameEn: 'Assr', fee: 800, coords: { lat: 15.3341, lng: 44.1684 } },
  { id: 'الستين الجنوبي', nameAr: 'الستين الجنوبي', nameEn: 'South Sixtieth', fee: 800, coords: { lat: 15.3154, lng: 44.1954 } },
  { id: 'الستين الغربي', nameAr: 'الستين الغربي', nameEn: 'West Sixtieth', fee: 800, coords: { lat: 15.3512, lng: 44.1784 } },
  { id: 'الستين الشمالي', nameAr: 'الستين الشمالي', nameEn: 'North Sixtieth', fee: 1000, coords: { lat: 15.3912, lng: 44.1854 } },
  { id: 'الستين الشرقي', nameAr: 'الستين الشرقي', nameEn: 'East Sixtieth', fee: 1000, coords: { lat: 15.3454, lng: 44.2354 } },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'bg-prem-250g',
    nameAr: 'فحم الذهب الأسود الفاخر (250g + 10g مجاناً)',
    nameEn: 'Black Gold Premium Charcoal (250g + 10g Free)',
    descriptionAr: 'فحم طبيعي مضغوط عالي النقاوة، بدون دخان أو رائحة أو شرار. يدوم حتى 3 ساعات اشتعال متواصل ويوفر حرارة متجانسة للشيشة والشواء الراقي.',
    descriptionEn: 'High purity natural compressed charcoal. Smokeless, spark-free, odorless. Lasts up to 3 continuous hours with optimal heat.',
    category: 'premium',
    price: 1200,
    originalPrice: 1500,
    weightGrams: 250,
    bonusGrams: 10,
    inStock: true,
    stockCount: 800,
    image: ASSETS.premiumPack,
    isPopular: true,
    isNew: true,
    burnTimeMinutes: 180,
    sparkLevel: '0% معدوم تماماً',
    smokeLevel: '0% بدون أي دخان',
    ashContent: '< 2% رماد أبيض ناصع',
    carbonLevel: '> 88% كربون نقي',
    heatOutput: 'حرارة متوازنة فائقة 650°C',
    featuresAr: [
      'مغلف بأكياس ألمنيوم حافظة للرطوبة',
      'اشتعال ذاتي سريع ومتجانس',
      'صديق للبيئة بدون إضافات كيميائية',
      'وزن 250 جرام + 10 جرام هدية مجانية'
    ],
    featuresEn: [
      'Moisture-lock aluminum sealed packaging',
      'Quick and uniform ignition',
      '100% natural organic eco-friendly',
      '250g + 10g bonus included'
    ],
    reviewsCount: 142,
    rating: 4.9,
  },
  {
    id: 'bg-prem-500g',
    nameAr: 'فحم الذهب الأسود الفاخر (500g + 10g مجاناً)',
    nameEn: 'Black Gold Premium Charcoal (500g + 10g Free)',
    descriptionAr: 'العبوة العائلية الملكية من فحم الذهب الأسود. مكعبات متناسقة تدوم لأطول جلسات الاسترخاء والمناسبات بدون انبعاثات أو روائح.',
    descriptionEn: 'Royal family package of Black Gold charcoal. Perfectly uniform cubes for long sessions without emissions.',
    category: 'premium',
    price: 2200,
    originalPrice: 2600,
    weightGrams: 500,
    bonusGrams: 10,
    inStock: true,
    stockCount: 650,
    image: ASSETS.pouchPair,
    isPopular: true,
    isNew: false,
    burnTimeMinutes: 200,
    sparkLevel: '0% معدوم',
    smokeLevel: '0% منعدم الدخان',
    ashContent: '< 1.8% رماد فضي رقيق',
    carbonLevel: '> 90% كربون عالي الكثافة',
    heatOutput: 'حرارة مستقرة 700°C',
    featuresAr: [
      'عبوة توفيرية للمجالس والمناسبات',
      'رماد ناصع قليل جداً لا يتطاير',
      'يدوم لأكثر من 3 ساعات',
      'صمام غلق محكم Ziplock لحفظ الجفاف'
    ],
    featuresEn: [
      'Value pack for gatherings & lounges',
      'Ultra low ash residue',
      'Burn time exceeds 3 hours',
      'Airtight Ziplock closure'
    ],
    reviewsCount: 98,
    rating: 5.0,
  },
  {
    id: 'bg-local-250g',
    nameAr: 'فحم الذهب الأسود البلدي الأصيل (250g + 10g مجاناً)',
    nameEn: 'Black Gold Authentic Local Charcoal (250g + 10g Free)',
    descriptionAr: 'مستخلص من أجود أنواع أخشاب السدر والطلح الطبيعية المعتقة. نكهة أصيلة ورائحة شواء كلاسيكية مميزة.',
    descriptionEn: 'Selected from the finest natural Sidr and acacia woods. Authentic flavor and classic grilling aroma.',
    category: 'local',
    price: 1000,
    originalPrice: 1300,
    weightGrams: 250,
    bonusGrams: 10,
    inStock: true,
    stockCount: 450,
    image: ASSETS.localPack,
    isPopular: false,
    isNew: true,
    burnTimeMinutes: 150,
    sparkLevel: '< 1% خفيف جداً',
    smokeLevel: 'دخان عطري طبيعي خفيف',
    ashContent: '< 3% رماد طبيعي',
    carbonLevel: '> 82% كربون طبيعي',
    heatOutput: 'حرارة حطب طبيعية مركزة',
    featuresAr: [
      'طبيعي 100% من أشجار السدر المعتقة',
      'مثالي للمشاوي والطهي التقليدي',
      'تعبئة يدوية منتقاة بعناية',
      '250g + 10g مجاناً'
    ],
    featuresEn: [
      '100% natural Sidr wood harvest',
      'Ideal for traditional barbecue grilling',
      'Hand-selected quality chunks',
      '250g + 10g free bonus'
    ],
    reviewsCount: 64,
    rating: 4.8,
  },
  {
    id: 'bg-b2b-carton',
    nameAr: 'كرتون الجملة والتوريد التجاري (24 عبوة × 250g)',
    nameEn: 'Wholesale Commercial Carton (24 Packs × 250g)',
    descriptionAr: 'مخصص للمقاهي والمطاعم وتجار التجزئة في صنعاء. توريد يومي مباشر مع تسهيلات دفع وضمان استبدال فوري.',
    descriptionEn: 'Dedicated for cafes, lounges, restaurants, and retail stores in Sanaa. Direct delivery with trade discounts.',
    category: 'b2b',
    price: 24000,
    originalPrice: 28800,
    weightGrams: 6000,
    bonusGrams: 240,
    inStock: true,
    stockCount: 120,
    image: ASSETS.retailStand,
    isPopular: true,
    isNew: false,
    burnTimeMinutes: 180,
    sparkLevel: '0% خالي من الشرار',
    smokeLevel: '0% خالي من الدخان',
    ashContent: '< 2%',
    carbonLevel: '> 88%',
    heatOutput: 'أداء احترافي معتمد',
    featuresAr: [
      'سعر جملة خاص بهامش ربح مجزي',
      'ستاند عرض تجاري مجاني مع أول طلب',
      'توصيل مجاني فوري إلى موقع المنشأة',
      'فواتير ضريبية وسندات استلام رسمية'
    ],
    featuresEn: [
      'Special B2B wholesale pricing',
      'Free retail display stand included',
      'Free express direct delivery',
      'Commercial tax invoices provided'
    ],
    reviewsCount: 37,
    rating: 4.9,
  }
];

export const MOCK_ADDRESSES: DeliveryAddress[] = [
  {
    id: 'addr-1',
    title: 'المنزل - حدة',
    district: 'حدة',
    street: 'شارع بيروت - خلف فندق القصر',
    building: 'عمارة النور - الدور الثالث',
    landmark: 'بجوار صيدلية الفردوس',
    phone: '777123456',
    latitude: 15.328,
    longitude: 44.185,
    isDefault: true,
  },
  {
    id: 'addr-2',
    title: 'المقهى / العمل - السبعين',
    district: 'السبعين',
    street: 'ميدان السبعين - شارع الستين الجنوبي',
    building: 'كافيه السلطان',
    landmark: 'أمام بوابة حديقة السبعين',
    phone: '777987654',
    latitude: 15.335,
    longitude: 44.202,
    isDefault: false,
  }
];

export const INITIAL_DELIVERY_AGENTS: DeliveryAgent[] = [
  {
    id: 'drv-1',
    name: 'أحمد الكبسي',
    phone: '771234567',
    vehicleType: 'motorcycle',
    assignedDistricts: ['حدة', 'السبعين', 'الأصبحي', 'بيت بوس'],
    isActive: true,
    currentLatitude: 15.328,
    currentLongitude: 44.185,
    completedOrdersCount: 428,
    rating: 4.9,
  },
  {
    id: 'drv-2',
    name: 'ياسر الردماني',
    phone: '775678912',
    vehicleType: 'motorcycle',
    assignedDistricts: ['التحرير', 'الصافية', 'شعوب', 'الحصبة'],
    isActive: true,
    currentLatitude: 15.352,
    currentLongitude: 44.209,
    completedOrdersCount: 312,
    rating: 4.8,
  },
  {
    id: 'drv-3',
    name: 'محمد الشامي (فان التوريد B2B)',
    phone: '773456789',
    vehicleType: 'van',
    assignedDistricts: ['جميع مناطق أمانة العاصمة'],
    isActive: true,
    currentLatitude: 15.340,
    currentLongitude: 44.195,
    completedOrdersCount: 560,
    rating: 5.0,
  }
];

export const INITIAL_CAMPAIGNS: MarketingCampaign[] = [
  {
    id: 'camp-1',
    titleAr: 'عرض التوفير الملكي: +10 جرام مجاناً على كل عبوة',
    titleEn: 'Royal Bonus Deal: +10g Extra Free in Every Pouch',
    descriptionAr: 'احصل على 10 جرام فحم إضافي مجاني مدمج في كل كيس من فحم الذهب الأسود الفاخر والبلدي لفترة محدودة!',
    descriptionEn: 'Enjoy 10 extra bonus grams sealed inside each pouch of Black Gold charcoal for a limited time!',
    discountPercentage: 15,
    bannerImage: ASSETS.heroBanner,
    isActive: true,
    validUntil: '2026-12-31',
    code: 'ROYAL10',
  }
];

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  storeNameAr: 'الذهب الأسود | Black Gold',
  storeNameEn: 'Black Gold Charcoal Store',
  supportPhone: '777000111',
  whatsappNumber: '967777000111',
  supportEmail: 'contact@blackgold-charcoal.com',
  minOrderAmount: 1000,
  freeShippingThreshold: 5000,
  defaultShippingFee: 1000,
  workingHoursAr: 'يومياً على مدار 24 ساعة - توصيل فوري في صنعاء',
  workingHoursEn: '24/7 Daily - Instant Delivery across Sanaa',
  announcementAr: '🔥 توصيل فحم الذهب الأسود السريع في صنعاء خلال 30 دقيقة | عرض +10 جرام مجاناً ساري الآن!',
  announcementEn: '🔥 Fast Charcoal Delivery in Sanaa within 30 mins | Extra +10g bonus active now!',
  isOrderingEnabled: true,
  currencySymbol: 'ريال',
  loyaltyPointsPer1000YER: 10,
  districts: SANAA_DISTRICTS.map((d) => ({
    id: d.id,
    nameAr: d.nameAr,
    district: d.nameAr,
    deliveryFee: d.fee,
    estimatedMinutes: 25,
    isAvailable: true,
  })),
};

export const INITIAL_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-1',
    titleAr: 'أسطول التوصيل الفوري السريع',
    titleEn: 'Express Direct Delivery Fleet',
    category: 'fleet',
    image: ASSETS.deliveryFleet,
    descriptionAr: 'مناديب توصيل مجهزون بأحدث الحقائب الحرارية لضمان وصول الفحم جافاً ونقياً فور طلبك.',
  },
  {
    id: 'gal-2',
    titleAr: 'جلسات الشيشة والروقان الملكي',
    titleEn: 'Royal Shisha & Lounge Sessions',
    category: 'sessions',
    image: ASSETS.shishaSession,
    descriptionAr: 'فحم عديم الرائحة والشرار لحماية نكهة المعسل والتمتع بجلسة نقية تدوم لساعات.',
  },
  {
    id: 'gal-3',
    titleAr: 'استاندات العرض في المحلات ومراكز التسوق',
    titleEn: 'Retail Display Stands in Sanaa Markets',
    category: 'retail',
    image: ASSETS.retailStand,
    descriptionAr: 'تصميم تغليف عصري فاخر يلفت أنظار الزبائن ويزيد مبيعات نقاط التجزئة.',
  },
  {
    id: 'gal-4',
    titleAr: 'طقم الهدايا والبراندينج الحصري',
    titleEn: 'Exclusive Merchandising & Branding Kit',
    category: 'merch',
    image: ASSETS.merchKit,
    descriptionAr: 'ملحقات ومقتنيات فاخرة بشعار الذهب الأسود لشركائنا وعملائنا المميزين.',
  }
];
