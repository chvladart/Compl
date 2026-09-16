/**
 * Helper to convert an image URL or dataUrl into base64 with high quality
 */
export async function loadImageAsBase64(url: string, maxDim: number = 1200): Promise<{ base64: string; extension: 'jpeg' | 'png' } | null> {
  if (!url) return null;

  if (url.startsWith('data:image/png;base64,')) {
    return {
      base64: url.replace('data:image/png;base64,', ''),
      extension: 'png',
    };
  }
  if (url.startsWith('data:image/jpeg;base64,') || url.startsWith('data:image/jpg;base64,')) {
    return {
      base64: url.replace(/^data:image\/(jpeg|jpg);base64,/, ''),
      extension: 'jpeg',
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Keep high resolution, only scale down if excessively huge (>1600px)
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // Draw with high quality interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve({
          base64: dataUrl.replace(/^data:image\/jpeg;base64,/, ''),
          extension: 'jpeg',
        });
      } catch (err) {
        console.warn('Canvas conversion failed, perhaps CORS:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}
