import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  FolderKanban,
  HardDrive,
  Moon,
  Plus,
  Settings,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { Project, UserProfile } from '../types';

interface HeaderProps {
  project: Project;
  user: UserProfile;
  syncStatus?: 'synced' | 'syncing' | 'offline';
  onOpenSettings: () => void;
  onOpenRooms?: () => void;
  onExportPdf: () => void;
  onExportExcel: () => void;
  onOpenEmailExport?: () => void;
  onOpenRoleModal: () => void;
  onOpenCloud: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  user,
  syncStatus = 'synced',
  onOpenSettings,
  onOpenRooms,
  onExportPdf,
  onExportExcel,
  onOpenRoleModal,
  onOpenCloud,
  isDarkMode,
  onToggleTheme,
}) => {
  return (
    <header
      className={`sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-6 py-2.5 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#0d121c]/95 border-[#1c2638] text-slate-100'
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
      }`}
    >
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Brand Logo & Project Select */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-black text-black text-sm shadow-md shadow-amber-500/20">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span
                  className={`font-extrabold tracking-wider text-sm ${
                    isDarkMode ? 'text-slate-100' : 'text-slate-900'
                  }`}
                >
                  COMPL<span className="text-amber-500">SPEC</span>
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-amber-500 uppercase">
                STUDIO
              </span>
            </div>
          </div>

          <div
            className={`h-5 w-[1px] hidden sm:block ${
              isDarkMode ? 'bg-slate-800' : 'bg-slate-200'
            }`}
          />

          {/* Project selector / settings trigger */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors max-w-[200px] sm:max-w-[320px] truncate cursor-pointer ${
                isDarkMode
                  ? 'bg-[#141c2b] border-[#223049] text-slate-200 hover:border-amber-500/50 hover:text-amber-400'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-600'
              }`}
              title="Настройки проекта, комнат и категорий"
            >
              <FolderKanban className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{project.name}</span>
            </button>

            <button
              onClick={onOpenSettings}
              className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                isDarkMode
                  ? 'bg-[#141c2b] border-[#223049] text-slate-400 hover:text-amber-400 hover:border-amber-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-400'
              }`}
              title="Настройки проекта"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Настройки</span>
            </button>
          </div>
        </div>

        {/* Right: Actions, Exports, Cloud, Auth, Theme */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Cloud Sync Status */}
          <button
            onClick={onOpenCloud}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-[#223049] text-slate-300 hover:border-emerald-500/50'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-emerald-500'
            }`}
            title="Облачная синхронизация между устройствами"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline">
              {syncStatus === 'syncing' ? 'Синхронизация...' : 'Облако активно'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
              }`}
            />
          </button>

          {/* Quick Settings Rooms & Categories */}
          <button
            onClick={onOpenSettings}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-[#223049] text-slate-300 hover:text-slate-100 hover:border-slate-700'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Управление комнатами и категориями"
          >
            <span className="text-amber-500 font-bold">▮</span>
            <span>Помещения ({project.rooms.length})</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition-all cursor-pointer"
            title="Экспорт в PDF с высоким качеством изображений и QR-кодами"
          >
            <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>PDF</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition-all cursor-pointer"
            title="Экспорт в Excel со встроенными крупными фото и формулами"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Excel</span>
          </button>

          {/* Role & Google Auth button */}
          <button
            onClick={onOpenRoleModal}
            className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-sky-800/40 text-sky-200 hover:bg-sky-950/40'
                : 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100'
            }`}
            title="Роли и доступ (Команда / Заказчик / Подрядчик)"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-5 h-5 rounded-full object-cover border border-sky-400"
            />
            <div className="text-left hidden sm:block">
              <span className="block text-[11px] font-bold leading-tight truncate max-w-[95px]">
                {user.role === 'team'
                  ? 'Команда'
                  : user.role === 'client'
                  ? 'Заказчик'
                  : 'Подрядчик'}
              </span>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
          </button>

          {/* Theme toggle (Dark / Light) */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#141c2b] border-[#223049] text-amber-400 hover:text-amber-300 hover:border-amber-500/50'
                : 'bg-slate-100 border-slate-300 text-amber-600 hover:bg-slate-200'
            }`}
            title={isDarkMode ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
