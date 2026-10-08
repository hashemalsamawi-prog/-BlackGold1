// server.ts
import express from "express";
import path2 from "path";
import fs2 from "fs";
import crypto2 from "crypto";
import { GoogleGenAI } from "@google/genai";

// server/d1.ts
import fs from "fs";
import path from "path";

// src/assets/images.ts
var ASSETS = {
  logo: "/images/black_gold_logo_transparent.svg",
  logoRaster: "/images/black_gold_logo_1786125297515.jpg",
  pouchPair: "/images/black_gold_pouch_pair_1786125935649.jpg",
  shishaSession: "/images/black_gold_shisha_session_1786125947470.jpg",
  retailStand: "/images/black_gold_retail_stand_1786125959576.jpg",
  deliveryFleet: "/images/black_gold_delivery_fleet_1786125973582.jpg",
  merchKit: "/images/black_gold_merch_kit_1786125990648.jpg",
  heroBanner: "/images/charcoal_hero_banner_1786118670743.jpg",
  localPack: "/images/local_charcoal_pack_1786118685561.jpg",
  premiumPack: "/images/premium_charcoal_pack_1786118701517.jpg"
};

// src/data/mockData.ts
var SANAA_DISTRICTS = [
  { id: "\u062D\u062F\u0629", nameAr: "\u062D\u062F\u0629", nameEn: "Haddah", fee: 800, coords: { lat: 15.3195, lng: 44.1843 } },
  { id: "\u0627\u0644\u0633\u0628\u0639\u064A\u0646", nameAr: "\u0627\u0644\u0633\u0628\u0639\u064A\u0646", nameEn: "Al Sabeen", fee: 800, coords: { lat: 15.3289, lng: 44.2045 } },
  { id: "\u0627\u0644\u0623\u0635\u0628\u062D\u064A", nameAr: "\u0627\u0644\u0623\u0635\u0628\u062D\u064A", nameEn: "Al Asbahi", fee: 1e3, coords: { lat: 15.3054, lng: 44.2154 } },
  { id: "\u0634\u0645\u064A\u0644\u0629", nameAr: "\u0634\u0645\u064A\u0644\u0629", nameEn: "Shumaylah", fee: 1e3, coords: { lat: 15.3184, lng: 44.2254 } },
  { id: "\u0628\u064A\u062A \u0628\u0648\u0633", nameAr: "\u0628\u064A\u062A \u0628\u0648\u0633", nameEn: "Bayt Baws", fee: 1200, coords: { lat: 15.2894, lng: 44.2012 } },
  { id: "\u0627\u0644\u0635\u0627\u0641\u064A\u0629", nameAr: "\u0627\u0644\u0635\u0627\u0641\u064A\u0629", nameEn: "Al Safiyah", fee: 800, coords: { lat: 15.3394, lng: 44.2145 } },
  { id: "\u0627\u0644\u062A\u062D\u0631\u064A\u0631", nameAr: "\u0627\u0644\u062A\u062D\u0631\u064A\u0631", nameEn: "Al Tahrir", fee: 800, coords: { lat: 15.3562, lng: 44.2041 } },
  { id: "\u0634\u0639\u0648\u0628", nameAr: "\u0634\u0639\u0648\u0628", nameEn: "Shuub", fee: 1e3, coords: { lat: 15.3721, lng: 44.2241 } },
  { id: "\u0645\u0630\u0628\u062D", nameAr: "\u0645\u0630\u0628\u062D", nameEn: "Mathbah", fee: 1e3, coords: { lat: 15.3712, lng: 44.1754 } },
  { id: "\u0627\u0644\u062D\u0635\u0628\u0629", nameAr: "\u0627\u0644\u062D\u0635\u0628\u0629", nameEn: "Al Hasaba", fee: 1e3, coords: { lat: 15.3854, lng: 44.2014 } },
  { id: "\u0634\u064A\u0631\u0627\u062A\u0648\u0646", nameAr: "\u0634\u064A\u0631\u0627\u062A\u0648\u0646 / \u0646\u0642\u0645", nameEn: "Sheraton", fee: 1e3, coords: { lat: 15.3612, lng: 44.2384 } },
  { id: "\u0627\u0644\u0631\u0648\u0636\u0629", nameAr: "\u0627\u0644\u0631\u0648\u0636\u0629", nameEn: "Al Rawdah", fee: 1200, coords: { lat: 15.4214, lng: 44.2154 } },
  { id: "\u0628\u0646\u064A \u0627\u0644\u062D\u0627\u0631\u062B", nameAr: "\u0628\u0646\u064A \u0627\u0644\u062D\u0627\u0631\u062B", nameEn: "Bani Al Harith", fee: 1500, coords: { lat: 15.4454, lng: 44.2284 } },
  { id: "\u062F\u0627\u0631 \u0633\u0644\u0645", nameAr: "\u062F\u0627\u0631 \u0633\u0644\u0645", nameEn: "Dar Silm", fee: 1200, coords: { lat: 15.2812, lng: 44.2412 } },
  { id: "\u0639\u0635\u0631", nameAr: "\u0639\u0635\u0631", nameEn: "Assr", fee: 800, coords: { lat: 15.3341, lng: 44.1684 } },
  { id: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u062C\u0646\u0648\u0628\u064A", nameAr: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u062C\u0646\u0648\u0628\u064A", nameEn: "South Sixtieth", fee: 800, coords: { lat: 15.3154, lng: 44.1954 } },
  { id: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u063A\u0631\u0628\u064A", nameAr: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u063A\u0631\u0628\u064A", nameEn: "West Sixtieth", fee: 800, coords: { lat: 15.3512, lng: 44.1784 } },
  { id: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u0634\u0645\u0627\u0644\u064A", nameAr: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u0634\u0645\u0627\u0644\u064A", nameEn: "North Sixtieth", fee: 1e3, coords: { lat: 15.3912, lng: 44.1854 } },
  { id: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u0634\u0631\u0642\u064A", nameAr: "\u0627\u0644\u0633\u062A\u064A\u0646 \u0627\u0644\u0634\u0631\u0642\u064A", nameEn: "East Sixtieth", fee: 1e3, coords: { lat: 15.3454, lng: 44.2354 } }
];
var INITIAL_PRODUCTS = [
  {
    id: "bg-prem-250g",
    nameAr: "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 (250g + 10g \u0645\u062C\u0627\u0646\u0627\u064B)",
    nameEn: "Black Gold Premium Charcoal (250g + 10g Free)",
    descriptionAr: "\u0641\u062D\u0645 \u0637\u0628\u064A\u0639\u064A \u0645\u0636\u063A\u0648\u0637 \u0639\u0627\u0644\u064A \u0627\u0644\u0646\u0642\u0627\u0648\u0629\u060C \u0628\u062F\u0648\u0646 \u062F\u062E\u0627\u0646 \u0623\u0648 \u0631\u0627\u0626\u062D\u0629 \u0623\u0648 \u0634\u0631\u0627\u0631. \u064A\u062F\u0648\u0645 \u062D\u062A\u0649 3 \u0633\u0627\u0639\u0627\u062A \u0627\u0634\u062A\u0639\u0627\u0644 \u0645\u062A\u0648\u0627\u0635\u0644 \u0648\u064A\u0648\u0641\u0631 \u062D\u0631\u0627\u0631\u0629 \u0645\u062A\u062C\u0627\u0646\u0633\u0629 \u0644\u0644\u0634\u064A\u0634\u0629 \u0648\u0627\u0644\u0634\u0648\u0627\u0621 \u0627\u0644\u0631\u0627\u0642\u064A.",
    descriptionEn: "High purity natural compressed charcoal. Smokeless, spark-free, odorless. Lasts up to 3 continuous hours with optimal heat.",
    category: "premium",
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
    sparkLevel: "0% \u0645\u0639\u062F\u0648\u0645 \u062A\u0645\u0627\u0645\u0627\u064B",
    smokeLevel: "0% \u0628\u062F\u0648\u0646 \u0623\u064A \u062F\u062E\u0627\u0646",
    ashContent: "< 2% \u0631\u0645\u0627\u062F \u0623\u0628\u064A\u0636 \u0646\u0627\u0635\u0639",
    carbonLevel: "> 88% \u0643\u0631\u0628\u0648\u0646 \u0646\u0642\u064A",
    heatOutput: "\u062D\u0631\u0627\u0631\u0629 \u0645\u062A\u0648\u0627\u0632\u0646\u0629 \u0641\u0627\u0626\u0642\u0629 650\xB0C",
    featuresAr: [
      "\u0645\u063A\u0644\u0641 \u0628\u0623\u0643\u064A\u0627\u0633 \u0623\u0644\u0645\u0646\u064A\u0648\u0645 \u062D\u0627\u0641\u0638\u0629 \u0644\u0644\u0631\u0637\u0648\u0628\u0629",
      "\u0627\u0634\u062A\u0639\u0627\u0644 \u0630\u0627\u062A\u064A \u0633\u0631\u064A\u0639 \u0648\u0645\u062A\u062C\u0627\u0646\u0633",
      "\u0635\u062F\u064A\u0642 \u0644\u0644\u0628\u064A\u0626\u0629 \u0628\u062F\u0648\u0646 \u0625\u0636\u0627\u0641\u0627\u062A \u0643\u064A\u0645\u064A\u0627\u0626\u064A\u0629",
      "\u0648\u0632\u0646 250 \u062C\u0631\u0627\u0645 + 10 \u062C\u0631\u0627\u0645 \u0647\u062F\u064A\u0629 \u0645\u062C\u0627\u0646\u064A\u0629"
    ],
    featuresEn: [
      "Moisture-lock aluminum sealed packaging",
      "Quick and uniform ignition",
      "100% natural organic eco-friendly",
      "250g + 10g bonus included"
    ],
    reviewsCount: 142,
    rating: 4.9
  },
  {
    id: "bg-prem-500g",
    nameAr: "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 (500g + 10g \u0645\u062C\u0627\u0646\u0627\u064B)",
    nameEn: "Black Gold Premium Charcoal (500g + 10g Free)",
    descriptionAr: "\u0627\u0644\u0639\u0628\u0648\u0629 \u0627\u0644\u0639\u0627\u0626\u0644\u064A\u0629 \u0627\u0644\u0645\u0644\u0643\u064A\u0629 \u0645\u0646 \u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F. \u0645\u0643\u0639\u0628\u0627\u062A \u0645\u062A\u0646\u0627\u0633\u0642\u0629 \u062A\u062F\u0648\u0645 \u0644\u0623\u0637\u0648\u0644 \u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u0631\u062E\u0627\u0621 \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0628\u062F\u0648\u0646 \u0627\u0646\u0628\u0639\u0627\u062B\u0627\u062A \u0623\u0648 \u0631\u0648\u0627\u0626\u062D.",
    descriptionEn: "Royal family package of Black Gold charcoal. Perfectly uniform cubes for long sessions without emissions.",
    category: "premium",
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
    sparkLevel: "0% \u0645\u0639\u062F\u0648\u0645",
    smokeLevel: "0% \u0645\u0646\u0639\u062F\u0645 \u0627\u0644\u062F\u062E\u0627\u0646",
    ashContent: "< 1.8% \u0631\u0645\u0627\u062F \u0641\u0636\u064A \u0631\u0642\u064A\u0642",
    carbonLevel: "> 90% \u0643\u0631\u0628\u0648\u0646 \u0639\u0627\u0644\u064A \u0627\u0644\u0643\u062B\u0627\u0641\u0629",
    heatOutput: "\u062D\u0631\u0627\u0631\u0629 \u0645\u0633\u062A\u0642\u0631\u0629 700\xB0C",
    featuresAr: [
      "\u0639\u0628\u0648\u0629 \u062A\u0648\u0641\u064A\u0631\u064A\u0629 \u0644\u0644\u0645\u062C\u0627\u0644\u0633 \u0648\u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A",
      "\u0631\u0645\u0627\u062F \u0646\u0627\u0635\u0639 \u0642\u0644\u064A\u0644 \u062C\u062F\u0627\u064B \u0644\u0627 \u064A\u062A\u0637\u0627\u064A\u0631",
      "\u064A\u062F\u0648\u0645 \u0644\u0623\u0643\u062B\u0631 \u0645\u0646 3 \u0633\u0627\u0639\u0627\u062A",
      "\u0635\u0645\u0627\u0645 \u063A\u0644\u0642 \u0645\u062D\u0643\u0645 Ziplock \u0644\u062D\u0641\u0638 \u0627\u0644\u062C\u0641\u0627\u0641"
    ],
    featuresEn: [
      "Value pack for gatherings & lounges",
      "Ultra low ash residue",
      "Burn time exceeds 3 hours",
      "Airtight Ziplock closure"
    ],
    reviewsCount: 98,
    rating: 5
  },
  {
    id: "bg-local-250g",
    nameAr: "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0628\u0644\u062F\u064A \u0627\u0644\u0623\u0635\u064A\u0644 (250g + 10g \u0645\u062C\u0627\u0646\u0627\u064B)",
    nameEn: "Black Gold Authentic Local Charcoal (250g + 10g Free)",
    descriptionAr: "\u0645\u0633\u062A\u062E\u0644\u0635 \u0645\u0646 \u0623\u062C\u0648\u062F \u0623\u0646\u0648\u0627\u0639 \u0623\u062E\u0634\u0627\u0628 \u0627\u0644\u0633\u062F\u0631 \u0648\u0627\u0644\u0637\u0644\u062D \u0627\u0644\u0637\u0628\u064A\u0639\u064A\u0629 \u0627\u0644\u0645\u0639\u062A\u0642\u0629. \u0646\u0643\u0647\u0629 \u0623\u0635\u064A\u0644\u0629 \u0648\u0631\u0627\u0626\u062D\u0629 \u0634\u0648\u0627\u0621 \u0643\u0644\u0627\u0633\u064A\u0643\u064A\u0629 \u0645\u0645\u064A\u0632\u0629.",
    descriptionEn: "Selected from the finest natural Sidr and acacia woods. Authentic flavor and classic grilling aroma.",
    category: "local",
    price: 1e3,
    originalPrice: 1300,
    weightGrams: 250,
    bonusGrams: 10,
    inStock: true,
    stockCount: 450,
    image: ASSETS.localPack,
    isPopular: false,
    isNew: true,
    burnTimeMinutes: 150,
    sparkLevel: "< 1% \u062E\u0641\u064A\u0641 \u062C\u062F\u0627\u064B",
    smokeLevel: "\u062F\u062E\u0627\u0646 \u0639\u0637\u0631\u064A \u0637\u0628\u064A\u0639\u064A \u062E\u0641\u064A\u0641",
    ashContent: "< 3% \u0631\u0645\u0627\u062F \u0637\u0628\u064A\u0639\u064A",
    carbonLevel: "> 82% \u0643\u0631\u0628\u0648\u0646 \u0637\u0628\u064A\u0639\u064A",
    heatOutput: "\u062D\u0631\u0627\u0631\u0629 \u062D\u0637\u0628 \u0637\u0628\u064A\u0639\u064A\u0629 \u0645\u0631\u0643\u0632\u0629",
    featuresAr: [
      "\u0637\u0628\u064A\u0639\u064A 100% \u0645\u0646 \u0623\u0634\u062C\u0627\u0631 \u0627\u0644\u0633\u062F\u0631 \u0627\u0644\u0645\u0639\u062A\u0642\u0629",
      "\u0645\u062B\u0627\u0644\u064A \u0644\u0644\u0645\u0634\u0627\u0648\u064A \u0648\u0627\u0644\u0637\u0647\u064A \u0627\u0644\u062A\u0642\u0644\u064A\u062F\u064A",
      "\u062A\u0639\u0628\u0626\u0629 \u064A\u062F\u0648\u064A\u0629 \u0645\u0646\u062A\u0642\u0627\u0629 \u0628\u0639\u0646\u0627\u064A\u0629",
      "250g + 10g \u0645\u062C\u0627\u0646\u0627\u064B"
    ],
    featuresEn: [
      "100% natural Sidr wood harvest",
      "Ideal for traditional barbecue grilling",
      "Hand-selected quality chunks",
      "250g + 10g free bonus"
    ],
    reviewsCount: 64,
    rating: 4.8
  },
  {
    id: "bg-b2b-carton",
    nameAr: "\u0643\u0631\u062A\u0648\u0646 \u0627\u0644\u062C\u0645\u0644\u0629 \u0648\u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0627\u0644\u062A\u062C\u0627\u0631\u064A (24 \u0639\u0628\u0648\u0629 \xD7 250g)",
    nameEn: "Wholesale Commercial Carton (24 Packs \xD7 250g)",
    descriptionAr: "\u0645\u062E\u0635\u0635 \u0644\u0644\u0645\u0642\u0627\u0647\u064A \u0648\u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u062A\u062C\u0627\u0631 \u0627\u0644\u062A\u062C\u0632\u0626\u0629 \u0641\u064A \u0635\u0646\u0639\u0627\u0621. \u062A\u0648\u0631\u064A\u062F \u064A\u0648\u0645\u064A \u0645\u0628\u0627\u0634\u0631 \u0645\u0639 \u062A\u0633\u0647\u064A\u0644\u0627\u062A \u062F\u0641\u0639 \u0648\u0636\u0645\u0627\u0646 \u0627\u0633\u062A\u0628\u062F\u0627\u0644 \u0641\u0648\u0631\u064A.",
    descriptionEn: "Dedicated for cafes, lounges, restaurants, and retail stores in Sanaa. Direct delivery with trade discounts.",
    category: "b2b",
    price: 24e3,
    originalPrice: 28800,
    weightGrams: 6e3,
    bonusGrams: 240,
    inStock: true,
    stockCount: 120,
    image: ASSETS.retailStand,
    isPopular: true,
    isNew: false,
    burnTimeMinutes: 180,
    sparkLevel: "0% \u062E\u0627\u0644\u064A \u0645\u0646 \u0627\u0644\u0634\u0631\u0627\u0631",
    smokeLevel: "0% \u062E\u0627\u0644\u064A \u0645\u0646 \u0627\u0644\u062F\u062E\u0627\u0646",
    ashContent: "< 2%",
    carbonLevel: "> 88%",
    heatOutput: "\u0623\u062F\u0627\u0621 \u0627\u062D\u062A\u0631\u0627\u0641\u064A \u0645\u0639\u062A\u0645\u062F",
    featuresAr: [
      "\u0633\u0639\u0631 \u062C\u0645\u0644\u0629 \u062E\u0627\u0635 \u0628\u0647\u0627\u0645\u0634 \u0631\u0628\u062D \u0645\u062C\u0632\u064A",
      "\u0633\u062A\u0627\u0646\u062F \u0639\u0631\u0636 \u062A\u062C\u0627\u0631\u064A \u0645\u062C\u0627\u0646\u064A \u0645\u0639 \u0623\u0648\u0644 \u0637\u0644\u0628",
      "\u062A\u0648\u0635\u064A\u0644 \u0645\u062C\u0627\u0646\u064A \u0641\u0648\u0631\u064A \u0625\u0644\u0649 \u0645\u0648\u0642\u0639 \u0627\u0644\u0645\u0646\u0634\u0623\u0629",
      "\u0641\u0648\u0627\u062A\u064A\u0631 \u0636\u0631\u064A\u0628\u064A\u0629 \u0648\u0633\u0646\u062F\u0627\u062A \u0627\u0633\u062A\u0644\u0627\u0645 \u0631\u0633\u0645\u064A\u0629"
    ],
    featuresEn: [
      "Special B2B wholesale pricing",
      "Free retail display stand included",
      "Free express direct delivery",
      "Commercial tax invoices provided"
    ],
    reviewsCount: 37,
    rating: 4.9
  }
];
var INITIAL_DELIVERY_AGENTS = [
  {
    id: "drv-1",
    name: "\u0623\u062D\u0645\u062F \u0627\u0644\u0643\u0628\u0633\u064A",
    phone: "771234567",
    vehicleType: "motorcycle",
    assignedDistricts: ["\u062D\u062F\u0629", "\u0627\u0644\u0633\u0628\u0639\u064A\u0646", "\u0627\u0644\u0623\u0635\u0628\u062D\u064A", "\u0628\u064A\u062A \u0628\u0648\u0633"],
    isActive: true,
    currentLatitude: 15.328,
    currentLongitude: 44.185,
    completedOrdersCount: 428,
    rating: 4.9
  },
  {
    id: "drv-2",
    name: "\u064A\u0627\u0633\u0631 \u0627\u0644\u0631\u062F\u0645\u0627\u0646\u064A",
    phone: "775678912",
    vehicleType: "motorcycle",
    assignedDistricts: ["\u0627\u0644\u062A\u062D\u0631\u064A\u0631", "\u0627\u0644\u0635\u0627\u0641\u064A\u0629", "\u0634\u0639\u0648\u0628", "\u0627\u0644\u062D\u0635\u0628\u0629"],
    isActive: true,
    currentLatitude: 15.352,
    currentLongitude: 44.209,
    completedOrdersCount: 312,
    rating: 4.8
  },
  {
    id: "drv-3",
    name: "\u0645\u062D\u0645\u062F \u0627\u0644\u0634\u0627\u0645\u064A (\u0641\u0627\u0646 \u0627\u0644\u062A\u0648\u0631\u064A\u062F B2B)",
    phone: "773456789",
    vehicleType: "van",
    assignedDistricts: ["\u062C\u0645\u064A\u0639 \u0645\u0646\u0627\u0637\u0642 \u0623\u0645\u0627\u0646\u0629 \u0627\u0644\u0639\u0627\u0635\u0645\u0629"],
    isActive: true,
    currentLatitude: 15.34,
    currentLongitude: 44.195,
    completedOrdersCount: 560,
    rating: 5
  }
];
var INITIAL_CAMPAIGNS = [
  {
    id: "camp-1",
    titleAr: "\u0639\u0631\u0636 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0645\u0644\u0643\u064A: +10 \u062C\u0631\u0627\u0645 \u0645\u062C\u0627\u0646\u0627\u064B \u0639\u0644\u0649 \u0643\u0644 \u0639\u0628\u0648\u0629",
    titleEn: "Royal Bonus Deal: +10g Extra Free in Every Pouch",
    descriptionAr: "\u0627\u062D\u0635\u0644 \u0639\u0644\u0649 10 \u062C\u0631\u0627\u0645 \u0641\u062D\u0645 \u0625\u0636\u0627\u0641\u064A \u0645\u062C\u0627\u0646\u064A \u0645\u062F\u0645\u062C \u0641\u064A \u0643\u0644 \u0643\u064A\u0633 \u0645\u0646 \u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 \u0648\u0627\u0644\u0628\u0644\u062F\u064A \u0644\u0641\u062A\u0631\u0629 \u0645\u062D\u062F\u0648\u062F\u0629!",
    descriptionEn: "Enjoy 10 extra bonus grams sealed inside each pouch of Black Gold charcoal for a limited time!",
    discountPercentage: 15,
    bannerImage: ASSETS.heroBanner,
    isActive: true,
    validUntil: "2026-12-31",
    code: "ROYAL10"
  }
];
var INITIAL_STORE_SETTINGS = {
  storeNameAr: "\u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F | Black Gold",
  storeNameEn: "Black Gold Charcoal Store",
  supportPhone: "777000111",
  whatsappNumber: "967777000111",
  supportEmail: "contact@blackgold-charcoal.com",
  minOrderAmount: 1e3,
  freeShippingThreshold: 5e3,
  defaultShippingFee: 1e3,
  workingHoursAr: "\u064A\u0648\u0645\u064A\u0627\u064B \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 24 \u0633\u0627\u0639\u0629 - \u062A\u0648\u0635\u064A\u0644 \u0641\u0648\u0631\u064A \u0641\u064A \u0635\u0646\u0639\u0627\u0621",
  workingHoursEn: "24/7 Daily - Instant Delivery across Sanaa",
  announcementAr: "\u{1F525} \u062A\u0648\u0635\u064A\u0644 \u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0633\u0631\u064A\u0639 \u0641\u064A \u0635\u0646\u0639\u0627\u0621 \u062E\u0644\u0627\u0644 30 \u062F\u0642\u064A\u0642\u0629 | \u0639\u0631\u0636 +10 \u062C\u0631\u0627\u0645 \u0645\u062C\u0627\u0646\u0627\u064B \u0633\u0627\u0631\u064A \u0627\u0644\u0622\u0646!",
  announcementEn: "\u{1F525} Fast Charcoal Delivery in Sanaa within 30 mins | Extra +10g bonus active now!",
  isOrderingEnabled: true,
  currencySymbol: "\u0631\u064A\u0627\u0644",
  loyaltyPointsPer1000YER: 10,
  customLogoUrl: ASSETS.logo,
  heroBannerImage: ASSETS.pouchPair,
  heroBannerTitle: "\u0639\u0631\u0636 \u062E\u0627\u0635 \u0645\u062D\u062F\u0648\u062F",
  heroBannerSubtitle: "\u0639\u0628\u0648\u0629 250g + 10g \u0647\u062F\u064A\u0629 \u0625\u0636\u0627\u0641\u064A\u0629",
  heroBannerPrice: 1200,
  heroBannerOldPrice: 1500,
  enableAnimations: true,
  logoAnimation: "glow",
  bannerAnimation: "float",
  districts: SANAA_DISTRICTS.map((d) => ({
    id: d.id,
    nameAr: d.nameAr,
    district: d.nameAr,
    deliveryFee: d.fee,
    estimatedMinutes: 25,
    isAvailable: true
  }))
};
var INITIAL_GALLERY_ITEMS = [
  {
    id: "gal-1",
    titleAr: "\u0623\u0633\u0637\u0648\u0644 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0641\u0648\u0631\u064A \u0627\u0644\u0633\u0631\u064A\u0639",
    titleEn: "Express Direct Delivery Fleet",
    category: "fleet",
    image: ASSETS.deliveryFleet,
    descriptionAr: "\u0645\u0646\u0627\u062F\u064A\u0628 \u062A\u0648\u0635\u064A\u0644 \u0645\u062C\u0647\u0632\u0648\u0646 \u0628\u0623\u062D\u062F\u062B \u0627\u0644\u062D\u0642\u0627\u0626\u0628 \u0627\u0644\u062D\u0631\u0627\u0631\u064A\u0629 \u0644\u0636\u0645\u0627\u0646 \u0648\u0635\u0648\u0644 \u0627\u0644\u0641\u062D\u0645 \u062C\u0627\u0641\u0627\u064B \u0648\u0646\u0642\u064A\u0627\u064B \u0641\u0648\u0631 \u0637\u0644\u0628\u0643."
  },
  {
    id: "gal-2",
    titleAr: "\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0634\u064A\u0634\u0629 \u0648\u0627\u0644\u0631\u0648\u0642\u0627\u0646 \u0627\u0644\u0645\u0644\u0643\u064A",
    titleEn: "Royal Shisha & Lounge Sessions",
    category: "sessions",
    image: ASSETS.shishaSession,
    descriptionAr: "\u0641\u062D\u0645 \u0639\u062F\u064A\u0645 \u0627\u0644\u0631\u0627\u0626\u062D\u0629 \u0648\u0627\u0644\u0634\u0631\u0627\u0631 \u0644\u062D\u0645\u0627\u064A\u0629 \u0646\u0643\u0647\u0629 \u0627\u0644\u0645\u0639\u0633\u0644 \u0648\u0627\u0644\u062A\u0645\u062A\u0639 \u0628\u062C\u0644\u0633\u0629 \u0646\u0642\u064A\u0629 \u062A\u062F\u0648\u0645 \u0644\u0633\u0627\u0639\u0627\u062A."
  },
  {
    id: "gal-3",
    titleAr: "\u0627\u0633\u062A\u0627\u0646\u062F\u0627\u062A \u0627\u0644\u0639\u0631\u0636 \u0641\u064A \u0627\u0644\u0645\u062D\u0644\u0627\u062A \u0648\u0645\u0631\u0627\u0643\u0632 \u0627\u0644\u062A\u0633\u0648\u0642",
    titleEn: "Retail Display Stands in Sanaa Markets",
    category: "retail",
    image: ASSETS.retailStand,
    descriptionAr: "\u062A\u0635\u0645\u064A\u0645 \u062A\u063A\u0644\u064A\u0641 \u0639\u0635\u0631\u064A \u0641\u0627\u062E\u0631 \u064A\u0644\u0641\u062A \u0623\u0646\u0638\u0627\u0631 \u0627\u0644\u0632\u0628\u0627\u0626\u0646 \u0648\u064A\u0632\u064A\u062F \u0645\u0628\u064A\u0639\u0627\u062A \u0646\u0642\u0627\u0637 \u0627\u0644\u062A\u062C\u0632\u0626\u0629."
  },
  {
    id: "gal-4",
    titleAr: "\u0637\u0642\u0645 \u0627\u0644\u0647\u062F\u0627\u064A\u0627 \u0648\u0627\u0644\u0628\u0631\u0627\u0646\u062F\u064A\u0646\u062C \u0627\u0644\u062D\u0635\u0631\u064A",
    titleEn: "Exclusive Merchandising & Branding Kit",
    category: "merch",
    image: ASSETS.merchKit,
    descriptionAr: "\u0645\u0644\u062D\u0642\u0627\u062A \u0648\u0645\u0642\u062A\u0646\u064A\u0627\u062A \u0641\u0627\u062E\u0631\u0629 \u0628\u0634\u0639\u0627\u0631 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0644\u0634\u0631\u0643\u0627\u0626\u0646\u0627 \u0648\u0639\u0645\u0644\u0627\u0626\u0646\u0627 \u0627\u0644\u0645\u0645\u064A\u0632\u064A\u0646."
  }
];

// server/security.ts
import crypto from "crypto";
var devEphemeralSecret = null;
function getJwtSecret() {
  const envSecret = process.env.JWT_SECRET;
  if (!envSecret) {
    if (!devEphemeralSecret) {
      const seed = process.env.CLOUDFLARE_DATABASE_ID || process.env.VERCEL_GIT_COMMIT_SHA || "bg-royal-charcoal-jwt-secret-seed-2026";
      devEphemeralSecret = crypto.createHash("sha256").update(seed).digest("hex");
      console.warn("\u26A0\uFE0F [Security Warning] JWT_SECRET is not set in environment variables. Using derived session key.");
    }
    return devEphemeralSecret;
  }
  return envSecret;
}
function hashSecret(secret) {
  if (!secret) return "";
  const key = getJwtSecret();
  return crypto.createHmac("sha256", key).update(secret).digest("hex");
}
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
function normalizeDigits(input = "") {
  if (typeof input !== "string") return "";
  return input.replace(/[٠-٩]/g, (d) => "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(d).toString()).replace(/[۰-۹]/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9".indexOf(d).toString()).trim();
}
function validateYemeniPhone(rawPhone) {
  const digits = normalizeDigits(rawPhone).replace(/\D/g, "");
  let clean = digits;
  if (clean.startsWith("967") && clean.length >= 12) {
    clean = clean.slice(3);
  }
  if (clean.startsWith("0") && clean.length === 10) {
    clean = clean.slice(1);
  }
  const isValid = /^(77|78|73|71|70|01|02)[0-9]{7}$/.test(clean);
  return { isValid, normalized: clean };
}
function generateToken(payload) {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1e3;
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = getJwtSecret();
    const expectedSig = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    if (!timingSafeEqual(signature, expectedSig)) return null;
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (decoded.exp && decoded.exp < Date.now()) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
function sanitizeInputString(input = "", maxLength = 255) {
  if (typeof input !== "string") return "";
  return input.replace(/[<>]/g, "").replace(/[\x00-\x1F\x7F]/g, "").trim().slice(0, maxLength);
}
function createRateLimiter(options) {
  const ipRequests = /* @__PURE__ */ new Map();
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of ipRequests.entries()) {
      if (now > entry.resetTime) {
        ipRequests.delete(ip);
      }
    }
  }, 6e4);
  if (timer.unref) timer.unref();
  return (req, res, next) => {
    const isNonProduction = process.env.NODE_ENV !== "production";
    if (isNonProduction && req.headers["x-audit-test"] === "local-audit") {
      return next();
    }
    let ip = "127.0.0.1";
    try {
      const forwarded = req.headers["x-forwarded-for"];
      const realIp = req.headers["x-real-ip"];
      if (typeof forwarded === "string" && forwarded.length > 0) {
        ip = forwarded.split(",")[0].trim();
      } else if (typeof realIp === "string" && realIp.length > 0) {
        ip = realIp.trim();
      } else if (req.socket && req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
      }
    } catch {
      ip = "127.0.0.1";
    }
    const now = Date.now();
    const record = ipRequests.get(ip);
    if (!record || now > record.resetTime) {
      ipRequests.set(ip, { count: 1, resetTime: now + options.windowMs });
      return next();
    }
    if (record.count >= options.maxRequests) {
      return res.status(429).json({
        success: false,
        message: options.message || "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0639\u062F\u062F \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0627\u062A \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B \u062B\u0645 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629."
      });
    }
    record.count += 1;
    return next();
  };
}

