import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
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

interface TableViewProps {
  groups: {
    title: string;
    subtitle?: string;
    items: SpecificationItem[];
    totalAmount: number;
    roomId?: string;
  }[];
  userRole: UserRole;
  isDarkMode?: boolean;
  onEditItem: (item: SpecificationItem) => void;
  onDeleteItem: (id: string) => void;
  onStatusChange: (id: string, newStatus: ItemStatus) => void;
  onClientStatusChange?: (id: string, newStatus: ClientApprovalStatus, comment?: string) => void;
  onQuantityChange: (id: string, newQty: number) => void;
  onOpenQr: (item: SpecificationItem) => void;
  onOpenPhoto: (photoUrl: string, title: string, allPhotos?: string[]) => void;
  onAddItemToGroup?: (roomId?: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  groups,
  userRole,
  isDarkMode = true,
  onEditItem,
  onDeleteItem,
  onStatusChange,
  onClientStatusChange,
  onQuantityChange,
  onOpenQr,
  onOpenPhoto,
  onAddItemToGroup,
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [clientCommentText, setClientCommentText] = useState<string>('');

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const toggleRowExpand = (itemId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleSaveComment = (itemId: string) => {
    if (onClientStatusChange) {
      const item = groups.flatMap((g) => g.items).find((i) => i.id === itemId);
      onClientStatusChange(
        itemId,
        item?.clientStatus || 'attention',
        clientCommentText.trim()
      );
    }
    setEditingCommentId(null);
  };

  if (groups.length === 0 || groups.every((g) => g.items.length === 0)) {
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
          className={`text-xs max-w-md mx-auto mb-4 ${
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Попробуйте сбросить фильтры поиска или добавьте новую позицию в ведомость комплектации.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isCollapsed = !!collapsedGroups[group.title];

        return (
          <div
            key={group.title}
            className={`border rounded-xl overflow-hidden shadow-lg transition-colors ${
              isDarkMode
                ? 'bg-[#111724] border-[#1d273a]'
                : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            {/* Group Header */}
            <div
              className={`px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b transition-colors ${
                isDarkMode
                  ? 'bg-[#141b29] border-[#1f2b3e]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div
                onClick={() => toggleGroup(group.title)}
                className="flex items-center gap-3 cursor-pointer select-none group"
              >
                <div
                  className={`transition-colors ${
                    isDarkMode
                      ? 'text-slate-400 group-hover:text-amber-400'
                      : 'text-slate-500 group-hover:text-amber-600'
                  }`}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <h2
                    className={`text-sm sm:text-base font-bold tracking-wide ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {group.title}
                  </h2>
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isDarkMode
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {group.items.length}
                  </span>
                </div>

                {group.subtitle && (
                  <span
                    className={`text-xs hidden sm:inline ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    {group.subtitle}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                {userRole !== 'contractor' && (
                  <div className="text-right">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider mr-2 ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      СУММА ПО ГРУППЕ:
                    </span>
                    <span
                      className={`text-sm sm:text-base font-extrabold ${
                        isDarkMode ? 'text-amber-400' : 'text-amber-600'
                      }`}
                    >
                      {formatCurrency(group.totalAmount)}
                    </span>
                  </div>
                )}

                {userRole === 'team' && onAddItemToGroup && (
                  <button
                    onClick={() => onAddItemToGroup(group.roomId)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      isDarkMode
                        ? 'bg-[#192336] hover:bg-amber-500 hover:text-black border-[#2a3a54] text-slate-200'
                        : 'bg-white hover:bg-amber-500 hover:text-black border-slate-300 text-slate-700 shadow-xs'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Добавить</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table of positions */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                  <thead>
                    <tr
                      className={`border-b text-[10px] font-extrabold uppercase tracking-wider ${
                        isDarkMode
                          ? 'border-[#1f2b3e] bg-[#0f1420]/80 text-slate-400'
                          : 'border-slate-200 bg-slate-100 text-slate-600'
                      }`}
                    >
                      <th className="py-2.5 px-3 w-[42px] text-center"></th>
                      <th className="py-2.5 px-3 w-[70px] text-center">ФОТО</th>
                      <th className="py-2.5 px-3 w-[75px]">КОД</th>
                      <th className="py-2.5 px-3 min-w-[200px]">НАИМЕНОВАНИЕ / БРЕНД</th>
                      <th className="py-2.5 px-3 w-[140px]">КАТЕГОРИЯ</th>
                      <th className="py-2.5 px-3 min-w-[190px]">ГАБАРИТЫ, ММ & ОТДЕЛКА</th>
                      <th className="py-2.5 px-3 w-[110px] text-center">КОЛ-ВО</th>
                      {userRole !== 'contractor' && (
                        <>
                          <th className="py-2.5 px-3 w-[110px] text-right">БАЗОВАЯ ЦЕНА</th>
                          <th className="py-2.5 px-3 w-[130px] text-right">ИТОГО СМЕТЫ</th>
                        </>
                      )}
                      <th className="py-2.5 px-3 w-[170px]">
                        {userRole === 'client' ? 'СОГЛАСОВАНИЕ ЗАКАЗЧИКА' : 'СТАТУС'}
                      </th>
                      <th className="py-2.5 px-3 w-[80px] text-center">ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isDarkMode ? 'divide-[#172030]' : 'divide-slate-200'
                    }`}
                  >
                    {group.items.map((item) => {
                      const totalPos = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
                      const statusMeta = STATUS_CONFIG[item.status];
                      const clientStatus = item.clientStatus || 'pending';
                      const clientMeta = CLIENT_STATUS_CONFIG[clientStatus];
                      const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS['Прочее'];
                      const isRowExpanded = !!expandedRows[item.id];
                      const allPhotos = item.additionalPhotos?.length
                        ? [item.mainPhoto, ...item.additionalPhotos].filter(Boolean)
                        : item.mainPhoto
                        ? [item.mainPhoto]
                        : [];

                      return (
                        <React.Fragment key={item.id}>
                          {/* Main Row */}
                          <tr
                            onClick={() => toggleRowExpand(item.id)}
                            className={`transition-colors cursor-pointer select-none ${
                              isDarkMode
                                ? isRowExpanded
                                  ? 'bg-[#152033]/90'
                                  : 'hover:bg-[#141c2c]/60'
                                : isRowExpanded
                                ? 'bg-amber-50/70'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            {/* Row Expand Chevron */}
                            <td className="py-3 px-2 text-center align-middle">
                              <div
                                className={`w-6 h-6 rounded flex items-center justify-center transition-transform duration-200 ${
                                  isRowExpanded ? 'rotate-90 text-amber-500' : 'text-slate-400'
                                }`}
                                title={isRowExpanded ? 'Свернуть детали' : 'Раскрыть полную информацию'}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </td>

                            {/* Image Column */}
                            <td
                              className="py-3 px-2 text-center align-middle"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                onClick={() =>
                                  item.mainPhoto &&
                                  onOpenPhoto(item.mainPhoto, item.name, allPhotos)
                                }
                                className={`w-14 h-14 rounded-lg border overflow-hidden relative cursor-pointer group/img mx-auto shadow-sm ${
                                  isDarkMode
                                    ? 'bg-[#182233] border-[#24324a]'
                                    : 'bg-slate-100 border-slate-300'
                                }`}
                              >
                                {item.mainPhoto ? (
                                  <img
                                    src={item.mainPhoto}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                                    Нет фото
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Maximize2 className="w-4 h-4" />
                                </div>
                                {item.additionalPhotos && item.additionalPhotos.length > 0 && (
                                  <div className="absolute bottom-0.5 right-0.5 bg-black/85 text-amber-300 text-[9px] font-bold px-1 rounded">
                                    +{item.additionalPhotos.length}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Code & QR Column */}
                            <td className="py-3 px-2 align-middle">
                              <div className="space-y-1">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-xs shadow-xs ${
                                    isDarkMode
                                      ? 'bg-slate-800 border border-slate-700 text-amber-300'
                                      : 'bg-slate-100 border border-slate-300 text-amber-700'
                                  }`}
                                >
                                  {item.code}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenQr(item);
                                  }}
                                  className={`flex items-center gap-1 text-[10px] transition-colors cursor-pointer ${
                                    isDarkMode
                                      ? 'text-slate-400 hover:text-amber-400'
                                      : 'text-slate-500 hover:text-amber-600'
                                  }`}
                                  title="Показать QR-код позиции"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                  <span>QR</span>
                                </button>
                              </div>
                            </td>

                            {/* Name / Brand Column */}
                            <td className="py-3 px-3 align-middle">
                              <div className="space-y-0.5 max-w-[280px]">
                                <div
                                  className={`font-bold text-xs sm:text-sm leading-snug line-clamp-2 ${
                                    isDarkMode ? 'text-white' : 'text-slate-900'
                                  }`}
                                >
                                  {item.name}
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
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
                                    <span className="text-slate-400">
                                      арт: {item.article}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Category Column */}
                            <td className="py-3 px-3 align-middle">
                              <div className="space-y-1">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${catColor.bg}`}
                                >
                                  {item.category}
                                </span>
                                {item.subcategory && (
                                  <div
                                    className={`text-[10px] pl-1 ${
                                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                                  >
                                    {item.subcategory}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Dimensions & Finish Column */}
                            <td className="py-3 px-3 align-middle text-xs">
                              <div className="space-y-1 max-w-[240px]">
                                {item.dimensions ? (
                                  <div
                                    className={`font-mono flex items-start gap-1 ${
                                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                                    }`}
                                  >
                                    <span className="text-amber-500 shrink-0">📐</span>
                                    <span className="font-medium">{item.dimensions}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                                {item.finish && (
                                  <div
                                    className={`text-[11px] flex items-start gap-1 ${
                                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                    }`}
                                  >
                                    <span className="text-slate-400 shrink-0">🎨</span>
                                    <span className="line-clamp-1">{item.finish}</span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Quantity Column */}
                            <td
                              className="py-3 px-3 align-middle text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {userRole === 'client' ? (
                                /* Client mode: Read-only quantity */
                                <div className="font-bold text-xs">
                                  <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                                    {item.quantity}
                                  </span>{' '}
                                  <span className="text-[10px] text-slate-400">
                                    {item.unit}
                                  </span>
                                </div>
                              ) : (
                                /* Team / Contractor mode */
                                <div className="inline-flex flex-col items-center gap-1">
                                  <div
                                    className={`flex items-center rounded-lg overflow-hidden border ${
                                      isDarkMode
                                        ? 'bg-[#161f30] border-[#23314c]'
                                        : 'bg-slate-50 border-slate-300'
                                    }`}
                                  >
                                    {userRole === 'team' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onQuantityChange(
                                            item.id,
                                            Math.max(1, item.quantity - 1)
                                          )
                                        }
                                        className="px-1.5 py-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                                        title="Уменьшить"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                    )}
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        if (!isNaN(val) && val >= 1) {
                                          onQuantityChange(item.id, val);
                                        }
                                      }}
                                      disabled={userRole !== 'team'}
                                      className={`w-11 text-center bg-transparent py-1 text-xs font-bold focus:outline-none ${
                                        isDarkMode ? 'text-white' : 'text-slate-900'
                                      }`}
                                    />
                                    {userRole === 'team' && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onQuantityChange(item.id, item.quantity + 1)
                                        }
                                        className="px-1.5 py-1 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                                        title="Увеличить"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {item.unit}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Base Price & Final Price (Hidden for contractor) */}
                            {userRole !== 'contractor' && (
                              <>
                                <td
                                  className={`py-3 px-3 align-middle text-right text-xs font-medium ${
                                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                  }`}
                                >
                                  <div>{formatCurrency(item.basePrice)}</div>
                                </td>

                                <td className="py-3 px-3 align-middle text-right">
                                  <div
                                    className={`font-extrabold text-sm ${
                                      isDarkMode ? 'text-white' : 'text-slate-900'
                                    }`}
                                  >
                                    {formatCurrency(totalPos)}
                                  </div>
                                  {item.supplierDiscount > 0 ? (
                                    <div className="text-[10px] font-semibold text-emerald-500 mt-0.5">
                                      скидка {item.supplierDiscount}%
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-slate-400">
                                      без скидки
                                    </div>
                                  )}
                                </td>
                              </>
                            )}

                            {/* Status Column */}
                            <td
                              className="py-3 px-3 align-middle"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {userRole === 'client' ? (
                                /* CLIENT MODE: Dedicated Client Review Status */
                                <div className="space-y-1.5">
                                  <select
                                    value={clientStatus}
                                    onChange={(e) =>
                                      onClientStatusChange &&
                                      onClientStatusChange(
                                        item.id,
                                        e.target.value as ClientApprovalStatus
                                      )
                                    }
                                    className={`w-full text-xs font-bold rounded-lg px-2.5 py-1.5 border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs ${clientMeta.bg} ${clientMeta.text} ${clientMeta.border}`}
                                  >
                                    {Object.entries(CLIENT_STATUS_CONFIG).map(([cKey, cMeta]) => (
                                      <option
                                        key={cKey}
                                        value={cKey}
                                        className={isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-white text-slate-900'}
                                      >
                                        {cMeta.icon} {cMeta.label}
                                      </option>
                                    ))}
                                  </select>

                                  {item.clientComment && (
                                    <div
                                      className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 truncate ${
                                        isDarkMode
                                          ? 'bg-slate-800 text-slate-300'
                                          : 'bg-slate-100 text-slate-700'
                                      }`}
                                      title={item.clientComment}
                                    >
                                      <MessageSquare className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                      <span className="truncate">{item.clientComment}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* TEAM / CONTRACTOR MODE: Designer Procurement Status */
                                <div className="space-y-1">
                                  <select
                                    value={item.status}
                                    onChange={(e) =>
                                      onStatusChange(item.id, e.target.value as ItemStatus)
                                    }
                                    disabled={userRole === 'contractor'}
                                    className={`w-full text-xs font-medium rounded-lg px-2.5 py-1.5 border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                                  >
                                    {Object.entries(STATUS_CONFIG).map(([stKey, stMeta]) => (
                                      <option
                                        key={stKey}
                                        value={stKey}
                                        className={
                                          isDarkMode
                                            ? 'bg-[#0f172a] text-white'
                                            : 'bg-white text-slate-900'
                                        }
                                      >
                                        {stMeta.label}
                                      </option>
                                    ))}
                                  </select>

                                  {/* Client approval badge preview for team */}
                                  {item.clientStatus && item.clientStatus !== 'pending' && (
                                    <div
                                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border ${clientMeta.bg} ${clientMeta.text} ${clientMeta.border}`}
                                    >
                                      <span>{clientMeta.icon}</span>
                                      <span className="truncate">{clientMeta.shortLabel}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td
                              className="py-3 px-3 align-middle text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {userRole === 'team' ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onEditItem(item)}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isDarkMode
                                          ? 'text-slate-400 hover:text-amber-400 hover:bg-[#1c273a]'
                                          : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                                      }`}
                                      title="Редактировать позицию"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteItem(item.id)}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isDarkMode
                                          ? 'text-slate-400 hover:text-rose-400 hover:bg-[#1c273a]'
                                          : 'text-slate-500 hover:text-rose-600 hover:bg-slate-100'
                                      }`}
                                      title="Удалить позицию"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  /* Client or Contractor mode: expand indicator */
                                  <button
                                    type="button"
                                    onClick={() => toggleRowExpand(item.id)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isDarkMode
                                        ? 'text-slate-400 hover:text-amber-400 hover:bg-[#1c273a]'
                                        : 'text-slate-500 hover:text-amber-600 hover:bg-slate-100'
                                    }`}
                                    title={isRowExpanded ? 'Свернуть' : 'Подробнее'}
                                  >
                                    <ChevronDown
                                      className={`w-4 h-4 transition-transform ${
                                        isRowExpanded ? 'rotate-180 text-amber-500' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDABLE ACCORDION DETAIL ROW */}
                          {isRowExpanded && (
                            <tr
                              className={`border-b transition-colors ${
                                isDarkMode
                                  ? 'bg-[#0d1320] border-[#1d273a]'
                                  : 'bg-slate-50/90 border-slate-200'
                              }`}
                            >
                              <td
                                colSpan={userRole === 'contractor' ? 8 : 10}
                                className="p-4 sm:p-5"
                              >
                                <div className="space-y-4">
                                  {/* Top Banner: Code, Name, Quick Links */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-dashed border-slate-700/50">
                                    <div className="flex items-center gap-2.5">
                                      <span className="px-2.5 py-1 rounded bg-amber-500 text-black font-mono font-black text-xs">
                                        {item.code}
                                      </span>
                                      <h4
                                        className={`font-bold text-sm sm:text-base ${
                                          isDarkMode ? 'text-white' : 'text-slate-900'
                                        }`}
                                      >
                                        {item.name}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {item.link && (
                                        <a
                                          href={item.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-xs transition-colors"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          <span>Сайт / Модель</span>
                                        </a>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onOpenQr(item)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                                          isDarkMode
                                            ? 'bg-[#161f30] border-[#24324a] text-amber-400 hover:bg-slate-800'
                                            : 'bg-white border-slate-300 text-amber-700 hover:bg-slate-100'
                                        }`}
                                      >
                                        <QrCode className="w-3.5 h-3.5" />
                                        <span>Печать QR-стикера</span>
                                      </button>
                                      {userRole === 'team' && (
                                        <button
                                          type="button"
                                          onClick={() => onEditItem(item)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors cursor-pointer"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span>Редактировать</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Grid of specs + photos */}
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                                    {/* Left: Additional Photos Strip / Gallery (4 cols) */}
                                    <div className="lg:col-span-4 space-y-2">
                                      <div
                                        className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}
                                      >
                                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Фотографии позиции ({allPhotos.length})</span>
                                      </div>

                                      {allPhotos.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-2">
                                          {allPhotos.map((photo, pIdx) => (
                                            <div
                                              key={pIdx}
                                              onClick={() =>
                                                onOpenPhoto(photo, `${item.name} (#${pIdx + 1})`, allPhotos)
                                              }
                                              className={`aspect-square rounded-lg border overflow-hidden relative cursor-pointer group shadow-xs ${
                                                isDarkMode
                                                  ? 'bg-[#161f30] border-[#223048]'
                                                  : 'bg-slate-100 border-slate-300'
                                              }`}
                                            >
                                              <img
                                                src={photo}
                                                alt=""
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                              />
                                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                <Maximize2 className="w-3.5 h-3.5" />
                                              </div>
                                              {pIdx === 0 && (
                                                <span className="absolute top-1 left-1 bg-black/80 text-[8px] font-bold text-amber-400 px-1 rounded">
                                                  Осн.
                                                </span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div
                                          className={`p-6 rounded-lg border text-center text-xs ${
                                            isDarkMode
                                              ? 'bg-[#141b29] border-[#202c42] text-slate-500'
                                              : 'bg-white border-slate-200 text-slate-400'
                                          }`}
                                        >
                                          Фотографии не прикреплены
                                        </div>
                                      )}
                                    </div>

                                    {/* Center: Full Specifications (4 cols) */}
                                    <div className="lg:col-span-4 space-y-2 text-xs">
                                      <div
                                        className={`font-bold uppercase tracking-wider ${
                                          isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                        }`}
                                      >
                                        Технические параметры:
                                      </div>

                                      <div
                                        className={`p-3.5 rounded-xl border space-y-2 ${
                                          isDarkMode
                                            ? 'bg-[#131a28] border-[#202c42]'
                                            : 'bg-white border-slate-200'
                                        }`}
                                      >
                                        <div className="flex justify-between py-1 border-b border-slate-700/30">
                                          <span className="text-slate-400">Помещение:</span>
                                          <span className="font-semibold">{item.roomName}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-slate-700/30">
                                          <span className="text-slate-400">Категория:</span>
                                          <span className="font-semibold">{item.category}</span>
                                        </div>
                                        {item.brand && (
                                          <div className="flex justify-between py-1 border-b border-slate-700/30">
                                            <span className="text-slate-400">Бренд / Фабрика:</span>
                                            <span className="font-semibold">{item.brand}</span>
                                          </div>
                                        )}
                                        {item.article && (
                                          <div className="flex justify-between py-1 border-b border-slate-700/30">
                                            <span className="text-slate-400">Артикул / Модель:</span>
                                            <span className="font-mono">{item.article}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between py-1 border-b border-slate-700/30">
                                          <span className="text-slate-400">Габариты (Ш × Г × В):</span>
                                          <span className="font-mono font-bold text-amber-500">
                                            {item.dimensions || '—'}
                                          </span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-slate-700/30">
                                          <span className="text-slate-400">Отделка / Материал:</span>
                                          <span className="font-medium text-right max-w-[180px]">
                                            {item.finish || '—'}
                                          </span>
                                        </div>
                                        {item.deliveryTime && (
                                          <div className="flex justify-between py-1">
                                            <span className="text-slate-400">Срок поставки:</span>
                                            <span className="font-semibold text-emerald-500">
                                              {item.deliveryTime}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Right: Technical Notes & Client Approval Box (4 cols) */}
                                    <div className="lg:col-span-4 space-y-3 text-xs">
                                      {/* Technical Notes */}
                                      <div>
                                        <div
                                          className={`font-bold uppercase tracking-wider mb-1 ${
                                            isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                          }`}
                                        >
                                          Монтажные указания / ТЗ строителям:
                                        </div>
                                        <div
                                          className={`p-3 rounded-xl border text-xs leading-relaxed ${
                                            isDarkMode
                                              ? 'bg-[#181d29] border-[#29354d] text-amber-200'
                                              : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                          }`}
                                        >
                                          {item.techNotes ? (
                                            item.techNotes
                                          ) : (
                                            <span className="text-slate-400 italic">
                                              Особых примечаний не указано
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Client Feedback & Decisions Panel */}
                                      <div
                                        className={`p-3.5 rounded-xl border space-y-2.5 ${
                                          isDarkMode
                                            ? 'bg-[#131b2b] border-[#223049]'
                                            : 'bg-white border-slate-200 shadow-xs'
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-bold flex items-center gap-1.5">
                                            <FileCheck2 className="w-4 h-4 text-emerald-500" />
                                            <span>Согласование Заказчика:</span>
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${clientMeta.bg} ${clientMeta.text} ${clientMeta.border}`}
                                          >
                                            {clientMeta.icon} {clientMeta.label}
                                          </span>
                                        </div>

                                        {/* Quick client action buttons */}
                                        {userRole === 'client' && (
                                          <div className="space-y-2 pt-1">
                                            <div className="grid grid-cols-3 gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  onClientStatusChange &&
                                                  onClientStatusChange(item.id, 'approved')
                                                }
                                                className={`px-2 py-1.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                  clientStatus === 'approved'
                                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                                    : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                                                }`}
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Согласовать</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  onClientStatusChange &&
                                                  onClientStatusChange(item.id, 'attention')
                                                }
                                                className={`px-2 py-1.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                  clientStatus === 'attention'
                                                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                                                    : 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                                                }`}
                                              >
                                                <HelpCircle className="w-3.5 h-3.5" />
                                                <span>Вопрос</span>
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  onClientStatusChange &&
                                                  onClientStatusChange(item.id, 'change_requested')
                                                }
                                                className={`px-2 py-1.5 rounded-lg border font-bold text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                                  clientStatus === 'change_requested'
                                                    ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                                    : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                                                }`}
                                              >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                <span>Аналог</span>
                                              </button>
                                            </div>

                                            {/* Client Comment input */}
                                            {editingCommentId === item.id ? (
                                              <div className="space-y-1.5 pt-1">
                                                <textarea
                                                  rows={2}
                                                  value={clientCommentText}
                                                  onChange={(e) => setClientCommentText(e.target.value)}
                                                  placeholder="Ваш вопрос, замечание или пожелание..."
                                                  className={`w-full rounded-lg p-2 border text-xs focus:outline-none focus:border-amber-500 resize-none ${
                                                    isDarkMode
                                                      ? 'bg-[#0f1522] border-[#223049] text-white'
                                                      : 'bg-slate-50 border-slate-300 text-slate-900'
                                                  }`}
                                                />
                                                <div className="flex items-center justify-end gap-1.5">
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditingCommentId(null)}
                                                    className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
                                                  >
                                                    Отмена
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleSaveComment(item.id)}
                                                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] rounded-md transition-colors"
                                                  >
                                                    Сохранить комментарий
                                                  </button>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="flex items-center justify-between pt-1">
                                                <span className="text-[11px] text-slate-400">
                                                  {item.clientComment
                                                    ? `Заметка: ${item.clientComment}`
                                                    : 'Без комментариев'}
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingCommentId(item.id);
                                                    setClientCommentText(item.clientComment || '');
                                                  }}
                                                  className="text-[11px] text-amber-500 hover:underline font-semibold"
                                                >
                                                  {item.clientComment ? 'Изменить' : '+ Написать вопрос'}
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Designer view of client comment */}
                                        {userRole !== 'client' && item.clientComment && (
                                          <div
                                            className={`p-2 rounded-lg text-xs border flex items-start gap-2 ${
                                              isDarkMode
                                                ? 'bg-[#182338] border-sky-800/40 text-sky-200'
                                                : 'bg-sky-50 border-sky-200 text-sky-900'
                                            }`}
                                          >
                                            <MessageSquare className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                                            <div>
                                              <span className="font-bold block text-[10px] text-sky-400 uppercase">
                                                Комментарий заказчика:
                                              </span>
                                              <span>{item.clientComment}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
