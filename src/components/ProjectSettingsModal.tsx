import React, { useState } from 'react';
import {
  FolderKanban,
  Layers,
  Plus,
  Settings,
  Trash2,
  X,
  Home,
} from 'lucide-react';
import { Project, Room } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  rooms: Room[];
  categories: string[];
  isDarkMode?: boolean;
  onSaveProject: (updatedProject: Project, updatedRooms: Room[], updatedCategories: string[]) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  rooms,
  categories,
  isDarkMode = true,
  onSaveProject,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'info' | 'rooms' | 'categories'>('info');

  // Project Info state
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client);
  const [address, setAddress] = useState(project.address);
  const [area, setArea] = useState(project.area);
  const [totalBudget, setTotalBudget] = useState(project.totalBudget);
  const [description, setDescription] = useState(project.description);

  // Rooms state
  const [roomsList, setRoomsList] = useState<Room[]>([...rooms]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomArea, setNewRoomArea] = useState<number | ''>('');

  // Categories state
  const [categoriesList, setCategoriesList] = useState<string[]>([...categories]);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Handle Add Room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      area: Number(newRoomArea) || 0,
    };
    setRoomsList((prev) => [...prev, newRoom]);
    setNewRoomName('');
    setNewRoomArea('');
  };

  const handleDeleteRoom = (roomId: string) => {
    if (roomsList.length <= 1) {
      alert('В проекте должно оставаться хотя бы одно помещение');
      return;
    }
    setRoomsList((prev) => prev.filter((r) => r.id !== roomId));
  };

  const handleUpdateRoom = (id: string, field: 'name' | 'area', val: string | number) => {
    setRoomsList((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Handle Add Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCategoryName.trim();
    if (!cat) return;
    if (categoriesList.includes(cat)) {
      alert('Такая категория уже есть в списке');
      return;
    }
    setCategoriesList((prev) => [...prev, cat]);
    setNewCategoryName('');
  };

  const handleDeleteCategory = (catName: string) => {
    if (categoriesList.length <= 1) {
      alert('В проекте должна оставаться хотя бы одна категория');
      return;
    }
    setCategoriesList((prev) => prev.filter((c) => c !== catName));
  };

  const handleUpdateCategory = (index: number, newName: string) => {
    setCategoriesList((prev) => {
      const next = [...prev];
      next[index] = newName;
      return next;
    });
  };

  // Save All
  const handleSaveAll = () => {
    const updatedProject: Project = {
      ...project,
      name: name.trim() || 'Дизайн-проект',
      client: client.trim() || 'Заказчик',
      address: address.trim(),
      area: Number(area) || 0,
      totalBudget: Number(totalBudget) || 0,
      description: description.trim(),
      rooms: roomsList,
      categories: categoriesList,
    };
    onSaveProject(updatedProject, roomsList, categoriesList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
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
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Настройки проекта</h3>
              <p
                className={`text-xs ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Параметры объекта, помещения и категории спецификации
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

        {/* Tab Navigation */}
        <div
          className={`flex border-b px-5 gap-4 text-xs font-semibold ${
            isDarkMode ? 'border-[#1c283d] bg-[#0d121c]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'border-amber-500 text-amber-500'
                : isDarkMode
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Параметры объекта</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rooms'
                ? 'border-amber-500 text-amber-500'
                : isDarkMode
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Помещения ({roomsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`py-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'categories'
                ? 'border-amber-500 text-amber-500'
                : isDarkMode
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Категории ({categoriesList.length})</span>
          </button>
        </div>

        {/* Tab Contents (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: Project Info */}
          {activeTab === 'info' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 opacity-90">
                  Название дизайн-проекта:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:border-amber-500 ${
                    isDarkMode
                      ? 'bg-[#161f30] border-[#23314c] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="ЖК «Символ», кв. 142 — Теплый минимализм"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">
                    Заказчик (ФИО / Имена):
                  </label>
                  <input
                    type="text"
                    required
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    placeholder="Алексей и Мария"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-90">
                    Адрес объекта:
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                    placeholder="г. Москва, ул. Невельского, д. 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 opacity-90">
                    Общая площадь (м²):
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={area}
                    onChange={(e) => setArea(Number(e.target.value) || 0)}
                    className={`w-full rounded-lg px-3 py-2 border font-bold focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-90">
                    Лимит бюджета (₽):
                  </label>
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Number(e.target.value) || 0)}
                    className={`w-full rounded-lg px-3 py-2 border font-bold focus:outline-none focus:border-amber-500 ${
                      isDarkMode
                        ? 'bg-[#161f30] border-[#23314c] text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 opacity-90">
                  Описание / Концепция комплектации:
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 resize-none ${
                    isDarkMode
                      ? 'bg-[#161f30] border-[#23314c] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                  placeholder="Спецификация отделочных материалов, мебели, освещения..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: Rooms List */}
          {activeTab === 'rooms' && (
            <div className="space-y-4 text-xs">
              {/* Add Room form */}
              <form
                onSubmit={handleAddRoom}
                className={`p-3 rounded-xl border flex flex-col sm:flex-row items-center gap-2 ${
                  isDarkMode ? 'bg-[#141c2b] border-[#223049]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="text"
                  required
                  placeholder="Название помещения (напр. Гостиная)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className={`flex-1 w-full rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                    isDarkMode
                      ? 'bg-[#0f1522] border-[#23314c] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Площадь м²"
                  value={newRoomArea}
                  onChange={(e) => setNewRoomArea(e.target.value ? Number(e.target.value) : '')}
                  className={`w-full sm:w-28 rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                    isDarkMode
                      ? 'bg-[#0f1522] border-[#23314c] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </form>

              {/* Rooms List */}
              <div className="space-y-2">
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Существующие помещения ({roomsList.length}):
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {roomsList.map((room, idx) => (
                    <div
                      key={room.id}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'bg-[#141c2b] border-[#202d44]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="w-6 text-center text-[11px] font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={room.name}
                        onChange={(e) => handleUpdateRoom(room.id, 'name', e.target.value)}
                        className={`flex-1 rounded-md px-2.5 py-1 border text-xs font-semibold focus:outline-none focus:border-amber-500 ${
                          isDarkMode
                            ? 'bg-[#0f1522] border-[#223049] text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          step="0.1"
                          value={room.area || ''}
                          onChange={(e) =>
                            handleUpdateRoom(room.id, 'area', Number(e.target.value) || 0)
                          }
                          className={`w-20 rounded-md px-2 py-1 border text-xs text-right focus:outline-none focus:border-amber-500 ${
                            isDarkMode
                              ? 'bg-[#0f1522] border-[#223049] text-white'
                              : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        />
                        <span className="text-[11px] text-slate-400 font-medium">м²</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1.5 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Удалить помещение"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Categories List */}
          {activeTab === 'categories' && (
            <div className="space-y-4 text-xs">
              {/* Add Category form */}
              <form
                onSubmit={handleAddCategory}
                className={`p-3 rounded-xl border flex items-center gap-2 ${
                  isDarkMode ? 'bg-[#141c2b] border-[#223049]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <input
                  type="text"
                  required
                  placeholder="Новая категория (напр. Умный дом, Акустика, Биокамины)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={`flex-1 rounded-lg px-3 py-2 border focus:outline-none focus:border-amber-500 ${
                    isDarkMode
                      ? 'bg-[#0f1522] border-[#23314c] text-white'
                      : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить</span>
                </button>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                <div
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Список категорий комплектации ({categoriesList.length}):
                </div>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {categoriesList.map((cat, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                        isDarkMode
                          ? 'bg-[#141c2b] border-[#202d44]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="w-6 text-center text-[11px] font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={cat}
                        onChange={(e) => handleUpdateCategory(idx, e.target.value)}
                        className={`flex-1 rounded-md px-2.5 py-1 border text-xs font-semibold focus:outline-none focus:border-amber-500 ${
                          isDarkMode
                            ? 'bg-[#0f1522] border-[#223049] text-white'
                            : 'bg-white border-slate-300 text-slate-900'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1.5 rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Удалить категорию"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-t ${
            isDarkMode ? 'border-[#1c283d] bg-[#0d121c]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div
            className={`text-[11px] ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Изменения применятся ко всем фильтрам и выпадающим спискам
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              Сохранить всё
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
