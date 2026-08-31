import React, { useState } from 'react';
import { Language, GalleryItem } from '../types';
import { INITIAL_GALLERY_ITEMS } from '../data/mockData';
import { resolveAsset } from '../assets/images';
import { Image as ImageIcon, Sparkles, ChevronRight, Eye } from 'lucide-react';

interface MarketingGalleryProps {
  lang: Language;
}

export const MarketingGallery: React.FC<MarketingGalleryProps> = ({ lang }) => {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

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
        {INITIAL_GALLERY_ITEMS.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedImage(item)}
            className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 cursor-pointer aspect-video sm:aspect-square transition-all duration-300 shadow-lg hover:shadow-amber-500/10"
          >
            <img
              src={resolveAsset(item.image)}
              alt={item.titleAr}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

            <div className="absolute bottom-3 right-3 left-3 space-y-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">
                {item.category === 'fleet' ? 'أسطول صنعاء' : item.category === 'sessions' ? 'جلسات الروقان' : item.category === 'retail' ? 'نقاط البيع' : 'الهوية الملكية'}
              </span>
              <h4 className="text-xs font-black text-white line-clamp-1">{item.titleAr}</h4>
            </div>

            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-black/60 backdrop-blur-md text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Preview */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl p-4 text-right"
          >
            <img
              src={resolveAsset(selectedImage.image)}
              alt={selectedImage.titleAr}
              className="w-full max-h-[70vh] object-contain rounded-2xl bg-black"
              referrerPolicy="no-referrer"
            />
            <div className="pt-4 px-2">
              <h3 className="text-base font-black text-white">{selectedImage.titleAr}</h3>
              {selectedImage.descriptionAr && (
                <p className="text-xs text-zinc-400 mt-1">{selectedImage.descriptionAr}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