// server/d1.ts
var CLOUDFLARE_CONFIG = {
  databaseId: process.env.CLOUDFLARE_DATABASE_ID || "",
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
  apiToken: process.env.CLOUDFLARE_API_TOKEN || ""
};
var VALID_ORDER_STATUS_TRANSITIONS = {
  pending: ["confirmed", "assigned", "received", "preparing", "shipped", "cancelled"],
  received: ["confirmed", "assigned", "preparing", "shipped", "cancelled"],
  confirmed: ["assigned", "preparing", "shipped", "delivering", "cancelled"],
  assigned: ["preparing", "shipped", "delivering", "on_way", "delivered", "cancelled"],
  preparing: ["assigned", "shipped", "delivering", "on_way", "delivered", "cancelled"],
  shipped: ["delivering", "on_way", "delivered", "cancelled"],
  delivering: ["delivered", "cancelled"],
  on_way: ["delivering", "delivered", "cancelled"],
  delivered: ["completed"],
  completed: [],
  cancelled: []
};
var D1DatabaseAccessLayer = class {
  localDbPath = path.join(process.cwd(), "data", "db.json");
  isInitialized = false;
  // In-memory relational tables matching D1 Schema
  // In production or when Cloudflare D1 credentials exist, start with clean empty tables to prevent mock data leakage
  tables = {
    categories: [],
    products: Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === "production" ? [] : [...INITIAL_PRODUCTS],
    users: [],
    customers: [],
    orders: [],
    order_items: [],
    inventory: /* @__PURE__ */ new Map(),
    inventory_logs: [],
    delivery_agents: Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === "production" ? [] : [...INITIAL_DELIVERY_AGENTS],
    reviews: [],
    coupons: Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === "production" ? [] : [
      { code: "GOLD2026", discountPercent: 10, maxDiscount: 2e3, minOrderAmount: 2e3, isActive: true },
      { code: "SANAA15", discountPercent: 15, maxDiscount: 3500, minOrderAmount: 5e3, isActive: true },
      { code: "VIPBLACK", discountPercent: 20, maxDiscount: 5e3, minOrderAmount: 1e4, isActive: true }
    ],
    gallery_items: Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === "production" ? [] : [...INITIAL_GALLERY_ITEMS],
    store_settings: Boolean(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId) || process.env.NODE_ENV === "production" ? {
      storeNameAr: "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0645\u0644\u0643\u064A",
      storeNameEn: "BLACK GOLD ROYAL CHARCOAL",
      whatsappPhone: "967775000150",
      supportPhone: "967775000150",
      workingHoursAr: "\u064A\u0648\u0645\u064A\u0627\u064B: 8:00 \u0635 - 11:30 \u0645",
      workingHoursEn: "Daily: 8:00 AM - 11:30 PM",
      freeDeliveryThreshold: 8e3,
      freeShippingThreshold: 8e3,
      defaultShippingFee: 800,
      isOrderingEnabled: true,
      deliveryDistricts: []
    } : {
      ...INITIAL_STORE_SETTINGS,
      deliveryDistricts: [
        { id: "d1", nameAr: "\u062D\u062F\u0629 \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u062E\u0645\u0633\u064A\u0646 \u0648\u0627\u0644\u062D\u064A \u0627\u0644\u0633\u064A\u0627\u0633\u064A", nameEn: "Hadda & Political Area", fee: 500, etaMinutes: 35, isActive: true },
        { id: "d2", nameAr: "\u0627\u0644\u0623\u0635\u0628\u062D\u064A \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0642\u0627\u0644\u062D \u0648\u0628\u064A\u062A \u0628\u0648\u0633", nameEn: "Asbahi & Bait Baws", fee: 500, etaMinutes: 40, isActive: true },
        { id: "d3", nameAr: "\u0627\u0644\u062A\u062D\u0631\u064A\u0631 \u0648\u0634\u0627\u0631\u0639 \u062C\u0645\u0627\u0644 \u0648\u0627\u0644\u0642\u0627\u0639", nameEn: "Tahrir & Al-Qaa", fee: 600, etaMinutes: 40, isActive: true },
        { id: "d4", nameAr: "\u0635\u0646\u0639\u0627\u0621 \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0648\u0628\u0627\u0628 \u0627\u0644\u064A\u0645\u0646 \u0648\u0634\u0639\u0648\u0628", nameEn: "Old Sanaa & Bab Al-Yaman", fee: 700, etaMinutes: 45, isActive: true },
        { id: "d5", nameAr: "\u0634\u0645\u0644\u0627\u0646 \u0648\u0645\u0630\u0628\u062D \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u062B\u0644\u0627\u062B\u064A\u0646", nameEn: "Shamlan & Madhbah", fee: 800, etaMinutes: 45, isActive: true },
        { id: "d6", nameAr: "\u0627\u0644\u062D\u0635\u0628\u0629 \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0637\u0627\u0631 \u0648\u0627\u0644\u0631\u0648\u0636\u0629", nameEn: "Hasaba & Airport Rd", fee: 900, etaMinutes: 50, isActive: true }
      ]
    },
    payments: [],
    notifications: []
  };
  initPromise = null;
  constructor() {
    this.init().catch((err) => {
      console.warn("\u26A0\uFE0F [D1] Initial background sync deferred/error:", err?.message || err);
    });
  }
  /**
   * Initialize Schema, migrate legacy data, and sync with Cloudflare D1
   */
  async init() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const dataDir = path.dirname(this.localDbPath);
        try {
          if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
          }
        } catch {
        }
        const hasD1Credentials = Boolean(
          CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId
        );
        if (process.env.NODE_ENV !== "production" && !hasD1Credentials) {
          this.tables.categories = [
            { id: "cat-pouches", name_ar: "\u0627\u0644\u0639\u0628\u0648\u0627\u062A \u0627\u0644\u0641\u0627\u062E\u0631\u0629 Zipper Lock", name_en: "Premium Pouches", slug: "pouches", sort_order: 1, is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
            { id: "cat-wholesale", name_ar: "\u0627\u0644\u062A\u0648\u0631\u064A\u062F \u0648\u0627\u0644\u062C\u0645\u0644\u0629 \u0644\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0627\u0644\u0645\u0642\u0627\u0647\u064A", name_en: "Wholesale & B2B", slug: "wholesale", sort_order: 2, is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
            { id: "cat-local", name_ar: "\u0641\u062D\u0645 \u0628\u0644\u062F\u064A \u0637\u0628\u064A\u0639\u064A \u0645\u0646 \u0645\u0632\u0627\u0631\u0639 \u0627\u0644\u064A\u0645\u0646", name_en: "Yemeni Local Charcoal", slug: "local", sort_order: 3, is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
            { id: "cat-premium", name_ar: "\u0627\u0644\u0641\u062D\u0645 \u0627\u0644\u0645\u0644\u0643\u064A \u0627\u0644\u062E\u0627\u0635 \u0628\u0627\u0644\u0634\u064A\u0634\u0629", name_en: "Royal Shisha Charcoal", slug: "premium", sort_order: 4, is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
            { id: "cat-bbq", name_ar: "\u0641\u062D\u0645 \u0627\u0644\u0634\u0648\u0627\u0621 \u0648\u0627\u0644\u0645\u0634\u0627\u0648\u064A \u0639\u0627\u0644\u064A \u0627\u0644\u062D\u0631\u0627\u0631\u0629", name_en: "High-Heat BBQ Charcoal", slug: "bbq", sort_order: 5, is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() },
            { id: "cat-incense", name_ar: "\u0623\u0642\u0631\u0627\u0635 \u0627\u0644\u0628\u062E\u0648\u0631 \u0648\u0627\u0644\u0645\u0628\u0627\u062E\u0631 \u0633\u0631\u064A\u0639\u0629 \u0627\u0644\u0627\u0634\u062A\u0639\u0627\u0644", name_en: "Incense Charcoal Tablets", slug: "incense", sort_order: 6, is_active: 1, created_at: (/* @__PURE__ */ new Date()).toISOString() }
          ];
        }
        if (hasD1Credentials) {
          console.log("\u26A1 Cloudflare D1 is active as PRIMARY authoritative database. Fetching remote tables...");
          const syncOk = await this.syncFromCloudflareD1();
          if (!syncOk && process.env.NODE_ENV === "production") {
            console.error("CRITICAL: Cloudflare D1 initial sync failed in production environment!");
            throw new Error("\u0641\u0634\u0644 \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0623\u0648\u0644\u064A\u0629 \u0645\u0639 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
          }
        } else {
          if (process.env.NODE_ENV === "production") {
            console.error("CRITICAL: Cloudflare D1 credentials missing in production environment!");
            throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
          }
          if (fs.existsSync(this.localDbPath)) {
            try {
              const raw = fs.readFileSync(this.localDbPath, "utf-8");
              const parsed = JSON.parse(raw);
              if (parsed.products && Array.isArray(parsed.products)) {
                this.tables.products = parsed.products;
              }
              if (parsed.users && Array.isArray(parsed.users)) {
                this.tables.users = parsed.users;
              }
              if (parsed.orders && Array.isArray(parsed.orders)) {
                this.tables.orders = parsed.orders;
              }
              if (parsed.reviews && Array.isArray(parsed.reviews)) {
                this.tables.reviews = parsed.reviews;
              }
              if (parsed.coupons && Array.isArray(parsed.coupons)) {
                this.tables.coupons = parsed.coupons;
              }
              if (parsed.deliveryAgents && Array.isArray(parsed.deliveryAgents)) {
                this.tables.delivery_agents = parsed.deliveryAgents;
              }
              if (parsed.storeSettings) {
                this.tables.store_settings = parsed.storeSettings;
              }
              if (parsed.galleryItems && Array.isArray(parsed.galleryItems)) {
                this.tables.gallery_items = parsed.galleryItems;
              }
              if (parsed.inventoryTransactions && Array.isArray(parsed.inventoryTransactions)) {
                this.tables.inventory_logs = parsed.inventoryTransactions.map((tx) => ({
                  id: tx.id,
                  productId: tx.productId,
                  productName: tx.productName,
                  type: tx.type,
                  quantity: tx.quantity,
                  previousStock: tx.previousStock,
                  newStock: tx.newStock,
                  reason: tx.reason,
                  performedBy: tx.performedBy,
                  createdAt: tx.date || (/* @__PURE__ */ new Date()).toISOString()
                }));
              }
            } catch (err) {
              console.error("Error reading legacy db.json:", err);
            }
          }
        }
        if (!hasD1Credentials && process.env.NODE_ENV !== "production") {
          if (this.tables.products.length === 0) {
            this.tables.products = [...INITIAL_PRODUCTS];
          }
          if (this.tables.gallery_items.length === 0) {
            this.tables.gallery_items = [...INITIAL_GALLERY_ITEMS];
          }
          if (!this.tables.store_settings || !this.tables.store_settings.whatsappPhone) {
            this.tables.store_settings = { ...INITIAL_STORE_SETTINGS, deliveryDistricts: [
              { id: "d1", nameAr: "\u062D\u062F\u0629 \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u062E\u0645\u0633\u064A\u0646 \u0648\u0627\u0644\u062D\u064A \u0627\u0644\u0633\u064A\u0627\u0633\u064A", nameEn: "Hadda & Political Area", fee: 500, etaMinutes: 35, isActive: true },
              { id: "d2", nameAr: "\u0627\u0644\u0623\u0635\u0628\u062D\u064A \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0642\u0627\u0644\u062D \u0648\u0628\u064A\u062A \u0628\u0648\u0633", nameEn: "Asbahi & Bait Baws", fee: 500, etaMinutes: 40, isActive: true },
              { id: "d3", nameAr: "\u0627\u0644\u062A\u062D\u0631\u064A\u0631 \u0648\u0634\u0627\u0631\u0639 \u062C\u0645\u0627\u0644 \u0648\u0627\u0644\u0642\u0627\u0639", nameEn: "Tahrir & Al-Qaa", fee: 600, etaMinutes: 40, isActive: true },
              { id: "d4", nameAr: "\u0635\u0646\u0639\u0627\u0621 \u0627\u0644\u0642\u062F\u064A\u0645\u0629 \u0648\u0628\u0627\u0628 \u0627\u0644\u064A\u0645\u0646 \u0648\u0634\u0639\u0648\u0628", nameEn: "Old Sanaa & Bab Al-Yaman", fee: 700, etaMinutes: 45, isActive: true },
              { id: "d5", nameAr: "\u0634\u0645\u0644\u0627\u0646 \u0648\u0645\u0630\u0628\u062D \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u062B\u0644\u0627\u062B\u064A\u0646", nameEn: "Shamlan & Madhbah", fee: 800, etaMinutes: 45, isActive: true },
              { id: "d6", nameAr: "\u0627\u0644\u062D\u0635\u0628\u0629 \u0648\u0634\u0627\u0631\u0639 \u0627\u0644\u0645\u0637\u0627\u0631 \u0648\u0627\u0644\u0631\u0648\u0636\u0629", nameEn: "Hasaba & Airport Rd", fee: 900, etaMinutes: 50, isActive: true }
            ] };
          }
          if (this.tables.delivery_agents.length === 0) {
            this.tables.delivery_agents = [...INITIAL_DELIVERY_AGENTS];
          }
          if (this.tables.coupons.length === 0) {
            this.tables.coupons = [
              { code: "GOLD2026", discountPercent: 10, maxDiscount: 2e3, minOrderAmount: 2e3, isActive: true },
              { code: "SANAA15", discountPercent: 15, maxDiscount: 3500, minOrderAmount: 5e3, isActive: true },
              { code: "VIPBLACK", discountPercent: 20, maxDiscount: 5e3, minOrderAmount: 1e4, isActive: true }
            ];
          }
          this.saveLocal();
        }
        for (const order of this.tables.orders) {
          if (order.items && Array.isArray(order.items)) {
            for (const it of order.items) {
              const existingItem = this.tables.order_items.find((oi) => oi.orderId === order.id && oi.productId === it.productId);
              if (!existingItem) {
                this.tables.order_items.push({
                  id: `oi-${order.id}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`,
                  orderId: order.id,
                  productId: it.productId,
                  productNameAr: it.productNameAr || "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F",
                  productNameEn: "Black Gold Premium Charcoal",
                  weightOption: it.weight || "250g",
                  quantity: it.quantity || 1,
                  unitPrice: it.unitPrice || 600,
                  totalPrice: (it.unitPrice || 600) * (it.quantity || 1),
                  createdAt: order.date || (/* @__PURE__ */ new Date()).toISOString()
                });
              }
            }
          }
          if (order.customerPhone) {
            const existingCust = this.tables.customers.find((c) => c.phone === order.customerPhone);
            if (existingCust) {
              existingCust.totalOrders += 1;
              existingCust.totalSpent += order.total || 0;
            } else {
              this.tables.customers.push({
                id: `cust-${order.customerPhone.replace(/\D/g, "")}`,
                name: order.customerName || "\u0639\u0645\u064A\u0644",
                phone: order.customerPhone,
                district: order.address?.district || "\u0635\u0646\u0639\u0627\u0621",
                totalOrders: 1,
                totalSpent: order.total || 0,
                loyaltyPoints: Math.floor((order.total || 0) / 100),
                createdAt: order.date || (/* @__PURE__ */ new Date()).toISOString(),
                updatedAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
          }
        }
        for (const product of this.tables.products) {
          this.tables.inventory.set(product.id, {
            currentStock: product.stock,
            reservedStock: 0,
            minThreshold: 15,
            lastCountedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        await this.ensureDefaultUsersAsync();
        this.isInitialized = true;
        this.saveLocal();
        console.log("\u2705 Cloudflare D1 Database Access Layer Initialized Successfully. Database ID:", CLOUDFLARE_CONFIG.databaseId);
      } catch (e) {
        console.error("Error during D1 DAL initialization:", e?.message || e);
        if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
          throw e;
        }
        this.isInitialized = true;
      }
    })();
    return this.initPromise;
  }
  /**
   * Ensure Owner Account structure exists and loads credentials strictly from environment or D1.
   * In Production: Owner is ONLY provisioned from environment variables (ADMIN_PHONE, ADMIN_PIN, ADMIN_NAME).
   * Zero hardcoded phones or PINs. D1 is updated first; memory is only updated upon successful D1 operation.
   */
  async ensureDefaultUsersAsync() {
    const envAdminPhone = process.env.ADMIN_PHONE ? normalizeDigits(process.env.ADMIN_PHONE.trim()) : "";
    const envAdminName = process.env.ADMIN_NAME ? process.env.ADMIN_NAME.trim() : "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u062A\u062C\u0631";
    const envAdminPin = process.env.ADMIN_PIN ? normalizeDigits(process.env.ADMIN_PIN.trim()) : "";
    if (this.isD1Configured()) {
      const ownerRows = await this.executeCloudflareD1Query("SELECT * FROM users WHERE role = 'owner' LIMIT 1;");
      if (Array.isArray(ownerRows) && ownerRows.length > 0) {
        const existingOwner = this.mapD1UserToUser(ownerRows[0]);
        if (envAdminPin && !existingOwner.pinHash && !existingOwner.passwordHash) {
          const pinHash = hashSecret(envAdminPin);
          await this.executeCloudflareD1Query("UPDATE users SET pin_hash = ? WHERE id = ?;", [pinHash, existingOwner.id]);
          existingOwner.pinHash = pinHash;
        }
        const idx = this.tables.users.findIndex((u) => u.role === "owner");
        if (idx >= 0) {
          this.tables.users[idx] = existingOwner;
        } else {
          this.tables.users.push(existingOwner);
        }
        return;
      }
      if (envAdminPhone) {
        const ownerAccount = {
          id: `usr-owner-${envAdminPhone}`,
          name: envAdminName,
          phone: envAdminPhone,
          role: "owner",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (envAdminPin) {
          ownerAccount.pinHash = hashSecret(envAdminPin);
        }
        await this.executeCloudflareD1Query(
          "INSERT INTO users (id, name, phone, role, pin_hash, created_at) VALUES (?, ?, ?, ?, ?, ?);",
          [ownerAccount.id, ownerAccount.name, ownerAccount.phone, ownerAccount.role, ownerAccount.pinHash || null, ownerAccount.createdAt]
        );
        this.tables.users.push(ownerAccount);
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
      }
      const hasOwner = this.tables.users.some((u) => u.role === "owner");
      if (!hasOwner && envAdminPhone) {
        const devOwner = {
          id: `usr-owner-${envAdminPhone}`,
          name: envAdminName,
          phone: envAdminPhone,
          role: "owner",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (envAdminPin) {
          devOwner.pinHash = hashSecret(envAdminPin);
        }
        this.tables.users.push(devOwner);
        this.saveLocal();
      }
    }
  }
  ensureDefaultUsers() {
    this.ensureDefaultUsersAsync().catch((err) => {
      console.error("ensureDefaultUsersAsync error:", err);
    });
  }
  isD1Configured() {
    return !!(CLOUDFLARE_CONFIG.accountId && CLOUDFLARE_CONFIG.apiToken && CLOUDFLARE_CONFIG.databaseId);
  }
  isD1Initialized() {
    return this.isInitialized;
  }
  /**
   * Comprehensive live diagnostic check of Cloudflare D1
   */
  async checkD1Health() {
    const configured = this.isD1Configured();
    let reachable = false;
    let schemaValid = false;
    let remoteTablesCount = 0;
    let error = null;
    if (!configured) {
      if (process.env.NODE_ENV === "production") {
        return {
          configured: false,
          reachable: false,
          initialized: this.isInitialized,
          schemaValid: false,
          isConnected: false,
          remoteTablesCount: 0,
          error: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C"
        };
      }
      return {
        configured: false,
        reachable: true,
        initialized: this.isInitialized,
        schemaValid: true,
        isConnected: true,
        remoteTablesCount: 0,
        error: null
      };
    }
    try {
      const probeRes = await this.executeCloudflareD1Query("SELECT count(*) as count FROM sqlite_master WHERE type='table';");
      if (Array.isArray(probeRes) && probeRes.length > 0) {
        reachable = true;
        remoteTablesCount = Number(probeRes[0].count) || 0;
        const tablesCheck = await this.executeCloudflareD1Query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('products', 'orders', 'users', 'inventory', 'store_settings');"
        );
        if (Array.isArray(tablesCheck) && tablesCheck.length >= 4) {
          schemaValid = true;
        } else {
          schemaValid = false;
          error = "\u062C\u062F\u0627\u0648\u0644 \u0627\u0644\u0645\u062E\u0637\u0637 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0641\u064A Cloudflare D1";
        }
      } else {
        reachable = false;
        error = "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0644\u0642\u064A \u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0635\u062D\u064A\u062D\u0629 \u0645\u0646 Cloudflare D1";
      }
    } catch (err) {
      reachable = false;
      schemaValid = false;
      error = err?.message || "\u0641\u0634\u0644 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1";
    }
    const isConnected = configured && reachable && schemaValid;
    return {
      configured,
      reachable,
      initialized: this.isInitialized,
      schemaValid,
      isConnected,
      remoteTablesCount,
      error
    };
  }
  /**
   * Fetch primary authoritative data directly from remote Cloudflare D1
   */
  async syncFromCloudflareD1() {
    if (!this.isD1Configured()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
      }
      return false;
    }
    try {
      await this.executeCloudflareD1Query(
        "CREATE TRIGGER IF NOT EXISTS prevent_negative_stock BEFORE UPDATE ON products FOR EACH ROW WHEN NEW.stock < 0 BEGIN SELECT RAISE(ABORT, 'Insufficient stock: product stock cannot be negative'); END;"
      );
      const categoriesResult = await this.executeCloudflareD1Query("SELECT * FROM categories ORDER BY sort_order ASC;");
      this.tables.categories = Array.isArray(categoriesResult) ? categoriesResult : [];
      const productsResult = await this.executeCloudflareD1Query("SELECT * FROM products;");
      this.tables.products = Array.isArray(productsResult) ? productsResult.map((r) => {
        const parsedImages = typeof r.images === "string" ? JSON.parse(r.images || "[]") : r.images || [];
        const primaryImg = parsedImages[0] || r.image || "/images/black_gold_pouch_pair_1786125935649.jpg";
        return {
          id: r.id,
          nameAr: r.name_ar,
          nameEn: r.name_en,
          category: r.category,
          price: r.price,
          originalPrice: r.original_price,
          discountPercent: r.discount_percent,
          descriptionAr: r.description_ar,
          descriptionEn: r.description_en,
          origin: r.origin,
          burnDurationHours: r.burn_duration_hours,
          ashPercentage: r.ash_percentage,
          moisture: r.moisture,
          rating: r.rating,
          reviewCount: r.review_count,
          image: primaryImg,
          images: parsedImages.length > 0 ? parsedImages : [primaryImg],
          specs: typeof r.specs === "string" ? JSON.parse(r.specs || "[]") : r.specs || [],
          weightOptions: typeof r.weight_options === "string" ? JSON.parse(r.weight_options || "[]") : r.weight_options || [],
          isFeatured: Boolean(r.is_featured),
          isBestSeller: Boolean(r.is_best_seller),
          stock: r.stock
        };
      }) : [];
      this.tables.inventory.clear();
      for (const p of this.tables.products) {
        this.tables.inventory.set(p.id, {
          currentStock: p.stock,
          reservedStock: 0,
          minThreshold: 15,
          lastCountedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      const ordersResult = await this.executeCloudflareD1Query("SELECT * FROM orders ORDER BY created_at DESC;");
      this.tables.orders = Array.isArray(ordersResult) ? ordersResult.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        customerAddress: r.delivery_address,
        address: {
          id: "addr-d1",
          title: r.delivery_district,
          district: r.delivery_district,
          street: r.delivery_address,
          phone: r.customer_phone,
          isDefault: true
        },
        items: typeof r.items_json === "string" ? JSON.parse(r.items_json || "[]") : r.items_json || [],
        subtotal: r.subtotal,
        shippingFee: r.shipping_fee || 0,
        deliveryFee: r.shipping_fee || 0,
        discount: r.discount,
        total: r.total,
        totalAmount: r.total,
        district: r.delivery_district,
        paymentMethod: r.payment_method,
        status: r.status,
        date: r.created_at,
        createdAt: r.created_at,
        driverId: r.driver_id || void 0,
        driverName: r.driver_name || void 0,
        driverPhone: r.driver_phone || void 0,
        driverNotes: r.driver_notes || void 0,
        timeline: typeof r.timeline_json === "string" ? JSON.parse(r.timeline_json || "[]") : r.timeline_json || void 0,
        isStockRolledBack: Boolean(r.is_stock_rolled_back),
        cancelledAt: r.cancelled_at || void 0,
        completedAt: r.completed_at || void 0
      })) : [];
      const itemsResult = await this.executeCloudflareD1Query("SELECT * FROM order_items;");
      this.tables.order_items = Array.isArray(itemsResult) ? itemsResult.map((it) => ({
        id: it.id,
        orderId: it.order_id,
        productId: it.product_id,
        productNameAr: it.product_name_ar,
        productNameEn: it.product_name_en,
        weightOption: it.weight_option,
        quantity: it.quantity,
        unitPrice: it.unit_price,
        totalPrice: it.total_price,
        createdAt: it.created_at
      })) : [];
      const custResult = await this.executeCloudflareD1Query("SELECT * FROM customers;");
      this.tables.customers = Array.isArray(custResult) ? custResult.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        district: c.district,
        totalOrders: c.total_orders || 0,
        totalSpent: c.total_spent || 0,
        loyaltyPoints: c.loyalty_points || 0,
        createdAt: c.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: c.updated_at || (/* @__PURE__ */ new Date()).toISOString()
      })) : [];
      const usersResult = await this.executeCloudflareD1Query("SELECT * FROM users;");
      this.tables.users = Array.isArray(usersResult) ? usersResult.map((u) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email || void 0,
        role: u.role,
        passwordHash: u.password_hash || void 0,
        pinHash: u.pin_hash || void 0,
        createdAt: u.created_at || (/* @__PURE__ */ new Date()).toISOString(),
        lastLogin: u.last_login || void 0
      })) : [];
      const logsResult = await this.executeCloudflareD1Query("SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 500;");
      this.tables.inventory_logs = Array.isArray(logsResult) ? logsResult.map((l) => ({
        id: l.id,
        productId: l.product_id,
        productName: l.product_name,
        type: l.type,
        quantity: l.quantity,
        previousStock: l.previous_stock,
        newStock: l.new_stock,
        reason: l.reason,
        orderId: l.order_id || void 0,
        performedBy: l.performed_by,
        createdAt: l.created_at
      })) : [];
      const daResult = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents;");
      this.tables.delivery_agents = Array.isArray(daResult) ? daResult.map((da) => ({
        id: da.id,
        name: da.name,
        phone: da.phone,
        vehicleType: da.vehicle_type || da.vehicle || "motorcycle",
        assignedDistricts: typeof da.assigned_districts === "string" ? JSON.parse(da.assigned_districts || "[]") : da.assigned_districts || [],
        completedOrdersCount: da.total_delivered_count || da.completed_orders_count || 0,
        rating: da.rating || 5,
        isActive: da.is_available !== void 0 ? Boolean(da.is_available) : da.is_active !== void 0 ? Boolean(da.is_active) : true
      })) : [];
      const couponResult = await this.executeCloudflareD1Query("SELECT * FROM coupons;");
      this.tables.coupons = Array.isArray(couponResult) ? couponResult.map((cp) => ({
        code: cp.code,
        discountPercent: cp.discount_percent,
        maxDiscount: cp.max_discount,
        minOrderAmount: cp.min_order_amount,
        isActive: Boolean(cp.is_active),
        validUntil: cp.valid_until || void 0,
        usageCount: cp.usage_count || 0,
        maxUses: cp.max_uses !== void 0 && cp.max_uses !== null ? Number(cp.max_uses) : void 0
      })) : [];
      const revResult = await this.executeCloudflareD1Query("SELECT * FROM reviews ORDER BY created_at DESC;");
      this.tables.reviews = Array.isArray(revResult) ? revResult.map((rv) => ({
        id: rv.id,
        productId: rv.product_id,
        userName: rv.customer_name || rv.user_name || "\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062A\u062C\u0631",
        userPhone: rv.customer_phone || rv.user_phone || void 0,
        rating: Number(rv.rating || 5),
        comment: rv.comment || "",
        verifiedPurchase: Boolean(rv.is_verified ?? rv.verified_purchase),
        date: rv.created_at
      })) : [];
      const stResult = await this.executeCloudflareD1Query("SELECT * FROM store_settings WHERE id = 'default_settings';");
      if (Array.isArray(stResult) && stResult.length > 0) {
        const st = stResult[0];
        const districts = typeof st.delivery_districts === "string" ? JSON.parse(st.delivery_districts || "[]") : st.delivery_districts || this.tables.store_settings.deliveryDistricts;
        this.tables.store_settings = {
          ...this.tables.store_settings,
          storeNameAr: st.store_name_ar || this.tables.store_settings.storeNameAr,
          storeNameEn: st.store_name_en || this.tables.store_settings.storeNameEn,
          sloganAr: st.slogan_ar || this.tables.store_settings.sloganAr,
          logoText: st.logo_text || this.tables.store_settings.logoText,
          customLogoUrl: st.custom_logo_url || this.tables.store_settings.customLogoUrl,
          topBannerNoticeAr: st.top_banner_notice_ar || this.tables.store_settings.topBannerNoticeAr,
          topBannerNoticeEn: st.top_banner_notice_en || this.tables.store_settings.topBannerNoticeEn,
          whatsappPhone: st.whatsapp_phone || this.tables.store_settings.whatsappPhone,
          whatsappNumber: st.whatsapp_phone || this.tables.store_settings.whatsappNumber,
          supportPhone: st.call_phone || this.tables.store_settings.supportPhone,
          supportEmail: st.contact_email || this.tables.store_settings.supportEmail,
          freeDeliveryThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeDeliveryThreshold),
          freeShippingThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeShippingThreshold),
          defaultShippingFee: st.default_delivery_fee || this.tables.store_settings.defaultShippingFee,
          isOrderingEnabled: st.is_store_open !== void 0 ? Boolean(st.is_store_open) : true,
          deliveryDistricts: districts
        };
      }
      const galResult = await this.executeCloudflareD1Query("SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at DESC;");
      this.tables.gallery_items = Array.isArray(galResult) ? galResult.map((g) => ({
        id: g.id,
        titleAr: g.title_ar,
        titleEn: g.title_en || void 0,
        image: g.image_url || "",
        imageUrl: g.image_url,
        category: g.category || "factory",
        caption: g.caption || void 0,
        sortOrder: g.sort_order || 0,
        isActive: g.is_active !== void 0 ? Boolean(g.is_active) : true,
        createdAt: g.created_at
      })) : [];
      await this.ensureDefaultUsersAsync();
      console.log("\u2705 Cloudflare D1 primary sync completed successfully for all operational tables.");
      return true;
    } catch (e) {
      console.error("CRITICAL: D1 remote sync failed on one or more tables:", e);
      if (process.env.NODE_ENV === "production") {
        throw e;
      }
      return false;
    }
  }
  /**
   * Execute raw query directly on Cloudflare D1 HTTP REST API
   */
  async executeCloudflareD1Raw(sql, params = []) {
    if (!this.isD1Configured()) {
      return { success: false, errors: [{ code: 5e3, message: "Cloudflare D1 is not configured" }] };
    }
    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;
      const body = { sql };
      if (params && params.length > 0) {
        body.params = params;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3e4)
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn("Cloudflare D1 HTTP query error:", err);
      return { success: false, errors: [{ code: 5e3, message: err.message || "Network error" }] };
    }
  }
  /**
   * Execute compound batch of SQL statements atomically on Cloudflare D1 HTTP REST API.
   * If any statement fails (e.g. check constraint or prevent_negative_stock trigger),
   * Cloudflare D1 rolls back the entire batch transaction and returns success: false.
   */
  async executeCloudflareD1BatchRaw(statements) {
    if (!this.isD1Configured()) {
      return { success: false, errors: [{ code: 5e3, message: "Cloudflare D1 is not configured" }] };
    }
    try {
      const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_CONFIG.accountId}/d1/database/${CLOUDFLARE_CONFIG.databaseId}/query`;
      const body = { batch: statements };
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CLOUDFLARE_CONFIG.apiToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3e4)
      });
      const json = await res.json();
      return json;
    } catch (err) {
      console.warn("Cloudflare D1 HTTP batch query error:", err);
      return { success: false, errors: [{ code: 5e3, message: err.message || "Network error" }] };
    }
  }
  /**
   * Execute query directly on Cloudflare D1 HTTP REST API.
   * Throws an explicit error on failure or when D1 is unconfigured in production.
   * Returns empty array if query succeeded and returned no rows.
   */
  async executeCloudflareD1Query(sql, params = []) {
    if (!this.isD1Configured()) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
      }
      throw new Error("Cloudflare D1 is not configured");
    }
    const json = await this.executeCloudflareD1Raw(sql, params);
    if (!json || json.success === false || !json.result) {
      const errMsg = (json?.errors || []).map((e) => e.message || JSON.stringify(e)).join("; ") || "D1 query failed";
      console.error("Cloudflare D1 HTTP query failed:", errMsg, "SQL:", sql);
      throw new Error(`\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 Cloudflare D1: ${errMsg}`);
    }
    return json.result?.[0]?.results ?? [];
  }
  saveLocal() {
    if (process.env.NODE_ENV === "production" || this.isD1Configured()) {
      return;
    }
    try {
      const payload = {
        products: this.tables.products,
        users: this.tables.users,
        orders: this.tables.orders,
        orderItems: this.tables.order_items,
        customers: this.tables.customers,
        reviews: this.tables.reviews,
        coupons: this.tables.coupons,
        deliveryAgents: this.tables.delivery_agents,
        storeSettings: this.tables.store_settings,
        galleryItems: this.tables.gallery_items,
        inventoryTransactions: this.tables.inventory_logs,
        payments: this.tables.payments,
        notifications: this.tables.notifications,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      fs.writeFileSync(this.localDbPath, JSON.stringify(payload, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to write local database file:", err);
    }
  }
  // ==========================================
  // CLOUDFLARE D1 ROW MAPPERS (Pure Relational -> Domain Objects)
  // ==========================================
  mapD1ProductToProduct(r) {
    const images = typeof r.images === "string" ? JSON.parse(r.images || "[]") || [] : r.images || [];
    const primaryImg = images[0] || r.image || "/images/black_gold_pouch_pair_1786125935649.jpg";
    const specs = typeof r.specs === "string" ? JSON.parse(r.specs || "[]") || [] : r.specs || [];
    const weightOptions = typeof r.weight_options === "string" ? JSON.parse(r.weight_options || "[]") || [] : r.weight_options || [];
    return {
      id: r.id,
      nameAr: r.name_ar || r.nameAr || "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F",
      nameEn: r.name_en || r.nameEn || "Black Gold Charcoal",
      category: r.category || "pouches",
      price: Number(r.price),
      originalPrice: r.original_price ? Number(r.original_price) : void 0,
      discountPercent: r.discount_percent ? Number(r.discount_percent) : 0,
      descriptionAr: r.description_ar || r.descriptionAr || "",
      descriptionEn: r.description_en || r.descriptionEn || "",
      image: primaryImg,
      images: images.length > 0 ? images : [primaryImg],
      specs,
      weightOptions,
      isFeatured: Boolean(r.is_featured),
      isBestSeller: Boolean(r.is_best_seller),
      stock: Number(r.stock ?? 0),
      origin: r.origin || "\u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F - \u0635\u0646\u0639\u0627\u0621",
      burnDurationHours: r.burn_duration_hours || "6+ \u0633\u0627\u0639\u0627\u062A \u0645\u062A\u0648\u0627\u0635\u0644\u0629",
      ashPercentage: r.ash_percentage || "\u0623\u0642\u0644 \u0645\u0646 1.5% \u0631\u0645\u0627\u062F \u0623\u0628\u064A\u0636",
      moisture: r.moisture || "< 2%",
      rating: Number(r.rating || 5),
      reviewCount: Number(r.review_count || 0),
      updatedAt: r.updated_at
    };
  }
  mapD1OrderToOrder(r) {
    const items = typeof r.items_json === "string" ? JSON.parse(r.items_json || "[]") || [] : r.items_json || [];
    const timeline = typeof r.timeline_json === "string" ? JSON.parse(r.timeline_json || "[]") || [] : r.timeline_json || [];
    return {
      id: r.id,
      orderNumber: r.order_number || r.orderNumber || r.id,
      date: r.created_at || r.date || (/* @__PURE__ */ new Date()).toISOString(),
      createdAt: r.created_at || r.createdAt,
      status: r.status,
      items,
      subtotal: Number(r.subtotal || 0),
      shippingFee: Number(r.shipping_fee || 0),
      discount: Number(r.discount || 0),
      total: Number(r.total || 0),
      totalAmount: Number(r.total || 0),
      district: r.delivery_district || r.district || "",
      address: {
        id: `addr-${r.id}`,
        title: r.delivery_district || "",
        district: r.delivery_district || "",
        street: r.delivery_address || "",
        phone: r.customer_phone || "",
        isDefault: true
      },
      customerName: r.customer_name || r.customerName || "",
      customerPhone: r.customer_phone || r.customerPhone || "",
      paymentMethod: r.payment_method || r.paymentMethod || "cash",
      paymentStatus: r.payment_status || r.paymentStatus || "pending",
      couponCode: r.coupon_code || r.couponCode || void 0,
      notes: r.notes || "",
      driverNotes: r.driver_notes || "",
      driverId: r.driver_id || "",
      driverName: r.driver_name || "",
      driverPhone: r.driver_phone || "",
      timeline,
      idempotencyKey: r.idempotency_key || r.idempotencyKey,
      isStockRolledBack: Boolean(r.is_stock_rolled_back)
    };
  }
  mapD1UserToUser(r) {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      role: r.role,
      pinHash: r.pin_hash || r.pinHash,
      passwordHash: r.password_hash || r.passwordHash,
      createdAt: r.created_at || r.createdAt,
      lastLogin: r.last_login || r.lastLogin
    };
  }
  mapD1CustomerToCustomer(r) {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      district: r.district || "",
      street: r.street || "",
      notes: r.notes || "",
      totalOrders: Number(r.total_orders || 0),
      totalSpent: Number(r.total_spent || 0),
      loyaltyPoints: Number(r.loyalty_points || 0),
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }
  mapD1CouponToCoupon(r) {
    return {
      code: r.code,
      discountPercent: Number(r.discount_percent || 0),
      maxDiscount: r.max_discount ? Number(r.max_discount) : void 0,
      minOrderAmount: Number(r.min_order_amount || 0),
      isActive: Boolean(r.is_active),
      validUntil: r.valid_until || void 0,
      usageCount: Number(r.usage_count || 0),
      maxUses: r.max_uses !== void 0 && r.max_uses !== null ? Number(r.max_uses) : void 0
    };
  }
  mapD1ReviewToReview(r) {
    return {
      id: r.id,
      productId: r.product_id,
      userName: r.customer_name || r.user_name || "\u0639\u0645\u064A\u0644 \u0627\u0644\u0645\u062A\u062C\u0631",
      userPhone: r.customer_phone || r.user_phone || void 0,
      rating: Number(r.rating || 5),
      comment: r.comment || "",
      verifiedPurchase: Boolean(r.is_verified ?? r.verified_purchase),
      date: r.created_at
    };
  }
  mapD1DeliveryAgentToAgent(r) {
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      vehicleType: r.vehicle_type || "motorcycle",
      assignedDistricts: typeof r.assigned_districts === "string" ? JSON.parse(r.assigned_districts || "[]") || [] : r.assigned_districts || [],
      completedOrdersCount: Number(r.total_delivered_count || r.completed_orders_count || 0),
      rating: Number(r.rating || 5),
      isActive: Boolean(r.is_available !== void 0 ? r.is_available : r.is_active)
    };
  }
  // ==========================================
  // 1. PRODUCTS & CATEGORIES
  // ==========================================
  getProducts() {
    return this.tables.products.map((p) => {
      const primaryImg = p.image || p.images?.[0] || "/images/black_gold_pouch_pair_1786125935649.jpg";
      return {
        ...p,
        image: primaryImg,
        images: p.images && p.images.length > 0 ? p.images : [primaryImg]
      };
    });
  }
  async getProductsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM products ORDER BY id ASC;");
        if (Array.isArray(rows)) {
          const prods = rows.map((r) => this.mapD1ProductToProduct(r));
          this.tables.products = prods;
          return prods;
        }
      } catch (e) {
        console.error("D1 getProductsAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
      return this.tables.products;
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.getProducts();
  }
  findProductById(id) {
    const p = this.tables.products.find((p2) => p2.id === id);
    if (!p) return void 0;
    const primaryImg = p.image || p.images?.[0] || "/images/black_gold_pouch_pair_1786125935649.jpg";
    return {
      ...p,
      image: primaryImg,
      images: p.images && p.images.length > 0 ? p.images : [primaryImg]
    };
  }
  async findProductByIdAsync(id) {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM products WHERE id = ? LIMIT 1;", [id]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1ProductToProduct(rows[0]);
          }
          return void 0;
        }
      } catch (e) {
        console.error("D1 findProductByIdAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.findProductById(id);
  }
  addProduct(product) {
    const primaryImg = product.image || product.images?.[0] || "/images/black_gold_pouch_pair_1786125935649.jpg";
    product.image = primaryImg;
    product.images = product.images && product.images.length > 0 ? product.images : [primaryImg];
    this.tables.products.push(product);
    this.saveLocal();
    return product;
  }
  async addProductAsync(product) {
    const primaryImg = product.image || product.images?.[0] || "/images/black_gold_pouch_pair_1786125935649.jpg";
    product.image = primaryImg;
    product.images = product.images && product.images.length > 0 ? product.images : [primaryImg];
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO products (id, name_ar, name_en, category, price, original_price, discount_percent, description_ar, description_en, origin, burn_duration_hours, ash_percentage, moisture, rating, review_count, images, specs, weight_options, is_featured, is_best_seller, stock, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'));`,
        [
          product.id,
          product.nameAr,
          product.nameEn || "",
          product.category || "pouches",
          product.price,
          product.originalPrice || product.price,
          product.discountPercent || 0,
          product.descriptionAr || "",
          product.descriptionEn || "",
          product.origin || "\u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F - \u0635\u0646\u0639\u0627\u0621",
          product.burnDurationHours || "6+ \u0633\u0627\u0639\u0627\u062A \u0645\u062A\u0648\u0627\u0635\u0644\u0629",
          product.ashPercentage || "\u0623\u0642\u0644 \u0645\u0646 1.5% \u0631\u0645\u0627\u062F \u0623\u0628\u064A\u0636",
          product.moisture || "< 2%",
          product.rating || 5,
          product.reviewCount || 0,
          JSON.stringify(product.images || [primaryImg]),
          JSON.stringify(product.specs || []),
          JSON.stringify(product.weightOptions || []),
          product.isFeatured ? 1 : 0,
          product.isBestSeller ? 1 : 0,
          product.stock ?? 100
        ]
      );
      const created = await this.findProductByIdAsync(product.id);
      if (created) {
        await this.executeCloudflareD1Query(
          `INSERT INTO inventory (product_id, current_stock, min_threshold, updated_at) VALUES (?, ?, 10, datetime('now')) ON CONFLICT(product_id) DO UPDATE SET current_stock = excluded.current_stock, updated_at = datetime('now');`,
          [product.id, product.stock ?? 100]
        );
        this.tables.products.push(created);
        return created;
      }
      throw new Error("\u0641\u0634\u0644 \u062A\u0623\u0643\u064A\u062F \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.addProduct(product);
  }
  updateProduct(id, updates) {
    const idx = this.tables.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const current = this.tables.products[idx];
    const finalImage = updates.image || updates.images?.[0] || current.image || current.images?.[0] || "/images/black_gold_pouch_pair_1786125935649.jpg";
    const finalImages = updates.images && updates.images.length > 0 ? updates.images : current.images && current.images.length > 0 ? current.images : [finalImage];
    const updated = {
      ...current,
      ...updates,
      image: finalImage,
      images: finalImages
    };
    this.tables.products[idx] = updated;
    this.saveLocal();
    return updated;
  }
  async updateProductAsync(id, updates) {
    if (this.isD1Configured()) {
      const current = await this.findProductByIdAsync(id);
      if (!current) return null;
      const finalNameAr = updates.nameAr !== void 0 ? updates.nameAr : current.nameAr;
      const finalNameEn = updates.nameEn !== void 0 ? updates.nameEn : current.nameEn || "";
      const finalCategory = updates.category !== void 0 ? updates.category : current.category || "pouches";
      const finalPrice = updates.price !== void 0 ? Number(updates.price) : current.price;
      const finalOrigPrice = updates.originalPrice !== void 0 ? Number(updates.originalPrice) : current.originalPrice || finalPrice;
      const finalDiscount = updates.discountPercent !== void 0 ? Number(updates.discountPercent) : current.discountPercent || 0;
      const finalDescAr = updates.descriptionAr !== void 0 ? updates.descriptionAr : current.descriptionAr;
      const finalDescEn = updates.descriptionEn !== void 0 ? updates.descriptionEn : current.descriptionEn || "";
      const finalStock = updates.stock !== void 0 ? Math.max(0, Number(updates.stock)) : current.stock;
      let finalImages = current.images || [];
      if (updates.images && updates.images.length > 0) {
        finalImages = updates.images;
      } else if (updates.image) {
        finalImages = [updates.image, ...current.images?.filter((img) => img !== updates.image) || []];
      }
      const finalWeightOptions = updates.weightOptions !== void 0 ? updates.weightOptions : current.weightOptions || [];
      const finalSpecs = updates.specs !== void 0 ? updates.specs : current.specs || [];
      const finalIsFeatured = updates.isFeatured !== void 0 ? updates.isFeatured ? 1 : 0 : current.isFeatured ? 1 : 0;
      const finalIsBestSeller = updates.isBestSeller !== void 0 ? updates.isBestSeller ? 1 : 0 : current.isBestSeller ? 1 : 0;
      await this.executeCloudflareD1Query(
        `UPDATE products SET name_ar = ?, name_en = ?, category = ?, price = ?, original_price = ?, discount_percent = ?, description_ar = ?, description_en = ?, stock = ?, images = ?, weight_options = ?, specs = ?, is_featured = ?, is_best_seller = ?, updated_at = datetime('now') WHERE id = ?;`,
        [
          finalNameAr,
          finalNameEn,
          finalCategory,
          finalPrice,
          finalOrigPrice,
          finalDiscount,
          finalDescAr,
          finalDescEn,
          finalStock,
          JSON.stringify(finalImages),
          JSON.stringify(finalWeightOptions),
          JSON.stringify(finalSpecs),
          finalIsFeatured,
          finalIsBestSeller,
          id
        ]
      );
      if (updates.stock !== void 0) {
        await this.executeCloudflareD1Query(
          `INSERT INTO inventory (product_id, current_stock, min_threshold, updated_at) VALUES (?, ?, 10, datetime('now')) ON CONFLICT(product_id) DO UPDATE SET current_stock = excluded.current_stock, updated_at = datetime('now');`,
          [id, finalStock]
        );
      }
      const updated = await this.findProductByIdAsync(id);
      if (updated) {
        const idx = this.tables.products.findIndex((p) => p.id === id);
        if (idx !== -1) this.tables.products[idx] = updated;
        const inv = this.tables.inventory.get(id);
        if (inv && updates.stock !== void 0) {
          inv.currentStock = finalStock;
        }
        this.saveLocal();
        return updated;
      }
      return null;
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.updateProduct(id, updates);
  }
  deleteProduct(id) {
    const prevLen = this.tables.products.length;
    this.tables.products = this.tables.products.filter((p) => p.id !== id);
    this.saveLocal();
    return this.tables.products.length < prevLen;
  }
  async deleteProductAsync(id) {
    if (this.isD1Configured()) {
      const existingProduct = await this.findProductByIdAsync(id);
      if (!existingProduct) {
        throw new Error(`\u0627\u0644\u0645\u0646\u062A\u062C \u0627\u0644\u0645\u0637\u0644\u0648\u0628 \u062D\u0630\u0641\u0647 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F: ${id}`);
      }
      const batchResult = await this.executeCloudflareD1BatchRaw([
        { sql: "DELETE FROM inventory WHERE product_id = ?;", params: [id] },
        { sql: "DELETE FROM inventory_logs WHERE product_id = ?;", params: [id] },
        { sql: "DELETE FROM products WHERE id = ?;", params: [id] }
      ]);
      if (!batchResult || !batchResult.success) {
        const errMsg = (batchResult?.errors || []).map((e) => e.message).join("; ") || "Batch deletion failed";
        console.error(`[D1 Error] Deletion failed for product ${id}: ${errMsg}`);
        throw new Error(`\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0648\u0645\u0644\u062D\u0642\u0627\u062A\u0647 (\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0648\u0627\u0644\u0633\u062C\u0644\u0627\u062A) \u0645\u0646 Cloudflare D1: ${errMsg}`);
      }
      this.tables.products = this.tables.products.filter((p) => p.id !== id);
      this.tables.inventory.delete(id);
      this.tables.inventory_logs = this.tables.inventory_logs.filter((l) => l.productId !== id);
      this.saveLocal();
      return true;
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const prevLen = this.tables.products.length;
    this.tables.products = this.tables.products.filter((p) => p.id !== id);
    this.tables.inventory.delete(id);
    this.tables.inventory_logs = this.tables.inventory_logs.filter((l) => l.productId !== id);
    this.saveLocal();
    return this.tables.products.length < prevLen;
  }
  getCategories() {
    return this.tables.categories;
  }
  async getCategoriesAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM categories ORDER BY sort_order ASC;");
        if (Array.isArray(rows)) {
          return rows.map((c) => ({
            id: c.id,
            nameAr: c.name_ar,
            nameEn: c.name_en,
            slug: c.slug,
            sortOrder: c.sort_order,
            isActive: Boolean(c.is_active)
          }));
        }
      } catch (e) {
        console.error("D1 getCategoriesAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.getCategories();
  }
  // ==========================================
  // 2. USERS & CUSTOMERS (Pure D1 Authentication)
  // ==========================================
  getUsers() {
    return this.tables.users;
  }
  async getUsersAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM users;");
        if (Array.isArray(rows)) {
          const userAccounts = rows.map((r) => this.mapD1UserToUser(r));
          this.tables.users = userAccounts;
          return userAccounts;
        }
      } catch (e) {
        console.error("D1 getUsersAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.getUsers();
  }
  findUserById(id) {
    return this.tables.users.find((u) => u.id === id);
  }
  async findUserByIdAsync(id) {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM users WHERE id = ? LIMIT 1;", [id]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1UserToUser(rows[0]);
          }
          return void 0;
        }
      } catch (e) {
        console.error("D1 findUserByIdAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.findUserById(id);
  }
  findUserByPhone(phone) {
    const clean = phone.replace(/\D/g, "");
    return this.tables.users.find((u) => u.phone.replace(/\D/g, "") === clean);
  }
  async findUserByPhoneAsync(phone) {
    const clean = phone.replace(/\D/g, "");
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM users WHERE phone = ? LIMIT 1;", [clean]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1UserToUser(rows[0]);
          }
          return void 0;
        }
      } catch (e) {
        console.error("D1 findUserByPhoneAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.findUserByPhone(phone);
  }
  addUser(user) {
    const existing = this.findUserById(user.id) || this.findUserByPhone(user.phone);
    if (existing) {
      Object.assign(existing, user);
      this.saveLocal();
      return existing;
    }
    this.tables.users.push(user);
    this.saveLocal();
    return user;
  }
  async addUserAsync(user) {
    const clean = user.phone.replace(/\D/g, "");
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO users (id, name, phone, role, pin_hash, password_hash, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET name = excluded.name, last_login = excluded.last_login;`,
        [user.id, user.name, clean, user.role, user.pinHash || null, user.passwordHash || null, user.createdAt || (/* @__PURE__ */ new Date()).toISOString(), user.lastLogin || (/* @__PURE__ */ new Date()).toISOString()]
      );
      const readBack = await this.findUserByPhoneAsync(clean);
      if (readBack) {
        const idx = this.tables.users.findIndex((u) => u.phone.replace(/\D/g, "") === clean || u.id === user.id);
        if (idx >= 0) this.tables.users[idx] = readBack;
        else this.tables.users.push(readBack);
        return readBack;
      }
      throw new Error("\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.addUser(user);
  }
  updateUser(id, updates) {
    const user = this.tables.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.saveLocal();
    return user;
  }
  async updateUserAsync(id, updates) {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE users SET name = COALESCE(?, name), pin_hash = COALESCE(?, pin_hash), password_hash = COALESCE(?, password_hash), last_login = COALESCE(?, last_login) WHERE id = ?;`,
        [updates.name || null, updates.pinHash || null, updates.passwordHash || null, updates.lastLogin || null, id]
      );
      const readBack = await this.findUserByIdAsync(id);
      if (readBack) {
        const idx = this.tables.users.findIndex((u) => u.id === id);
        if (idx >= 0) this.tables.users[idx] = readBack;
        return readBack;
      }
      return null;
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.updateUser(id, updates);
  }
  getCustomers() {
    return this.tables.customers;
  }
  async getCustomersAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM customers ORDER BY total_orders DESC;");
        if (Array.isArray(rows)) {
          const custs = rows.map((r) => this.mapD1CustomerToCustomer(r));
          this.tables.customers = custs;
          return custs;
        }
      } catch (e) {
        console.error("D1 getCustomersAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0633\u062C\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.getCustomers();
  }
  findOrCreateCustomer(name, phone, district) {
    const cleanPhone = phone.replace(/\D/g, "");
    let cust = this.tables.customers.find((c) => c.phone.replace(/\D/g, "") === cleanPhone);
    if (!cust) {
      cust = {
        id: `cust-${cleanPhone}`,
        name: name.trim(),
        phone: cleanPhone,
        district: district || "\u0635\u0646\u0639\u0627\u0621",
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.tables.customers.push(cust);
      this.saveLocal();
    } else {
      if (name && name !== "\u0639\u0645\u064A\u0644 \u0632\u0627\u0626\u0631") {
        cust.name = name.trim();
      }
      if (district) {
        cust.district = district;
      }
      cust.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      this.saveLocal();
    }
    return cust;
  }
  async findOrCreateCustomerAsync(name, phone, district) {
    const cleanPhone = phone.replace(/\D/g, "");
    const custId = `cust-${cleanPhone}`;
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO customers (id, name, phone, district, total_orders, total_spent, loyalty_points, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 0, 0, datetime('now'), datetime('now')) ON CONFLICT(phone) DO UPDATE SET name = CASE WHEN ? != '' AND ? != '\u0639\u0645\u064A\u0644 \u0632\u0627\u0626\u0631' THEN ? ELSE customers.name END, district = COALESCE(?, customers.district), updated_at = datetime('now');`,
        [custId, name.trim(), cleanPhone, district || "\u0635\u0646\u0639\u0627\u0621", name.trim(), name.trim(), name.trim(), district || null]
      );
      const rows = await this.executeCloudflareD1Query("SELECT * FROM customers WHERE phone = ? LIMIT 1;", [cleanPhone]);
      if (Array.isArray(rows) && rows.length > 0) {
        const cust = this.mapD1CustomerToCustomer(rows[0]);
        const idx = this.tables.customers.findIndex((c) => c.phone.replace(/\D/g, "") === cleanPhone);
        if (idx >= 0) this.tables.customers[idx] = cust;
        else this.tables.customers.push(cust);
        return cust;
      }
      throw new Error("\u0641\u0634\u0644 \u062A\u0633\u062C\u064A\u0644 \u0623\u0648 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0639\u0645\u064A\u0644 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.findOrCreateCustomer(name, phone, district);
  }
  // ==========================================
  // 3. ORDERS & RELATIONAL ORDER ITEMS
  // ==========================================
  getOrders() {
    return this.tables.orders;
  }
  async getOrdersAsync(filter) {
    if (this.isD1Configured()) {
      try {
        let sql = "SELECT * FROM orders";
        const params = [];
        const conditions = [];
        if (filter?.phone) {
          conditions.push("customer_phone = ?");
          params.push(filter.phone.replace(/\D/g, ""));
        }
        if (filter?.driverId) {
          conditions.push("driver_id = ?");
          params.push(filter.driverId);
        }
        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }
        sql += " ORDER BY created_at DESC;";
        const rows = await this.executeCloudflareD1Query(sql, params);
        if (Array.isArray(rows)) {
          return rows.map((r) => this.mapD1OrderToOrder(r));
        }
      } catch (e) {
        console.error("D1 getOrdersAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    let result = this.tables.orders;
    if (filter?.phone) {
      const clean = filter.phone.replace(/\D/g, "");
      result = result.filter((o) => o.customerPhone.replace(/\D/g, "") === clean);
    }
    if (filter?.driverId) {
      result = result.filter((o) => o.driverId === filter.driverId);
    }
    return result;
  }
  findOrderById(id) {
    return this.tables.orders.find((o) => o.id === id || o.orderNumber === id);
  }
  async findOrderByIdAsync(id) {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query(
          "SELECT * FROM orders WHERE id = ? OR order_number = ? LIMIT 1;",
          [id, id]
        );
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            return this.mapD1OrderToOrder(rows[0]);
          }
          return void 0;
        }
      } catch (e) {
        console.error("D1 findOrderByIdAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0644\u0628\u062D\u062B \u0639\u0646 \u0627\u0644\u0637\u0644\u0628 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.findOrderById(id);
  }
  getOrderItems(orderId) {
    return this.tables.order_items.filter((oi) => oi.orderId === orderId);
  }
  async getOrderItemsAsync(orderId) {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query(
          "SELECT * FROM order_items WHERE order_id = ?;",
          [orderId]
        );
        if (Array.isArray(rows)) {
          return rows.map((r) => ({
            id: r.id,
            orderId: r.order_id,
            productId: r.product_id || r.productId,
            productNameAr: r.product_name_ar,
            productNameEn: r.product_name_en,
            weightOption: r.weight_option,
            quantity: r.quantity,
            unitPrice: r.unit_price,
            totalPrice: r.total_price,
            createdAt: r.created_at
          }));
        }
      } catch (e) {
        console.error("D1 getOrderItemsAsync error:", e);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.getOrderItems(orderId);
  }
  async createOrderAtomic(orderData) {
    const cleanPhone = orderData.customerPhone.replace(/\D/g, "");
    if (orderData.idempotencyKey) {
      if (this.isD1Configured()) {
        const existingD1 = await this.executeCloudflareD1Query(
          "SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1;",
          [orderData.idempotencyKey]
        );
        if (Array.isArray(existingD1) && existingD1.length > 0) {
          const row = existingD1[0];
          const existingOrder = {
            id: row.id,
            orderNumber: row.order_number,
            date: row.created_at,
            createdAt: row.created_at,
            status: row.status,
            items: typeof row.items_json === "string" ? JSON.parse(row.items_json || "[]") : row.items_json || [],
            subtotal: row.subtotal,
            shippingFee: row.shipping_fee || 0,
            discount: row.discount || 0,
            total: row.total,
            totalAmount: row.total,
            district: row.delivery_district,
            address: {
              id: `addr-${row.id}`,
              title: row.delivery_district,
              district: row.delivery_district,
              street: row.delivery_address,
              phone: row.customer_phone,
              isDefault: true
            },
            customerName: row.customer_name,
            customerPhone: row.customer_phone,
            paymentMethod: row.payment_method,
            notes: row.notes || "",
            driverId: row.driver_id,
            driverName: row.driver_name,
            driverPhone: row.driver_phone,
            timeline: typeof row.timeline_json === "string" ? JSON.parse(row.timeline_json || "[]") : row.timeline_json || [],
            idempotencyKey: row.idempotency_key
          };
          return { success: true, order: existingOrder, isDuplicate: true, message: "\u0637\u0644\u0628 \u0645\u0643\u0631\u0631 \u062A\u0645 \u0625\u0646\u0634\u0627\u0624\u0647 \u0645\u0633\u0628\u0642\u0627\u064B" };
        }
      }
      const existingMem = this.tables.orders.find((o) => o.idempotencyKey === orderData.idempotencyKey);
      if (existingMem) {
        return { success: true, order: existingMem, isDuplicate: true, message: "\u0637\u0644\u0628 \u0645\u0643\u0631\u0631 \u062A\u0645 \u0625\u0646\u0634\u0627\u0624\u0647 \u0645\u0633\u0628\u0642\u0627\u064B" };
      }
    }
    if (this.isD1Configured()) {
      const batchStatements = [];
      for (const it of orderData.validatedItems) {
        batchStatements.push({
          sql: "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?;",
          params: [it.quantity, it.productId]
        });
        batchStatements.push({
          sql: "UPDATE inventory SET current_stock = current_stock - ?, updated_at = datetime('now') WHERE product_id = ?;",
          params: [it.quantity, it.productId]
        });
      }
      const customerId = `cust-${cleanPhone}`;
      batchStatements.push({
        sql: `INSERT INTO customers (id, name, phone, district, street, notes, total_orders, total_spent, loyalty_points, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now')) ON CONFLICT(phone) DO UPDATE SET name = CASE WHEN ? != '' AND ? != '\u0639\u0645\u064A\u0644 \u0632\u0627\u0626\u0631' THEN ? ELSE customers.name END, district = COALESCE(?, customers.district), total_orders = customers.total_orders + 1, total_spent = customers.total_spent + ?, loyalty_points = customers.loyalty_points + ?, updated_at = datetime('now');`,
        params: [
          customerId,
          orderData.customerName,
          cleanPhone,
          orderData.address.district,
          orderData.address.street || "",
          orderData.notes || "",
          orderData.total,
          Math.floor(orderData.total / 100),
          orderData.customerName,
          orderData.customerName,
          orderData.customerName,
          orderData.address.district,
          orderData.total,
          Math.floor(orderData.total / 100)
        ]
      });
      batchStatements.push({
        sql: `INSERT INTO orders (id, order_number, customer_id, customer_name, customer_phone, delivery_district, delivery_address, items_json, subtotal, shipping_fee, discount, total, payment_method, payment_status, status, is_stock_rolled_back, idempotency_key, coupon_code, driver_id, driver_name, driver_phone, notes, driver_notes, timeline_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'received', 0, ?, ?, ?, ?, ?, ?, '', ?, datetime('now'), datetime('now'));`,
        params: [
          orderData.orderId,
          orderData.orderNumber,
          customerId,
          orderData.customerName,
          cleanPhone,
          orderData.address.district,
          orderData.address.street || orderData.address.district,
          JSON.stringify(orderData.validatedItems),
          orderData.subtotal,
          orderData.shippingFee,
          orderData.discount,
          orderData.total,
          orderData.paymentMethod || "cash",
          orderData.idempotencyKey || null,
          orderData.couponCode || null,
          orderData.assignedDriver?.id || "dr-unassigned",
          orderData.assignedDriver?.name || "\u063A\u064A\u0631 \u0645\u0633\u0646\u062F",
          orderData.assignedDriver?.phone || "",
          orderData.notes || "",
          JSON.stringify(orderData.timeline)
        ]
      });
      for (const it of orderData.validatedItems) {
        const itemRowId = `oi-${orderData.orderId}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`;
        batchStatements.push({
          sql: `INSERT INTO order_items (id, order_id, product_id, productId, product_name_ar, product_name_en, weight_option, quantity, unit_price, total_price, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
          params: [itemRowId, orderData.orderId, it.productId, it.productId, it.productNameAr, it.productNameEn || "", it.weight, it.quantity, it.unitPrice, it.unitPrice * it.quantity]
        });
        const currentProd = this.findProductById(it.productId);
        const prevStock = currentProd ? currentProd.stock : 0;
        const newStock = Math.max(0, prevStock - it.quantity);
        const logId = `tx-sale-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;
        batchStatements.push({
          sql: `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?, '\u0646\u0638\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0630\u0631\u064A', datetime('now'));`,
          params: [logId, it.productId, it.productNameAr, -it.quantity, prevStock, newStock, `\u0645\u0628\u064A\u0639\u0627\u062A \u0637\u0644\u0628 \u062C\u062F\u064A\u062F #${orderData.orderNumber}`, orderData.orderId]
        });
      }
      if (orderData.couponCode) {
        batchStatements.push({
          sql: "UPDATE coupons SET usage_count = usage_count + 1 WHERE UPPER(code) = UPPER(?);",
          params: [orderData.couponCode]
        });
      }
      const batchRes = await this.executeCloudflareD1BatchRaw(batchStatements);
      if (!batchRes.success) {
        const errStr = (batchRes.errors || []).map((e) => e.message).join("; ");
        let arabicErr = "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0644\u0639\u062F\u0645 \u062A\u0648\u0641\u0631 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0643\u0627\u0641\u064A \u0644\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.";
        if (errStr.includes("Insufficient stock") || errStr.includes("prevent_negative_stock") || errStr.includes("CHECK constraint failed")) {
          arabicErr = "\u0639\u0630\u0631\u0627\u064B! \u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B.";
        } else if (errStr.includes("Coupon usage limit") || errStr.includes("prevent_coupon_overuse")) {
          arabicErr = "\u0639\u0630\u0631\u0627\u064B! \u0648\u0635\u0644 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0645\u0631\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627.";
        }
        return { success: false, message: arabicErr };
      }
      const createdFromD1 = await this.findOrderByIdAsync(orderData.orderId);
      if (createdFromD1) {
        this.tables.orders.unshift(createdFromD1);
        for (const it of orderData.validatedItems) {
          const p = this.findProductById(it.productId);
          const prev = p ? p.stock : 0;
          const next = Math.max(0, prev - it.quantity);
          if (p) p.stock = next;
          const inv = this.tables.inventory.get(it.productId);
          if (inv) {
            inv.currentStock = next;
            inv.lastCountedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
          this.tables.inventory_logs.unshift({
            id: `tx-sale-${Date.now()}-${it.productId}`,
            productId: it.productId,
            productName: it.productNameAr,
            type: "sale",
            quantity: -it.quantity,
            previousStock: prev,
            newStock: next,
            reason: `\u0645\u0628\u064A\u0639\u0627\u062A \u0637\u0644\u0628 \u062C\u062F\u064A\u062F #${orderData.orderNumber}`,
            orderId: orderData.orderId,
            performedBy: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0630\u0631\u064A",
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        }
        return { success: true, order: createdFromD1 };
      }
      return { success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1" };
    }
    if (process.env.NODE_ENV === "production") {
      return { success: false, message: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C" };
    }
    for (const it of orderData.validatedItems) {
      const p = this.findProductById(it.productId);
      if (!p || p.stock < it.quantity) {
        return {
          success: false,
          message: `\u0639\u0630\u0631\u0627\u064B! \u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0645\u0646 "${it.productNameAr}" \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B.`
        };
      }
    }
    if (orderData.couponCode) {
      const c = this.findCoupon(orderData.couponCode);
      if (c && c.maxUses && c.usageCount >= c.maxUses) {
        return {
          success: false,
          message: "\u0639\u0630\u0631\u0627\u064B! \u0648\u0635\u0644 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0644\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0645\u0631\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627."
        };
      }
    }
    for (const it of orderData.validatedItems) {
      const p = this.findProductById(it.productId);
      if (p) {
        p.stock = Math.max(0, p.stock - it.quantity);
      }
      const inv = this.tables.inventory.get(it.productId);
      if (inv) {
        inv.currentStock = Math.max(0, inv.currentStock - it.quantity);
        inv.lastCountedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    const newOrder = {
      id: orderData.orderId,
      orderNumber: orderData.orderNumber,
      date: orderData.date,
      createdAt: orderData.date,
      status: "pending",
      items: orderData.validatedItems,
      subtotal: orderData.subtotal,
      shippingFee: orderData.shippingFee,
      discount: orderData.discount,
      total: orderData.total,
      totalAmount: orderData.total,
      district: orderData.address.district,
      address: {
        id: `addr-${orderData.orderId}`,
        title: orderData.address.district,
        district: orderData.address.district,
        street: orderData.address.street || orderData.address.district,
        phone: cleanPhone,
        isDefault: true
      },
      customerName: orderData.customerName,
      customerPhone: cleanPhone,
      paymentMethod: orderData.paymentMethod || "cash",
      notes: orderData.notes || "",
      driverId: orderData.assignedDriver?.id || "dr-unassigned",
      driverName: orderData.assignedDriver?.name || "\u063A\u064A\u0631 \u0645\u0633\u0646\u062F",
      driverPhone: orderData.assignedDriver?.phone || "",
      timeline: orderData.timeline,
      idempotencyKey: orderData.idempotencyKey,
      isStockRolledBack: false
    };
    this.tables.orders.unshift(newOrder);
    for (const it of orderData.validatedItems) {
      this.tables.order_items.push({
        id: `oi-${orderData.orderId}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`,
        orderId: orderData.orderId,
        productId: it.productId,
        productNameAr: it.productNameAr,
        productNameEn: "Black Gold Premium Charcoal",
        weightOption: it.weight || "250g",
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.unitPrice * it.quantity,
        createdAt: orderData.date
      });
    }
    const cust = this.findOrCreateCustomer(orderData.customerName, cleanPhone, orderData.address.district);
    cust.totalOrders += 1;
    cust.totalSpent += orderData.total;
    cust.loyaltyPoints += Math.floor(orderData.total / 100);
    return { success: true, order: newOrder };
  }
  addOrder(order) {
    this.tables.orders.unshift(order);
    if (order.items && Array.isArray(order.items)) {
      for (const it of order.items) {
        const itemRecord = {
          id: `oi-${order.id}-${it.productId}-${Math.random().toString(36).substring(2, 7)}`,
          orderId: order.id,
          productId: it.productId,
          productNameAr: it.productNameAr,
          productNameEn: "Black Gold Premium Charcoal",
          weightOption: it.weight || "250g",
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.unitPrice * it.quantity,
          createdAt: order.date || (/* @__PURE__ */ new Date()).toISOString()
        };
        this.tables.order_items.push(itemRecord);
      }
    }
    if (order.customerPhone) {
      const cust = this.findOrCreateCustomer(order.customerName, order.customerPhone, order.address?.district);
      cust.totalOrders += 1;
      cust.totalSpent += order.total;
      cust.loyaltyPoints += Math.floor(order.total / 100);
      cust.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.tables.payments.push({
      id: `pay-${order.id}`,
      orderId: order.id,
      amount: order.total,
      method: order.paymentMethod || "cash",
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.tables.notifications.unshift({
      id: `notif-${Date.now()}`,
      recipientRole: "admin",
      title: "\u0637\u0644\u0628 \u062C\u062F\u064A\u062F \u0648\u0627\u0631\u062F",
      message: `\u0637\u0644\u0628 \u062C\u062F\u064A\u062F #${order.orderNumber} \u0628\u0642\u064A\u0645\u0629 ${order.total.toLocaleString()} \u0631.\u064A \u0645\u0646 ${order.customerName}`,
      type: "order",
      isRead: false,
      link: `/admin/orders/${order.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.saveLocal();
    return order;
  }
  /**
   * Execute Stock Rollback when an order is cancelled
   * Guaranteed idempotency to prevent double-restoration of inventory
   */
  async executeStockRollback(order, actor = "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A") {
    if (order.isStockRolledBack) {
      console.log(`[D1 Stock Rollback] Order ${order.id} was already rolled back previously. Skipping.`);
      return false;
    }
    const alreadyLogged = this.tables.inventory_logs.some(
      (log) => log.orderId === order.id && log.type === "STOCK_ROLLBACK"
    );
    if (alreadyLogged) {
      order.isStockRolledBack = true;
      console.log(`[D1 Stock Rollback] Audit log already contains rollback for order ${order.id}. Skipping duplicate.`);
      return false;
    }
    if (this.isD1Configured()) {
      const rollbackRes = await this.executeCloudflareD1Raw(
        "UPDATE orders SET is_stock_rolled_back = 1, status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE (id = ? OR order_number = ?) AND (is_stock_rolled_back = 0 OR is_stock_rolled_back IS NULL);",
        [order.id, order.orderNumber || order.id]
      );
      const changes = rollbackRes.result?.[0]?.meta?.changes ?? 0;
      if (!rollbackRes.success || changes === 0) {
        order.isStockRolledBack = true;
        console.log(`[D1 Stock Rollback] Order ${order.id} was already marked rolled back in D1. Skipping duplicate.`);
        return false;
      }
    }
    let itemsToRollback = order.items;
    if (!itemsToRollback || itemsToRollback.length === 0) {
      const relationalItems = await this.getOrderItemsAsync(order.id);
      if (relationalItems && relationalItems.length > 0) {
        itemsToRollback = relationalItems.map((ri) => ({
          productId: ri.productId,
          productNameAr: ri.productNameAr,
          weight: ri.weightOption,
          quantity: ri.quantity,
          unitPrice: ri.unitPrice
        }));
      }
    }
    if (!itemsToRollback || itemsToRollback.length === 0) {
      console.warn(`[D1 Stock Rollback] No items found to rollback for order ${order.id}`);
      this.saveLocal();
      return true;
    }
    const rollbackBatch = [];
    const memoryUpdates = [];
    for (const it of itemsToRollback) {
      const product = await this.findProductByIdAsync(it.productId);
      const prevStock = product ? product.stock : 0;
      const restoredQty = Number(it.quantity) || 1;
      const newStock = prevStock + restoredQty;
      const logId = `tx-rollback-${Date.now()}-${it.productId}-${Math.random().toString(36).substring(2, 6)}`;
      if (this.isD1Configured()) {
        rollbackBatch.push({
          sql: "UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?;",
          params: [restoredQty, it.productId]
        });
        rollbackBatch.push({
          sql: "UPDATE inventory SET current_stock = current_stock + ?, updated_at = datetime('now') WHERE product_id = ?;",
          params: [restoredQty, it.productId]
        });
        rollbackBatch.push({
          sql: `INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) VALUES (?, ?, ?, 'STOCK_ROLLBACK', ?, ?, ?, ?, ?, ?, datetime('now'));`,
          params: [logId, it.productId, it.productNameAr, restoredQty, prevStock, newStock, `\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0645\u062E\u0632\u0648\u0646 \u0644\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 #${order.orderNumber || order.id}`, order.id, actor]
        });
      }
      memoryUpdates.push({
        product,
        newStock,
        logRecord: {
          id: logId,
          productId: it.productId,
          productName: it.productNameAr,
          type: "STOCK_ROLLBACK",
          quantity: restoredQty,
          previousStock: prevStock,
          newStock,
          reason: `\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0645\u062E\u0632\u0648\u0646 \u0644\u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 #${order.orderNumber || order.id}`,
          orderId: order.id,
          performedBy: actor || "\u0646\u0638\u0627\u0645 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    }
    const appliedCoupon = order.couponCode || order.coupon_code;
    if (appliedCoupon && this.isD1Configured()) {
      rollbackBatch.push({
        sql: "UPDATE coupons SET usage_count = MAX(0, usage_count - 1) WHERE UPPER(code) = UPPER(?);",
        params: [appliedCoupon]
      });
    }
    if (this.isD1Configured()) {
      rollbackBatch.push({
        sql: "UPDATE orders SET is_stock_rolled_back = 1, status = 'cancelled', cancelled_at = datetime('now'), updated_at = datetime('now') WHERE id = ? OR order_number = ?;",
        params: [order.id, order.orderNumber || order.id]
      });
    }
    if (this.isD1Configured() && rollbackBatch.length > 0) {
      await this.executeCloudflareD1BatchRaw(rollbackBatch);
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    order.isStockRolledBack = true;
    order.status = "cancelled";
    order.cancelledAt = (/* @__PURE__ */ new Date()).toISOString();
    if (appliedCoupon) {
      const c = this.tables.coupons.find((cp) => cp.code.toUpperCase() === appliedCoupon.toUpperCase());
      if (c && c.usageCount && c.usageCount > 0) {
        c.usageCount--;
      }
    }
    for (const update of memoryUpdates) {
      if (update.product) {
        update.product.stock = update.newStock;
      }
      const inv = this.tables.inventory.get(update.logRecord.productId);
      if (inv) {
        inv.currentStock = update.newStock;
        inv.lastCountedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      this.tables.inventory_logs.unshift(update.logRecord);
    }
    const pay = this.tables.payments.find((p) => p.orderId === order.id);
    if (pay && pay.status !== "confirmed") {
      pay.status = "failed";
      pay.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    this.tables.notifications.unshift({
      id: `notif-cancel-${Date.now()}`,
      recipientRole: "admin",
      title: "\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0645\u062E\u0632\u0648\u0646 - \u0625\u0644\u063A\u0627\u0621 \u0637\u0644\u0628",
      message: `\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 #${order.orderNumber || order.id} \u0648\u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u062A\u0644\u0642\u0627\u0626\u064A\u064B\u0627 \u0644\u0644\u0645\u062E\u0632\u0648\u0646`,
      type: "stock",
      isRead: false,
      link: `/admin/orders/${order.id}`,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    this.saveLocal();
    console.log(`\u2705 [D1 Stock Rollback] Successfully rolled back stock for Order ${order.orderNumber || order.id}`);
    return true;
  }
  async updateOrderDriverAsync(orderId, driverId, driverName, driverPhone) {
    const order = await this.findOrderByIdAsync(orderId) || this.findOrderById(orderId);
    if (!order) return null;
    const agents = await this.getDeliveryAgentsAsync();
    const verifiedAgent = agents.find((a) => a.id === driverId || driverName && a.name.trim() === driverName.trim());
    if (!verifiedAgent) {
      throw new Error("\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u0629");
    }
    const finalDriverId = verifiedAgent.id;
    const finalDriverName = verifiedAgent.name;
    const finalDriverPhone = verifiedAgent.phone;
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE orders SET driver_id = ?, driver_name = ?, driver_phone = ?, updated_at = datetime('now') WHERE id = ? OR order_number = ?;`,
        [finalDriverId, finalDriverName, finalDriverPhone, order.id, order.orderNumber || order.id]
      );
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    order.driverId = finalDriverId;
    order.driverName = finalDriverName;
    order.driverPhone = finalDriverPhone;
    const inMem = this.findOrderById(orderId);
    if (inMem) {
      inMem.driverId = finalDriverId;
      inMem.driverName = finalDriverName;
      inMem.driverPhone = finalDriverPhone;
    }
    this.saveLocal();
    return order;
  }
  async updateOrderStatus(orderId, status, driverNotes, actor = "\u0627\u0644\u0625\u062F\u0627\u0631\u0629", driverInfo) {
    const order = await this.findOrderByIdAsync(orderId) || this.findOrderById(orderId);
    if (!order) return null;
    const previousStatus = order.status;
    if (status !== previousStatus) {
      const allowedNext = VALID_ORDER_STATUS_TRANSITIONS[previousStatus];
      if (allowedNext && !allowedNext.includes(status)) {
        throw new Error(`\u0627\u0646\u062A\u0642\u0627\u0644 \u063A\u064A\u0631 \u0645\u0633\u0645\u0648\u062D \u0644\u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 (${previousStatus}) \u0625\u0644\u0649 (${status})`);
      }
    }
    if (status === "cancelled") {
      if (previousStatus !== "cancelled" && !order.isStockRolledBack) {
        await this.executeStockRollback(order, actor);
      }
    }
    let finalDriverId = order.driverId;
    let finalDriverName = order.driverName;
    let finalDriverPhone = order.driverPhone;
    if (driverInfo && driverInfo.driverId) {
      const agents = await this.getDeliveryAgentsAsync();
      const verified = agents.find((a) => a.id === driverInfo.driverId);
      if (!verified) {
        throw new Error("\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646");
      }
      finalDriverId = verified.id;
      finalDriverName = verified.name;
      finalDriverPhone = verified.phone;
    }
    const now = /* @__PURE__ */ new Date();
    const timeFormatted = now.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" });
    const newTimeline = [...order.timeline || []];
    const titleMap = {
      pending: { ar: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u0628\u0627\u0646\u062A\u0638\u0627\u0631 \u0627\u0644\u062A\u0623\u0643\u064A\u062F", en: "Order Pending" },
      received: { ar: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u0648\u062A\u0623\u0643\u064A\u062F\u0647 \u0628\u0627\u0644\u0646\u0638\u0627\u0645", en: "Order Received" },
      confirmed: { ar: "\u062A\u0645 \u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0637\u0644\u0628 \u0645\u0646 \u0627\u0644\u0625\u062F\u0627\u0631\u0629", en: "Order Confirmed" },
      assigned: { ar: `\u062A\u0645 \u062A\u0643\u0644\u064A\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 (${finalDriverName || "\u0627\u0644\u0645\u0639\u062A\u0645\u062F"}) \u0644\u0644\u062A\u0648\u0635\u064A\u0644`, en: "Driver Assigned" },
      preparing: { ar: "\u062C\u0627\u0631\u064A \u062A\u062C\u0647\u064A\u0632 \u0648\u062A\u0639\u0628\u0626\u0629 \u0627\u0644\u0641\u062D\u0645 \u0641\u064A \u0627\u0644\u0645\u0633\u062A\u0648\u062F\u0639", en: "Preparing Charcoal" },
      shipped: { ar: "\u062E\u0631\u062C \u0627\u0644\u0641\u062D\u0645 \u0645\u0639 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0644\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631", en: "Out for Delivery" },
      on_way: { ar: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u0649 \u0645\u0648\u0642\u0639 \u0627\u0644\u0639\u0645\u064A\u0644", en: "Driver On The Way" },
      delivering: { ar: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0641\u064A \u0627\u0644\u062D\u064A \u0648\u0642\u0631\u064A\u0628 \u0645\u0646 \u0645\u0648\u0642\u0639\u0643", en: "Near Delivery Location" },
      delivered: { ar: "\u062A\u0645 \u062A\u0633\u0644\u064A\u0645 \u0627\u0644\u0637\u0644\u0628 \u0644\u0644\u0639\u0645\u064A\u0644 \u0628\u0646\u062C\u0627\u062D", en: "Delivered Successfully" },
      completed: { ar: "\u062A\u0645 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0648\u062A\u0623\u0643\u064A\u062F \u0627\u0644\u0627\u0633\u062A\u0644\u0627\u0645 \u0646\u0647\u0627\u0626\u064A\u0627\u064B", en: "Order Completed" },
      cancelled: { ar: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0645\u062E\u0632\u0648\u0646", en: "Order Cancelled & Stock Rolled Back" }
    };
    const statusInfo = titleMap[status] || { ar: `\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062D\u0627\u0644\u0629 \u0625\u0644\u0649: ${status}`, en: `Status: ${status}` };
    newTimeline.push({
      status,
      time: timeFormatted,
      titleAr: statusInfo.ar,
      titleEn: statusInfo.en
    });
    if (this.isD1Configured()) {
      const compDateCol = status === "delivered" ? ", completed_at = datetime('now')" : status === "cancelled" ? ", cancelled_at = datetime('now')" : "";
      await this.executeCloudflareD1Query(
        `UPDATE orders SET status = ?, driver_notes = COALESCE(?, driver_notes), driver_id = COALESCE(?, driver_id), driver_name = COALESCE(?, driver_name), driver_phone = COALESCE(?, driver_phone), timeline_json = ?${compDateCol}, updated_at = datetime('now') WHERE id = ? OR order_number = ?;`,
        [status, driverNotes || null, finalDriverId || null, finalDriverName || null, finalDriverPhone || null, JSON.stringify(newTimeline), order.id, order.orderNumber || order.id]
      );
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    order.status = status;
    if (driverNotes) order.driverNotes = driverNotes;
    order.driverId = finalDriverId;
    order.driverName = finalDriverName;
    order.driverPhone = finalDriverPhone;
    order.timeline = newTimeline;
    if (status === "cancelled") order.isStockRolledBack = true;
    if (status === "delivered") {
      const pay = this.tables.payments.find((p) => p.orderId === order.id);
      if (pay) {
        pay.status = "confirmed";
        pay.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    const inMem = this.findOrderById(orderId);
    if (inMem) {
      inMem.status = status;
      if (driverNotes) inMem.driverNotes = driverNotes;
      if (finalDriverId) inMem.driverId = finalDriverId;
      if (finalDriverName) inMem.driverName = finalDriverName;
      if (finalDriverPhone) inMem.driverPhone = finalDriverPhone;
      inMem.timeline = newTimeline;
      if (status === "cancelled") inMem.isStockRolledBack = true;
    }
    this.saveLocal();
    return order;
  }
  // ==========================================
  // 4. INVENTORY & AUDIT LOGS
  // ==========================================
  getInventoryTransactions() {
    return this.tables.inventory_logs;
  }
  logInventoryTransaction(tx) {
    this.tables.inventory_logs.unshift(tx);
    this.saveLocal();
    return tx;
  }
  getInventoryStatus() {
    return Array.from(this.tables.inventory.entries()).map(([productId, data]) => {
      const prod = this.findProductById(productId);
      return {
        productId,
        productNameAr: prod?.nameAr || "\u0645\u0646\u062A\u062C",
        currentStock: data.currentStock,
        minThreshold: data.minThreshold,
        isLowStock: data.currentStock <= data.minThreshold,
        lastCountedAt: data.lastCountedAt
      };
    });
  }
  async adjustProductStock(params) {
    const product = this.findProductById(params.productId);
    if (!product) throw new Error("\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F");
    if (params.newStock < 0) {
      throw new Error("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0644\u0642\u064A\u0645\u0629 \u0633\u0627\u0644\u0628\u0629");
    }
    const txId = "tx-" + Date.now() + "-" + Math.floor(Math.random() * 1e3);
    if (this.isD1Configured()) {
      const batchResult = await this.executeCloudflareD1BatchRaw([
        {
          sql: "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?;",
          params: [params.newStock, params.productId]
        },
        {
          sql: "UPDATE inventory SET current_stock = ?, updated_at = datetime('now') WHERE product_id = ?;",
          params: [params.newStock, params.productId]
        },
        {
          sql: "INSERT INTO inventory_logs (id, product_id, product_name, type, quantity, previous_stock, new_stock, reason, order_id, performed_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));",
          params: [
            txId,
            params.productId,
            product.nameAr,
            params.type,
            params.quantity,
            params.previousStock,
            params.newStock,
            params.reason,
            params.orderId || null,
            params.performedBy
          ]
        }
      ]);
      if (!batchResult || !batchResult.success) {
        const errMsg = (batchResult?.errors || []).map((e) => e.message).join("; ") || "Batch inventory update failed";
        throw new Error(`\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0641\u064A Cloudflare D1: ${errMsg}`);
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    product.stock = params.newStock;
    product.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const inv = this.tables.inventory.get(params.productId);
    if (inv) {
      inv.currentStock = params.newStock;
      inv.lastCountedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    const logRecord = {
      id: txId,
      productId: params.productId,
      productName: product.nameAr,
      type: params.type,
      quantity: params.quantity,
      previousStock: params.previousStock,
      newStock: params.newStock,
      reason: params.reason,
      orderId: params.orderId,
      performedBy: params.performedBy,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.tables.inventory_logs.unshift(logRecord);
    this.saveLocal();
    return { product, transaction: logRecord };
  }
  async getInventoryTransactionsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 500;");
        if (Array.isArray(rows)) {
          return rows.map((l) => ({
            id: l.id,
            productId: l.product_id,
            productName: l.product_name,
            type: l.type,
            quantity: l.quantity,
            previousStock: l.previous_stock,
            newStock: l.new_stock,
            reason: l.reason,
            orderId: l.order_id || void 0,
            performedBy: l.performed_by,
            createdAt: l.created_at
          }));
        }
      } catch (err) {
        console.error("Error fetching inventory_logs from D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.tables.inventory_logs;
  }
  // ==========================================
  // 5. DELIVERY AGENTS
  // ==========================================
  getDeliveryAgents() {
    return this.tables.delivery_agents;
  }
  async getDeliveryAgentsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents;");
        if (Array.isArray(rows)) {
          const agents = rows.map((da) => ({
            id: da.id,
            name: da.name,
            phone: da.phone,
            vehicleType: da.vehicle_type || da.vehicle || "motorcycle",
            assignedDistricts: typeof da.assigned_districts === "string" ? JSON.parse(da.assigned_districts || "[]") : da.assigned_districts || [],
            completedOrdersCount: da.total_delivered_count || da.completed_orders_count || 0,
            rating: da.rating || 5,
            isActive: da.is_available !== void 0 ? Boolean(da.is_available) : da.is_active !== void 0 ? Boolean(da.is_active) : true
          }));
          this.tables.delivery_agents = agents;
          return agents;
        }
      } catch (err) {
        console.error("Error fetching delivery_agents from D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.tables.delivery_agents;
  }
  async updateDeliveryAgentsAsync(agents) {
    if (this.isD1Configured()) {
      for (const da of agents) {
        await this.executeCloudflareD1Query(
          `INSERT INTO delivery_agents (id, name, phone, vehicle_type, total_deliveries, rating, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET name = excluded.name, phone = excluded.phone, vehicle_type = excluded.vehicle_type, total_deliveries = excluded.total_deliveries, rating = excluded.rating, is_active = excluded.is_active;`,
          [
            da.id,
            da.name,
            da.phone,
            da.vehicleType,
            da.completedOrdersCount || 0,
            da.rating || 5,
            da.isActive ? 1 : 0
          ]
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    this.tables.delivery_agents = agents;
    this.saveLocal();
    return agents;
  }
  async findDeliveryAgentByIdAsync(id) {
    if (this.isD1Configured()) {
      const rows = await this.executeCloudflareD1Query("SELECT * FROM delivery_agents WHERE id = ? LIMIT 1;", [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        const da = rows[0];
        return {
          id: da.id,
          name: da.name,
          phone: da.phone,
          vehicleType: da.vehicle_type || da.vehicle || "motorcycle",
          assignedDistricts: typeof da.assigned_districts === "string" ? JSON.parse(da.assigned_districts || "[]") : da.assigned_districts || [],
          completedOrdersCount: da.total_deliveries || da.total_delivered_count || 0,
          rating: da.rating || 5,
          isActive: da.is_active !== void 0 ? Boolean(da.is_active) : da.is_available !== void 0 ? Boolean(da.is_available) : true
        };
      }
      return void 0;
    }
    return this.tables.delivery_agents.find((d) => d.id === id);
  }
  async addDeliveryAgentAsync(agent, pin) {
    const cleanPhone = agent.phone.replace(/\D/g, "");
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO delivery_agents (id, name, phone, vehicle_type, is_active, rating, total_deliveries, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET name = excluded.name, phone = excluded.phone, vehicle_type = excluded.vehicle_type, is_active = excluded.is_active, rating = excluded.rating;`,
        [agent.id, agent.name, cleanPhone, agent.vehicleType || "motorcycle", agent.isActive ? 1 : 0, agent.rating || 5, agent.completedOrdersCount || 0]
      );
      if (pin) {
        const hashed = hashSecret(normalizeDigits(pin).trim());
        await this.executeCloudflareD1Query(
          `INSERT INTO users (id, name, phone, role, pin_hash, created_at, last_login) VALUES (?, ?, ?, 'delivery', ?, datetime('now'), datetime('now')) ON CONFLICT(phone) DO UPDATE SET name = excluded.name, role = 'delivery', pin_hash = excluded.pin_hash;`,
          [agent.id, agent.name, cleanPhone, hashed]
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const idx = this.tables.delivery_agents.findIndex((d) => d.id === agent.id);
    if (idx !== -1) this.tables.delivery_agents[idx] = agent;
    else this.tables.delivery_agents.push(agent);
    this.saveLocal();
    return agent;
  }
  async updateDeliveryAgentAsync(id, updates, pin) {
    if (this.isD1Configured()) {
      const cleanPhone = updates.phone ? updates.phone.replace(/\D/g, "") : null;
      await this.executeCloudflareD1Query(
        `UPDATE delivery_agents SET name = COALESCE(?, name), phone = COALESCE(?, phone), vehicle_type = COALESCE(?, vehicle_type), is_active = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END WHERE id = ?;`,
        [
          updates.name ?? null,
          cleanPhone,
          updates.vehicleType ?? null,
          updates.isActive !== void 0 ? updates.isActive ? 1 : 0 : null,
          updates.isActive !== void 0 ? updates.isActive ? 1 : 0 : null,
          id
        ]
      );
      if (pin && cleanPhone) {
        const hashed = hashSecret(normalizeDigits(pin).trim());
        await this.executeCloudflareD1Query(
          `UPDATE users SET pin_hash = ? WHERE phone = ?;`,
          [hashed, cleanPhone]
        );
      }
      const readBack = await this.findDeliveryAgentByIdAsync(id);
      if (readBack) {
        const idx = this.tables.delivery_agents.findIndex((d2) => d2.id === id);
        if (idx !== -1) this.tables.delivery_agents[idx] = readBack;
        return readBack;
      }
      return null;
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const d = this.tables.delivery_agents.find((da) => da.id === id);
    if (!d) return null;
    Object.assign(d, updates);
    this.saveLocal();
    return d;
  }
  async deleteDeliveryAgentAsync(id) {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query("DELETE FROM delivery_agents WHERE id = ?;", [id]);
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    this.tables.delivery_agents = this.tables.delivery_agents.filter((d) => d.id !== id);
    this.saveLocal();
    return true;
  }
  // ==========================================
  // 6. REVIEWS & COUPONS
  // ==========================================
  getReviews() {
    return this.tables.reviews;
  }
  async getReviewsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM reviews ORDER BY created_at DESC;");
        if (Array.isArray(rows)) {
          return rows.map((rv) => ({
            id: rv.id,
            productId: rv.product_id,
            userName: rv.customer_name || rv.user_name || "\u0639\u0645\u064A\u0644",
            userPhone: rv.customer_phone || rv.user_phone || void 0,
            rating: rv.rating,
            comment: rv.comment,
            verifiedPurchase: Boolean(rv.is_verified ?? rv.verified_purchase),
            date: rv.created_at
          }));
        }
      } catch (err) {
        console.error("Error fetching reviews from D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.tables.reviews;
  }
  addReview(review) {
    this.tables.reviews.unshift(review);
    const prod = this.findProductById(review.productId);
    if (prod) {
      const prodReviews = this.tables.reviews.filter((r) => r.productId === review.productId);
      const totalScore = prodReviews.reduce((sum, r) => sum + r.rating, 0);
      prod.rating = Number((totalScore / prodReviews.length).toFixed(1));
      prod.reviewCount = prodReviews.length;
      this.updateProduct(prod.id, { rating: prod.rating, reviewCount: prod.reviewCount });
    }
    this.saveLocal();
    return review;
  }
  async addReviewAsync(review) {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO reviews (id, product_id, customer_name, customer_phone, rating, comment, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
        [review.id, review.productId, review.userName, review.userPhone || null, review.rating, review.comment, review.verifiedPurchase ? 1 : 0]
      );
      const stats = await this.executeCloudflareD1Query(
        "SELECT COUNT(*) as cnt, AVG(rating) as avg_rating FROM reviews WHERE product_id = ?;",
        [review.productId]
      );
      if (stats && stats.length > 0) {
        const revCount = Number(stats[0].cnt || 1);
        const avgRating = Number(Number(stats[0].avg_rating || review.rating).toFixed(1));
        await this.executeCloudflareD1Query(
          "UPDATE products SET rating = ?, review_count = ?, updated_at = datetime('now') WHERE id = ?;",
          [avgRating, revCount, review.productId]
        );
      }
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    this.addReview(review);
    return review;
  }
  getCoupons() {
    return this.tables.coupons;
  }
  async getCouponsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM coupons;");
        if (Array.isArray(rows)) {
          const coupons = rows.map((cp) => ({
            code: cp.code,
            discountPercent: cp.discount_percent,
            maxDiscount: cp.max_discount,
            minOrderAmount: cp.min_order_amount,
            isActive: Boolean(cp.is_active),
            validUntil: cp.valid_until || cp.expiry_date || void 0,
            usageCount: cp.usage_count || 0,
            maxUses: cp.max_uses !== void 0 && cp.max_uses !== null ? Number(cp.max_uses) : void 0
          }));
          this.tables.coupons = coupons;
          return coupons;
        }
      } catch (err) {
        console.error("Error fetching coupons from D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0643\u0648\u0628\u0648\u0646\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.tables.coupons;
  }
  findCoupon(code) {
    return this.tables.coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
  }
  async findCouponAsync(code) {
    const cleanCode = code.trim().toUpperCase();
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM coupons WHERE UPPER(code) = ? AND is_active = 1 LIMIT 1;", [cleanCode]);
        if (Array.isArray(rows)) {
          if (rows.length > 0) {
            const cp = rows[0];
            return {
              code: cp.code,
              discountPercent: cp.discount_percent,
              maxDiscount: cp.max_discount,
              minOrderAmount: cp.min_order_amount,
              isActive: Boolean(cp.is_active),
              validUntil: cp.valid_until || cp.expiry_date || void 0,
              usageCount: cp.usage_count || 0,
              maxUses: cp.max_uses !== void 0 && cp.max_uses !== null ? Number(cp.max_uses) : void 0
            };
          }
          return void 0;
        }
      } catch (err) {
        console.error("Error finding coupon in D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.findCoupon(cleanCode);
  }
  async addCouponAsync(coupon) {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO coupons (code, discount_percent, max_discount, min_order_amount, is_active, valid_until, usage_count, max_uses, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(code) DO UPDATE SET discount_percent = excluded.discount_percent, max_discount = excluded.max_discount, min_order_amount = excluded.min_order_amount, is_active = excluded.is_active, valid_until = excluded.valid_until, max_uses = excluded.max_uses;`,
        [
          coupon.code.toUpperCase(),
          coupon.discountPercent,
          coupon.maxDiscount || 0,
          coupon.minOrderAmount || 0,
          coupon.isActive !== false ? 1 : 0,
          coupon.validUntil || coupon.expiresAt || coupon.expiry_date || null,
          coupon.usageCount || 0,
          coupon.maxUses ?? 100
        ]
      );
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const existingIdx = this.tables.coupons.findIndex((c) => c.code.toUpperCase() === coupon.code.trim().toUpperCase());
    if (existingIdx >= 0) {
      this.tables.coupons[existingIdx] = coupon;
    } else {
      this.tables.coupons.push(coupon);
    }
    this.saveLocal();
    return coupon;
  }
  async updateCouponAsync(code, updates) {
    const cleanCode = code.trim().toUpperCase();
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE coupons SET discount_percent = COALESCE(?, discount_percent), max_discount = COALESCE(?, max_discount), min_order_amount = COALESCE(?, min_order_amount), is_active = CASE WHEN ? IS NOT NULL THEN ? ELSE is_active END, valid_until = COALESCE(?, valid_until), max_uses = COALESCE(?, max_uses) WHERE UPPER(code) = ?;`,
        [
          updates.discountPercent ?? null,
          updates.maxDiscount ?? null,
          updates.minOrderAmount ?? null,
          updates.isActive !== void 0 ? updates.isActive ? 1 : 0 : null,
          updates.isActive !== void 0 ? updates.isActive ? 1 : 0 : null,
          updates.validUntil ?? null,
          updates.maxUses ?? null,
          cleanCode
        ]
      );
      const rows = await this.executeCloudflareD1Query("SELECT * FROM coupons WHERE UPPER(code) = ? LIMIT 1;", [cleanCode]);
      if (Array.isArray(rows) && rows.length > 0) {
        const cp = rows[0];
        const updated = {
          code: cp.code,
          discountPercent: cp.discount_percent,
          maxDiscount: cp.max_discount,
          minOrderAmount: cp.min_order_amount,
          isActive: Boolean(cp.is_active),
          validUntil: cp.valid_until || cp.expiry_date || void 0,
          usageCount: cp.usage_count || 0,
          maxUses: cp.max_uses !== void 0 && cp.max_uses !== null ? Number(cp.max_uses) : void 0
        };
        const idx = this.tables.coupons.findIndex((c2) => c2.code.toUpperCase() === cleanCode);
        if (idx !== -1) this.tables.coupons[idx] = updated;
        else this.tables.coupons.push(updated);
        this.saveLocal();
        return updated;
      }
      return null;
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const c = this.tables.coupons.find((cp) => cp.code.toUpperCase() === cleanCode);
    if (!c) return null;
    Object.assign(c, updates);
    this.saveLocal();
    return c;
  }
  async deleteCouponAsync(code) {
    const cleanCode = code.trim().toUpperCase();
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query("DELETE FROM coupons WHERE UPPER(code) = ?;", [cleanCode]);
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    this.tables.coupons = this.tables.coupons.filter((c) => c.code.toUpperCase() !== cleanCode);
    this.saveLocal();
    return true;
  }
  // ==========================================
  // 7. STORE SETTINGS & GALLERY
  // ==========================================
  getSettings() {
    return this.tables.store_settings;
  }
  async getSettingsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM store_settings WHERE id = 'default_settings';");
        if (Array.isArray(rows) && rows.length > 0) {
          const st = rows[0];
          const districts = typeof st.delivery_districts === "string" ? JSON.parse(st.delivery_districts || "[]") : st.delivery_districts || this.tables.store_settings.deliveryDistricts;
          const mapped = {
            ...this.tables.store_settings,
            storeNameAr: st.store_name_ar || this.tables.store_settings.storeNameAr,
            storeNameEn: st.store_name_en || this.tables.store_settings.storeNameEn,
            sloganAr: st.slogan_ar || this.tables.store_settings.sloganAr,
            logoText: st.logo_text || this.tables.store_settings.logoText,
            customLogoUrl: st.custom_logo_url || this.tables.store_settings.customLogoUrl,
            topBannerNoticeAr: st.top_banner_notice_ar || this.tables.store_settings.topBannerNoticeAr,
            topBannerNoticeEn: st.top_banner_notice_en || this.tables.store_settings.topBannerNoticeEn,
            whatsappPhone: st.whatsapp_phone || this.tables.store_settings.whatsappPhone,
            whatsappNumber: st.whatsapp_phone || this.tables.store_settings.whatsappNumber,
            supportPhone: st.call_phone || this.tables.store_settings.supportPhone,
            supportEmail: st.contact_email || this.tables.store_settings.supportEmail,
            freeDeliveryThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeDeliveryThreshold),
            freeShippingThreshold: Number(st.free_delivery_threshold || this.tables.store_settings.freeShippingThreshold),
            defaultShippingFee: st.default_delivery_fee || this.tables.store_settings.defaultShippingFee,
            isOrderingEnabled: st.is_store_open !== void 0 ? Boolean(st.is_store_open) : true,
            deliveryDistricts: districts
          };
          this.tables.store_settings = mapped;
          return mapped;
        }
      } catch (err) {
        console.error("Error fetching store_settings from D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u062C\u0631 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.tables.store_settings;
  }
  updateSettings(newSettings) {
    this.tables.store_settings = { ...this.tables.store_settings, ...newSettings };
    this.saveLocal();
    return this.tables.store_settings;
  }
  async updateSettingsAsync(newSettings) {
    if (this.isD1Configured()) {
      const current = await this.getSettingsAsync();
      const merged = { ...current, ...newSettings };
      const storeNameAr = merged.storeNameAr || current.storeNameAr;
      const storeNameEn = merged.storeNameEn || current.storeNameEn;
      const sloganAr = merged.sloganAr || current.sloganAr || "";
      const logoText = merged.logoText || current.logoText || "";
      const customLogoUrl = merged.customLogoUrl || current.customLogoUrl || "";
      const topBannerNoticeAr = merged.topBannerNoticeAr || current.topBannerNoticeAr || "";
      const topBannerNoticeEn = merged.topBannerNoticeEn || current.topBannerNoticeEn || "";
      const whatsappPhone = merged.whatsappPhone || merged.whatsappNumber || current.whatsappPhone;
      const callPhone = merged.supportPhone || current.supportPhone;
      const contactEmail = merged.supportEmail || current.supportEmail || "";
      const freeDeliveryThreshold = Number(merged.freeDeliveryThreshold ?? merged.freeShippingThreshold ?? current.freeDeliveryThreshold ?? 8e3);
      const isStoreOpen = merged.isOrderingEnabled !== void 0 ? merged.isOrderingEnabled ? 1 : 0 : 1;
      const districtsJson = JSON.stringify(merged.deliveryDistricts || current.deliveryDistricts || []);
      await this.executeCloudflareD1Query(
        `INSERT INTO store_settings (id, store_name_ar, store_name_en, slogan_ar, logo_text, custom_logo_url, top_banner_notice_ar, top_banner_notice_en, whatsapp_phone, call_phone, contact_email, free_delivery_threshold, is_store_open, delivery_districts, updated_at) VALUES ('default_settings', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET store_name_ar = excluded.store_name_ar, store_name_en = excluded.store_name_en, slogan_ar = excluded.slogan_ar, logo_text = excluded.logo_text, custom_logo_url = excluded.custom_logo_url, top_banner_notice_ar = excluded.top_banner_notice_ar, top_banner_notice_en = excluded.top_banner_notice_en, whatsapp_phone = excluded.whatsapp_phone, call_phone = excluded.call_phone, contact_email = excluded.contact_email, free_delivery_threshold = excluded.free_delivery_threshold, is_store_open = excluded.is_store_open, delivery_districts = excluded.delivery_districts, updated_at = datetime('now');`,
        [
          storeNameAr,
          storeNameEn,
          sloganAr,
          logoText,
          customLogoUrl,
          topBannerNoticeAr,
          topBannerNoticeEn,
          whatsappPhone,
          callPhone,
          contactEmail,
          freeDeliveryThreshold,
          isStoreOpen,
          districtsJson
        ]
      );
      this.tables.store_settings = merged;
      this.saveLocal();
      return merged;
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const updated = this.updateSettings(newSettings);
    return updated;
  }
  getGalleryItems() {
    return this.tables.gallery_items;
  }
  async getGalleryItemsAsync() {
    if (this.isD1Configured()) {
      try {
        const rows = await this.executeCloudflareD1Query("SELECT * FROM gallery_items ORDER BY sort_order ASC, created_at DESC;");
        if (Array.isArray(rows)) {
          const items = rows.map((g) => ({
            id: g.id,
            titleAr: g.title_ar,
            titleEn: g.title_en || void 0,
            image: g.image_url || "",
            imageUrl: g.image_url,
            category: g.category || "factory",
            caption: g.caption || void 0,
            sortOrder: g.sort_order || 0,
            isActive: g.is_active !== void 0 ? Boolean(g.is_active) : true,
            createdAt: g.created_at
          }));
          this.tables.gallery_items = items;
          return items;
        }
      } catch (err) {
        console.error("Error fetching gallery_items from D1:", err);
      }
      if (process.env.NODE_ENV === "production") {
        throw new Error("\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0635\u0648\u0631 \u0627\u0644\u0645\u0639\u0631\u0636 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1");
      }
    }
    if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    return this.tables.gallery_items;
  }
  async addGalleryItemAsync(item) {
    const itemToAdd = {
      ...item,
      image: item.image || item.imageUrl || "",
      imageUrl: item.imageUrl || item.image || ""
    };
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `INSERT INTO gallery_items (id, title_ar, title_en, image_url, category, caption, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'));`,
        [
          itemToAdd.id,
          itemToAdd.titleAr,
          itemToAdd.titleEn || null,
          itemToAdd.imageUrl || itemToAdd.image,
          itemToAdd.category || "factory",
          itemToAdd.caption || null,
          itemToAdd.sortOrder || 0,
          itemToAdd.isActive !== false ? 1 : 0
        ]
      );
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    this.tables.gallery_items.push(itemToAdd);
    this.saveLocal();
    return itemToAdd;
  }
  async updateGalleryItemAsync(id, updates) {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query(
        `UPDATE gallery_items SET title_ar = COALESCE(?, title_ar), title_en = COALESCE(?, title_en), image_url = COALESCE(?, image_url), category = COALESCE(?, category), caption = COALESCE(?, caption), sort_order = COALESCE(?, sort_order), is_active = COALESCE(?, is_active) WHERE id = ?;`,
        [
          updates.titleAr || null,
          updates.titleEn || null,
          updates.imageUrl || updates.image || null,
          updates.category || null,
          updates.caption || null,
          updates.sortOrder !== void 0 ? updates.sortOrder : null,
          updates.isActive !== void 0 ? updates.isActive ? 1 : 0 : null,
          id
        ]
      );
      const rows = await this.executeCloudflareD1Query("SELECT * FROM gallery_items WHERE id = ? LIMIT 1;", [id]);
      if (Array.isArray(rows) && rows.length > 0) {
        const g = rows[0];
        const updatedItem = {
          id: g.id,
          titleAr: g.title_ar,
          titleEn: g.title_en || void 0,
          image: g.image_url || "",
          imageUrl: g.image_url,
          category: g.category || "factory",
          caption: g.caption || void 0,
          sortOrder: g.sort_order || 0,
          isActive: g.is_active !== void 0 ? Boolean(g.is_active) : true,
          createdAt: g.created_at
        };
        const idx2 = this.tables.gallery_items.findIndex((item) => item.id === id);
        if (idx2 !== -1) {
          this.tables.gallery_items[idx2] = updatedItem;
        } else {
          this.tables.gallery_items.push(updatedItem);
        }
        return updatedItem;
      }
      return null;
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    const idx = this.tables.gallery_items.findIndex((g) => g.id === id);
    if (idx !== -1) {
      this.tables.gallery_items[idx] = { ...this.tables.gallery_items[idx], ...updates };
      this.saveLocal();
      return this.tables.gallery_items[idx];
    }
    return null;
  }
  async deleteGalleryItemAsync(id) {
    if (this.isD1Configured()) {
      await this.executeCloudflareD1Query("DELETE FROM gallery_items WHERE id = ?;", [id]);
    } else if (process.env.NODE_ENV === "production") {
      throw new Error("\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u063A\u064A\u0631 \u0645\u0647\u064A\u0623\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 \u0627\u0644\u0625\u0646\u062A\u0627\u062C");
    }
    this.tables.gallery_items = this.tables.gallery_items.filter((g) => g.id !== id);
    this.saveLocal();
    return true;
  }
  getNotifications() {
    return this.tables.notifications;
  }
};
var d1 = new D1DatabaseAccessLayer();

// server/db.ts
var DatabaseProxy = class {
  // Products
  getProducts() {
    return d1.getProducts();
  }
  async getProductsAsync() {
    return d1.getProductsAsync();
  }
  findProductById(id) {
    return d1.findProductById(id);
  }
  async findProductByIdAsync(id) {
    return d1.findProductByIdAsync(id);
  }
  addProduct(p) {
    return d1.addProduct(p);
  }
  async addProductAsync(p) {
    return d1.addProductAsync(p);
  }
  updateProduct(id, p) {
    return d1.updateProduct(id, p);
  }
  async updateProductAsync(id, p) {
    return d1.updateProductAsync(id, p);
  }
  deleteProduct(id) {
    return d1.deleteProduct(id);
  }
  async deleteProductAsync(id) {
    return d1.deleteProductAsync(id);
  }
  getCategories() {
    return d1.getCategories();
  }
  async getCategoriesAsync() {
    return d1.getCategoriesAsync();
  }
  // Users
  getUsers() {
    return d1.getUsers();
  }
  async getUsersAsync() {
    return d1.getUsersAsync();
  }
  findUserById(id) {
    return d1.findUserById(id);
  }
  async findUserByIdAsync(id) {
    return d1.findUserByIdAsync(id);
  }
  findUserByPhone(phone) {
    return d1.findUserByPhone(phone);
  }
  async findUserByPhoneAsync(phone) {
    return d1.findUserByPhoneAsync(phone);
  }
  addUser(user) {
    return d1.addUser(user);
  }
  async addUserAsync(user) {
    return d1.addUserAsync(user);
  }
  updateUser(id, updates) {
    const user = d1.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }
  async updateUserAsync(id, updates) {
    return this.updateUser(id, updates);
  }
  // Customers (CRM)
  getCustomers() {
    return d1.getCustomers();
  }
  async getCustomersAsync() {
    return d1.getCustomersAsync();
  }
  findOrCreateCustomer(name, phone, district) {
    return d1.findOrCreateCustomer(name, phone, district);
  }
  // Orders
  getOrders() {
    return d1.getOrders();
  }
  async getOrdersAsync(filter) {
    return d1.getOrdersAsync(filter);
  }
  findOrderById(id) {
    return d1.findOrderById(id);
  }
  async findOrderByIdAsync(id) {
    return d1.findOrderByIdAsync(id);
  }
  getOrderItems(orderId) {
    return d1.getOrderItems(orderId);
  }
  async getOrderItemsAsync(orderId) {
    return d1.getOrderItemsAsync(orderId);
  }
  addOrder(order) {
    return d1.addOrder(order);
  }
  async createOrderAtomic(orderData) {
    return d1.createOrderAtomic(orderData);
  }
  async updateOrderStatus(id, status, driverNotes, actor, driverInfo) {
    return d1.updateOrderStatus(id, status, driverNotes, actor, driverInfo);
  }
  async updateOrderDriverAsync(id, driverId, driverName, driverPhone) {
    return d1.updateOrderDriverAsync(id, driverId, driverName, driverPhone);
  }
  updateOrderDriver(id, driverId, driverName, driverPhone) {
    const order = d1.findOrderById(id);
    if (!order) return null;
    order.driverId = driverId;
    order.driverName = driverName;
    order.driverPhone = driverPhone;
    return order;
  }
  // Reviews
  getReviews() {
    return d1.getReviews();
  }
  async getReviewsAsync() {
    return d1.getReviewsAsync();
  }
  addReview(review) {
    return d1.addReview(review);
  }
  async addReviewAsync(review) {
    return d1.addReviewAsync(review);
  }
  // Coupons
  getCoupons() {
    return d1.getCoupons();
  }
  async getCouponsAsync() {
    return d1.getCouponsAsync();
  }
  findCoupon(code) {
    return d1.findCoupon(code);
  }
  async findCouponAsync(code) {
    return d1.findCouponAsync(code);
  }
  addCoupon(coupon) {
    const existing = d1.getCoupons().find((c) => c.code.toUpperCase() === coupon.code.toUpperCase());
    if (existing) {
      Object.assign(existing, coupon);
      return existing;
    }
    d1.getCoupons().unshift(coupon);
    return coupon;
  }
  async addCouponAsync(coupon) {
    return d1.addCouponAsync(coupon);
  }
  deleteCoupon(code) {
    const coupons = d1.getCoupons();
    const idx = coupons.findIndex((c) => c.code.toUpperCase() === code.toUpperCase());
    if (idx !== -1) {
      coupons.splice(idx, 1);
      return true;
    }
    return false;
  }
  async deleteCouponAsync(code) {
    return d1.deleteCouponAsync(code);
  }
  async updateCouponAsync(code, updates) {
    return d1.updateCouponAsync(code, updates);
  }
  // Delivery Agents
  getDeliveryAgents() {
    return d1.getDeliveryAgents();
  }
  async getDeliveryAgentsAsync() {
    return d1.getDeliveryAgentsAsync();
  }
  async findDeliveryAgentByIdAsync(id) {
    return d1.findDeliveryAgentByIdAsync(id);
  }
  async addDeliveryAgentAsync(agent, pin) {
    return d1.addDeliveryAgentAsync(agent, pin);
  }
  async updateDeliveryAgentAsync(id, updates, pin) {
    return d1.updateDeliveryAgentAsync(id, updates, pin);
  }
  async deleteDeliveryAgentAsync(id) {
    return d1.deleteDeliveryAgentAsync(id);
  }
  updateDeliveryAgents(agents) {
    const current = d1.getDeliveryAgents();
    current.length = 0;
    current.push(...agents);
    return current;
  }
  async updateDeliveryAgentsAsync(agents) {
    return d1.updateDeliveryAgentsAsync(agents);
  }
  // Store Settings
  getSettings() {
    return d1.getSettings();
  }
  async getSettingsAsync() {
    return d1.getSettingsAsync();
  }
  updateSettings(settings) {
    return d1.updateSettings(settings);
  }
  async updateSettingsAsync(settings) {
    return d1.updateSettingsAsync(settings);
  }
  // Gallery Items
  getGalleryItems() {
    return d1.getGalleryItems();
  }
  async getGalleryItemsAsync() {
    return d1.getGalleryItemsAsync();
  }
  addGalleryItem(item) {
    d1.getGalleryItems().unshift(item);
    return item;
  }
  async addGalleryItemAsync(item) {
    return d1.addGalleryItemAsync(item);
  }
  updateGalleryItem(id, updates) {
    const item = d1.getGalleryItems().find((g) => g.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    return item;
  }
  async updateGalleryItemAsync(id, updates) {
    return d1.updateGalleryItemAsync(id, updates);
  }
  deleteGalleryItem(id) {
    const items = d1.getGalleryItems();
    const idx = items.findIndex((g) => g.id === id);
    if (idx !== -1) {
      items.splice(idx, 1);
      return true;
    }
    return false;
  }
  async deleteGalleryItemAsync(id) {
    return d1.deleteGalleryItemAsync(id);
  }
  // Inventory Transactions & Audit
  getInventoryTransactions() {
    return d1.getInventoryTransactions().map((tx) => ({
      id: tx.id,
      productId: tx.productId,
      productName: tx.productName,
      type: tx.type,
      quantity: tx.quantity,
      previousStock: tx.previousStock,
      newStock: tx.newStock,
      reason: tx.reason,
      orderId: tx.orderId,
      performedBy: tx.performedBy,
      date: tx.createdAt
    }));
  }
  async getInventoryTransactionsAsync() {
    const list = await d1.getInventoryTransactionsAsync();
    return list.map((tx) => ({
      id: tx.id,
      productId: tx.productId,
      productName: tx.productName,
      type: tx.type,
      quantity: tx.quantity,
      previousStock: tx.previousStock,
      newStock: tx.newStock,
      reason: tx.reason,
      orderId: tx.orderId,
      performedBy: tx.performedBy,
      date: tx.createdAt
    }));
  }
  logInventoryTransaction(tx) {
    d1.logInventoryTransaction({
      id: tx.id,
      productId: tx.productId,
      productName: tx.productName,
      type: tx.type,
      quantity: tx.quantity,
      previousStock: tx.previousStock,
      newStock: tx.newStock,
      reason: tx.reason,
      orderId: tx.orderId,
      performedBy: tx.performedBy,
      createdAt: tx.date || (/* @__PURE__ */ new Date()).toISOString()
    });
    return tx;
  }
  adjustProductStock(params) {
    return d1.adjustProductStock(params);
  }
  logAnalyticsEvent(event, data, userId) {
  }
  logAbandonedCart(cart) {
  }
  hasDeliveredOrderForProduct(customerPhone, productId) {
    if (!customerPhone) return false;
    const cleanPhone = customerPhone.replace(/\D/g, "");
    return d1.getOrders().some((order) => {
      const orderPhone = order.customerPhone?.replace(/\D/g, "");
      const isMatchPhone = orderPhone === cleanPhone;
      const isDelivered = order.status === "delivered";
      const hasProduct = order.items.some((it) => it.productId === productId);
      return isMatchPhone && isDelivered && hasProduct;
    });
  }
  async hasDeliveredOrderForProductAsync(customerPhone, productId) {
    if (!customerPhone) return false;
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const orders = await d1.getOrdersAsync({ phone: cleanPhone });
    return orders.some((order) => {
      const orderPhone = order.customerPhone?.replace(/\D/g, "");
      const isMatchPhone = orderPhone === cleanPhone;
      const isDelivered = order.status === "delivered";
      const hasProduct = order.items.some((it) => it.productId === productId);
      return isMatchPhone && isDelivered && hasProduct;
    });
  }
  async init() {
    await d1.init();
  }
};
var db = new DatabaseProxy();

// server.ts
var app = express();
var PORT = 3e3;
var UPLOADS_DIR = path2.join(process.cwd(), "public", "uploads");
if (!fs2.existsSync(UPLOADS_DIR)) {
  try {
    fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
  }
}
app.use("/uploads", express.static(UPLOADS_DIR));
app.use("/images", express.static(path2.join(process.cwd(), "public", "images")));
app.use("/src/assets/images", express.static(path2.join(process.cwd(), "src", "assets", "images")));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && (req.url.startsWith("/auth") || req.url.startsWith("/products") || req.url.startsWith("/orders") || req.url.startsWith("/coupons") || req.url.startsWith("/delivery-agents") || req.url.startsWith("/reviews") || req.url.startsWith("/settings") || req.url.startsWith("/d1") || req.url.startsWith("/inventory") || req.url.startsWith("/crm") || req.url.startsWith("/gallery") || req.url.startsWith("/gemini") || req.url.startsWith("/health"))) {
    req.url = `/api${req.url}`;
  }
  next();
});
app.get(["/api", "/api/index"], (req, res) => {
  res.json({
    success: true,
    message: "Black Gold Charcoal Store API Gateway is Running Successfully",
    database: "Cloudflare D1 (Authoritative)",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.get(["/api/health", "/health"], (req, res) => {
  res.json({
    success: true,
    status: "ok",
    database: "Cloudflare D1 (Authoritative)",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
var aiClient = null;
function getGeminiClient() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || req.headers["x-auth-token"];
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u062A\u0646\u0641\u064A\u0630 \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629" });
    }
    return next();
  };
}
app.use(authenticateUser);
var authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1e3,
  maxRequests: 30,
  message: "\u0639\u062F\u062F \u0645\u062D\u0627\u0648\u0644\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 15 \u062F\u0642\u064A\u0642\u0629 \u062B\u0645 \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629."
});
var orderRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1e3,
  maxRequests: 30,
  message: "\u062A\u0645 \u0627\u0633\u062A\u0642\u0628\u0627\u0644 \u0639\u062F\u062F \u0643\u0628\u064A\u0631 \u0645\u0646 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u0641\u064A \u0648\u0642\u062A \u0642\u0635\u064A\u0631. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B \u0648\u0627\u0644\u0645\u062D\u0627\u0648\u0644\u0629 \u0645\u062C\u062F\u062F\u0627\u064B."
});
var trackingRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1e3,
  maxRequests: 60,
  message: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0644\u0644\u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0639\u0646 \u0627\u0644\u0637\u0644\u0628\u0627\u062A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B."
});
var couponRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1e3,
  maxRequests: 40,
  message: "\u062A\u0645 \u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u062D\u062F \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0644\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0643\u0648\u0628\u0648\u0646\u0627\u062A. \u064A\u0631\u062C\u0649 \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0642\u0644\u064A\u0644\u0627\u064B."
});
app.post("/api/auth/quick-customer", authRateLimiter, async (req, res) => {
  try {
    const { phone, name } = req.body;
    const rawPhone = normalizeDigits(phone || "");
    const phoneValidation = validateYemeniPhone(rawPhone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u064A\u0645\u0646\u064A \u0635\u062D\u064A\u062D (\u0645\u062B\u0627\u0644: 77XXXXXXX \u0623\u0648 73XXXXXXX)" });
    }
    const cleanPhone = phoneValidation.normalized;
    const safeName = sanitizeInputString(name || "", 80) || `\u0639\u0645\u064A\u0644 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F (${cleanPhone.slice(-4)})`;
    let user = await db.findUserByPhoneAsync(cleanPhone);
    if (!user) {
      user = {
        id: "usr-" + Date.now(),
        name: safeName,
        phone: cleanPhone,
        role: "customer",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        lastLogin: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.addUserAsync(user);
    } else {
      user = await db.updateUserAsync(user.id, {
        name: safeName,
        lastLogin: (/* @__PURE__ */ new Date()).toISOString()
      }) || user;
    }
    const token = generateToken({
      userId: user.id,
      role: user.role,
      phone: user.phone,
      name: user.name
    });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Quick customer login error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0633\u0631\u064A\u0639"
    });
  }
});
app.post("/api/auth/admin-login", authRateLimiter, async (req, res) => {
  try {
    const { phone, pin, password } = req.body;
    if (!pin && !password) {
      return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0645\u0632 PIN \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u062F\u062E\u0648\u0644" });
    }
    const rawSecret = normalizeDigits(pin || password || "").trim();
    if (!rawSecret) {
      return res.status(400).json({ success: false, message: "\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0641\u0627\u0631\u063A\u0627\u064B" });
    }
    const cleanPhone = phone ? normalizeDigits(phone).replace(/\D/g, "") : "";
    const hashedInput = hashSecret(rawSecret);
    let allUsers = [];
    try {
      allUsers = await db.getUsersAsync();
    } catch (e) {
      console.warn("Could not fetch users directly from D1:", e?.message);
    }
    const users = allUsers.filter((u) => ["owner", "admin", "employee"].includes(u.role));
    let matchedUser = users.find((u) => {
      if (cleanPhone && u.phone.replace(/\D/g, "") !== cleanPhone) {
        return false;
      }
      const pinOk = u.pinHash ? timingSafeEqual(u.pinHash, hashedInput) || timingSafeEqual(u.pinHash, rawSecret) || u.pinHash === rawSecret : false;
      const passOk = u.passwordHash ? timingSafeEqual(u.passwordHash, hashedInput) || timingSafeEqual(u.passwordHash, rawSecret) || u.passwordHash === rawSecret : false;
      return pinOk || passOk;
    });
    if (matchedUser && matchedUser.pinHash && (matchedUser.pinHash === rawSecret || timingSafeEqual(matchedUser.pinHash, rawSecret))) {
      matchedUser.pinHash = hashedInput;
      db.updateUserAsync(matchedUser.id, { pinHash: hashedInput }).catch(() => {
      });
    }
    if (!matchedUser && (process.env.ADMIN_PIN || process.env.ADMIN_PASSWORD)) {
      const secureSecrets = [process.env.ADMIN_PIN, process.env.ADMIN_PASSWORD].filter(Boolean).map((p) => normalizeDigits(p).trim());
      const isPinMatch = secureSecrets.some(
        (sec) => timingSafeEqual(hashSecret(sec), hashedInput) || timingSafeEqual(sec, rawSecret) || sec === rawSecret
      );
      if (isPinMatch) {
        let owner = users.find((u) => u.role === "owner");
        if (!owner) {
          const adminPhone = cleanPhone || (process.env.ADMIN_PHONE ? normalizeDigits(process.env.ADMIN_PHONE.trim()) : "");
          if (!adminPhone) {
            return res.status(401).json({ success: false, message: "\u0644\u0645 \u064A\u062A\u0645 \u062A\u0643\u0648\u064A\u0646 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u0641\u064A \u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0645 (ADMIN_PHONE)" });
          }
          const adminName = process.env.ADMIN_NAME ? process.env.ADMIN_NAME.trim() : "\u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u062A\u062C\u0631";
          owner = {
            id: `usr-owner-${adminPhone}`,
            name: adminName,
            phone: adminPhone,
            role: "owner",
            pinHash: hashedInput,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          await db.addUserAsync(owner);
        } else {
          owner.pinHash = hashedInput;
          await db.updateUserAsync(owner.id, { pinHash: hashedInput });
        }
        matchedUser = owner;
      }
    }
    if (!matchedUser) {
      if (!d1.isD1Configured() && !process.env.ADMIN_PIN) {
        return res.status(401).json({
          success: false,
          message: "\u0645\u062A\u063A\u064A\u0631\u0627\u062A \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u0648\u0631\u0645\u0632 \u0627\u0644\u0625\u062F\u0627\u0631\u0629 \u063A\u064A\u0631 \u0645\u0643\u062A\u0645\u0644\u0629 \u0641\u064A \u0628\u064A\u0626\u0629 Vercel. \u064A\u0631\u062C\u0649 \u0625\u0636\u0627\u0641\u062A\u0647\u0627 \u0641\u064A Vercel Project Settings."
        });
      }
      return res.status(401).json({ success: false, message: "\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063A\u064A\u0631 \u0635\u062D\u064A\u062D\u0629" });
    }
    const token = generateToken({
      userId: matchedUser.id,
      role: matchedUser.role,
      phone: matchedUser.phone,
      name: matchedUser.name
    });
    res.json({
      success: true,
      token,
      user: {
        id: matchedUser.id,
        name: matchedUser.name,
        phone: matchedUser.phone,
        role: matchedUser.role
      }
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0625\u062F\u0627\u0631\u0629"
    });
  }
});
app.post("/api/auth/driver-login", authRateLimiter, async (req, res) => {
  try {
    const { phone, pin, password } = req.body;
    if (!phone || !pin && !password) {
      return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0648\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u0627\u0644\u0633\u0631\u064A (PIN)" });
    }
    const cleanPhone = normalizeDigits(phone).replace(/\D/g, "");
    const secret = normalizeDigits(pin || password || "").trim();
    if (!secret) {
      return res.status(400).json({ success: false, message: "\u0631\u0645\u0632 \u0627\u0644\u062F\u062E\u0648\u0644 \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0641\u0627\u0631\u063A\u0627\u064B" });
    }
    const hashedSecret = hashSecret(secret);
    const allUsers = await db.getUsersAsync();
    const drivers = allUsers.filter((u) => u.role === "delivery" || u.role === "mandoub");
    let matchedDriver = drivers.find((d) => {
      if (d.phone.replace(/\D/g, "") !== cleanPhone) return false;
      const pinMatch = d.pinHash ? timingSafeEqual(d.pinHash, hashedSecret) : false;
      const passMatch = d.passwordHash ? timingSafeEqual(d.passwordHash, hashedSecret) : false;
      return pinMatch || passMatch;
    });
    if (!matchedDriver) {
      const agents = await db.getDeliveryAgentsAsync();
      const matchedAgent = agents.find((a) => a.phone.replace(/\D/g, "") === cleanPhone);
      if (matchedAgent) {
        const envDriverPin = process.env.DRIVER_PIN ? normalizeDigits(process.env.DRIVER_PIN.trim()) : "";
        const envAdminPin = process.env.ADMIN_PIN ? normalizeDigits(process.env.ADMIN_PIN.trim()) : "";
        const isAgentSecretValid = matchedAgent.pinHash ? timingSafeEqual(matchedAgent.pinHash, hashedSecret) : matchedAgent.pin ? timingSafeEqual(hashSecret(normalizeDigits(String(matchedAgent.pin).trim())), hashedSecret) : false;
        const isEnvSecretValid = [envDriverPin, envAdminPin].filter(Boolean).some((p) => timingSafeEqual(hashSecret(p), hashedSecret));
        const isPinValid = isAgentSecretValid || isEnvSecretValid;
        if (isPinValid) {
          const existingUser = allUsers.find((u) => u.phone.replace(/\D/g, "") === cleanPhone);
          if (existingUser) {
            existingUser.role = "delivery";
            existingUser.pinHash = hashedSecret;
            matchedDriver = existingUser;
            await db.updateUserAsync(existingUser.id, { role: "delivery", pinHash: hashedSecret });
          } else {
            matchedDriver = {
              id: matchedAgent.id || `dr-${cleanPhone}`,
              name: matchedAgent.name,
              phone: matchedAgent.phone,
              role: "delivery",
              pinHash: hashedSecret,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            };
            await db.addUserAsync(matchedDriver);
          }
        }
      }
    }
    if (!matchedDriver) {
      return res.status(401).json({ success: false, message: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0623\u0648 \u0631\u0645\u0632 PIN \u063A\u064A\u0631 \u0635\u062D\u064A\u062D" });
    }
    const token = generateToken({
      userId: matchedDriver.id,
      role: "delivery",
      phone: matchedDriver.phone,
      name: matchedDriver.name
    });
    res.json({
      success: true,
      token,
      user: {
        id: matchedDriver.id,
        name: matchedDriver.name,
        phone: matchedDriver.phone,
        role: "delivery"
      }
    });
  } catch (err) {
    console.error("Driver login error:", err);
    res.status(500).json({
      success: false,
      message: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0645\u0639\u0627\u0644\u062C\u0629 \u062A\u0633\u062C\u064A\u0644 \u062F\u062E\u0648\u0644 \u0627\u0644\u0645\u0646\u062F\u0648\u0628"
    });
  }
});
app.get("/api/auth/me", (req, res) => {
  if (!req.user) {
    return res.json({ success: false, user: null });
  }
  res.json({
    success: true,
    user: {
      id: req.user.userId,
      name: req.user.name,
      phone: req.user.phone,
      role: req.user.role
    }
  });
});
async function handleD1HealthAndStatus(req, res) {
  const isHealthCheck = req.path === "/api/d1/health";
  const health = await d1.checkD1Health();
  if (!health.isConnected) {
    return res.status(503).json({
      success: false,
      isConnected: false,
      configured: health.configured,
      reachable: health.reachable,
      initialized: health.initialized,
      schemaValid: health.schemaValid,
      remoteCloudflareConnected: health.reachable,
      engine: "Cloudflare D1 Serverless (SQLite Dialect)",
      databaseId: CLOUDFLARE_CONFIG.databaseId,
      error: health.error || "\u062A\u0639\u0630\u0631 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631 \u0628\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1",
      message: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1."
    });
  }
  if (isHealthCheck && req.query?.full !== "true") {
    return res.json({
      success: true,
      status: "healthy",
      isConnected: true,
      configured: health.configured,
      reachable: health.reachable,
      initialized: health.initialized,
      schemaValid: health.schemaValid,
      remoteCloudflareConnected: true,
      engine: "Cloudflare D1 Serverless (SQLite Dialect)",
      databaseId: CLOUDFLARE_CONFIG.databaseId,
      accountId: CLOUDFLARE_CONFIG.accountId ? `${CLOUDFLARE_CONFIG.accountId.substring(0, 6)}...` : "",
      remoteTablesCount: health.remoteTablesCount,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u0645\u062A\u0635\u0644\u0629 \u0648\u062A\u0639\u0645\u0644 \u0628\u0643\u0641\u0627\u0621\u0629 \u0639\u0627\u0644\u064A\u0629 \u0648\u0628\u0645\u062E\u0637\u0637 \u0633\u0644\u064A\u0645."
    });
  }
  try {
    const [
      users,
      customers,
      products,
      categories,
      orders,
      agents,
      reviews,
      coupons,
      galleryItems,
      inventoryLogs
    ] = await Promise.all([
      db.getUsersAsync(),
      db.getCustomersAsync(),
      db.getProductsAsync(),
      db.getCategoriesAsync(),
      db.getOrdersAsync(),
      db.getDeliveryAgentsAsync(),
      db.getReviewsAsync(),
      db.getCouponsAsync(),
      db.getGalleryItemsAsync(),
      db.getInventoryTransactionsAsync()
    ]);
    let storeSettingsCount = 0;
    let inventoryRowsCount = 0;
    try {
      const stRows = await d1.executeCloudflareD1Query("SELECT count(*) as count FROM store_settings;");
      if (stRows && stRows.length > 0) {
        storeSettingsCount = Number(stRows[0].count) || 1;
      } else {
        storeSettingsCount = 1;
      }
      const invRows = await d1.executeCloudflareD1Query("SELECT count(*) as count FROM inventory;");
      if (invRows && invRows.length > 0) {
        inventoryRowsCount = Number(invRows[0].count);
      } else {
        inventoryRowsCount = products.length;
      }
    } catch {
      storeSettingsCount = 1;
      inventoryRowsCount = products.length;
    }
    return res.json({
      success: true,
      status: "healthy",
      engine: "Cloudflare D1 Serverless (SQLite Dialect)",
      databaseId: CLOUDFLARE_CONFIG.databaseId,
      accountId: CLOUDFLARE_CONFIG.accountId ? `${CLOUDFLARE_CONFIG.accountId.substring(0, 6)}...` : "",
      isConnected: true,
      configured: health.configured,
      reachable: health.reachable,
      initialized: health.initialized,
      schemaValid: health.schemaValid,
      remoteCloudflareConnected: true,
      remoteTablesCount: health.remoteTablesCount,
      tables: {
        users: users.length,
        customers: customers.length,
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        order_items: orders.reduce((sum, o) => sum + (o.items?.length || 0), 0),
        inventory: inventoryRowsCount,
        inventory_logs: inventoryLogs.length,
        delivery_agents: agents.length,
        reviews: reviews.length,
        coupons: coupons.length,
        gallery_items: galleryItems.length,
        store_settings: storeSettingsCount,
        payments: orders.length,
        notifications: d1.getNotifications().length
      },
      message: "\u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A Cloudflare D1 \u062A\u0639\u0645\u0644 \u0628\u0643\u0641\u0627\u0621\u0629 \u0639\u0627\u0644\u064A\u0629 \u0648\u0628\u0627\u062A\u0635\u0627\u0644 \u0645\u0628\u0627\u0634\u0631 \u0648\u0645\u0624\u0643\u062F."
    });
  } catch (dataErr) {
    console.error("D1 table count query error:", dataErr);
    return res.status(500).json({
      success: false,
      isConnected: false,
      configured: health.configured,
      reachable: health.reachable,
      initialized: health.initialized,
      schemaValid: health.schemaValid,
      remoteCloudflareConnected: false,
      error: dataErr?.message || "\u0641\u0634\u0644 \u0642\u0631\u0627\u0621\u0629 \u062C\u062F\u0627\u0648\u0644 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A",
      message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0642\u0631\u0627\u0621\u0629 \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u0627\u0644\u062C\u062F\u0627\u0648\u0644 \u0645\u0646 Cloudflare D1"
    });
  }
}
app.get(["/api/d1/health", "/api/d1/status"], handleD1HealthAndStatus);
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await db.getCategoriesAsync();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("Categories query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0623\u0642\u0633\u0627\u0645 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/products", async (req, res) => {
  try {
    const products = await db.getProductsAsync();
    res.json({ success: true, data: products });
  } catch (err) {
    console.error("Products query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/products/:id", async (req, res) => {
  try {
    const p = await db.findProductByIdAsync(req.params.id);
    if (!p) {
      return res.status(404).json({ success: false, message: "\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({ success: true, data: p });
  } catch (err) {
    console.error("Product find error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/products", requireRoles(["owner", "admin"]), async (req, res) => {
  const { nameAr, nameEn, category, price, weightOptions, descriptionAr, descriptionEn, burnDurationHours, ashPercentage, stock, images, specs, origin } = req.body;
  if (!nameAr || !price) {
    return res.status(400).json({ success: false, message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062A\u062C \u0648\u0633\u0639\u0631\u0647 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
  }
  const newProduct = {
    id: req.body.id || "bg-" + (category || "prem") + "-" + Date.now(),
    nameAr,
    nameEn: nameEn || nameAr,
    category: category || "premium",
    price: Number(price),
    originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : void 0,
    discountPercent: req.body.discountPercent ? Number(req.body.discountPercent) : void 0,
    weightOptions: weightOptions && weightOptions.length > 0 ? weightOptions : [
      { weight: "250g (\u0631\u0628\u0639 \u0643\u064A\u0644\u0648)", price: Number(price) },
      { weight: "500g (\u0646\u0635\u0641 \u0643\u064A\u0644\u0648)", price: Number(price) * 1.8 },
      { weight: "1kg (\u0643\u064A\u0644\u0648 \u0643\u0627\u0645\u0644)", price: Number(price) * 3.2 }
    ],
    descriptionAr: descriptionAr || "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 \u0628\u0646\u0638\u0627\u0645 Zipper Lock \u0639\u0627\u0632\u0644 \u0644\u0644\u0631\u0637\u0648\u0628\u0629 \u0648\u0646\u0642\u0627\u0621 \u062A\u0627\u0645.",
    descriptionEn: descriptionEn || "Black Gold Premium Charcoal with moisture-proof zipper lock.",
    origin: origin || "\u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F - \u0635\u0646\u0639\u0627\u0621",
    burnDurationHours: burnDurationHours || "6+ \u0633\u0627\u0639\u0627\u062A \u0645\u062A\u0648\u0627\u0635\u0644\u0629",
    ashPercentage: ashPercentage || "\u0623\u0642\u0644 \u0645\u0646 1.5% \u0631\u0645\u0627\u062F \u0623\u0628\u064A\u0636",
    moisture: req.body.moisture || "< 2%",
    rating: 5,
    reviewCount: 1,
    image: images && images.length > 0 ? images[0] : req.body.image || "/src/assets/images/black_gold_pouch_pair_1786125935649.jpg",
    images: images && images.length > 0 ? images : [req.body.image || "/src/assets/images/black_gold_pouch_pair_1786125935649.jpg"],
    specs: specs || [
      { labelAr: "\u0646\u0648\u0639 \u0627\u0644\u062A\u063A\u0644\u064A\u0641", labelEn: "Packaging", valueAr: "\u0643\u064A\u0633 \u062D\u0631\u0627\u0631\u064A \u0641\u0627\u062E\u0631 Zipper Lock", valueEn: "Moisture-Proof Zipper Pouch" }
    ],
    isFeatured: req.body.isFeatured ?? true,
    isBestSeller: req.body.isBestSeller ?? false,
    stock: Number(stock) || 100
  };
  try {
    const added = await db.addProductAsync(newProduct);
    res.json({ success: true, data: added });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.put("/api/products/:id", requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };
  if (updates.images && updates.images.length > 0 && !updates.image) {
    updates.image = updates.images[0];
  } else if (updates.image && (!updates.images || updates.images.length === 0)) {
    updates.images = [updates.image];
  }
  try {
    const updated = await db.updateProductAsync(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: "\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0645\u0646\u062A\u062C \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.delete("/api/products/:id", requireRoles(["owner", "admin"]), async (req, res) => {
  const { id } = req.params;
  try {
    await db.deleteProductAsync(id);
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062A\u062C \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/upload", requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  try {
    const image = req.body.image || req.body.fileData || req.body.dataUrl || req.body.file;
    const name = req.body.name || req.body.fileName || "upload";
    if (!image) {
      return res.status(400).json({ success: false, message: "\u0644\u0645 \u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u0648\u0631\u0629" });
    }
    if (typeof image === "string" && (image.startsWith("http://") || image.startsWith("https://") || image.startsWith("/uploads/") || image.startsWith("/images/") || image.startsWith("/src/assets/"))) {
      return res.json({ success: true, url: image });
    }
    let buffer;
    let ext = "jpg";
    let mimeType = "image/jpeg";
    if (typeof image === "string" && image.startsWith("data:")) {
      const commaIndex = image.indexOf(",");
      if (commaIndex === -1) {
        return res.status(400).json({ success: false, message: "\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0635\u0648\u0631\u0629 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D\u0629" });
      }
      const header = image.substring(0, commaIndex).toLowerCase();
      const base64Data = image.substring(commaIndex + 1).replace(/\s/g, "");
      if (header.includes("png")) {
        ext = "png";
        mimeType = "image/png";
      } else if (header.includes("webp")) {
        ext = "webp";
        mimeType = "image/webp";
      } else if (header.includes("gif")) {
        ext = "gif";
        mimeType = "image/gif";
      } else if (header.includes("svg")) {
        ext = "svg";
        mimeType = "image/svg+xml";
      } else {
        ext = "jpg";
        mimeType = "image/jpeg";
      }
      buffer = Buffer.from(base64Data, "base64");
    } else if (typeof image === "string") {
      buffer = Buffer.from(image.replace(/\s/g, ""), "base64");
    } else {
      return res.status(400).json({
        success: false,
        message: "\u0635\u064A\u063A\u0629 \u0627\u0644\u0645\u0644\u0641 \u063A\u064A\u0631 \u0645\u062F\u0639\u0648\u0645\u0629. \u064A\u0633\u0645\u062D \u0641\u0642\u0637 \u0628\u0627\u0644\u0635\u0648\u0631 \u0628\u0635\u064A\u063A (JPG, PNG, WEBP, GIF, SVG)"
      });
    }
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (buffer.length > MAX_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: "\u062D\u062C\u0645 \u0627\u0644\u0635\u0648\u0631\u0629 \u0643\u0628\u064A\u0631 \u062C\u062F\u0627\u064B (\u0623\u0642\u0635\u0649 \u062D\u062C\u0645 \u0645\u0633\u0645\u0648\u062D \u0628\u0647 \u0647\u0648 10 \u0645\u064A\u062C\u0627\u0628\u0627\u064A\u062A)"
      });
    }
    const cleanName = name ? String(name).replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase() : "product";
    const filename = `bg_img_${cleanName}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    try {
      if (!fs2.existsSync(UPLOADS_DIR)) {
        fs2.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const filePath = path2.join(UPLOADS_DIR, filename);
      fs2.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${filename}`;
      return res.json({ success: true, url: publicUrl, filename, storage: "local" });
    } catch (fsErr) {
      if (process.env.VERCEL || fsErr?.code === "EROFS") {
        const dataUri = typeof image === "string" && image.startsWith("data:") ? image : `data:${mimeType};base64,${buffer.toString("base64")}`;
        return res.json({
          success: true,
          url: dataUri,
          filename,
          storage: "d1_inline"
        });
      }
      if (process.env.NODE_ENV === "production") {
        console.error("CRITICAL: Failed to write upload to permanent disk storage in production:", fsErr?.message);
        return res.status(500).json({
          success: false,
          message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 \u0648\u062D\u062F\u0629 \u0627\u0644\u062A\u062E\u0632\u064A\u0646 \u0627\u0644\u062F\u0627\u0626\u0645\u0629 \u0628\u0627\u0644\u0633\u064A\u0631\u0641\u0631",
          error: fsErr?.message
        });
      }
      console.warn("Could not write to disk uploads in development, falling back to data URI preview:", fsErr?.message);
      const fallbackUrl = typeof image === "string" && image.startsWith("data:") ? image : `data:${mimeType};base64,${buffer.toString("base64")}`;
      return res.json({ success: true, url: fallbackUrl, filename, storage: "data-url", fallback: true });
    }
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0635\u0648\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u062E\u0627\u062F\u0645: " + (error?.message || "") });
  }
});
app.get("/api/inventory/transactions", requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  try {
    const transactions = await db.getInventoryTransactionsAsync();
    res.json({ success: true, data: transactions });
  } catch (err) {
    console.error("Inventory transactions query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u062D\u0631\u0643\u0627\u062A \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/inventory/adjust", requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  const { productId, type, quantity, reason } = req.body;
  if (!productId || typeof productId !== "string") {
    return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0646\u062A\u062C \u0627\u0644\u0645\u0631\u0627\u062F \u062A\u0639\u062F\u064A\u0644 \u0645\u062E\u0632\u0648\u0646\u0647" });
  }
  const allowedTypes = ["purchase", "sale", "adjustment", "damage", "return", "STOCK_IN", "STOCK_OUT"];
  if (!type || !allowedTypes.includes(type)) {
    return res.status(400).json({ success: false, message: "\u0646\u0648\u0639 \u0639\u0645\u0644\u064A\u0629 \u0627\u0644\u062A\u0639\u062F\u064A\u0644 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D" });
  }
  const qty = Number(quantity);
  if (isNaN(qty) || !isFinite(qty)) {
    return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0643\u0645\u064A\u0629 \u0631\u0642\u0645\u064A\u0629 \u0635\u062D\u064A\u062D\u0629" });
  }
  const product = await db.findProductByIdAsync(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: "\u0627\u0644\u0645\u0646\u062A\u062C \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  }
  const prevStock = product.stock;
  let newStock = prevStock;
  if (type === "purchase" || type === "return" || type === "STOCK_IN") {
    newStock = prevStock + Math.abs(qty);
  } else if (type === "sale" || type === "damage" || type === "STOCK_OUT") {
    if (prevStock < Math.abs(qty)) {
      return res.status(400).json({
        success: false,
        message: `\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u062D\u0627\u0644\u064A (${prevStock}) \u063A\u064A\u0631 \u0643\u0627\u0641\u064D \u0644\u062E\u0635\u0645 (${Math.abs(qty)}). \u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0635\u0628\u062D \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0633\u0627\u0644\u0628\u0627\u064B.`
      });
    }
    newStock = prevStock - Math.abs(qty);
  } else if (type === "adjustment") {
    if (qty < 0) {
      return res.status(400).json({ success: false, message: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0633\u0627\u0644\u0628\u0627\u064B" });
    }
    newStock = Math.floor(qty);
  }
  const diff = newStock - prevStock;
  const safeReason = sanitizeInputString(reason || "", 200) || "\u062A\u0639\u062F\u064A\u0644 \u062C\u0631\u062F \u064A\u062F\u0648\u064A \u0645\u0646 \u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645";
  const actor = req.user ? `${req.user.name || req.user.role} (${req.user.userId})` : "\u0627\u0644\u0625\u062F\u0627\u0631\u0629";
  try {
    const result = await db.adjustProductStock({
      productId,
      type,
      quantity: diff,
      previousStock: prevStock,
      newStock,
      reason: safeReason,
      performedBy: actor
    });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Stock adjustment failed:", err);
    res.status(400).json({
      success: false,
      message: err.message?.includes("prevent_negative_stock") ? "\u0641\u0634\u0644\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629: \u062A\u0645 \u0631\u0641\u0636 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0644\u0645\u0646\u0639 \u0627\u0644\u0642\u064A\u0645\u0629 \u0627\u0644\u0633\u0627\u0644\u0628\u0629" : err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u062E\u0632\u0648\u0646"
    });
  }
});
app.post("/api/orders", orderRateLimiter, async (req, res) => {
  const { items, address, customerName, customerPhone, paymentMethod, notes, couponCode } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "\u0627\u0644\u0633\u0644\u0629 \u0641\u0627\u0631\u063A\u0629\u060C \u064A\u0631\u062C\u0649 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062A\u062C\u0627\u062A \u0623\u0648\u0644\u0627\u064B" });
  }
  let resolvedPhone = customerPhone;
  let resolvedName = customerName;
  if (req.user && req.user.role === "customer" && req.user.phone) {
    resolvedPhone = req.user.phone;
    if (req.user.name) {
      resolvedName = req.user.name;
    }
  }
  if (!resolvedName || !resolvedPhone) {
    return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u062A\u0648\u0641\u064A\u0631 \u0627\u0633\u0645 \u0627\u0644\u0639\u0645\u064A\u0644 \u0648\u0631\u0642\u0645 \u0647\u0627\u062A\u0641\u0647" });
  }
  const phoneValidation = validateYemeniPhone(resolvedPhone);
  if (!phoneValidation.isValid) {
    return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u064A\u0645\u0646\u064A \u0635\u062D\u064A\u062D (\u0645\u062B\u0627\u0644: 77XXXXXXX \u0623\u0648 73XXXXXXX)" });
  }
  const cleanPhone = phoneValidation.normalized;
  const safeCustomerName = sanitizeInputString(resolvedName, 80);
  const rawAddress = address || req.body.deliveryAddress || req.body.shippingAddress;
  const resolvedDistrict = typeof rawAddress === "object" && rawAddress?.district ? rawAddress.district : req.body.district || (typeof rawAddress === "string" ? rawAddress : "");
  const resolvedStreet = typeof rawAddress === "object" && rawAddress?.street ? rawAddress.street : req.body.street || typeof rawAddress === "object" && (rawAddress?.streetAddress || rawAddress?.details) || (typeof rawAddress === "string" ? rawAddress : req.body.addressDetails || "");
  const resolvedLandmark = typeof rawAddress === "object" && rawAddress?.landmark ? rawAddress.landmark : req.body.landmark || req.body.addressDetails || "";
  if (!resolvedDistrict) {
    return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u062A\u062D\u062F\u064A\u062F \u0639\u0646\u0648\u0627\u0646 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u062F\u0627\u062E\u0644 \u0635\u0646\u0639\u0627\u0621" });
  }
  const safeAddress = {
    district: sanitizeInputString(resolvedDistrict, 80),
    street: sanitizeInputString(resolvedStreet || resolvedDistrict, 120),
    landmark: sanitizeInputString(resolvedLandmark, 120),
    city: "\u0635\u0646\u0639\u0627\u0621"
  };
  const allProducts = await db.getProductsAsync();
  const validatedItems = [];
  let calculatedSubtotal = 0;
  for (const item of items) {
    const targetId = item.productId || item.product?.id || item.id;
    const product = allProducts.find((p) => p.id === targetId);
    if (!product) {
      return res.status(400).json({ success: false, message: `\u0627\u0644\u0645\u0646\u062A\u062C (${item.productNameAr || item.nameAr || targetId}) \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631 \u0641\u064A \u0627\u0644\u0645\u062A\u062C\u0631` });
    }
    const orderQty = Math.max(1, parseInt(item.quantity, 10) || 1);
    if (product.stock < orderQty) {
      return res.status(400).json({
        success: false,
        message: `\u0639\u0630\u0631\u0627\u064B! \u0627\u0644\u0643\u0645\u064A\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0645\u0646 "${product.nameAr}" (${orderQty}) \u062A\u062A\u062C\u0627\u0648\u0632 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0645\u062A\u0627\u062D \u062D\u0627\u0644\u064A\u0627\u064B (${product.stock} \u0639\u0628\u0648\u0629).`
      });
    }
    const itemWeight = item.weight || item.selectedWeight || item.product && item.product.weight;
    let itemPrice = product.price;
    if (itemWeight && product.weightOptions && product.weightOptions.length > 0) {
      const matchOpt = product.weightOptions.find((w) => w.weight === itemWeight);
      if (matchOpt) {
        itemPrice = matchOpt.price;
      }
    }
    calculatedSubtotal += itemPrice * orderQty;
    validatedItems.push({
      productId: product.id,
      productNameAr: product.nameAr,
      productNameEn: product.nameEn,
      weight: itemWeight || (product.weightOptions?.[0]?.weight || "250g"),
      quantity: orderQty,
      unitPrice: itemPrice,
      totalPrice: itemPrice * orderQty
    });
  }
  let calculatedDiscount = 0;
  if (couponCode) {
    const coupon = await db.findCouponAsync(couponCode);
    const isCouponValid = coupon && coupon.isActive && (!coupon.validUntil || new Date(coupon.validUntil).getTime() >= Date.now()) && (!coupon.maxUses || !coupon.usageCount || coupon.usageCount < coupon.maxUses);
    if (isCouponValid && calculatedSubtotal >= coupon.minOrderAmount) {
      const rawDiscount = calculatedSubtotal * coupon.discountPercent / 100;
      calculatedDiscount = coupon.maxDiscount && coupon.maxDiscount > 0 ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;
    }
  }
  const settings = await db.getSettingsAsync();
  let calculatedShipping = 800;
  if (safeAddress.district && settings.deliveryDistricts) {
    const matchedDistrict = settings.deliveryDistricts.find(
      (d) => safeAddress.district.includes(d.nameAr) || d.nameAr.includes(safeAddress.district)
    );
    if (matchedDistrict) {
      calculatedShipping = matchedDistrict.fee;
    }
  }
  if (calculatedSubtotal >= (settings.freeDeliveryThreshold || 8e3)) {
    calculatedShipping = 0;
  }
  const calculatedTotal = calculatedSubtotal + calculatedShipping - calculatedDiscount;
  const idempotencyKey = String(
    req.headers["x-idempotency-key"] || req.headers["idempotency-key"] || req.body.idempotencyKey || req.body.clientRequestId || ""
  ).trim();
  const drivers = await db.getDeliveryAgentsAsync();
  const activeDrivers = drivers.filter((d) => d.isActive !== false && d.is_active !== 0);
  const assignedDriver = activeDrivers.length > 0 ? {
    id: activeDrivers[0].id,
    name: activeDrivers[0].name,
    phone: activeDrivers[0].phone
  } : void 0;
  let orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto2.randomBytes(3).toString("hex").toUpperCase()}`;
  let orderNum = `BG-2026-${Date.now().toString().slice(-4)}${crypto2.randomInt(1e3, 9999)}`;
  const existingOrders = await db.getOrdersAsync();
  while (existingOrders.some((o) => o.id === orderId || o.orderNumber === orderNum)) {
    orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto2.randomBytes(4).toString("hex").toUpperCase()}`;
    orderNum = `BG-2026-${Date.now().toString().slice(-4)}${crypto2.randomInt(1e3, 9999)}`;
  }
  const now = /* @__PURE__ */ new Date();
  const timeFormatted = now.toLocaleTimeString("ar-YE", { hour: "2-digit", minute: "2-digit" });
  const atomicResult = await db.createOrderAtomic({
    orderId,
    orderNumber: orderNum,
    customerName: safeCustomerName,
    customerPhone: cleanPhone,
    address: safeAddress,
    validatedItems,
    subtotal: calculatedSubtotal,
    shippingFee: calculatedShipping,
    discount: calculatedDiscount,
    total: calculatedTotal,
    paymentMethod: paymentMethod || "cod",
    notes: sanitizeInputString(notes || "", 200),
    couponCode: calculatedDiscount > 0 && couponCode ? String(couponCode).trim() : void 0,
    idempotencyKey: idempotencyKey || void 0,
    assignedDriver,
    timeline: [
      {
        status: "received",
        time: timeFormatted,
        titleAr: "\u062A\u0645 \u0627\u0633\u062A\u0644\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u0648\u062A\u0623\u0643\u064A\u062F\u0647 \u0628\u0627\u0644\u0646\u0638\u0627\u0645",
        titleEn: "Order Received & Verified"
      }
    ],
    date: now.toISOString().replace("T", " ").substring(0, 16)
  });
  if (!atomicResult.success || !atomicResult.order) {
    return res.status(400).json({
      success: false,
      message: atomicResult.message || "\u0641\u0634\u0644\u062A \u0639\u0645\u0644\u064A\u0629 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0644\u0639\u062F\u0645 \u062A\u0648\u0641\u0631 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0627\u0644\u0643\u0627\u0641\u064A"
    });
  }
  const createdOrder = atomicResult.order;
  let guestToken;
  if (!req.user || req.user.role === "guest") {
    const existingOrderIds = req.user?.orderIds || [];
    const mergedOrderIds = Array.from(new Set([
      ...existingOrderIds,
      createdOrder.id,
      createdOrder.orderNumber
    ].filter(Boolean)));
    guestToken = generateToken({
      userId: req.user?.userId || `guest-${cleanPhone}`,
      role: "guest",
      phone: cleanPhone,
      name: safeCustomerName,
      orderIds: mergedOrderIds,
      isGuest: true
    });
  }
  db.logAnalyticsEvent("purchase", {
    orderId: createdOrder.id,
    orderNumber: createdOrder.orderNumber,
    total: createdOrder.total,
    itemsCount: validatedItems.length
  }, req.user?.userId);
  res.json({
    success: true,
    data: createdOrder,
    guestToken,
    isDuplicate: atomicResult.isDuplicate || false,
    message: atomicResult.isDuplicate ? "\u062A\u0645 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u0645\u0633\u062C\u0644 \u0645\u0633\u0628\u0642\u0627\u064B" : "\u062A\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0648\u062A\u0633\u062C\u064A\u0644\u0647 \u0628\u0646\u062C\u0627\u062D!"
  });
});
app.get("/api/orders", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
  const allOrders = await db.getOrdersAsync();
  if (["delivery", "mandoub"].includes(req.user.role)) {
    const cleanPhone = req.user.phone ? req.user.phone.replace(/\D/g, "") : "";
    const driverOrders = allOrders.filter(
      (o) => o.driverId === req.user?.userId || cleanPhone && o.driverPhone && o.driverPhone.replace(/\D/g, "") === cleanPhone
    );
    return res.json({ success: true, data: driverOrders });
  }
  if (["owner", "admin", "employee"].includes(req.user.role)) {
    return res.json({ success: true, data: allOrders });
  }
  if (req.user.role === "customer" && req.user.phone) {
    const cleanPhone = req.user.phone.replace(/\D/g, "");
    const customerOrders = allOrders.filter((o) => o.customerPhone && o.customerPhone.replace(/\D/g, "") === cleanPhone);
    return res.json({ success: true, data: customerOrders });
  }
  if (req.user.role === "guest") {
    const authorizedOrderIds = req.user.orderIds || [];
    const guestOrders = allOrders.filter(
      (o) => authorizedOrderIds.includes(o.id) || o.orderNumber && authorizedOrderIds.includes(o.orderNumber)
    );
    return res.json({ success: true, data: guestOrders });
  }
  return res.status(403).json({ success: false, message: "\u0644\u064A\u0633 \u0644\u062F\u064A\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u0644\u0639\u0631\u0636 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062A" });
});
app.get("/api/my-orders", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0639\u0631\u0636 \u0637\u0644\u0628\u0627\u062A\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648 \u062C\u0644\u0633\u0629 \u0632\u0627\u0626\u0631 \u0645\u0648\u062B\u0642\u0629" });
  }
  if (["owner", "admin", "employee"].includes(req.user.role)) {
    const phone = req.query.phone;
    if (phone) {
      const clean = phone.replace(/\D/g, "");
      const filtered = await db.getOrdersAsync({ phone: clean });
      return res.json({ success: true, data: filtered });
    }
    const allOrders = await db.getOrdersAsync();
    return res.json({ success: true, data: allOrders });
  }
  if (req.user.role === "guest") {
    const authorizedOrderIds = req.user.orderIds || [];
    if (!Array.isArray(authorizedOrderIds) || authorizedOrderIds.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const allOrders = await db.getOrdersAsync();
    const myOrders = allOrders.filter(
      (o) => authorizedOrderIds.includes(o.id) || o.orderNumber && authorizedOrderIds.includes(o.orderNumber)
    );
    return res.json({ success: true, data: myOrders });
  }
  if (req.user.role === "customer" && req.user.phone) {
    const clean = req.user.phone.replace(/\D/g, "");
    const myOrders = await db.getOrdersAsync({ phone: clean });
    return res.json({ success: true, data: myOrders });
  }
  if (["delivery", "mandoub"].includes(req.user.role)) {
    const allOrders = await db.getOrdersAsync();
    const cleanPhone = req.user.phone ? req.user.phone.replace(/\D/g, "") : "";
    const driverOrders = allOrders.filter((o) => {
      const isMine = o.driverId === req.user?.userId || cleanPhone && o.driverPhone && o.driverPhone.replace(/\D/g, "") === cleanPhone;
      return isMine;
    });
    return res.json({ success: true, data: driverOrders });
  }
  return res.status(403).json({ success: false, message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0639\u0631\u0636 \u0647\u0630\u0647 \u0627\u0644\u0637\u0644\u0628\u0627\u062A" });
});
app.get("/api/orders/track/:query", trackingRateLimiter, async (req, res) => {
  const q = req.params.query.trim().toUpperCase();
  if (!q || q.length < 3) {
    return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0631\u0642\u0645 \u0637\u0644\u0628 \u0635\u062D\u064A\u062D" });
  }
  const allOrders = await db.getOrdersAsync();
  const order = allOrders.find(
    (o) => o.id.toUpperCase() === q || o.orderNumber.toUpperCase() === q || q.length >= 4 && o.orderNumber.toUpperCase() === `BG-2026-${q}`
  );
  if (!order) {
    return res.status(404).json({ success: false, message: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628. \u062A\u0623\u0643\u062F \u0645\u0646 \u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628." });
  }
  const itemsSummary = Array.isArray(order.items) ? order.items.map((it) => `${it.productNameAr || "\u0645\u0646\u062A\u062C"} (${it.quantity || 1})`).join("\u060C ") : "";
  res.json({
    success: true,
    data: {
      orderNumber: order.orderNumber,
      status: order.status,
      date: order.date,
      itemsSummary,
      district: order.address?.district || "\u0635\u0646\u0639\u0627\u0621",
      driverName: order.driverName || null,
      timeline: order.timeline || []
    }
  });
});
app.get("/api/orders/:id", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0637\u0644\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
  const order = await db.findOrderByIdAsync(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  }
  const isManagement = ["owner", "admin", "employee"].includes(req.user.role);
  const isCustomerOwner = req.user.role === "customer" && req.user.phone && order.customerPhone && req.user.phone.replace(/\D/g, "") === order.customerPhone.replace(/\D/g, "");
  const isGuestOwner = req.user.role === "guest" && Array.isArray(req.user.orderIds) && (req.user.orderIds.includes(order.id) || order.orderNumber && req.user.orderIds.includes(order.orderNumber));
  const isDriver = ["delivery", "mandoub"].includes(req.user.role) && (order.driverId === req.user.userId || req.user.phone && order.driverPhone && order.driverPhone.replace(/\D/g, "") === req.user.phone.replace(/\D/g, ""));
  if (!isManagement && !isCustomerOwner && !isGuestOwner && !isDriver) {
    return res.status(403).json({ success: false, message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0639\u0631\u0636 \u062A\u0641\u0627\u0635\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628" });
  }
  res.json({ success: true, data: order });
});
app.get("/api/orders/:id/items", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u062A\u0641\u0627\u0635\u064A\u0644 \u0639\u0646\u0627\u0635\u0631 \u0627\u0644\u0637\u0644\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644" });
  }
  const order = await db.findOrderByIdAsync(req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  }
  const isManagement = ["owner", "admin", "employee"].includes(req.user.role);
  const isCustomerOwner = req.user.role === "customer" && req.user.phone && order.customerPhone && req.user.phone.replace(/\D/g, "") === order.customerPhone.replace(/\D/g, "");
  const isGuestOwner = req.user.role === "guest" && Array.isArray(req.user.orderIds) && (req.user.orderIds.includes(order.id) || order.orderNumber && req.user.orderIds.includes(order.orderNumber));
  const isDriver = ["delivery", "mandoub"].includes(req.user.role) && (order.driverId === req.user.userId || req.user.phone && order.driverPhone && order.driverPhone.replace(/\D/g, "") === req.user.phone.replace(/\D/g, ""));
  if (!isManagement && !isCustomerOwner && !isGuestOwner && !isDriver) {
    return res.status(403).json({ success: false, message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0639\u0631\u0636 \u062A\u0641\u0627\u0635\u064A\u0644 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628" });
  }
  const items = await db.getOrderItemsAsync(req.params.id);
  res.json({ success: true, data: items });
});
app.patch("/api/orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, driverNotes, driverId, driverName, driverPhone } = req.body;
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B" });
  }
  const order = await db.findOrderByIdAsync(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  }
  const isManagement = ["owner", "admin", "employee"].includes(req.user.role);
  const isDriverRole = ["delivery", "mandoub"].includes(req.user.role);
  const isAssignedDriver = isDriverRole && (order.driverId === req.user.userId || req.user.phone && order.driverPhone && order.driverPhone.replace(/\D/g, "") === req.user.phone.replace(/\D/g, ""));
  if (!isManagement && !isAssignedDriver) {
    return res.status(403).json({
      success: false,
      message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u063A\u064A\u064A\u0631 \u062D\u0627\u0644\u0629 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628. \u0641\u0642\u0637 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062A\u062C\u0631 \u0623\u0648 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u0633\u0646\u062F \u0625\u0644\u064A\u0647 \u0627\u0644\u0637\u0644\u0628 \u064A\u0645\u0643\u0646\u0647\u0645\u0627 \u0630\u0644\u0643."
    });
  }
  if (!isManagement && isAssignedDriver) {
    if (!["assigned", "preparing", "shipped", "on_way", "delivering", "delivered"].includes(status)) {
      return res.status(403).json({ success: false, message: "\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u064A\u0645\u0643\u0646\u0647 \u0641\u0642\u0637 \u062A\u062D\u062F\u064A\u062B \u0645\u0631\u0627\u062D\u0644 \u0627\u0633\u062A\u0644\u0627\u0645 \u0648\u0645\u0633\u0627\u0631 \u0627\u0644\u0634\u062D\u0646\u0629 \u0623\u0648 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062A\u0633\u0644\u064A\u0645" });
    }
  }
  let driverInfo;
  if (isManagement && (driverId || driverName)) {
    const agents = await db.getDeliveryAgentsAsync();
    const verifiedAgent = agents.find((a) => a.id === driverId || driverName && a.name.trim() === driverName.trim());
    if (!verifiedAgent) {
      return res.status(400).json({ success: false, message: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646" });
    }
    driverInfo = {
      driverId: verifiedAgent.id,
      driverName: verifiedAgent.name,
      driverPhone: verifiedAgent.phone
    };
    await db.updateOrderDriverAsync(id, driverInfo.driverId, driverInfo.driverName, driverInfo.driverPhone);
  }
  const actor = `${req.user.name || req.user.role} (${req.user.phone || req.user.userId})`;
  try {
    const targetStatus = status || (driverInfo ? "assigned" : order.status);
    const updated = await db.updateOrderStatus(id, targetStatus, driverNotes, actor, driverInfo);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u062D\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628" });
  }
});
app.post("/api/orders/:id/assign-driver", async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0647\u0630\u0627 \u0627\u0644\u0625\u062C\u0631\u0627\u0621 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B" });
  }
  if (!["owner", "admin", "employee"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0645\u0646\u0627\u062F\u064A\u0628. \u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0645\u0642\u062A\u0635\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u0625\u062F\u0627\u0631\u0629." });
  }
  const { id } = req.params;
  const { driverId, driverName, driverNotes, setStatusToAssigned } = req.body || {};
  const order = await db.findOrderByIdAsync(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  }
  const agents = await db.getDeliveryAgentsAsync();
  const verifiedAgent = agents.find((a) => a.id === driverId || driverName && a.name.trim() === driverName.trim());
  if (!verifiedAgent) {
    return res.status(400).json({ success: false, message: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u062D\u062F\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0633\u062C\u0644 \u0627\u0644\u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F\u064A\u0646" });
  }
  const finalDriver = verifiedAgent;
  const actor = `${req.user.name || req.user.role} (${req.user.phone || req.user.userId})`;
  await db.updateOrderDriverAsync(id, finalDriver.id, finalDriver.name, finalDriver.phone);
  const nextStatus = setStatusToAssigned ? "assigned" : ["pending", "received"].includes(order.status) ? "assigned" : order.status;
  const updated = await db.updateOrderStatus(
    id,
    nextStatus,
    driverNotes || `\u062A\u0645 \u062A\u0643\u0644\u064A\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F (${finalDriver.name})`,
    actor,
    { driverId: finalDriver.id, driverName: finalDriver.name, driverPhone: finalDriver.phone }
  );
  res.json({
    success: true,
    message: `\u062A\u0645 \u062A\u0643\u0644\u064A\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0627\u0644\u0645\u0639\u062A\u0645\u062F (${finalDriver.name}) \u0628\u0646\u062C\u0627\u062D`,
    data: updated
  });
});
app.post("/api/orders/:id/cancel", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  if (!req.user) {
    return res.status(401).json({ success: false, message: "\u064A\u062A\u0637\u0644\u0628 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644 \u0623\u0648\u0644\u0627\u064B" });
  }
  const order = await db.findOrderByIdAsync(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "\u0627\u0644\u0637\u0644\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
  }
  if (order.status === "cancelled") {
    return res.json({
      success: true,
      message: "\u0627\u0644\u0637\u0644\u0628 \u0645\u0644\u063A\u064A \u0628\u0627\u0644\u0641\u0639\u0644 \u0648\u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0645\u0633\u062A\u0631\u062C\u0639 \u0633\u0627\u0628\u0642\u064B\u0627",
      data: order,
      alreadyCancelled: true
    });
  }
  if (order.status === "delivered") {
    return res.status(400).json({ success: false, message: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0644\u063A\u0627\u0621 \u0637\u0644\u0628 \u062A\u0645 \u062A\u0633\u0644\u064A\u0645\u0647 \u0628\u0646\u062C\u0627\u062D" });
  }
  const isManagement = ["owner", "admin", "employee"].includes(req.user.role);
  const isCustomerOwner = req.user.role === "customer" && req.user.phone && order.customerPhone.replace(/\D/g, "") === req.user.phone.replace(/\D/g, "");
  const isGuestOwner = req.user.role === "guest" && Array.isArray(req.user.orderIds) && (req.user.orderIds.includes(order.id) || order.orderNumber && req.user.orderIds.includes(order.orderNumber));
  if (!isManagement && !isCustomerOwner && !isGuestOwner) {
    return res.status(403).json({ success: false, message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D \u0644\u0643 \u0628\u0625\u0644\u063A\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0637\u0644\u0628" });
  }
  if ((isCustomerOwner || isGuestOwner) && !isManagement) {
    if (!["pending", "received"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "\u0644\u0627 \u064A\u0645\u0643\u0646 \u0644\u0644\u0639\u0645\u064A\u0644 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0625\u0644\u0627 \u0625\u0630\u0627 \u0643\u0627\u0646 \u0641\u064A \u062D\u0627\u0644\u0629 \u0642\u064A\u062F \u0627\u0644\u0627\u0646\u062A\u0638\u0627\u0631 \u0623\u0648 \u0645\u0633\u062A\u0644\u0645 (\u0642\u0628\u0644 \u0627\u0644\u062A\u0623\u0643\u064A\u062F \u0648\u0627\u0644\u062A\u062C\u0647\u064A\u0632). \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u0635\u0644 \u0645\u0639 \u0625\u062F\u0627\u0631\u0629 \u0627\u0644\u0645\u062A\u062C\u0631 \u0644\u0644\u0645\u0633\u0627\u0639\u062F\u0629."
      });
    }
  }
  const actor = `${req.user.name || req.user.role} (${req.user.phone || req.user.userId})`;
  const safeReason = sanitizeInputString(reason || "", 200);
  const notes = safeReason ? `\u0633\u0628\u0628 \u0627\u0644\u0625\u0644\u063A\u0627\u0621: ${safeReason}` : void 0;
  try {
    const updated = await db.updateOrderStatus(id, "cancelled", notes, actor);
    res.json({
      success: true,
      message: "\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628 \u0648\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0643\u0627\u0641\u0629 \u0627\u0644\u0643\u0645\u064A\u0627\u062A \u0625\u0644\u0649 \u0627\u0644\u0645\u062E\u0632\u0648\u0646 \u0628\u0646\u062C\u0627\u062D",
      data: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "\u0641\u0634\u0644 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u0637\u0644\u0628" });
  }
});
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await db.getReviewsAsync();
    res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("Reviews query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u062A\u0642\u064A\u064A\u0645\u0627\u062A \u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/reviews", async (req, res) => {
  try {
    const { productId, rating, comment, userName } = req.body;
    if (!productId || !comment || !userName) {
      return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0643\u062A\u0627\u0628\u0629 \u0627\u0644\u0627\u0633\u0645 \u0648\u0627\u0644\u062A\u0639\u0644\u064A\u0642 \u0648\u062A\u062D\u062F\u064A\u062F \u0627\u0644\u0645\u0646\u062A\u062C" });
    }
    const userPhone = req.user?.phone || (req.body.userPhone ? String(req.body.userPhone) : req.body.phone ? String(req.body.phone) : "");
    let isVerified = userPhone ? await db.hasDeliveredOrderForProductAsync(userPhone, productId) : false;
    if (!isVerified && req.body.orderId) {
      const order = await db.findOrderByIdAsync(String(req.body.orderId));
      if (order && order.status === "delivered" && order.items.some((it) => it.productId === productId)) {
        isVerified = true;
      }
    }
    const newReview = {
      id: "rev-" + Date.now(),
      productId: String(productId),
      userName: sanitizeInputString(userName, 50),
      userPhone: userPhone || void 0,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: sanitizeInputString(comment, 500),
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      verifiedPurchase: isVerified
    };
    const added = await db.addReviewAsync(newReview);
    res.json({ success: true, data: added });
  } catch (err) {
    console.error("Add review error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u062A\u0642\u064A\u064A\u0645 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/validate-coupon", couponRateLimiter, async (req, res) => {
  try {
    const { code, amount, items } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ success: false, message: "\u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0643\u0648\u062F \u0627\u0644\u0643\u0648\u0628\u0648\u0646" });
    }
    const found = await db.findCouponAsync(code);
    if (!found || !found.isActive) {
      return res.status(400).json({ success: false, message: "\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0635\u0627\u0644\u062D \u0623\u0648 \u063A\u064A\u0631 \u0645\u0641\u0639\u0644" });
    }
    if (found.validUntil && new Date(found.validUntil).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "\u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0645\u0646\u062A\u0647\u064A \u0627\u0644\u0635\u0644\u0627\u062D\u064A\u0629" });
    }
    if (found.maxUses && found.usageCount && found.usageCount >= found.maxUses) {
      return res.status(400).json({ success: false, message: "\u0644\u0642\u062F \u0627\u0633\u062A\u0646\u0641\u062F \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0639\u062F\u062F \u0645\u0631\u0627\u062A \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0633\u0645\u0648\u062D \u0628\u0647\u0627" });
    }
    let orderAmount = 0;
    if (items && Array.isArray(items) && items.length > 0) {
      const products = await db.getProductsAsync();
      for (const it of items) {
        const p = products.find((prod) => prod.id === it.productId);
        if (p) {
          orderAmount += p.price * Math.max(1, Number(it.quantity) || 1);
        }
      }
    } else {
      orderAmount = Math.max(0, Number(amount) || 0);
    }
    if (orderAmount < found.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u062F\u0646\u0649 \u0644\u062A\u0637\u0628\u064A\u0642 \u0647\u0630\u0627 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0647\u0648 ${found.minOrderAmount.toLocaleString()} \u0631\u064A\u0627\u0644 \u064A\u0645\u0646\u064A`
      });
    }
    const rawDiscount = orderAmount * found.discountPercent / 100;
    const discountVal = found.maxDiscount && found.maxDiscount > 0 ? Math.min(rawDiscount, found.maxDiscount) : rawDiscount;
    res.json({
      success: true,
      discount: discountVal,
      coupon: {
        code: found.code,
        discountPercent: found.discountPercent,
        maxDiscount: found.maxDiscount,
        minOrderAmount: found.minOrderAmount
      }
    });
  } catch (err) {
    console.error("Validate coupon error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/coupons", requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  try {
    const coupons = await db.getCouponsAsync();
    res.json({ success: true, data: coupons });
  } catch (err) {
    console.error("Coupons query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0643\u0648\u0628\u0648\u0646\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/coupons", requireRoles(["owner", "admin"]), async (req, res) => {
  const { code, discountPercent, maxDiscount, minOrderAmount, validUntil, maxUses, isActive } = req.body;
  if (!code || !discountPercent) {
    return res.status(400).json({ success: false, message: "\u0643\u0648\u062F \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0648\u0646\u0633\u0628\u0629 \u0627\u0644\u062E\u0635\u0645 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
  }
  try {
    const newCoupon = await db.addCouponAsync({
      code: code.trim().toUpperCase(),
      discountPercent: Number(discountPercent),
      maxDiscount: Number(maxDiscount) || 0,
      minOrderAmount: Number(minOrderAmount) || 0,
      isActive: isActive !== false,
      validUntil: validUntil || "2026-12-31",
      maxUses: maxUses !== void 0 ? Number(maxUses) : 100
    });
    res.json({ success: true, data: newCoupon });
  } catch (err) {
    console.error("Add coupon error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.put("/api/coupons/:code", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const updated = await db.updateCouponAsync(req.params.code, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "\u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Update coupon error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.delete("/api/coupons/:code", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    await db.deleteCouponAsync(req.params.code);
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0643\u0648\u0628\u0648\u0646" });
  } catch (err) {
    console.error("Delete coupon error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0643\u0648\u0628\u0648\u0646 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await db.getSettingsAsync();
    res.json({ success: true, data: settings });
  } catch (err) {
    console.error("Settings query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/settings", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const updated = await db.updateSettingsAsync(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.put("/api/settings", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const updated = await db.updateSettingsAsync(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/delivery-agents", async (req, res) => {
  try {
    const isAuthorized = req.user && ["owner", "admin", "employee", "delivery"].includes(req.user.role);
    const agents = await db.getDeliveryAgentsAsync();
    if (isAuthorized) {
      return res.json({ success: true, data: agents });
    }
    const safeAgents = agents.map((a) => ({
      id: a.id,
      name: a.name,
      vehicleType: a.vehicleType,
      rating: a.rating,
      isActive: a.isActive
    }));
    res.json({ success: true, data: safeAgents });
  } catch (err) {
    console.error("Delivery agents error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0645\u0646\u0627\u062F\u064A\u0628 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/delivery-agents", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const updated = await db.updateDeliveryAgentsAsync(req.body);
      return res.json({ success: true, data: updated });
    }
    const { id, name, phone, vehicleType, pin, isActive } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0648\u0631\u0642\u0645 \u0647\u0627\u062A\u0641\u0647 \u0645\u0637\u0644\u0648\u0628\u0627\u0646" });
    }
    const agentId = id || `da-${phone.replace(/\D/g, "") || Date.now()}`;
    const newAgent = await db.addDeliveryAgentAsync({
      id: agentId,
      name: sanitizeInputString(name, 60),
      phone: normalizeDigits(phone).replace(/\D/g, ""),
      vehicleType: vehicleType || "motorcycle",
      assignedDistricts: req.body.assignedDistricts || [],
      isActive: isActive !== false,
      rating: 5,
      completedOrdersCount: 0
    }, pin);
    res.json({ success: true, data: newAgent });
  } catch (err) {
    console.error("Delivery agents update error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0641\u0638 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0641\u064A \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.put("/api/delivery-agents/:id", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicleType, pin, isActive } = req.body;
    const updated = await db.updateDeliveryAgentAsync(id, {
      name: name ? sanitizeInputString(name, 60) : void 0,
      phone: phone ? normalizeDigits(phone).replace(/\D/g, "") : void 0,
      vehicleType,
      isActive
    }, pin);
    if (!updated) {
      return res.status(404).json({ success: false, message: "\u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Delivery agent update error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0646\u062F\u0648\u0628", error: err.message });
  }
});
app.delete("/api/delivery-agents/:id", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    await db.deleteDeliveryAgentAsync(req.params.id);
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0628\u0646\u062C\u0627\u062D" });
  } catch (err) {
    console.error("Delivery agent delete error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0645\u0646\u062F\u0648\u0628 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/gallery", async (req, res) => {
  try {
    const data = await db.getGalleryItemsAsync();
    res.json({ success: true, data });
  } catch (err) {
    console.error("Gallery query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0645\u0639\u0631\u0636 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/gallery", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const newItem = await db.addGalleryItemAsync({
      id: "g" + Date.now(),
      ...req.body
    });
    res.json({ success: true, data: newItem });
  } catch (err) {
    console.error("Gallery add error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0635\u0648\u0631\u0629 \u0644\u0644\u0645\u0639\u0631\u0636", error: err.message });
  }
});
app.put("/api/gallery/:id", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const updated = await db.updateGalleryItemAsync(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "\u0639\u0646\u0635\u0631 \u0627\u0644\u0645\u0639\u0631\u0636 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error("Gallery update error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062A\u0639\u062F\u064A\u0644 \u0639\u0646\u0635\u0631 \u0627\u0644\u0645\u0639\u0631\u0636", error: err.message });
  }
});
app.delete("/api/gallery/:id", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    await db.deleteGalleryItemAsync(req.params.id);
    res.json({ success: true, message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0646 \u0627\u0644\u0645\u0639\u0631\u0636" });
  } catch (err) {
    console.error("Gallery delete error:", err);
    res.status(500).json({ success: false, message: "\u0641\u0634\u0644 \u062D\u0630\u0641 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0646 \u0627\u0644\u0645\u0639\u0631\u0636", error: err.message });
  }
});
app.get("/api/admin/reports", requireRoles(["owner", "admin"]), async (req, res) => {
  try {
    const orders = await db.getOrdersAsync();
    const products = await db.getProductsAsync();
    const totalRevenue = orders.reduce((sum, o) => o.status !== "cancelled" ? sum + o.total : sum, 0);
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === "delivered").length;
    const deliveringOrders = orders.filter((o) => ["shipped", "delivering"].includes(o.status)).length;
    const pendingOrders = orders.filter((o) => ["received", "preparing"].includes(o.status)).length;
    const lowStockProducts = products.filter((p) => p.stock < 50);
    const productSalesMap = {};
    orders.forEach((ord) => {
      if (ord.status !== "cancelled" && ord.items) {
        ord.items.forEach((it) => {
          if (!productSalesMap[it.productId]) {
            productSalesMap[it.productId] = { name: it.productNameAr, quantity: 0, revenue: 0 };
          }
          productSalesMap[it.productId].quantity += it.quantity;
          productSalesMap[it.productId].revenue += it.unitPrice * it.quantity;
        });
      }
    });
    const topProducts = Object.entries(productSalesMap).map(([id, data]) => ({ id, ...data })).sort((a, b) => b.quantity - a.quantity);
    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        completedOrders,
        deliveringOrders,
        pendingOrders,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        lowStockProducts,
        topProducts
      }
    });
  } catch (err) {
    console.error("Reports query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get(["/api/customers", "/api/admin/customers"], requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  try {
    const orders = await db.getOrdersAsync();
    const customerMap = {};
    orders.forEach((o) => {
      const key = o.customerPhone?.replace(/\D/g, "") || o.customerName;
      if (!customerMap[key]) {
        customerMap[key] = {
          name: o.customerName,
          phone: o.customerPhone,
          address: o.address?.district || "\u0635\u0646\u0639\u0627\u0621",
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.date
        };
      }
      customerMap[key].ordersCount += 1;
      if (o.status !== "cancelled") {
        customerMap[key].totalSpent += o.total;
      }
    });
    res.json({ success: true, data: Object.values(customerMap) });
  } catch (err) {
    console.error("Customers query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.get("/api/b2b/calculator-data", requireRoles(["owner", "admin", "employee"]), async (req, res) => {
  try {
    const products = await db.getProductsAsync();
    const b2bProducts = products.map((p) => ({
      id: p.id,
      nameAr: p.nameAr,
      category: p.category,
      retailPrice: p.price,
      wholesalePrice: p.category === "premium" ? Math.round(p.price * 0.8) : Math.round(p.price * 0.76),
      marginPerUnit: p.category === "premium" ? Math.round(p.price * 0.2) : Math.round(p.price * 0.24),
      stock: p.stock
    }));
    res.json({
      success: true,
      data: {
        products: b2bProducts,
        incentives: [
          { tier: "\u0627\u0644\u0628\u0642\u0627\u0644\u0627\u062A \u0627\u0644\u0635\u063A\u0631\u0649", minPouches: 24, bonusPerPouch: 50, freeDisplay: true },
          { tier: "\u0627\u0644\u0633\u0648\u0628\u0631\u0645\u0627\u0631\u0643\u062A \u0627\u0644\u0643\u0628\u0631\u0649", minPouches: 96, bonusPerPouch: 100, freeDisplay: true },
          { tier: "\u0645\u062D\u0644\u0627\u062A \u0627\u0644\u0634\u064A\u0634\u0629 \u0648\u0627\u0644\u0645\u0642\u0627\u0647\u064A", minKg: 50, discountPercent: 22, directDelivery: true }
        ]
      }
    });
  } catch (err) {
    console.error("B2B calculator query error:", err);
    res.status(503).json({ success: false, message: "\u0641\u0634\u0644 \u0627\u0633\u062A\u0639\u0644\u0627\u0645 \u0628\u064A\u0627\u0646\u0627\u062A B2B \u0645\u0646 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A", error: err.message });
  }
});
app.post("/api/analytics/track", (req, res) => {
  const { event, data } = req.body;
  if (event) {
    db.logAnalyticsEvent(event, data, req.user?.userId);
  }
  res.json({ success: true });
});
app.post("/api/analytics/abandoned-cart", (req, res) => {
  const { customerPhone, customerName, items, subtotal } = req.body;
  db.logAbandonedCart({ customerPhone, customerName, items, subtotal });
  res.json({ success: true });
});
app.get("/sitemap.xml", async (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const host = req.protocol + "://" + req.get("host");
  const products = await db.getProductsAsync();
  const productUrls = products.map((p) => `
    <url>
      <loc>${host}/product/${p.id}</loc>
      <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.9</priority>
    </url>
  `).join("");
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${host}/</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${host}/products</loc>
    <lastmod>${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${productUrls}
</urlset>`;
  res.send(sitemap);
});
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  const host = req.protocol + "://" + req.get("host");
  res.send(`User-agent: *
Allow: /
Disallow: /api/
Sitemap: ${host}/sitemap.xml
`);
});
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const { useCase, guests, duration, location } = req.body;
    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        recommendation: `\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0627\u062E\u062A\u064A\u0627\u0631\u0643 (${useCase}) \u0644\u0639\u062F\u062F ${guests || "\u0639\u0627\u0626\u0644\u064A"} \u0641\u064A ${location || "\u0635\u0646\u0639\u0627\u0621"}: \u0646\u0646\u0635\u062D\u0643 \u0628\u0640 "\u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 \u0639\u0628\u0648\u0629 500 \u062C\u0631\u0627\u0645 (Zipper Lock)" \u0644\u0627\u0634\u062A\u0639\u0627\u0644 \u064A\u062F\u0648\u0645 \u0623\u0643\u062B\u0631 \u0645\u0646 6 \u0633\u0627\u0639\u0627\u062A \u0628\u062F\u0648\u0646 \u0623\u062F\u062E\u0646\u0629 \u0623\u0648 \u0631\u0648\u0627\u0626\u062D!`,
        recommendedProductId: useCase?.includes("\u0641\u0627\u062E\u0631") || useCase?.includes("\u0628\u062E\u0648\u0631") || useCase?.includes("\u0645\u062C\u0627\u0644\u0633") ? "bg-prem-500g" : "bg-std-1kg"
      });
    }
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `\u0623\u0646\u062A \u062E\u0628\u064A\u0631 \u0645\u0633\u062A\u0634\u0627\u0631 \u0645\u062A\u062C\u0631 "\u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F (Black Gold)" \u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u0641\u062D\u0645 \u0627\u0644\u0641\u0627\u062E\u0631 \u0641\u064A \u0627\u0644\u064A\u0645\u0646 (\u0635\u0646\u0639\u0627\u0621).
\u0627\u0644\u0639\u0645\u064A\u0644 \u064A\u0631\u064A\u062F \u0646\u0635\u064A\u062D\u0629 \u0644\u0634\u0631\u0627\u0621 \u0627\u0644\u0641\u062D\u0645 \u0628\u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062A\u0627\u0644\u064A\u0629:
- \u0633\u0628\u0628 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645: ${useCase}
- \u0639\u062F\u062F \u0627\u0644\u0623\u0634\u062E\u0627\u0635 / \u0627\u0644\u062D\u062C\u0645: ${guests}
- \u0645\u062F\u0629 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629: ${duration}
- \u0627\u0644\u0645\u0648\u0642\u0639: ${location || "\u0635\u0646\u0639\u0627\u0621"}

\u0623\u0639\u0637 \u0646\u0635\u064A\u062D\u0629 \u0645\u062E\u062A\u0635\u0631\u0629 \u0648\u0645\u0634\u0648\u0642\u0629 \u062C\u062F\u0627\u064B \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0623\u0633\u0644\u0648\u0628 \u0631\u0627\u0642\u064A \u0648\u0641\u0627\u062E\u0631\u060C \u0648\u062D\u062F\u062F \u0623\u064A \u0646\u0648\u0639 \u0647\u0648 \u0627\u0644\u0623\u0646\u0633\u0628 \u0644\u0647 \u0645\u0646 \u0645\u0646\u062A\u062C\u0627\u062A\u0646\u0627:
1. \u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 (250g, 500g, 1kg) \u0628\u0646\u0638\u0627\u0645 Zipper Lock \u0627\u0644\u0639\u0627\u0632\u0644 (\u0644\u0644\u0645\u062C\u0627\u0644\u0633 \u0648\u0627\u0644\u0623\u0631\u0627\u062C\u064A\u0644 \u0648\u0627\u0644\u0628\u062E\u0648\u0631 \u0628\u062F\u0648\u0646 \u0631\u0627\u0626\u062D\u0629 \u0623\u0648 \u062F\u062E\u0627\u0646)
2. \u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0634\u0639\u0628\u064A \u0627\u0644\u0627\u0642\u062A\u0635\u0627\u062F\u064A (250g, 500g, 1kg) \u0644\u0644\u0645\u0634\u0627\u0648\u064A \u0648\u0627\u0644\u0637\u0647\u064A \u0627\u0644\u0645\u0646\u0632\u0644\u064A \u0627\u0644\u064A\u0648\u0645\u064A
3. \u0645\u0643\u0639\u0628\u0627\u062A \u0627\u0644\u0625\u0634\u0639\u0627\u0644 \u0627\u0644\u0633\u0631\u064A\u0639 \u0627\u0644\u0630\u0647\u0628\u064A\u0629
4. \u0634\u0648\u0627\u0644\u0627\u062A \u0627\u0644\u0645\u0637\u0627\u0639\u0645 \u0648\u0635\u0646\u0627\u062F\u064A\u0642 \u0627\u0644\u0628\u0642\u0627\u0644\u0627\u062A.

\u0627\u062C\u0639\u0644 \u0627\u0644\u0625\u062C\u0627\u0628\u0629 \u0641\u064A 3 \u0623\u0633\u0637\u0631 \u0645\u0631\u0643\u0632\u0629 \u0645\u0639 \u0646\u0635\u064A\u062D\u0629 \u0644\u0625\u0634\u0639\u0627\u0644 \u0627\u0644\u0641\u062D\u0645 \u0628\u0623\u0639\u0644\u0649 \u0643\u0641\u0627\u0621\u0629.`
    });
    res.json({
      success: true,
      recommendation: response.text,
      recommendedProductId: useCase?.includes("\u0645\u062C\u0627\u0644\u0633") || useCase?.includes("\u0634\u064A\u0634\u0629") || useCase?.includes("\u0641\u0627\u062E\u0631") ? "bg-prem-500g" : "bg-std-1kg"
    });
  } catch (err) {
    console.error("Gemini advisor error:", err);
    res.json({
      success: true,
      recommendation: "\u0646\u0646\u0635\u062D \u0628\u0640 \u0641\u062D\u0645 \u0627\u0644\u0630\u0647\u0628 \u0627\u0644\u0623\u0633\u0648\u062F \u0627\u0644\u0641\u0627\u062E\u0631 (\u0639\u0628\u0648\u0629 500 \u062C\u0631\u0627\u0645 Zipper) \u0644\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0623\u0637\u0648\u0644 \u0645\u062F\u0629 \u0627\u062D\u062A\u0631\u0627\u0642 \u0648\u062D\u0631\u0627\u0631\u0629 \u0646\u0642\u064A\u0629 \u0628\u062F\u0648\u0646 \u0631\u0645\u0627\u062F \u0623\u0648 \u062F\u062E\u0627\u0646.",
      recommendedProductId: "bg-prem-500g"
    });
  }
});
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || "\u062D\u062F\u062B \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639 \u0641\u064A \u0627\u0644\u062E\u0627\u062F\u0645"
    });
  }
});
async function startServer() {
  try {
    if (process.env.NODE_ENV === "production") {
      const missingVars = [];
      if (!process.env.JWT_SECRET) missingVars.push("JWT_SECRET");
      if (!process.env.CLOUDFLARE_DATABASE_ID) missingVars.push("CLOUDFLARE_DATABASE_ID");
      if (!process.env.CLOUDFLARE_ACCOUNT_ID) missingVars.push("CLOUDFLARE_ACCOUNT_ID");
      if (!process.env.CLOUDFLARE_API_TOKEN) missingVars.push("CLOUDFLARE_API_TOKEN");
      if (missingVars.length > 0) {
        console.error(`\u274C CRITICAL PRODUCTION CONFIGURATION ERROR: Missing required environment variables: ${missingVars.join(", ")}`);
        process.exit(1);
      }
      console.log("\u{1F504} [PRODUCTION] Initializing Cloudflare D1 Authoritative Database Layer...");
      await db.init();
      console.log("\u2705 [PRODUCTION] Cloudflare D1 Database Layer Initialized and Authoritative.");
      const distPath = path2.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path2.join(distPath, "index.html"));
      });
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Black Gold Production Server running on http://0.0.0.0:${PORT}`);
      });
    } else {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Black Gold Dev Server running on http://0.0.0.0:${PORT}`);
      });
      console.log("\u{1F504} [DEV] Initializing Cloudflare D1 Database Layer...");
      db.init().then(() => {
        console.log("\u2705 [DEV] Cloudflare D1 Database Layer Initialized and Ready.");
      }).catch((err) => {
        console.warn("\u26A0\uFE0F [DEV] Cloudflare D1 initialization note:", err.message);
      });
    }
  } catch (err) {
    console.error("\u274C CRITICAL SERVER BOOT FAILURE: D1 initialization or schema check failed:", err);
    process.exit(1);
  }
}
var isDirectRun = !process.env.VERCEL && (typeof process !== "undefined" && process.argv[1] && (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.js") || process.argv[1].endsWith("server.cjs")));
if (isDirectRun) {
  startServer();
}
var server_default = app;
export {
  app,
  server_default as default,
  handleD1HealthAndStatus
};
