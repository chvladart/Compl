import React, { useEffect, useState } from 'react';
import { Download, ExternalLink, Printer, QrCode, X } from 'lucide-react';
import { SpecificationItem } from '../types';
import { generateQrDataUrl } from '../utils/qrCode';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: SpecificationItem | null;
  projectName: string;
}

export const QrModal: React.FC<QrModalProps> = ({
  isOpen,
  onClose,
  item,
  projectName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (item) {
      const targetUrl = item.link || `${window.location.origin}/#${item.code}`;
      generateQrDataUrl(targetUrl).then((url) => setQrDataUrl(url));
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${item.code}_${item.name.slice(0, 20)}.png`;
    a.click();
  };

  const handlePrintSticker = () => {
    const printWindow = window.open('', '_blank', 'width=500,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Стикер комплектации ${item.code}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; color: #000; }
            .sticker { border: 2px dashed #000; border-radius: 12px; padding: 20px; max-width: 320px; margin: 0 auto; }
            .project { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
            .code { font-size: 28px; font-weight: 900; margin: 6px 0; }
            .name { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
            .meta { font-size: 11px; color: #444; margin-bottom: 12px; }
            img { width: 180px; height: 180px; }
            .footer { font-size: 10px; color: #888; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="sticker">
            <div class="project">${projectName}</div>
            <div class="code">${item.code}</div>
            <div class="name">${item.name}</div>
            <div class="meta">${item.roomName} &bull; ${item.category}</div>
            <img src="${qrDataUrl}" />
            <div class="footer">COMPLSPEC STUDIO &bull; Наклейка на упаковку</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#101725] border border-[#23314c] rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-[#1f2c42]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-sm">QR-код позиции</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sticker Card Preview */}
        <div className="bg-white rounded-xl p-4 text-center text-slate-900 space-y-2 shadow-inner">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
            {projectName}
          </div>
          <div className="text-2xl font-black font-mono tracking-tight text-slate-950">
            {item.code}
          </div>
          <div className="text-xs font-bold line-clamp-2 px-2 text-slate-800">
            {item.name}
          </div>
          <div className="text-[11px] text-slate-600">
            {item.roomName} &bull; {item.dimensions || 'Стандарт'}
          </div>

          <div className="py-2 flex justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR ${item.code}`}
                className="w-44 h-44 rounded-lg border border-slate-200 shadow-sm"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg text-xs text-slate-400">
                Генерация...
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
            Сканируйте для перехода к товару / ТЗ
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleDownloadQr}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#172030] hover:bg-[#202d44] text-xs font-bold text-slate-200 border border-[#273752] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Скачать PNG</span>
          </button>

          <button
            onClick={handlePrintSticker}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-bold text-black shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Печать стикера</span>
          </button>
        </div>

        {item.link && (
          <div className="pt-2 text-center">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-sky-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Открыть прямую ссылку на товар</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
