import React, { useState } from 'react';
import {
  ImagePlus,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ItemCategory, ItemStatus, Room, SpecificationItem } from '../types';
import {
  calcDiscountedPrice,
  calcItemTotal,
  CATEGORIES,
  formatCurrency,
  formatDimensionsInput,
  STATUS_CONFIG,
  UNITS,
} from '../utils/formatters';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: SpecificationItem) => void;
  initialItem?: SpecificationItem | null;
  rooms: Room[];
  categories?: string[];
  isDarkMode?: boolean;
  defaultRoomId?: string;
  projectId?: string;
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  rooms,
  categories,
  isDarkMode = true,
  defaultRoomId,
  projectId,
}) => {
  if (!isOpen) return null;

  const categoryList = categories && categories.length > 0 ? categories : CATEGORIES;

  const isEditing = !!initialItem;

  const [code, setCode] = useState(initialItem?.code || '');
  const [name, setName] = useState(initialItem?.name || '');
  const [roomId, setRoomId] = useState(
    initialItem?.roomId || defaultRoomId || rooms[0]?.id || ''
  );
  const [category, setCategory] = useState<ItemCategory>(
    initialItem?.category || 'Мебель'
  );
  const [subcategory, setSubcategory] = useState(initialItem?.subcategory || '');
  const [brand, setBrand] = useState(initialItem?.brand || '');
  const [article, setArticle] = useState(initialItem?.article || '');
  const [dimensions, setDimensions] = useState(initialItem?.dimensions || '');
  const [finish, setFinish] = useState(initialItem?.finish || '');
  const [quantity, setQuantity] = useState(initialItem?.quantity ?? 1);
  const [unit, setUnit] = useState(initialItem?.unit || 'шт');
  const [basePrice, setBasePrice] = useState(initialItem?.basePrice ?? 0);
  const [supplierDiscount, setSupplierDiscount] = useState(
    initialItem?.supplierDiscount ?? 0
  );
  const [mainPhoto, setMainPhoto] = useState(initialItem?.mainPhoto || '');
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(
    initialItem?.additionalPhotos || []
  );
  const [newAddPhotoUrl, setNewAddPhotoUrl] = useState('');
  const [status, setStatus] = useState<ItemStatus>(
    initialItem?.status || 'in_selection'
  );
  const [deliveryTime, setDeliveryTime] = useState(
    initialItem?.deliveryTime || ''
  );
  const [supplier, setSupplier] = useState(initialItem?.supplier || '');
  const [link, setLink] = useState(initialItem?.link || '');
  const [techNotes, setTechNotes] = useState(initialItem?.techNotes || '');

  // Live calculations (Requirement 2)
  const priceWithDiscount = calcDiscountedPrice(basePrice, supplierDiscount);
  const totalAmount = calcItemTotal(basePrice, supplierDiscount, quantity);

  // Requirement 3: Automatic '×' delimiter after typing space in dimensions field
  const handleDimensionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatDimensionsInput(rawVal, dimensions);
    setDimensions(formatted);
  };

  // Main photo file upload
  const handleMainPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMainPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Additional photos file upload
  const handleAddPhotosFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setAdditionalPhotos((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const addPhotoFromUrl = () => {
    if (newAddPhotoUrl.trim()) {
      setAdditionalPhotos((prev) => [...prev, newAddPhotoUrl.trim()]);
      setNewAddPhotoUrl('');
    }
  };

  const removeAdditionalPhoto = (index: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const currentRoom = rooms.find((r) => r.id === roomId);
    const roomName = currentRoom?.name || 'Без помещения';

    const itemData: SpecificationItem = {
      id: initialItem?.id || `item-${Date.now()}`,
      projectId: initialItem?.projectId || projectId || 'proj-1',
      code: code.trim() || `П-${Math.floor(Math.random() * 900 + 100)}`,
      name: name.trim(),
      roomId,
      roomName,
      category,
      subcategory: subcategory.trim(),
      brand: brand.trim(),
      article: article.trim(),
      dimensions: dimensions.trim(),
      finish: finish.trim(),
      quantity: Number(quantity) || 1,
      unit,
      basePrice: Number(basePrice) || 0,
      supplierDiscount: Number(supplierDiscount) || 0,
      mainPhoto: mainPhoto.trim(),
      additionalPhotos,
      status,
      deliveryTime: deliveryTime.trim(),
      supplier: supplier.trim(),
      link: link.trim(),
      techNotes: techNotes.trim(),
      createdAt: initialItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(itemData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f1522] border border-[#23314c] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#1c283d] flex items-center justify-between bg-[#131b2c]">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isEditing ? 'Редактирование позиции комплектации' : 'Новая позиция комплектации'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Row 1: Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Маркировка / Код
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="например: СТ-01, М-04"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Наименование изделия / материала <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="например: Кухонный гарнитур под заказ со встроенной подсветкой"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Room, Category, Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Помещение
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="">— Без привязки к помещению —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Категория
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {categoryList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Подкатегория
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="например: Шкафы, Бра, Керамогранит"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 3: Brand & Article */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Бренд / Фабрика / Мастерская
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="например: Flos, B&B Italia, Столярка Верста"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Артикул / Модель
              </label>
              <input
                type="text"
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                placeholder="например: FLOS-204-BR"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Dimensions & Finish (with auto × helper) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Габариты, мм (Ш × Г × В)
                </label>
                <span className="text-[10px] text-amber-400 font-medium">
                  «×» подставится автоматически после пробела
                </span>
              </div>
              <input
                type="text"
                value={dimensions}
                onChange={handleDimensionsChange}
                placeholder="например: 2800 1200 850"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Отделка / Материал / RAL / Цвет
              </label>
              <input
                type="text"
                value={finish}
                onChange={(e) => setFinish(e.target.value)}
                placeholder="например: Шпон ореха, эмаль NCS S 2005-Y20R, матовая"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 5: Pricing, Quantity, Supplier Discount (Requirement 2 & 8) */}
          <div className="bg-[#141c2c] border border-[#23314c] p-4 rounded-xl space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Кол-во <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ед. изм.
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Базовая цена за ед. (₸) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-400 mb-1">
                  Скидка заказчику (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={supplierDiscount}
                  onChange={(e) =>
                    setSupplierDiscount(Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)))
                  }
                  className="w-full bg-[#161f30] border border-emerald-500/40 rounded-lg px-3 py-2 text-xs sm:text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Calculated totals */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e2a3f] text-xs">
              <div className="text-slate-300">
                Цена со скидкой поставщика:{' '}
                <span className="font-bold text-emerald-400">
                  {formatCurrency(priceWithDiscount)}
                </span>
              </div>

              <div className="text-sm font-extrabold text-white">
                Итоговая стоимость:{' '}
                <span className="text-amber-400 font-black text-base">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Row 6: Main Photo & Additional Photos (Requirement 1 & 6) */}
          <div className="bg-[#141c2c] border border-[#23314c] p-4 rounded-xl space-y-4">
            {/* Main Photo Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  🖼 Основное фото товара
                </span>
                <span className="text-[10px] text-slate-400">
                  Отображается в таблице, карточке и экспорте
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Preview Thumbnail */}
                <div className="w-20 h-20 rounded-lg bg-[#161f30] border border-[#23314c] overflow-hidden shrink-0 flex items-center justify-center">
                  {mainPhoto ? (
                    <img
                      src={mainPhoto}
                      alt="Превью"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-500">Превью</span>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    type="url"
                    value={mainPhoto}
                    onChange={(e) => setMainPhoto(e.target.value)}
                    placeholder="Ссылка на основное фото (URL)"
                    className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Выберите файл</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleMainPhotoFile}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-400 truncate">
                      {mainPhoto ? 'Фото загружено' : 'Файл не выбран'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Photos Section */}
            <div className="pt-3 border-t border-[#1e2a3f]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  📸 Дополнительные фото (детали, ракурсы, фактуры, чертежи)
                </span>

                <label className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 border border-amber-800/40 text-xs font-semibold cursor-pointer transition-colors">
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span>+ Загрузить фото</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleAddPhotosFile}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL input for additional photos */}
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newAddPhotoUrl}
                  onChange={(e) => setNewAddPhotoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPhotoFromUrl();
                    }
                  }}
                  placeholder="Или вставьте прямую ссылку на доп. фото и нажмите ↵"
                  className="flex-1 bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={addPhotoFromUrl}
                  className="px-3 py-1.5 bg-[#1e2a3f] hover:bg-[#283854] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  Добавить
                </button>
              </div>

              {/* Thumbnails grid */}
              {additionalPhotos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {additionalPhotos.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 rounded-lg overflow-hidden border border-[#23314c] group"
                    >
                      <img
                        src={url}
                        alt={`Доп фото ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalPhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-[#23314c] text-center text-xs text-slate-500">
                  Дополнительные фото пока не добавлены
                </div>
              )}
            </div>
          </div>

          {/* Row 7: Status, Delivery, Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Статус комплектации
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                {Object.entries(STATUS_CONFIG).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Срок поставки / готовности
              </label>
              <input
                type="text"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                placeholder="например: 6-8 недель, в наличии"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Поставщик / Салон / Контакт
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="например: Салон Flat, менеджер Анна"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 8: URL Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Ссылка на товар / чертеж (URL)
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Row 9: Tech notes / Builder notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Техническое задание / Примечания строителям / Особенности монтажа
            </label>
            <textarea
              rows={2}
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
              placeholder="Особенности замера, фурнитура, вывод розеток, закладные детали..."
              className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1c283d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Сохранить в ведомость
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
