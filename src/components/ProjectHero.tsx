import React from 'react';
import { MapPin, Maximize2, Plus } from 'lucide-react';
import { Project, SpecificationItem, UserRole } from '../types';
import { calcItemTotal, formatCurrency } from '../utils/formatters';

interface ProjectHeroProps {
  project: Project;
  items: SpecificationItem[];
  userRole: UserRole;
  isDarkMode?: boolean;
  onOpenAddItem: () => void;
}

export const ProjectHero: React.FC<ProjectHeroProps> = ({
  project,
  items,
  userRole,
  isDarkMode = true,
  onOpenAddItem,
}) => {
  // Budget calculation
  const totalSpent = items.reduce(
    (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
    0
  );
  const remainingBudget = Math.max(0, project.totalBudget - totalSpent);
  const budgetProgress = Math.min(100, Math.round((totalSpent / (project.totalBudget || 1)) * 100));

  // Item counts
  const totalItems = items.length;
  const installedCount = items.filter((it) => it.status === 'installed').length;
  const onSiteCount = items.filter((it) => it.status === 'on_site').length;

  const inProcurementItems = items.filter((it) =>
    ['approved', 'invoice_issued', 'paid_in_production', 'shipping'].includes(it.status)
  );
  const inProcurementCount = inProcurementItems.length;
  const approvedCount = items.filter((it) => it.status === 'approved').length;
  const inProdCount = items.filter((it) => it.status === 'paid_in_production').length;

  return (
    <div
      className={`border rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-colors ${
        isDarkMode
          ? 'bg-[#111724] border-[#1d273a]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Subtle ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-amber-500/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        {/* Left Column: Project Info */}
        <div className="flex-1 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-bold uppercase tracking-wider text-[10px] border border-amber-500/30">
              КОМПЛЕКТАЦИЯ
            </span>
            <span className={isDarkMode ? 'text-slate-300 font-medium' : 'text-slate-600 font-medium'}>
              Клиент: <span className={isDarkMode ? 'text-white font-semibold' : 'text-slate-900 font-bold'}>{project.client}</span>
            </span>
          </div>

          <h1
            className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            {project.name}
          </h1>

          <div
            className={`flex flex-wrap items-center gap-4 text-xs ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{project.address}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{project.area} м²</span>
            </span>
          </div>

          <p
            className={`text-xs max-w-2xl ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {project.description}
          </p>
        </div>

        {/* Right Column: Key Metrics & Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:w-auto">
            {/* Metric 1: Budget */}
            {userRole !== 'contractor' ? (
              <div
                className={`border rounded-xl p-3 sm:p-3.5 min-w-[170px] ${
                  isDarkMode
                    ? 'bg-[#161f30] border-[#23314c]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  БЮДЖЕТ ПРОЕКТА
                </span>
                <div
                  className={`text-lg sm:text-xl font-extrabold mt-0.5 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(totalSpent)}
                </div>
                <div className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  из {formatCurrency(project.totalBudget)}
                </div>

                {/* Progress bar */}
                <div
                  className={`w-full rounded-full h-1.5 mt-2 overflow-hidden ${
                    isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      budgetProgress > 95 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${budgetProgress}%` }}
                  />
                </div>

                <div className="text-[10px] font-semibold text-emerald-500 mt-1.5 flex justify-between">
                  <span>Остаток:</span>
                  <span>{formatCurrency(remainingBudget)}</span>
                </div>
              </div>
            ) : (
              <div
                className={`border rounded-xl p-3 sm:p-3.5 min-w-[150px] ${
                  isDarkMode
                    ? 'bg-[#161f30] border-[#23314c]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  РЕЖИМ ПОДРЯДЧИКА
                </span>
                <div className="text-sm font-bold text-amber-500 mt-1">
                  Монтаж & ТЗ
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Цены скрыты
                </div>
              </div>
            )}

            {/* Metric 2: Positions count */}
            <div
              className={`border rounded-xl p-3 sm:p-3.5 min-w-[140px] ${
                isDarkMode
                  ? 'bg-[#161f30] border-[#23314c]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                ПОЗИЦИИ
              </span>
              <div
                className={`text-lg sm:text-xl font-extrabold mt-0.5 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {totalItems}
              </div>
              <div className="text-[11px] text-emerald-500 font-medium">
                {installedCount + onSiteCount} на объекте
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                В ведомости проекта
              </div>
            </div>

            {/* Metric 3: In Procurement */}
            <div
              className={`border rounded-xl p-3 sm:p-3.5 min-w-[150px] col-span-2 sm:col-span-1 ${
                isDarkMode
                  ? 'bg-[#161f30] border-[#23314c]'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                В ЗАКУПКЕ
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-amber-500 mt-0.5">
                {inProcurementCount}
              </div>
              <div
                className={`text-[11px] font-medium ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {approvedCount} согл. / {inProdCount} в работе
              </div>
              <div className="text-[10px] text-slate-400 mt-2">
                Активный цикл
              </div>
            </div>
          </div>

          {/* Add Item Button (Only for team role) */}
          {userRole === 'team' && (
            <button
              type="button"
              onClick={onOpenAddItem}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-center"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Добавить позицию</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
