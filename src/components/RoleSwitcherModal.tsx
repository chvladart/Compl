import React, { useState } from 'react';
import {
  Check,
  Copy,
  HardHat,
  Lock,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateRole: (role: UserRole) => void;
  onUpdateUser: (newUser: UserProfile) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateRole,
  onUpdateUser,
}) => {
  if (!isOpen) return null;

  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const handleCopyInviteLink = (role: UserRole) => {
    const inviteUrl = `${window.location.origin}/?role=${role}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedRole(role);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const handleSwitchGoogleAccount = () => {
    const customEmail = prompt('Введите email для Google авторизации:', user.email);
    if (customEmail && customEmail.trim()) {
      onUpdateUser({
        ...user,
        email: customEmail.trim(),
        name: customEmail.split('@')[0],
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1522] border border-[#23314c] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c283d]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-white text-base">
              Авторизация Google и права доступа
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Google Account Banner */}
        <div className="bg-[#141c2c] border border-[#23314c] p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-sky-400 shadow-md"
              />
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-[#141c2c] flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">{user.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Google Workspace
                </span>
              </div>
              <div className="text-xs text-slate-400">{user.email}</div>
              <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                {user.roleTitle}
              </div>
            </div>
          </div>

          <button
            onClick={handleSwitchGoogleAccount}
            className="text-xs text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
            title="Сменить аккаунт"
          >
            Сменить
          </button>
        </div>

        {/* Role Selection (Requirement 11) */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Выберите роль для текущей сессии:
          </label>

          {/* Role 1: Team */}
          <div
            onClick={() => onUpdateRole('team')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              user.role === 'team'
                ? 'border-amber-500 bg-amber-950/20 shadow-md shadow-amber-500/10'
                : 'border-[#23314c] bg-[#161f30] hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Команда проекта</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">
                    Полный доступ
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Редактирование ведомости, добавление и удаление позиций, цены со скидкой поставщика, контакты фабрик, управление помещениями.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <input
                type="radio"
                checked={user.role === 'team'}
                onChange={() => onUpdateRole('team')}
                className="mt-1 accent-amber-500"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyInviteLink('team');
                }}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                title="Скопировать ссылку доступа"
              >
                {copiedRole === 'team' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRole === 'team' ? 'Скопировано' : 'Ссылка'}</span>
              </button>
            </div>
          </div>

          {/* Role 2: Client */}
          <div
            onClick={() => onUpdateRole('client')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              user.role === 'client'
                ? 'border-sky-500 bg-sky-950/20 shadow-md shadow-sky-500/10'
                : 'border-[#23314c] bg-[#161f30] hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Заказчик / Клиент</span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded font-semibold">
                    Согласование
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Просмотр спецификации, статус согласования, итоговая сметная стоимость с выгодой по скидкам поставщиков. Внутренние фабричные контакты скрыты.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <input
                type="radio"
                checked={user.role === 'client'}
                onChange={() => onUpdateRole('client')}
                className="mt-1 accent-sky-500"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyInviteLink('client');
                }}
                className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors"
                title="Скопировать ссылку для заказчика"
              >
                {copiedRole === 'client' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRole === 'client' ? 'Скопировано' : 'Ссылка'}</span>
              </button>
            </div>
          </div>

          {/* Role 3: Contractor */}
          <div
            onClick={() => onUpdateRole('contractor')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
              user.role === 'contractor'
                ? 'border-emerald-500 bg-emerald-950/20 shadow-md shadow-emerald-500/10'
                : 'border-[#23314c] bg-[#161f30] hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <HardHat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Подрядчик / Строители</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                    Монтаж & Чертежи
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Строительный режим! Доступ к чертежам, точным габаритам (Ш × Г × В), отделке и ТЗ. Финансовая стоимость полностью скрыта.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <input
                type="radio"
                checked={user.role === 'contractor'}
                onChange={() => onUpdateRole('contractor')}
                className="mt-1 accent-emerald-500"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyInviteLink('contractor');
                }}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                title="Скопировать ссылку для подрядчика"
              >
                {copiedRole === 'contractor' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedRole === 'contractor' ? 'Скопировано' : 'Ссылка'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-[#1c283d] flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            При переключении роли интерфейс адаптируется мгновенно
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 text-black font-extrabold text-xs hover:bg-amber-400 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
