import jsPDF from 'jspdf';
import { Project, SpecificationItem } from '../types';
import { calcItemTotal, formatCurrency, STATUS_CONFIG } from './formatters';
import { generateQrDataUrl } from './qrCode';

/**
 * PDF export rendered entirely with jsPDF's native vector drawing API
 * (rectangles, lines and text placed at explicit coordinates).
 *
 * This deliberately avoids html2canvas: rasterizing a live HTML layout is
 * fragile (custom web fonts, flexbox and text-overflow rules aren't always
 * measured the same way html2canvas measures them, which is what caused
 * lines of text to render stacked on top of each other). Drawing every
 * line at an explicit, pre-computed y-coordinate makes overlap impossible
 * by construction: nothing is measured by a second rendering engine, and
 * every line is truncated with an ellipsis instead of wrapping, so no
 * text box can ever grow taller than the slot reserved for it.
 */

const PAGE_W = 1122; // A4 landscape @ 96dpi
const PAGE_H = 793;
const MARGIN_X = 36;
const ITEMS_PER_PAGE = 3;
const CARD_GAP = 10;
const PHOTO_W = 176;
const PRICE_W = 224;

type RGB = [number, number, number];

const COLORS = {
  ink: [15, 23, 42] as RGB,
  slate600: [71, 85, 105] as RGB,
  slate500: [100, 116, 139] as RGB,
  slate400: [148, 163, 184] as RGB,
  slate300: [203, 213, 225] as RGB,
  slate100: [241, 245, 249] as RGB,
  slate50: [248, 250, 252] as RGB,
  photoBg: [226, 232, 240] as RGB,
  amber: [245, 158, 11] as RGB,
  sky700: [3, 105, 161] as RGB,
  sky600: [2, 132, 199] as RGB,
  sky100: [224, 242, 254] as RGB,
  sky200: [186, 230, 253] as RGB,
  green600: [22, 163, 74] as RGB,
  white: [255, 255, 255] as RGB,
};

let cachedFonts: { regular: string; bold: string } | null = null;

