import React, { useState } from 'react';
import { Language, GalleryItem } from '../types';
import { INITIAL_GALLERY_ITEMS } from '../data/mockData';
import { resolveAsset, ASSETS } from '../assets/images';
import { Image as ImageIcon, Sparkles, ChevronRight, Eye, X, ChevronLeft } from 'lucide-react';

interface MarketingGalleryProps {
  lang: Language;
  items?: GalleryItem[];
  enableAnimations?: boolean;
}

export const MarketingGallery: React.FC<MarketingGalleryProps> = ({ 
  lang, 
  items, 
  enableAnimations = true 
}) => {
  const displayItems = items && items.length > 0 ? items : INITIAL_GALLERY_ITEMS;
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const selectedItem = selectedImageIndex !== null ? displayItems[selectedImageIndex] : null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % displayItems.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + displayItems.length) % displayItems.length);
    }
  };

  return (
    <section className="space-y-6 pt-4 text-right">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-black text-white">معرض صور وتطبيقات الذهب الأسود</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">مشاهد حية من خطوط الإنتاج، أسطول التوصيل، وجلسات الشيشة والضيافة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayItems.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => setSelectedImageIndex(idx)}
            className={`group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 cursor-pointer aspect-video sm:aspect-square transition-all duration-300 shadow-lg hover:shadow-amber-500/15 ${
              enableAnimations ? 'transform hover:-translate-y-1' : ''
            }`}
          >
            <img
              src={resolveAsset(item.image)}
              alt={item.titleAr}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                enableAnimations ? 'group-hover:scale-105' : ''
              }`}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== ASSETS.pouchPair) {
                  target.src = ASSETS.pouchPair;
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

            <div className="absolute bottom-3 right-3 left-3 space-y-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                {item.category === 'fleet'
                  ? 'أسطول صنعاء'
                  : item.category === 'sessions'
                  ? 'جلسات الروقان'
                  : item.category === 'retail'
                  ? 'نقاط البيع'
                  : 'الهوية الملكية'}
              </span>
              <h4 className="text-xs font-black text-white line-clamp-1">{item.titleAr}</h4>
            </div>

            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-black/70 backdrop-blur-md text-amber-400 shadow-lg border border-amber-500/30">
              <Eye className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Preview */}
      {selectedItem && (
        <div
          onClick={() => setSelectedImageIndex(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl p-4 text-right"
          >
            <button 
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-6 left-6 z-10 p-2 rounded-full bg-black/70 text-white hover:text-amber-400 hover:bg-black border border-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Navigation buttons */}
            {displayItems.length > 1 && (
              <>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-all z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/20 transition-all z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px]">
              <img
                src={resolveAsset(selectedItem.image)}
                alt={selectedItem.titleAr}
                className="w-full max-h-[70vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = ASSETS.pouchPair;
                }}
              />
            </div>
            
            <div className="pt-4 px-2">
              <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block mb-1">
                {selectedItem.category === 'fleet'
                  ? 'أسطول صنعاء'
                  : selectedItem.category === 'sessions'
                  ? 'جلسات الروقان'
                  : selectedItem.category === 'retail'
                  ? 'نقاط البيع'
                  : 'الهوية الملكية'}
              </span>
              <h3 className="text-base font-black text-white">{selectedItem.titleAr}</h3>
              {selectedItem.descriptionAr && (
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{selectedItem.descriptionAr}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
