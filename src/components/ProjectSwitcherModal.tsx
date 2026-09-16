import React, { useState } from 'react';
import { Building2, Check, FolderKanban, Plus, Trash2, X } from 'lucide-react';
import { Project, Room } from '../types';
import { CATEGORIES } from '../utils/formatters';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  itemCounts: Record<string, number>;
  activeProjectId: string;
  isDarkMode?: boolean;
  onSwitchProject: (id: string) => void;
  onCreateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
}

export const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({
  isOpen,
  onClose,
  projects,
  itemCounts,
  activeProjectId,
  isDarkMode = true,
  onSwitchProject,
  onCreateProject,
  onDeleteProject,
}) => {
  if (!isOpen) return null;

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState<number | ''>('');
  const [totalBudget, setTotalBudget] = useState<number | ''>('');

  const resetForm = () => {
    setName('');
    setClient('');
    setAddress('');
    setArea('');
    setTotalBudget('');
    setIsCreating(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const defaultRoom: Room = { id: `room-${Date.now()}`, name: 'Общее помещение', area: 0 };

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      client: client.trim() || 'Новый заказчик',
      address: address.trim(),
      area: Number(area) || 0,
      totalBudget: Number(totalBudget) || 0,
      description: '',
      rooms: [defaultRoom],
      categories: [...CATEGORIES],
    };

    onCreateProject(newProject);
    resetForm();
    onClose();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteProject(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors ${
          isDarkMode
            ? 'bg-[#0f1522] border-[#23314c] text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isDarkMode ? 'border-[#1c283d]' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Мои проекты</h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Переключайтесь между объектами или создайте новый
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDarkMode
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!isCreating ? (
            <>
              <div className="space-y-2">
                {projects.map((p) => {
                  const active = p.id === activeProjectId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSwitchProject(p.id);
                        onClose();
                      }}
                      className={`group flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        active
                          ? 'border-amber-500 bg-amber-500/10'
                          : isDarkMode
                          ? 'bg-[#141c2b] border-[#223049] hover:border-amber-500/50'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          active
                            ? 'bg-amber-500 text-black'
                            : isDarkMode
                            ? 'bg-[#1c2638] text-amber-400'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        <FolderKanban className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate">{p.name}</div>
                        <div
                          className={`text-[11px] truncate ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {p.client} &bull; {itemCounts[p.id] ?? 0} позиций
                        </div>
                      </div>
                      {active && <Check className="w-4 h-4 text-amber-500 shrink-0" />}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, p.id)}
                        disabled={projects.length <= 1}
                        className={`p-1.5 rounded-md shrink-0 transition-colors cursor-pointer ${
                          projects.length <= 1
                            ? 'text-slate-600 cursor-not-allowed opacity-0'
                            : 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100'
                        }`}
                        title="Удалить проект"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed font-bold text-xs transition-colors cursor-pointer border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
              >
                <Plus className="w-4 h-4" />
                <span>Создать новый проект</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-90">Название проекта:</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:border-amber-500 ${
                    isDarkMode
                      ? 'bg-[#161f30] border-[#23314c] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="ЖК «Аврора», кв. 87"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Заказчик:</label>
                  <input
                    type="text"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    placeholder="Имя заказчика"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-90">Адрес:</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    placeholder="Адрес объекта"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">Площадь (м²):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(e.target.value ? Number(e.target.value) : '')}
                    className={`w-full rounded-lg px-3 py-2 border font-bold focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-90">Лимит бюджета (₸):</label>
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(e.target.value ? Number(e.target.value) : '')}
                    className={`w-full rounded-lg px-3 py-2 border font-bold focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 py-2.5 rounded-lg border font-bold transition-colors cursor-pointer ${
                    isDarkMode
                      ? 'border-[#223049] text-slate-300 hover:bg-[#141c2b]'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold transition-colors cursor-pointer"
                >
                  Создать проект
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
