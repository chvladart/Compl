import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Project, SpecificationItem } from '../types';
import { calcDiscountedPrice, calcItemTotal, formatCurrency, STATUS_CONFIG } from './formatters';
import { generateQrDataUrl } from './qrCode';

/**
 * Generates an elegant, high-resolution PDF document for the project specification
 */
export async function exportSpecificationToPdf(
  project: Project,
  items: SpecificationItem[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  onProgress?.('Подготовка альбома комплектации...');

  // Pre-generate QR codes for all items
  const qrCodesMap = new Map<string, string>();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      const qrTarget = item.link || `${window.location.origin}/#${item.code}`;
      const qr = await generateQrDataUrl(qrTarget);
      qrCodesMap.set(item.id, qr);
    } catch {
      // ignore individual QR failure
    }
  }

  // Create an off-screen container styled for A4 Landscape print
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '1122px'; // A4 Landscape at 96 DPI
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "'Plus Jakarta Sans', Arial, sans-serif";
  container.style.padding = '0';
  container.style.boxSizing = 'border-box';

  const totalSpent = items.reduce(
    (acc, it) => acc + calcItemTotal(it.basePrice, it.supplierDiscount, it.quantity),
    0
  );
  const totalCount = items.length;
  const inWorkCount = items.filter((it) =>
    ['approved', 'invoice_issued', 'paid_in_production', 'shipping'].includes(it.status)
  ).length;

  const ITEMS_PER_PAGE = 4;
  const pagesCount = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;

  let pagesHtml = '';

  for (let p = 0; p < pagesCount; p++) {
    const pageItems = items.slice(p * ITEMS_PER_PAGE, (p + 1) * ITEMS_PER_PAGE);

    pagesHtml += `
      <div class="pdf-page" style="width: 1122px; min-height: 793px; height: 793px; padding: 32px 36px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; background: #ffffff; overflow: hidden;">
        <!-- Page Header -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
            <div style="flex: 1; min-width: 0; overflow: hidden;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="background: #f59e0b; color: #000; font-weight: 800; font-size: 11px; padding: 2px 7px; border-radius: 4px; letter-spacing: 0.5px; flex-shrink: 0;">COMPLSPEC</div>
                <span style="font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 1px;">STUDIO • ВЕДОМОСТЬ КОМПЛЕКТАЦИИ</span>
              </div>
              <h1 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 4px 0 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${project.name}</h1>
              <div style="font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                Клиент: <strong>${project.client}</strong> &bull; Адрес: ${project.address} &bull; Площадь: ${project.area} м²
              </div>
            </div>

            <div style="text-align: right; flex-shrink: 0; min-width: 230px;">
              <div style="font-size: 11px; color: #64748b; white-space: nowrap;">Бюджет проекта / Освоено</div>
              <div style="font-size: 17px; font-weight: 800; color: #0f172a; white-space: nowrap;">${formatCurrency(totalSpent)} <span style="font-size: 11px; font-weight: 500; color: #64748b;">из ${formatCurrency(project.totalBudget)}</span></div>
              <div style="font-size: 11px; color: #16a34a; font-weight: 600; white-space: nowrap;">Позиций: ${totalCount} (в закупке: ${inWorkCount})</div>
            </div>
          </div>

          <!-- Items Grid / Cards -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${pageItems
              .map((item) => {
                const qrUrl = qrCodesMap.get(item.id) || '';
                const totalPos = calcItemTotal(item.basePrice, item.supplierDiscount, item.quantity);
                const st = STATUS_CONFIG[item.status];

                return `
                <div style="display: flex; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #f8fafc; height: 130px;">
                  <!-- Large Photo -->
                  <div style="width: 165px; height: 130px; min-width: 165px; background: #e2e8f0; position: relative; overflow: hidden; border-right: 1px solid #cbd5e1;">
                    ${
                      item.mainPhoto
                        ? `<img src="${item.mainPhoto}" crossorigin="anonymous" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'" />`
                        : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #94a3b8; font-size: 11px;">Нет фото</div>`
                    }
                    <div style="position: absolute; top: 6px; left: 6px; background: rgba(15, 23, 42, 0.9); color: #ffffff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
                      ${item.code}
                    </div>
                  </div>

                  <!-- Details Middle -->
                  <div style="flex: 1; min-width: 0; padding: 8px 14px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                    <div style="overflow: hidden;">
                      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 2px;">
                        <span style="flex: 1; min-width: 0; font-size: 11px; font-weight: 700; color: #0284c7; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.roomName} &bull; ${item.category}</span>
                        <span style="flex-shrink: 0; background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; font-size: 10px; font-weight: 600; padding: 1px 8px; border-radius: 12px; white-space: nowrap;">
                          ${st ? st.label : item.status}
                        </span>
                      </div>
                      <div style="font-size: 13px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</div>
                      <div style="font-size: 11px; color: #475569; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${item.brand ? `<strong>Бренд:</strong> ${item.brand}` : ''} ${item.article ? `&bull; <strong>Арт:</strong> ${item.article}` : ''}
                      </div>
                    </div>

                    <div style="font-size: 11px; color: #334155; line-height: 1.35; margin-top: 2px; overflow: hidden; max-height: 48px;">
                      <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>Габариты:</strong> ${item.dimensions || '—'}</div>
                      <div style="color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><strong>Отделка:</strong> ${item.finish || '—'}</div>
                      ${item.techNotes ? `<div style="color: #64748b; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">ТЗ: ${item.techNotes}</div>` : ''}
                    </div>
                  </div>

                  <!-- Price and QR Column -->
                  <div style="width: 210px; min-width: 210px; padding: 8px 14px; background: #f1f5f9; border-left: 1px solid #cbd5e1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                      <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="font-size: 11px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Кол-во: <strong style="color: #0f172a;">${item.quantity} ${item.unit}</strong></div>
                        <div style="font-size: 11px; color: #64748b; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Базовая: ${formatCurrency(item.basePrice)}</div>
                        ${
                          item.supplierDiscount > 0
                            ? `<div style="font-size: 10px; color: #16a34a; font-weight: 600; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Скидка от поставщика: ${item.supplierDiscount}%</div>`
                            : ''
                        }
                      </div>
                      ${
                        qrUrl
                          ? `<img src="${qrUrl}" style="width: 54px; height: 54px; flex-shrink: 0; border: 1px solid #cbd5e1; border-radius: 4px; background: #fff;" title="QR код позиции" />`
                          : ''
                      }
                    </div>

                    <div style="border-top: 1px dashed #cbd5e1; padding-top: 5px; display: flex; justify-content: space-between; align-items: flex-end; gap: 6px;">
                      <span style="font-size: 11px; font-weight: 600; color: #475569; white-space: nowrap;">ИТОГО:</span>
                      <span style="font-size: 15px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${formatCurrency(totalPos)}</span>
                    </div>
                  </div>
                </div>
              `;
              })
              .join('')}
          </div>
        </div>

        <!-- Page Footer -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10px; color: #64748b;">
          <span>COMPLSPEC STUDIO &bull; Спецификация дизайн-проекта интерьера</span>
          <span>Страница ${p + 1} из ${pagesCount}</span>
          <span>Дата экспорта: ${new Date().toLocaleDateString('ru-RU')}</span>
        </div>
      </div>
    `;
  }

  container.innerHTML = pagesHtml;
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1122, 793],
    });

    const pageElements = container.querySelectorAll('.pdf-page');

    for (let i = 0; i < pageElements.length; i++) {
      onProgress?.(`Рендеринг страницы ${i + 1} из ${pageElements.length}...`);
      const pageEl = pageElements[i] as HTMLElement;

      try {
        const canvas = await html2canvas(pageEl, {
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (i > 0) {
          pdf.addPage([1122, 793], 'landscape');
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, 1122, 793, undefined, 'FAST');
      } catch (pageErr) {
        console.warn(`Error rendering page ${i + 1} to canvas:`, pageErr);
      }
    }

    onProgress?.('Сборка PDF файла...');
    const pdfBlob = pdf.output('blob');
    return pdfBlob;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
