import React, { useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Server,
  Smartphone,
  UploadCloud,
  X,
} from 'lucide-react';
import { Project, SpecificationItem } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  items: SpecificationItem[];
  lastSyncedTime: Date | null;
  onManualSync: () => Promise<void>;
  onImportProjectData: (data: { project: Project; items: SpecificationItem[] }) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  project,
  items,
  lastSyncedTime,
  onManualSync,
  onImportProjectData,
}) => {
  if (!isOpen) return null;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback('Синхронизация с облачным сервером...');
    try {
      await onManualSync();
      setSyncFeedback('Данные успешно синхронизированы со всеми устройствами!');
      setTimeout(() => setSyncFeedback(''), 3000);
    } catch (err) {
      setSyncFeedback('Ошибка синхронизации, проверьте подключение');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackupJson = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      project,
      items,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COMPLSPEC_Backup_${project.name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportBackupJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.project && Array.isArray(json.items)) {
          onImportProjectData({
            project: json.project,
            items: json.items,
          });
          setSyncFeedback('Резервная копия успешно восстановлена в облаке!');
          setTimeout(() => setSyncFeedback(''), 3500);
        } else {
          alert('Неверный формат резервной копии');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON файла');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1522] border border-[#23314c] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c283d]">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Облачная синхронизация</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Card */}
        <div className="bg-[#141c2c] border border-[#23314c] p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Статус сервера:</span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Подключено (Live Sync)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Последняя синхронизация:</span>
            <span className="text-xs font-medium text-slate-200">
              {lastSyncedTime ? lastSyncedTime.toLocaleTimeString('ru-RU') : 'Только что'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Позиций в облаке:</span>
            <span className="text-xs font-bold text-white">{items.length} позиций</span>
          </div>

          <div className="pt-2 border-t border-[#1e2a3f] flex items-center gap-2 text-[11px] text-slate-400">
            <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Все изменения автоматически синхронизируются на смартфонах, планшетах и ПК</span>
          </div>
        </div>

        {syncFeedback && (
          <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium text-center">
            {syncFeedback}
          </div>
        )}

        {/* Sync Now Action */}
        <button
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}</span>
        </button>

        {/* Backup & Restore JSON snapshot */}
        <div className="space-y-2 pt-2 border-t border-[#1c283d]">
          <span className="block text-xs font-semibold text-slate-400">
            Резервные копии и архивы:
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportBackupJson}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-[#161f30] hover:bg-[#202d44] border border-[#283854] text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-amber-400" />
              <span>Скачать JSON</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-[#161f30] hover:bg-[#202d44] border border-[#283854] text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowUpFromLine className="w-3.5 h-3.5 text-sky-400" />
              <span>Загрузить JSON</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportBackupJson}
                className="hidden"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
