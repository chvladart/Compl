import ExcelJS from 'exceljs';
import { Project, SpecificationItem } from '../types';
import { calcDiscountedPrice, calcItemTotal, STATUS_CONFIG } from './formatters';
import { loadImageAsBase64 } from './imageLoader';
import { generateQrDataUrl } from './qrCode';

export async function exportSpecificationToExcel(
  project: Project,
  items: SpecificationItem[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  onProgress?.('Инициализация таблицы Excel...');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'COMPLSPEC STUDIO';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Ведомость комплектации', {
    views: [{ state: 'frozen', ySplit: 5 }],
    pageSetup: {
      orientation: 'landscape',
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
    },
  });

  // Project Header Banner
  worksheet.mergeCells('A1:O1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `COMPLSPEC STUDIO — ВЕДОМОСТЬ КОМПЛЕКТАЦИИ: ${project.name}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(1).height = 36;

  worksheet.mergeCells('A2:O2');
  const subCell = worksheet.getCell('A2');
  subCell.value = `Клиент: ${project.client}  |  Адрес: ${project.address}  |  Площадь: ${project.area} м²  |  Дата: ${new Date().toLocaleDateString('ru-RU')}`;
  subCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FFCBD5E1' } };
  subCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' },
  };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(2).height = 24;

  // Empty row for spacing
  worksheet.getRow(3).height = 10;

  // Table Columns Header
  const headers = [
    { header: 'ФОТО ТОВАРА', key: 'photo', width: 24 },
    { header: 'QR-КОД', key: 'qr', width: 14 },
    { header: 'КОД', key: 'code', width: 12 },
    { header: 'ПОМЕЩЕНИЕ', key: 'room', width: 18 },
    { header: 'КАТЕГОРИЯ', key: 'category', width: 18 },
    { header: 'НАИМЕНОВАНИЕ И МОДЕЛЬ', key: 'name', width: 32 },
    { header: 'БРЕНД / АРТИКУЛ', key: 'brand', width: 22 },
    { header: 'ГАБАРИТЫ, ММ (Ш × Г × В)', key: 'dimensions', width: 24 },
    { header: 'ОТДЕЛКА / МАТЕРИАЛ / RAL', key: 'finish', width: 30 },
    { header: 'КОЛ-ВО', key: 'qty', width: 10 },
    { header: 'ЕД. ИЗМ.', key: 'unit', width: 10 },
    { header: 'БАЗОВАЯ ЦЕНА, ₸', key: 'basePrice', width: 16 },
    { header: 'СКИДКА ЗАКАЗЧИКУ, %', key: 'discount', width: 18 },
    { header: 'ЦЕНА СО СКИДКОЙ ПОСТАВЩИКА, ₸', key: 'priceWithDiscount', width: 22 },
    { header: 'ИТОГО СМЕТА, ₸', key: 'total', width: 18 },
    { header: 'СТАТУС', key: 'status', width: 20 },
    { header: 'ПОСТАВЩИК / КОНТАКТ', key: 'supplier', width: 24 },
    { header: 'ССЫЛКА', key: 'link', width: 24 },
    { header: 'ТЕХНИЧЕСКОЕ ЗАДАНИЕ / ПРИМЕЧАНИЯ', key: 'techNotes', width: 36 },
  ];

  const headerRowNumber = 4;
  const headerRow = worksheet.getRow(headerRowNumber);
  headerRow.values = headers.map((h) => h.header);
  headerRow.height = 32;

  // Set column widths
  headers.forEach((h, index) => {
    worksheet.getColumn(index + 1).width = h.width;
  });

  // Style header cells
  for (let col = 1; col <= headers.length; col++) {
    const cell = headerRow.getCell(col);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF334155' } },
      left: { style: 'thin', color: { argb: 'FF334155' } },
      bottom: { style: 'medium', color: { argb: 'FFF59E0B' } },
      right: { style: 'thin', color: { argb: 'FF334155' } },
    };
  }

  let currentRowIndex = 5;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    onProgress?.(`Обработка позиции ${i + 1} из ${items.length} (высокое разрешение фото)...`);

    const row = worksheet.getRow(currentRowIndex);
    // Requirement 6: large image row height for superior quality!
    row.height = 100;

    const unitPriceWithDiscount = calcDiscountedPrice(item.basePrice, item.supplierDiscount);
    const totalAmount = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
    const statusLabel = STATUS_CONFIG[item.status]?.label || item.status;

    row.values = [
      '', // Column 1: Image container
      '', // Column 2: QR Code container
      item.code,
      item.roomName,
      item.category + (item.subcategory ? ` (${item.subcategory})` : ''),
      item.name,
      `${item.brand || ''}${item.article ? `\nарт: ${item.article}` : ''}`,
      item.dimensions,
      item.finish,
      item.quantity,
      item.unit,
      item.basePrice,
      item.supplierDiscount ? `${item.supplierDiscount}%` : '0%',
      unitPriceWithDiscount,
      totalAmount,
      statusLabel,
      item.supplier,
      item.link ? { text: 'Перейти к товару', hyperlink: item.link } : '',
      item.techNotes,
    ];

    // Format cells in row
    for (let col = 1; col <= headers.length; col++) {
      const cell = row.getCell(col);
      cell.alignment = {
        vertical: 'middle',
        horizontal: [1, 2, 3, 10, 11, 13, 16].includes(col) ? 'center' : [12, 14, 15].includes(col) ? 'right' : 'left',
        wrapText: true,
      };
      cell.font = { name: 'Arial', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      // Currency formatting for financial columns
      if (col === 12 || col === 14 || col === 15) {
        cell.numFmt = '#,##0 "₽"';
        if (col === 15) {
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
        }
      }
    }

    // Embed Product Photo (Large, High Resolution, not compressed)
    if (item.mainPhoto) {
      try {
        const photoData = await loadImageAsBase64(item.mainPhoto, 1000);
        if (photoData) {
          const imageId = workbook.addImage({
            base64: photoData.base64,
            extension: photoData.extension,
          });

          worksheet.addImage(imageId, {
            tl: { col: 0.1, row: currentRowIndex - 1 + 0.08 },
            ext: { width: 145, height: 115 }, // Large crisp thumbnail
            editAs: 'oneCell',
          });
        }
      } catch (err) {
        console.warn('Failed to embed item photo in Excel:', err);
      }
    }

    // Embed QR Code for the item
    try {
      const qrTarget = item.link || `${window.location.origin}/#${item.code}`;
      const qrDataUrl = await generateQrDataUrl(qrTarget);
      if (qrDataUrl) {
        const qrImageId = workbook.addImage({
          base64: qrDataUrl.replace('data:image/png;base64,', ''),
          extension: 'png',
        });

        worksheet.addImage(qrImageId, {
          tl: { col: 1.15, row: currentRowIndex - 1 + 0.15 },
          ext: { width: 90, height: 90 },
          editAs: 'oneCell',
        });
      }
    } catch (err) {
      console.warn('Failed to embed QR code in Excel:', err);
    }

    currentRowIndex++;
  }

  // Summary Row at the bottom
  const summaryRow = worksheet.getRow(currentRowIndex);
  summaryRow.height = 30;
  worksheet.mergeCells(`A${currentRowIndex}:N${currentRowIndex}`);
  const summaryLabel = worksheet.getCell(`A${currentRowIndex}`);
  summaryLabel.value = 'ИТОГО ПО ВЕДОМОСТИ ПРОЕКТА:';
  summaryLabel.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  summaryLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  summaryLabel.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };

  const totalSumCell = worksheet.getCell(`O${currentRowIndex}`);
  const totalAmountSum = items.reduce(
    (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
    0
  );
  totalSumCell.value = totalAmountSum;
  totalSumCell.numFmt = '#,##0 "₽"';
  totalSumCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  totalSumCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF59E0B' }, // Amber accent
  };
  totalSumCell.alignment = { vertical: 'middle', horizontal: 'right' };

  onProgress?.('Формирование файла XLSX...');
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
