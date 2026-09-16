import React from 'react';
import {
  Banknote,
  Building2,
  CheckCircle,
  Clock,
  Layers,
  Percent,
  PiggyBank,
  TrendingUp,
} from 'lucide-react';
import { Project, Room, SpecificationItem, UserRole } from '../types';
import {
  calcDiscountedPrice,
  calcItemTotal,
  CATEGORY_COLORS,
  formatCurrency,
  STATUS_CONFIG,
} from '../utils/formatters';

interface SummaryViewProps {
  project: Project;
  items: SpecificationItem[];
  rooms: Room[];
  userRole: UserRole;
  onSelectRoom: (roomId: string) => void;
  onSelectCategory: (cat: string) => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  project,
  items,
  rooms,
  userRole,
  onSelectRoom,
  onSelectCategory,
}) => {
  // Totals calculations
  let totalBaseSum = 0;
  let totalWithDiscount = 0;
  let totalItemsCount = items.length;

  items.forEach((item) => {
    const base = item.basePrice * item.quantity;
    const finalPrice = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
    totalBaseSum += base;
    totalWithDiscount += finalPrice;
  });

  const totalSupplierSavings = Math.max(0, totalBaseSum - totalWithDiscount);
  const averageDiscount =
    totalBaseSum > 0 ? Math.round((totalSupplierSavings / totalBaseSum) * 100) : 0;

  // Breakdown by Room
  const roomBreakdowns = rooms.map((room) => {
    const roomItems = items.filter((it) => it.roomId === room.id);
    const roomTotal = roomItems.reduce(
      (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
      0
    );
    const percentOfTotal = totalWithDiscount > 0 ? (roomTotal / totalWithDiscount) * 100 : 0;
    return {
      ...room,
      count: roomItems.length,
      total: roomTotal,
      percent: Math.round(percentOfTotal),
    };
  }).sort((a, b) => b.total - a.total);

  // Breakdown by Category
  const categoryMap: Record<string, { count: number; total: number }> = {};
  items.forEach((it) => {
    if (!categoryMap[it.category]) {
      categoryMap[it.category] = { count: 0, total: 0 };
    }
    categoryMap[it.category].count += 1;
    categoryMap[it.category].total += calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity);
  });

  const categoryBreakdowns = Object.entries(categoryMap)
    .map(([cat, val]) => ({
      category: cat,
      count: val.count,
      total: val.total,
      percent: totalWithDiscount > 0 ? Math.round((val.total / totalWithDiscount) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Status Funnel
  const statusCounts: Record<string, number> = {};
  items.forEach((it) => {
    statusCounts[it.status] = (statusCounts[it.status] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Top Highlights */}
      {userRole !== 'contractor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Specification Cost */}
          <div className="bg-[#111724] border border-[#1d273a] rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                ИТОГО СПЕЦИФИКАЦИЯ
              </span>
              <Banknote className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {formatCurrency(totalWithDiscount)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Базовая стоимость: {formatCurrency(totalBaseSum)}
            </div>
          </div>

          {/* Card 2: Client Savings from Supplier Discounts (Requirement 2) */}
          <div className="bg-[#111724] border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-[#111724] to-emerald-950/20">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                ВЫГОДА ЗАКАЗЧИКА
              </span>
              <PiggyBank className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-300">
              {formatCurrency(totalSupplierSavings)}
            </div>
            <div className="text-xs text-emerald-400/80 mt-1 flex items-center gap-1 font-semibold">
              <Percent className="w-3.5 h-3.5" />
              <span>Экономия {averageDiscount}% за счет партнерских скидок</span>
            </div>
          </div>

          {/* Card 3: Positions Readiness */}
          <div className="bg-[#111724] border border-[#1d273a] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                ГОТОВНОСТЬ ОБЪЕКТА
              </span>
              <CheckCircle className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {statusCounts['installed'] || 0} из {totalItemsCount}
            </div>
            <div className="text-xs text-sky-400 mt-1 font-semibold">
              {Math.round(((statusCounts['installed'] || 0) / (totalItemsCount || 1)) * 100)}%
              позиций смонтировано
            </div>
          </div>

          {/* Card 4: Procurement Lead */}
          <div className="bg-[#111724] border border-[#1d273a] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                В ПРОИЗВОДСТВЕ
              </span>
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {statusCounts['paid_in_production'] || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Заказано на фабриках и изготавливается
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Rooms vs Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rooms Breakdown */}
        <div className="bg-[#111724] border border-[#1d273a] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#1d273a] pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Бюджет по помещениям</h3>
            </div>
            <span className="text-xs text-slate-400">{rooms.length} зон</span>
          </div>

          <div className="space-y-3">
            {roomBreakdowns.map((room) => (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room.id)}
                className="p-3 rounded-xl bg-[#161f30] hover:bg-[#1a253a] border border-[#23314c] transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      {room.name}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {room.area ? `(${room.area} м²)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-[11px]">{room.count} поз.</span>
                    {userRole !== 'contractor' && (
                      <span className="font-extrabold text-white text-xs sm:text-sm">
                        {formatCurrency(room.total)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${room.percent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Доля в смете</span>
                  <span className="font-semibold text-slate-300">{room.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Breakdown */}
        <div className="bg-[#111724] border border-[#1d273a] rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#1d273a] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <h3 className="font-bold text-white text-base">Бюджет по категориям</h3>
            </div>
            <span className="text-xs text-slate-400">
              {categoryBreakdowns.length} категорий
            </span>
          </div>

          <div className="space-y-3">
            {categoryBreakdowns.map((cat) => {
              const catColor = CATEGORY_COLORS[cat.category as any] || CATEGORY_COLORS['Прочее'];

              return (
                <div
                  key={cat.category}
                  onClick={() => onSelectCategory(cat.category)}
                  className="p-3 rounded-xl bg-[#161f30] hover:bg-[#1a253a] border border-[#23314c] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${catColor.bg}`}
                      >
                        {cat.category}
                      </span>
                      <span className="text-slate-400 text-[11px]">{cat.count} поз.</span>
                    </div>

                    {userRole !== 'contractor' && (
                      <div className="font-extrabold text-white text-xs sm:text-sm">
                        {formatCurrency(cat.total)}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Доля категории</span>
                    <span className="font-semibold text-slate-300">{cat.percent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Funnel / Lifecycle overview */}
      <div className="bg-[#111724] border border-[#1d273a] rounded-2xl p-5 shadow-lg space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <span>Стадии комплектации (Воронка статусов)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Object.entries(STATUS_CONFIG).map(([stKey, meta]) => {
            const count = statusCounts[stKey] || 0;
            return (
              <div
                key={stKey}
                className="bg-[#161f30] border border-[#23314c] rounded-xl p-3 text-center space-y-1"
              >
                <div className="flex justify-center">
                  <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                </div>
                <div className="text-xl font-black text-white">{count}</div>
                <div className="text-[11px] font-medium text-slate-300 leading-tight">
                  {meta.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
