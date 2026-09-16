import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ExternalLink,
  FileCheck2,
  HelpCircle,
  Image as ImageIcon,
  Maximize2,
  MessageSquare,
  Minus,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Store,
  Trash2,
} from 'lucide-react';
import { ClientApprovalStatus, ItemStatus, SpecificationItem, UserRole } from '../types';
import {
  calcDiscountedPrice,
  calcItemTotal,
  CATEGORY_COLORS,
  CLIENT_STATUS_CONFIG,
  formatCurrency,
  STATUS_CONFIG,
} from '../utils/formatters';

interface CardsViewProps {
  items: SpecificationItem[];
  userRole: UserRole;
  isDarkMode?: boolean;
  onEditItem: (item: SpecificationItem) => void;
  onDeleteItem: (id: string) => void;
  onStatusChange?: (id: string, newStatus: ItemStatus) => void;
  onClientStatusChange?: (id: string, newStatus: ClientApprovalStatus, comment?: string) => void;
  onQuantityChange: (id: string, newQty: number) => void;
  onOpenQr: (item: SpecificationItem) => void;
  onOpenPhoto: (photoUrl: string, title: string, allPhotos?: string[]) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  items,
  userRole,
  isDarkMode = true,
  onEditItem,
  onDeleteItem,
  onClientStatusChange,
  onQuantityChange,
  onOpenQr,
  onOpenPhoto,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<string>('');

