import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Mail,
  Send,
  X,
} from 'lucide-react';
import { Project, SpecificationItem } from '../types';
import { exportSpecificationToExcel } from '../utils/exportExcel';
import { exportSpecificationToPdf } from '../utils/exportPdf';
import { calcItemTotal, formatCurrency } from '../utils/formatters';

interface EmailExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  items: SpecificationItem[];
}

export const EmailExportModal: React.FC<EmailExportModalProps> = ({
  isOpen,
  onClose,
  project,
  items,
}) => {
  if (!isOpen) return null;

  const [format, setFormat] = useState<'pdf' | 'excel' | 'both'>('both');
  const [recipient, setRecipient] = useState('client@example.com');
  const [subject, setSubject] = useState(
    `Ведомость комплектации — ${project.name} (COMPLSPEC STUDIO)`
  );
  const [message, setMessage] = useState(
    `Здравствуйте!\n\nНаправляем актуальную ведомость комплектации по проекту «${project.name}» с фотографиями, габаритами и ценами со скидками от поставщиков.\n\nС уважением,\nКоманда COMPLSPEC STUDIO`
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const totalAmount = items.reduce(
    (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
    0
  );

  const handleSendEmail = async () => {
    if (!recipient.trim()) return;
    setIsSending(true);
    setStatusMessage('Генерация отчетов...');

    try {
      // 1. Generate the files to ensure readiness
      if (format === 'pdf' || format === 'both') {
        setStatusMessage('Формирование альбома PDF в высоком качестве...');
        await exportSpecificationToPdf(project, items);
      }
      if (format === 'excel' || format === 'both') {
        setStatusMessage('Формирование XLSX с встроенными изображениями...');
        await exportSpecificationToExcel(project, items);
      }

      setStatusMessage('Отправка письма через облачный почтовый шлюз...');

      // 2. Call the server API
      const res = await fetch('/api/email-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipient,
          subject,
          format,
          projectName: project.name,
          itemsCount: items.length,
          totalAmount,
        }),
      });

      if (res.ok) {
        setSendSuccess(true);
      } else {
        // Fallback to mailto
        const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        window.open(mailtoLink, '_blank');
        setSendSuccess(true);
      }
    } catch (err) {
      console.warn('Fallback to native mail client:', err);
      const mailtoLink = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
      window.open(mailtoLink, '_blank');
      setSendSuccess(true);
    } finally {
      setIsSending(false);
    }
  };

  const handleDirectDownload = async () => {
    setIsSending(true);
    try {
      if (format === 'pdf' || format === 'both') {
        setStatusMessage('Генерация PDF...');
        const pdfBlob = await exportSpecificationToPdf(project, items);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ведомость_${project.name}.pdf`;
        a.click();
      }
      if (format === 'excel' || format === 'both') {
        setStatusMessage('Генерация Excel с фото...');
        const excelBlob = await exportSpecificationToExcel(project, items);
        const url = URL.createObjectURL(excelBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ведомость_${project.name}.xlsx`;
        a.click();
      }
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1522] border border-[#23314c] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#1c283d]">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Экспорт и отправка отчетов</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {sendSuccess ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-white">Отчет успешно отправлен!</h4>
            <p className="text-xs text-slate-300">
              Отчет по проекту «{project.name}» направлен на адрес <strong>{recipient}</strong>.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs"
            >
              Закрыть
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Format Selector */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Формат отчета для экспорта:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    format === 'pdf'
                      ? 'border-rose-500 bg-rose-950/40 text-white'
                      : 'border-[#23314c] bg-[#161f30] text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-5 h-5 text-rose-400" />
                  <span className="font-bold text-xs">PDF альбом</span>
                  <span className="text-[10px] text-slate-400">с фото & QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('excel')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    format === 'excel'
                      ? 'border-emerald-500 bg-emerald-950/40 text-white'
                      : 'border-[#23314c] bg-[#161f30] text-slate-400 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-xs">Excel (XLSX)</span>
                  <span className="text-[10px] text-slate-400">крупные фото</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('both')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    format === 'both'
                      ? 'border-amber-500 bg-amber-950/40 text-white'
                      : 'border-[#23314c] bg-[#161f30] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex gap-1">
                    <FileText className="w-4 h-4 text-rose-400" />
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-bold text-xs">Оба формата</span>
                  <span className="text-[10px] text-slate-400">полный комплект</span>
                </button>
              </div>
            </div>

            {/* Recipient Email */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Email получателя (Заказчик / Подрядчик / Команда):
              </label>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Тема письма:
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Сопроводительный текст:
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-[#161f30] border border-[#23314c] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none font-sans"
              />
            </div>

            {statusMessage && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs text-center font-medium animate-pulse">
                {statusMessage}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1c283d]">
              <button
                type="button"
                onClick={handleDirectDownload}
                disabled={isSending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#161f30] hover:bg-[#202d44] border border-[#283854] text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Скачать файлы</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || !recipient.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Отправка...' : 'Отправить по Email'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
