import QRCode from 'qrcode';

const qrCache = new Map<string, string>();

/**
 * Generates a high-resolution QR code Data URL (PNG) for a given item or link
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  if (!text) return '';
  if (qrCache.has(text)) {
    return qrCache.get(text)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 400,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    qrCache.set(text, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}
