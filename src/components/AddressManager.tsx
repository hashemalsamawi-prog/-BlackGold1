import React, { useState } from 'react';
import { DeliveryAddress } from '../types';
import { SANAA_DISTRICTS } from '../data/mockData';
import { 
  MapPin, 
  Plus, 
  Check, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  Navigation, 
  Building2, 
  Home, 
  Briefcase,
  X
} from 'lucide-react';

interface AddressManagerProps {
  addresses: DeliveryAddress[];
  selectedAddressId: string;
  onSelectAddress: (id: string) => void;
  onSaveAddress: (address: DeliveryAddress) => void;
  onUpdateAddress: (address: DeliveryAddress) => void;
  onDeleteAddress: (id: string) => void;
  isMandatorySelection?: boolean;
  hasValidationError?: boolean;
  onClearValidationError?: () => void;
}

export const AddressManager: React.FC<AddressManagerProps> = ({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onSaveAddress,
  onUpdateAddress,
  onDeleteAddress,
  isMandatorySelection = false,
  hasValidationError = false,
  onClearValidationError
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [district, setDistrict] = useState(SANAA_DISTRICTS[0]?.id || 'حدة');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setTitle('');
    setDistrict(SANAA_DISTRICTS[0]?.id || 'حدة');
    setStreet('');
    setLandmark('');
    setNotes('');
    setIsAddingNew(false);
    setEditingAddressId(null);
  };

  const handleStartEdit = (addr: DeliveryAddress, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddressId(addr.id);
    setTitle(addr.title);
    setDistrict(addr.district);
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setNotes(addr.notes || '');
    setIsAddingNew(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !street.trim()) return;

    const selectedDistrictObj = SANAA_DISTRICTS.find(d => d.id === district);
    const coords = selectedDistrictObj ? selectedDistrictObj.coords : { lat: 15.348, lng: 44.191 };

    if (editingAddressId) {
      const updated: DeliveryAddress = {
        id: editingAddressId,
        title: title.trim(),
        city: 'صنعاء',
        district,
        street: street.trim(),
        landmark: landmark.trim(),
        notes: notes.trim(),
        coordinates: coords
      };
      onUpdateAddress(updated);
    } else {
      const newAddr: DeliveryAddress = {
        id: 'addr-' + Date.now(),
        title: title.trim(),
        city: 'صنعاء',
        district,
        street: street.trim(),
        landmark: landmark.trim(),
        notes: notes.trim(),
        coordinates: coords,
        isDefault: addresses.length === 0
      };
      onSaveAddress(newAddr);
      onSelectAddress(newAddr.id);
    }

    if (onClearValidationError) onClearValidationError();
    resetForm();
  };

  const getAddressIcon = (titleStr: string) => {
    if (titleStr.includes('عمل') || titleStr.includes('شركة') || titleStr.includes('مكتب')) {
      return <Briefcase className="w-4 h-4 text-amber-400" />;
    }
    if (titleStr.includes('استراحة') || titleStr.includes('ديوان')) {
      return <Building2 className="w-4 h-4 text-amber-400" />;
    }
    return <Home className="w-4 h-4 text-amber-400" />;
  };

  return (
    <div className="space-y-3">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-slate-200">
            عنوان التوصيل بصنعاء: {isMandatorySelection && <span className="text-amber-400">*</span>}
          </span>
        </div>

        {!isAddingNew && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsAddingNew(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة عنوان جديد</span>
          </button>
        )}
      </div>

      {/* Validation Alert */}
      {hasValidationError && (
        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>يرجى اختيار أو إضافة عنوان معتمد لتوصيل الشحنة بصنعاء.</span>
        </div>
      )}

      {/* Saved Addresses List */}
      {!isAddingNew && addresses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {addresses.map((addr) => {
            const isSelected = addr.id === selectedAddressId;
            return (
              <div
                key={addr.id}
                onClick={() => {
                  onSelectAddress(addr.id);
                  if (onClearValidationError) onClearValidationError();
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative text-right flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-black text-xs text-white">
                      {getAddressIcon(addr.title)}
                      <span>{addr.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-normal">
                        {addr.district}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleStartEdit(addr, e)}
                        className="p-1 text-slate-400 hover:text-amber-300 transition-colors"
                        title="تعديل العنوان"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {addresses.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAddress(addr.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                          title="حذف العنوان"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-1">
                    {addr.street}
                  </p>
                  {addr.landmark && (
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 line-clamp-1">
                      <Navigation className="w-3 h-3 text-amber-400/80 shrink-0" />
                      <span>معلم: {addr.landmark}</span>
                    </p>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-2 pt-1.5 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-300 font-bold">
                    <span>العنوان المعتمد للتوصيل</span>
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isAddingNew && addresses.length === 0 && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
          <MapPin className="w-6 h-6 text-amber-400 mx-auto opacity-80" />
          <p className="text-xs text-slate-400">لا يوجد عنوان محفوظ حتى الآن.</p>
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:brightness-110"
          >
            + إضافة عنوان التوصيل الآن
          </button>
        </div>
      )}

      {/* Add / Edit Address Sub-form */}
      {isAddingNew && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-300">
              {editingAddressId ? 'تعديل بيانات العنوان' : 'إضافة عنوان توصيل جديد بصنعاء'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-2.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  اسم أو تسمية العنوان (مثال: المنزل، العمل، الاستراحة): <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المنزل - حدة"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  المديرية / المنطقة في صنعاء: <span className="text-amber-400">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg outline-none focus:border-amber-500 text-xs"
                >
                  {SANAA_DISTRICTS.map((dist) => (
                    <option key={dist.id} value={dist.id}>
                      {dist.nameAr} ({dist.fee.toLocaleString()} ريال)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  اسم الشارع ورقم العمارة / البوابة: <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شارع صخر - جوار سوبرماركت السعيد"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                  أقرب معلم بارز (مسجد، جولة، مدرسة):
                </label>
                <input
                  type="text"
                  placeholder="مثال: بجوار مدرسة الأوائل"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                توجيهات للمندوب عند الوصول:
              </label>
              <input
                type="text"
                placeholder="مثال: البوابة على اليمين، اتصل عند الوصول"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-lg outline-none focus:border-amber-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg gold-gradient-bg text-slate-950 font-black text-xs hover:brightness-110"
              >
                {editingAddressId ? 'حفظ التعديلات' : 'إضافة وتثبيت العنوان'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
