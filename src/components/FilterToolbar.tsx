import React from 'react';
import {
  BarChart3,
  CheckSquare,
  LayoutGrid,
  List,
  Search,
  Square,
  X,
} from 'lucide-react';
import { ItemCategory, ItemStatus, Room } from '../types';
import { CATEGORIES, STATUS_CONFIG } from '../utils/formatters';

export type ViewMode = 'table' | 'cards' | 'summary';
export type GroupByMode = 'room' | 'category' | 'status' | 'none';

interface FilterToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRoom: string;
  onRoomChange: (r: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  onlyWithDiscount: boolean;
  onToggleOnlyWithDiscount: () => void;
  groupBy: GroupByMode;
  onGroupByChange: (g: GroupByMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  rooms: Room[];
  categories?: string[];
  isDarkMode?: boolean;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  searchQuery,
  onSearchChange,
  selectedRoom,
  onRoomChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  onlyWithDiscount,
  onToggleOnlyWithDiscount,
  groupBy,
  onGroupByChange,
  viewMode,
  onViewModeChange,
  rooms,
  categories,
  isDarkMode = true,
}) => {
  const categoryList = categories && categories.length > 0 ? categories : CATEGORIES;

  return (
    <div
      className={`border rounded-xl p-3 sm:p-4 space-y-3 transition-colors ${
        isDarkMode
          ? 'bg-[#111724] border-[#1d273a]'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      {/* Top Row: Search and Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Поиск по названию, коду, бренду, артикулу, размерам, ТЗ..."
            className={`w-full rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors ${
              isDarkMode
                ? 'bg-[#161f30] border border-[#23314c] text-slate-100 placeholder-slate-400'
                : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Room Filter */}
        <select
          value={selectedRoom}
          onChange={(e) => onRoomChange(e.target.value)}
          className={`rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer border ${
            isDarkMode
              ? 'bg-[#161f30] border-[#23314c] text-slate-200'
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">Все помещения ({rooms.length})</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={`rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer border ${
            isDarkMode
              ? 'bg-[#161f30] border-[#23314c] text-slate-200'
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">Все категории ({categoryList.length})</option>
          {categoryList.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-amber-500 transition-colors cursor-pointer border ${
            isDarkMode
              ? 'bg-[#161f30] border-[#23314c] text-slate-200'
              : 'bg-slate-50 border-slate-300 text-slate-800'
          }`}
        >
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_CONFIG).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bottom Row: Grouping, Supplier Discount Toggle, View Switcher */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pt-2 border-t ${
          isDarkMode ? 'border-[#1d273a]' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Grouping select */}
          <div className="flex items-center gap-2">
            <span
              className={`font-medium ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Группа:
            </span>
            <select
              value={groupBy}
              onChange={(e) => onGroupByChange(e.target.value as GroupByMode)}
              className={`border rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer ${
                isDarkMode
                  ? 'bg-[#161f30] border-[#23314c] text-slate-200'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <option value="room">По комнатам</option>
              <option value="category">По категориям</option>
              <option value="status">По статусам</option>
              <option value="none">Без группировки</option>
            </select>
          </div>

          {/* Supplier Discount Checkbox */}
          <button
            type="button"
            onClick={onToggleOnlyWithDiscount}
            className={`flex items-center gap-2 transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-700 hover:text-black'
            }`}
          >
            {onlyWithDiscount ? (
              <CheckSquare className="w-4 h-4 text-amber-500" />
            ) : (
              <Square
                className={`w-4 h-4 ${
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                }`}
              />
            )}
            <span className="font-medium">Со скидкой от поставщика</span>
          </button>
        </div>

        {/* View mode switcher (Table / Gallery / Summary) */}
        <div
          className={`flex items-center p-0.5 rounded-lg border ${
            isDarkMode
              ? 'bg-[#161f30] border-[#23314c]'
              : 'bg-slate-100 border-slate-300'
          }`}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-amber-500 text-black shadow-xs font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Таблица</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-amber-500 text-black shadow-xs font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Галерея</span>
          </button>

          <button
            type="button"
            onClick={() => onViewModeChange('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'summary'
                ? 'bg-amber-500 text-black shadow-xs font-bold'
                : isDarkMode
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Сводка</span>
          </button>
        </div>
      </div>
    </div>
  );
};
