import React from 'react';

/**
 * Premium Luxury Skeletons for Black Gold Charcoal Store
 * Colors: Deep Obsidian #09090D & Charcoal Surface #111118 with slow subtle pulse
 */

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="rounded-3xl bg-[#111118] border border-[#20202E] p-4 flex flex-col justify-between space-y-4 animate-luxury-pulse text-right">
      {/* Image Stage Placeholder */}
      <div className="relative aspect-square w-full rounded-2xl bg-[#161622] border border-[#1E1E2C] overflow-hidden">
        {/* Subtle shimmer accent */}
        <div className="absolute top-3 right-3 w-16 h-6 rounded-lg bg-[#222232]" />
        <div className="absolute bottom-3 left-3 right-3 h-7 rounded-xl bg-[#1D1D2B]" />
      </div>

      {/* Info Placeholders */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 rounded-md bg-[#222232]" />
          <div className="h-3 w-16 rounded-md bg-[#1C1C28]" />
        </div>
        <div className="h-3 w-full rounded-md bg-[#181824]" />
        <div className="h-3 w-3/4 rounded-md bg-[#181824]" />
      </div>

      {/* Weight selector placeholders */}
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <div className="h-8 rounded-xl bg-[#181824] border border-[#222232]" />
        <div className="h-8 rounded-xl bg-[#181824] border border-[#222232]" />
        <div className="h-8 rounded-xl bg-[#181824] border border-[#222232]" />
      </div>

      {/* Bottom price and add-to-cart row */}
      <div className="flex items-center justify-between pt-2 border-t border-[#1C1C28]">
        <div className="space-y-1">
          <div className="h-2.5 w-12 rounded bg-[#181824]" />
          <div className="h-5 w-20 rounded bg-[#222232]" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-[#222232]" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const CartItemSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 rounded-2xl bg-[#14141E] border border-[#20202E] flex items-center justify-between gap-3 animate-luxury-pulse text-right">
      <div className="w-16 h-16 rounded-xl bg-[#181824] border border-[#222232] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-[#222232]" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-12 rounded bg-[#181824]" />
          <div className="h-3 w-16 rounded bg-[#181824]" />
        </div>
      </div>
      <div className="space-y-1.5 flex flex-col items-end">
        <div className="h-4 w-16 rounded bg-[#222232]" />
        <div className="h-7 w-20 rounded-lg bg-[#181824]" />
      </div>
    </div>
  );
};

export const OrderTrackerSkeleton: React.FC = () => {
  return (
    <div className="p-5 rounded-2xl bg-[#14141E] border border-[#20202E] space-y-4 animate-luxury-pulse text-right">
      <div className="flex items-center justify-between border-b border-[#1E1E2C] pb-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 rounded bg-[#222232]" />
          <div className="h-5 w-20 rounded-full bg-[#181824]" />
        </div>
        <div className="h-3 w-28 rounded bg-[#181824]" />
      </div>

      {/* Stepper simulation */}
      <div className="grid grid-cols-4 gap-2 py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#222232]" />
            <div className="h-2.5 w-12 rounded bg-[#181824]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="h-16 rounded-xl bg-[#181824]" />
        <div className="h-16 rounded-xl bg-[#181824]" />
      </div>
    </div>
  );
};