async function arrayBufferToBase64(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/** Loads the bundled Roboto fonts (Cyrillic support) as base64, once per session. */
async function loadPdfFonts(): Promise<{ regular: string; bold: string } | null> {
  if (cachedFonts) return cachedFonts;
  try {
    const [regularBuf, boldBuf] = await Promise.all([
      fetch('/fonts/Roboto-Regular.ttf').then((r) => r.arrayBuffer()),
      fetch('/fonts/Roboto-Bold.ttf').then((r) => r.arrayBuffer()),
    ]);
    const [regular, bold] = await Promise.all([
      arrayBufferToBase64(regularBuf),
      arrayBufferToBase64(boldBuf),
    ]);
    cachedFonts = { regular, bold };
    return cachedFonts;
  } catch {
    return null;
  }
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

/** Crops/scales an image to fully cover a target box (like CSS object-fit: cover). */
async function loadImageCover(src: string, boxW: number, boxH: number): Promise<string | null> {
  try {
    const img = await loadImageEl(src);
    const canvas = document.createElement('canvas');
    canvas.width = boxW;
    canvas.height = boxH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const scale = Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight);
    const sw = boxW / scale;
    const sh = boxH / scale;
    const sx = (img.naturalWidth - sw) / 2;
    const sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, boxW, boxH);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

/** Finds the longest prefix of `text` that fits `maxWidth`, appending an ellipsis if trimmed. */
function ellipsize(pdf: jsPDF, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (pdf.getTextWidth(text) <= maxWidth) return text;
  const ellipsis = '\u2026';
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = text.slice(0, mid).trimEnd() + ellipsis;
    if (pdf.getTextWidth(candidate) <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  if (lo <= 0) return ellipsis;
  return text.slice(0, lo).trimEnd() + ellipsis;
}

interface TextOptions {
  size: number;
  bold?: boolean;
  color?: RGB;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
}

function makeTextDrawer(pdf: jsPDF, fontFamily: string) {
  return function drawText(text: string, x: number, y: number, opts: TextOptions) {
    const { size, bold = false, color = COLORS.ink, align = 'left', maxWidth } = opts;
    pdf.setFont(fontFamily, bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color[0], color[1], color[2]);
    let finalText = String(text ?? '');
    if (typeof maxWidth === 'number') {
      finalText = ellipsize(pdf, finalText, maxWidth);
    }
    pdf.text(finalText, x, y, { align });
  };
}

function measureWidth(pdf: jsPDF, fontFamily: string, text: string, size: number, bold: boolean): number {
  pdf.setFont(fontFamily, bold ? 'bold' : 'normal');
  pdf.setFontSize(size);
  return pdf.getTextWidth(text);
}

interface Totals {
  totalSpent: number;
  totalCount: number;
  inWorkCount: number;
}

function drawHeader(pdf: jsPDF, fontFamily: string, project: Project, totals: Totals): number {
  const drawText = makeTextDrawer(pdf, fontFamily);
  const x0 = MARGIN_X;
  const rightX = PAGE_W - MARGIN_X;
  const contentW = rightX - x0;
  let y = 46;

  const badgeW = 88;
  const badgeH = 18;
  pdf.setFillColor(...COLORS.amber);
  pdf.roundedRect(x0, y - 13, badgeW, badgeH, 3, 3, 'F');
  drawText('COMPLSPEC', x0 + badgeW / 2, y - 1, { size: 10, bold: true, color: COLORS.ink, align: 'center' });
  drawText('STUDIO \u2022 ВЕДОМОСТЬ КОМПЛЕКТАЦИИ', x0 + badgeW + 10, y - 1, {
    size: 11,
    bold: true,
    color: COLORS.slate600,
    maxWidth: contentW - badgeW - 230,
  });

  drawText('Бюджет проекта / Освоено', rightX, y - 10, { size: 10, color: COLORS.slate500, align: 'right' });
  drawText(`${formatCurrency(totals.totalSpent)} из ${formatCurrency(project.totalBudget)}`, rightX, y + 6, {
    size: 15,
    bold: true,
    color: COLORS.ink,
    align: 'right',
  });
  drawText(`Позиций: ${totals.totalCount} (в закупке: ${totals.inWorkCount})`, rightX, y + 20, {
    size: 10,
    bold: true,
    color: COLORS.green600,
    align: 'right',
  });

  y += 30;
  pdf.setDrawColor(...COLORS.ink);
  pdf.setLineWidth(1.6);
  pdf.line(x0, y, rightX, y);

  y += 22;
  drawText(project.name, x0, y, { size: 18, bold: true, color: COLORS.ink, maxWidth: contentW });

  y += 17;
  const infoLine = `Клиент: ${project.client}   \u2022   Адрес: ${project.address}   \u2022   Площадь: ${project.area} м\u00b2`;
  drawText(infoLine, x0, y, { size: 11, color: COLORS.slate500, maxWidth: contentW });

  y += 13;
  pdf.setDrawColor(...COLORS.slate300);
  pdf.setLineWidth(1);
  pdf.line(x0, y, rightX, y);

  return y + 14;
}

function drawFooter(pdf: jsPDF, fontFamily: string, pageIndex: number, pagesCount: number) {
  const drawText = makeTextDrawer(pdf, fontFamily);
  const y = PAGE_H - 18;
  pdf.setDrawColor(...COLORS.slate300);
  pdf.setLineWidth(1);
  pdf.line(MARGIN_X, y - 10, PAGE_W - MARGIN_X, y - 10);
  drawText('COMPLSPEC STUDIO \u2022 Спецификация дизайн-проекта интерьера', MARGIN_X, y, {
    size: 9,
    color: COLORS.slate500,
  });
  drawText(`Страница ${pageIndex + 1} из ${pagesCount}`, PAGE_W / 2, y, {
    size: 9,
    color: COLORS.slate500,
    align: 'center',
  });
  drawText(`Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}`, PAGE_W - MARGIN_X, y, {
    size: 9,
    color: COLORS.slate500,
    align: 'right',
  });
}

function drawItemCard(
  pdf: jsPDF,
  fontFamily: string,
  item: SpecificationItem,
  photoDataUrl: string | null,
  qrDataUrl: string | null,
  cardTop: number,
  cardH: number
) {
  const drawText = makeTextDrawer(pdf, fontFamily);
  const x0 = MARGIN_X;
  const cardW = PAGE_W - 2 * MARGIN_X;
  const midX = x0 + PHOTO_W;
  const priceX = x0 + cardW - PRICE_W;
  const midW = priceX - midX;

  // Card background fill (drawn first so the border and content sit cleanly on top)
  pdf.setFillColor(...COLORS.slate50);
  pdf.roundedRect(x0, cardTop, cardW, cardH, 5, 5, 'F');
  pdf.setFillColor(...COLORS.slate100);
  pdf.rect(priceX, cardTop, PRICE_W, cardH, 'F');

  // Photo
  if (photoDataUrl) {
    pdf.addImage(photoDataUrl, 'JPEG', x0, cardTop, PHOTO_W, cardH, undefined, 'FAST');
  } else {
    pdf.setFillColor(...COLORS.photoBg);
    pdf.rect(x0, cardTop, PHOTO_W, cardH, 'F');
    drawText('Нет фото', x0 + PHOTO_W / 2, cardTop + cardH / 2, {
      size: 10,
      color: COLORS.slate400,
      align: 'center',
    });
  }

  // Card border + column dividers (drawn after fills/photo so they stay crisp)
  pdf.setDrawColor(...COLORS.slate300);
  pdf.setLineWidth(1);
  pdf.roundedRect(x0, cardTop, cardW, cardH, 5, 5, 'D');
  pdf.line(midX, cardTop, midX, cardTop + cardH);
  pdf.line(priceX, cardTop, priceX, cardTop + cardH);

  // Code badge over the photo
  pdf.setFont(fontFamily, 'bold');
  pdf.setFontSize(10);
  const codeW = pdf.getTextWidth(item.code) + 14;
  pdf.setFillColor(...COLORS.ink);
  pdf.roundedRect(x0 + 8, cardTop + 8, codeW, 17, 3, 3, 'F');
  drawText(item.code, x0 + 8 + codeW / 2, cardTop + 19, {
    size: 10,
    bold: true,
    color: COLORS.white,
    align: 'center',
  });

  // --- Middle column: description ---
  const midPadX = midX + 16;
  const midContentW = midW - 32;
  let my = cardTop + 24;

  const st = STATUS_CONFIG[item.status];
  const pillLabel = st ? st.label : item.status;
  const pillTextW = measureWidth(pdf, fontFamily, pillLabel, 9.5, true);
  const pillW = pillTextW + 18;
  const pillH = 16;
  const pillX = midPadX + midContentW - pillW;

  drawText(`${item.roomName} \u2022 ${item.category}`.toUpperCase(), midPadX, my, {
    size: 10,
    bold: true,
    color: COLORS.sky600,
    maxWidth: midContentW - pillW - 10,
  });
  pdf.setFillColor(...COLORS.sky100);
  pdf.setDrawColor(...COLORS.sky200);
  pdf.setLineWidth(0.75);
  pdf.roundedRect(pillX, my - 11.5, pillW, pillH, 7, 7, 'FD');
  drawText(pillLabel, pillX + pillW / 2, my - 1, {
    size: 9.5,
    bold: true,
    color: COLORS.sky700,
    align: 'center',
  });

  my += 20;
  drawText(item.name, midPadX, my, { size: 13.5, bold: true, color: COLORS.ink, maxWidth: midContentW });

  my += 17;
  const brandParts = [
    item.brand ? `Бренд: ${item.brand}` : '',
    item.article ? `Арт: ${item.article}` : '',
  ].filter(Boolean);
  if (brandParts.length > 0) {
    drawText(brandParts.join('   \u2022   '), midPadX, my, {
      size: 10.5,
      color: COLORS.slate600,
      maxWidth: midContentW,
    });
    my += 15;
  }

  drawText(`Габариты: ${item.dimensions || '\u2014'}`, midPadX, my, {
    size: 10,
    color: [51, 65, 85],
    maxWidth: midContentW,
  });
  my += 14;

  drawText(`Отделка: ${item.finish || '\u2014'}`, midPadX, my, {
    size: 10,
    color: COLORS.slate600,
    maxWidth: midContentW,
  });
  my += 14;

  if (item.techNotes) {
    const bottomLimit = cardTop + cardH - 10;
    if (my <= bottomLimit) {
      drawText(`ТЗ: ${item.techNotes}`, midPadX, my, {
        size: 9.5,
        color: COLORS.slate500,
        maxWidth: midContentW,
      });
    }
  }

  // --- Right column: quantity, price, QR, total ---
  const priceContentX = priceX + 14;
  const priceContentW = PRICE_W - 28;
  const qrSize = Math.min(56, cardH - 24);
  const qrX = priceX + PRICE_W - 14 - qrSize;
  const qrY = cardTop + 12;

  if (qrDataUrl) {
    pdf.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  const textBlockW = qrX - priceContentX - 8;
  let py = qrY + 9;
  drawText(`Кол-во: ${item.quantity} ${item.unit}`, priceContentX, py, {
    size: 10.5,
    color: COLORS.slate600,
    maxWidth: textBlockW,
  });
  py += 14;
  drawText(`Базовая: ${formatCurrency(item.basePrice)}`, priceContentX, py, {
    size: 10,
    color: COLORS.slate500,
    maxWidth: textBlockW,
  });
  if (item.supplierDiscount > 0) {
    py += 14;
    drawText(`Скидка: ${item.supplierDiscount}%`, priceContentX, py, {
      size: 9.5,
      bold: true,
      color: COLORS.green600,
      maxWidth: textBlockW,
    });
  }

  const dashY = cardTop + cardH - 32;
  pdf.setDrawColor(...COLORS.slate300);
  pdf.setLineWidth(0.75);
  pdf.setLineDashPattern([2, 2], 0);
  pdf.line(priceContentX, dashY, priceX + PRICE_W - 14, dashY);
  pdf.setLineDashPattern([], 0);

  const totalPos = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
  const totalY = cardTop + cardH - 14;
  const labelW = measureWidth(pdf, fontFamily, 'ИТОГО:', 10.5, true);
  drawText('ИТОГО:', priceContentX, totalY, { size: 10.5, bold: true, color: COLORS.slate600 });
  drawText(formatCurrency(totalPos), priceX + PRICE_W - 14, totalY, {
    size: 14,
    bold: true,
    color: COLORS.ink,
    align: 'right',
    maxWidth: priceContentW - labelW - 8,
  });
}

/**
 * Generates a high-resolution PDF document for the project specification,
 * drawing every element directly with jsPDF (no HTML rasterization).
 */
export async function exportSpecificationToPdf(
  project: Project,
  items: SpecificationItem[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  onProgress?.('Подготовка альбома комплектации...');

  const fonts = await loadPdfFonts();

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [PAGE_W, PAGE_H],
    compress: true,
  });

  let fontFamily = 'helvetica';
  if (fonts) {
    pdf.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
    pdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    pdf.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
    pdf.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    fontFamily = 'Roboto';
  }
  pdf.setFont(fontFamily, 'normal');

  // Pre-generate QR codes and cover-cropped photos for all items
  onProgress?.('Подготовка фото и QR-кодов...');
  const qrCodesMap = new Map<string, string>();
  const photoMap = new Map<string, string>();
  const photoScale = 2; // render at 2x for crisp print resolution
  for (const item of items) {
    try {
      const qrTarget = item.link || `${window.location.origin}/#${item.code}`;
      qrCodesMap.set(item.id, await generateQrDataUrl(qrTarget));
    } catch {
      // ignore individual QR failure
    }
    if (item.mainPhoto) {
      const dataUrl = await loadImageCover(item.mainPhoto, PHOTO_W * photoScale, PAGE_H * photoScale);
      if (dataUrl) photoMap.set(item.id, dataUrl);
    }
  }

  const totals: Totals = {
    totalSpent: items.reduce(
      (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
      0
    ),
    totalCount: items.length,
    inWorkCount: items.filter((it) =>
      ['approved', 'invoice_issued', 'paid_in_production', 'shipping'].includes(it.status)
    ).length,
  };

  const pagesCount = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;

  for (let p = 0; p < pagesCount; p++) {
    onProgress?.(`Рендеринг страницы ${p + 1} из ${pagesCount}...`);
    if (p > 0) pdf.addPage([PAGE_W, PAGE_H], 'landscape');

    const itemsTop = drawHeader(pdf, fontFamily, project, totals);
    const footerTop = PAGE_H - 30;
    const availableH = footerTop - itemsTop;
    const cardH = (availableH - (ITEMS_PER_PAGE - 1) * CARD_GAP) / ITEMS_PER_PAGE;

    const pageItems = items.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);
    pageItems.forEach((item, idx) => {
      const cardTop = itemsTop + idx * (cardH + CARD_GAP);
      drawItemCard(
        pdf,
        fontFamily,
        item,
        photoMap.get(item.id) || null,
        qrCodesMap.get(item.id) || null,
        cardTop,
        cardH
      );
    });

    drawFooter(pdf, fontFamily, p, pagesCount);
  }

  onProgress?.('Сборка PDF файла...');
  return pdf.output('blob');
}