  const toggleCardExpand = (itemId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSaveComment = (itemId: string) => {
    if (onClientStatusChange) {
      const item = items.find((i) => i.id === itemId);
      onClientStatusChange(
        itemId,
        item?.clientStatus || 'attention',
        commentText.trim()
      );
    }
    setEditingCommentId(null);
  };

  if (items.length === 0) {
    return (
      <div
        className={`border rounded-2xl p-12 text-center transition-colors ${
          isDarkMode
            ? 'bg-[#111724] border-[#1d273a] text-slate-300'
            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
        }`}
      >
        <div
          className={`w-16 h-16 rounded-full border flex items-center justify-center mx-auto mb-4 ${
            isDarkMode
              ? 'bg-[#161f30] border-[#23314c] text-slate-400'
              : 'bg-slate-100 border-slate-300 text-slate-500'
          }`}
        >
          <Store className="w-8 h-8" />
        </div>
        <h3
          className={`text-lg font-bold mb-1 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          Позиции не найдены
        </h3>
        <p
          className={`text-xs max-w-md mx-auto ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Измените параметры поиска или фильтров для отображения товаров.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
      {items.map((item) => {
        const totalAmount = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
        const statusMeta = STATUS_CONFIG[item.status];
        const clientStatus = item.clientStatus || 'pending';
        const clientMeta = CLIENT_STATUS_CONFIG[clientStatus];
        const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Прочее'];
        const isExpanded = !!expandedCards[item.id];
        const allPhotos = item.additionalPhotos?.length
          ? [item.mainPhoto, ...item.additionalPhotos].filter(Boolean)
          : item.mainPhoto
          ? [item.mainPhoto]
          : [];

        return (
          <div
            key={item.id}
            className={`border rounded-xl overflow-hidden shadow-md flex flex-col transition-all duration-200 group ${
              isDarkMode
                ? 'bg-[#121825] border-[#1d273b] hover:border-amber-500/40 text-slate-100'
                : 'bg-white border-slate-200 hover:border-amber-400 text-slate-900 shadow-sm'
            }`}
          >
            {/* Card Top: Large High-Resolution Image & Badges */}
            <div
              className={`relative h-48 w-full overflow-hidden ${
                isDarkMode ? 'bg-[#172030]' : 'bg-slate-100'
              }`}
            >
              {item.mainPhoto ? (
                <img
                  src={item.mainPhoto}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  onClick={() => onOpenPhoto(item.mainPhoto, item.name, allPhotos)}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  Нет основного фото
                </div>
              )}

              {/* Code pill top-left */}
              <div className="absolute top-2.5 left-2.5">
                <span className="px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-white/20 font-mono font-bold text-xs text-amber-400 shadow-md">
                  {item.code}
                </span>
              </div>

              {/* Status pill top-right */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                {userRole === 'client' ? (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 backdrop-blur-md shadow-md border ${clientMeta.bg} ${clientMeta.text} ${clientMeta.border}`}
                  >
                    <span>{clientMeta.icon}</span>
                    <span>{clientMeta.shortLabel}</span>
                  </span>
                ) : (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-md border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                    {statusMeta.label}
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenQr(item);
                  }}
                  className="p-1 rounded-full bg-black/70 hover:bg-black text-white hover:text-amber-400 backdrop-blur-md border border-white/20 transition-colors cursor-pointer"
                  title="Открыть QR код"
                >
                  <QrCode className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom and additional photos count */}
              <div
                onClick={() => onOpenPhoto(item.mainPhoto, item.name, allPhotos)}
                className="absolute bottom-2 right-2 flex items-center gap-1 cursor-pointer"
              >
                {item.additionalPhotos && item.additionalPhotos.length > 0 && (
                  <span className="bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    +{item.additionalPhotos.length} фото
                  </span>
                )}
                <span className="p-1 rounded-md bg-black/60 text-white/80 hover:text-white backdrop-blur-md">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                {/* Category & Room Row */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${catColor.bg}`}
                  >
                    {item.category}
                  </span>
                  <span
                    className={`font-medium text-[11px] truncate ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {item.roomName}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`font-bold text-sm leading-snug line-clamp-2 transition-colors ${
                    isDarkMode
                      ? 'text-white group-hover:text-amber-300'
                      : 'text-slate-900 group-hover:text-amber-600'
                  }`}
                >
                  {item.name}
                </h3>

                {/* Brand & Artikul */}
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                  {item.brand && (
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}
                    >
                      <Store className="w-3 h-3 text-amber-500" />
                      {item.brand}
                    </span>
                  )}
                  {item.article && (
                    <span className="font-mono text-[11px] text-slate-400">
                      арт: {item.article}
                    </span>
                  )}
                </div>

                {/* Dimensions (Ш × Г × В) */}
                {item.dimensions && (
                  <div
                    className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-amber-500">📐</span>
                    <span className="font-medium truncate">{item.dimensions}</span>
                  </div>
                )}

                {/* Finish */}
                {item.finish && (
                  <div className="text-xs flex items-start gap-1.5 line-clamp-2">
                    <span className="text-slate-400 shrink-0 mt-0.5">🎨</span>
                    <span
                      className={`text-[11px] leading-tight ${
                        isDarkMode ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    >
                      {item.finish}
                    </span>
                  </div>
                )}

                {/* EXPANDABLE ACCORDION SECTION */}
                {isExpanded && (
                  <div
                    className={`mt-3 pt-3 border-t space-y-3 animate-in fade-in duration-200 ${
                      isDarkMode ? 'border-[#223048]' : 'border-slate-200'
                    }`}
                  >
                    {/* Tech Notes */}
                    {item.techNotes && (
                      <div
                        className={`text-xs p-2.5 rounded-lg border leading-relaxed ${
                          isDarkMode
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <span className="font-bold block text-[10px] text-amber-500 uppercase">
                          ТЗ строителям:
                        </span>
                        {item.techNotes}
                      </div>
                    )}

                    {/* Additional Photos Thumbnails */}
                    {item.additionalPhotos && item.additionalPhotos.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-amber-500" />
                          Все фото ({allPhotos.length}):
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {allPhotos.map((ph, idx) => (
                            <div
                              key={idx}
                              onClick={() => onOpenPhoto(ph, `${item.name} (#${idx + 1})`, allPhotos)}
                              className="aspect-square rounded border border-slate-700/50 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <img src={ph} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery & Link */}
                    <div className="space-y-1 text-xs">
                      {item.deliveryTime && (
                        <div className="flex justify-between py-1 border-b border-slate-700/20">
                          <span className="text-slate-400">Срок поставки:</span>
                          <span className="font-semibold text-emerald-500">{item.deliveryTime}</span>
                        </div>
                      )}
                      {userRole === 'team' && item.supplier && (
                        <div className="flex justify-between py-1 border-b border-slate-700/20">
                          <span className="text-slate-400">Поставщик:</span>
                          <span className="font-semibold text-right max-w-[150px] truncate">
                            {item.supplier}
                          </span>
                        </div>
                      )}
                      {item.link && (
                        <div className="pt-1">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-sky-500 hover:underline font-semibold"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Открыть страницу товара</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Client Approval Bar in Card */}
                    {userRole === 'client' && (
                      <div
                        className={`p-2.5 rounded-lg border space-y-2 ${
                          isDarkMode
                            ? 'bg-[#151f33] border-[#223352]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Ваше решение:</span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${clientMeta.bg} ${clientMeta.text} ${clientMeta.border}`}>
                            {clientMeta.icon} {clientMeta.shortLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onClientStatusChange &&
                              onClientStatusChange(item.id, 'approved')
                            }
                            className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                              clientStatus === 'approved'
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>Да</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onClientStatusChange &&
                              onClientStatusChange(item.id, 'attention')
                            }
                            className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                              clientStatus === 'attention'
                                ? 'bg-amber-600 text-white border-amber-500'
                                : 'bg-amber-950/40 text-amber-300 border-amber-800/40 hover:bg-amber-900/60'
                            }`}
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>Вопрос</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onClientStatusChange &&
                              onClientStatusChange(item.id, 'change_requested')
                            }
                            className={`py-1 rounded text-[10px] font-bold flex items-center justify-center gap-0.5 transition-all cursor-pointer border ${
                              clientStatus === 'change_requested'
                                ? 'bg-rose-600 text-white border-rose-500'
                                : 'bg-rose-950/40 text-rose-300 border-rose-800/40 hover:bg-rose-900/60'
                            }`}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Замена</span>
                          </button>
                        </div>

                        {/* Client comment */}
                        {editingCommentId === item.id ? (
                          <div className="space-y-1 pt-1">
                            <textarea
                              rows={2}
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              placeholder="Напишите комментарий..."
                              className="w-full text-xs p-1.5 rounded border bg-black/40 text-white focus:outline-none"
                            />
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingCommentId(null)}
                                className="text-[10px] text-slate-400 px-2 py-0.5"
                              >
                                Отмена
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveComment(item.id)}
                                className="text-[10px] bg-amber-500 text-black font-bold px-2 py-0.5 rounded"
                              >
                                Сохранить
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px] pt-1">
                            <span className="text-slate-400 truncate max-w-[140px]">
                              {item.clientComment || 'Без комментариев'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(item.id);
                                setCommentText(item.clientComment || '');
                              }}
                              className="text-amber-500 font-semibold hover:underline"
                            >
                              {item.clientComment ? 'Изменить' : '+ Заметка'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Expand / Collapse toggle button */}
                <button
                  type="button"
                  onClick={() => toggleCardExpand(item.id)}
                  className={`w-full py-1.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#162033] border-[#24334f] text-slate-300 hover:text-white hover:border-amber-500/50'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{isExpanded ? 'Свернуть детали' : 'Раскрыть подробнее'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-amber-500' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Card Footer: Quantity, Price, Actions */}
              <div
                className={`pt-3 border-t space-y-2 ${
                  isDarkMode ? 'border-[#1d273b]' : 'border-slate-200'
                }`}
              >
                {/* Quantity inline */}
                <div className="flex items-center justify-between text-xs">
                  <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                    Количество:
                  </span>
                  {userRole === 'client' ? (
                    <span className="font-bold">
                      {item.quantity} {item.unit}
                    </span>
                  ) : (
                    <div
                      className={`flex items-center rounded-md overflow-hidden border ${
                        isDarkMode
                          ? 'bg-[#161f30] border-[#23314c]'
                          : 'bg-slate-50 border-slate-300'
                      }`}
                    >
                      {userRole === 'team' && (
                        <button
                          type="button"
                          onClick={() =>
                            onQuantityChange(item.id, Math.max(1, item.quantity - 1))
                          }
                          className="px-2 py-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                      )}
                      <span className="px-2 py-0.5 font-bold text-xs">
                        {item.quantity} {item.unit}
                      </span>
                      {userRole === 'team' && (
                        <button
                          type="button"
                          onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Financials (Hidden for contractor) */}
                {userRole !== 'contractor' ? (
                  <div className="flex items-end justify-between">
                    <div>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider block ${
                          isDarkMode ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        ИТОГОВАЯ ЦЕНА
                      </span>
                      <div
                        className={`text-lg font-extrabold leading-tight ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrency(totalAmount)}
                      </div>
                      {item.supplierDiscount > 0 && (
                        <div className="text-[10px] font-semibold text-emerald-500">
                          Скидка {item.supplierDiscount}%
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {userRole === 'team' && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isDarkMode
                                ? 'bg-[#161f30] hover:bg-amber-500 hover:text-black border-[#23314c] text-slate-300'
                                : 'bg-slate-50 hover:bg-amber-500 hover:text-black border-slate-300 text-slate-700'
                            }`}
                            title="Редактировать"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item.id)}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isDarkMode
                                ? 'bg-[#161f30] hover:bg-rose-500 hover:text-white border-[#23314c] text-slate-300'
                                : 'bg-slate-50 hover:bg-rose-500 hover:text-white border-slate-300 text-slate-700'
                            }`}
                            title="Удалить"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-amber-500 font-semibold">Готовность к монтажу</span>
                    <button
                      type="button"
                      onClick={() => onOpenQr(item)}
                      className={`text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                        isDarkMode
                          ? 'text-slate-300 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Наклейка</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
