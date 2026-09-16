import React, { useState } from 'react';
import { Building2, Plus, Trash2, X } from 'lucide-react';
import { Room } from '../types';

interface RoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onAddRoom: (room: Room) => void;
  onDeleteRoom: (id: string) => void;
}

export const RoomsModal: React.FC<RoomsModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onAddRoom,
  onDeleteRoom,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [area, setArea] = useState<number | ''>('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddRoom({
      id: `room-${Date.now()}`,
      name: name.trim(),
      area: area === '' ? undefined : Number(area),
    });
    setName('');
    setArea('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1522] border border-[#23314c] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c283d]">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Помещения проекта</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Rooms List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-[#161f30] border border-[#23314c] text-xs"
            >
              <div>
                <span className="font-bold text-white">{r.name}</span>
                {r.area && (
                  <span className="text-slate-400 ml-2 font-mono">({r.area} м²)</span>
                )}
              </div>
              <button
                onClick={() => onDeleteRoom(r.id)}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                title="Удалить помещение"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new room form */}
        <form onSubmit={handleAdd} className="pt-3 border-t border-[#1c283d] space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] text-slate-400 mb-1">
                Название помещения
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="напр. Мастер-спальня"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Площадь (м²)
              </label>
              <input
                type="number"
                step="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="24.5"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить помещение</span>
          </button>
        </form>
      </div>
    </div>
  );
};
